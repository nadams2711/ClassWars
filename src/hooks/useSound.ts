"use client";
import { useCallback, useRef } from "react";
import { useSoundStore } from "@/stores/soundStore";
import { retroSynth } from "@/lib/sound/synth";
import type { SFXName } from "@/lib/sound/sounds";

export type { SFXName };

export function useSound() {
  const { isMuted, volume } = useSoundStore();
  const isReducedMotion = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  const play = useCallback((name: SFXName) => {
    if (isMuted || isReducedMotion.current || !retroSynth) return;
    retroSynth.setVolume(volume);
    retroSynth.play(name, volume);
  }, [isMuted, volume]);

  return { play };
}
