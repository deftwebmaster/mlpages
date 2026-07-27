/**
 * utils.js — Tiny dependency-free helpers shared across the engine.
 */

export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

/** Modulo that always returns a non-negative result. */
export function mod(n, m) {
  return ((n % m) + m) % m;
}

export const lerp = (a, b, t) => a + (b - a) * t;

/** Smooth ease-out used for the discrete player slide. */
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Circle (cx, cy, r) against axis-aligned rect (x, y, w, h).
 * Strictly less-than, so exact tangency does not count as an overlap.
 */
export function circleRect(cx, cy, r, x, y, w, h) {
  const nx = clamp(cx, x, x + w);
  const ny = clamp(cy, y, y + h);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

/** Shortest distance from a point to an axis-aligned rect (0 when inside). */
export function pointRectDistance(cx, cy, x, y, w, h) {
  const dx = Math.max(x - cx, 0, cx - (x + w));
  const dy = Math.max(y - cy, 0, cy - (y + h));
  return Math.hypot(dx, dy);
}

/** Format seconds as m:ss.d — used for timers and best times. */
export function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '--:--';
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  return `${m}:${rest.toFixed(1).padStart(4, '0')}`;
}

export function formatScore(value) {
  return Math.max(0, Math.round(value)).toLocaleString('en-US');
}

/**
 * Deterministic hash-based pseudo-random in [0, 1).
 * Used only for *visual* jitter — never for gameplay, which must stay
 * reproducible frame-for-frame.
 */
export function hash01(n) {
  let x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Object pool that hands out plain records and is reset once per frame.
 * Avoids per-frame allocation in the hot lane/collision path.
 */
export class RecordPool {
  constructor(factory) {
    this.factory = factory;
    this.items = [];
    this.index = 0;
  }

  reset() {
    this.index = 0;
  }

  next() {
    if (this.index === this.items.length) this.items.push(this.factory());
    return this.items[this.index++];
  }
}

export function isReducedMotionPreferred() {
  return (
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
