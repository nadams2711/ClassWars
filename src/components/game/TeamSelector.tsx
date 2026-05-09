"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  color: string;
  memberCount: number;
  maxMembers?: number;
}

interface TeamSelectorProps {
  teams: Team[];
  currentTeamId?: string | null;
  onSelectTeam: (teamId: string) => void;
  className?: string;
}

export function TeamSelector({
  teams,
  currentTeamId,
  onSelectTeam,
  className,
}: TeamSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn("bg-card border border-retro-purple/30 overflow-hidden", className)}
    >
      {/* Header */}
      <div className="bg-elevated/80 px-5 py-3 border-b border-retro-purple/20">
        <h3
          className="font-retro text-xs text-retro-purple-light uppercase tracking-wider"
          style={{ textShadow: "0 0 8px rgba(168,85,247,0.3)" }}
        >
          Choose Your Team
        </h3>
      </div>

      {/* Team list */}
      <div className="p-4 grid gap-3 sm:grid-cols-2">
        {teams.map((team, index) => {
          const isCurrent = team.id === currentTeamId;
          const isFull = team.maxMembers != null && team.memberCount >= team.maxMembers;

          return (
            <motion.button
              key={team.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              whileTap={!isFull || isCurrent ? { scale: 0.97 } : undefined}
              whileHover={!isFull || isCurrent ? { scale: 1.02 } : undefined}
              onClick={() => !isFull && onSelectTeam(team.id)}
              disabled={isFull && !isCurrent}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 border transition-all duration-200 text-left",
                "disabled:cursor-not-allowed",
                isCurrent
                  ? "border-retro-purple-light bg-retro-purple/15"
                  : isFull
                  ? "border-retro-muted/10 bg-elevated/20 opacity-50"
                  : "border-retro-purple/20 bg-elevated/30 hover:border-retro-purple/40 hover:bg-elevated/50"
              )}
              style={
                isCurrent
                  ? {
                      boxShadow: `0 0 0 1px ${team.color}40, 0 0 20px ${team.color}20`,
                    }
                  : undefined
              }
            >
              {/* Team color swatch */}
              <div className="relative shrink-0">
                <div
                  className="w-10 h-10 flex items-center justify-center"
                  style={{
                    backgroundColor: team.color,
                    boxShadow: isCurrent ? `0 0 16px ${team.color}60` : undefined,
                  }}
                >
                  <span className="font-retro text-sm text-white drop-shadow-lg">
                    {team.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {/* Current team indicator dot */}
                {isCurrent && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-retro-green border-2 border-page rounded-full"
                    style={{ boxShadow: "0 0 6px rgba(57,255,20,0.5)" }}
                  />
                )}
              </div>

              {/* Team info */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-retro text-[10px] truncate",
                    isCurrent ? "text-retro-purple-light" : "text-retro-text"
                  )}
                  style={
                    isCurrent
                      ? { textShadow: `0 0 8px ${team.color}60` }
                      : undefined
                  }
                >
                  {team.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {/* Member count */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px]">{"\u{1F465}"}</span>
                    <span className="font-body text-[10px] text-retro-muted">
                      {team.memberCount}
                      {team.maxMembers != null && `/${team.maxMembers}`}
                    </span>
                  </div>

                  {/* Full badge */}
                  {isFull && !isCurrent && (
                    <span className="font-retro text-[7px] text-retro-pink bg-retro-pink/10 px-1.5 py-0.5 uppercase">
                      Full
                    </span>
                  )}

                  {/* Current badge */}
                  {isCurrent && (
                    <span className="font-retro text-[7px] text-retro-green bg-retro-green/10 px-1.5 py-0.5 uppercase">
                      Joined
                    </span>
                  )}
                </div>
              </div>

              {/* Join / Joined indicator */}
              <div className="shrink-0">
                {isCurrent ? (
                  <div
                    className="w-8 h-8 flex items-center justify-center bg-retro-green/20 border border-retro-green/30"
                  >
                    <span className="font-retro text-xs text-retro-green">{"\u2714"}</span>
                  </div>
                ) : !isFull ? (
                  <div className="w-8 h-8 flex items-center justify-center bg-retro-purple/20 border border-retro-purple/30 hover:bg-retro-purple/30 transition-colors">
                    <span className="font-retro text-xs text-retro-purple-light">{"\u25B6"}</span>
                  </div>
                ) : null}
              </div>
            </motion.button>
          );
        })}

        {teams.length === 0 && (
          <div className="col-span-full flex items-center justify-center py-8">
            <p className="font-retro text-[10px] text-retro-muted">
              No teams available
            </p>
          </div>
        )}
      </div>

      {/* Footer hint */}
      {currentTeamId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-t border-retro-purple/10 px-5 py-2.5 bg-elevated/30"
        >
          <p className="font-body text-[10px] text-retro-muted text-center">
            Tap another team to switch
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
