"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay";
import { WinnerPicker } from "@/components/game/WinnerPicker";
import { PodiumReveal } from "@/components/game/PodiumReveal";
import { useSound } from "@/hooks/useSound";
import { useStopwatch } from "@/hooks/useStopwatch";
import { useCountdown } from "@/hooks/useCountdown";
import { cn } from "@/lib/utils";
import type { ChallengeTemplate } from "@/types/challenge";
import type { ScoringType } from "@/types/game";

// ─── Types ────────────────────────────────────────

type PassPlayPhase =
  | "CHALLENGE_INTRO"
  | "PLAYER_TURN"
  | "PLAYER_ACTIVE"
  | "ALL_DONE"
  | "JUDGING"
  | "VOTING"
  | "SCORE_REVEAL"
  | "GAME_OVER";

interface Player {
  id: string;
  name: string;
  score: number;
}

interface PassPlayData {
  playerNames: string[];
  challenges: ChallengeTemplate[];
  eventName: string;
}

// ─── Helpers ──────────────────────────────────────

function deriveScoringType(template: ChallengeTemplate): ScoringType {
  if (template.scoringType) return template.scoringType;
  switch (template.submissionType) {
    case "judge":
      return "judge";
    case "vote":
      return "vote";
    case "completion_tap":
    case "text":
    case "photo":
      return "completion";
    case "hybrid":
      return "hybrid";
    default:
      return "completion";
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

// ─── Main Page ────────────────────────────────────

export default function PassPlayPage() {
  const router = useRouter();
  const { play } = useSound();

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
  const [turnTimerEnd, setTurnTimerEnd] = useState<string | null>(null);

  // Load data from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem("passplay_data");
    if (!raw) {
      router.push("/host/create");
      return;
    }
    try {
      const data: PassPlayData = JSON.parse(raw);
      if (!data.playerNames?.length || !data.challenges?.length) {
        router.push("/host/create");
        return;
      }
      setPlayers(
        data.playerNames.map((name, i) => ({
          id: `pp_${i}`,
          name,
          score: 0,
        }))
      );
      setChallenges(data.challenges);
      setEventName(data.eventName || "Pass & Play");
      setLoaded(true);
    } catch {
      router.push("/host/create");
    }
  }, [router]);

  // Timer hooks
  const stopwatch = useStopwatch(phase === "PLAYER_ACTIVE");
  const turnCountdown = useCountdown(phase === "PLAYER_ACTIVE" ? turnTimerEnd : null);

  const currentChallenge = challenges[currentChallengeIndex] ?? null;
  const currentPlayer = players[currentPlayerIndex] ?? null;
  const scoringType = currentChallenge ? deriveScoringType(currentChallenge) : "completion";

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
    setCurrentPlayerIndex(0);
    setPhase("PLAYER_TURN");
    play("menu_confirm");
  }, [play]);

  const startPlayerActive = useCallback(() => {
    setTurnStartTime(Date.now());
    const duration = currentChallenge?.durationSeconds || 60;
    setTurnTimerEnd(new Date(Date.now() + duration * 1000).toISOString());
    setPhase("PLAYER_ACTIVE");
    play("countdown_go");
  }, [play, currentChallenge]);

  const completePlayerTurn = useCallback(() => {
    const elapsed = Date.now() - turnStartTime;
    setTurnTimerEnd(null);
    setTurnCompletions((prev) => {
      const next = new Map(prev);
      next.set(players[currentPlayerIndex].id, elapsed);
      return next;
    });
    play("submit_success");

    // Check if all players have gone
    if (currentPlayerIndex + 1 >= players.length) {
      setPhase("ALL_DONE");
    } else {
      setCurrentPlayerIndex((i) => i + 1);
      setPhase("PLAYER_TURN");
    }
  }, [turnStartTime, currentPlayerIndex, players, play]);

  // Handle ALL_DONE -> choose scoring path
  const proceedFromAllDone = useCallback(() => {
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
  }, [scoringType, play]);

  // Auto-advance when timer expires
  const autoAdvanceRef = useRef(false);
  useEffect(() => {
    if (turnCountdown.isExpired && phase === "PLAYER_ACTIVE" && !autoAdvanceRef.current) {
      autoAdvanceRef.current = true;
      completePlayerTurn();
    }
    if (!turnCountdown.isExpired) {
      autoAdvanceRef.current = false;
    }
  }, [turnCountdown.isExpired, phase, completePlayerTurn]);

  // ─── Scoring ────────────────────────────────────

  const autoScore = useCallback(() => {
    const scores = new Map<string, number>();
    // Sort by completion time for position-based scoring
    const completions = Array.from(turnCompletions.entries())
      .sort((a, b) => a[1] - b[1]);

    players.forEach((p) => {
      const completed = turnCompletions.has(p.id);
      const position = completions.findIndex(([id]) => id === p.id);
      let points = 0;

      if (completed) {
        points += 10; // completion
        // Speed bonus: up to 8 for first, scaled by position
        const positionRatio =
          1 - position / Math.max(1, players.length - 1);
        points += Math.round(8 * positionRatio);
      }

      scores.set(p.id, points);
    });

    applyScores(scores);
  }, [turnCompletions, players]);

  const handleJudgeConfirm = useCallback(
    (first: string, second: string, third: string) => {
      const scores = new Map<string, number>();
      const placePoints: Record<string, number> = {
        [first]: 20,
        [second]: 12,
        [third]: 8,
      };

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

  const submitVote = useCallback(
    (votedForId: string) => {
      const voterId = players[currentVoterIndex].id;
      setVotes((prev) => {
        const next = new Map(prev);
        next.set(voterId, votedForId);
        return next;
      });
      play("menu_confirm");

      if (currentVoterIndex + 1 >= players.length) {
        // Tally votes after state update
        setTimeout(() => tallyVotes(), 50);
      } else {
        setCurrentVoterIndex((i) => i + 1);
      }
    },
    [currentVoterIndex, players, play]
  );

  const tallyVotes = useCallback(() => {
    const voteCounts = new Map<string, number>();
    players.forEach((p) => voteCounts.set(p.id, 0));
    votes.forEach((votedFor) => {
      voteCounts.set(votedFor, (voteCounts.get(votedFor) || 0) + 1);
    });

    // Sort by votes to assign judge-style points
    const sorted = Array.from(voteCounts.entries())
      .sort((a, b) => b[1] - a[1]);

    const scores = new Map<string, number>();
    const placePoints = [20, 12, 8];

    sorted.forEach(([id], i) => {
      if (i < 3) {
        scores.set(id, placePoints[i]);
      } else {
        scores.set(id, 3);
      }
    });

    applyScores(scores);
  }, [votes, players]);

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

  const advanceToNextChallenge = useCallback(() => {
    if (currentChallengeIndex + 1 >= challenges.length) {
      setPhase("GAME_OVER");
      play("game_over");
    } else {
      setCurrentChallengeIndex((i) => i + 1);
      startChallenge();
    }
  }, [currentChallengeIndex, challenges.length, startChallenge, play]);

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
            {challenges.length > 0 && phase !== "GAME_OVER" && (
              <span className="font-retro text-[9px] text-retro-muted">
                ROUND {currentChallengeIndex + 1}/{challenges.length}
              </span>
            )}
            <span className="font-retro text-[9px] text-retro-blue">
              {players.length} PLAYERS
            </span>
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
                {/* Category + Duration */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-retro text-[9px] uppercase tracking-wider text-retro-purple-light bg-retro-purple/20 px-2 py-1">
                    {currentChallenge.category}
                  </span>
                  <span className="font-retro text-[10px] text-retro-blue">
                    {formatDuration(currentChallenge.durationSeconds)}
                  </span>
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
                  Read the challenge together, then pass the phone to take turns!
                </p>
                <RetroButton
                  variant="success"
                  size="lg"
                  onClick={beginPlayerTurns}
                >
                  START TURNS
                </RetroButton>
              </div>
            </motion.div>
          )}

          {/* ─── PLAYER TURN (pass the phone screen) ─── */}
          {phase === "PLAYER_TURN" && currentPlayer && (
            <motion.div
              key={`turn-${currentPlayerIndex}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-6xl"
              >
                {"\u{1F4F1}"}
              </motion.div>

              <div className="text-center space-y-2">
                <p className="font-retro text-[10px] text-retro-muted uppercase tracking-widest">
                  Pass the phone to
                </p>
                <h2
                  className="font-retro text-xl text-retro-gold"
                  style={{ textShadow: "0 0 16px rgba(255,215,0,0.5)" }}
                >
                  {currentPlayer.name}
                </h2>
                <p className="font-retro text-[9px] text-retro-muted">
                  Player {currentPlayerIndex + 1} of {players.length}
                </p>
              </div>

              <RetroButton variant="primary" size="lg" onClick={startPlayerActive}>
                I&apos;M READY
              </RetroButton>
            </motion.div>
          )}

          {/* ─── PLAYER ACTIVE (doing the challenge) ─── */}
          {phase === "PLAYER_ACTIVE" && currentPlayer && currentChallenge && (
            <motion.div
              key={`active-${currentPlayerIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <span className="font-retro text-[10px] text-retro-green uppercase tracking-widest">
                  {currentPlayer.name}&apos;S TURN
                </span>
              </div>

              {/* Timer bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-retro text-[10px] text-retro-muted tabular-nums">
                    {stopwatch.formatted}
                  </span>
                  <span
                    className={cn(
                      "font-retro text-lg tabular-nums transition-colors duration-300",
                      turnCountdown.urgency === "critical"
                        ? "text-retro-pink animate-pulse"
                        : turnCountdown.urgency === "warning"
                          ? "text-retro-gold"
                          : "text-retro-green"
                    )}
                    style={{
                      textShadow:
                        turnCountdown.urgency === "critical"
                          ? "0 0 8px rgba(255,45,120,0.5)"
                          : turnCountdown.urgency === "warning"
                            ? "0 0 8px rgba(255,215,0,0.4)"
                            : "0 0 8px rgba(57,255,20,0.3)",
                    }}
                  >
                    {turnCountdown.formatted}
                  </span>
                </div>
                <div className="h-1.5 bg-page/60 w-full overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full transition-colors duration-500",
                      turnCountdown.urgency === "critical"
                        ? "bg-retro-pink"
                        : turnCountdown.urgency === "warning"
                          ? "bg-retro-gold"
                          : "bg-retro-green"
                    )}
                    style={{
                      width: `${Math.max(0, (turnCountdown.secondsLeft / (currentChallenge.durationSeconds || 60)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <RetroCard glow="green" padding="md">
                <h3 className="font-retro text-xs text-retro-text mb-2">
                  {currentChallenge.title}
                </h3>
                <p className="font-body text-sm text-retro-muted">
                  {currentChallenge.shortDescription}
                </p>
              </RetroCard>

              <div className="flex justify-center">
                <RetroButton
                  variant="gold"
                  size="lg"
                  onClick={completePlayerTurn}
                >
                  DONE!
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
                  {[...players]
                    .sort(
                      (a, b) =>
                        (roundScores.get(b.id) || 0) -
                        (roundScores.get(a.id) || 0)
                    )
                    .map((p, i) => {
                      const pts = roundScores.get(p.id) || 0;
                      const colors =
                        i === 0
                          ? "text-retro-gold border-retro-gold/30 bg-retro-gold/10"
                          : i === 1
                            ? "text-retro-blue border-retro-blue/30 bg-retro-blue/10"
                            : i === 2
                              ? "text-retro-green border-retro-green/30 bg-retro-green/10"
                              : "text-retro-muted border-retro-muted/20 bg-elevated";
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
                    })}
                </div>
              </RetroCard>

              {/* Overall leaderboard */}
              <RetroCard glow="blue" padding="md">
                <h3 className="font-retro text-[10px] text-retro-blue uppercase tracking-widest mb-3 text-center">
                  LEADERBOARD
                </h3>
                <div className="space-y-1">
                  {sortedPlayers.map((p, i) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-retro text-[9px] w-6",
                            i === 0
                              ? "text-retro-gold"
                              : i === 1
                                ? "text-retro-blue"
                                : i === 2
                                  ? "text-retro-green"
                                  : "text-retro-muted"
                          )}
                        >
                          #{i + 1}
                        </span>
                        <span className="font-retro text-[10px] text-retro-text truncate">
                          {p.name}
                        </span>
                      </div>
                      <span className="font-retro text-[10px] text-retro-muted tabular-nums">
                        {p.score} pts
                      </span>
                    </div>
                  ))}
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

              {showPodium && podiumFirst && podiumSecond && podiumThird && (
                <PodiumReveal
                  first={{
                    nickname: podiumFirst.name,
                    avatarIndex: 0,
                    score: podiumFirst.score,
                  }}
                  second={{
                    nickname: podiumSecond.name,
                    avatarIndex: 1,
                    score: podiumSecond.score,
                  }}
                  third={{
                    nickname: podiumThird.name,
                    avatarIndex: 2,
                    score: podiumThird.score,
                  }}
                  onComplete={() => {}}
                />
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
                      {sortedPlayers.map((p, i) => {
                        const placeLabel = i === 0 ? "1ST" : i === 1 ? "2ND" : `#${i + 1}`;
                        const placeColor =
                          i === 0
                            ? "text-retro-gold border-retro-gold/40 bg-retro-gold/10"
                            : i === 1
                              ? "text-retro-blue border-retro-blue/40 bg-retro-blue/10"
                              : "text-retro-muted border-retro-muted/20 bg-elevated";
                        return (
                          <div
                            key={p.id}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 border",
                              placeColor
                            )}
                          >
                            <span className="font-retro text-xs w-8">
                              {placeLabel}
                            </span>
                            <span className="font-retro text-[10px] flex-1 truncate text-retro-text">
                              {p.name}
                            </span>
                            <span className="font-retro text-xs tabular-nums">
                              {p.score} pts
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </RetroCard>
                </div>
              )}

              {/* Play again / exit buttons */}
              {showPodium && (
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
        </AnimatePresence>
      </div>
    </div>
  );
}
