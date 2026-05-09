"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface VSScreenProps {
  player1: { nickname: string; avatarIndex: number };
  player2: { nickname: string; avatarIndex: number };
  challengeTitle: string;
  onComplete?: () => void;
}

const AVATAR_COLORS = [
  "#FF2D78", "#00D4FF", "#39FF14", "#FFD700", "#A855F7", "#FF6B35",
  "#00FF88", "#FF1493", "#4169E1", "#FF4500", "#00CED1", "#FF69B4",
  "#7B68EE", "#32CD32", "#FF8C00", "#1E90FF", "#DC143C", "#00FA9A",
  "#FF1744", "#00E5FF", "#76FF03", "#FFEA00", "#AA00FF", "#FF3D00",
];

export function VSScreen({ player1, player2, challengeTitle, onComplete }: VSScreenProps) {
  const [phase, setPhase] = useState<"enter" | "vs" | "flash" | "done">("enter");

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("vs"), 800),
      setTimeout(() => setPhase("flash"), 1200),
      setTimeout(() => setPhase("done"), 2800),
      setTimeout(() => onComplete?.(), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const p1Color = AVATAR_COLORS[player1.avatarIndex % AVATAR_COLORS.length];
  const p2Color = AVATAR_COLORS[player2.avatarIndex % AVATAR_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-page/95 overflow-hidden"
    >
      {/* Flash effect */}
      <AnimatePresence>
        {phase === "flash" && (
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-white z-30"
          />
        )}
      </AnimatePresence>

      {/* Diagonal split background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${p1Color} 0%, ${p1Color} 48%, transparent 48%, transparent 52%, ${p2Color} 52%, ${p2Color} 100%)`,
        }}
      />

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-20 opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
        }}
      />

      {/* Player 1 - Left side */}
      <motion.div
        initial={{ x: "-110%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-0 top-0 bottom-0 w-1/2 flex flex-col items-center justify-center z-10"
      >
        {/* Background glow */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(ellipse at center, ${p1Color}, transparent 70%)`,
          }}
        />

        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div
            className="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center"
            style={{
              backgroundColor: p1Color,
              boxShadow: `0 0 40px ${p1Color}80, 0 0 80px ${p1Color}40`,
              imageRendering: "pixelated",
            }}
          >
            <span className="font-retro text-4xl md:text-5xl text-white drop-shadow-lg">
              {player1.nickname.charAt(0).toUpperCase()}
            </span>
          </div>
          {/* Pixel corner accents */}
          <div className="absolute -top-1 -left-1 w-3 h-3" style={{ backgroundColor: p1Color }} />
          <div className="absolute -top-1 -right-1 w-3 h-3" style={{ backgroundColor: p1Color }} />
          <div className="absolute -bottom-1 -left-1 w-3 h-3" style={{ backgroundColor: p1Color }} />
          <div className="absolute -bottom-1 -right-1 w-3 h-3" style={{ backgroundColor: p1Color }} />
        </motion.div>

        {/* Name */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="font-retro text-sm md:text-base text-retro-text text-center px-4 mt-5 truncate max-w-full"
          style={{ textShadow: `0 0 12px ${p1Color}80` }}
        >
          {player1.nickname}
        </motion.p>

        {/* P1 label */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="font-retro text-[10px] mt-2 tracking-widest"
          style={{ color: p1Color }}
        >
          PLAYER 1
        </motion.span>
      </motion.div>

      {/* Player 2 - Right side */}
      <motion.div
        initial={{ x: "110%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute right-0 top-0 bottom-0 w-1/2 flex flex-col items-center justify-center z-10"
      >
        {/* Background glow */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(ellipse at center, ${p2Color}, transparent 70%)`,
          }}
        />

        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div
            className="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center"
            style={{
              backgroundColor: p2Color,
              boxShadow: `0 0 40px ${p2Color}80, 0 0 80px ${p2Color}40`,
              imageRendering: "pixelated",
            }}
          >
            <span className="font-retro text-4xl md:text-5xl text-white drop-shadow-lg">
              {player2.nickname.charAt(0).toUpperCase()}
            </span>
          </div>
          {/* Pixel corner accents */}
          <div className="absolute -top-1 -left-1 w-3 h-3" style={{ backgroundColor: p2Color }} />
          <div className="absolute -top-1 -right-1 w-3 h-3" style={{ backgroundColor: p2Color }} />
          <div className="absolute -bottom-1 -left-1 w-3 h-3" style={{ backgroundColor: p2Color }} />
          <div className="absolute -bottom-1 -right-1 w-3 h-3" style={{ backgroundColor: p2Color }} />
        </motion.div>

        {/* Name */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="font-retro text-sm md:text-base text-retro-text text-center px-4 mt-5 truncate max-w-full"
          style={{ textShadow: `0 0 12px ${p2Color}80` }}
        >
          {player2.nickname}
        </motion.p>

        {/* P2 label */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="font-retro text-[10px] mt-2 tracking-widest"
          style={{ color: p2Color }}
        >
          PLAYER 2
        </motion.span>
      </motion.div>

      {/* VS Text */}
      <AnimatePresence>
        {(phase === "vs" || phase === "flash" || phase === "done") && (
          <motion.div
            initial={{ scale: 5, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-20 select-none"
          >
            <h1
              className="font-retro text-7xl md:text-9xl text-retro-gold"
              style={{
                textShadow:
                  "0 0 40px #FFD700, 0 0 80px #FFD70060, 0 0 120px #FFD70030, 0 6px 0 #b8860b, 0 8px 0 #996515",
              }}
            >
              VS
            </h1>
            {/* Spark ring around VS */}
            <motion.div
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-2 border-retro-gold"
              style={{ boxShadow: "0 0 30px #FFD700" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Challenge title at bottom */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-10 md:bottom-14 left-0 right-0 text-center z-10"
      >
        <p className="font-retro text-[10px] text-retro-muted mb-2 tracking-widest">
          NEXT CHALLENGE
        </p>
        <p
          className="font-retro text-xs md:text-sm text-retro-blue px-6"
          style={{ textShadow: "0 0 12px rgba(0,212,255,0.5)" }}
        >
          {challengeTitle}
        </p>
      </motion.div>

      {/* Center divider line */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] origin-top z-10"
        style={{
          background: "linear-gradient(to bottom, transparent, #FFD700, #FFD700, transparent)",
          boxShadow: "0 0 20px #FFD700, 0 0 40px #FFD70060",
        }}
      />
    </motion.div>
  );
}
