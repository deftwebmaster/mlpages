// Minimal time-based tween registry — no external animation library needed.
// Game.js ticks this once per animation frame; Renderer reads back the
// current animated value for an entity, falling back to its logical value.

import { clamp } from '../utils/helpers.js';

export class AnimationRegistry {
  constructor() {
    this.animations = new Map(); // key -> { from, to, duration, elapsed, easing, onUpdate, onComplete }
    this.motionScale = 1; // reduced-motion multiplier applied to durations
  }

  setReducedMotion(enabled) {
    this.motionScale = enabled ? 0.35 : 1;
  }

  start(key, { from, to, duration, easing = (t) => t, onUpdate, onComplete }) {
    this.animations.set(key, {
      from, to, duration: Math.max(1, duration * this.motionScale),
      elapsed: 0, easing, onUpdate, onComplete,
    });
    onUpdate(from);
  }

  isAnimating(key) {
    return key == null ? this.animations.size > 0 : this.animations.has(key);
  }

  tick(dtMs) {
    for (const [key, anim] of this.animations) {
      anim.elapsed += dtMs;
      const t = clamp(anim.elapsed / anim.duration, 0, 1);
      const eased = anim.easing(t);
      anim.onUpdate(lerpValue(anim.from, anim.to, eased));
      if (t >= 1) {
        this.animations.delete(key);
        anim.onComplete?.();
      }
    }
  }

  clear() {
    this.animations.clear();
  }
}

function lerpValue(from, to, t) {
  if (typeof from === 'number' && typeof to === 'number') {
    return from + (to - from) * t;
  }
  // objects like {x,y} or {x,y,opacity}
  const out = {};
  for (const k of Object.keys(to)) {
    out[k] = (from[k] ?? 0) + ((to[k] ?? 0) - (from[k] ?? 0)) * t;
  }
  return out;
}
