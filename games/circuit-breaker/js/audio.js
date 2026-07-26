/**
 * Sound effects and haptics.
 *
 * All audio is synthesised with the Web Audio API — no files to download, no
 * cache to warm, and nothing to break offline. The context is created lazily on
 * the first user gesture because mobile browsers block audio before then.
 */

import { storage } from './storage.js';

let ctx = null;
let master = null;
let soundOn = true;
let hapticsOn = true;

/* Output stage. Voice gains are relative mix values; MASTER_GAIN sets the
   absolute level, and a compressor acts as a limiter so several voices landing
   together during a cascade duck instead of clipping.
   Levels verified with tools/measure-audio.js. */
const MASTER_GAIN = 1.7;

/** gain → limiter → destination. Shared by live playback and offline renders. */
function buildChain(ac) {
  const gain = ac.createGain();
  gain.gain.value = MASTER_GAIN;
  const limiter = ac.createDynamicsCompressor();
  limiter.threshold.setValueAtTime(-6, ac.currentTime);
  limiter.knee.setValueAtTime(2, ac.currentTime);
  limiter.ratio.setValueAtTime(14, ac.currentTime);
  limiter.attack.setValueAtTime(0.002, ac.currentTime);
  limiter.release.setValueAtTime(0.12, ac.currentTime);
  gain.connect(limiter).connect(ac.destination);
  return gain;
}

export const audio = {
  init() {
    soundOn = storage.soundEnabled;
    hapticsOn = storage.hapticsEnabled;
  },

  get soundEnabled() { return soundOn; },
  get hapticsEnabled() { return hapticsOn; },

  setSound(on) {
    soundOn = !!on;
    storage.soundEnabled = soundOn;
    if (soundOn) audio.unlock();
  },

  setHaptics(on) {
    hapticsOn = !!on;
    storage.hapticsEnabled = hapticsOn;
  },

  get hapticsSupported() {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  },

  /** Safe to call on every gesture; only the first call does any work. */
  unlock() {
    if (!soundOn) return;
    try {
      if (!ctx) {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return;
        ctx = new Ctor();
        master = buildChain(ctx);
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch {
      ctx = null;
    }
  },

  play(name, arg) {
    if (!soundOn) return;
    audio.unlock();
    if (!ctx || ctx.state !== 'running') return;
    const fn = VOICES[name];
    if (fn) {
      try {
        fn(ctx, master, arg);
      } catch {
        /* Never let an audio glitch interrupt gameplay. */
      }
    }
  },

  /** Voice names, for tooling. */
  get voiceNames() {
    return Object.keys(VOICES);
  },

  /**
   * Renders one voice (or several together, to check overlap headroom) offline
   * through the real output chain. Used by tools/measure-audio.js to verify
   * levels without needing a user gesture.
   */
  async render(name, arg, { seconds = 2, sampleRate = 44100 } = {}) {
    const Ctor = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!Ctor) return null;
    const names = Array.isArray(name) ? name : [name];
    if (names.some((n) => !VOICES[n])) return null;
    const offline = new Ctor(1, Math.ceil(seconds * sampleRate), sampleRate);
    const dest = buildChain(offline);
    names.forEach((n) => VOICES[n](offline, dest, arg));
    return offline.startRendering();
  },

  buzz(pattern) {
    if (!hapticsOn || !audio.hapticsSupported) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  },
};

/* ---------------------------------------------------------------------------
   Tiny synth helpers
   --------------------------------------------------------------------------- */

function tone(ac, dest, { freq, to, type = 'sine', dur = 0.12, gain = 0.2, delay = 0 }) {
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to && to !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.02, dur * 0.3));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(dest);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const noiseBuffers = new WeakMap();
function getNoise(ac) {
  if (!noiseBuffers.has(ac)) {
    const len = Math.floor(ac.sampleRate * 0.5);
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ac, buffer);
  }
  return noiseBuffers.get(ac);
}

