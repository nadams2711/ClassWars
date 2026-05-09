"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface BracketMatch {
  id: string;
  round: number;
  position: number;
  player1Id: string | null;
  player2Id: string | null;
  player1Score: number | null;
  player2Score: number | null;
  winnerId: string | null;
  isActive: boolean;
}

interface TournamentBracketProps {
  matches: BracketMatch[];
  participantMap: Record<string, { nickname: string; avatarIndex: number }>;
  className?: string;
}

const AVATAR_COLORS = [
  "#FF2D78", "#00D4FF", "#39FF14", "#FFD700", "#A855F7", "#FF6B35",
  "#00FF88", "#FF1493", "#4169E1", "#FF4500", "#00CED1", "#FF69B4",
  "#7B68EE", "#32CD32", "#FF8C00", "#1E90FF", "#DC143C", "#00FA9A",
  "#FF1744", "#00E5FF", "#76FF03", "#FFEA00", "#AA00FF", "#FF3D00",
];

function PlayerSlot({
  playerId,
  score,
  isWinner,
  isLoser,
  isActive,
  participantMap,
  position,
}: {
  playerId: string | null;
  score: number | null;
  isWinner: boolean;
  isLoser: boolean;
  isActive: boolean;
  participantMap: Record<string, { nickname: string; avatarIndex: number }>;
  position: "top" | "bottom";
}) {
  const player = playerId ? participantMap[playerId] : null;
  const color = player
    ? AVATAR_COLORS[player.avatarIndex % AVATAR_COLORS.length]
    : undefined;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2.5 py-1.5 transition-all duration-300 min-w-0",
        position === "top" ? "border-b border-retro-purple/15" : "",
        isWinner && "bg-retro-gold/10",
        isLoser && "opacity-40",
        isActive && !isWinner && !isLoser && "bg-elevated/50"
      )}
    >
      {/* Avatar */}
      {player ? (
        <div
          className="w-5 h-5 flex items-center justify-center shrink-0"
          style={{
            backgroundColor: color,
            boxShadow: isWinner ? `0 0 8px ${color}80` : undefined,
          }}
        >
          <span className="font-retro text-[7px] text-white">
            {player.nickname.charAt(0).toUpperCase()}
          </span>
        </div>
      ) : (
        <div className="w-5 h-5 bg-retro-muted/10 shrink-0" />
      )}

      {/* Name */}
      <span
        className={cn(
          "font-retro text-[8px] truncate flex-1 min-w-0",
          isWinner ? "text-retro-gold" : isLoser ? "text-retro-muted/60" : "text-retro-text",
          !player && "text-retro-muted/30 italic"
        )}
        style={isWinner ? { textShadow: "0 0 6px rgba(255,215,0,0.4)" } : undefined}
      >
        {player ? player.nickname : "TBD"}
      </span>

      {/* Score */}
      {score != null && (
        <span
          className={cn(
            "font-retro text-[8px] tabular-nums shrink-0",
            isWinner ? "text-retro-gold" : "text-retro-muted"
          )}
        >
          {score}
        </span>
      )}

      {/* Winner crown */}
      {isWinner && (
        <span className="text-[10px] shrink-0">{"\u{1F451}"}</span>
      )}
    </div>
  );
}

function MatchCard({
  match,
  participantMap,
  index,
}: {
  match: BracketMatch;
  participantMap: Record<string, { nickname: string; avatarIndex: number }>;
  index: number;
}) {
  const p1Winner = match.winnerId != null && match.winnerId === match.player1Id;
  const p2Winner = match.winnerId != null && match.winnerId === match.player2Id;
  const p1Loser = match.winnerId != null && !p1Winner && match.player1Id != null;
  const p2Loser = match.winnerId != null && !p2Winner && match.player2Id != null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className={cn(
        "w-44 bg-card border transition-all duration-300",
        match.isActive
          ? "border-retro-purple-light animate-pulse-glow"
          : match.winnerId
          ? "border-retro-gold/30"
          : "border-retro-purple/20"
      )}
      style={
        match.isActive
          ? { boxShadow: "0 0 16px rgba(168,85,247,0.3), 0 0 32px rgba(168,85,247,0.1)" }
          : undefined
      }
    >
      {/* Active indicator */}
      {match.isActive && (
        <div className="bg-retro-purple/30 px-2 py-0.5 text-center">
          <span className="font-retro text-[7px] text-retro-purple-light uppercase tracking-widest animate-glow">
            LIVE
          </span>
        </div>
      )}

      <PlayerSlot
        playerId={match.player1Id}
        score={match.player1Score}
        isWinner={p1Winner}
        isLoser={p1Loser}
        isActive={match.isActive}
        participantMap={participantMap}
        position="top"
      />
      <PlayerSlot
        playerId={match.player2Id}
        score={match.player2Score}
        isWinner={p2Winner}
        isLoser={p2Loser}
        isActive={match.isActive}
        participantMap={participantMap}
        position="bottom"
      />
    </motion.div>
  );
}

