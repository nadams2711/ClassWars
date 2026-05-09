"use client";
import { useCallback, useRef } from "react";
import { useSoundStore } from "@/stores/soundStore";

type SoundName =
  | "menu_select" | "menu_confirm" | "join_success" | "ready_up"
  | "countdown_tick" | "countdown_go" | "timer_warning" | "timer_critical"
  | "submit_success" | "score_reveal" | "rank_up" | "rank_down"
  | "vs_whoosh" | "vs_slam" | "victory_fanfare" | "silver_fanfare"
  | "bronze_hit" | "badge_unlock" | "confetti_pop" | "crowd_cheer"
  | "error_buzz" | "round_complete" | "game_over" | "reaction_pop"
  | "dramatic_pause";

// Simple in-memory cache for Howl instances
const soundCache: Record<string, any> = {};

export function useSound() {
  const { isMuted, volume } = useSoundStore();
  const isReducedMotion = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  const play = useCallback(async (name: SoundName) => {
    if (isMuted || isReducedMotion.current) return;

    try {
      // Dynamically import howler only when needed
      const { Howl } = await import("howler");

      if (!soundCache[name]) {
        soundCache[name] = new Howl({
          src: [`/audio/sfx/${name}.mp3`],
          volume: volume,
          preload: true,
        });
      } else {
        soundCache[name].volume(volume);
      }

      soundCache[name].play();
    } catch {
      // Silently fail - sounds are enhancement not critical
    }
  }, [isMuted, volume]);

  return { play };
}
