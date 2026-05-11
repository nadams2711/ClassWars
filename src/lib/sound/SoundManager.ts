"use client";

import { retroSynth } from "./synth";
import type { SFXName } from "./sounds";

class SoundManager {
  private _muted = true;
  private _volume = 0.7;

  get muted() { return this._muted; }
  get volume() { return this._volume; }

  setMuted(muted: boolean) {
    this._muted = muted;
  }

  setVolume(volume: number) {
    this._volume = Math.max(0, Math.min(1, volume));
    retroSynth?.setVolume(this._volume);
  }

  play(name: SFXName) {
    if (this._muted) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    retroSynth?.play(name, this._volume);
  }
}

export const soundManager = typeof window !== "undefined" ? new SoundManager() : null;
