"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltTargetProps {
  rounds: number;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export function TiltTarget({ rounds, onSubmit, disabled = false }: TiltTargetProps) {
  const [started, setStarted] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [finished, setFinished] = useState(false);
  const [ballPos, setBallPos] = useState({ x: 50, y: 50 });
  const [targetPos, setTargetPos] = useState({ x: 75, y: 25 });
  const [hits, setHits] = useState(0);
  const [roundStart, setRoundStart] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const ballPosRef = useRef({ x: 50, y: 50 });
  const animRef = useRef<number>(0);

  // Generate random target position (not too close to edges)
  const newTarget = useCallback(() => {
    return {
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 70,
    };
  }, []);

  // Check if ball is on target
  const checkHit = useCallback((bx: number, by: number, tx: number, ty: number) => {
    const dist = Math.sqrt((bx - tx) ** 2 + (by - ty) ** 2);
    return dist < 12;
  }, []);

  // Handle device orientation
  useEffect(() => {
    if (!started || finished) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0; // left-right tilt (-90 to 90)
      const beta = e.beta ?? 0; // front-back tilt (-180 to 180)

      const newX = Math.max(5, Math.min(95, 50 + gamma * 1.2));
      const newY = Math.max(5, Math.min(95, 50 + (beta - 30) * 1.0));

      ballPosRef.current = { x: newX, y: newY };
    };

    // Request permission on iOS
    if (typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === "function") {
      (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> })
        .requestPermission()
        .catch(() => {});
    }

    window.addEventListener("deviceorientation", handleOrientation);

    // Animation loop to update React state at ~30fps
    const update = () => {
      setBallPos({ ...ballPosRef.current });
      animRef.current = requestAnimationFrame(update);
    };
    animRef.current = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      cancelAnimationFrame(animRef.current);
    };
  }, [started, finished]);

  // Check for hits
  useEffect(() => {
    if (!started || finished) return;
    if (checkHit(ballPos.x, ballPos.y, targetPos.x, targetPos.y)) {
      const elapsed = Date.now() - roundStart;
      const newTimes = [...times, elapsed];
      setTimes(newTimes);
      setHits((h) => h + 1);

      if (currentRound + 1 >= rounds) {
        setFinished(true);
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length);
        onSubmit(JSON.stringify({ type: "tilt_target", hits: rounds, times: newTimes, avgMs: avg }));
      } else {
        setCurrentRound((r) => r + 1);
        setTargetPos(newTarget());
        setRoundStart(Date.now());
      }
    }
  }, [ballPos, targetPos, started, finished, currentRound, rounds, roundStart, times, checkHit, newTarget, onSubmit]);

  // Desktop fallback: drag/touch to move ball
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!started || finished || disabled) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      ballPosRef.current = { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
      setBallPos(ballPosRef.current);
    },
    [started, finished, disabled]
  );

  const handleStart = useCallback(() => {
    if (disabled) return;
    setStarted(true);
    setTargetPos(newTarget());
    setRoundStart(Date.now());
  }, [disabled, newTarget]);

  if (finished) {
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="font-retro text-3xl text-retro-blue"
          style={{ textShadow: "0 0 20px rgba(0,212,255,0.5)" }}
        >
          {avg}ms avg
        </motion.div>
        <p className="font-retro text-[10px] text-retro-blue uppercase tracking-wider">
          {hits}/{rounds} TARGETS HIT!
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
            "bg-retro-blue text-white shadow-[0_6px_0_#1a4a8a]",
            "active:translate-y-1 active:shadow-[0_2px_0_#1a4a8a]",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          START TILTING!
        </motion.button>
        <p className="font-body text-xs text-retro-muted text-center">
          Tilt your phone to move the ball into the target! On desktop, drag to move.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <p className="font-retro text-[9px] text-retro-muted uppercase tracking-wider">
        Target {currentRound + 1} / {rounds}
      </p>

      {/* Game area */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        className="relative w-full border-2 border-retro-blue/30 bg-page/60 touch-none cursor-crosshair"
        style={{ maxWidth: 280, aspectRatio: "1" }}
      >
        {/* Target */}
        <motion.div
          key={`${targetPos.x}-${targetPos.y}`}
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute w-8 h-8 rounded-full border-2 border-retro-green"
          style={{
            left: `${targetPos.x}%`,
            top: `${targetPos.y}%`,
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 20px rgba(57,255,20,0.4)",
            backgroundColor: "rgba(57,255,20,0.15)",
          }}
        />

        {/* Ball */}
        <div
          className="absolute w-5 h-5 rounded-full bg-retro-blue"
          style={{
            left: `${ballPos.x}%`,
            top: `${ballPos.y}%`,
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 12px rgba(0,212,255,0.6)",
          }}
        />
      </div>

      <p className="font-body text-[10px] text-retro-muted/60 text-center">
        Tilt phone or drag to move the blue ball into the green target
      </p>
    </div>
  );
}
