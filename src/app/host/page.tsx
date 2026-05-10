"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { signOut } from "next-auth/react";

interface HostEvent {
  id: string;
  name: string;
  status: string;
  mode: string;
  joinCode: string | null;
  currentRound: number;
  totalRounds: number;
  maxParticipants: number;
  createdAt: string;
  _playerCount?: number;
}

const statusConfig: Record<string, { label: string; color: string; glow: string }> = {
  draft: {
    label: "DRAFT",
    color: "bg-retro-muted/20 text-retro-muted border border-retro-muted/40",
    glow: "",
  },
  lobby: {
    label: "LOBBY",
    color: "bg-retro-blue/20 text-retro-blue border border-retro-blue/40",
    glow: "shadow-[0_0_8px_rgba(0,212,255,0.3)]",
  },
  active: {
    label: "LIVE",
    color: "bg-retro-green/20 text-retro-green border border-retro-green/40",
    glow: "shadow-[0_0_8px_rgba(57,255,20,0.3)]",
  },
  paused: {
    label: "PAUSED",
    color: "bg-retro-gold/20 text-retro-gold border border-retro-gold/40",
    glow: "shadow-[0_0_8px_rgba(255,215,0,0.3)]",
  },
  completed: {
    label: "DONE",
    color: "bg-retro-gold/20 text-retro-gold border border-retro-gold/40",
    glow: "",
  },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HostDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<HostEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/auth/login");
            return;
          }
          throw new Error("Failed to load events");
        }
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [router]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  const handleEventClick = (event: HostEvent) => {
    if (event.status === "lobby" || event.status === "active" || event.status === "paused") {
      router.push(`/host/control/${event.id}`);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Delete this game? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch {
      setError("Failed to delete game");
    }
  };

  return (
    <div className="min-h-screen bg-page relative">
      {/* Sign out button */}
      <button
        onClick={handleSignOut}
        className="absolute top-4 right-4 font-retro text-[9px] uppercase tracking-wider text-retro-muted hover:text-retro-pink transition-colors"
      >
        Sign Out
      </button>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <h1 className="font-retro text-2xl md:text-3xl text-center text-retro-purple-light mb-2 drop-shadow-[0_0_24px_rgba(168,85,247,0.5)]">
          COMMAND CENTER
        </h1>
        <div className="h-px bg-gradient-to-r from-transparent via-retro-purple to-transparent mb-10" />

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/host/create">
            <RetroButton variant="primary" size="lg" className="w-full sm:w-auto min-w-[220px]">
              + CREATE NEW GAME
            </RetroButton>
          </Link>
          <Link href="/host/library">
            <RetroButton variant="secondary" size="lg" className="w-full sm:w-auto min-w-[220px]">
              CHALLENGE LIBRARY
            </RetroButton>
          </Link>
        </div>

        {/* Past events section */}
        <div className="mb-4">
          <h2 className="font-retro text-xs text-retro-muted uppercase tracking-widest mb-6">
            Your Games
          </h2>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="font-retro text-xs text-retro-purple-light animate-pulse">
              LOADING...
            </div>
          </div>
        )}

        {error && (
          <RetroCard glow="pink" padding="md">
            <p className="font-retro text-[10px] text-retro-pink text-center">{error}</p>
          </RetroCard>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            {/* Pixel art decoration */}
            <div className="grid grid-cols-5 gap-1 opacity-30">
              {Array.from({ length: 25 }).map((_, i) => {
                const pattern = [
                  0, 1, 1, 1, 0,
                  1, 0, 1, 0, 1,
                  1, 1, 1, 1, 1,
                  1, 0, 0, 0, 1,
                  0, 1, 0, 1, 0,
                ];
                return (
                  <div
                    key={i}
                    className={`w-3 h-3 ${pattern[i] ? "bg-retro-purple" : "bg-transparent"}`}
                  />
                );
              })}
            </div>
            <p className="font-retro text-xs text-retro-muted text-center">
              No games yet.
            </p>
            <p className="font-body text-sm text-retro-muted/70 text-center">
              Create your first game and get the party started!
            </p>
            <Link href="/host/create">
              <RetroButton variant="primary" size="md">
                CREATE YOUR FIRST GAME
              </RetroButton>
            </Link>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="space-y-3">
            {events.map((event) => {
              const status = statusConfig[event.status] || statusConfig.draft;
              const isClickable = ["lobby", "active", "paused"].includes(event.status);

              return (
                <RetroCard
                  key={event.id}
                  glow={event.status === "active" ? "green" : event.status === "lobby" ? "blue" : "none"}
                  hoverable={isClickable}
                  padding="md"
                  className={isClickable ? "cursor-pointer" : ""}
                >
                  <div
                    onClick={() => isClickable && handleEventClick(event)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-retro text-[11px] text-retro-text truncate">
                          {event.name}
                        </h3>
                        <span
                          className={`font-retro text-[8px] px-2 py-0.5 rounded-sm whitespace-nowrap ${status.color} ${status.glow}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 font-body text-xs text-retro-muted">
                        <span>{formatDate(event.createdAt)}</span>
                        <span className="text-retro-muted/50">|</span>
                        <span>{event.mode.replace(/_/g, " ").toUpperCase()}</span>
                        {event.joinCode && (
                          <>
                            <span className="text-retro-muted/50">|</span>
                            <span className="text-retro-blue font-mono">{event.joinCode}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {event.totalRounds > 0 && (
                        <span className="font-retro text-[9px] text-retro-muted">
                          {event.currentRound}/{event.totalRounds} RDS
                        </span>
                      )}
                      {isClickable && (
                        <span className="font-retro text-[9px] text-retro-purple-light">
                          RESUME &gt;
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(event.id);
                        }}
                        className="font-retro text-[8px] text-retro-muted/40 hover:text-retro-pink transition-colors px-1.5 py-1"
                        title="Delete game"
                      >
                        DEL
                      </button>
                    </div>
                  </div>
                </RetroCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
