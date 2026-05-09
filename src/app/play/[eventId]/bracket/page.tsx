"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameState } from "@/hooks/useGameState";
import { TournamentBracket } from "@/components/game/TournamentBracket";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StoredParticipant {
  participantId: string;
  eventId: string;
  nickname: string;
}

interface BracketMatchData {
  id: string;
  roundNumber: number;
  matchIndex: number;
  participant1Id: string | null;
  participant2Id: string | null;
  winnerId: string | null;
  status: string;
}

export default function BracketPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [stored, setStored] = useState<StoredParticipant | null>(null);
  const [bracketMatches, setBracketMatches] = useState<BracketMatchData[]>([]);
  const [loading, setLoading] = useState(true);

  const game = useGameState(eventId);

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

  // Fetch bracket data
  useEffect(() => {
    if (!eventId) return;
    async function fetchBracket() {
      try {
        const res = await fetch(`/api/events/${eventId}/bracket`);
        if (res.ok) {
          const data = await res.json();
          setBracketMatches(data.matches || []);
        }
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchBracket();
  }, [eventId]);

  // Build participant map from game state
  const participantMap = useMemo(() => {
    const map: Record<string, { nickname: string; avatarIndex: number }> = {};
    for (const p of game.participants) {
      map[p.id] = { nickname: p.nickname, avatarIndex: p.avatarIndex };
    }
    return map;
  }, [game.participants]);

  // Transform bracket data into TournamentBracket component format
  const transformedMatches = useMemo(
    () =>
      bracketMatches.map((m) => ({
        id: m.id,
        round: m.roundNumber,
        position: m.matchIndex,
        player1Id: m.participant1Id,
        player2Id: m.participant2Id,
        player1Score: null as number | null,
        player2Score: null as number | null,
        winnerId: m.winnerId,
        isActive: m.status === "active",
      })),
    [bracketMatches]
  );

  // Find my current match
  const myMatch = useMemo(() => {
    if (!stored) return null;
    return transformedMatches.find(
      (m) =>
        m.isActive &&
        (m.player1Id === stored.participantId ||
          m.player2Id === stored.participantId)
    );
  }, [transformedMatches, stored]);

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
            className="font-retro text-xs text-retro-purple-light uppercase tracking-wider"
            style={{
              textShadow: "0 0 8px rgba(168,85,247,0.3)",
            }}
          >
            Tournament Bracket
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
      <div className="flex-1 flex flex-col px-4 py-6 gap-4">
        {/* My current match highlight */}
        {myMatch && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <RetroCard glow="pink" padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-retro text-[9px] text-retro-pink uppercase tracking-wider mb-1">
                    Your Match - LIVE
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="font-retro text-[10px] text-retro-text">
                      {myMatch.player1Id
                        ? participantMap[myMatch.player1Id]?.nickname || "TBD"
                        : "TBD"}
                    </span>
                    <span
                      className="font-retro text-xs text-retro-gold"
                      style={{
                        textShadow: "0 0 6px rgba(255,215,0,0.4)",
                      }}
                    >
                      VS
                    </span>
                    <span className="font-retro text-[10px] text-retro-text">
                      {myMatch.player2Id
                        ? participantMap[myMatch.player2Id]?.nickname || "TBD"
                        : "TBD"}
                    </span>
                  </div>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-3 h-3 bg-retro-pink rounded-full"
                  style={{
                    boxShadow: "0 0 8px rgba(255,45,120,0.5)",
                  }}
                />
              </div>
            </RetroCard>
          </motion.div>
        )}

        {/* Tournament Bracket */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-2">
                <div
                  className="w-2 h-2 bg-retro-purple-light animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-retro-blue animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 bg-retro-pink animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
              <p className="font-retro text-[10px] text-retro-muted">
                Loading bracket...
              </p>
            </div>
          </div>
        ) : (
          <TournamentBracket
            matches={transformedMatches}
            participantMap={participantMap}
          />
        )}

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
