export type GamePhase =
  | "LOBBY"
  | "COUNTDOWN"
  | "CHALLENGE_ACTIVE"
  | "SUBMISSIONS_CLOSED"
  | "JUDGING"
  | "SCORE_REVEAL"
  | "VS_SCREEN"
  | "FINAL_RESULTS"
  | "PODIUM";

export type EventStatus = "draft" | "lobby" | "active" | "paused" | "completed";
export type EventMode = "quick_play" | "pack_play" | "tournament";
export type Audience = "classroom" | "office" | "universal";
export type SubmissionType = "completion_tap" | "text" | "vote" | "judge" | "photo" | "hybrid";
export type ScoringType = "completion" | "speed" | "judge" | "vote" | "hybrid";
export type MovementLevel = "seated" | "standing" | "light_movement";
export type NoiseLevel = "quiet" | "medium" | "loud";
export type IntensityTone =
  | "mild"
  | "bold"
  | "chaos"
  | "legend"
  | "social"
  | "balanced"
  | "professional";

export interface Participant {
  id: string;
  eventId: string;
  nickname: string;
  avatarIndex: number;
  teamId: string | null;
  isReady: boolean;
  isConnected: boolean;
  score: number;
}

export interface GameState {
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  currentChallengeId: string | null;
  timerEnd: string | null;
  participants: Participant[];
  scores: Record<string, number>;
  leaderboard: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  participantId: string;
  nickname: string;
  avatarIndex: number;
  score: number;
  rank: number;
  previousRank: number | null;
  teamName: string | null;
}

export interface VSMatchup {
  player1: Participant;
  player2: Participant;
  challengeTitle: string;
  roundNumber: number;
}

export interface ScoreBreakdown {
  completion: number;
  speed: number;
  quality: number;
  crowd: number;
  teamwork: number;
  total: number;
}
