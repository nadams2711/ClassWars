import type { SFXName } from "./sounds";

/**
 * Retro 8-bit sound synthesizer using Web Audio API.
 * Generates all game sounds programmatically — no audio files needed.
 */
class RetroSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    // Resume if suspended (browser autoplay policy)
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getOutput(): GainNode {
    this.getContext();
    return this.masterGain!;
  }

  setVolume(v: number) {
    const out = this.getOutput();
    out.gain.setValueAtTime(Math.max(0, Math.min(1, v)), this.getContext().currentTime);
  }

  play(name: SFXName, volume: number) {
    const ctx = this.getContext();
    const out = this.getOutput();

    // Per-sound gain
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.connect(out);

    const fn = SOUNDS[name];
    if (fn) fn(ctx, gain);
  }

  // --- helpers used by sound functions ---

  static osc(
    ctx: AudioContext,
    dest: AudioNode,
    type: OscillatorType,
    freq: number,
    startTime: number,
    duration: number,
    volume = 0.3,
    freqEnd?: number,
  ) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, startTime);
    if (freqEnd !== undefined) {
      o.frequency.linearRampToValueAtTime(freqEnd, startTime + duration);
    }
    g.gain.setValueAtTime(volume, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    o.connect(g).connect(dest);
    o.start(startTime);
    o.stop(startTime + duration);
  }

  static noise(
    ctx: AudioContext,
    dest: AudioNode,
    startTime: number,
    duration: number,
    volume = 0.15,
  ) {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.setValueAtTime(volume, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    src.connect(g).connect(dest);
    src.start(startTime);
    src.stop(startTime + duration);
    return { source: src, gain: g };
  }
}

type SoundFn = (ctx: AudioContext, dest: AudioNode) => void;

const S = RetroSynth; // shorthand

