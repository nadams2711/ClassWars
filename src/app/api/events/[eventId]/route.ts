import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { events, teams } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  // Try authenticated host first
  const session = await auth();

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // If the caller is the host, return full data
  if (session?.user?.id && session.user.id === event.hostId) {
    const eventTeams = await db.query.teams.findMany({
      where: eq(teams.eventId, eventId),
    });

    return NextResponse.json({
      ...event,
      teams: eventTeams,
    });
  }

  // For participants (unauthenticated guests), return public event info
  return NextResponse.json({
    id: event.id,
    name: event.name,
    joinCode: event.joinCode,
    status: event.status,
    mode: event.mode,
    audience: event.audience,
    teamMode: event.teamMode,
    maxParticipants: event.maxParticipants,
    currentRound: event.currentRound,
    totalRounds: event.totalRounds,
    teams: event.teamMode
      ? await db.query.teams.findMany({
          where: eq(teams.eventId, eventId),
        })
      : [],
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

  // Verify ownership
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.hostId, session.user.id)),
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Cascade delete handles all related rows (participants, teams, submissions, etc.)
  await db.delete(events).where(eq(events.id, eventId));

  return NextResponse.json({ success: true });
}
