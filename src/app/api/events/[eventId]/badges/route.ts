import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { participantBadges, badges } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const { searchParams } = new URL(req.url);
  const participantId = searchParams.get("participantId");

  if (!participantId) {
    return NextResponse.json(
      { error: "participantId is required" },
      { status: 400 }
    );
  }

  const earned = await db.query.participantBadges.findMany({
    where: and(
      eq(participantBadges.eventId, eventId),
      eq(participantBadges.participantId, participantId)
    ),
    with: {
      badge: true,
    },
  });

  return NextResponse.json({
    badges: earned.map((pb) => ({
      id: pb.badge.id,
      name: pb.badge.name,
      description: pb.badge.description,
      icon: pb.badge.icon,
    })),
  });
}
