"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ReactionTimeProps {
  rounds: number;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

type RoundState = "waiting" | "ready" | "go" | "tapped" | "too_early";

export function ReactionTime({ rounds, onSubmit, disabled = false }: ReactionTimeProps) {
  const [currentRound, setCurrentRound] = useState(0);
  const [roundState, setRoundState] = useState<RoundState>("waiting");
  const [times, setTimes] = useState<number[]>([]);
  const [goTimestamp, setGoTimestamp] = useState(0);
  const [lastReaction, setLastReaction] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRound = useCallback(() => {
    setRoundState("ready");
    setLastReaction(null);
    // Random delay 1.5-4 seconds
    const delay = 1500 + Math.random() * 2500;
    timerRef.current = setTimeout(() => {
      setRoundState("go");
      setGoTimestamp(Date.now());
    }, delay);
  }, []);

  useEffect(() => {
    if (currentRound === 0 && !finished) {
      // Start first round after a brief pause
      const t = setTimeout(() => startRound(), 800);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleTap = useCallback(() => {
    if (disabled || finished) return;

    if (roundState === "waiting") {
      startRound();
      return;
    }

    if (roundState === "ready") {
      // Tapped too early!
      if (timerRef.current) clearTimeout(timerRef.current);
      setRoundState("too_early");
      setTimeout(() => {
        startRound();
      }, 1200);
      return;
    }

    if (roundState === "go") {
      const reactionMs = Date.now() - goTimestamp;
      setLastReaction(reactionMs);
      const newTimes = [...times, reactionMs];
      setTimes(newTimes);
      setRoundState("tapped");

      const nextRound = currentRound + 1;

      if (nextRound >= rounds) {
        // All rounds done
        setFinished(true);
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length);
        const best = Math.min(...newTimes);
        onSubmit(JSON.stringify({ type: "reaction_time", times: newTimes, avgMs: avg, bestMs: best }));
      } else {
        setCurrentRound(nextRound);
        setTimeout(() => startRound(), 1500);
      }
    }
  }, [disabled, finished, roundState, goTimestamp, times, currentRound, rounds, onSubmit, startRound]);

  if (finished) {
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const best = Math.min(...times);
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="font-retro text-3xl text-retro-green"
          style={{ textShadow: "0 0 20px rgba(57,255,20,0.5)" }}
        >
          {avg}ms
        </motion.div>
        <p className="font-retro text-[10px] text-retro-green uppercase tracking-wider">
          AVERAGE REACTION TIME
        </p>
        <p className="font-body text-xs text-retro-muted">
          Best: {best}ms
        </p>
        <div className="flex gap-2 mt-2">
          {times.map((t, i) => (
            <span
              key={i}
              className={cn(
                "font-retro text-[9px] px-2 py-1 border",
                t === best
                  ? "border-retro-green/50 text-retro-green bg-retro-green/10"
                  : "border-retro-muted/20 text-retro-muted bg-elevated"
              )}
            >
              {t}ms
            </span>
          ))}
        </div>
      </div>
    );
  }

  const bgColor =
    roundState === "go"
      ? "bg-retro-green"
      : roundState === "too_early"
        ? "bg-retro-pink"
        : roundState === "ready"
          ? "bg-retro-pink/80"
          : "bg-retro-purple";

  const label =
    roundState === "go"
      ? "TAP NOW!"
      : roundState === "too_early"
        ? "TOO EARLY!"
        : roundState === "ready"
          ? "WAIT..."
          : roundState === "tapped"
            ? `${lastReaction}ms`
            : "TAP TO START";

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      {/* Round indicator */}
      <div className="flex gap-1.5">
        {Array.from({ length: rounds }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-3 h-3 border transition-all",
              i < currentRound
                ? "bg-retro-green border-retro-green"
                : i === currentRound
                  ? "bg-retro-purple border-retro-purple animate-pulse"
                  : "bg-elevated border-retro-muted/30"
            )}
          />
        ))}
      </div>

      <p className="font-retro text-[9px] text-retro-muted uppercase tracking-wider">
        Round {currentRound + 1} / {rounds}
      </p>

      {/* Main tap area */}
      <motion.button
        whileTap={roundState === "go" ? { scale: 0.9 } : undefined}
        onPointerDown={handleTap}
        disabled={disabled}
        className={cn(
          "w-full max-w-xs py-12 font-retro text-lg uppercase tracking-wider transition-all duration-150 select-none",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          bgColor,
          "text-white"
        )}
        style={{
          boxShadow:
            roundState === "go"
              ? "0 0 40px rgba(57,255,20,0.5), 0 6px 0 #1a8a09"
              : roundState === "too_early"
                ? "0 0 30px rgba(255,45,120,0.4)"
                : "0 6px 0 #4c1d95",
        }}
      >
        {label}
      </motion.button>

      {roundState === "ready" && (
        <p className="font-body text-xs text-retro-pink text-center animate-pulse">
          Wait for green...
        </p>
      )}
    </div>
  );
}
