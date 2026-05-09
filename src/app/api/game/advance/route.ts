import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  events,
  eventChallenges,
  challengeTemplates,
  participants,
} from "@/db/schema";
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

    if (event.status !== "active") {
      return NextResponse.json(
        { error: "Event is not active" },
        { status: 400 }
      );
    }

    const nextRound = (event.currentRound ?? 0) + 1;

    // Get all challenges in order
    const allChallenges = await db.query.eventChallenges.findMany({
      where: eq(eventChallenges.eventId, eventId),
      orderBy: [asc(eventChallenges.orderIndex)],
    });

    // Check if the game is over
    if (nextRound > allChallenges.length) {
      // Mark event as completed
      await db
        .update(events)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(events.id, eventId));

      // Build final results sorted by score
      const finalParticipants = await db.query.participants.findMany({
        where: eq(participants.eventId, eventId),
      });

      const finalResults = finalParticipants
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .map((p, i) => ({
          participantId: p.id,
          nickname: p.nickname,
          avatarIndex: p.avatarIndex,
          score: p.score,
          rank: i + 1,
          previousRank: null,
          teamName: null,
        }));

      // Broadcast final results phase
      await pusherServer.trigger(`presence-event-${eventId}`, "game-state", {
        phase: "FINAL_RESULTS",
        round: event.currentRound,
        totalRounds: allChallenges.length,
      });

      await pusherServer.trigger(`presence-event-${eventId}`, "game-ended", {
        finalResults,
      });

      return NextResponse.json({ gameOver: true, finalResults });
    }

    // Advance to next challenge
    const nextEC = allChallenges[nextRound - 1];

    // Get the challenge template for details
    const template = await db.query.challengeTemplates.findFirst({
      where: eq(challengeTemplates.id, nextEC.challengeId),
    });

    // Update event round counter
    await db
      .update(events)
      .set({
        currentRound: nextRound,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId));

    // Activate next challenge
    await db
      .update(eventChallenges)
      .set({
        status: "active",
        startedAt: new Date(),
      })
      .where(eq(eventChallenges.id, nextEC.id));

    // Timer: challenge duration + 4 seconds for countdown overlay
    const durationSeconds = template?.durationSeconds || 60;
    const timerEnd = new Date(
      Date.now() + durationSeconds * 1000 + 4000
    ).toISOString();

    // Broadcast COUNTDOWN phase for next round
    await pusherServer.trigger(`presence-event-${eventId}`, "game-state", {
      phase: "COUNTDOWN",
      round: nextRound,
      totalRounds: allChallenges.length,
      challengeId: nextEC.id,
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

    return NextResponse.json({
      round: nextRound,
      challengeId: nextEC.id,
      timerEnd,
    });
  } catch (error) {
    console.error("Advance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
