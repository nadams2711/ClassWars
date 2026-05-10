import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  scoreEntries,
  participants,
  submissions,
  eventChallenges,
  events,
  leaderboardSnapshots,
  challengeTemplates,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { pusherServer } from "@/lib/pusher/server";
import { calculateScore, calculateLeaderboard, calculateTeamLeaderboard } from "@/lib/game/scoring";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, eventChallengeId, judgeScores } = await req.json();

    if (!eventId || !eventChallengeId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify host owns event
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event || event.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "Event not found or not authorized" },
        { status: 404 }
      );
    }

    // Get the event challenge and its template for duration info
    const eventChallenge = await db.query.eventChallenges.findFirst({
      where: eq(eventChallenges.id, eventChallengeId),
    });

    if (!eventChallenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    const template = await db.query.challengeTemplates.findFirst({
      where: eq(challengeTemplates.id, eventChallenge.challengeId),
    });

    const totalDurationMs = (template?.durationSeconds || 60) * 1000;

    // Get all submissions for this challenge, ordered by submission time
    const roundSubmissions = await db.query.submissions.findMany({
      where: eq(submissions.eventChallengeId, eventChallengeId),
      orderBy: [asc(submissions.submittedAt)],
    });

    // Get all participants in this event
    const eventParticipants = await db.query.participants.findMany({
      where: eq(participants.eventId, eventId),
    });

    // Build a lookup of submissions by participantId
    const submissionMap = new Map(
      roundSubmissions.map((s) => [s.participantId, s])
    );

    // Calculate scores for each participant
    const scoreResults: Array<{
      participantId: string;
      breakdown: ReturnType<typeof calculateScore>;
    }> = [];

    let finishPosition = 1;
    for (const p of eventParticipants) {
      const sub = submissionMap.get(p.id);
      const completed = !!sub?.completedAt;

      const breakdown = calculateScore({
        completed,
        finishPosition: completed ? finishPosition++ : undefined,
        totalParticipants: eventParticipants.length,
        totalDuration: totalDurationMs,
        judgeScore: judgeScores?.[p.id],
        isTeamRound: event.teamMode || false,
      });

      scoreResults.push({ participantId: p.id, breakdown });

      // Persist score entry
      await db.insert(scoreEntries).values({
        eventChallengeId,
        participantId: p.id,
        completionPoints: breakdown.completion,
        speedPoints: breakdown.speed,
        qualityPoints: breakdown.quality,
        crowdPoints: breakdown.crowd,
        teamworkPoints: breakdown.teamwork,
        totalPoints: breakdown.total,
      });

      // Update participant cumulative score
      await db
        .update(participants)
        .set({
          score: (p.score ?? 0) + breakdown.total,
        })
        .where(eq(participants.id, p.id));
    }

    // Fetch updated participants for leaderboard calculation
    const updatedParticipants = await db.query.participants.findMany({
      where: eq(participants.eventId, eventId),
      with: { team: true },
    });

    // Build maps for the leaderboard utility
    const scoresMap: Record<string, number> = {};
    const participantMap: Record<
      string,
      { nickname: string; avatarIndex: number; teamName: string | null }
    > = {};
    const participantTeams: Record<string, { teamId: string; name: string; color: string }> = {};

    for (const p of updatedParticipants) {
      scoresMap[p.id] = p.score ?? 0;
      participantMap[p.id] = {
        nickname: p.nickname,
        avatarIndex: p.avatarIndex ?? 0,
        teamName: p.team?.name || null,
      };
      if (p.team) {
        participantTeams[p.id] = { teamId: p.team.id, name: p.team.name, color: p.team.color || "#888" };
      }
    }

    const leaderboard = calculateLeaderboard(scoresMap, null, participantMap);

    // Calculate team leaderboard if team mode
    const teamLeaderboard = event.teamMode
      ? calculateTeamLeaderboard(scoresMap, participantTeams)
      : [];

    // Persist leaderboard snapshots for this round
    for (const entry of leaderboard) {
      await db.insert(leaderboardSnapshots).values({
        eventId,
        participantId: entry.participantId,
        roundNumber: event.currentRound || 1,
        rank: entry.rank,
        totalScore: entry.score,
      });
    }

    // Mark challenge as completed
    await db
      .update(eventChallenges)
      .set({
        status: "completed",
        endedAt: new Date(),
      })
      .where(eq(eventChallenges.id, eventChallengeId));

    // Broadcast scores via Pusher
    await pusherServer.trigger(
      `presence-event-${eventId}`,
      "scores-updated",
      {
        scores: scoresMap,
        leaderboard,
        teamLeaderboard,
        roundScores: Object.fromEntries(
          scoreResults.map((r) => [r.participantId, r.breakdown])
        ),
      }
    );

    // Update game phase to SCORE_REVEAL
    await pusherServer.trigger(`presence-event-${eventId}`, "game-state", {
      phase: "SCORE_REVEAL",
      round: event.currentRound || 1,
      totalRounds: event.totalRounds || 0,
    });

    return NextResponse.json({ leaderboard, teamLeaderboard, roundScores: scoreResults });
  } catch (error) {
    console.error("Score error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
