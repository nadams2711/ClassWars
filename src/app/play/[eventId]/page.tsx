"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameState } from "@/hooks/useGameState";
import { useCountdown } from "@/hooks/useCountdown";
import { useScreenShake } from "@/hooks/useScreenShake";
import { ChallengeCard } from "@/components/game/ChallengeCard";
import { SubmissionPanel } from "@/components/game/SubmissionPanel";
import { CountdownTimer } from "@/components/game/CountdownTimer";
import { ScoreReveal } from "@/components/game/ScoreReveal";
import { VSScreen } from "@/components/game/VSScreen";
import { RetroCard } from "@/components/ui/RetroCard";
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SubmissionType, MovementLevel, NoiseLevel } from "@/types/game";

interface StoredParticipant {
  participantId: string;
  eventId: string;
  nickname: string;
}

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [stored, setStored] = useState<StoredParticipant | null>(null);
  const [showCountdownOverlay, setShowCountdownOverlay] = useState(false);
  const [challengePhase, setChallengePhase] = useState<"waiting" | "active" | "submitted">("waiting");

  const game = useGameState(eventId);
  const { secondsLeft, formatted, urgency, isExpired } = useCountdown(game.timerEnd);
  const { isShaking, shake } = useScreenShake();

  // Load stored participant info
  useEffect(() => {
    try {
      const raw = localStorage.getItem("classwars_participant");
      if (raw) {
        const parsed: StoredParticipant = JSON.parse(raw);
        if (parsed.eventId === eventId) {
          setStored(parsed);
          game.setMyParticipantId(parsed.participantId);
        }
      }
    } catch {
      // Proceed without stored data
    }
  }, [eventId]);

  // Handle phase transitions
  useEffect(() => {
    if (game.phase === "COUNTDOWN") {
      setShowCountdownOverlay(true);
      setChallengePhase("waiting");
    }
    if (game.phase === "CHALLENGE_ACTIVE") {
      setChallengePhase("active");
    }
    if (game.phase === "SUBMISSIONS_CLOSED") {
      // Timer expired
    }
    if (game.phase === "SCORE_REVEAL") {
      shake();
    }
    if (game.phase === "FINAL_RESULTS") {
      router.push(`/play/${eventId}/results`);
    }
  }, [game.phase, eventId, router, shake]);

  // Reset submission state on new round (new challenge)
  useEffect(() => {
    if (game.hasSubmitted === false) {
      setChallengePhase((prev) => (prev === "submitted" ? "waiting" : prev));
    }
  }, [game.hasSubmitted]);

  // Handle countdown overlay completion
  const handleCountdownComplete = useCallback(() => {
    setShowCountdownOverlay(false);
    setChallengePhase("active");
    // Locally transition to CHALLENGE_ACTIVE since server sends COUNTDOWN
    // and the client manages this transition
    game.setPhase("CHALLENGE_ACTIVE");
  }, [game]);

  // Handle submission
  const handleSubmit = useCallback(
    async (value: string) => {
      if (!stored || !game.currentChallengeId) return;
      setChallengePhase("submitted");
      game.setHasSubmitted(true);

      try {
        await fetch("/api/game/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId: stored.participantId,
            eventChallengeId: game.currentChallengeId,
            submissionType: game.currentChallenge?.submissionType || "completion_tap",
            textContent: value !== "completed" ? value : null,
          }),
        });
      } catch {
        // Submission failed, but we still show submitted state
        // since retrying could cause duplicates
      }
    },
    [stored, game]
  );

  // Find my score breakdown and rank from the leaderboard
  const myEntry = useMemo(
    () => game.leaderboard.find((e) => e.participantId === stored?.participantId),
    [game.leaderboard, stored]
  );

  // Timer bar color
  const timerColor =
    urgency === "critical"
      ? "text-retro-pink"
      : urgency === "warning"
      ? "text-retro-gold"
      : "text-retro-green";

  const timerBarColor =
    urgency === "critical"
      ? "bg-retro-pink"
      : urgency === "warning"
      ? "bg-retro-gold"
      : "bg-retro-green";

  const challenge = game.currentChallenge;

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col bg-page relative",
        isShaking && "screen-shake"
      )}
    >
      <ScanlineOverlay />

      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-40 bg-card/95 border-b border-retro-purple/20 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-2.5">
          {/* Round indicator */}
          <div className="flex items-center gap-2">
            <span className="font-retro text-[9px] text-retro-muted uppercase tracking-wider">
              Round
            </span>
            <span className="font-retro text-xs text-retro-purple-light">
              {game.currentRound}/{game.totalRounds}
            </span>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-retro text-lg tabular-nums transition-colors duration-300",
                timerColor
              )}
              style={{
                textShadow:
                  urgency === "critical"
                    ? "0 0 8px rgba(255,45,120,0.5)"
                    : urgency === "warning"
                    ? "0 0 8px rgba(255,215,0,0.4)"
                    : "0 0 8px rgba(57,255,20,0.3)",
              }}
            >
              {formatted}
            </span>
          </div>

          {/* Leaderboard shortcut */}
          <button
            onClick={() => router.push(`/play/${eventId}/leaderboard`)}
            className="font-retro text-[9px] text-retro-blue uppercase tracking-wider hover:text-retro-blue/80 transition-colors"
          >
            Scores
          </button>
        </div>

        {/* Timer progress bar */}
        {game.timerEnd && (
          <div className="h-1 bg-page/60 w-full">
            <motion.div
              className={cn("h-full transition-colors duration-500", timerBarColor)}
              style={{
                width: `${Math.max(0, (secondsLeft / ((challenge?.durationSeconds || 60) + 4)) * 100)}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-4 py-4 sm:py-6 max-w-xl mx-auto w-full gap-4">
        <AnimatePresence mode="wait">
          {/* COUNTDOWN Overlay */}
          {game.phase === "COUNTDOWN" && showCountdownOverlay && (
            <CountdownTimer onComplete={handleCountdownComplete} />
          )}

          {/* VS_SCREEN Overlay */}
          {game.phase === "VS_SCREEN" && game.vsMatchup && (
            <VSScreen
              player1={{
                nickname: game.vsMatchup.player1.nickname,
                avatarIndex: game.vsMatchup.player1.avatarIndex,
              }}
              player2={{
                nickname: game.vsMatchup.player2.nickname,
                avatarIndex: game.vsMatchup.player2.avatarIndex,
              }}
              challengeTitle={game.vsMatchup.challengeTitle}
            />
          )}
        </AnimatePresence>

        {/* Challenge Display (CHALLENGE_ACTIVE or SUBMISSIONS_CLOSED) */}
        {(game.phase === "CHALLENGE_ACTIVE" ||
          game.phase === "SUBMISSIONS_CLOSED" ||
          (game.phase === "COUNTDOWN" && !showCountdownOverlay)) &&
          challenge && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-4"
            >
              <ChallengeCard
                title={challenge.title}
                shortDescription={challenge.shortDescription || ""}
                fullInstructions={challenge.fullInstructions || ""}
                submissionType={(challenge.submissionType || "completion_tap") as SubmissionType}
                durationSeconds={challenge.durationSeconds || 60}
                movementLevel={"seated" as MovementLevel}
                noiseLevel={"quiet" as NoiseLevel}
                category=""
              />

              {/* Submission Panel or Time's Up */}
              {game.phase === "SUBMISSIONS_CLOSED" && challengePhase !== "submitted" ? (
                <RetroCard glow="pink" padding="md" className="text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 12 }}
                  >
                    <h3
                      className="font-retro text-lg text-retro-pink mb-2"
                      style={{
                        textShadow: "0 0 12px rgba(255,45,120,0.5)",
                      }}
                    >
                      TIME&apos;S UP!
                    </h3>
                    <p className="font-body text-sm text-retro-muted">
                      Calculating scores...
                    </p>
                  </motion.div>
                </RetroCard>
              ) : challengePhase === "submitted" ? (
                <RetroCard glow="green" padding="md" className="text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-3 py-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                      }}
                      className="w-14 h-14 bg-retro-green/20 border-2 border-retro-green flex items-center justify-center"
                      style={{
                        boxShadow: "0 0 24px rgba(57,255,20,0.3)",
                      }}
                    >
                      <span className="font-retro text-xl text-retro-green">
                        {"\u2714"}
                      </span>
                    </motion.div>
                    <p className="font-retro text-xs text-retro-green">
                      SUBMITTED!
                    </p>
                    <p className="font-body text-xs text-retro-muted">
                      Waiting for results...
                    </p>
                    <div className="flex gap-1.5 mt-2">
                      <div
                        className="w-1.5 h-1.5 bg-retro-green animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-1.5 h-1.5 bg-retro-green animate-bounce"
                        style={{ animationDelay: "200ms" }}
                      />
                      <div
                        className="w-1.5 h-1.5 bg-retro-green animate-bounce"
                        style={{ animationDelay: "400ms" }}
                      />
                    </div>
                  </motion.div>
                </RetroCard>
              ) : (
                <SubmissionPanel
                  submissionType={(challenge.submissionType || "completion_tap") as SubmissionType}
                  onSubmit={handleSubmit}
                  disabled={
                    game.phase !== "CHALLENGE_ACTIVE" ||
                    game.hasSubmitted ||
                    isExpired
                  }
                  participants={game.participants.map((p) => ({
                    id: p.id,
                    nickname: p.nickname,
                    avatarIndex: p.avatarIndex,
                  }))}
                />
              )}
            </motion.div>
          )}

        {/* SCORE_REVEAL */}
        {game.phase === "SCORE_REVEAL" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            <ScoreReveal
              breakdown={
                game.lastScoreBreakdown || {
                  completion: 0,
                  speed: 0,
                  quality: 0,
                  crowd: 0,
                  teamwork: 0,
                  total: 0,
                }
              }
              newRank={myEntry?.rank || 0}
              previousRank={myEntry?.previousRank ?? null}
              totalScore={myEntry?.score || 0}
            />

            {/* Mini leaderboard peek */}
            <RetroCard glow="gold" padding="none">
              <div className="bg-elevated/80 px-4 py-2.5 border-b border-retro-purple/20">
                <h4 className="font-retro text-[9px] text-retro-gold uppercase tracking-wider">
                  Standings
                </h4>
              </div>
              <div className="divide-y divide-retro-purple/10">
                {game.leaderboard
                  .sort((a, b) => a.rank - b.rank)
                  .slice(0, 5)
                  .map((entry) => {
                    const isMe =
                      entry.participantId === stored?.participantId;
                    return (
                      <div
                        key={entry.participantId}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2",
                          isMe && "bg-retro-purple/10"
                        )}
                      >
                        <span className="font-retro text-[9px] text-retro-muted w-6">
                          #{entry.rank}
                        </span>
                        <span
                          className={cn(
                            "font-retro text-[9px] flex-1 truncate",
                            isMe
                              ? "text-retro-purple-light"
                              : "text-retro-text"
                          )}
                        >
                          {entry.nickname}
                          {isMe && " (you)"}
                        </span>
                        <span className="font-retro text-[9px] text-retro-gold tabular-nums">
                          {entry.score}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </RetroCard>

            {/* Waiting for next round */}
            <div className="text-center py-2">
              <p className="font-retro text-[9px] text-retro-muted uppercase tracking-wider">
                Waiting for next round...
              </p>
            </div>
          </motion.div>
        )}

        {/* LOBBY fallback */}
        {game.phase === "LOBBY" && (
          <div className="flex-1 flex items-center justify-center">
            <RetroCard glow="purple" padding="lg" className="text-center max-w-sm">
              <h2 className="font-retro text-sm text-retro-purple-light mb-3">
                WAITING
              </h2>
              <p className="font-body text-sm text-retro-muted">
                The game has not started yet. You will be redirected
                automatically when the host starts the game.
              </p>
            </RetroCard>
          </div>
        )}
      </div>
    </div>
  );
}
