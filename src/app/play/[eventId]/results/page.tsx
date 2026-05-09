"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameState } from "@/hooks/useGameState";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { PodiumReveal } from "@/components/game/PodiumReveal";
import { Leaderboard } from "@/components/game/Leaderboard";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { ParticleExplosion } from "@/components/ui/ParticleExplosion";
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface StoredParticipant {
  participantId: string;
  eventId: string;
  nickname: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const AVATAR_COLORS = [
  "#FF2D78", "#00D4FF", "#39FF14", "#FFD700", "#A855F7", "#FF6B35",
  "#00FF88", "#FF1493", "#4169E1", "#FF4500", "#00CED1", "#FF69B4",
  "#7B68EE", "#32CD32", "#FF8C00", "#1E90FF", "#DC143C", "#00FA9A",
  "#FF1744", "#00E5FF", "#76FF03", "#FFEA00", "#AA00FF", "#FF3D00",
];

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [stored, setStored] = useState<StoredParticipant | null>(null);
  const [showPodium, setShowPodium] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [showParticles, setShowParticles] = useState(false);

  const game = useGameState(eventId);
  const { sortedLeaderboard, myEntry, top3 } = useLeaderboard();

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

  // Fetch badges for this participant
  useEffect(() => {
    if (!stored) return;
    async function fetchBadges() {
      try {
        const res = await fetch(
          `/api/events/${eventId}/badges?participantId=${stored!.participantId}`
        );
        if (res.ok) {
          const data = await res.json();
          setBadges(data.badges || []);
        }
      } catch {
        // Badges are non-critical
      }
    }
    fetchBadges();
  }, [stored, eventId]);

  // PodiumReveal complete -> show full results
  const handlePodiumComplete = () => {
    setShowPodium(false);
    setShowContent(true);
    setShowParticles(true);
    // Reset particles after animation
    setTimeout(() => setShowParticles(false), 3000);
  };

  // If no leaderboard data but we just arrived, skip podium
  useEffect(() => {
    if (top3.length === 0 && sortedLeaderboard.length === 0) {
      // Wait a bit then show content anyway
      const timer = setTimeout(() => {
        setShowPodium(false);
        setShowContent(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [top3, sortedLeaderboard]);

  // Build podium players from top3
  const podiumFirst = top3[0]
    ? { nickname: top3[0].nickname, avatarIndex: top3[0].avatarIndex, score: top3[0].score }
    : { nickname: "---", avatarIndex: 0, score: 0 };
  const podiumSecond = top3[1]
    ? { nickname: top3[1].nickname, avatarIndex: top3[1].avatarIndex, score: top3[1].score }
    : { nickname: "---", avatarIndex: 0, score: 0 };
  const podiumThird = top3[2]
    ? { nickname: top3[2].nickname, avatarIndex: top3[2].avatarIndex, score: top3[2].score }
    : { nickname: "---", avatarIndex: 0, score: 0 };

  // Am I top 3?
  const myRank = myEntry?.rank || 0;
  const isWinner = myRank >= 1 && myRank <= 3;

  return (
    <div className="min-h-screen flex flex-col bg-page relative">
      <ScanlineOverlay />

      {/* Podium Reveal Overlay */}
      <AnimatePresence>
        {showPodium && top3.length >= 3 && (
          <PodiumReveal
            first={podiumFirst}
            second={podiumSecond}
            third={podiumThird}
            onComplete={handlePodiumComplete}
          />
        )}
      </AnimatePresence>

      {/* Main Content (shown after podium) */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex flex-col"
          >
            {/* Header */}
            <div className="text-center pt-8 pb-4 px-4 relative">
              <ParticleExplosion
                trigger={showParticles}
                particleCount={80}
                duration={2500}
                className="z-10"
              />
              <motion.h1
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="font-retro text-xl sm:text-2xl text-retro-gold"
                style={{
                  textShadow:
                    "0 0 16px rgba(255,215,0,0.5), 0 0 32px rgba(255,215,0,0.25), 0 4px 0 #b8860b",
                }}
              >
                GAME OVER
              </motion.h1>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="h-[2px] w-48 mx-auto mt-3 bg-gradient-to-r from-transparent via-retro-gold to-transparent origin-center"
              />
            </div>

            <div className="flex-1 flex flex-col px-4 pb-8 max-w-xl mx-auto w-full gap-5">
              {/* Personal result card */}
              {myEntry && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <RetroCard
                    glow={isWinner ? "gold" : "purple"}
                    padding="md"
                    className="text-center"
                  >
                    <div className="flex flex-col items-center gap-3 py-2">
                      {/* My avatar */}
                      <div
                        className="w-16 h-16 flex items-center justify-center"
                        style={{
                          backgroundColor:
                            AVATAR_COLORS[
                              myEntry.avatarIndex % AVATAR_COLORS.length
                            ],
                          boxShadow: `0 0 24px ${
                            AVATAR_COLORS[
                              myEntry.avatarIndex % AVATAR_COLORS.length
                            ]
                          }60`,
                        }}
                      >
                        <span className="font-retro text-xl text-white">
                          {myEntry.nickname.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <p className="font-retro text-xs text-retro-text">
                        {myEntry.nickname}
                      </p>

                      <div className="flex items-baseline gap-2">
                        <span
                          className={cn(
                            "font-retro text-3xl",
                            myRank === 1
                              ? "text-retro-gold"
                              : myRank === 2
                              ? "text-gray-300"
                              : myRank === 3
                              ? "text-amber-600"
                              : "text-retro-text"
                          )}
                          style={{
                            textShadow:
                              myRank <= 3
                                ? "0 0 12px rgba(255,215,0,0.4)"
                                : undefined,
                          }}
                        >
                          #{myRank}
                        </span>
                        <span className="font-retro text-[10px] text-retro-muted">
                          of {sortedLeaderboard.length}
                        </span>
                      </div>

                      <p
                        className="font-retro text-lg text-retro-gold"
                        style={{
                          textShadow: "0 0 8px rgba(255,215,0,0.3)",
                        }}
                      >
                        {myEntry.score} pts
                      </p>
                    </div>
                  </RetroCard>
                </motion.div>
              )}

              {/* Badges */}
              {badges.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <RetroCard glow="purple" padding="none">
                    <div className="bg-elevated/80 px-4 py-2.5 border-b border-retro-purple/20">
                      <h3 className="font-retro text-[10px] text-retro-purple-light uppercase tracking-wider">
                        Badges Earned
                      </h3>
                    </div>
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {badges.map((badge, i) => (
                        <motion.div
                          key={badge.id}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 0.5 + i * 0.15,
                            type: "spring",
                            stiffness: 250,
                            damping: 15,
                          }}
                          className="flex flex-col items-center gap-2 bg-page/40 border border-retro-purple/15 p-3"
                        >
                          <span className="text-2xl">{badge.icon}</span>
                          <p className="font-retro text-[8px] text-retro-text text-center">
                            {badge.name}
                          </p>
                          <p className="font-body text-[10px] text-retro-muted text-center">
                            {badge.description}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </RetroCard>
                </motion.div>
              )}

              {/* Full Leaderboard */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Leaderboard
                  entries={sortedLeaderboard}
                  myParticipantId={stored?.participantId}
                />
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-3 pt-4"
              >
                <RetroButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => router.push("/join")}
                >
                  PLAY AGAIN
                </RetroButton>
                <RetroButton
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={() => router.push("/")}
                >
                  HOME
                </RetroButton>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
