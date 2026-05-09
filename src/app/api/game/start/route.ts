import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, eventChallenges, challengeTemplates } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { pusherServer } from "@/lib/pusher/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    // Verify host owns event
    const event = await db.query.events.findFirst({
      where: and(eq(events.id, eventId), eq(events.hostId, session.user.id)),
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status !== "lobby") {
      return NextResponse.json(
        { error: "Event not in lobby" },
        { status: 400 }
      );
    }

    // Get first challenge ordered by orderIndex
    const firstChallenge = await db.query.eventChallenges.findFirst({
      where: eq(eventChallenges.eventId, eventId),
      orderBy: [asc(eventChallenges.orderIndex)],
    });

    if (!firstChallenge) {
      return NextResponse.json(
        { error: "No challenges configured" },
        { status: 400 }
      );
    }

    // Get challenge template details
    const template = await db.query.challengeTemplates.findFirst({
      where: eq(challengeTemplates.id, firstChallenge.challengeId),
    });

    // Get total rounds (all event challenges)
    const allChallenges = await db.query.eventChallenges.findMany({
      where: eq(eventChallenges.eventId, eventId),
    });

    // Update event status to active
    await db
      .update(events)
      .set({
        status: "active",
        currentRound: 1,
        totalRounds: allChallenges.length,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId));

    // Activate first challenge
    await db
      .update(eventChallenges)
      .set({
        status: "active",
        startedAt: new Date(),
      })
      .where(eq(eventChallenges.id, firstChallenge.id));

    // Timer: challenge duration + 4 seconds for the 3-2-1-GO countdown overlay
    const durationSeconds = template?.durationSeconds || 60;
    const timerEnd = new Date(
      Date.now() + durationSeconds * 1000 + 4000
    ).toISOString();

    // Trigger COUNTDOWN phase via Pusher
    await pusherServer.trigger(`presence-event-${eventId}`, "game-state", {
      phase: "COUNTDOWN",
      round: 1,
      totalRounds: allChallenges.length,
      challengeId: firstChallenge.id,
      challenge: template
        ? {
            title: template.title,
            shortDescription: template.shortDescription,
            fullInstructions: template.fullInstructions,
            durationSeconds: template.durationSeconds,
            submissionType: template.submissionType,
          }
        : null,
      timerEnd,
    });

    // Note: The client handles the COUNTDOWN -> CHALLENGE_ACTIVE transition
    // based on the CountdownTimer onComplete callback. In a production system
    // this would be driven by a server-side queue or scheduled job.

    return NextResponse.json({
      success: true,
      round: 1,
      totalRounds: allChallenges.length,
      challengeId: firstChallenge.id,
      timerEnd,
    });
  } catch (error) {
    console.error("Start game error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
