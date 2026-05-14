"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay";
import { WinnerPicker } from "@/components/game/WinnerPicker";
import { PodiumReveal } from "@/components/game/PodiumReveal";
import { PixelAvatar } from "@/components/game/PixelAvatar";
import { useSound } from "@/hooks/useSound";
import { useSoundStore } from "@/stores/soundStore";
import { useStopwatch } from "@/hooks/useStopwatch";
import { useCountdown } from "@/hooks/useCountdown";
import { cn } from "@/lib/utils";
import { TournamentBracket } from "@/components/game/TournamentBracket";
import {
  generateBracket,
  advanceBracket,
  getBracketWinner,
} from "@/lib/game/brackets";
import type { BracketMatch } from "@/lib/game/brackets";
import type { ChallengeTemplate } from "@/types/challenge";
import type { ScoringType } from "@/types/game";

// ─── Types ────────────────────────────────────────

type PassPlayPhase =
  | "CHALLENGE_INTRO"
  | "PLAYER_TURN"
  | "PLAYER_COUNTDOWN"
  | "PLAYER_ACTIVE"
  | "TURN_DONE"
  | "SIMULTANEOUS_ACTIVE"
  | "ALL_DONE"
  | "JUDGING"
  | "VOTING"
  | "SCORE_REVEAL"
  | "GAME_OVER"
  | "BRACKET_VIEW"
  | "MATCH_INTRO"
  | "MATCH_JUDGING"
  | "MATCH_RESULT"
  | "TOURNAMENT_WINNER";

type TurnStyle = "simultaneous" | "stopwatch";

function deriveTurnStyle(template: ChallengeTemplate): TurnStyle {
  if (template.isSimultaneous) return "simultaneous";
  const iType = (template.interactiveData as { type?: string } | null | undefined)?.type;
  if (iType === "group_timer" || iType === "group_photo") return "simultaneous";
  return "stopwatch";
}

interface Player {
  id: string;
  name: string;
  avatarIndex: number;
  score: number;
}

interface PassPlayData {
  players?: { name: string; avatarIndex: number }[];
  playerNames?: string[];
  challenges: ChallengeTemplate[];
  eventName: string;
  mode?: string;
}

// ─── Helpers ──────────────────────────────────────

function deriveScoringType(template: ChallengeTemplate): ScoringType {
  // Submission types that inherently require manual scoring take priority
  if (template.submissionType === "judge") return "judge";
  if (template.submissionType === "vote") return "vote";
  if (template.submissionType === "hybrid") return "hybrid";
  // Use explicit scoring type if set
  if (template.scoringType) return template.scoringType;
  return "completion";
}

/** Compute rank at `index` in a descending-sorted score array, accounting for ties. */
function rankAt(scores: number[], index: number): number {
  if (index === 0 || scores[index] !== scores[index - 1]) return index + 1;
  return rankAt(scores, index - 1);
}

function rankColor(rank: number): string {
  if (rank === 1) return "text-retro-gold border-retro-gold/30 bg-retro-gold/10";
  if (rank === 2) return "text-retro-blue border-retro-blue/30 bg-retro-blue/10";
  if (rank === 3) return "text-retro-green border-retro-green/30 bg-retro-green/10";
  return "text-retro-muted border-retro-muted/20 bg-elevated";
}

function rankColorStrong(rank: number): string {
  if (rank === 1) return "text-retro-gold border-retro-gold/40 bg-retro-gold/10";
  if (rank === 2) return "text-retro-blue border-retro-blue/40 bg-retro-blue/10";
  if (rank === 3) return "text-retro-green border-retro-green/40 bg-retro-green/10";
  return "text-retro-muted border-retro-muted/20 bg-elevated";
}

function rankLabel(rank: number): string {
  if (rank === 1) return "1ST";
  if (rank === 2) return "2ND";
  if (rank === 3) return "3RD";
  return `#${rank}`;
}

// ─── Main Page ────────────────────────────────────