function noise(ac, dest, { dur = 0.18, gain = 0.18, from = 2400, to = 300, q = 4, delay = 0 }) {
  const t0 = ac.currentTime + delay;
  const src = ac.createBufferSource();
  src.buffer = getNoise(ac);
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, t0);
  filter.frequency.exponentialRampToValueAtTime(Math.max(60, to), t0 + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(g).connect(dest);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

const SEMITONE = 1.0594630943592953;
const step = (base, n) => base * SEMITONE ** n;

const VOICES = {
  select: (ac, d) => tone(ac, d, { freq: 900, to: 1150, type: 'triangle', dur: 0.07, gain: 0.13 }),

  button: (ac, d) => tone(ac, d, { freq: 520, to: 700, type: 'square', dur: 0.05, gain: 0.14 }),

  swap: (ac, d) => {
    tone(ac, d, { freq: 420, to: 640, type: 'triangle', dur: 0.1, gain: 0.14 });
    noise(ac, d, { dur: 0.08, gain: 0.05, from: 1800, to: 900, q: 6 });
  },

  invalid: (ac, d) => {
    tone(ac, d, { freq: 150, to: 96, type: 'sawtooth', dur: 0.16, gain: 0.12 });
    tone(ac, d, { freq: 100, to: 70, type: 'square', dur: 0.14, gain: 0.06, delay: 0.02 });
  },

  /** Pitch climbs with cascade depth so chains sound like they build. */
  match: (ac, d, depth = 1) => {
    const base = step(560, Math.min(12, (depth - 1) * 2));
    tone(ac, d, { freq: base, to: base * 1.9, type: 'sine', dur: 0.14, gain: 0.16 });
    tone(ac, d, { freq: base * 2, to: base * 3, type: 'sine', dur: 0.1, gain: 0.06, delay: 0.02 });
    noise(ac, d, { dur: 0.12, gain: 0.06, from: 3200, to: 1200, q: 3 });
  },

  matchBig: (ac, d, depth = 1) => {
    const base = step(480, Math.min(12, (depth - 1) * 2));
    [0, 4, 7].forEach((n, i) => tone(ac, d, {
      freq: step(base, n),
      to: step(base, n) * 1.6,
      type: 'triangle',
      dur: 0.24,
      gain: 0.1,
      delay: i * 0.035,
    }));
    noise(ac, d, { dur: 0.26, gain: 0.09, from: 4200, to: 700, q: 2 });
  },

  cascade: (ac, d, depth = 2) => {
    const base = step(660, Math.min(14, (depth - 2) * 3));
    [0, 3, 7, 12].forEach((n, i) => tone(ac, d, {
      freq: step(base, n),
      type: 'sine',
      dur: 0.11,
      gain: 0.09,
      delay: i * 0.045,
    }));
  },

  specialCreate: (ac, d) => {
    tone(ac, d, { freq: 700, to: 1900, type: 'triangle', dur: 0.3, gain: 0.12 });
    tone(ac, d, { freq: 1400, to: 2600, type: 'sine', dur: 0.24, gain: 0.05, delay: 0.05 });
  },

  specialActivate: (ac, d) => {
    noise(ac, d, { dur: 0.3, gain: 0.16, from: 5200, to: 220, q: 1.5 });
    tone(ac, d, { freq: 220, to: 70, type: 'sawtooth', dur: 0.26, gain: 0.11 });
  },

  /* An alert should cut through routine feedback without dominating the mix. */
  heatWarning: (ac, d) => {
    tone(ac, d, { freq: 720, type: 'square', dur: 0.09, gain: 0.1 });
    tone(ac, d, { freq: 560, type: 'square', dur: 0.11, gain: 0.1, delay: 0.13 });
  },

  cool: (ac, d) => tone(ac, d, { freq: 1500, to: 2400, type: 'sine', dur: 0.16, gain: 0.11 }),

  deadlock: (ac, d) => {
    tone(ac, d, { freq: 300, to: 240, type: 'sawtooth', dur: 0.3, gain: 0.14 });
    noise(ac, d, { dur: 0.5, gain: 0.11, from: 900, to: 300, q: 2 });
  },

  gameOver: (ac, d) => {
    noise(ac, d, { dur: 0.9, gain: 0.18, from: 5000, to: 90, q: 1 });
    [0, -3, -7, -12, -19].forEach((n, i) => tone(ac, d, {
      freq: step(340, n),
      to: step(340, n) * 0.7,
      type: 'sawtooth',
      dur: 0.4,
      gain: 0.1,
      delay: i * 0.11,
    }));
  },
};

export const HAPTIC = {
  invalid: [18, 40, 18],
  match: 12,
  bigMatch: [10, 30, 24],
  cascade: [14, 26, 14, 26, 22],
  critical: [26, 60, 26],
  gameOver: [40, 60, 40, 60, 140],
};
