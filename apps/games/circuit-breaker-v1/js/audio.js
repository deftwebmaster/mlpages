export class AudioController {
  constructor(settings) {
    this.enabled = Boolean(settings.soundEnabled);
    this.hapticsEnabled = Boolean(settings.hapticsEnabled);
    this.context = null;
    this.unlocked = false;
  }

  setSoundEnabled(enabled) {
    this.enabled = Boolean(enabled);
  }

  setHapticsEnabled(enabled) {
    this.hapticsEnabled = Boolean(enabled);
  }

  unlock() {
    if (this.unlocked) return;
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context = new AudioContext();
    this.unlocked = true;
  }

  play(name) {
    if (!this.enabled) return;
    this.unlock();
    if (!this.context) return;

    const palette = {
      select: [520, 0.035, "sine", 0.035],
      swap: [330, 0.055, "triangle", 0.04],
      invalid: [120, 0.09, "sawtooth", 0.035],
      match: [660, 0.095, "sine", 0.05],
      large: [880, 0.12, "triangle", 0.055],
      cascade: [760, 0.11, "square", 0.04],
      specialCreate: [980, 0.13, "triangle", 0.05],
      special: [220, 0.16, "sawtooth", 0.045],
      warning: [150, 0.18, "sawtooth", 0.03],
      gameOver: [72, 0.45, "sawtooth", 0.04],
      button: [430, 0.045, "sine", 0.03]
    };

    const spec = palette[name] || palette.button;
    const [frequency, duration, type, volume] = spec;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
    gain.gain.setValueAtTime(0.0001, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, this.context.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration + 0.02);
  }

  vibrate(pattern) {
    if (!this.hapticsEnabled || !("vibrate" in navigator)) return;
    navigator.vibrate(pattern);
  }
}
