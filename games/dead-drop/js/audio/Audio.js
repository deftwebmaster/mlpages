// Small procedural Web Audio synth — no external sound files, keeps the
// project fully static. Each cue is a short envelope-shaped oscillator burst.

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicEnabled = true;
    this.masterGain = null;
  }

  ensureContext() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.35;
    this.masterGain.connect(this.ctx.destination);
  }

  setEnabled(enabled) { this.enabled = enabled; }
  setMusicEnabled(enabled) { this.musicEnabled = enabled; }

  resume() {
    this.ensureContext();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone({ freq = 440, duration = 0.12, type = 'sine', gain = 0.5, sweepTo = null, delay = 0 } = {}) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t0 + duration);
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.02, duration * 0.3));
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(env);
    env.connect(this.masterGain);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  move() { this.tone({ freq: 220, duration: 0.06, type: 'square', gain: 0.18 }); }
  door() { this.tone({ freq: 160, duration: 0.18, type: 'triangle', gain: 0.3, sweepTo: 90 }); }
  pickup() { this.tone({ freq: 520, duration: 0.14, type: 'sine', gain: 0.35, sweepTo: 880 }); }
  camera() { this.tone({ freq: 700, duration: 0.05, type: 'square', gain: 0.12 }); }
  detection() {
    this.tone({ freq: 220, duration: 0.35, type: 'sawtooth', gain: 0.4, sweepTo: 90 });
    this.tone({ freq: 180, duration: 0.35, type: 'sawtooth', gain: 0.3, delay: 0.05, sweepTo: 60 });
  }
  missionComplete() {
    this.tone({ freq: 440, duration: 0.14, type: 'sine', gain: 0.32 });
    this.tone({ freq: 660, duration: 0.16, type: 'sine', gain: 0.32, delay: 0.12 });
    this.tone({ freq: 880, duration: 0.24, type: 'sine', gain: 0.32, delay: 0.24 });
  }
  menu() { this.tone({ freq: 380, duration: 0.08, type: 'sine', gain: 0.2 }); }
}
