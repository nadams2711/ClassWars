import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { participants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const { participantId } = await params;

  try {
    const { avatarIndex } = await req.json();

    if (avatarIndex == null || avatarIndex < 0 || avatarIndex > 23) {
      return NextResponse.json(
        { error: "Invalid avatar index" },
        { status: 400 }
      );
    }

    await db
      .update(participants)
      .set({ avatarIndex })
      .where(eq(participants.id, participantId));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
