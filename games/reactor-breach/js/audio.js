// All audio is synthesized with WebAudio so nothing needs to be fetched
// (keeps the game fully offline-safe from first load with no asset requests).
import { CONFIG } from './config.js';
import { loadSave } from './storage.js';

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.unlocked = false;
    this.musicNodes = null;
    this.musicIntensity = 0;
  }

  ensureContext() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = CONFIG.audio.masterVolume;
    this.master.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = CONFIG.audio.sfxVolume;
    this.sfxGain.connect(this.master);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = CONFIG.audio.musicVolume;
    this.musicGain.connect(this.master);
  }

  unlock() {
    this.ensureContext();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.unlocked = true;
  }

  soundEnabled() {
    return loadSave().settings.sound && this.ctx;
  }

  musicEnabled() {
    return loadSave().settings.music && this.ctx;
  }

  _osc(type, freq, dur, gainVal, opts = {}) {
    if (!this.soundEnabled()) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + (opts.delay || 0);
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(opts.freqEnd, 1), t0 + dur);
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gainVal, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  _noise(dur, gainVal, opts = {}) {
    if (!this.soundEnabled()) return;
    const ctx = this.ctx;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = opts.filterType || 'lowpass';
    filter.frequency.value = opts.filterFreq || 2000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gainVal, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    src.start();
  }

  play(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'launch':
        this._osc('sawtooth', 220, 0.18, 0.25, { freqEnd: 660 });
        break;
      case 'wallBounce':
        this._osc('square', 340, 0.06, 0.14);
        break;
      case 'deflectorHit':
        this._osc('triangle', 260, 0.09, 0.22, { freqEnd: 180 });
        break;
      case 'plateHit':
        this._osc('square', 420, 0.05, 0.16);
        break;
      case 'armorHit':
        this._osc('square', 180, 0.08, 0.2);
        this._noise(0.05, 0.08);
        break;
      case 'shieldReflect':
        this._osc('sine', 700, 0.12, 0.2, { freqEnd: 1100 });
        break;
      case 'destroy':
        this._osc('sawtooth', 500, 0.16, 0.2, { freqEnd: 90 });
        this._noise(0.12, 0.12);
        break;
      case 'energyCollect':
        this._osc('sine', 900, 0.08, 0.18, { freqEnd: 1300 });
        break;
      case 'routeSwitch':
        this._osc('triangle', 500, 0.1, 0.15, { freqEnd: 700 });
        break;
      case 'abilityActivate':
        this._osc('sawtooth', 300, 0.22, 0.22, { freqEnd: 900 });
        this._noise(0.18, 0.06, { filterType: 'highpass', filterFreq: 800 });
        break;
      case 'magneticCatch':
        this._osc('sine', 240, 0.2, 0.2, { freqEnd: 60 });
        break;
      case 'orbLoss':
        this._osc('sawtooth', 220, 0.35, 0.24, { freqEnd: 40 });
        this._noise(0.3, 0.1);
        break;
      case 'warning':
        this._osc('square', 880, 0.12, 0.16);
        break;
      case 'bossPhase':
        this._osc('sawtooth', 140, 0.5, 0.25, { freqEnd: 40 });
        this._noise(0.4, 0.14);
        break;
      case 'coreExpose':
        this._osc('sine', 220, 0.6, 0.22, { freqEnd: 880 });
        break;
      case 'stageComplete':
        [0, 0.12, 0.24].forEach((d, i) =>
          this._osc('triangle', 440 + i * 220, 0.3, 0.2, { delay: d })
        );
        break;
      case 'menu':
        this._osc('sine', 500, 0.06, 0.12);
        break;
      case 'explosion':
        this._noise(0.35, 0.22, { filterType: 'lowpass', filterFreq: 900 });
        this._osc('sawtooth', 90, 0.3, 0.2, { freqEnd: 30 });
        break;
      default:
        break;
    }
  }

  setMusicIntensity(level) {
    this.musicIntensity = level;
  }

  startMusic() {
    if (!this.ctx || this.musicNodes) return;
    if (!this.musicEnabled()) return;
    const ctx = this.ctx;
    const drone = ctx.createOscillator();
    drone.type = 'sawtooth';
    drone.frequency.value = 55;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.05;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    drone.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(this.musicGain);
    drone.start();
    this.musicNodes = { drone, droneGain, filter };
  }

  stopMusic() {
    if (!this.musicNodes) return;
    try {
      this.musicNodes.drone.stop();
    } catch (e) {
      /* ignore */
    }
    this.musicNodes = null;
  }

  update(dt) {
    if (this.musicNodes && this.ctx) {
      const target = 300 + this.musicIntensity * 900;
      this.musicNodes.filter.frequency.value +=
        (target - this.musicNodes.filter.frequency.value) * Math.min(1, dt * 2);
    }
  }
}

export const audio = new AudioEngine();
