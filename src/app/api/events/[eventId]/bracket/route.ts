import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bracketMatches } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  const matches = await db.query.bracketMatches.findMany({
    where: eq(bracketMatches.eventId, eventId),
    columns: {
      id: true,
      roundNumber: true,
      matchIndex: true,
      participant1Id: true,
      participant2Id: true,
      winnerId: true,
      status: true,
    },
  });

  return NextResponse.json({ matches });
}
