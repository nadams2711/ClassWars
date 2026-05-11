import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  events,
  eventChallenges,
  challengeTemplates,
  participants,
  submissions,
  scoreEntries,
  leaderboardSnapshots,
  teams,
} from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { pusherServer } from "@/lib/pusher/server";
import { calculateScore, calculateLeaderboard, calculateTeamLeaderboard } from "@/lib/game/scoring";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;
    const body = await req.json();
    const { action } = body;

    // Verify host owns event
    const event = await db.query.events.findFirst({
      where: and(eq(events.id, eventId), eq(events.hostId, session.user.id)),
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    switch (action) {
      case "start_game":
        return await handleStartGame(eventId, event);
      case "pause_game":
        return await handlePauseGame(eventId);
      case "skip_challenge":
        return await handleSkipChallenge(eventId, event);
      case "reveal_scores":
        return await handleRevealScores(eventId, event);
      case "enter_judging":
        return await handleEnterJudging(eventId, event);
      case "pick_winners":
        return await handlePickWinners(eventId, event, body);
      case "submit_judge_scores":
        return await handleJudgeScores(eventId, event, body.scores);
      case "next_round":
        return await handleNextRound(eventId, event);
      case "show_vs":
        return await handleShowVS(eventId, event);
      case "end_game":
        return await handleEndGame(eventId, event);
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

type EventRow = typeof events.$inferSelect;

// ─── START GAME ──────────────────────────────────
async function handleStartGame(eventId: string, event: EventRow) {
  // Allow starting from lobby, or restarting from completed/active
  const isRestart = event.status === "completed" || event.status === "active";

  if (event.status !== "lobby" && !isRestart) {
    return NextResponse.json(
      { error: "Event cannot be started" },
      { status: 400 }
    );
  }

  // If restarting, reset all event challenges to pending
  if (isRestart) {
    await db
      .update(eventChallenges)
      .set({ status: "pending", startedAt: null, endedAt: null })
      .where(eq(eventChallenges.eventId, eventId));

    // Reset participant scores
    await db
      .update(participants)
      .set({ score: 0 })
      .where(eq(participants.eventId, eventId));
  }

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

  const template = await db.query.challengeTemplates.findFirst({
    where: eq(challengeTemplates.id, firstChallenge.challengeId),
  });

  const allChallenges = await db.query.eventChallenges.findMany({
    where: eq(eventChallenges.eventId, eventId),
  });

  await db
    .update(events)
    .set({
      status: "active",
      currentRound: 1,
      totalRounds: allChallenges.length,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId));

  await db
    .update(eventChallenges)
    .set({ status: "active", startedAt: new Date() })
    .where(eq(eventChallenges.id, firstChallenge.id));

  const durationSeconds = template?.durationSeconds || 60;
  // Add 3500ms for VS screen duration on top of countdown + challenge
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

  await pusherServer.trigger(`presence-event-${eventId}`, "game-state", {
    phase: eventParticipants.length >= 2 ? "VS_SCREEN" : "COUNTDOWN",
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
          scoringType: template.scoringType,
          interactiveData: template.interactiveData ?? null,
        }
      : null,
    timerEnd,
  });

  return NextResponse.json({ success: true, round: 1, timerEnd });
}

// ─── PAUSE GAME ──────────────────────────────────
async function handlePauseGame(eventId: string) {
  await pusherServer.trigger(`presence-event-${eventId}`, "game-state", {
    phase: "PAUSED",
  });
  return NextResponse.json({ success: true });
}

// ─── SKIP CHALLENGE ──────────────────────────────
async function handleSkipChallenge(eventId: string, event: EventRow) {
  // Close current challenge and advance
  return await handleNextRound(eventId, event);
}

// ─── REVEAL SCORES ───────────────────────────────
async function handleRevealScores(eventId: string, event: EventRow) {
  // Find the active event challenge
  const activeEC = await db.query.eventChallenges.findFirst({
    where: and(
      eq(eventChallenges.eventId, eventId),
      eq(eventChallenges.status, "active")
    ),
  });

  if (!activeEC) {
    return NextResponse.json(
      { error: "No active challenge" },
      { status: 400 }
    );
  }

  const template = await db.query.challengeTemplates.findFirst({
    where: eq(challengeTemplates.id, activeEC.challengeId),
  });

  const totalDurationMs = (template?.durationSeconds || 60) * 1000;

  // Get submissions and participants
  const roundSubmissions = await db.query.submissions.findMany({
    where: eq(submissions.eventChallengeId, activeEC.id),
    orderBy: [asc(submissions.submittedAt)],
  });

  const eventParticipants = await db.query.participants.findMany({
    where: eq(participants.eventId, eventId),
  });

  const submissionMap = new Map(
    roundSubmissions.map((s) => [s.participantId, s])
  );

  // Calculate scores
  let finishPosition = 1;
  for (const p of eventParticipants) {
    const sub = submissionMap.get(p.id);
    const completed = !!sub?.completedAt;

    const breakdown = calculateScore({
      completed,
      finishPosition: completed ? finishPosition++ : undefined,
      totalParticipants: eventParticipants.length,
      totalDuration: totalDurationMs,
      isTeamRound: event.teamMode || false,
    });

    await db.insert(scoreEntries).values({
      eventChallengeId: activeEC.id,
      participantId: p.id,
      completionPoints: breakdown.completion,
      speedPoints: breakdown.speed,
      qualityPoints: breakdown.quality,
      crowdPoints: breakdown.crowd,
      teamworkPoints: breakdown.teamwork,
      totalPoints: breakdown.total,
    });

    await db
      .update(participants)
      .set({ score: (p.score ?? 0) + breakdown.total })
      .where(eq(participants.id, p.id));
  }

  // Build leaderboard
  const updatedParticipants = await db.query.participants.findMany({
    where: eq(participants.eventId, eventId),
    with: { team: true },
  });

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

  // Save snapshots
  for (const entry of leaderboard) {
    await db.insert(leaderboardSnapshots).values({
      eventId,
      participantId: entry.participantId,
      roundNumber: event.currentRound || 1,
      rank: entry.rank,
      totalScore: entry.score,
    });
  }

  // Mark challenge completed
  await db
    .update(eventChallenges)
    .set({ status: "completed", endedAt: new Date() })
    .where(eq(eventChallenges.id, activeEC.id));

  // Broadcast
  await pusherServer.trigger(
    `presence-event-${eventId}`,
    "scores-updated",
    { scores: scoresMap, leaderboard, teamLeaderboard }
  );

  await pusherServer.trigger(`presence-event-${eventId}`, "game-state", {
    phase: "SCORE_REVEAL",
    round: event.currentRound || 1,
    totalRounds: event.totalRounds || 0,
  });

  return NextResponse.json({ success: true, leaderboard, teamLeaderboard });
}

// ─── ENTER JUDGING ───────────────────────────────
async function handleEnterJudging(eventId: string, event: EventRow) {
  await pusherServer.trigger(`presence-event-${eventId}`, "game-state", {
    phase: "JUDGING",
    round: event.currentRound || 1,
    totalRounds: event.totalRounds || 0,
  });

  return NextResponse.json({ success: true });
}

// ─── PICK WINNERS ────────────────────────────────
async function handlePickWinners(
  eventId: string,
  event: EventRow,
  body: { first: string; second: string; third: string }
) {
  const { first, second, third } = body;
  if (!first || !second || !third) {
    return NextResponse.json(
      { error: "Must pick 1st, 2nd, and 3rd place" },
      { status: 400 }
    );
  }

  // Find the active event challenge
  const activeEC = await db.query.eventChallenges.findFirst({
    where: and(
      eq(eventChallenges.eventId, eventId),
      eq(eventChallenges.status, "active")
    ),
  });

  if (!activeEC) {
    return NextResponse.json(
      { error: "No active challenge" },
      { status: 400 }
    );
  }

  const eventParticipants = await db.query.participants.findMany({
    where: eq(participants.eventId, eventId),
  });

  // Point values: 1st=20, 2nd=12, 3rd=8, others=3
  const placePoints: Record<string, number> = {
    [first]: 20,
    [second]: 12,
    [third]: 8,
  };

  for (const p of eventParticipants) {
    const isWinner = placePoints[p.id] !== undefined;
    const bonus = placePoints[p.id] || 0;
    const participation = isWinner ? 0 : 3;
    const total = bonus + participation;

    await db.insert(scoreEntries).values({
      eventChallengeId: activeEC.id,
      participantId: p.id,
      completionPoints: participation,
      speedPoints: 0,
      qualityPoints: bonus,
      crowdPoints: 0,
      teamworkPoints: 0,
      totalPoints: total,
    });

    await db
      .update(participants)
      .set({ score: (p.score ?? 0) + total })
      .where(eq(participants.id, p.id));
  }

  // Build leaderboard
  const updatedParticipants = await db.query.participants.findMany({
    where: eq(participants.eventId, eventId),
    with: { team: true },
  });

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

  // Save snapshots
  for (const entry of leaderboard) {
    await db.insert(leaderboardSnapshots).values({
      eventId,
      participantId: entry.participantId,
      roundNumber: event.currentRound || 1,
      rank: entry.rank,
      totalScore: entry.score,
    });
  }

  // Mark challenge completed
  await db
    .update(eventChallenges)
    .set({ status: "completed", endedAt: new Date() })
    .where(eq(eventChallenges.id, activeEC.id));

  // Broadcast scores
  await pusherServer.trigger(
    `presence-event-${eventId}`,
    "scores-updated",
    { scores: scoresMap, leaderboard, teamLeaderboard }
  );

  // Transition to SCORE_REVEAL
  await pusherServer.trigger(`presence-event-${eventId}`, "game-state", {
    phase: "SCORE_REVEAL",
    round: event.currentRound || 1,
    totalRounds: event.totalRounds || 0,
  });

  return NextResponse.json({ success: true, leaderboard, teamLeaderboard });
}

// ─── JUDGE SCORES ────────────────────────────────
async function handleJudgeScores(
  eventId: string,
  event: EventRow,
  scores: Record<string, number>
) {
  if (!scores) {
    return NextResponse.json({ error: "No scores provided" }, { status: 400 });
  }

  // Store judge scores and then reveal
  return await handleRevealScores(eventId, event);
}

// ─── NEXT ROUND ──────────────────────────────────
async function handleNextRound(eventId: string, event: EventRow) {
  const nextRound = (event.currentRound ?? 0) + 1;

  const allChallenges = await db.query.eventChallenges.findMany({
    where: eq(eventChallenges.eventId, eventId),
    orderBy: [asc(eventChallenges.orderIndex)],
  });

  if (nextRound > allChallenges.length) {
    return await handleEndGame(eventId, event);
  }

  const nextEC = allChallenges[nextRound - 1];

  const template = await db.query.challengeTemplates.findFirst({
    where: eq(challengeTemplates.id, nextEC.challengeId),
  });

  await db
    .update(events)
    .set({ currentRound: nextRound, updatedAt: new Date() })
    .where(eq(events.id, eventId));

  await db
    .update(eventChallenges)
    .set({ status: "active", startedAt: new Date() })
    .where(eq(eventChallenges.id, nextEC.id));

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
          scoringType: template.scoringType,
          interactiveData: template.interactiveData ?? null,
        }
      : null,
    timerEnd,
  });

  return NextResponse.json({ success: true, round: nextRound, timerEnd });
}

