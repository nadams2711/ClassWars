"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import { PIXEL_AVATAR_COLORS } from "./PixelAvatar";
import { cn } from "@/lib/utils";

interface PodiumPlayer {
  nickname: string;
  avatarIndex: number;
  score: number;
}

interface PodiumRevealProps {
  first: PodiumPlayer;
  second: PodiumPlayer;
  third: PodiumPlayer;
  onComplete?: () => void;
}

const AVATAR_COLORS = PIXEL_AVATAR_COLORS;

const PODIUM_CONFIG = {
  1: {
    height: 180,
    color: "bg-retro-gold",
    borderColor: "border-retro-gold",
    textColor: "text-retro-gold",
    glowColor: "rgba(255,215,0,0.4)",
    label: "1ST",
    medal: "\u{1F451}",
  },
  2: {
    height: 130,
    color: "bg-gray-300",
    borderColor: "border-gray-300",
    textColor: "text-gray-300",
    glowColor: "rgba(192,192,192,0.3)",
    label: "2ND",
    medal: "\u{1F948}",
  },
  3: {
    height: 90,
    color: "bg-amber-700",
    borderColor: "border-amber-700",
    textColor: "text-amber-600",
    glowColor: "rgba(180,83,9,0.3)",
    label: "3RD",
    medal: "\u{1F949}",
  },
} as const;

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
}

function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) return;
    const colors = ["#FFD700", "#A855F7", "#00D4FF", "#FF2D78", "#39FF14", "#FF6B35"];
    const newPieces: ConfettiPiece[] = [];
    for (let i = 0; i < 50; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        rotation: Math.random() * 360,
      });
    }
    setPieces(newPieces);
  }, [active]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: `${p.x}vw`,
            y: -20,
            rotate: p.rotation,
            opacity: 1,
          }}
          animate={{
            y: "110vh",
            rotate: p.rotation + 720,
            opacity: [1, 1, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
          }}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

function PodiumBlock({
  player,
  place,
  revealed,
}: {
  player: PodiumPlayer;
  place: 1 | 2 | 3;
  revealed: boolean;
}) {
  const config = PODIUM_CONFIG[place];
  const color = AVATAR_COLORS[player.avatarIndex % AVATAR_COLORS.length];

  return (
    <div className="flex flex-col items-center">
      {/* Player info (appears above podium) */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center mb-3"
          >
            {/* Crown for 1st */}
            {place === 1 && (
              <motion.span
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 12 }}
                className="text-2xl mb-1"
              >
                {"\u{1F451}"}
              </motion.span>
            )}

            {/* Avatar */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className={cn(
                "flex items-center justify-center border-3",
                place === 1 ? "w-16 h-16" : "w-12 h-12"
              )}
              style={{
                backgroundColor: color,
                borderColor: color,
                boxShadow: `0 0 24px ${color}80`,
              }}
            >
              <span className={cn("font-retro text-white", place === 1 ? "text-xl" : "text-base")}>
                {player.nickname.charAt(0).toUpperCase()}
              </span>
            </motion.div>

            {/* Name */}
            <p
              className={cn(
                "font-retro mt-2 text-center truncate max-w-[120px]",
                place === 1 ? "text-xs" : "text-[10px]",
                config.textColor
              )}
              style={{ textShadow: `0 0 8px ${config.glowColor}` }}
            >
              {player.nickname}
            </p>

            {/* Score */}
            <p className="font-retro text-[10px] text-retro-muted mt-1">
              {player.score} pts
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Podium block */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={
          revealed
            ? { height: config.height, opacity: 1 }
            : { height: 0, opacity: 0 }
        }
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "w-24 md:w-32 border-t-4 flex items-start justify-center pt-3 relative overflow-hidden",
          config.borderColor
        )}
        style={{
          background: `linear-gradient(180deg, ${config.glowColor}, rgba(26,26,46,0.9))`,
          boxShadow: `0 0 20px ${config.glowColor}`,
        }}
      >
        {/* Place label */}
        <AnimatePresence>
          {revealed && (
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className={cn("font-retro text-lg", config.textColor)}
              style={{ textShadow: `0 0 12px ${config.glowColor}` }}
            >
              {config.label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Decorative pixel pattern at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-2 flex">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-full",
                i % 2 === 0 ? "opacity-20" : "opacity-10"
              )}
              style={{ backgroundColor: config.glowColor.replace("0.4", "1").replace("0.3", "1") }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function PodiumReveal({
  first,
  second,
  third,
  onComplete,
}: PodiumRevealProps) {
  const [revealedPlaces, setRevealedPlaces] = useState<Set<number>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const completeCalled = useRef(false);

  const handleComplete = useCallback(() => {
    if (!completeCalled.current) {
      completeCalled.current = true;
      onComplete?.();
    }
  }, [onComplete]);

  useEffect(() => {
    const timers = [
      // 3rd place rises first
      setTimeout(() => setRevealedPlaces((prev) => new Set([...prev, 3])), 500),
      // 2nd place
      setTimeout(() => setRevealedPlaces((prev) => new Set([...prev, 2])), 1800),
      // 1st place with confetti
      setTimeout(() => {
        setRevealedPlaces((prev) => new Set([...prev, 1]));
        setShowConfetti(true);
      }, 3200),
      // Complete
      setTimeout(() => handleComplete(), 6000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [handleComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-end bg-page/95 overflow-hidden"
    >
      {/* Confetti */}
      <Confetti active={showConfetti} />

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="absolute top-12 md:top-16 text-center z-10"
      >
        <h2
          className="font-retro text-lg md:text-2xl text-retro-gold"
          style={{
            textShadow:
              "0 0 16px rgba(255,215,0,0.5), 0 0 32px rgba(255,215,0,0.25), 0 4px 0 #b8860b",
          }}
        >
          FINAL RESULTS
        </h2>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="h-[2px] w-48 mx-auto mt-3 bg-gradient-to-r from-transparent via-retro-gold to-transparent origin-center"
        />
      </motion.div>

      {/* Spotlight effects */}
      <div className="absolute inset-0 pointer-events-none">
        {revealedPlaces.has(1) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-full"
            style={{
              background: "linear-gradient(180deg, rgba(255,215,0,0.3), transparent 60%)",
            }}
          />
        )}
      </div>

      {/* Podiums - arranged: 2nd | 1st | 3rd */}
      <div className="flex items-end justify-center gap-2 md:gap-4 mb-0 z-10 pb-16 md:pb-20">
        {/* 2nd place - left */}
        <PodiumBlock
          player={second}
          place={2}
          revealed={revealedPlaces.has(2)}
        />
        {/* 1st place - center */}
        <PodiumBlock
          player={first}
          place={1}
          revealed={revealedPlaces.has(1)}
        />
        {/* 3rd place - right */}
        <PodiumBlock
          player={third}
          place={3}
          revealed={revealedPlaces.has(3)}
        />
      </div>

      {/* Floor line */}
      <div className="absolute bottom-14 md:bottom-18 left-0 right-0 h-[2px] bg-retro-purple/30 z-0" />

      {/* Decorative grid floor */}
      <div
        className="absolute bottom-0 left-0 right-0 h-14 md:h-18 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(107,33,168,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(107,33,168,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          perspective: "200px",
          transform: "rotateX(60deg)",
          transformOrigin: "top",
        }}
      />
    </motion.div>
  );
}
