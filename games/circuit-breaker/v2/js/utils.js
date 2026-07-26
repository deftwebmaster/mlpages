/** Small shared helpers. */

import { CONFIG } from './config.js';

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const randInt = (max) => Math.floor(Math.random() * max);

export const pick = (list) => list[randInt(list.length)];

export const key = (row, col) => `${row},${col}`;

export function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/* ---------------------------------------------------------------------------
   Motion preferences. The OS setting and the in-game "reduced FX" switch both
   feed a single scale factor used by every timed step in the game loop.
   --------------------------------------------------------------------------- */

const motionQuery = typeof matchMedia === 'function'
  ? matchMedia('(prefers-reduced-motion: reduce)')
  : null;

let manualReduced = false;
const motionListeners = new Set();

export function setReducedEffects(on) {
  manualReduced = !!on;
  motionListeners.forEach((fn) => fn(reducedMotion()));
}

export function reducedMotion() {
  return manualReduced || !!(motionQuery && motionQuery.matches);
}

export function onMotionChange(fn) {
  motionListeners.add(fn);
  if (motionQuery && typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', () => fn(reducedMotion()));
  }
}

/** Duration for a named CONFIG.TIMING step, scaled for reduced motion. */
export function duration(name) {
  const base = CONFIG.TIMING[name] ?? 200;
  return reducedMotion() ? Math.max(40, Math.round(base * CONFIG.REDUCED_MOTION_SCALE)) : base;
}

/* ---------------------------------------------------------------------------
   Cancellable waiting. Every timer the game loop creates is registered so a
   restart or a teardown can never leave an orphaned callback running.
   --------------------------------------------------------------------------- */

const liveTimers = new Set();

export function wait(ms) {
  return new Promise((resolve) => {
    if (ms <= 0) {
      resolve();
      return;
    }
    const id = setTimeout(() => {
      liveTimers.delete(id);
      resolve();
    }, ms);
    liveTimers.add(id);
  });
}

/** Waits for a named CONFIG.TIMING step. */
export const waitFor = (name) => wait(duration(name));

export function clearAllTimers() {
  liveTimers.forEach((id) => clearTimeout(id));
  liveTimers.clear();
}

/** Forces a style flush so a following transition actually animates. */
export function reflow(el) {
  // Reading a layout property is the cheapest reliable way to flush styles.
  void el.offsetHeight;
}

export function formatNumber(n) {
  return Math.round(n).toLocaleString('en-US');
}
