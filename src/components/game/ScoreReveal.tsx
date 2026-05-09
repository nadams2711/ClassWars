"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import type { ScoreBreakdown } from "@/types/game";

interface ScoreRevealProps {
  breakdown: ScoreBreakdown;
  newRank: number;
  previousRank: number | null;
  totalScore: number;
  className?: string;
}

interface CategoryConfig {
  key: keyof Omit<ScoreBreakdown, "total">;
  label: string;
  icon: string;
  color: string;
  glowColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: "completion",
    label: "Completion",
    icon: "\u2714",
    color: "text-retro-green",
    glowColor: "rgba(57,255,20,0.4)",
  },
  {
    key: "speed",
    label: "Speed",
    icon: "\u26A1",
    color: "text-retro-blue",
    glowColor: "rgba(0,212,255,0.4)",
  },
  {
    key: "quality",
    label: "Quality",
    icon: "\u2605",
    color: "text-retro-gold",
    glowColor: "rgba(255,215,0,0.4)",
  },
  {
    key: "crowd",
    label: "Crowd Fav",
    icon: "\u2764",
    color: "text-retro-pink",
    glowColor: "rgba(255,45,120,0.4)",
  },
  {
    key: "teamwork",
    label: "Teamwork",
    icon: "\u{1F91D}",
    color: "text-retro-purple-light",
    glowColor: "rgba(168,85,247,0.4)",
  },
];

function useRollingNumber(target: number, duration: number = 600, delay: number = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };
      rafRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);

  return value;
}

function ScoreCategory({
  config,
  value,
  index,
}: {
  config: CategoryConfig;
  value: number;
  index: number;
}) {
  const rollingValue = useRollingNumber(value, 500, 300 + index * 400);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200 + index * 400);
    return () => clearTimeout(timer);
  }, [index]);

  if (!visible) return <div className="h-10" />;

  return (
    <motion.div
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center justify-between py-2.5 border-b border-retro-purple/10 last:border-0"
    >
      <div className="flex items-center gap-3">
        <span className="text-base w-6 text-center">{config.icon}</span>
        <span className="font-retro text-[10px] text-retro-muted uppercase tracking-wider">
          {config.label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* Score bar */}
        <div className="w-20 h-2 bg-page/60 overflow-hidden hidden sm:block">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(value * 10, 100)}%` }}
            transition={{ delay: 0.4 + index * 0.4, duration: 0.5, ease: "easeOut" }}
            className="h-full"
            style={{
              backgroundColor: config.glowColor.replace("0.4", "1"),
              boxShadow: `0 0 8px ${config.glowColor}`,
            }}
          />
        </div>
        <span
          className={cn("font-retro text-sm w-8 text-right", config.color)}
          style={{ textShadow: `0 0 8px ${config.glowColor}` }}
        >
          {value > 0 ? `+${rollingValue}` : "0"}
        </span>
      </div>
    </motion.div>
  );
}

export function ScoreReveal({
  breakdown,
  newRank,
  previousRank,
  totalScore,
  className,
}: ScoreRevealProps) {
  const totalDelay = 300 + CATEGORIES.length * 400 + 200;
  const rollingTotal = useRollingNumber(totalScore, 800, totalDelay);
  const [showTotal, setShowTotal] = useState(false);

  const rankDiff =
    previousRank != null ? previousRank - newRank : 0;

  useEffect(() => {
    const timer = setTimeout(() => setShowTotal(true), totalDelay);
    return () => clearTimeout(timer);
  }, [totalDelay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn("bg-card border border-retro-purple/30 overflow-hidden", className)}
    >
      {/* Header */}
      <div className="bg-elevated/80 px-5 py-3 border-b border-retro-purple/20">
        <h3
          className="font-retro text-xs text-retro-purple-light uppercase tracking-wider"
          style={{ textShadow: "0 0 8px rgba(168,85,247,0.3)" }}
        >
          Score Breakdown
        </h3>
      </div>

      {/* Categories */}
      <div className="px-5 py-3">
        {CATEGORIES.map((cat, i) => (
          <ScoreCategory
            key={cat.key}
            config={cat}
            value={breakdown[cat.key]}
            index={i}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="mx-5 h-[2px] bg-gradient-to-r from-transparent via-retro-purple/40 to-transparent" />

      {/* Total + Rank */}
      <div className="px-5 py-4 flex items-center justify-between">
        {/* Total Score */}
        <div className="flex flex-col">
          <span className="font-retro text-[9px] text-retro-muted uppercase tracking-wider mb-1">
            Round Total
          </span>
          {showTotal ? (
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="font-retro text-2xl text-retro-gold animate-pulse-glow inline-block"
              style={{
                textShadow: "0 0 12px rgba(255,215,0,0.5), 0 0 24px rgba(255,215,0,0.25)",
              }}
            >
              +{rollingTotal}
            </motion.span>
          ) : (
            <span className="font-retro text-2xl text-retro-muted/30">--</span>
          )}
        </div>

        {/* Rank change */}
        {showTotal && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex flex-col items-end"
          >
            <span className="font-retro text-[9px] text-retro-muted uppercase tracking-wider mb-1">
              Rank
            </span>
            <div className="flex items-center gap-2">
              <span className="font-retro text-lg text-retro-text">
                #{newRank}
              </span>
              {rankDiff !== 0 && (
                <motion.span
                  initial={{ y: rankDiff > 0 ? 10 : -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={cn(
                    "font-retro text-xs flex items-center gap-0.5",
                    rankDiff > 0 ? "text-retro-green" : "text-retro-pink"
                  )}
                >
                  <span>{rankDiff > 0 ? "\u25B2" : "\u25BC"}</span>
                  <span>{Math.abs(rankDiff)}</span>
                </motion.span>
              )}
              {rankDiff === 0 && previousRank != null && (
                <span className="font-retro text-[10px] text-retro-muted">
                  {"\u2014"}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