export default function PassPlayPage() {
  const router = useRouter();
  const { play } = useSound();
  const { isMuted, toggleMute } = useSoundStore();

  // Hydration-safe loading
  const [loaded, setLoaded] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [challenges, setChallenges] = useState<ChallengeTemplate[]>([]);
  const [eventName, setEventName] = useState("");

  // Game state
  const [phase, setPhase] = useState<PassPlayPhase>("CHALLENGE_INTRO");
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [turnStartTime, setTurnStartTime] = useState(0);
  const [turnCompletions, setTurnCompletions] = useState<Map<string, number>>(new Map());
  const [votes, setVotes] = useState<Map<string, string>>(new Map());
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0);
  const [roundScores, setRoundScores] = useState<Map<string, number>>(new Map());
  const [showPodium, setShowPodium] = useState(false);
  const [podiumDone, setPodiumDone] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [turnEndTime, setTurnEndTime] = useState<string | null>(null);
  const [lastTurnCompleted, setLastTurnCompleted] = useState(false);

  // Tournament state
  const [isTournament, setIsTournament] = useState(false);
  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [matchPlayerIndex, setMatchPlayerIndex] = useState(0); // 0 = player1, 1 = player2
  const [matchWinnerId, setMatchWinnerId] = useState<string | null>(null);
  const [tournamentRoundIndex, setTournamentRoundIndex] = useState(0);

  // Load data from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem("passplay_data");
    if (!raw) {
      router.push("/host/create");
      return;
    }
    try {
      const data: PassPlayData = JSON.parse(raw);
      const playerList = data.players || data.playerNames?.map((name, i) => ({ name, avatarIndex: i % 24 }));
      if (!playerList?.length || !data.challenges?.length) {
        router.push("/host/create");
        return;
      }
      setPlayers(
        playerList.map((p, i) => ({
          id: `pp_${i}`,
          name: p.name,
          avatarIndex: p.avatarIndex,
          score: 0,
        }))
      );
      setChallenges(data.challenges);
      setEventName(data.eventName || "Pass & Play");

      // Detect tournament mode
      if (data.mode === "tournament") {
        setIsTournament(true);
        const playerIds = playerList.map((_: { name: string; avatarIndex: number }, i: number) => `pp_${i}`);
        const bracket = generateBracket(playerIds);
        setBracketMatches(bracket);
        setPhase("BRACKET_VIEW");
      }

      setLoaded(true);
    } catch {
      router.push("/host/create");
    }
  }, [router]);

  // Timer hooks
  const stopwatch = useStopwatch(phase === "SIMULTANEOUS_ACTIVE");
  const challengeTimer = useCountdown(turnEndTime);

  const currentChallenge = challenges[currentChallengeIndex] ?? null;
  const currentPlayer = players[currentPlayerIndex] ?? null;
  // In tournament mode, derive from the tournament challenge
  const activeChallenge = isTournament
    ? (challenges[tournamentRoundIndex % challenges.length] ?? currentChallenge)
    : currentChallenge;
  const scoringType = activeChallenge ? deriveScoringType(activeChallenge) : "completion";
  const turnStyle = activeChallenge ? deriveTurnStyle(activeChallenge) : "stopwatch" as TurnStyle;
  const effectiveTurnStyle = isTournament && turnStyle === "simultaneous" ? "stopwatch" : turnStyle;

  // ─── Phase transitions ──────────────────────────

  const startChallenge = useCallback(() => {
    setTurnCompletions(new Map());
    setVotes(new Map());
    setRoundScores(new Map());
    setCurrentPlayerIndex(0);
    setCurrentVoterIndex(0);
    setPhase("CHALLENGE_INTRO");
    play("countdown_go");
  }, [play]);

  const beginPlayerTurns = useCallback(() => {
    if (effectiveTurnStyle === "simultaneous") {
      setPhase("SIMULTANEOUS_ACTIVE");
      play("countdown_go");
    } else {
      setCurrentPlayerIndex(0);
      setPhase("PLAYER_TURN");
      play("menu_confirm");
    }
  }, [play, effectiveTurnStyle]);

  // 3-2-1-GO countdown before player's turn
  useEffect(() => {
    if (phase !== "PLAYER_COUNTDOWN") return;
    setCountdownValue(3);
    const t1 = setTimeout(() => setCountdownValue(2), 1000);
    const t2 = setTimeout(() => setCountdownValue(1), 2000);
    const t3 = setTimeout(() => setCountdownValue(0), 3000); // GO
    const t4 = setTimeout(() => {
      const activeCh = isTournament
        ? (challenges[tournamentRoundIndex % challenges.length] ?? null)
        : (challenges[currentChallengeIndex] ?? null);
      const duration = activeCh?.durationSeconds ?? 60;
      setTurnEndTime(new Date(Date.now() + duration * 1000).toISOString());
      setTurnStartTime(Date.now());
      setPhase("PLAYER_ACTIVE");
      play("countdown_go");
    }, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [phase, isTournament, challenges, tournamentRoundIndex, currentChallengeIndex, play]);

  // Auto-end turn when challenge timer expires
  useEffect(() => {
    if (phase !== "PLAYER_ACTIVE" || !turnEndTime) return;
    if (!challengeTimer.isExpired) return;
    // Guard against false positive on initial render
    if (new Date(turnEndTime).getTime() > Date.now()) return;
    setLastTurnCompleted(false);
    setTurnEndTime(null);
    setPhase("TURN_DONE");
  }, [phase, challengeTimer.isExpired, turnEndTime]);

  const completePlayerTurn = useCallback(() => {
    const elapsed = Date.now() - turnStartTime;
    setTurnCompletions((prev) => {
      const next = new Map(prev);
      next.set(players[currentPlayerIndex].id, elapsed);
      return next;
    });
    setLastTurnCompleted(true);
    setTurnEndTime(null);
    setPhase("TURN_DONE");
    play("submit_success");
  }, [turnStartTime, currentPlayerIndex, players, play]);

  // ─── Scoring ────────────────────────────────────

  const autoScore = useCallback(() => {
    const scores = new Map<string, number>();
    players.forEach((p) => {
      scores.set(p.id, turnCompletions.has(p.id) ? 10 : 0);
    });
    applyScores(scores);
  }, [turnCompletions, players]);

  const handleJudgeConfirm = useCallback(
    (...picks: string[]) => {
      const scores = new Map<string, number>();
      const pointsByPlace = [20, 12, 8];
      const placePoints: Record<string, number> = {};
      picks.forEach((id, i) => {
        if (i < pointsByPlace.length) {
          placePoints[id] = pointsByPlace[i];
        }
      });

      players.forEach((p) => {
        const isWinner = placePoints[p.id] !== undefined;
        const bonus = placePoints[p.id] || 0;
        const participation = isWinner ? 0 : 3;
        scores.set(p.id, bonus + participation);
      });

      applyScores(scores);
    },
    [players]
  );

  const tallyVotes = useCallback((allVotes: Map<string, string>) => {
    const voteCounts = new Map<string, number>();
    players.forEach((p) => voteCounts.set(p.id, 0));
    allVotes.forEach((votedFor) => {
      voteCounts.set(votedFor, (voteCounts.get(votedFor) || 0) + 1);
    });

    // Sort by votes to assign judge-style points
    const sorted = Array.from(voteCounts.entries())
      .sort((a, b) => b[1] - a[1]);
    const sortedCounts = sorted.map(([, count]) => count);

    const scores = new Map<string, number>();
    const placePoints = [20, 12, 8];

    sorted.forEach(([id], i) => {
      const rank = rankAt(sortedCounts, i);
      if (rank <= 3) {
        scores.set(id, placePoints[rank - 1]);
      } else {
        scores.set(id, 3);
      }
    });

    applyScores(scores);
  }, [players]);

  const submitVote = useCallback(
    (votedForId: string) => {
      const voterId = players[currentVoterIndex].id;
      const newVotes = new Map(votes);
      newVotes.set(voterId, votedForId);
      setVotes(newVotes);
      play("menu_confirm");

      if (currentVoterIndex + 1 >= players.length) {
        tallyVotes(newVotes);
      } else {
        setCurrentVoterIndex((i) => i + 1);
      }
    },
    [currentVoterIndex, players, play, votes, tallyVotes]
  );

  const applyScores = useCallback(
    (scores: Map<string, number>) => {
      setRoundScores(scores);
      setPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          score: p.score + (scores.get(p.id) || 0),
        }))
      );
      setPhase("SCORE_REVEAL");
      play("score_reveal");
    },
    [play]
  );

  // Handle ALL_DONE -> choose scoring path
  const proceedFromAllDone = useCallback(() => {
    if (effectiveTurnStyle === "simultaneous") {
      // Simultaneous challenges always go to judge picks (no individual data)
      setPhase("JUDGING");
      play("dramatic_pause");
      return;
    }
    if (scoringType === "judge" || scoringType === "hybrid") {
      setPhase("JUDGING");
      play("dramatic_pause");
    } else if (scoringType === "vote") {
      setCurrentVoterIndex(0);
      setPhase("VOTING");
      play("dramatic_pause");
    } else {
      // Auto-score (completion/speed)
      autoScore();
    }
  }, [scoringType, play, effectiveTurnStyle, autoScore]);

  const advanceToNextChallenge = useCallback(() => {
    if (currentChallengeIndex + 1 >= challenges.length) {
      setPhase("GAME_OVER");
      play("game_over");
    } else {
      setCurrentChallengeIndex((i) => i + 1);
      startChallenge();
    }
  }, [currentChallengeIndex, challenges.length, startChallenge, play]);

  // ─── Tournament helpers ─────────────────────────

  const findNextMatch = useCallback((): BracketMatch | null => {
    // Find the first pending match that has both participants set
    return (
      bracketMatches.find(
        (m) =>
          m.status === "pending" &&
          m.participant1Id != null &&
          m.participant2Id != null
      ) || null
    );
  }, [bracketMatches]);

  const currentMatch = currentMatchId
    ? bracketMatches.find((m) => m.id === currentMatchId) || null
    : null;

  const currentMatchPlayer = (() => {
    if (!isTournament || !currentMatch) return null;
    const pid =
      matchPlayerIndex === 0
        ? currentMatch.participant1Id
        : currentMatch.participant2Id;
    return pid ? players.find((p) => p.id === pid) || null : null;
  })();

  // Get current challenge for the tournament round
  const tournamentChallenge =
    isTournament && challenges.length > 0
      ? challenges[tournamentRoundIndex % challenges.length]
      : null;

  const startNextTournamentMatch = useCallback(() => {
    const next = findNextMatch();
    if (!next) {
      // Check if tournament is over
      const winner = getBracketWinner(bracketMatches);
      if (winner) {
        setPhase("TOURNAMENT_WINNER");
        play("victory_fanfare");
      }
      return;
    }
    setCurrentMatchId(next.id);
    setMatchPlayerIndex(0);
    setMatchWinnerId(null);
    setPhase("MATCH_INTRO");
    play("vs_slam");
  }, [findNextMatch, bracketMatches, play]);

  const completeMatchPlayerTurn = useCallback(() => {
    setLastTurnCompleted(true);
    setTurnEndTime(null);
    setPhase("TURN_DONE");
    play("submit_success");
  }, [play]);

  const handleMatchWinner = useCallback(
    (winnerId: string) => {
      if (!currentMatchId) return;
      setMatchWinnerId(winnerId);
      const updated = advanceBracket(bracketMatches, currentMatchId, winnerId);
      setBracketMatches(updated);
      setPhase("MATCH_RESULT");
      play("crowd_cheer");

      // Check if the current round is complete to advance tournamentRoundIndex
      const match = bracketMatches.find((m) => m.id === currentMatchId);
      if (match) {
        const roundMatches = updated.filter(
          (m) => m.roundNumber === match.roundNumber
        );
        const allDone = roundMatches.every((m) => m.status === "completed");
        if (allDone) {
          setTournamentRoundIndex((i) => i + 1);
        }
      }
    },
    [currentMatchId, bracketMatches, play]
  );

  // Build participant map for TournamentBracket component
  const participantMap = (() => {
    const map: Record<string, { nickname: string; avatarIndex: number }> = {};
    players.forEach((p) => {
      map[p.id] = { nickname: p.name, avatarIndex: p.avatarIndex };
    });
    return map;
  })();

  // Convert BracketMatch[] to TournamentBracket's expected format
  const bracketDisplayMatches = bracketMatches.map((m) => ({
    id: m.id,
    round: m.roundNumber,
    position: m.matchIndex,
    player1Id: m.participant1Id,
    player2Id: m.participant2Id,
    player1Score: null as number | null,
    player2Score: null as number | null,
    winnerId: m.winnerId,
    isActive: m.id === currentMatchId && phase !== "BRACKET_VIEW",
  }));

  const tournamentWinnerId = getBracketWinner(bracketMatches);
  const tournamentWinner = tournamentWinnerId
    ? players.find((p) => p.id === tournamentWinnerId) || null
    : null;

  // (Auto-advance removed — host controls timing via stopwatch)

  // ─── Podium data ────────────────────────────────

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const podiumFirst = sortedPlayers[0];
  const podiumSecond = sortedPlayers[1];
  const podiumThird = sortedPlayers[2];

  // ─── Render ─────────────────────────────────────

  if (!loaded) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <p className="font-retro text-xs text-retro-purple-light animate-pulse">
          LOADING...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page relative">
      <ScanlineOverlay />

      {/* Header bar */}
      <div className="sticky top-0 z-30 bg-page/95 backdrop-blur-sm border-b border-retro-purple/20 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1
            className="font-retro text-xs text-retro-purple-light truncate"
            style={{ textShadow: "0 0 12px rgba(168,85,247,0.4)" }}
          >
            {eventName}
          </h1>
          <div className="flex items-center gap-3">
            {isTournament ? (
              phase !== "TOURNAMENT_WINNER" && (
                <span className="font-retro text-[9px] text-retro-gold">
                  TOURNAMENT
                </span>
              )
            ) : (
              challenges.length > 0 && phase !== "GAME_OVER" && (
                <span className="font-retro text-[9px] text-retro-muted">
                  ROUND {currentChallengeIndex + 1}/{challenges.length}
                </span>
              )
            )}
            <span className="font-retro text-[9px] text-retro-blue">
              {players.length} PLAYERS
            </span>
            <button
              onClick={toggleMute}
              className="font-retro text-[9px] text-retro-muted hover:text-retro-text transition-colors px-1"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? "\uD83D\uDD07" : "\uD83D\uDD0A"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* ─── CHALLENGE INTRO ─── */}
          {phase === "CHALLENGE_INTRO" && currentChallenge && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <span className="font-retro text-[10px] text-retro-gold uppercase tracking-widest">
                  CHALLENGE {currentChallengeIndex + 1}
                </span>
              </div>

              <RetroCard glow="purple" padding="lg">
                {/* Category + Duration/Group badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-retro text-[9px] uppercase tracking-wider text-retro-purple-light bg-retro-purple/20 px-2 py-1">
                    {currentChallenge.category}
                  </span>
                  {effectiveTurnStyle === "simultaneous" ? (
                    <span className="font-retro text-[10px] text-retro-green bg-retro-green/10 px-2 py-1 border border-retro-green/20">
                      GROUP
                    </span>
                  ) : (
                    <span className="font-retro text-[10px] text-retro-blue">
                      {currentChallenge.durationSeconds}s TIMED
                    </span>
                  )}
                </div>

                <h2
                  className="font-retro text-base md:text-lg text-retro-text mb-2"
                  style={{
                    textShadow: "0 0 8px rgba(168,85,247,0.4)",
                  }}
                >
                  {currentChallenge.title}
                </h2>
                <p className="font-body text-sm text-retro-muted mb-4">
                  {currentChallenge.shortDescription}
                </p>
                <div className="bg-page/60 border border-retro-purple/10 p-4 mb-4">
                  <p className="font-retro text-[9px] uppercase text-retro-muted tracking-wider mb-2">
                    Instructions
                  </p>
                  <p className="font-body text-sm text-retro-text/90 leading-relaxed whitespace-pre-line">
                    {currentChallenge.fullInstructions}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-retro text-[8px] text-retro-muted bg-elevated px-2 py-1 border border-retro-muted/20 uppercase">
                    {currentChallenge.submissionType.replace(/_/g, " ")}
                  </span>
                  <span className="font-retro text-[8px] text-retro-muted bg-elevated px-2 py-1 border border-retro-muted/20 uppercase">
                    {scoringType}
                  </span>
                </div>
              </RetroCard>

              <div className="text-center">
                <p className="font-body text-xs text-retro-muted mb-4">
                  {effectiveTurnStyle === "simultaneous"
                    ? "Read the challenge together, then everyone goes at once!"
                    : "Read the challenge together, then pass the phone to take turns!"}
                </p>
                <RetroButton
                  variant="success"
                  size="lg"
                  onClick={beginPlayerTurns}
                >
                  {effectiveTurnStyle === "simultaneous" ? "EVERYONE GO!" : "START TURNS"}
                </RetroButton>
              </div>
            </motion.div>
          )}

          {/* ─── PLAYER TURN (pass the phone screen) ─── */}
          {phase === "PLAYER_TURN" && (() => {
            const turnPlayer = isTournament ? currentMatchPlayer : currentPlayer;
            if (!turnPlayer) return null;
            return (
              <motion.div
                key={`turn-${isTournament ? `${currentMatchId}-${matchPlayerIndex}` : currentPlayerIndex}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <PixelAvatar avatarIndex={turnPlayer.avatarIndex} size="xl" />
                </motion.div>

                <div className="text-center space-y-2">
                  <p className="font-retro text-[10px] text-retro-muted uppercase tracking-widest">
                    Pass the phone to
                  </p>
                  <h2
                    className="font-retro text-xl text-retro-gold"
                    style={{ textShadow: "0 0 16px rgba(255,215,0,0.5)" }}
                  >
                    {turnPlayer.name}
                  </h2>
                  {!isTournament && (
                    <p className="font-retro text-[9px] text-retro-muted">
                      Player {currentPlayerIndex + 1} of {players.length}
                    </p>
                  )}
                  {isTournament && (
                    <p className="font-retro text-[9px] text-retro-muted">
                      Player {matchPlayerIndex + 1} of 2
                    </p>
                  )}
                </div>

                <RetroButton variant="primary" size="lg" onClick={() => setPhase("PLAYER_COUNTDOWN")}>
                  I&apos;M READY
                </RetroButton>
              </motion.div>
            );
          })()}

          {/* ─── PLAYER COUNTDOWN (3-2-1-GO) ─── */}
          {phase === "PLAYER_COUNTDOWN" && (
            <motion.div
              key="player-countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={countdownValue}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "font-retro text-6xl",
                    countdownValue === 0 ? "text-retro-green" : "text-retro-gold"
                  )}
                  style={{
                    textShadow: countdownValue === 0
                      ? "0 0 24px rgba(57,255,20,0.6)"
                      : "0 0 20px rgba(255,215,0,0.6)",
                  }}
                >
                  {countdownValue === 0 ? "GO!" : countdownValue}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          )}

          {/* ─── PLAYER ACTIVE (countdown timer) ─── */}
          {phase === "PLAYER_ACTIVE" && (() => {
            const activePlayer = isTournament ? currentMatchPlayer : currentPlayer;
            const activeCh = isTournament ? tournamentChallenge : currentChallenge;
            const onDone = isTournament ? completeMatchPlayerTurn : completePlayerTurn;
            if (!activePlayer || !activeCh) return null;
            return (
              <motion.div
                key={`active-${isTournament ? `${currentMatchId}-${matchPlayerIndex}` : currentPlayerIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <span className="font-retro text-[10px] text-retro-green uppercase tracking-widest">
                    {activePlayer.name}&apos;S TURN
                  </span>
                </div>

                {/* Countdown timer display */}
                <div className="text-center">
                  <span
                    className={cn(
                      "font-retro text-3xl tabular-nums transition-colors duration-300",
                      challengeTimer.urgency === "critical"
                        ? "text-retro-pink"
                        : challengeTimer.urgency === "warning"
                          ? "text-retro-gold"
                          : "text-retro-green"
                    )}
                    style={{
                      textShadow:
                        challengeTimer.urgency === "critical"
                          ? "0 0 12px rgba(255,45,120,0.4)"
                          : challengeTimer.urgency === "warning"
                            ? "0 0 12px rgba(255,215,0,0.4)"
                            : "0 0 12px rgba(57,255,20,0.4)",
                    }}
                  >
                    {challengeTimer.formatted}
                  </span>
                </div>

                <RetroCard glow="green" padding="md">
                  <h3 className="font-retro text-xs text-retro-text mb-2">
                    {activeCh.title}
                  </h3>
                  <p className="font-body text-sm text-retro-muted">
                    {activeCh.shortDescription}
                  </p>
                </RetroCard>

                <div className="flex justify-center">
                  <RetroButton variant="success" size="lg" onClick={onDone}>
                    I DID IT!
                  </RetroButton>
                </div>
              </motion.div>
            );
          })()}

          {/* ─── TURN DONE (transition between players) ─── */}
          {phase === "TURN_DONE" && (() => {
            const turnPlayer = isTournament ? currentMatchPlayer : currentPlayer;
            if (!turnPlayer) return null;

            let buttonLabel: string;
            let buttonAction: () => void;

            if (isTournament) {
              if (matchPlayerIndex === 0) {
                buttonLabel = "NEXT PLAYER";
                buttonAction = () => {
                  setMatchPlayerIndex(1);
                  setPhase("PLAYER_TURN");
                  play("menu_confirm");
                };
              } else {
                buttonLabel = "JUDGE WINNER";
                buttonAction = () => {
                  setPhase("MATCH_JUDGING");
                  play("dramatic_pause");
                };
              }
            } else {
              if (currentPlayerIndex + 1 >= players.length) {
                buttonLabel = "SEE RESULTS";
                buttonAction = () => {
                  setPhase("ALL_DONE");
                  play("menu_confirm");
                };
              } else {
                buttonLabel = "NEXT PLAYER";
                buttonAction = () => {
                  setCurrentPlayerIndex((i) => i + 1);
                  setPhase("PLAYER_TURN");
                  play("menu_confirm");
                };
              }
            }

            return (
              <motion.div
                key={`turn-done-${isTournament ? `${currentMatchId}-${matchPlayerIndex}` : currentPlayerIndex}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
              >
                {lastTurnCompleted ? (
                  <h2
                    className="font-retro text-2xl text-retro-green uppercase"
                    style={{ textShadow: "0 0 16px rgba(57,255,20,0.5)" }}
                  >
                    DONE!
                  </h2>
                ) : (
                  <h2
                    className="font-retro text-2xl text-retro-pink uppercase"
                    style={{ textShadow: "0 0 16px rgba(255,45,120,0.5)" }}
                  >
                    TIME&apos;S UP!
                  </h2>
                )}

                <PixelAvatar avatarIndex={turnPlayer.avatarIndex} size="lg" />
                <span className="font-retro text-sm text-retro-text">
                  {turnPlayer.name}
                </span>

                <RetroButton variant="primary" size="lg" onClick={buttonAction}>
                  {buttonLabel}
                </RetroButton>
              </motion.div>
            );
          })()}

          {/* ─── SIMULTANEOUS ACTIVE (everyone together) ─── */}
          {phase === "SIMULTANEOUS_ACTIVE" && currentChallenge && (
            <motion.div
              key="simultaneous"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2
                  className="font-retro text-sm text-retro-green uppercase tracking-widest"
                  style={{ textShadow: "0 0 12px rgba(57,255,20,0.4)" }}
                >
                  EVERYONE TOGETHER!
                </h2>
              </div>

              {/* Running stopwatch */}
              <div className="text-center">
                <span
                  className="font-retro text-3xl text-retro-green tabular-nums"
                  style={{ textShadow: "0 0 12px rgba(57,255,20,0.4)" }}
                >
                  {stopwatch.formatted}
                </span>
              </div>

              <RetroCard glow="green" padding="md">
                <h3 className="font-retro text-xs text-retro-text mb-2 text-center">
                  {currentChallenge.title}
                </h3>
                <p className="font-body text-sm text-retro-muted text-center">
                  {currentChallenge.shortDescription}
                </p>
              </RetroCard>

              {/* Player roster */}
              <div className="flex flex-wrap justify-center gap-3">
                {players.map((p) => (
                  <div key={p.id} className="flex flex-col items-center gap-1">
                    <PixelAvatar avatarIndex={p.avatarIndex} size="sm" />
                    <span className="font-retro text-[8px] text-retro-muted truncate max-w-[60px]">
                      {p.name}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <RetroButton
                  variant="gold"
                  size="lg"
                  onClick={() => {
                    setPhase("ALL_DONE");
                    play("submit_success");
                  }}
                >
                  DONE — PICK WINNERS
                </RetroButton>
              </div>
            </motion.div>
          )}

          {/* ─── ALL DONE (all players finished) ─── */}
          {phase === "ALL_DONE" && (
            <motion.div
              key="alldone"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[60vh] space-y-6"
            >
              <span className="text-5xl">{"\u2705"}</span>
              <h2 className="font-retro text-sm text-retro-green uppercase tracking-widest">
                All players done!
              </h2>
              <p className="font-body text-sm text-retro-muted text-center">
                {scoringType === "judge"
                  ? "Time to pick the winners!"
                  : scoringType === "vote"
                    ? "Time to vote for the best!"
                    : scoringType === "hybrid"
                      ? "Time to pick the winners!"
                      : "Let's see the scores!"}
              </p>
              <RetroButton variant="gold" size="lg" onClick={proceedFromAllDone}>
                {scoringType === "judge" || scoringType === "hybrid"
                  ? "PICK WINNERS"
                  : scoringType === "vote"
                    ? "START VOTING"
                    : "REVEAL SCORES"}
              </RetroButton>
            </motion.div>
          )}

          {/* ─── JUDGING ─── */}
          {phase === "JUDGING" && (
            <motion.div
              key="judging"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <span className="font-retro text-[10px] text-retro-gold uppercase tracking-widest">
                  JUDGE&apos;S PICK
                </span>
              </div>
              <WinnerPicker
                participants={players.map((p) => ({
                  id: p.id,
                  nickname: p.name,
                }))}
                onConfirm={handleJudgeConfirm}
              />
            </motion.div>
          )}

          {/* ─── VOTING ─── */}
          {phase === "VOTING" && (
            <motion.div
              key={`vote-${currentVoterIndex}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Pass-to screen for voter */}
              {(() => {
                const voter = players[currentVoterIndex];
                if (!voter) return null;
                return (
                  <>
                    <div className="text-center space-y-2">
                      <p className="font-retro text-[10px] text-retro-muted uppercase tracking-widest">
                        Pass the phone to
                      </p>
                      <h2
                        className="font-retro text-lg text-retro-gold"
                        style={{ textShadow: "0 0 12px rgba(255,215,0,0.4)" }}
                      >
                        {voter.name}
                      </h2>
                      <p className="font-retro text-[9px] text-retro-pink uppercase">
                        Vote for the best (not yourself!)
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {players
                        .filter((p) => p.id !== voter.id)
                        .map((p) => (
                          <button
                            key={p.id}
                            onClick={() => submitVote(p.id)}
                            className="flex items-center justify-center gap-2 px-4 py-4 border-2 border-retro-purple/20 bg-elevated hover:border-retro-purple/40 transition-all"
                          >
                            <span className="font-retro text-[10px] text-retro-text">
                              {p.name}
                            </span>
                          </button>
                        ))}
                    </div>
                    <p className="font-retro text-[9px] text-retro-muted text-center">
                      Voter {currentVoterIndex + 1} of {players.length}
                    </p>
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* ─── SCORE REVEAL ─── */}
          {phase === "SCORE_REVEAL" && (
            <motion.div
              key="scores"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <span className="font-retro text-[10px] text-retro-purple-light uppercase tracking-widest">
                  ROUND {currentChallengeIndex + 1} SCORES
                </span>
              </div>

              <RetroCard glow="purple" padding="md">
                <div className="space-y-2">
                  {(() => {
                    const sorted = [...players].sort(
                      (a, b) =>
                        (roundScores.get(b.id) || 0) -
                        (roundScores.get(a.id) || 0)
                    );
                    const sortedScores = sorted.map((p) => roundScores.get(p.id) || 0);
                    return sorted.map((p, i) => {
                      const pts = roundScores.get(p.id) || 0;
                      const rank = rankAt(sortedScores, i);
                      const colors = rankColor(rank);
                      return (
                        <motion.div
                          key={p.id}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: i * 0.15 }}
                          className={cn(
                            "flex items-center justify-between px-4 py-3 border",
                            colors
                          )}
                        >
                          <span className="font-retro text-[10px] truncate">
                            {p.name}
                          </span>
                          <span className="font-retro text-xs tabular-nums">
                            +{pts}
                          </span>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              </RetroCard>

              {/* Overall leaderboard */}
              <RetroCard glow="blue" padding="md">
                <h3 className="font-retro text-[10px] text-retro-blue uppercase tracking-widest mb-3 text-center">
                  LEADERBOARD
                </h3>
                <div className="space-y-1">
                  {(() => {
                    const scores = sortedPlayers.map((p) => p.score);
                    return sortedPlayers.map((p, i) => {
                      const rank = rankAt(scores, i);
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-retro text-[9px] w-6",
                                rank === 1
                                  ? "text-retro-gold"
                                  : rank === 2
                                    ? "text-retro-blue"
                                    : rank === 3
                                      ? "text-retro-green"
                                      : "text-retro-muted"
                              )}
                            >
                              #{rank}
                            </span>
                            <span className="font-retro text-[10px] text-retro-text truncate">
                              {p.name}
                            </span>
                          </div>
                          <span className="font-retro text-[10px] text-retro-muted tabular-nums">
                            {p.score} pts
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </RetroCard>

              <div className="flex justify-center">
                <RetroButton
                  variant="primary"
                  size="lg"
                  onClick={advanceToNextChallenge}
                >
                  {currentChallengeIndex + 1 >= challenges.length
                    ? "FINAL RESULTS"
                    : "NEXT CHALLENGE"}
                </RetroButton>
              </div>
            </motion.div>
          )}

          {/* ─── GAME OVER ─── */}
          {phase === "GAME_OVER" && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Show podium if we have 3+ players */}
              {!showPodium && podiumFirst && podiumSecond && podiumThird && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                  <h2
                    className="font-retro text-lg text-retro-gold text-center"
                    style={{
                      textShadow: "0 0 16px rgba(255,215,0,0.5)",
                    }}
                  >
                    GAME OVER
                  </h2>
                  <RetroButton
                    variant="gold"
                    size="lg"
                    onClick={() => {
                      setShowPodium(true);
                      play("crowd_cheer");
                    }}
                  >
                    REVEAL PODIUM
                  </RetroButton>
                </div>
              )}

              {/* Podium with 2 players (no podium component) */}
              {!showPodium && podiumFirst && podiumSecond && !podiumThird && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                  <h2
                    className="font-retro text-lg text-retro-gold text-center"
                    style={{
                      textShadow: "0 0 16px rgba(255,215,0,0.5)",
                    }}
                  >
                    GAME OVER
                  </h2>
                  <RetroButton
                    variant="gold"
                    size="lg"
                    onClick={() => {
                      setShowPodium(true);
                      play("victory_fanfare");
                    }}
                  >
                    REVEAL WINNER
                  </RetroButton>
                </div>
              )}

              {showPodium && !podiumDone && podiumFirst && podiumSecond && podiumThird && (
                <PodiumReveal
                  first={{
                    nickname: podiumFirst.name,
                    avatarIndex: podiumFirst.avatarIndex,
                    score: podiumFirst.score,
                  }}
                  second={{
                    nickname: podiumSecond.name,
                    avatarIndex: podiumSecond.avatarIndex,
                    score: podiumSecond.score,
                  }}
                  third={{
                    nickname: podiumThird.name,
                    avatarIndex: podiumThird.avatarIndex,
                    score: podiumThird.score,
                  }}
                  onComplete={() => setPodiumDone(true)}
                />
              )}

              {/* Final standings after podium (3+ players) */}
              {podiumDone && podiumFirst && podiumSecond && podiumThird && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2
                      className="font-retro text-lg text-retro-gold"
                      style={{ textShadow: "0 0 16px rgba(255,215,0,0.5)" }}
                    >
                      FINAL RESULTS
                    </h2>
                  </div>
                  <RetroCard glow="gold" padding="lg">
                    <div className="space-y-3">
                      {(() => {
                        const scores = sortedPlayers.map((p) => p.score);
                        return sortedPlayers.map((p, i) => {
                          const rank = rankAt(scores, i);
                          return (
                            <div
                              key={p.id}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 border",
                                rankColorStrong(rank)
                              )}
                            >
                              <span className="font-retro text-xs w-8">
                                {rankLabel(rank)}
                              </span>
                              <PixelAvatar avatarIndex={p.avatarIndex} size="sm" />
                              <span className="font-retro text-[10px] flex-1 truncate text-retro-text">
                                {p.name}
                              </span>
                              <span className="font-retro text-xs tabular-nums">
                                {p.score} pts
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </RetroCard>
                </div>
              )}

              {/* 2-player final or after podium close */}
              {showPodium && podiumFirst && podiumSecond && !podiumThird && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2
                      className="font-retro text-lg text-retro-gold"
                      style={{ textShadow: "0 0 16px rgba(255,215,0,0.5)" }}
                    >
                      FINAL RESULTS
                    </h2>
                  </div>
                  <RetroCard glow="gold" padding="lg">
                    <div className="space-y-3">
                      {(() => {
                        const scores = sortedPlayers.map((p) => p.score);
                        return sortedPlayers.map((p, i) => {
                          const rank = rankAt(scores, i);
                          return (
                            <div
                              key={p.id}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 border",
                                rankColorStrong(rank)
                              )}
                            >
                              <span className="font-retro text-xs w-8">
                                {rankLabel(rank)}
                              </span>
                              <span className="font-retro text-[10px] flex-1 truncate text-retro-text">
                                {p.name}
                              </span>
                              <span className="font-retro text-xs tabular-nums">
                                {p.score} pts
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </RetroCard>
                </div>
              )}

              {/* Play again / exit buttons */}
              {(podiumDone || (showPodium && !podiumThird)) && (
                <div className="flex justify-center gap-3 pt-4">
                  <RetroButton
                    variant="primary"
                    size="md"
                    onClick={() => {
                      // Reset and replay with same players
                      setPlayers((prev) =>
                        prev.map((p) => ({ ...p, score: 0 }))
                      );
                      setCurrentChallengeIndex(0);
                      setShowPodium(false);
                      setPodiumDone(false);
                      startChallenge();
                    }}
                  >
                    PLAY AGAIN
                  </RetroButton>
                  <RetroButton
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      sessionStorage.removeItem("passplay_data");
                      router.push("/host/create");
                    }}
                  >
                    NEW GAME
                  </RetroButton>
                </div>
              )}
            </motion.div>
          )}
          {/* ─── TOURNAMENT: BRACKET VIEW ─── */}
          {phase === "BRACKET_VIEW" && isTournament && (
            <motion.div
              key="bracket"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <TournamentBracket
                matches={bracketDisplayMatches}
                participantMap={participantMap}
              />

              <div className="flex justify-center">
                <RetroButton
                  variant="gold"
                  size="lg"
                  onClick={startNextTournamentMatch}
                >
                  NEXT MATCH
                </RetroButton>
              </div>
            </motion.div>
          )}

          {/* ─── TOURNAMENT: MATCH INTRO (VS screen) ─── */}
          {phase === "MATCH_INTRO" && isTournament && currentMatch && (() => {
            const p1 = currentMatch.participant1Id
              ? players.find((p) => p.id === currentMatch.participant1Id)
              : null;
            const p2 = currentMatch.participant2Id
              ? players.find((p) => p.id === currentMatch.participant2Id)
              : null;
            const challenge = tournamentChallenge;
            if (!p1 || !p2) return null;
            return (
              <motion.div
                key={`match-intro-${currentMatchId}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
              >
                {/* VS display */}
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <PixelAvatar avatarIndex={p1.avatarIndex} size="xl" />
                    <span className="font-retro text-xs text-retro-text">{p1.name}</span>
                  </div>
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="font-retro text-2xl text-retro-pink"
                    style={{ textShadow: "0 0 16px rgba(255,45,120,0.5)" }}
                  >
                    VS
                  </motion.span>
                  <div className="flex flex-col items-center gap-2">
                    <PixelAvatar avatarIndex={p2.avatarIndex} size="xl" />
                    <span className="font-retro text-xs text-retro-text">{p2.name}</span>
                  </div>
                </div>

                {/* Challenge info */}
                {challenge && (
                  <RetroCard glow="purple" padding="md">
                    <h3 className="font-retro text-xs text-retro-text mb-1 text-center">
                      {challenge.title}
                    </h3>
                    <p className="font-body text-sm text-retro-muted text-center">
                      {challenge.shortDescription}
                    </p>
                  </RetroCard>
                )}

                <RetroButton
                  variant="success"
                  size="lg"
                  onClick={() => {
                    setMatchPlayerIndex(0);
                    setPhase("PLAYER_TURN");
                    play("menu_confirm");
                  }}
                >
                  BEGIN
                </RetroButton>
              </motion.div>
            );
          })()}

          {/* ─── TOURNAMENT: MATCH JUDGING ─── */}
          {phase === "MATCH_JUDGING" && isTournament && currentMatch && (() => {
            const p1 = currentMatch.participant1Id
              ? players.find((p) => p.id === currentMatch.participant1Id)
              : null;
            const p2 = currentMatch.participant2Id
              ? players.find((p) => p.id === currentMatch.participant2Id)
              : null;
            if (!p1 || !p2) return null;
            return (
              <motion.div
                key={`match-judge-${currentMatchId}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
              >
                <div className="text-center">
                  <h2
                    className="font-retro text-sm text-retro-gold uppercase tracking-widest"
                    style={{ textShadow: "0 0 12px rgba(255,215,0,0.4)" }}
                  >
                    WHO WON?
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                  <button
                    onClick={() => handleMatchWinner(p1.id)}
                    className="flex flex-col items-center gap-3 p-6 border-2 border-retro-purple/20 bg-elevated hover:border-retro-gold/60 hover:bg-retro-gold/5 transition-all"
                  >
                    <PixelAvatar avatarIndex={p1.avatarIndex} size="lg" />
                    <span className="font-retro text-xs text-retro-text">{p1.name}</span>
                  </button>
                  <button
                    onClick={() => handleMatchWinner(p2.id)}
                    className="flex flex-col items-center gap-3 p-6 border-2 border-retro-purple/20 bg-elevated hover:border-retro-gold/60 hover:bg-retro-gold/5 transition-all"
                  >
                    <PixelAvatar avatarIndex={p2.avatarIndex} size="lg" />
                    <span className="font-retro text-xs text-retro-text">{p2.name}</span>
                  </button>
                </div>
              </motion.div>
            );
          })()}

          {/* ─── TOURNAMENT: MATCH RESULT ─── */}
          {phase === "MATCH_RESULT" && isTournament && matchWinnerId && (() => {
            const winner = players.find((p) => p.id === matchWinnerId);
            if (!winner) return null;
            return (
              <motion.div
                key={`match-result-${currentMatchId}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <PixelAvatar avatarIndex={winner.avatarIndex} size="xl" />
                </motion.div>

                <div className="text-center space-y-2">
                  <h2
                    className="font-retro text-lg text-retro-gold"
                    style={{ textShadow: "0 0 16px rgba(255,215,0,0.5)" }}
                  >
                    {winner.name} WINS!
                  </h2>
                </div>

                <RetroButton
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    setPhase("BRACKET_VIEW");
                    play("menu_confirm");
                  }}
                >
                  CONTINUE
                </RetroButton>
              </motion.div>
            );
          })()}

          {/* ─── TOURNAMENT: WINNER ─── */}
          {phase === "TOURNAMENT_WINNER" && isTournament && tournamentWinner && (
            <motion.div
              key="tournament-winner"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
            >
              <motion.span
                className="text-5xl"
                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {"\uD83D\uDC51"}
              </motion.span>

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <PixelAvatar avatarIndex={tournamentWinner.avatarIndex} size="xl" />
              </motion.div>

              <div className="text-center space-y-2">
                <h2
                  className="font-retro text-xl text-retro-gold"
                  style={{ textShadow: "0 0 20px rgba(255,215,0,0.6)" }}
                >
                  {tournamentWinner.name}
                </h2>
                <p className="font-retro text-sm text-retro-purple-light uppercase tracking-widest">
                  TOURNAMENT CHAMPION
                </p>
              </div>

              <div className="flex gap-3">
                <RetroButton
                  variant="primary"
                  size="md"
                  onClick={() => {
                    // Regenerate bracket for replay
                    const playerIds = players.map((p) => p.id);
                    const bracket = generateBracket(playerIds);
                    setBracketMatches(bracket);
                    setCurrentMatchId(null);
                    setMatchPlayerIndex(0);
                    setMatchWinnerId(null);
                    setTournamentRoundIndex(0);
                    setPhase("BRACKET_VIEW");
                    play("menu_confirm");
                  }}
                >
                  PLAY AGAIN
                </RetroButton>
                <RetroButton
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    sessionStorage.removeItem("passplay_data");
                    router.push("/host/create");
                  }}
                >
                  NEW GAME
                </RetroButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* (Countdown overlay removed — host controls timing via stopwatch) */}
    </div>
  );
}