// ─── SHOW VS ─────────────────────────────────────
async function handleShowVS(eventId: string, event: EventRow) {
  // Pick two random participants for a VS matchup
  const eventParticipants = await db.query.participants.findMany({
    where: eq(participants.eventId, eventId),
  });

  if (eventParticipants.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 players" },
      { status: 400 }
    );
  }

  // Shuffle and pick two
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
  });

  await pusherServer.trigger(`presence-event-${eventId}`, "game-state", {
    phase: "VS_SCREEN",
    round: event.currentRound || 1,
    totalRounds: event.totalRounds || 0,
  });

  return NextResponse.json({ success: true });
}

// ─── END GAME ────────────────────────────────────
async function handleEndGame(eventId: string, event: EventRow) {
  await db
    .update(events)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(events.id, eventId));

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
        avatarIndex: p.avatarIndex ?? 0,
        score: p.score ?? 0,
        rank: i + 1,
        teamName: p.team?.name || null,
      };
    });

  const teamLeaderboard = event.teamMode
    ? calculateTeamLeaderboard(scoresMap, participantTeams)
    : [];

  await pusherServer.trigger(`presence-event-${eventId}`, "game-state", {
    phase: "FINAL_RESULTS",
    round: event.currentRound || 1,
    totalRounds: event.totalRounds || 0,
  });

  await pusherServer.trigger(`presence-event-${eventId}`, "game-ended", {
    finalResults,
    teamLeaderboard,
  });

  return NextResponse.json({ success: true, finalResults, teamLeaderboard });
}
