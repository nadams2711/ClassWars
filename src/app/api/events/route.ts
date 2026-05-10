import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { events, eventChallenges, packChallenges, challengePacks, teams } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateJoinCode } from "@/lib/utils";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hostEvents = await db.query.events.findMany({
    where: eq(events.hostId, session.user.id),
    orderBy: [desc(events.createdAt)],
  });

  return NextResponse.json(hostEvents);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    mode,
    audience,
    teamMode,
    teamCount,
    maxParticipants,
    packId,
    challengeIds,
    settings,
  } = body;

  // Generate unique join code
  let joinCode = generateJoinCode();

  // Attempt to ensure uniqueness by checking existing codes
  // In high-traffic production, use a DB unique constraint + retry loop
  const existing = await db.query.events.findFirst({
    where: eq(events.joinCode, joinCode),
  });
  if (existing) {
    joinCode = generateJoinCode();
  }

  // Determine total rounds upfront
  let totalRounds = 0;
  let packChalls: { challengeId: string; orderIndex: number | null }[] = [];

  if (packId && UUID_RE.test(packId)) {
    packChalls = await db.query.packChallenges.findMany({
      where: eq(packChallenges.packId, packId),
      orderBy: [packChallenges.orderIndex],
    });
    totalRounds = packChalls.length;
  } else if (packId) {
    // Non-UUID packId (legacy placeholder) — skip pack challenges
    totalRounds = 0;
  }

  if (!packId && challengeIds?.length) {
    totalRounds = challengeIds.length;
  }

  const [event] = await db
    .insert(events)
    .values({
      hostId: session.user.id,
      name: name || "Dead Time Game",
      joinCode,
      status: "lobby",
      mode: mode || "quick_play",
      audience: audience || "universal",
      teamMode: teamMode || false,
      maxParticipants: maxParticipants || 50,
      totalRounds,
      settings: settings || {},
    })
    .returning();

  // Create teams if team mode is enabled
  if (teamMode) {
    const TEAM_PRESETS = [
      { name: "Red", color: "#FF4757" },
      { name: "Blue", color: "#3742FA" },
      { name: "Green", color: "#2ED573" },
      { name: "Gold", color: "#FFC312" },
    ];
    const count = Math.min(Math.max(teamCount || 2, 2), 4);
    await db.insert(teams).values(
      TEAM_PRESETS.slice(0, count).map((t) => ({
        eventId: event.id,
        name: t.name,
        color: t.color,
      }))
    );
  }

  // Add challenges to event
  if (packId && packChalls.length > 0) {
    await db.insert(eventChallenges).values(
      packChalls.map((pc, idx) => ({
        eventId: event.id,
        challengeId: pc.challengeId,
        orderIndex: pc.orderIndex ?? idx,
      }))
    );
  } else if (challengeIds?.length) {
    await db.insert(eventChallenges).values(
      challengeIds.map((cId: string, idx: number) => ({
        eventId: event.id,
        challengeId: cId,
        orderIndex: idx,
      }))
    );
  }

  return NextResponse.json(event);
}
