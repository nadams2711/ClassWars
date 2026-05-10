import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { participants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  const eventParticipants = await db.query.participants.findMany({
    where: eq(participants.eventId, eventId),
    columns: {
      id: true,
      nickname: true,
      avatarIndex: true,
      teamId: true,
      isReady: true,
      isConnected: true,
      score: true,
    },
  });

  return NextResponse.json(eventParticipants);
}