export function TournamentBracket({
  matches,
  participantMap,
  className,
}: TournamentBracketProps) {
  // Group matches by round
  const rounds = useMemo(() => {
    const roundMap = new Map<number, BracketMatch[]>();
    for (const m of matches) {
      const existing = roundMap.get(m.round) || [];
      existing.push(m);
      roundMap.set(m.round, existing);
    }
    // Sort rounds and matches within each round
    const sorted = Array.from(roundMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([round, roundMatches]) => ({
        round,
        matches: roundMatches.sort((a, b) => a.position - b.position),
      }));
    return sorted;
  }, [matches]);

  const roundLabels = (round: number, totalRounds: number): string => {
    if (round === totalRounds) return "FINAL";
    if (round === totalRounds - 1) return "SEMIS";
    if (round === totalRounds - 2) return "QUARTERS";
    return `ROUND ${round}`;
  };

  const totalRounds = rounds.length > 0 ? rounds[rounds.length - 1].round : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={cn("bg-card border border-retro-purple/30 overflow-hidden", className)}
    >
      {/* Header */}
      <div className="bg-elevated/80 px-5 py-3 border-b border-retro-purple/20">
        <h3
          className="font-retro text-xs text-retro-purple-light uppercase tracking-wider"
          style={{ textShadow: "0 0 8px rgba(168,85,247,0.3)" }}
        >
          Tournament Bracket
        </h3>
      </div>

      {/* Bracket content - horizontally scrollable */}
      <div className="overflow-x-auto p-5">
        <div className="flex items-stretch gap-0 min-w-max">
          {rounds.map((r, roundIndex) => (
            <div key={r.round} className="flex items-stretch">
              {/* Round column */}
              <div className="flex flex-col items-center">
                {/* Round label */}
                <div className="mb-4">
                  <span
                    className={cn(
                      "font-retro text-[8px] uppercase tracking-widest px-3 py-1",
                      r.round === totalRounds
                        ? "text-retro-gold bg-retro-gold/10 border border-retro-gold/20"
                        : "text-retro-muted bg-elevated/30 border border-retro-purple/10"
                    )}
                  >
                    {roundLabels(r.round, totalRounds)}
                  </span>
                </div>

                {/* Match cards with spacing to align to bracket lines */}
                <div
                  className="flex flex-col justify-around flex-1 gap-4"
                  style={{
                    paddingTop: roundIndex > 0 ? `${Math.pow(2, roundIndex - 1) * 20}px` : 0,
                    paddingBottom: roundIndex > 0 ? `${Math.pow(2, roundIndex - 1) * 20}px` : 0,
                  }}
                >
                  {r.matches.map((match, mi) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      participantMap={participantMap}
                      index={roundIndex * 4 + mi}
                    />
                  ))}
                </div>
              </div>

              {/* Connector lines between rounds */}
              {roundIndex < rounds.length - 1 && (
                <div className="flex flex-col justify-around py-8 mx-2">
                  {r.matches.map((_, mi) => {
                    // Show connector for every pair of matches
                    if (mi % 2 !== 0) return null;
                    return (
                      <div
                        key={mi}
                        className="flex flex-col items-center"
                        style={{
                          height: `${60 + roundIndex * 40}px`,
                        }}
                      >
                        {/* Top horizontal line */}
                        <div className="flex items-start flex-1">
                          <div className="w-6 h-[2px] bg-retro-purple/30 mt-4" />
                          <div className="w-[2px] bg-retro-purple/30 h-full" />
                          <div className="w-6 h-[2px] bg-retro-purple/30 self-center" />
                        </div>
                        {/* Bottom horizontal line */}
                        <div className="flex items-end flex-1">
                          <div className="w-6 h-[2px] bg-retro-purple/30 mb-4" />
                          <div className="w-[2px] bg-retro-purple/30 h-full" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {matches.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <p className="font-retro text-[10px] text-retro-muted">
            Bracket not yet generated
          </p>
        </div>
      )}
    </motion.div>
  );
}
