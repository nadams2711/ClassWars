import type { ScoreBreakdown, TeamLeaderboardEntry } from "@/types/game";

interface ScoringInput {
  completed: boolean;
  submissionTime?: number; // ms from challenge start
  totalDuration: number; // ms total time allowed
  judgeScore?: number; // 0-10 from judge
  voteCount?: number; // crowd votes received
  totalVoters?: number;
  isTeamRound?: boolean;
  finishPosition?: number; // 1st, 2nd, 3rd etc
  totalParticipants?: number;
}

export function calculateScore(input: ScoringInput): ScoreBreakdown {
  let completion = 0;
  let speed = 0;
  let quality = 0;
  let crowd = 0;
  let teamwork = 0;

  // Completion points: 10 for completing
  if (input.completed) {
    completion = 10;
  }

  // Speed bonus: up to 8 points for first finish, scaled by position
  if (input.completed && input.finishPosition != null && input.totalParticipants) {
    const positionRatio = 1 - (input.finishPosition - 1) / Math.max(1, input.totalParticipants - 1);
    speed = Math.round(8 * positionRatio);
  }

  // Quality: judge score scaled to 0-10
  if (input.judgeScore != null) {
    quality = Math.round(input.judgeScore);
  }

  // Crowd favorite: based on vote percentage, up to 5 points
  if (input.voteCount != null && input.totalVoters && input.totalVoters > 0) {
    const voteRatio = input.voteCount / input.totalVoters;
    crowd = Math.round(5 * voteRatio);
  }

  // Teamwork bonus: 3 points for team rounds if completed
  if (input.isTeamRound && input.completed) {
    teamwork = 3;
  }

  const total = completion + speed + quality + crowd + teamwork;

  return { completion, speed, quality, crowd, teamwork, total };
}

export function calculateLeaderboard(
  scores: Record<string, number>,
  previousRanks: Record<string, number> | null,
  participantMap: Record<string, { nickname: string; avatarIndex: number; teamName: string | null }>
) {
  const entries = Object.entries(scores)
    .map(([participantId, score]) => ({
      participantId,
      score,
      nickname: participantMap[participantId]?.nickname || "Unknown",
      avatarIndex: participantMap[participantId]?.avatarIndex || 0,
      teamName: participantMap[participantId]?.teamName || null,
      rank: 0,
      previousRank: previousRanks?.[participantId] ?? null,
    }))
    .sort((a, b) => b.score - a.score);

  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries;
}

export function calculateTeamLeaderboard(
  individualScores: Record<string, number>,
  participantTeams: Record<string, { teamId: string; name: string; color: string }>
): TeamLeaderboardEntry[] {
  const teamAgg: Record<string, { name: string; color: string; score: number; memberCount: number }> = {};

  for (const [participantId, score] of Object.entries(individualScores)) {
    const team = participantTeams[participantId];
    if (!team) continue;

    if (!teamAgg[team.teamId]) {
      teamAgg[team.teamId] = { name: team.name, color: team.color, score: 0, memberCount: 0 };
    }
    teamAgg[team.teamId].score += score;
    teamAgg[team.teamId].memberCount += 1;
  }

  const entries: TeamLeaderboardEntry[] = Object.entries(teamAgg)
    .map(([teamId, data]) => ({
      teamId,
      name: data.name,
      color: data.color,
      score: data.score,
      rank: 0,
      memberCount: data.memberCount,
    }))
    .sort((a, b) => b.score - a.score);

  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries;
}
