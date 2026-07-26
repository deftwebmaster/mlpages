/**
 * localStorage wrapper. Every read is validated and every write is guarded, so
 * that private-browsing modes, disabled storage, or corrupted values degrade to
 * in-memory defaults instead of breaking the game.
 */

import { STORAGE_PREFIX } from './config.js';

const DEFAULTS = {
  bestScore: 0,
  bestDistance: 0,
  bestCheckpoint: 0,
  totalRuns: 0,
  totalDistance: 0,
  totalFragments: 0,
  totalNearMisses: 0,
  totalCleanSections: 0,
  totalPlayTime: 0,
  sound: true,
  music: true,
  haptics: true,
  reducedEffects: false,
  tutorialDone: false,
  controlMode: 'drag',
};

const ENUMS = { controlMode: ['drag', 'sides'] };

const NUMERIC = new Set([
  'bestScore',
  'bestDistance',
  'bestCheckpoint',
  'totalRuns',
  'totalDistance',
  'totalFragments',
  'totalNearMisses',
  'totalCleanSections',
  'totalPlayTime',
]);

let available = true;
/** Mirror of persisted state; also the fallback when storage is unavailable. */
const cache = { ...DEFAULTS };

function probe() {
  try {
    const k = STORAGE_PREFIX + '__probe';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function coerce(key, raw) {
  const def = DEFAULTS[key];
  if (raw === null || raw === undefined) return def;
  if (typeof def === 'boolean') return raw === 'true' ? true : raw === 'false' ? false : def;
  if (NUMERIC.has(key)) {
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : def;
  }
  if (ENUMS[key]) return ENUMS[key].includes(raw) ? raw : def;
  return raw;
}

export function initStorage() {
  available = probe();
  if (!available) return;
  for (const key of Object.keys(DEFAULTS)) {
    try {
      cache[key] = coerce(key, localStorage.getItem(STORAGE_PREFIX + key));
    } catch {
      cache[key] = DEFAULTS[key];
    }
  }
}

export function get(key) {
  return key in cache ? cache[key] : DEFAULTS[key];
}

export function set(key, value) {
  if (!(key in DEFAULTS)) return;
  cache[key] = value;
  if (!available) return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, String(value));
  } catch {
    available = false;
  }
}

export function bumpMax(key, value) {
  if (value > get(key)) {
    set(key, value);
    return true;
  }
  return false;
}

export function add(key, value) {
  set(key, get(key) + value);
}

export function allStats() {
  return { ...cache };
}

export function resetProgress() {
  for (const key of Object.keys(DEFAULTS)) {
    if (NUMERIC.has(key)) set(key, 0);
  }
  set('tutorialDone', false);
}

export const storageAvailable = () => available;
