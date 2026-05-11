"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatTimer } from "@/lib/utils";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { WinnerPicker } from "@/components/game/WinnerPicker";
import { useCountdown } from "@/hooks/useCountdown";
import type { GamePhase, Participant } from "@/types/game";

interface GameControllerProps {
  eventId: string;
  gameState: {
    phase: GamePhase;
    currentRound: number;
    totalRounds: number;
    currentChallenge: {
      title: string;
      shortDescription: string;
      fullInstructions: string;
      durationSeconds: number;
      submissionType: string;
      scoringType?: string;
    } | null;
    timerEnd: string | null;
    participants: Participant[];
    leaderboard: { participantId: string; nickname: string; score: number; rank: number }[];
  };
}

const phaseConfig: Record<
  string,
  { label: string; color: string; glow: string }
> = {
  LOBBY: {
    label: "LOBBY",
    color: "text-retro-blue",
    glow: "shadow-[0_0_12px_rgba(0,212,255,0.4)]",
  },
  COUNTDOWN: {
    label: "COUNTDOWN",
    color: "text-retro-gold",
    glow: "shadow-[0_0_12px_rgba(255,215,0,0.4)]",
  },
  CHALLENGE_ACTIVE: {
    label: "CHALLENGE ACTIVE",
    color: "text-retro-green",
    glow: "shadow-[0_0_12px_rgba(57,255,20,0.4)]",
  },
  SUBMISSIONS_CLOSED: {
    label: "SUBMISSIONS CLOSED",
    color: "text-retro-pink",
    glow: "shadow-[0_0_12px_rgba(255,45,120,0.4)]",
  },
  JUDGING: {
    label: "JUDGING",
    color: "text-retro-gold",
    glow: "shadow-[0_0_12px_rgba(255,215,0,0.4)]",
  },
  SCORE_REVEAL: {
    label: "SCORE REVEAL",
    color: "text-retro-purple-light",
    glow: "shadow-[0_0_12px_rgba(168,85,247,0.4)]",
  },
  VS_SCREEN: {
    label: "VS MATCHUP",
    color: "text-retro-pink",
    glow: "shadow-[0_0_12px_rgba(255,45,120,0.4)]",
  },
  FINAL_RESULTS: {
    label: "FINAL RESULTS",
    color: "text-retro-gold",
    glow: "shadow-[0_0_12px_rgba(255,215,0,0.4)]",
  },
  PODIUM: {
    label: "PODIUM",
    color: "text-retro-gold",
    glow: "shadow-[0_0_12px_rgba(255,215,0,0.4)]",
  },
};

