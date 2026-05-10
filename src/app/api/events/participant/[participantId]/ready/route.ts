import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { participants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { pusherServer } from "@/lib/pusher/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const { participantId } = await params;

  try {
    const { isReady } = await req.json();

    const [updated] = await db
      .update(participants)
      .set({ isReady: !!isReady })
      .where(eq(participants.id, participantId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    // Notify other players via Pusher
    await pusherServer.trigger(
      `presence-event-${updated.eventId}`,
      "player-ready",
      {
        participantId: updated.id,
        ready: updated.isReady,
      }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
