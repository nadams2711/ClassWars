"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameState } from "@/hooks/useGameState";
import { AvatarPicker } from "@/components/game/AvatarPicker";
import { PixelAvatar, getAvatarColor } from "@/components/game/PixelAvatar";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface StoredParticipant {
  participantId: string;
  eventId: string;
  nickname: string;
}

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [stored, setStored] = useState<StoredParticipant | null>(null);
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [eventName, setEventName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [teamMode, setTeamMode] = useState(false);
  const [teams, setTeams] = useState<{ id: string; name: string; color: string | null }[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");

  const game = useGameState(eventId);

  // Load stored participant info from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("classwars_participant");
      if (raw) {
        const parsed: StoredParticipant = JSON.parse(raw);
        if (parsed.eventId === eventId) {
          setStored(parsed);
          game.setMyParticipantId(parsed.participantId);
        } else {
          setLoadError("You are not part of this event.");
        }
      } else {
        setLoadError("No session found. Please join the game first.");
      }
    } catch {
      setLoadError("Invalid session data.");
    }
  }, [eventId]);

  // Fetch event details and check if game already started
  useEffect(() => {
    if (!eventId) return;
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${eventId}/state`);
        if (res.ok) {
          const data = await res.json();
          // If the game is already active/started, redirect to play
          if (data.phase !== "LOBBY") {
            router.push(`/play/${eventId}`);
            return;
          }
          if (data.participants?.length) {
            game.setParticipants(data.participants);
          }
        }

        // Also fetch event metadata
        const eventRes = await fetch(`/api/events/${eventId}`);
        if (eventRes.ok) {
          const eventData = await eventRes.json();
          setEventName(eventData.name || "Dead Time");
          setJoinCode(eventData.joinCode || "");
          setTeamMode(eventData.teamMode || false);
          if (eventData.teams) setTeams(eventData.teams);
        }
      } catch {
        // Non-critical; continue with defaults
      }
    }
    fetchEvent();
  }, [eventId]);

  // Redirect when game starts (phase changes from LOBBY)
  useEffect(() => {
    if (game.phase !== "LOBBY" && game.phase !== "COUNTDOWN") return;
    if (game.phase === "COUNTDOWN") {
      router.push(`/play/${eventId}`);
    }
  }, [game.phase, eventId, router]);

  // Handle avatar selection
  const handleAvatarSelect = useCallback(
    async (index: number) => {
      setAvatarIndex(index);
      if (!stored) return;
      setUpdatingAvatar(true);
      try {
        await fetch(`/api/events/participant/${stored.participantId}/avatar`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarIndex: index }),
        });
      } catch {
        // Non-critical, avatar just might not sync
      } finally {
        setUpdatingAvatar(false);
      }
    },
    [stored]
  );

  // Handle ready toggle
  const handleReadyToggle = useCallback(async () => {
    const newReady = !isReady;
    setIsReady(newReady);
    if (!stored) return;
    try {
      await fetch(`/api/events/participant/${stored.participantId}/ready`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isReady: newReady }),
      });
    } catch {
      setIsReady(!newReady); // revert on failure
    }
  }, [isReady, stored]);

  // Handle team selection
  const handleTeamSelect = useCallback(
    async (teamId: string) => {
      setSelectedTeam(teamId);
      if (!stored) return;
      try {
        await fetch(`/api/events/participant/${stored.participantId}/team`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId }),
        });
      } catch {
        setSelectedTeam(null);
      }
    },
    [stored]
  );

  // Error state
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <RetroCard glow="pink" padding="lg" className="max-w-sm w-full text-center">
          <h2 className="font-retro text-sm text-retro-pink mb-4">OOPS</h2>
          <p className="font-body text-sm text-retro-muted mb-6">{loadError}</p>
          <RetroButton variant="secondary" onClick={() => router.push("/join")}>
            Go to Join
          </RetroButton>
        </RetroCard>
      </div>
    );
  }

  const nickname = stored?.nickname || "Player";
  const participantsList = game.participants || [];
  const selectedColor = getAvatarColor(avatarIndex);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10 relative">
      <ScanlineOverlay />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1
          className="font-retro text-lg sm:text-xl text-retro-purple-light mb-2"
          style={{
            textShadow:
              "0 0 8px rgba(168,85,247,0.5), 0 0 16px rgba(168,85,247,0.25)",
          }}
        >
          {eventName || "DEAD TIME"}
        </h1>
        <p className="font-retro text-[10px] text-retro-muted uppercase tracking-wider">
          Waiting Room
        </p>
      </motion.div>

      <div className="w-full max-w-lg flex flex-col gap-5">
        {/* Join Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <RetroCard glow="blue" padding="md" className="text-center">
            <p className="font-retro text-[9px] text-retro-muted uppercase tracking-wider mb-2">
              Share Code
            </p>
            <div className="flex justify-center gap-1 sm:gap-2">
              {(joinCode || "------").split("").map((char, i) => (
                <div
                  key={i}
                  className="w-8 h-10 sm:w-10 sm:h-12 bg-page border-2 border-retro-blue/40 flex items-center justify-center"
                >
                  <span
                    className="font-retro text-base sm:text-xl text-retro-blue"
                    style={{
                      textShadow: "0 0 8px rgba(0,212,255,0.4)",
                    }}
                  >
                    {char}
                  </span>
                </div>
              ))}
            </div>
          </RetroCard>
        </motion.div>

        {/* Your Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <RetroCard glow="purple" padding="md">
            <div className="flex flex-col gap-4">
              {/* Nickname display */}
              <div className="flex items-center gap-3">
                <div
                  className="p-1 shrink-0"
                  style={{
                    border: `2px solid ${selectedColor}`,
                    boxShadow: `0 0 16px ${selectedColor}60`,
                  }}
                >
                  <PixelAvatar avatarIndex={avatarIndex} size="lg" />
                </div>
                <div>
                  <p className="font-retro text-xs text-retro-text">
                    {nickname}
                  </p>
                  <p className="font-body text-[10px] text-retro-muted">
                    {isReady ? "Ready to go!" : "Not ready yet"}
                  </p>
                </div>
              </div>

              {/* Avatar Picker */}
              <AvatarPicker
                selectedIndex={avatarIndex}
                onSelect={handleAvatarSelect}
              />

              {/* Team Selector */}
              {teamMode && teams.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="font-retro text-[10px] text-retro-muted uppercase tracking-wider">
                    Select Team
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {teams.map((team) => (
                      <motion.button
                        key={team.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTeamSelect(team.id)}
                        className={cn(
                          "px-3 py-2.5 border transition-all duration-150 text-left",
                          selectedTeam === team.id
                            ? "border-retro-purple-light bg-retro-purple/15"
                            : "border-retro-purple/20 bg-elevated/30 hover:border-retro-purple/40"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {team.color && (
                            <div
                              className="w-3 h-3 shrink-0"
                              style={{ backgroundColor: team.color }}
                            />
                          )}
                          <span className="font-retro text-[9px] text-retro-text truncate">
                            {team.name}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ready Button */}
              <RetroButton
                variant={isReady ? "success" : "secondary"}
                size="lg"
                fullWidth
                onClick={handleReadyToggle}
                className={cn(
                  isReady &&
                    "shadow-[0_4px_0_#065f46,0_0_24px_rgba(57,255,20,0.3)]"
                )}
              >
                {isReady ? "READY!" : "TAP WHEN READY"}
              </RetroButton>
            </div>
          </RetroCard>
        </motion.div>

        {/* Live Players List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <RetroCard glow="none" padding="none">
            <div className="bg-elevated/80 px-4 py-3 border-b border-retro-purple/20 flex items-center justify-between">
              <h3 className="font-retro text-[10px] text-retro-muted uppercase tracking-wider">
                Players
              </h3>
              <span className="font-retro text-[10px] text-retro-purple-light">
                {participantsList.length}
              </span>
            </div>

            <div className="divide-y divide-retro-purple/10 max-h-64 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {participantsList.map((p, i) => {
                  const isMe = p.id === stored?.participantId;
                  return (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5",
                        isMe && "bg-retro-purple/5"
                      )}
                    >
                      {/* Avatar */}
                      <PixelAvatar avatarIndex={p.avatarIndex} size="sm" />

                      {/* Name */}
                      <span
                        className={cn(
                          "font-retro text-[10px] truncate flex-1",
                          isMe
                            ? "text-retro-purple-light"
                            : "text-retro-text"
                        )}
                      >
                        {p.nickname}
                        {isMe && (
                          <span className="text-retro-muted ml-1">(you)</span>
                        )}
                      </span>

                      {/* Ready status */}
                      <div
                        className={cn(
                          "w-5 h-5 flex items-center justify-center shrink-0 transition-colors",
                          p.isReady
                            ? "bg-retro-green/20 text-retro-green"
                            : "bg-retro-muted/10 text-retro-muted/30"
                        )}
                      >
                        <span className="text-[10px]">
                          {p.isReady ? "\u2714" : "\u2022"}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {participantsList.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <p className="font-retro text-[10px] text-retro-muted">
                    Waiting for players to join...
                  </p>
                </div>
              )}
            </div>
          </RetroCard>
        </motion.div>

        {/* Waiting message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-4"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <div
              className="w-2 h-2 bg-retro-purple-light animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 bg-retro-blue animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-2 h-2 bg-retro-green animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
          <p className="font-retro text-[9px] text-retro-muted uppercase tracking-wider">
            Waiting for host to start...
          </p>
        </motion.div>
      </div>
    </div>
  );
}
