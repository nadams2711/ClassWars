"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { getOrdinal } from "@/lib/utils";
import { PIXEL_AVATAR_COLORS } from "./PixelAvatar";
import type { LeaderboardEntry, TeamLeaderboardEntry } from "@/types/game";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  myParticipantId?: string;
  compact?: boolean;
  className?: string;
  teamLeaderboard?: TeamLeaderboardEntry[];
}

const AVATAR_COLORS = PIXEL_AVATAR_COLORS;

const RANK_STYLES: Record<number, { badge: string; border: string; glow: string; label: string }> = {
  1: {
    badge: "bg-retro-gold text-page",
    border: "border-retro-gold/60",
    glow: "0 0 20px rgba(255,215,0,0.2)",
    label: "\u{1F451}",
  },
  2: {
    badge: "bg-gray-300 text-page",
    border: "border-gray-400/40",
    glow: "0 0 12px rgba(192,192,192,0.15)",
    label: "\u{1F948}",
  },
  3: {
    badge: "bg-amber-700 text-white",
    border: "border-amber-700/40",
    glow: "0 0 12px rgba(180,83,9,0.15)",
    label: "\u{1F949}",
  },
};

function AnimatedScore({ target, duration = 500 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();
    let raf: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setValue(current);

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        prevRef.current = target;
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return <>{value}</>;
}

function RankArrow({ rank, previousRank }: { rank: number; previousRank: number | null }) {
  if (previousRank == null) return null;
  const diff = previousRank - rank;
  if (diff === 0) return null;

  return (
    <motion.span
      initial={{ opacity: 0, y: diff > 0 ? 6 : -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "font-retro text-[9px] flex items-center gap-0.5",
        diff > 0 ? "text-retro-green" : "text-retro-pink"
      )}
    >
      <span>{diff > 0 ? "\u25B2" : "\u25BC"}</span>
      <span>{Math.abs(diff)}</span>
    </motion.span>
  );
}

export function Leaderboard({
  entries,
  myParticipantId,
  compact = false,
  className,
  teamLeaderboard,
}: LeaderboardProps) {
  const sorted = [...entries].sort((a, b) => a.rank - b.rank);
  const maxTeamScore = teamLeaderboard?.length ? Math.max(...teamLeaderboard.map(t => t.score), 1) : 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "bg-card border border-retro-purple/30 overflow-hidden",
        className
      )}
    >
      {/* Team Standings */}
      {teamLeaderboard && teamLeaderboard.length > 0 && (
        <div className="px-5 py-4 border-b border-retro-purple/20">
          <h4
            className="font-retro text-[10px] text-retro-gold uppercase tracking-wider mb-3"
            style={{ textShadow: "0 0 8px rgba(255,215,0,0.3)" }}
          >
            Team Standings
          </h4>
          <div className="space-y-2">
            {teamLeaderboard
              .sort((a, b) => a.rank - b.rank)
              .map((team, i) => (
                <motion.div
                  key={team.teamId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  className="flex items-center gap-3"
                >
                  <span className="font-retro text-[10px] text-retro-muted w-5 shrink-0">
                    #{team.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="font-retro text-[10px] uppercase"
                        style={{ color: team.color }}
                      >
                        {team.name}
                      </span>
                      <span className="font-retro text-[10px] text-retro-text tabular-nums">
                        {team.score} pts
                      </span>
                    </div>
                    <div className="h-2 bg-page/60 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(team.score / maxTeamScore) * 100}%` }}
                        transition={{ delay: i * 0.08 + 0.2, duration: 0.5, ease: "easeOut" }}
                        className="h-full"
                        style={{ backgroundColor: team.color }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}

      {/* Header */}
      {!compact && (
        <div className="bg-elevated/80 px-5 py-3 border-b border-retro-purple/20 flex items-center justify-between">
          <h3
            className="font-retro text-xs text-retro-purple-light uppercase tracking-wider"
            style={{ textShadow: "0 0 8px rgba(168,85,247,0.3)" }}
          >
            Leaderboard
          </h3>
          <span className="font-retro text-[9px] text-retro-muted">
            {entries.length} PLAYERS
          </span>
        </div>
      )}

      {/* Entries */}
      <div className={cn("divide-y divide-retro-purple/10", compact ? "max-h-80 overflow-y-auto" : "")}>
        {sorted.map((entry, i) => {
          const isMe = entry.participantId === myParticipantId;
          const isTop3 = entry.rank <= 3;
          const rankStyle = RANK_STYLES[entry.rank];
          const avatarColor = AVATAR_COLORS[entry.avatarIndex % AVATAR_COLORS.length];

          return (
            <motion.div
              key={entry.participantId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={cn(
                "flex items-center gap-3 transition-colors",
                compact ? "px-3 py-2" : "px-5 py-3",
                isMe && "bg-retro-purple/10",
                isTop3 && rankStyle ? `border-l-2 ${rankStyle.border}` : "border-l-2 border-transparent"
              )}
              style={isMe ? { boxShadow: "inset 0 0 20px rgba(168,85,247,0.1)" } : undefined}
            >
              {/* Rank */}
              <div className="flex items-center gap-1.5 w-10 shrink-0">
                {isTop3 && rankStyle ? (
                  <span className="text-sm">{rankStyle.label}</span>
                ) : (
                  <span className="font-retro text-[10px] text-retro-muted">
                    {entry.rank}
                  </span>
                )}
                <RankArrow rank={entry.rank} previousRank={entry.previousRank} />
              </div>

              {/* Avatar */}
              <div
                className={cn(
                  "flex items-center justify-center shrink-0",
                  compact ? "w-7 h-7" : "w-9 h-9"
                )}
                style={{
                  backgroundColor: avatarColor,
                  boxShadow: isTop3 ? `0 0 12px ${avatarColor}60` : undefined,
                }}
              >
                <span className={cn("font-retro text-white", compact ? "text-[9px]" : "text-[10px]")}>
                  {entry.nickname.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Name + Team */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-retro truncate",
                    compact ? "text-[9px]" : "text-[10px]",
                    isMe ? "text-retro-purple-light" : "text-retro-text"
                  )}
                >
                  {entry.nickname}
                  {isMe && (
                    <span className="text-retro-muted ml-1.5">(you)</span>
                  )}
                </p>
                {entry.teamName && !compact && (
                  <p className="font-body text-[10px] text-retro-muted truncate">
                    {entry.teamName}
                  </p>
                )}
              </div>

              {/* Score */}
              <div className="flex items-baseline gap-1 shrink-0">
                <span
                  className={cn(
                    "font-retro tabular-nums",
                    compact ? "text-xs" : "text-sm",
                    isTop3 && entry.rank === 1
                      ? "text-retro-gold"
                      : isTop3 && entry.rank === 2
                      ? "text-gray-300"
                      : isTop3 && entry.rank === 3
                      ? "text-amber-600"
                      : "text-retro-text"
                  )}
                  style={
                    entry.rank === 1
                      ? { textShadow: "0 0 8px rgba(255,215,0,0.4)" }
                      : undefined
                  }
                >
                  <AnimatedScore target={entry.score} />
                </span>
                {!compact && (
                  <span className="font-retro text-[8px] text-retro-muted">
                    pts
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}

        {entries.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="font-retro text-[10px] text-retro-muted">
              No scores yet
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
