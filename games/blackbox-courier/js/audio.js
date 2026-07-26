/**
 * Fully synthesised audio — no sample files, so nothing extra to cache or wait
 * for. Everything is built from oscillators plus one shared noise buffer.
 *
 * The context is created lazily on the first user gesture, which is what
 * autoplay policies require.
 */

import { AUDIO } from './config.js';

let ctx = null;
let masterGain = null;
let sfxGain = null;
let musicGain = null;
let noiseBuffer = null;
let unlocked = false;

let soundOn = true;
let musicOn = true;

/** Continuous voices. */
let droneNodes = null;
let phaseNodes = null;
let warnNodes = null;

function makeNoiseBuffer(c) {
  const len = Math.floor(c.sampleRate * 1.2);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    // Mild low-pass gives a less hissy, more "mechanical" noise bed.
    last = last * 0.42 + w * 0.58;
    data[i] = last;
  }
  return buf;
}

export function initAudio() {
  if (ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  try {
    ctx = new AC();
  } catch {
    return false;
  }
  masterGain = ctx.createGain();
  masterGain.gain.value = AUDIO.masterVolume;
  masterGain.connect(ctx.destination);

  sfxGain = ctx.createGain();
  sfxGain.gain.value = AUDIO.sfxVolume;
  sfxGain.connect(masterGain);

  musicGain = ctx.createGain();
  musicGain.gain.value = 0;
  musicGain.connect(masterGain);

  noiseBuffer = makeNoiseBuffer(ctx);
  return true;
}

/** Must be called from a user-gesture handler. */
export function unlockAudio() {
  if (!initAudio()) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  unlocked = true;
}

export function setSound(on) {
  soundOn = on;
  if (!on) {
    stopPhaseLoop();
    stopWarning();
  }
}

export function setMusic(on) {
  musicOn = on;
  if (musicGain && ctx) {
    const t = ctx.currentTime;
    musicGain.gain.cancelScheduledValues(t);
    musicGain.gain.setTargetAtTime(on ? AUDIO.musicVolume : 0, t, 0.25);
  }
  if (!on) stopDrone();
}

export function suspendAudio() {
  if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
}

export function resumeAudio() {
  if (ctx && unlocked && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

const ready = () => soundOn && unlocked && ctx && ctx.state === 'running';

/* ------------------------------------------------------------------ *
 * Primitive voices
 * ------------------------------------------------------------------ */

function tone({ freq = 440, to = null, type = 'sine', dur = 0.16, gain = 0.3, delay = 0, dest = null }) {
  if (!ready()) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.012, dur * 0.25));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(dest || sfxGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

function noise({ dur = 0.2, gain = 0.3, freq = 1200, q = 1, type = 'bandpass', sweepTo = null, delay = 0 }) {
  if (!ready()) return;
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  const filt = ctx.createBiquadFilter();
  filt.type = type;
  filt.frequency.setValueAtTime(freq, t0);
  if (sweepTo !== null) filt.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t0 + dur);
  filt.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt).connect(g).connect(sfxGain);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

/* ------------------------------------------------------------------ *
 * Game sounds
 * ------------------------------------------------------------------ */

export const sfx = {
  menu() {
    tone({ freq: 660, to: 880, type: 'triangle', dur: 0.08, gain: 0.18 });
  },
  back() {
    tone({ freq: 420, to: 260, type: 'triangle', dur: 0.1, gain: 0.16 });
  },
  start() {
    tone({ freq: 180, to: 720, type: 'sawtooth', dur: 0.45, gain: 0.2 });
    tone({ freq: 90, to: 360, type: 'sine', dur: 0.5, gain: 0.28 });
    noise({ dur: 0.5, gain: 0.12, freq: 400, sweepTo: 3800, q: 0.7 });
  },
  fragment(pitchStep = 0) {
    const base = 880 * Math.pow(1.0595, Math.min(pitchStep, 12));
    tone({ freq: base, to: base * 1.5, type: 'square', dur: 0.07, gain: 0.1 });
    tone({ freq: base * 2, type: 'sine', dur: 0.1, gain: 0.07 });
  },
  repair() {
    tone({ freq: 520, to: 1040, type: 'sine', dur: 0.22, gain: 0.2 });
    tone({ freq: 780, to: 1560, type: 'sine', dur: 0.26, gain: 0.12, delay: 0.05 });
  },
  calibration() {
    [0, 0.07, 0.14].forEach((d, i) => tone({ freq: 600 + i * 220, type: 'triangle', dur: 0.16, gain: 0.16, delay: d }));
  },
  phaseOn() {
    tone({ freq: 300, to: 1200, type: 'sawtooth', dur: 0.16, gain: 0.14 });
  },
  phaseOff() {
    tone({ freq: 900, to: 260, type: 'sawtooth', dur: 0.14, gain: 0.11 });
  },
  phaseEmpty() {
    tone({ freq: 340, to: 120, type: 'square', dur: 0.24, gain: 0.16 });
    noise({ dur: 0.2, gain: 0.1, freq: 900, sweepTo: 200 });
  },
  nearMiss() {
    noise({ dur: 0.16, gain: 0.16, freq: 2600, sweepTo: 700, q: 1.6 });
    tone({ freq: 1400, to: 2100, type: 'sine', dur: 0.09, gain: 0.06 });
  },
  damage() {
    noise({ dur: 0.3, gain: 0.3, freq: 1400, sweepTo: 180, q: 0.8, type: 'lowpass' });
    tone({ freq: 160, to: 60, type: 'square', dur: 0.28, gain: 0.22 });
  },
  checkpoint() {
    [0, 0.09, 0.18, 0.3].forEach((d, i) =>
      tone({ freq: [440, 660, 880, 1320][i], type: 'triangle', dur: 0.26, gain: 0.16, delay: d })
    );
  },
  crash() {
    noise({ dur: 0.9, gain: 0.42, freq: 2800, sweepTo: 80, q: 0.6, type: 'lowpass' });
    tone({ freq: 220, to: 28, type: 'sawtooth', dur: 0.85, gain: 0.3 });
    tone({ freq: 70, to: 22, type: 'sine', dur: 1.1, gain: 0.34 });
  },
  gameOver() {
    [0, 0.16, 0.34].forEach((d, i) =>
      tone({ freq: [400, 300, 190][i], to: [300, 200, 90][i], type: 'triangle', dur: 0.5, gain: 0.16, delay: d })
    );
  },
};

/* ------------------------------------------------------------------ *
 * Continuous voices
 * ------------------------------------------------------------------ */

export function startPhaseLoop() {
  if (!ready() || phaseNodes) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const g = ctx.createGain();
  const filt = ctx.createBiquadFilter();
  osc.type = 'sawtooth';
  osc.frequency.value = 132;
  osc2.type = 'sawtooth';
  osc2.frequency.value = 133.8; // slight detune produces the beating "phase" shimmer
  filt.type = 'bandpass';
  filt.frequency.value = 900;
  filt.Q.value = 3.5;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.09, t + 0.08);
  osc.connect(filt);
  osc2.connect(filt);
  filt.connect(g).connect(sfxGain);
  osc.start(t);
  osc2.start(t);
  phaseNodes = { osc, osc2, g, filt };
}

export function stopPhaseLoop() {
  if (!phaseNodes || !ctx) return;
  const { osc, osc2, g } = phaseNodes;
  const t = ctx.currentTime;
  try {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    osc.stop(t + 0.14);
    osc2.stop(t + 0.14);
  } catch {
    /* already stopped */
  }
  phaseNodes = null;
}

export function startWarning() {
  if (!ready() || warnNodes) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 210;
  lfo.type = 'square';
  lfo.frequency.value = 3.4;
  lfoGain.gain.value = 0.055;
  g.gain.value = 0.0001;
  lfo.connect(lfoGain).connect(g.gain);
  osc.connect(g).connect(sfxGain);
  osc.start(t);
  lfo.start(t);
  warnNodes = { osc, lfo, g };
}

export function stopWarning() {
  if (!warnNodes || !ctx) return;
  const { osc, lfo } = warnNodes;
  try {
    osc.stop(ctx.currentTime + 0.05);
    lfo.stop(ctx.currentTime + 0.05);
  } catch {
    /* already stopped */
  }
  warnNodes = null;
}

/** Ambient bed whose brightness tracks run speed. */
export function startDrone() {
  if (!musicOn || !unlocked || !ctx || droneNodes) return;
  const t = ctx.currentTime;
  const a = ctx.createOscillator();
  const b = ctx.createOscillator();
  const sub = ctx.createOscillator();
  const filt = ctx.createBiquadFilter();
  const g = ctx.createGain();
  a.type = 'sawtooth';
  a.frequency.value = 55;
  b.type = 'sawtooth';
  b.frequency.value = 82.5;
  sub.type = 'sine';
  sub.frequency.value = 27.5;
  filt.type = 'lowpass';
  filt.frequency.value = 380;
  filt.Q.value = 1.2;
  g.gain.value = 0.5;
  a.connect(filt);
  b.connect(filt);
  sub.connect(filt);
  filt.connect(g).connect(musicGain);
  a.start(t);
  b.start(t);
  sub.start(t);
  droneNodes = { a, b, sub, filt, g };
  musicGain.gain.setTargetAtTime(AUDIO.musicVolume, t, 0.6);
}

export function stopDrone() {
  if (!droneNodes || !ctx) return;
  const t = ctx.currentTime;
  const { a, b, sub } = droneNodes;
  try {
    musicGain.gain.setTargetAtTime(0, t, 0.2);
    a.stop(t + 0.6);
    b.stop(t + 0.6);
    sub.stop(t + 0.6);
  } catch {
    /* already stopped */
  }
  droneNodes = null;
}

/**
 * Per-frame audio state. `intensity` 0..1 tracks speed, `degradation` 0..1
 * tracks payload damage and detunes/darkens the bed.
 */
export function updateAudioState(intensity, degradation, phaseAmount) {
  if (!ctx) return;
  const t = ctx.currentTime;
  if (droneNodes) {
    droneNodes.filt.frequency.setTargetAtTime(320 + intensity * 900, t, 0.3);
    droneNodes.a.detune.setTargetAtTime(degradation * -55, t, 0.4);
    droneNodes.b.detune.setTargetAtTime(degradation * 70, t, 0.4);
  }
  if (phaseNodes) {
    phaseNodes.filt.frequency.setTargetAtTime(700 + phaseAmount * 1500, t, 0.05);
  }
  if (warnNodes) {
    const target = degradation > 0.75 ? 0.05 : 0.0001;
    warnNodes.g.gain.setTargetAtTime(target, t, 0.2);
    warnNodes.lfo.frequency.setTargetAtTime(2.6 + degradation * 4, t, 0.2);
  }
}
