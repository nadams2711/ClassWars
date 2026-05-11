import { create } from "zustand";
import type { GamePhase, Participant, LeaderboardEntry, VSMatchup, ScoreBreakdown, TeamLeaderboardEntry, TurnState } from "@/types/game";

interface GameStore {
  // State
  phase: GamePhase;
  eventId: string | null;
  currentRound: number;
  totalRounds: number;
  currentChallengeId: string | null;
  currentChallenge: {
    title: string;
    shortDescription: string;
    fullInstructions: string;
    durationSeconds: number;
    submissionType: string;
    scoringType?: string;
    interactiveData?: unknown;
  } | null;
  timerEnd: string | null;
  participants: Participant[];
  myParticipantId: string | null;
  scores: Record<string, number>;
  leaderboard: LeaderboardEntry[];
  teamLeaderboard: TeamLeaderboardEntry[];
  lastScoreBreakdown: ScoreBreakdown | null;
  vsMatchup: VSMatchup | null;
  hasSubmitted: boolean;
  isHost: boolean;

  // Turn-taking state
  turnBased: boolean;
  currentTurnPlayerId: string | null;
  currentTurnNickname: string | null;
  turnIndex: number;
  turnOrder: string[];
  turnTimerEnd: string | null;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setEventId: (eventId: string) => void;
  setCurrentRound: (round: number, total: number) => void;
  setCurrentChallenge: (challenge: GameStore["currentChallenge"], challengeId: string) => void;
  setTimerEnd: (timerEnd: string | null) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (id: string) => void;
  updateParticipant: (id: string, updates: Partial<Participant>) => void;
  setParticipants: (participants: Participant[]) => void;
  setMyParticipantId: (id: string) => void;
  setScores: (scores: Record<string, number>) => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  setTeamLeaderboard: (teamLeaderboard: TeamLeaderboardEntry[]) => void;
  setLastScoreBreakdown: (breakdown: ScoreBreakdown | null) => void;
  setVSMatchup: (matchup: VSMatchup | null) => void;
  setHasSubmitted: (submitted: boolean) => void;
  setIsHost: (isHost: boolean) => void;
  setTurnState: (partial: Partial<TurnState>) => void;

  // Game state sync (from Pusher events)
  handleGameStateEvent: (data: {
    phase: GamePhase;
    round: number;
    totalRounds: number;
    challengeId?: string;
    challenge?: GameStore["currentChallenge"];
    timerEnd?: string;
    turnBased?: boolean;
    currentTurnPlayerId?: string | null;
    currentTurnNickname?: string | null;
    turnIndex?: number;
    turnOrder?: string[];
    turnTimerEnd?: string | null;
  }) => void;
  handleScoresUpdate: (data: {
    scores: Record<string, number>;
    leaderboard: LeaderboardEntry[];
    teamLeaderboard?: TeamLeaderboardEntry[];
  }) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  phase: "LOBBY" as GamePhase,
  eventId: null,
  currentRound: 0,
  totalRounds: 0,
  currentChallengeId: null,
  currentChallenge: null,
  timerEnd: null,
  participants: [],
  myParticipantId: null,
  scores: {},
  leaderboard: [],
  teamLeaderboard: [],
  lastScoreBreakdown: null,
  vsMatchup: null,
  hasSubmitted: false,
  isHost: false,
  turnBased: false,
  currentTurnPlayerId: null,
  currentTurnNickname: null,
  turnIndex: 0,
  turnOrder: [],
  turnTimerEnd: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),
  setEventId: (eventId) => set({ eventId }),
  setCurrentRound: (round, total) => set({ currentRound: round, totalRounds: total }),
  setCurrentChallenge: (challenge, challengeId) => set({ currentChallenge: challenge, currentChallengeId: challengeId, hasSubmitted: false }),
  setTimerEnd: (timerEnd) => set({ timerEnd }),
  addParticipant: (participant) => set((state) => ({
    participants: [...state.participants.filter(p => p.id !== participant.id), participant]
  })),
  removeParticipant: (id) => set((state) => ({
    participants: state.participants.filter(p => p.id !== id)
  })),
  updateParticipant: (id, updates) => set((state) => ({
    participants: state.participants.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  setParticipants: (participants) => set({ participants }),
  setMyParticipantId: (id) => set({ myParticipantId: id }),
  setScores: (scores) => set({ scores }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setTeamLeaderboard: (teamLeaderboard) => set({ teamLeaderboard }),
  setLastScoreBreakdown: (breakdown) => set({ lastScoreBreakdown: breakdown }),
  setVSMatchup: (matchup) => set({ vsMatchup: matchup }),
  setHasSubmitted: (submitted) => set({ hasSubmitted: submitted }),
  setIsHost: (isHost) => set({ isHost }),
  setTurnState: (partial) => set((state) => ({
    turnBased: partial.turnBased ?? state.turnBased,
    currentTurnPlayerId: partial.currentTurnPlayerId !== undefined ? partial.currentTurnPlayerId : state.currentTurnPlayerId,
    currentTurnNickname: partial.currentTurnNickname !== undefined ? partial.currentTurnNickname : state.currentTurnNickname,
    turnIndex: partial.turnIndex ?? state.turnIndex,
    turnOrder: partial.turnOrder ?? state.turnOrder,
    turnTimerEnd: partial.turnTimerEnd !== undefined ? partial.turnTimerEnd : state.turnTimerEnd,
  })),

  handleGameStateEvent: (data) => set({
    phase: data.phase,
    currentRound: data.round,
    totalRounds: data.totalRounds,
    currentChallengeId: data.challengeId || null,
    currentChallenge: data.challenge || null,
    timerEnd: data.timerEnd || null,
    hasSubmitted: false,
    turnBased: data.turnBased ?? false,
    currentTurnPlayerId: data.currentTurnPlayerId ?? null,
    currentTurnNickname: data.currentTurnNickname ?? null,
    turnIndex: data.turnIndex ?? 0,
    turnOrder: data.turnOrder ?? [],
    turnTimerEnd: data.turnTimerEnd ?? null,
  }),
  handleScoresUpdate: (data) => set({
    scores: data.scores,
    leaderboard: data.leaderboard,
    teamLeaderboard: data.teamLeaderboard || [],
  }),

  reset: () => set(initialState),
}));
