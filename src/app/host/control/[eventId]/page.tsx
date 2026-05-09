"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameState } from "@/hooks/useGameState";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { GameController } from "@/components/host/GameController";
import { cn } from "@/lib/utils";

interface EventData {
  id: string;
  name: string;
  joinCode: string;
  status: string;
  mode: string;
  audience: string;
  maxParticipants: number;
  currentRound: number;
  totalRounds: number;
}

export default function ControlPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const gameState = useGameState(eventId, true);

  // Fetch event data
  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Event not found");
            return;
          }
          if (res.status === 401) {
            router.push("/auth/login");
            return;
          }
          throw new Error("Failed to load event");
        }
        const data = await res.json();
        setEventData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId, router]);

  // Fetch initial participants
  useEffect(() => {
    if (!eventData) return;

    async function fetchParticipants() {
      try {
        const res = await fetch(`/api/events/${eventId}/participants`);
        if (res.ok) {
          const data = await res.json();
          gameState.setParticipants(data);
        }
      } catch {
        // Participants will sync via Pusher
      }
    }
    fetchParticipants();
  }, [eventData, eventId]);

  const handleCopyCode = async () => {
    if (!eventData?.joinCode) return;
    try {
      await navigator.clipboard.writeText(eventData.joinCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="font-retro text-xs text-retro-purple-light animate-pulse">
          LOADING CONTROL PANEL...
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <RetroCard glow="pink" padding="lg" className="max-w-md">
          <h2 className="font-retro text-xs text-retro-pink text-center mb-4">
            ERROR
          </h2>
          <p className="font-body text-sm text-retro-muted text-center mb-4">
            {error || "Event not found"}
          </p>
          <div className="flex justify-center">
            <RetroButton
              variant="secondary"
              size="md"
              onClick={() => router.push("/host")}
            >
              BACK TO DASHBOARD
            </RetroButton>
          </div>
        </RetroCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Top bar */}
      <div className="bg-card border-b-2 border-retro-purple/20 px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Event name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/host")}
              className="font-retro text-[9px] text-retro-muted hover:text-retro-purple-light transition-colors"
            >
              &larr;
            </button>
            <h1 className="font-retro text-xs text-retro-text truncate max-w-[200px]">
              {eventData.name}
            </h1>
          </div>

          {/* Join code */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 group"
            title="Click to copy"
          >
            <span className="font-retro text-[8px] text-retro-muted uppercase">
              CODE:
            </span>
            <span className="font-retro text-lg text-retro-blue tracking-[0.3em] group-hover:text-retro-blue/80 transition-colors">
              {eventData.joinCode}
            </span>
            <span className="font-retro text-[8px] text-retro-green opacity-0 group-hover:opacity-100 transition-opacity">
              {codeCopied ? "COPIED!" : "COPY"}
            </span>
          </button>

          {/* Player count */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-retro-green rounded-full animate-pulse" />
            <span className="font-retro text-[10px] text-retro-muted">
              {gameState.participants.length} PLAYER
              {gameState.participants.length !== 1 ? "S" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Join code display */}
          <div className="lg:col-span-1 space-y-4">
            {/* QR-style join code display */}
            <RetroCard glow="blue" padding="lg">
              <div className="text-center space-y-4">
                <p className="font-retro text-[8px] text-retro-muted uppercase tracking-widest">
                  Go to classwars.app and enter:
                </p>

                <div className="relative">
                  {/* Decorative border */}
                  <div className="absolute inset-0 border-2 border-dashed border-retro-blue/20" />
                  <div className="py-6 px-4">
                    <div className="font-retro text-4xl md:text-5xl text-retro-blue tracking-[0.4em] drop-shadow-[0_0_20px_rgba(0,212,255,0.5)]">
                      {eventData.joinCode}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCopyCode}
                  className={cn(
                    "font-retro text-[9px] uppercase tracking-wider px-4 py-2 border transition-all",
                    codeCopied
                      ? "border-retro-green text-retro-green bg-retro-green/10"
                      : "border-retro-blue/30 text-retro-blue hover:bg-retro-blue/10"
                  )}
                >
                  {codeCopied ? "COPIED TO CLIPBOARD" : "COPY JOIN CODE"}
                </button>

                {/* Pixel decoration */}
                <div className="flex justify-center gap-1 pt-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-retro-blue/20"
                      style={{ opacity: 0.2 + i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </RetroCard>

            {/* Event info */}
            <RetroCard glow="none" padding="sm">
              <div className="space-y-2">
                <div className="flex justify-between text-retro-muted">
                  <span className="font-retro text-[8px] uppercase">Mode</span>
                  <span className="font-body text-xs capitalize">
                    {eventData.mode.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex justify-between text-retro-muted">
                  <span className="font-retro text-[8px] uppercase">
                    Audience
                  </span>
                  <span className="font-body text-xs capitalize">
                    {eventData.audience}
                  </span>
                </div>
                <div className="flex justify-between text-retro-muted">
                  <span className="font-retro text-[8px] uppercase">
                    Max Players
                  </span>
                  <span className="font-body text-xs">
                    {eventData.maxParticipants}
                  </span>
                </div>
              </div>
            </RetroCard>
          </div>

          {/* Right column: Game controller */}
          <div className="lg:col-span-2">
            <RetroCard glow="purple" padding="lg">
              <GameController
                eventId={eventId}
                gameState={{
                  phase: gameState.phase,
                  currentRound: gameState.currentRound,
                  totalRounds: gameState.totalRounds,
                  currentChallenge: gameState.currentChallenge,
                  timerEnd: gameState.timerEnd,
                  participants: gameState.participants,
                  leaderboard: gameState.leaderboard,
                }}
              />
            </RetroCard>
          </div>
        </div>
      </div>
    </div>
  );
}
