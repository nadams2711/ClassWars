"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GroupTimerProps {
  activity: string;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

type Phase = "idle" | "countdown" | "running" | "done";

export function GroupTimer({ activity, onSubmit, disabled = false }: GroupTimerProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdownNum, setCountdownNum] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);
  const animRef = useRef<number>(0);

  // Countdown before start
  const handleStart = useCallback(() => {
    if (disabled) return;
    setPhase("countdown");
    setCountdownNum(3);
    let c = 3;
    const interval = setInterval(() => {
      c--;
      if (c <= 0) {
        clearInterval(interval);
        setPhase("running");
        startRef.current = Date.now();
      } else {
        setCountdownNum(c);
      }
    }, 1000);
  }, [disabled]);

  // Update elapsed time while running
  useEffect(() => {
    if (phase !== "running") return;
    const tick = () => {
      setElapsed(Date.now() - startRef.current);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  const handleStop = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    const finalTime = Date.now() - startRef.current;
    setElapsed(finalTime);
    setPhase("done");
    const seconds = (finalTime / 1000).toFixed(2);
    onSubmit(JSON.stringify({ type: "group_timer", activity, timeMs: finalTime, timeSeconds: seconds }));
  }, [activity, onSubmit]);

  const formatTime = (ms: number) => {
    const totalSecs = ms / 1000;
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    const centis = Math.floor((totalSecs % 1) * 100);
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, "0")}.${centis.toString().padStart(2, "0")}`;
    }
    return `${secs}.${centis.toString().padStart(2, "0")}`;
  };

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="font-retro text-4xl text-retro-green tabular-nums"
          style={{ textShadow: "0 0 20px rgba(57,255,20,0.5)" }}
        >
          {formatTime(elapsed)}
        </motion.div>
        <p className="font-retro text-[10px] text-retro-green uppercase tracking-wider">
          TIME RECORDED!
        </p>
      </div>
    );
  }

  if (phase === "countdown") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <motion.div
          key={countdownNum}
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-retro text-6xl text-retro-gold"
          style={{ textShadow: "0 0 30px rgba(255,215,0,0.6)" }}
        >
          {countdownNum}
        </motion.div>
        <p className="font-retro text-xs text-retro-gold uppercase tracking-wider animate-pulse">
          GET READY!
        </p>
      </div>
    );
  }

  if (phase === "running") {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        {/* Live timer */}
        <motion.div
          className="font-retro text-5xl text-retro-green tabular-nums"
          style={{ textShadow: "0 0 20px rgba(57,255,20,0.4)" }}
        >
          {formatTime(elapsed)}
        </motion.div>

        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="flex items-center gap-2"
        >
          <div className="w-3 h-3 rounded-full bg-retro-green" />
          <span className="font-retro text-[10px] text-retro-green uppercase tracking-wider">
            TIMER RUNNING
          </span>
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleStop}
          className={cn(
            "w-full max-w-xs py-6 font-retro text-lg uppercase tracking-wider",
            "bg-retro-pink text-white shadow-[0_6px_0_#8a1a3a]",
            "active:translate-y-1 active:shadow-[0_2px_0_#8a1a3a]"
          )}
        >
          STOP!
        </motion.button>
      </div>
    );
  }

  // Idle
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={handleStart}
        disabled={disabled}
        className={cn(
          "w-full max-w-xs py-8 font-retro text-sm uppercase tracking-wider transition-all",
          "bg-retro-green text-page shadow-[0_6px_0_#1a8a09]",
          "active:translate-y-1 active:shadow-[0_2px_0_#1a8a09]",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        START TIMER
      </motion.button>
      <p className="font-body text-xs text-retro-muted text-center">
        Tap start when your group begins, tap stop when finished!
      </p>
    </div>
  );
}
