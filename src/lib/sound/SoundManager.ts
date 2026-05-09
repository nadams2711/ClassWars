"use client";

import { Howl, Howler } from "howler";
import type { SFXName } from "./sounds";

class SoundManager {
  private sounds: Map<string, Howl> = new Map();
  private _muted = true;
  private _volume = 0.7;

  get muted() { return this._muted; }
  get volume() { return this._volume; }

  setMuted(muted: boolean) {
    this._muted = muted;
    Howler.mute(muted);
  }

  setVolume(volume: number) {
    this._volume = Math.max(0, Math.min(1, volume));
    Howler.volume(this._volume);
  }

  play(name: SFXName) {
    if (this._muted) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let sound = this.sounds.get(name);
    if (!sound) {
      sound = new Howl({
        src: [`/audio/sfx/${name}.mp3`],
        volume: this._volume,
        preload: true,
      });
      this.sounds.set(name, sound);
    }
    sound.play();
  }

  preload(names: SFXName[]) {
    names.forEach(name => {
      if (!this.sounds.has(name)) {
        this.sounds.set(name, new Howl({
          src: [`/audio/sfx/${name}.mp3`],
          volume: this._volume,
          preload: true,
        }));
      }
    });
  }
}

export const soundManager = typeof window !== "undefined" ? new SoundManager() : null;
