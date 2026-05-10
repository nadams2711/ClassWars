"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShakeMeterProps {
  durationSeconds: number;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export function ShakeMeter({ durationSeconds, onSubmit, disabled = false }: ShakeMeterProps) {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [shakeScore, setShakeScore] = useState(0);
  const [peak, setPeak] = useState(0);
  const lastAccel = useRef({ x: 0, y: 0, z: 0 });
  const scoreRef = useRef(0);
  const peakRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Accelerometer handler
  useEffect(() => {
    if (!started || finished) return;

    const handleMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a || a.x === null || a.y === null || a.z === null) return;

      const dx = Math.abs(a.x - lastAccel.current.x);
      const dy = Math.abs(a.y - lastAccel.current.y);
      const dz = Math.abs(a.z - lastAccel.current.z);
      const delta = dx + dy + dz;

      lastAccel.current = { x: a.x, y: a.y, z: a.z };

      if (delta > 3) {
        const points = Math.round(delta);
        scoreRef.current += points;
        setShakeScore(scoreRef.current);
        if (delta > peakRef.current) {
          peakRef.current = delta;
          setPeak(Math.round(delta));
        }
      }
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [started, finished]);

  // Countdown timer
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

  // Finish when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && started && !finished) {
      setFinished(true);
      onSubmit(
        JSON.stringify({
          type: "shake_meter",
          score: scoreRef.current,
          peak: Math.round(peakRef.current),
        })
      );
    }
  }, [timeLeft, started, finished, onSubmit]);

  // Fallback for desktop (no accelerometer) -- tap to add shake points
  const handleManualShake = useCallback(() => {
    if (!started || finished || disabled) return;
    scoreRef.current += 5;
    setShakeScore(scoreRef.current);
    if (5 > peakRef.current) {
      peakRef.current = 5;
      setPeak(5);
    }
  }, [started, finished, disabled]);

  const handleStart = useCallback(() => {
    if (disabled) return;

    // Request permission on iOS
    if (typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === "function") {
      (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> })
        .requestPermission()
        .then((state) => {
          if (state === "granted") setStarted(true);
        })
        .catch(() => setStarted(true));
    } else {
      setStarted(true);
    }
  }, [disabled]);

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="font-retro text-4xl text-retro-gold"
          style={{ textShadow: "0 0 20px rgba(255,215,0,0.5)" }}
        >
          {shakeScore}
        </motion.div>
        <p className="font-retro text-[10px] text-retro-gold uppercase tracking-wider">
          SHAKE SCORE!
        </p>
        <p className="font-body text-xs text-retro-muted">
          Peak intensity: {peak}
        </p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleStart}
          disabled={disabled}
          className={cn(
            "w-full max-w-xs py-8 font-retro text-sm uppercase tracking-wider transition-all",
            "bg-retro-gold text-page shadow-[0_6px_0_#8a6d00]",
            "active:translate-y-1 active:shadow-[0_2px_0_#8a6d00]",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          START SHAKING!
        </motion.button>
        <p className="font-body text-xs text-retro-muted text-center">
          Hold your phone and shake it like crazy for {durationSeconds} seconds!
        </p>
      </div>
    );
  }

  // Meter fill based on score
  const meterFill = Math.min(100, (shakeScore / 500) * 100);

  return (
    <div className="flex flex-col items-center gap-4 py-2" onPointerDown={handleManualShake}>
      {/* Score */}
      <motion.div
        key={shakeScore}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        className="font-retro text-4xl text-retro-gold tabular-nums"
        style={{ textShadow: "0 0 20px rgba(255,215,0,0.4)" }}
      >
        {shakeScore}
      </motion.div>

      {/* Timer */}
      <div className="font-retro text-xs text-retro-muted tabular-nums">
        {timeLeft}s LEFT
      </div>

      {/* Shake meter bar */}
      <div className="w-full max-w-xs h-8 border-2 border-retro-gold/40 bg-page/60 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-retro-gold to-retro-pink"
          animate={{ width: `${meterFill}%` }}
          transition={{ duration: 0.15 }}
        />
      </div>

      {/* Instructions */}
      <motion.p
        animate={{ x: [-2, 2, -2, 2, 0] }}
        transition={{ duration: 0.2, repeat: Infinity }}
        className="font-retro text-[10px] text-retro-gold uppercase tracking-wider"
      >
        KEEP SHAKING!
      </motion.p>

      <p className="font-body text-[10px] text-retro-muted/60 text-center">
        No accelerometer? Tap the screen rapidly instead!
      </p>
    </div>
  );
}
