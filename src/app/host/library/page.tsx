"use client";

import { useState, useEffect, useMemo } from "react";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroInput } from "@/components/ui/RetroInput";
import { RetroButton } from "@/components/ui/RetroButton";
import { ChallengeLibrary } from "@/components/host/ChallengeLibrary";
import type { ChallengeTemplate } from "@/types/challenge";
import Link from "next/link";

export default function LibraryPage() {
  const [challenges, setChallenges] = useState<ChallengeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChallenges() {
      try {
        const res = await fetch("/api/challenges");
        if (!res.ok) throw new Error("Failed to load challenges");
        const data = await res.json();
        setChallenges(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchChallenges();
  }, []);

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <Link
            href="/host"
            className="font-retro text-[9px] text-retro-muted hover:text-retro-purple-light transition-colors uppercase tracking-wider"
          >
            &larr; BACK
          </Link>
        </div>

        <h1 className="font-retro text-lg md:text-xl text-center text-retro-purple-light mb-1 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
          CHALLENGE LIBRARY
        </h1>
        <p className="font-body text-sm text-retro-muted text-center mb-2">
          Browse all available challenges for your games
        </p>
        <div className="h-px bg-gradient-to-r from-transparent via-retro-purple to-transparent mb-8" />

        {/* Stats bar */}
        {!loading && !error && (
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="text-center">
              <span className="font-retro text-sm text-retro-blue">
                {challenges.length}
              </span>
              <p className="font-retro text-[7px] text-retro-muted uppercase mt-1">
                Total
              </p>
            </div>
            <div className="w-px h-8 bg-retro-purple/20" />
            <div className="text-center">
              <span className="font-retro text-sm text-retro-green">
                {new Set(challenges.map((c) => c.category)).size}
              </span>
              <p className="font-retro text-[7px] text-retro-muted uppercase mt-1">
                Categories
              </p>
            </div>
            <div className="w-px h-8 bg-retro-purple/20" />
            <div className="text-center">
              <span className="font-retro text-sm text-retro-gold">
                {new Set(challenges.map((c) => c.audiencePack)).size}
              </span>
              <p className="font-retro text-[7px] text-retro-muted uppercase mt-1">
                Packs
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="font-retro text-xs text-retro-purple-light animate-pulse">
              LOADING CHALLENGES...
            </div>
            <div className="flex gap-1 mt-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-retro-purple animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <RetroCard glow="pink" padding="md" className="max-w-md mx-auto">
            <p className="font-retro text-[10px] text-retro-pink text-center mb-3">
              {error}
            </p>
            <div className="flex justify-center">
              <RetroButton
                variant="secondary"
                size="sm"
                onClick={() => window.location.reload()}
              >
                RETRY
              </RetroButton>
            </div>
          </RetroCard>
        )}

        {!loading && !error && (
          <ChallengeLibrary
            challenges={challenges}
            selectable={false}
            filters={true}
          />
        )}
      </div>
    </div>
  );
}
