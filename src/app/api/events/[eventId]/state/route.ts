import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  events,
  eventChallenges,
  challengeTemplates,
  participants,
  teams,
  submissions,
} from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Get participants
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

  // Determine phase from DB state
  let phase = "LOBBY";
  let currentChallenge = null;
  let timerEnd: string | null = null;
  let currentChallengeId: string | null = null;

  if (event.status === "completed") {
    phase = "FINAL_RESULTS";
  } else if (event.status === "active") {
    // Find the active challenge
    const activeEC = await db.query.eventChallenges.findFirst({
      where: and(
        eq(eventChallenges.eventId, eventId),
        eq(eventChallenges.status, "active")
      ),
    });

    if (activeEC) {
      currentChallengeId = activeEC.id;

      const template = await db.query.challengeTemplates.findFirst({
        where: eq(challengeTemplates.id, activeEC.challengeId),
      });

      if (template) {
        currentChallenge = {
          title: template.title,
          shortDescription: template.shortDescription,
          fullInstructions: template.fullInstructions,
          durationSeconds: template.durationSeconds,
          submissionType: template.submissionType,
          scoringType: template.scoringType,
          interactiveData: template.interactiveData ?? null,
        };
      }

      // Calculate timer from challenge start time
      if (activeEC.startedAt && template?.durationSeconds) {
        const endTime =
          activeEC.startedAt.getTime() +
          template.durationSeconds * 1000 +
          4000; // +4s for countdown
        if (endTime > Date.now()) {
          timerEnd = new Date(endTime).toISOString();
          phase = "CHALLENGE_ACTIVE";
        } else {
          phase = "SUBMISSIONS_CLOSED";
        }
      } else {
        phase = "CHALLENGE_ACTIVE";
      }
    } else {
      // Active event but no active challenge - could be between rounds
      phase = "SCORE_REVEAL";
    }
  }

  // Get all challenges for total count
  const allChallenges = await db.query.eventChallenges.findMany({
    where: eq(eventChallenges.eventId, eventId),
  });

  // Get teams if team mode
  const eventTeams = event.teamMode
    ? await db.query.teams.findMany({
        where: eq(teams.eventId, eventId),
      })
    : [];

  // Build turn state if applicable
  let turnState = null;
  if (currentChallenge && currentChallengeId && phase === "CHALLENGE_ACTIVE") {
    const isTurnBased = currentChallenge.submissionType !== "completion_tap";

    if (isTurnBased) {
      // Query existing submissions for this challenge
      const challengeSubmissions = await db.query.submissions.findMany({
        where: eq(submissions.eventChallengeId, currentChallengeId),
      });
      const submittedIds = new Set(challengeSubmissions.map((s) => s.participantId));

      // Build turn order from participants who haven't submitted
      const allIds = eventParticipants.map((p) => p.id);
      const remaining = allIds.filter((id) => !submittedIds.has(id));

      if (remaining.length > 0) {
        const currentPlayer = eventParticipants.find((p) => p.id === remaining[0]);
        // Calculate per-turn timer from template duration
        const perTurnDuration = currentChallenge.durationSeconds || 60;
        const turnTimerEnd = new Date(Date.now() + perTurnDuration * 1000).toISOString();

        turnState = {
          turnBased: true,
          currentTurnPlayerId: remaining[0],
          currentTurnNickname: currentPlayer?.nickname || "Player",
          turnIndex: submittedIds.size,
          turnOrder: allIds,
          turnTimerEnd,
        };
      } else {
        // All submitted
        turnState = {
          turnBased: true,
          currentTurnPlayerId: null,
          currentTurnNickname: null,
          turnIndex: allIds.length,
          turnOrder: allIds,
          turnTimerEnd: null,
        };
      }
    }
  }

  return NextResponse.json({
    phase,
    currentRound: event.currentRound ?? 0,
    totalRounds: event.totalRounds ?? allChallenges.length,
    currentChallengeId,
    currentChallenge,
    timerEnd,
    participants: eventParticipants,
    status: event.status,
    teamMode: event.teamMode || false,
    teams: eventTeams,
    turnState,
  });
}