/** Derive scoringType from submissionType when the server doesn't provide one */
function deriveScoringType(submissionType: string): string {
  switch (submissionType) {
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

async function apiAction(eventId: string, action: string, body?: Record<string, unknown>) {
  const res = await fetch(`/api/events/${eventId}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Action failed");
  }
  return res.json();
}

export function GameController({ eventId, gameState }: GameControllerProps) {
  const {
    phase,
    currentRound,
    totalRounds,
    currentChallenge,
    timerEnd,
    participants,
  } = gameState;

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Timer countdown
  const { secondsLeft } = useCountdown(timerEnd);

  const readyCount = participants.filter((p) => p.isReady).length;
  const connectedCount = participants.filter((p) => p.isConnected).length;
  const canStart = participants.length >= 2 && readyCount >= 2;

  const handleAction = async (action: string, body?: Record<string, unknown>) => {
    setActionLoading(action);
    setError(null);
    try {
      await apiAction(eventId, action, body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const phaseInfo = phaseConfig[phase] || phaseConfig.LOBBY;

  return (
    <div className="space-y-6">
      {/* Phase badge */}
      <div className="flex items-center justify-center">
        <span
          className={cn(
            "font-retro text-[10px] uppercase tracking-widest px-4 py-2 bg-card border border-retro-purple/30",
            phaseInfo.color,
            phaseInfo.glow
          )}
        >
          {phaseInfo.label}
        </span>
      </div>

      {/* Round indicator */}
      {totalRounds > 0 && (
        <div className="text-center">
          <span className="font-retro text-[10px] text-retro-muted">
            ROUND {currentRound} OF {totalRounds}
          </span>
        </div>
      )}

      {/* Timer display */}
      {timerEnd && phase === "CHALLENGE_ACTIVE" && (
        <div className="text-center">
          <div
            className={cn(
              "inline-block font-retro text-4xl tabular-nums px-6 py-3",
              secondsLeft <= 10
                ? "text-retro-pink animate-pulse"
                : secondsLeft <= 30
                  ? "text-retro-gold"
                  : "text-retro-green"
            )}
          >
            {formatTimer(Math.max(0, secondsLeft))}
          </div>
        </div>
      )}

      {/* Current challenge display */}
      {currentChallenge && phase !== "LOBBY" && (
        <RetroCard glow="purple" padding="md">
          <h3 className="font-retro text-xs text-retro-purple-light mb-2">
            {currentChallenge.title}
          </h3>
          <p className="font-body text-sm text-retro-text/80 mb-2">
            {currentChallenge.shortDescription}
          </p>
          <p className="font-body text-xs text-retro-muted">
            {currentChallenge.fullInstructions}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <span className="font-retro text-[8px] text-retro-muted bg-elevated px-2 py-1 border border-retro-muted/20">
              {currentChallenge.durationSeconds}s
            </span>
            <span className="font-retro text-[8px] text-retro-muted bg-elevated px-2 py-1 border border-retro-muted/20">
              {currentChallenge.submissionType.replace(/_/g, " ")}
            </span>
          </div>
        </RetroCard>
      )}

      {/* Error display */}
      {error && (
        <div className="font-retro text-[10px] text-retro-pink text-center bg-retro-pink/10 border border-retro-pink/30 px-4 py-2">
          {error}
        </div>
      )}

      {/* Phase-specific controls */}
      <div className="space-y-3">
        {/* LOBBY phase */}
        {phase === "LOBBY" && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="font-body text-sm text-retro-muted mb-1">
                {connectedCount} player{connectedCount !== 1 ? "s" : ""} connected
                {" / "}
                {readyCount} ready
              </p>
              {!canStart && (
                <p className="font-retro text-[9px] text-retro-muted/60">
                  Need at least 2 ready players to start
                </p>
              )}
            </div>
            <div className="flex justify-center">
              <RetroButton
                variant="success"
                size="lg"
                onClick={() => handleAction("start_game")}
                disabled={!canStart || actionLoading === "start_game"}
              >
                {actionLoading === "start_game" ? "STARTING..." : "START GAME"}
              </RetroButton>
            </div>
          </div>
        )}

        {/* CHALLENGE_ACTIVE phase */}
        {phase === "CHALLENGE_ACTIVE" && (
          <div className="flex justify-center gap-3">
            <RetroButton
              variant="secondary"
              size="md"
              onClick={() => handleAction("pause_game")}
              disabled={actionLoading === "pause_game"}
            >
              {actionLoading === "pause_game" ? "..." : "PAUSE"}
            </RetroButton>
            <RetroButton
              variant="danger"
              size="md"
              onClick={() => handleAction("skip_challenge")}
              disabled={actionLoading === "skip_challenge"}
            >
              {actionLoading === "skip_challenge" ? "..." : "SKIP"}
            </RetroButton>
          </div>
        )}

        {/* SUBMISSIONS_CLOSED phase — show buttons based on scoring type */}
        {phase === "SUBMISSIONS_CLOSED" && (() => {
          const scoring = currentChallenge?.scoringType
            || (currentChallenge ? deriveScoringType(currentChallenge.submissionType) : "completion");
          const showReveal = scoring === "completion" || scoring === "speed" || scoring === "vote" || scoring === "hybrid";
          const showJudge = scoring === "judge" || scoring === "hybrid";
          return (
            <div className="flex justify-center gap-3">
              {showReveal && (
                <RetroButton
                  variant="gold"
                  size="lg"
                  onClick={() => handleAction("reveal_scores")}
                  disabled={!!actionLoading}
                >
                  {actionLoading === "reveal_scores" ? "REVEALING..." : "REVEAL SCORES"}
                </RetroButton>
              )}
              {showJudge && (
                <RetroButton
                  variant="primary"
                  size="lg"
                  onClick={() => handleAction("enter_judging")}
                  disabled={!!actionLoading}
                >
                  {actionLoading === "enter_judging" ? "..." : "PICK WINNERS"}
                </RetroButton>
              )}
            </div>
          );
        })()}

        {/* JUDGING phase — inline Winner Picker */}
        {phase === "JUDGING" && (
          <WinnerPicker
            participants={participants}
            actionLoading={actionLoading}
            onConfirm={(first, second, third) =>
              handleAction("pick_winners", { first, second, third })
            }
          />
        )}

        {/* SCORE_REVEAL phase */}
        {phase === "SCORE_REVEAL" && (
          <div className="flex flex-wrap justify-center gap-3">
            {currentRound < totalRounds ? (
              <RetroButton
                variant="primary"
                size="lg"
                onClick={() => handleAction("next_round")}
                disabled={actionLoading === "next_round"}
              >
                {actionLoading === "next_round" ? "..." : "NEXT ROUND"}
              </RetroButton>
            ) : (
              <RetroButton
                variant="gold"
                size="lg"
                onClick={() => handleAction("end_game")}
                disabled={actionLoading === "end_game"}
              >
                {actionLoading === "end_game" ? "..." : "END GAME"}
              </RetroButton>
            )}
          </div>
        )}

        {/* FINAL_RESULTS / PODIUM phase */}
        {(phase === "FINAL_RESULTS" || phase === "PODIUM") && (
          <div className="space-y-4">
            <h3
              className="font-retro text-sm text-retro-gold uppercase tracking-widest text-center"
              style={{ textShadow: "0 0 12px rgba(255,215,0,0.5)" }}
            >
              GAME OVER
            </h3>

            {/* Podium - top 3 */}
            {gameState.leaderboard.length > 0 && (
              <div className="space-y-2">
                {gameState.leaderboard
                  .sort((a, b) => a.rank - b.rank)
                  .slice(0, 3)
                  .map((entry) => {
                    const placeLabel = entry.rank === 1 ? "1ST" : entry.rank === 2 ? "2ND" : "3RD";
                    const placeColor =
                      entry.rank === 1
                        ? "text-retro-gold border-retro-gold/40 bg-retro-gold/10"
                        : entry.rank === 2
                          ? "text-retro-blue border-retro-blue/40 bg-retro-blue/10"
                          : "text-retro-green border-retro-green/40 bg-retro-green/10";
                    return (
                      <div
                        key={entry.participantId}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 border",
                          placeColor
                        )}
                      >
                        <span className="font-retro text-xs w-8">{placeLabel}</span>
                        <span className="font-retro text-[10px] flex-1 truncate text-retro-text">
                          {entry.nickname}
                        </span>
                        <span className="font-retro text-xs tabular-nums">{entry.score} pts</span>
                      </div>
                    );
                  })}

                {/* Remaining players */}
                {gameState.leaderboard.length > 3 && (
                  <div className="space-y-1 pt-1">
                    {gameState.leaderboard
                      .sort((a, b) => a.rank - b.rank)
                      .slice(3)
                      .map((entry) => (
                        <div
                          key={entry.participantId}
                          className="flex items-center gap-3 px-4 py-1.5 text-retro-muted"
                        >
                          <span className="font-retro text-[9px] w-8">#{entry.rank}</span>
                          <span className="font-retro text-[9px] flex-1 truncate">
                            {entry.nickname}
                          </span>
                          <span className="font-retro text-[9px] tabular-nums">{entry.score}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* No scores yet */}
            {gameState.leaderboard.length === 0 && (
              <div className="text-center py-4">
                <p className="font-retro text-[10px] text-retro-muted">
                  No scores recorded
                </p>
              </div>
            )}

            <div className="flex justify-center pt-2">
              <RetroButton
                variant="secondary"
                size="md"
                onClick={() => handleAction("end_game")}
                disabled={actionLoading === "end_game"}
              >
                {actionLoading === "end_game" ? "..." : "BACK TO LOBBY"}
              </RetroButton>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      {phase !== "LOBBY" &&
        phase !== "FINAL_RESULTS" &&
        phase !== "PODIUM" && (
          <div className="border-t border-retro-purple/10 pt-4">
            <p className="font-retro text-[8px] text-retro-muted/50 uppercase tracking-widest mb-3 text-center">
              Quick Actions
            </p>
            <div className="flex justify-center gap-2">
              <RetroButton
                variant="secondary"
                size="sm"
                onClick={() => handleAction("pause_game")}
                disabled={!!actionLoading}
              >
                PAUSE
              </RetroButton>
              <RetroButton
                variant="secondary"
                size="sm"
                onClick={() => handleAction("skip_challenge")}
                disabled={!!actionLoading}
              >
                SKIP
              </RetroButton>
              <RetroButton
                variant="danger"
                size="sm"
                onClick={() => handleAction("end_game")}
                disabled={!!actionLoading}
              >
                END
              </RetroButton>
            </div>
          </div>
        )}

      {/* Player list */}
      <div className="border-t border-retro-purple/10 pt-4">
        <p className="font-retro text-[8px] text-retro-muted/50 uppercase tracking-widest mb-3">
          PLAYERS ({participants.length})
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
          {participants.map((p) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 bg-elevated border",
                p.isConnected
                  ? p.isReady
                    ? "border-retro-green/30"
                    : "border-retro-blue/20"
                  : "border-retro-muted/10 opacity-50"
              )}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  p.isConnected
                    ? p.isReady
                      ? "bg-retro-green"
                      : "bg-retro-blue"
                    : "bg-retro-muted/30"
                )}
              />
              <span className="font-body text-xs text-retro-text truncate">
                {p.nickname}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
