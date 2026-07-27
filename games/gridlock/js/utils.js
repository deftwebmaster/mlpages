/**
 * utils.js — Small, dependency-free helpers shared across the engine.
 */

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const TAU = Math.PI * 2;

/** Smooth 0→1 easing used by most UI and shift animations. */
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
/**
 * Mulberry32 — a tiny deterministic PRNG.
 * Used so that "random" drone behaviour is reproducible for replays/testing.
 */
export function makeRng(seed = 0x9e3779b9) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Formats seconds as `M:SS.mmm`-ish (`M:SS.d`). */
export function formatTime(seconds) {
  if (!isFinite(seconds)) return '--:--';
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  return `${m}:${rest.toFixed(2).padStart(5, '0')}`;
}

/** Thousands-separated integer. */
export function formatScore(n) {
  return Math.round(n).toLocaleString('en-US');
}

/** Creates a canvas sized in device pixels but laid out in CSS pixels. */
export function createCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/**
 * Rounded-rectangle path. Falls back to a manual path when the browser lacks
 * `CanvasRenderingContext2D.roundRect` (older iOS Safari).
 */
export function roundRectPath(ctx, x, y, w, h, r) {
  if (w <= 0 || h <= 0) return;
  const rr = Math.min(r, w / 2, h / 2);
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, rr);
    return;
  }
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** `#rrggbb` → `rgba(r,g,b,a)` string. Results are memoised. */
const rgbaCache = new Map();
export function rgba(hex, alpha) {
  const key = hex + '|' + alpha;
  let out = rgbaCache.get(key);
  if (out) return out;
  const n = parseInt(hex.slice(1), 16);
  out = `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
  rgbaCache.set(key, out);
  return out;
}

