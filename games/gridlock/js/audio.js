/**
 * audio.js — Fully synthesised sound. No audio assets ship with the game,
 * which keeps the offline cache tiny and the PWA install instant.
 *
 * Everything is built from oscillators, a shared noise buffer and short
 * envelopes. The AudioContext is created lazily on the first user gesture,
 * as mobile browsers require.
 */

const NOTE = { C: 0, Cs: 1, D: 2, Ds: 3, E: 4, F: 5, Fs: 6, G: 7, Gs: 8, A: 9, As: 10, B: 11 };

/** MIDI-ish semitone → Hz, with A4 = 440 at semitone 9 of octave 4. */
const hz = (semitone, octave) => 440 * Math.pow(2, (semitone - 9) / 12 + (octave - 4));

export class AudioEngine {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;
    this.master = null;
    this.sfxBus = null;
    this.musicBus = null;
    this.noiseBuffer = null;
    this.sfxEnabled = true;
    this.musicEnabled = true;
    this.unlocked = false;

    this._musicTimer = null;
    this._musicStep = 0;
    this._nextNoteTime = 0;
    this._tempo = 132;
    this._musicIntensity = 0;
    this._lastPlay = new Map();
  }

  /** Must be called from inside a user-gesture handler. */
  unlock() {
    if (this.unlocked) {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    try {
      this.ctx = new Ctor();
    } catch {
      return;
    }

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    // A gentle limiter keeps stacked explosions from clipping on phone speakers.
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.knee.value = 18;
    comp.ratio.value = 6;
    comp.attack.value = 0.003;
    comp.release.value = 0.18;
    this.master.connect(comp);
    comp.connect(this.ctx.destination);

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.55;
    this.sfxBus.connect(this.master);

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0.0;
    this.musicBus.connect(this.master);

    const len = Math.floor(this.ctx.sampleRate * 0.5);
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    this.unlocked = true;
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setSfxEnabled(on) {
    this.sfxEnabled = on;
  }

  setMusicEnabled(on) {
    this.musicEnabled = on;
    if (!on) this.stopMusic();
  }

  get now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  // ── Primitive voices ──────────────────────────────────────────────────────
  _tone({ freq, freq2, type = 'square', dur = 0.12, gain = 0.3, delay = 0, attack = 0.005, bus }) {
    if (!this.ctx) return;
    const t = this.now + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freq2 && freq2 !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq2), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(bus || this.sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  _noise({ dur = 0.2, gain = 0.3, delay = 0, filterFrom = 4000, filterTo = 200, q = 1, type = 'lowpass' }) {
    if (!this.ctx) return;
    const t = this.now + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(filterFrom, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, filterTo), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
    src.stop(t + dur + 0.03);
  }

  /** Rate-limits a sound so rapid repeats do not turn into a buzz. */
  _throttle(name, ms) {
    const now = performance.now();
    const last = this._lastPlay.get(name) || 0;
    if (now - last < ms) return false;
    this._lastPlay.set(name, now);
    return true;
  }

  // ── Game sounds ───────────────────────────────────────────────────────────
  /**
   * @param {string} name sound id
   * @param {object} [opts] `{ index }` for pitched sequences such as node pickups
   */
  play(name, opts = {}) {
    if (!this.ctx || !this.sfxEnabled) return;

    switch (name) {
      case 'move':
        if (!this._throttle('move', 70)) return;
        this._tone({ freq: 620, freq2: 760, type: 'triangle', dur: 0.05, gain: 0.06 });
        break;

      case 'node': {
        if (!this._throttle('node', 28)) return;
        const step = (opts.index || 0) % 8;
        const f = hz(NOTE.E, 5) * Math.pow(2, step / 24);
        this._tone({ freq: f, freq2: f * 1.5, type: 'square', dur: 0.075, gain: 0.11 });
        break;
      }

      case 'secretNode':
        this._tone({ freq: hz(NOTE.A, 5), freq2: hz(NOTE.E, 6), type: 'triangle', dur: 0.16, gain: 0.16 });
        break;

      case 'power':
        this._tone({ freq: hz(NOTE.C, 3), freq2: hz(NOTE.C, 6), type: 'sawtooth', dur: 0.5, gain: 0.22 });
        this._tone({ freq: hz(NOTE.G, 3), freq2: hz(NOTE.G, 5), type: 'square', dur: 0.45, gain: 0.12, delay: 0.03 });
        this._noise({ dur: 0.5, gain: 0.16, filterFrom: 400, filterTo: 6000, type: 'bandpass', q: 2 });
        break;

      case 'shift':
        this._noise({ dur: 0.42, gain: 0.2, filterFrom: 900, filterTo: 180, q: 6, type: 'bandpass' });
        this._tone({ freq: 180, freq2: 90, type: 'sawtooth', dur: 0.4, gain: 0.16 });
        this._tone({ freq: hz(NOTE.D, 5), freq2: hz(NOTE.A, 5), type: 'square', dur: 0.28, gain: 0.1, delay: 0.08 });
        break;

      case 'shiftDenied':
        this._tone({ freq: 220, freq2: 110, type: 'square', dur: 0.2, gain: 0.14 });
        this._tone({ freq: 208, freq2: 104, type: 'square', dur: 0.2, gain: 0.1, delay: 0.02 });
        break;

      case 'wall':
        this._noise({ dur: 0.3, gain: 0.24, filterFrom: 1400, filterTo: 90, q: 1.4 });
        this._tone({ freq: 120, freq2: 55, type: 'triangle', dur: 0.26, gain: 0.2 });
        break;

      case 'spotted':
        if (!this._throttle('spotted', 900)) return;
        this._tone({ freq: hz(NOTE.As, 4), type: 'square', dur: 0.11, gain: 0.13 });
        this._tone({ freq: hz(NOTE.F, 4), type: 'square', dur: 0.13, gain: 0.13, delay: 0.12 });
        break;

      case 'droneEaten': {
        const step = Math.min(4, opts.index || 0);
        const base = hz(NOTE.C, 4) * Math.pow(2, step / 6);
        this._tone({ freq: base, freq2: base * 3, type: 'square', dur: 0.22, gain: 0.2 });
        this._noise({ dur: 0.25, gain: 0.16, filterFrom: 5200, filterTo: 500, q: 1 });
        break;
      }

      case 'death':
        this._tone({ freq: hz(NOTE.A, 4), freq2: hz(NOTE.A, 2), type: 'sawtooth', dur: 0.85, gain: 0.24 });
        this._noise({ dur: 0.9, gain: 0.2, filterFrom: 3000, filterTo: 80, q: 1 });
        break;

      case 'respawn':
        this._tone({ freq: hz(NOTE.C, 4), freq2: hz(NOTE.C, 6), type: 'triangle', dur: 0.35, gain: 0.14 });
        break;

      case 'secret':
        [NOTE.C, NOTE.E, NOTE.G, NOTE.B].forEach((n, i) =>
          this._tone({ freq: hz(n, 5), type: 'triangle', dur: 0.3, gain: 0.15, delay: i * 0.075 })
        );
        break;

      case 'victory':
        [
          [NOTE.C, 5, 0],
          [NOTE.E, 5, 0.1],
          [NOTE.G, 5, 0.2],
          [NOTE.C, 6, 0.3],
          [NOTE.G, 5, 0.46],
          [NOTE.C, 6, 0.56],
        ].forEach(([n, o, d]) =>
          this._tone({ freq: hz(n, o), type: 'square', dur: 0.42, gain: 0.16, delay: d })
        );
        break;

      case 'menu':
        this._tone({ freq: 880, freq2: 1320, type: 'triangle', dur: 0.06, gain: 0.09 });
        break;

      case 'back':
        this._tone({ freq: 660, freq2: 420, type: 'triangle', dur: 0.08, gain: 0.09 });
        break;

      case 'unlock':
        [NOTE.G, NOTE.B, NOTE.D].forEach((n, i) =>
          this._tone({ freq: hz(n, 5 + (i === 2 ? 1 : 0)), type: 'square', dur: 0.35, gain: 0.14, delay: i * 0.09 })
        );
        break;

      default:
        break;
    }
  }

  // ── Ambient soundtrack ────────────────────────────────────────────────────
  /**
   * A short generative loop: a driving bass line plus a sparse arpeggio whose
   * density rises with `intensity` (how much of the level is cleared).
   */
  startMusic() {
    if (!this.ctx || !this.musicEnabled || this._musicTimer) return;
    this.musicBus.gain.cancelScheduledValues(this.now);
    this.musicBus.gain.setValueAtTime(this.musicBus.gain.value, this.now);
    this.musicBus.gain.linearRampToValueAtTime(0.3, this.now + 1.2);
    this._musicStep = 0;
    this._nextNoteTime = this.now + 0.08;
    this._musicTimer = setInterval(() => this._scheduleMusic(), 40);
  }

  stopMusic() {
    if (this._musicTimer) {
      clearInterval(this._musicTimer);
      this._musicTimer = null;
    }
    if (this.musicBus && this.ctx) {
      this.musicBus.gain.cancelScheduledValues(this.now);
      this.musicBus.gain.setValueAtTime(this.musicBus.gain.value, this.now);
      this.musicBus.gain.linearRampToValueAtTime(0.0, this.now + 0.4);
    }
  }

  /** 0–1; raises the arpeggio density and tempo as the level empties out. */
  setIntensity(v) {
    this._musicIntensity = Math.max(0, Math.min(1, v));
  }

  _scheduleMusic() {
    if (!this.ctx) return;
    const stepDur = 60 / (this._tempo + this._musicIntensity * 22) / 4;
    while (this._nextNoteTime < this.now + 0.25) {
      this._playStep(this._musicStep, this._nextNoteTime, stepDur);
      this._musicStep = (this._musicStep + 1) % 32;
      this._nextNoteTime += stepDur;
    }
  }

  _playStep(step, time, stepDur) {
    const BASS = [NOTE.A, NOTE.A, NOTE.C, NOTE.G];
    const bar = Math.floor(step / 8) % 4;
    const root = BASS[bar];

    if (step % 4 === 0) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const filt = this.ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 520 + this._musicIntensity * 900;
      osc.type = 'sawtooth';
      osc.frequency.value = hz(root, 2);
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(0.34, time + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, time + stepDur * 3.2);
      osc.connect(filt);
      filt.connect(g);
      g.connect(this.musicBus);
      osc.start(time);
      osc.stop(time + stepDur * 3.4);
    }

    // Hi-hat on the off-beats.
    if (step % 2 === 1) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      const filt = this.ctx.createBiquadFilter();
      filt.type = 'highpass';
      filt.frequency.value = 7000;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.09, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);
      src.connect(filt);
      filt.connect(g);
      g.connect(this.musicBus);
      src.start(time);
      src.stop(time + 0.06);
    }

    // Arpeggio thickens as the grid empties.
    const ARP = [0, 3, 7, 10, 12, 10, 7, 3];
    if (step % 2 === 0 && (step / 2) % 4 < 2 + Math.floor(this._musicIntensity * 2)) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = hz(root + ARP[(step / 2) % ARP.length], 5);
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(0.075 + this._musicIntensity * 0.05, time + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, time + stepDur * 1.6);
      osc.connect(g);
      g.connect(this.musicBus);
      osc.start(time);
      osc.stop(time + stepDur * 1.8);
    }
  }
}

export const audio = new AudioEngine();