const SOUNDS: Record<SFXName, SoundFn> = {
  // Quick square wave blip: 800Hz -> 1200Hz, 60ms
  menu_select(ctx, dest) {
    S.osc(ctx, dest, "square", 800, ctx.currentTime, 0.06, 0.2, 1200);
  },

  // Two-tone confirm: 600Hz -> 900Hz, 100ms
  menu_confirm(ctx, dest) {
    const t = ctx.currentTime;
    S.osc(ctx, dest, "square", 600, t, 0.05, 0.2);
    S.osc(ctx, dest, "square", 900, t + 0.05, 0.06, 0.2);
  },

  // Rising arpeggio: C5 -> E5 -> G5
  join_success(ctx, dest) {
    const t = ctx.currentTime;
    S.osc(ctx, dest, "square", 523, t, 0.08, 0.2);        // C5
    S.osc(ctx, dest, "square", 659, t + 0.05, 0.08, 0.2);  // E5
    S.osc(ctx, dest, "square", 784, t + 0.1, 0.12, 0.2);   // G5
  },

  // Short chirp: 1000Hz -> 1400Hz, 80ms
  ready_up(ctx, dest) {
    S.osc(ctx, dest, "square", 1000, ctx.currentTime, 0.08, 0.2, 1400);
  },

  // Sharp tick: 440Hz square, 80ms fast decay
  countdown_tick(ctx, dest) {
    S.osc(ctx, dest, "square", 440, ctx.currentTime, 0.08, 0.25);
  },

  // Triumphant chord: C4+E4+G4, 300ms
  countdown_go(ctx, dest) {
    const t = ctx.currentTime;
    S.osc(ctx, dest, "square", 262, t, 0.3, 0.15);   // C4
    S.osc(ctx, dest, "square", 330, t, 0.3, 0.15);   // E4
    S.osc(ctx, dest, "square", 392, t, 0.3, 0.15);   // G4
    S.osc(ctx, dest, "triangle", 523, t, 0.3, 0.1);  // C5 octave brightness
  },

  // Low warning pulse: 300Hz, 150ms
  timer_warning(ctx, dest) {
    S.osc(ctx, dest, "square", 300, ctx.currentTime, 0.15, 0.2);
  },

  // Fast double-beep: 600Hz, 50ms x2
  timer_critical(ctx, dest) {
    const t = ctx.currentTime;
    S.osc(ctx, dest, "square", 600, t, 0.05, 0.25);
    S.osc(ctx, dest, "square", 600, t + 0.08, 0.05, 0.25);
  },

  // Happy rising: 500 -> 700 -> 1000Hz, 50ms each
  submit_success(ctx, dest) {
    const t = ctx.currentTime;
    S.osc(ctx, dest, "square", 500, t, 0.06, 0.2);
    S.osc(ctx, dest, "square", 700, t + 0.05, 0.06, 0.2);
    S.osc(ctx, dest, "square", 1000, t + 0.1, 0.1, 0.2);
  },

  // Drum roll: noise burst + rising sweep, 400ms
  score_reveal(ctx, dest) {
    const t = ctx.currentTime;
    // Rapid noise bursts simulating a drum roll
    for (let i = 0; i < 8; i++) {
      S.noise(ctx, dest, t + i * 0.04, 0.03, 0.08 + i * 0.01);
    }
    // Rising sweep on top
    S.osc(ctx, dest, "sawtooth", 200, t, 0.4, 0.1, 800);
  },

  // Ascending slide: 400 -> 800Hz, 200ms
  rank_up(ctx, dest) {
    S.osc(ctx, dest, "triangle", 400, ctx.currentTime, 0.2, 0.25, 800);
  },

  // Descending slide: 800 -> 400Hz, 200ms
  rank_down(ctx, dest) {
    S.osc(ctx, dest, "sawtooth", 800, ctx.currentTime, 0.2, 0.2, 400);
  },

  // Noise sweep with bandpass filter sweep 200 -> 2000Hz, 300ms
  vs_whoosh(ctx, dest) {
    const t = ctx.currentTime;
    const { source, gain: noiseGain } = S.noise(ctx, ctx.createGain(), t, 0.3, 0.25);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.setValueAtTime(2, t);
    filter.frequency.setValueAtTime(200, t);
    filter.frequency.exponentialRampToValueAtTime(2000, t + 0.3);
    // Reconnect: source -> noiseGain -> filter -> dest
    noiseGain.disconnect();
    source.disconnect();
    source.connect(noiseGain).connect(filter).connect(dest);
  },

  // Impact: low freq burst 80Hz + noise hit, 150ms
  vs_slam(ctx, dest) {
    const t = ctx.currentTime;
    S.osc(ctx, dest, "square", 80, t, 0.15, 0.3, 40);
    S.noise(ctx, dest, t, 0.08, 0.2);
  },

  // Major arpeggio: C4 -> E4 -> G4 -> C5, 100ms each, held final
  victory_fanfare(ctx, dest) {
    const t = ctx.currentTime;
    S.osc(ctx, dest, "square", 262, t, 0.12, 0.2);          // C4
    S.osc(ctx, dest, "square", 330, t + 0.1, 0.12, 0.2);    // E4
    S.osc(ctx, dest, "square", 392, t + 0.2, 0.12, 0.2);    // G4
    S.osc(ctx, dest, "square", 523, t + 0.3, 0.4, 0.2);     // C5 held
    S.osc(ctx, dest, "triangle", 523, t + 0.3, 0.4, 0.15);  // C5 doubling
  },

  // Shorter fanfare: E4 -> G4 -> B4, 80ms each
  silver_fanfare(ctx, dest) {
    const t = ctx.currentTime;
    S.osc(ctx, dest, "square", 330, t, 0.1, 0.2);        // E4
    S.osc(ctx, dest, "square", 392, t + 0.08, 0.1, 0.2); // G4
    S.osc(ctx, dest, "square", 494, t + 0.16, 0.2, 0.2); // B4
  },

  // Single impact tone: 330Hz, 200ms
  bronze_hit(ctx, dest) {
    const t = ctx.currentTime;
    S.osc(ctx, dest, "square", 330, t, 0.2, 0.25);
    S.osc(ctx, dest, "triangle", 165, t, 0.15, 0.1); // sub octave
  },

  // Sparkle: rapid high notes 1200 -> 1600 -> 2000 -> 1800, 40ms each
  badge_unlock(ctx, dest) {
    const t = ctx.currentTime;
    S.osc(ctx, dest, "square", 1200, t, 0.05, 0.15);
    S.osc(ctx, dest, "square", 1600, t + 0.04, 0.05, 0.15);
    S.osc(ctx, dest, "square", 2000, t + 0.08, 0.05, 0.15);
    S.osc(ctx, dest, "square", 1800, t + 0.12, 0.08, 0.15);
  },

  // Noise burst with high-pass, 100ms
  confetti_pop(ctx, dest) {
    const t = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(2000, t);
    src.connect(hp).connect(g).connect(dest);
    src.start(t);
    src.stop(t + 0.1);
  },

  // White noise shaped with envelope, 500ms
  crowd_cheer(ctx, dest) {
    const t = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.15, t + 0.05);
    g.gain.setValueAtTime(0.15, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(1500, t);
    bp.Q.setValueAtTime(0.5, t);
    src.connect(bp).connect(g).connect(dest);
    src.start(t);
    src.stop(t + 0.5);
  },

  // Low sawtooth buzz: 150Hz, 200ms
  error_buzz(ctx, dest) {
    const t = ctx.currentTime;
    S.osc(ctx, dest, "sawtooth", 150, t, 0.1, 0.2);
    S.osc(ctx, dest, "sawtooth", 150, t + 0.12, 0.1, 0.2);
  },

  // Complete jingle: G4 -> C5 -> E5, 80ms each
  round_complete(ctx, dest) {
    const t = ctx.currentTime;
    S.osc(ctx, dest, "square", 392, t, 0.1, 0.2);        // G4
    S.osc(ctx, dest, "square", 523, t + 0.08, 0.1, 0.2);  // C5
    S.osc(ctx, dest, "square", 659, t + 0.16, 0.15, 0.2); // E5
  },

  // Dramatic descending: C5 -> G4 -> E4 -> C4, 150ms each, final held
  game_over(ctx, dest) {
    const t = ctx.currentTime;
    S.osc(ctx, dest, "square", 523, t, 0.15, 0.2);          // C5
    S.osc(ctx, dest, "square", 392, t + 0.15, 0.15, 0.2);   // G4
    S.osc(ctx, dest, "square", 330, t + 0.3, 0.15, 0.2);    // E4
    S.osc(ctx, dest, "square", 262, t + 0.45, 0.4, 0.2);    // C4 held
    S.osc(ctx, dest, "triangle", 131, t + 0.45, 0.4, 0.1);  // C3 sub
  },

  // Quick pop: 1200Hz triangle, 40ms
  reaction_pop(ctx, dest) {
    S.osc(ctx, dest, "triangle", 1200, ctx.currentTime, 0.04, 0.2);
  },

  // Low sustained tone with vibrato: 200Hz, 600ms
  dramatic_pause(ctx, dest) {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(200, t);
    // Vibrato via LFO
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(6, t);
    lfoGain.gain.setValueAtTime(10, t);
    lfo.connect(lfoGain).connect(o.frequency);
    lfo.start(t);
    lfo.stop(t + 0.6);
    g.gain.setValueAtTime(0.15, t);
    g.gain.setValueAtTime(0.15, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + 0.6);
  },
};

// Singleton
export const retroSynth = typeof window !== "undefined" ? new RetroSynth() : null;
