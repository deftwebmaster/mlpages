// All sound is synthesized with the Web Audio API — no audio files to fetch/cache,
// which keeps the PWA fully offline-capable with zero asset weight.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.noiseBuffer = null;
    this.sfxVolume = 0.8;
    this.musicVolume = 0.5;
    this._thrusterNode = null;
    this._tractorNode = null;
    this._heatWarnPlaying = false;
    this._ambientNodes = null;
    this.ready = false;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 1;
    this.master.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.master);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume;
    this.musicGain.connect(this.master);

    this._buildNoiseBuffer();
    this.ready = true;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  setSfxVolume(v) { this.sfxVolume = v; if (this.sfxGain) this.sfxGain.gain.value = v; }
  setMusicVolume(v) { this.musicVolume = v; if (this.musicGain) this.musicGain.gain.value = v; }

  _buildNoiseBuffer() {
    const len = this.ctx.sampleRate * 1;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;
  }

  _osc(type, freq, dur, gainVal, dest, freqEnd) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gainVal, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(dest || this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  _noiseBurst(dur, gainVal, filterFreq, dest) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(filterFreq * 0.15, 40), t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gainVal, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(dest || this.sfxGain);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  playFire() { this._osc('square', 880, 0.06, 0.18, this.sfxGain, 420); }
  playImpact() { this._noiseBurst(0.12, 0.25, 2200); }
  playExplosion(big = false) {
    this._noiseBurst(big ? 1.1 : 0.5, big ? 0.55 : 0.35, big ? 900 : 1400);
    this._osc('sawtooth', big ? 90 : 140, big ? 0.9 : 0.4, big ? 0.35 : 0.2, this.sfxGain, 30);
  }
  playPickup() { this._osc('sine', 660, 0.12, 0.2, this.sfxGain, 1100); }
  playHeatWarnBeep() { this._osc('square', 520, 0.08, 0.15, this.sfxGain); }
  playExtraction() {
    this._osc('sine', 220, 0.6, 0.25, this.sfxGain, 660);
    setTimeout(() => this._osc('sine', 440, 0.5, 0.2, this.sfxGain, 880), 120);
  }
  playVictory() {
    [523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => this._osc('triangle', f, 0.4, 0.22, this.sfxGain), i * 110);
    });
  }
  playMenuClick() { this._osc('square', 440, 0.05, 0.12, this.sfxGain); }
  playDamage() { this._noiseBurst(0.25, 0.3, 700); this._osc('sawtooth', 160, 0.25, 0.2, this.sfxGain, 60); }

  setThruster(active) {
    if (!this.ctx) return;
    if (active && !this._thrusterNode) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.08);
      src.connect(filter); filter.connect(g); g.connect(this.sfxGain);
      src.start();
      this._thrusterNode = { src, g };
    } else if (!active && this._thrusterNode) {
      const { src, g } = this._thrusterNode;
      g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
      setTimeout(() => { try { src.stop(); } catch (e) {} }, 150);
      this._thrusterNode = null;
    }
  }

  setTractor(active) {
    if (!this.ctx) return;
    if (active && !this._tractorNode) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 90;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.1);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start();
      this._tractorNode = { osc, g };
    } else if (!active && this._tractorNode) {
      const { osc, g } = this._tractorNode;
      g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.12);
      setTimeout(() => { try { osc.stop(); } catch (e) {} }, 180);
      this._tractorNode = null;
    }
  }

  startAmbient() {
    if (!this.ctx || this._ambientNodes) return;
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine'; osc1.frequency.value = 55;
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine'; osc2.frequency.value = 82.4;
    const g = this.ctx.createGain();
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 2);
    osc1.connect(g); osc2.connect(g); g.connect(this.musicGain);
    osc1.start(); osc2.start();
    this._ambientNodes = { osc1, osc2, g };
  }

  stopAmbient() {
    if (!this._ambientNodes) return;
    const { osc1, osc2, g } = this._ambientNodes;
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
    setTimeout(() => { try { osc1.stop(); osc2.stop(); } catch (e) {} }, 1100);
    this._ambientNodes = null;
  }
}
