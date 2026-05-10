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
import { calculateTeamLeaderboard } from "@/lib/game/scoring";

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
        with: { team: true },
      });

      const scoresMap: Record<string, number> = {};
      const participantTeams: Record<string, { teamId: string; name: string; color: string }> = {};

      const finalResults = finalParticipants
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .map((p, i) => {
          scoresMap[p.id] = p.score ?? 0;
          if (p.team) {
            participantTeams[p.id] = { teamId: p.team.id, name: p.team.name, color: p.team.color || "#888" };
          }
          return {
            participantId: p.id,
            nickname: p.nickname,
            avatarIndex: p.avatarIndex,
            score: p.score,
            rank: i + 1,
            previousRank: null,
            teamName: p.team?.name || null,
          };
        });

      const teamLeaderboard = event.teamMode
        ? calculateTeamLeaderboard(scoresMap, participantTeams)
        : [];

      // Broadcast final results phase
      await pusherServer.trigger(`presence-event-${eventId}`, "game-state", {
        phase: "FINAL_RESULTS",
        round: event.currentRound,
        totalRounds: allChallenges.length,
      });

      await pusherServer.trigger(`presence-event-${eventId}`, "game-ended", {
        finalResults,
        teamLeaderboard,
      });

      return NextResponse.json({ gameOver: true, finalResults, teamLeaderboard });
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

    // Timer: challenge duration + 4s countdown + 3.5s VS screen
    const durationSeconds = template?.durationSeconds || 60;
    const vsDelay = 3500;
    const timerEnd = new Date(
      Date.now() + durationSeconds * 1000 + 4000 + vsDelay
    ).toISOString();

    // Auto-fire VS screen before countdown
    const eventParticipants = await db.query.participants.findMany({
      where: eq(participants.eventId, eventId),
    });

    if (eventParticipants.length >= 2) {
      const shuffled = eventParticipants.sort(() => Math.random() - 0.5);
      const p1 = shuffled[0];
      const p2 = shuffled[1];

      await pusherServer.trigger(`presence-event-${eventId}`, "vs-screen", {
        player1: {
          id: p1.id,
          nickname: p1.nickname,
          avatarIndex: p1.avatarIndex ?? 0,
          score: p1.score ?? 0,
        },
        player2: {
          id: p2.id,
          nickname: p2.nickname,
          avatarIndex: p2.avatarIndex ?? 0,
          score: p2.score ?? 0,
        },
        challengeTitle: template?.title || "Challenge",
      });
    }

    // Broadcast VS_SCREEN or COUNTDOWN phase for next round
    await pusherServer.trigger(`presence-event-${eventId}`, "game-state", {
      phase: eventParticipants.length >= 2 ? "VS_SCREEN" : "COUNTDOWN",
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
