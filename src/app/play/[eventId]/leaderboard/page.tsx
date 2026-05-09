"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameState } from "@/hooks/useGameState";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { Leaderboard } from "@/components/game/Leaderboard";
import { RetroButton } from "@/components/ui/RetroButton";
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StoredParticipant {
  participantId: string;
  eventId: string;
  nickname: string;
}

export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [stored, setStored] = useState<StoredParticipant | null>(null);

  const game = useGameState(eventId);
  const { sortedLeaderboard, myEntry } = useLeaderboard();

  // Load stored participant info
  useEffect(() => {
    try {
      const raw = localStorage.getItem("classwars_participant");
      if (raw) {
        const parsed: StoredParticipant = JSON.parse(raw);
        if (parsed.eventId === eventId) {
          setStored(parsed);
          game.setMyParticipantId(parsed.participantId);
        }
      }
    } catch {
      // Continue without stored data
    }
  }, [eventId]);

  return (
    <div className="min-h-screen flex flex-col bg-page relative">
      <ScanlineOverlay />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 border-b border-retro-purple/20 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <RetroButton
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/play/${eventId}`)}
          >
            Back
          </RetroButton>

          <h1
            className="font-retro text-xs text-retro-gold uppercase tracking-wider"
            style={{
              textShadow: "0 0 8px rgba(255,215,0,0.4)",
            }}
          >
            Leaderboard
          </h1>

          <div className="flex items-center gap-2">
            <span className="font-retro text-[9px] text-retro-muted uppercase tracking-wider">
              Round
            </span>
            <span className="font-retro text-[10px] text-retro-purple-light">
              {game.currentRound}/{game.totalRounds}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 py-6 max-w-xl mx-auto w-full gap-4">
        {/* My Position highlight */}
        {myEntry && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              className="bg-card border border-retro-purple/30 p-4 flex items-center justify-between"
              style={{
                boxShadow: "inset 0 0 20px rgba(168,85,247,0.1)",
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "font-retro text-2xl",
                    myEntry.rank === 1
                      ? "text-retro-gold"
                      : myEntry.rank === 2
                      ? "text-gray-300"
                      : myEntry.rank === 3
                      ? "text-amber-600"
                      : "text-retro-text"
                  )}
                  style={
                    myEntry.rank <= 3
                      ? {
                          textShadow: `0 0 8px ${
                            myEntry.rank === 1
                              ? "rgba(255,215,0,0.4)"
                              : myEntry.rank === 2
                              ? "rgba(192,192,192,0.3)"
                              : "rgba(180,83,9,0.3)"
                          }`,
                        }
                      : undefined
                  }
                >
                  #{myEntry.rank}
                </span>
                <div>
                  <p className="font-retro text-xs text-retro-purple-light">
                    {myEntry.nickname}
                  </p>
                  <p className="font-retro text-[9px] text-retro-muted">
                    Your Position
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className="font-retro text-lg text-retro-gold tabular-nums"
                  style={{
                    textShadow: "0 0 8px rgba(255,215,0,0.3)",
                  }}
                >
                  {myEntry.score}
                </p>
                <p className="font-retro text-[8px] text-retro-muted">
                  points
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Full Leaderboard */}
        <Leaderboard
          entries={sortedLeaderboard}
          myParticipantId={stored?.participantId}
        />

        {/* Auto-updating notice */}
        <div className="text-center py-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-retro-green rounded-full animate-pulse" />
            <p className="font-retro text-[8px] text-retro-muted uppercase tracking-wider">
              Live - Auto-updating
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
