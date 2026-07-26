/** Small shared helpers. No game state lives here. */

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

export const lerp = (a, b, t) => a + (b - a) * t;

/** Frame-rate independent exponential approach. */
export const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-rate * dt));

/**
 * mulberry32 — small, fast, seedable PRNG. Deterministic route generation makes
 * balance problems reproducible, which matters more here than cryptographic
 * quality.
 */
export function makeRng(seed) {
  let a = seed >>> 0;
  const rng = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rng.range = (lo, hi) => lo + rng() * (hi - lo);
  rng.int = (lo, hi) => Math.floor(lo + rng() * (hi - lo + 1));
  rng.pick = (arr) => arr[Math.floor(rng() * arr.length) % arr.length];
  rng.chance = (p) => rng() < p;
  return rng;
}

export const formatScore = (n) => Math.floor(n).toLocaleString('en-US');

export const formatDistance = (d) => {
  if (d >= 1000) return (d / 1000).toFixed(2) + ' km';
  return Math.floor(d) + ' m';
};

export const formatTime = (s) => {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
};

/**
 * Interval-set algebra used by the safe-path validator.
 * Sets are arrays of [lo, hi] pairs kept sorted and disjoint.
 */
export const IntervalSet = {
  normalize(set) {
    const out = [];
    const src = set.filter((s) => s[1] - s[0] > 1e-6).sort((a, b) => a[0] - b[0]);
    for (const s of src) {
      const last = out[out.length - 1];
      if (last && s[0] <= last[1] + 1e-6) last[1] = Math.max(last[1], s[1]);
      else out.push([s[0], s[1]]);
    }
    return out;
  },

  /** Grow every interval outward by `d`, then merge. */
  dilate(set, d) {
    return IntervalSet.normalize(set.map((s) => [s[0] - d, s[1] + d]));
  },

  /** Keep only what lies inside [lo, hi]. */
  clampTo(set, lo, hi) {
    const out = [];
    for (const s of set) {
      const a = Math.max(s[0], lo);
      const b = Math.min(s[1], hi);
      if (b - a > 1e-6) out.push([a, b]);
    }
    return out;
  },

  /** Remove [lo, hi] from every interval in the set. */
  subtract(set, lo, hi) {
    if (hi <= lo) return set;
    const out = [];
    for (const s of set) {
      if (hi <= s[0] || lo >= s[1]) {
        out.push(s);
        continue;
      }
      if (lo > s[0]) out.push([s[0], lo]);
      if (hi < s[1]) out.push([hi, s[1]]);
    }
    return out.filter((s) => s[1] - s[0] > 1e-6);
  },

  contains(set, x) {
    return set.some((s) => x >= s[0] && x <= s[1]);
  },
};

/** True when the browser has asked for reduced motion. */
export function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* vibration unsupported — non-essential feedback */
  }
}
