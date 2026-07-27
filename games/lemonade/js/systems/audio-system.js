// Lightweight synthesized sound effects using the Web Audio API — no audio
// files to fetch or ship, which keeps the game fully self-contained and fast
// to load. The AudioContext is created lazily on first user gesture since
// browsers block audio playback before any interaction.

let ctx = null;
let unlocked = false;
let getSoundEnabled = () => true;

export function initAudio(soundEnabledGetter) {
  getSoundEnabled = soundEnabledGetter;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (err) {
      ctx = null;
    }
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}

function tone(freq, { duration = 0.12, type = 'sine', gain = 0.18, delay = 0, glideTo = null } = {}) {
  if (!ctx || !getSoundEnabled()) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo) osc.frequency.linearRampToValueAtTime(glideTo, start + duration);
  amp.gain.setValueAtTime(0, start);
  amp.gain.linearRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

const SOUNDS = {
  success: () => tone(660, { duration: 0.1, type: 'triangle', glideTo: 880 }),
  error: () => tone(180, { duration: 0.18, type: 'sawtooth', gain: 0.12, glideTo: 120 }),
  info: () => tone(520, { duration: 0.08, type: 'sine', gain: 0.1 }),
  sale: () => tone(880, { duration: 0.07, type: 'sine', gain: 0.1 }),
  achievement: () => {
    tone(523, { duration: 0.1, type: 'triangle' });
    tone(659, { duration: 0.1, type: 'triangle', delay: 0.09 });
    tone(784, { duration: 0.18, type: 'triangle', delay: 0.18 });
  },
  milestone: () => {
    tone(440, { duration: 0.1, type: 'triangle' });
    tone(554, { duration: 0.1, type: 'triangle', delay: 0.1 });
    tone(659, { duration: 0.16, type: 'triangle', delay: 0.2 });
  },
  'day-start': () => {
    tone(392, { duration: 0.09, type: 'sine' });
    tone(523, { duration: 0.14, type: 'sine', delay: 0.08 });
  },
  'day-end': () => {
    tone(523, { duration: 0.09, type: 'sine' });
    tone(392, { duration: 0.16, type: 'sine', delay: 0.09 });
  },
  click: () => tone(400, { duration: 0.05, type: 'sine', gain: 0.08 }),
};

export function playSound(name) {
  const fn = SOUNDS[name];
  if (fn) fn();
}
