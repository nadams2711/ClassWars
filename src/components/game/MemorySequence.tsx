"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MemorySequenceProps {
  sequenceLength: number;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

const COLORS = [
  { bg: "bg-retro-pink", glow: "rgba(255,45,120,0.6)", label: "pink" },
  { bg: "bg-retro-blue", glow: "rgba(0,212,255,0.6)", label: "blue" },
  { bg: "bg-retro-green", glow: "rgba(57,255,20,0.6)", label: "green" },
  { bg: "bg-retro-gold", glow: "rgba(255,215,0,0.6)", label: "gold" },
];

type Phase = "watching" | "replaying" | "result";

export function MemorySequence({ sequenceLength, onSubmit, disabled = false }: MemorySequenceProps) {
  const [phase, setPhase] = useState<Phase>("watching");
  const [sequence, setSequence] = useState<number[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(3);
  const [finished, setFinished] = useState(false);
  const [showingIndex, setShowingIndex] = useState(-1);
  const roundScores = useRef<number[]>([]);

  // Generate and show a sequence
  const startRound = useCallback((len: number) => {
    const seq = Array.from({ length: len }, () => Math.floor(Math.random() * 4));
    setSequence(seq);
    setPlayerInput([]);
    setPhase("watching");
    setShowingIndex(-1);

    // Flash each color in sequence
    let i = 0;
    const interval = setInterval(() => {
      if (i < seq.length) {
        setActiveIndex(seq[i]);
        setTimeout(() => setActiveIndex(null), 400);
        i++;
        setShowingIndex(i);
      } else {
        clearInterval(interval);
        setPhase("replaying");
        setShowingIndex(-1);
      }
    }, 700);

    return () => clearInterval(interval);
  }, []);

  // Start first round
  useEffect(() => {
    const cleanup = startRound(sequenceLength);
    return cleanup;
  }, []);

  const handleTap = useCallback(
    (colorIdx: number) => {
      if (phase !== "replaying" || disabled || finished) return;

      const newInput = [...playerInput, colorIdx];
      setPlayerInput(newInput);

      // Flash the tapped color
      setActiveIndex(colorIdx);
      setTimeout(() => setActiveIndex(null), 200);

      const pos = newInput.length - 1;

      // Check if correct so far
      if (newInput[pos] !== sequence[pos]) {
        // Wrong! Score what they got right
        const roundScore = pos;
        roundScores.current.push(roundScore);
        const total = roundScores.current.reduce((a, b) => a + b, 0);
        setScore(total);

        if (round >= totalRounds) {
          setFinished(true);
          setPhase("result");
          onSubmit(JSON.stringify({ type: "memory_sequence", scores: roundScores.current, total }));
        } else {
          setRound((r) => r + 1);
          setTimeout(() => startRound(sequenceLength + round), 1000);
        }
        return;
      }

      // Got the full sequence right!
      if (newInput.length === sequence.length) {
        const roundScore = sequence.length;
        roundScores.current.push(roundScore);
        const total = roundScores.current.reduce((a, b) => a + b, 0);
        setScore(total);

        if (round >= totalRounds) {
          setFinished(true);
          setPhase("result");
          onSubmit(JSON.stringify({ type: "memory_sequence", scores: roundScores.current, total, perfect: true }));
        } else {
          setRound((r) => r + 1);
          setTimeout(() => startRound(sequenceLength + round), 1000);
        }
      }
    },
    [phase, disabled, finished, playerInput, sequence, round, totalRounds, sequenceLength, onSubmit, startRound]
  );

  if (finished) {
    const maxPossible = Array.from({ length: totalRounds }, (_, i) => sequenceLength + i).reduce((a, b) => a + b, 0);
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="font-retro text-4xl text-retro-purple-light"
          style={{ textShadow: "0 0 20px rgba(168,85,247,0.5)" }}
        >
          {score}/{maxPossible}
        </motion.div>
        <p className="font-retro text-[10px] text-retro-purple-light uppercase tracking-wider">
          MEMORY SCORE!
        </p>
        <div className="flex gap-2">
          {roundScores.current.map((s, i) => (
            <span key={i} className="font-retro text-[9px] px-2 py-1 border border-retro-muted/20 text-retro-muted bg-elevated">
              R{i + 1}: {s}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      {/* Round + phase info */}
      <div className="flex items-center gap-3">
        <span className="font-retro text-[9px] text-retro-muted uppercase tracking-wider">
          Round {round}/{totalRounds}
        </span>
        {phase === "watching" && (
          <span className="font-retro text-[9px] text-retro-gold uppercase tracking-wider animate-pulse">
            WATCH!
          </span>
        )}
        {phase === "replaying" && (
          <span className="font-retro text-[9px] text-retro-green uppercase tracking-wider">
            YOUR TURN! {playerInput.length}/{sequence.length}
          </span>
        )}
      </div>

      {/* 2x2 color grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-[240px]">
        {COLORS.map((color, idx) => (
          <motion.button
            key={idx}
            whileTap={phase === "replaying" ? { scale: 0.9 } : undefined}
            onPointerDown={() => handleTap(idx)}
            disabled={phase !== "replaying" || disabled}
            className={cn(
              "aspect-square rounded-lg transition-all duration-150",
              color.bg,
              activeIndex === idx ? "opacity-100" : "opacity-50",
              phase !== "replaying" && "cursor-default"
            )}
            style={{
              boxShadow: activeIndex === idx ? `0 0 30px ${color.glow}` : "none",
            }}
          />
        ))}
      </div>

      {/* Progress dots */}
      {phase === "watching" && (
        <div className="flex gap-1.5">
          {sequence.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i < showingIndex ? "bg-retro-gold" : "bg-retro-muted/20"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
