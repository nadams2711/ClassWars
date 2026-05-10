"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TapFrenzyProps {
  durationSeconds: number;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export function TapFrenzy({ durationSeconds, onSubmit, disabled = false }: TapFrenzyProps) {
  const [count, setCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!started || finished) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [started, finished]);

  useEffect(() => {
    if (timeLeft === 0 && started && !finished) {
      setFinished(true);
      onSubmit(JSON.stringify({ type: "tap_frenzy", taps: count }));
    }
  }, [timeLeft, started, finished, count, onSubmit]);

  const handleTap = useCallback(() => {
    if (disabled || finished) return;
    if (!started) {
      setStarted(true);
    }
    setCount((c) => c + 1);
  }, [disabled, finished, started]);

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="font-retro text-4xl text-retro-green"
          style={{ textShadow: "0 0 20px rgba(57,255,20,0.5)" }}
        >
          {count}
        </motion.div>
        <p className="font-retro text-[10px] text-retro-green uppercase tracking-wider">
          TAPS RECORDED!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      {/* Counter */}
      <motion.div
        key={count}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        className="font-retro text-5xl text-retro-pink tabular-nums"
        style={{ textShadow: "0 0 20px rgba(255,45,120,0.4)" }}
      >
        {count}
      </motion.div>

      {/* Timer */}
      {started && (
        <div className="font-retro text-xs text-retro-muted tabular-nums">
          {timeLeft}s LEFT
        </div>
      )}

      {/* Tap button */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onPointerDown={handleTap}
        disabled={disabled}
        className={cn(
          "w-full max-w-xs py-10 font-retro text-lg uppercase tracking-wider transition-colors select-none",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          started
            ? "bg-retro-pink text-white shadow-[0_6px_0_#8a1a3a] active:shadow-[0_2px_0_#8a1a3a] active:translate-y-1"
            : "bg-retro-purple text-white shadow-[0_6px_0_#4c1d95] active:shadow-[0_2px_0_#4c1d95] active:translate-y-1"
        )}
        style={{ boxShadow: started ? "0 6px 0 #8a1a3a, 0 0 30px rgba(255,45,120,0.3)" : undefined }}
      >
        {started ? "TAP! TAP! TAP!" : "TAP TO START!"}
      </motion.button>

      {!started && (
        <p className="font-body text-xs text-retro-muted text-center">
          First tap starts the {durationSeconds}s countdown!
        </p>
      )}
    </div>
  );
}
