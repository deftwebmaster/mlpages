/**
 * audio.js — Synthesised sound. No audio files ship with the game.
 *
 * Every effect is generated with oscillators and a small noise buffer, which
 * keeps the whole install a few tens of kilobytes and means offline mode has
 * nothing extra to cache. Browsers block audio until a gesture, so the context
 * is created lazily on first interaction and every entry point tolerates the
 * context being missing, suspended or outright refused.
 */

import { CONFIG } from './config.js';

const NOTES = {
  c3: 130.81, e3: 164.81, g3: 196.0, a3: 220.0,
  c4: 261.63, d4: 293.66, e4: 329.63, g4: 392.0, a4: 440.0,
  c5: 523.25, e5: 659.25, g5: 783.99, b5: 987.77, c6: 1046.5,
};

export class AudioEngine {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.noiseBuffer = null;
    this.blocked = false;
    this.musicStep = 0;
    this.nextNoteTime = 0;
    this.musicRunning = false;
  }

  /** Called from a user gesture; safe to call repeatedly. */
  unlock() {
    if (this.blocked) return;
    if (!this.ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) {
        this.blocked = true;
        return;
      }
      try {
        this.ctx = new Ctor();
      } catch {
        this.blocked = true;
        return;
      }
      this.master = this.ctx.createGain();
      this.master.gain.value = CONFIG.audio.masterVolume;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp);
      comp.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0;
      this.musicGain.connect(this.master);

      this.noiseBuffer = this.createNoiseBuffer();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  createNoiseBuffer() {
    const length = Math.floor(this.ctx.sampleRate * 0.4);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  get ready() {
    return !!this.ctx && !this.blocked && this.ctx.state === 'running';
  }

  get enabled() {
    return this.settings.sound && this.ready;
  }

  now() {
    return this.ctx.currentTime;
  }

  tone({ freq = 440, endFreq = null, type = 'sine', duration = 0.14, gain = 0.3, delay = 0, attack = 0.005 }) {
    if (!this.enabled) return;
    const t0 = this.now() + delay;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq && endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), t0 + duration);
    }
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(env);
    env.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  noise({ duration = 0.2, gain = 0.25, delay = 0, filterFreq = 1200, filterEnd = null, type = 'bandpass' }) {
    if (!this.enabled) return;
    const t0 = this.now() + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(filterFreq, t0);
    if (filterEnd) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(filterEnd, 1), t0 + duration);
    }
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(gain, t0);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(filter);
    filter.connect(env);
    env.connect(this.master);
    src.start(t0);
    src.stop(t0 + duration + 0.02);
  }

  // --- Game events --------------------------------------------------------

  move() {
    this.tone({ freq: 320, endFreq: 460, type: 'square', duration: 0.06, gain: 0.08 });
  }

  land() {
    this.tone({ freq: 180, endFreq: 120, type: 'sine', duration: 0.09, gain: 0.1 });
  }

  blocked_() {
    this.tone({ freq: 110, endFreq: 82, type: 'sawtooth', duration: 0.11, gain: 0.09 });
  }

  polarity(to) {
    const up = to === 'violet';
    this.tone({
      freq: up ? 420 : 720,
      endFreq: up ? 780 : 400,
      type: 'triangle',
      duration: 0.2,
      gain: 0.16,
    });
    this.noise({ duration: 0.16, gain: 0.06, filterFreq: 900, filterEnd: 2600 });
  }

  fragment() {
    this.tone({ freq: NOTES.c5, type: 'triangle', duration: 0.1, gain: 0.14 });
    this.tone({ freq: NOTES.g5, type: 'triangle', duration: 0.14, gain: 0.1, delay: 0.05 });
  }

  nearMiss() {
    this.noise({ duration: 0.13, gain: 0.05, filterFreq: 2400, filterEnd: 700 });
  }

  warn() {
    this.tone({ freq: 300, type: 'sine', duration: 0.1, gain: 0.05 });
  }

  impact() {
    this.noise({ duration: 0.3, gain: 0.3, filterFreq: 1800, filterEnd: 180, type: 'lowpass' });
    this.tone({ freq: 150, endFreq: 45, type: 'sawtooth', duration: 0.34, gain: 0.2 });
  }

  fall() {
    this.tone({ freq: 620, endFreq: 70, type: 'sine', duration: 0.5, gain: 0.18 });
    this.noise({ duration: 0.4, gain: 0.08, filterFreq: 1600, filterEnd: 200 });
  }

  uplink() {
    const seq = [NOTES.c4, NOTES.e4, NOTES.g4, NOTES.c5, NOTES.e5];
    seq.forEach((f, i) => {
      this.tone({ freq: f, type: 'triangle', duration: 0.22, gain: 0.13, delay: i * 0.07 });
    });
  }

  complete() {
    const seq = [NOTES.c4, NOTES.e4, NOTES.g4, NOTES.c5, NOTES.g5, NOTES.c6];
    seq.forEach((f, i) => {
      this.tone({ freq: f, type: 'triangle', duration: 0.5, gain: 0.14, delay: i * 0.09 });
    });
    this.tone({ freq: NOTES.c3, type: 'sine', duration: 1.1, gain: 0.12 });
  }

  menu() {
    this.tone({ freq: 520, endFreq: 640, type: 'square', duration: 0.05, gain: 0.06 });
  }

  respawn() {
    this.tone({ freq: 200, endFreq: 520, type: 'triangle', duration: 0.18, gain: 0.1 });
  }

  // --- Ambient music ------------------------------------------------------
  // A slow four-note figure over a drone. Scheduled with a short lookahead
  // from the game loop rather than a timer, so it never fights the frame.

  static PATTERN = [NOTES.a3, NOTES.c4, NOTES.e4, NOTES.d4, NOTES.c4, NOTES.g3, NOTES.a3, NOTES.e4];

  setMusicEnabled(on) {
    if (!this.ready) return;
    const target = on ? CONFIG.audio.musicVolume : 0;
    const t = this.now();
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, t);
    this.musicGain.gain.linearRampToValueAtTime(target, t + 0.6);
    this.musicRunning = on;
    if (on && this.nextNoteTime < t) this.nextNoteTime = t + 0.1;
  }

  /** Called every frame; schedules any notes falling inside the lookahead. */
  updateMusic() {
    if (!this.ready || !this.settings.music || !this.musicRunning) return;
    const lookahead = 0.4;
    const interval = 0.42;
    while (this.nextNoteTime < this.now() + lookahead) {
      const freq = AudioEngine.PATTERN[this.musicStep % AudioEngine.PATTERN.length];
      this.scheduleMusicNote(freq, this.nextNoteTime);
      if (this.musicStep % 8 === 0) this.scheduleMusicNote(NOTES.a3 / 2, this.nextNoteTime, 2.6, 0.5);
      this.musicStep++;
      this.nextNoteTime += interval;
    }
  }

  scheduleMusicNote(freq, time, duration = 0.9, gain = 0.28) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1400;
    osc.type = 'triangle';
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(gain, time + 0.08);
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(filter);
    filter.connect(env);
    env.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }
}

/** Haptics — always optional, always short. */
export function vibrate(pattern, settings) {
  if (!settings.haptics) return;
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* some browsers expose the API but refuse to use it */
  }
}
