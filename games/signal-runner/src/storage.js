/**
 * storage.js — Local persistence with a hard requirement: never throw.
 *
 * localStorage is unavailable in private windows on some browsers, can be
 * disabled entirely, and can be full. In every one of those cases the game
 * must keep working — it simply forgets progress between sessions. All reads
 * are validated and coerced, because stored data is user-editable and a stale
 * schema from an older build must not be able to crash a newer one.
 */

import { CONFIG } from './config.js';
import { LEVEL_COUNT } from './levels.js';

const PREFIX = CONFIG.storagePrefix;
const KEY_PROGRESS = `${PREFIX}progress`;
const KEY_SETTINGS = `${PREFIX}settings`;
const KEY_STATS = `${PREFIX}stats`;
const KEY_TUTORIAL = `${PREFIX}tutorial`;

let available = null;
/** In-memory fallback so a session still behaves normally without storage. */
const memory = new Map();

function storageAvailable() {
  if (available !== null) return available;
  try {
    const probe = `${PREFIX}__probe`;
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    available = true;
  } catch {
    available = false;
  }
  return available;
}

function readRaw(key) {
  try {
    if (storageAvailable()) return localStorage.getItem(key);
  } catch {
    /* fall through to memory */
  }
  return memory.has(key) ? memory.get(key) : null;
}

function writeRaw(key, value) {
  memory.set(key, value);
  try {
    if (storageAvailable()) localStorage.setItem(key, value);
  } catch {
    /* Quota or permission failure — the in-memory copy still serves. */
  }
}

function readJSON(key, fallback) {
  const raw = readRaw(key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

const num = (v, d = 0) => (Number.isFinite(v) ? v : d);
const bool = (v, d = false) => (typeof v === 'boolean' ? v : d);

// --- Settings ---------------------------------------------------------------

const DEFAULT_SETTINGS = {
  sound: true,
  music: false,
  haptics: true,
  reducedEffects: false,
};

export function loadSettings() {
  const raw = readJSON(KEY_SETTINGS, {});
  return {
    sound: bool(raw.sound, DEFAULT_SETTINGS.sound),
    music: bool(raw.music, DEFAULT_SETTINGS.music),
    haptics: bool(raw.haptics, DEFAULT_SETTINGS.haptics),
    reducedEffects: bool(raw.reducedEffects, DEFAULT_SETTINGS.reducedEffects),
  };
}

export function saveSettings(settings) {
  writeRaw(KEY_SETTINGS, JSON.stringify(settings));
}

/** Has this player ever chosen their own settings? Drives first-run defaults. */
export function hasStoredSettings() {
  return readRaw(KEY_SETTINGS) !== null;
}

// --- Progress ---------------------------------------------------------------

function emptyLevelRecord() {
  return {
    completed: false,
    bestTime: null,
    bestScore: 0,
    bestFragments: 0,
    badges: { connected: false, clean: false, lowLatency: false },
  };
}

function coerceLevelRecord(raw) {
  const rec = emptyLevelRecord();
  if (!raw || typeof raw !== 'object') return rec;
  rec.completed = bool(raw.completed);
  rec.bestTime = Number.isFinite(raw.bestTime) && raw.bestTime > 0 ? raw.bestTime : null;
  rec.bestScore = Math.max(0, num(raw.bestScore));
  rec.bestFragments = Math.max(0, num(raw.bestFragments));
  const badges = raw.badges && typeof raw.badges === 'object' ? raw.badges : {};
  rec.badges.connected = bool(badges.connected) || rec.completed;
  rec.badges.clean = bool(badges.clean);
  rec.badges.lowLatency = bool(badges.lowLatency);
  return rec;
}

export function loadProgress() {
  const raw = readJSON(KEY_PROGRESS, {});
  const levels = {};
  for (let id = 1; id <= LEVEL_COUNT; id++) {
    levels[id] = coerceLevelRecord(raw.levels ? raw.levels[id] : null);
  }
  // Unlock state is derived rather than trusted, so a corrupted or edited
  // value can never lock a player out of a level they have finished.
  let unlocked = 1;
  for (let id = 1; id <= LEVEL_COUNT; id++) {
    if (levels[id].completed) unlocked = Math.min(LEVEL_COUNT, id + 1);
  }
  unlocked = Math.max(unlocked, Math.min(LEVEL_COUNT, Math.max(1, num(raw.unlocked, 1))));
  return { levels, unlocked };
}

export function saveProgress(progress) {
  writeRaw(KEY_PROGRESS, JSON.stringify(progress));
}

export function totalScore(progress) {
  let total = 0;
  for (const id of Object.keys(progress.levels)) total += progress.levels[id].bestScore;
  return total;
}

export function totalBadges(progress) {
  let earned = 0;
  for (const id of Object.keys(progress.levels)) {
    const b = progress.levels[id].badges;
    earned += (b.connected ? 1 : 0) + (b.clean ? 1 : 0) + (b.lowLatency ? 1 : 0);
  }
  return earned;
}

export function totalFragments(progress) {
  let total = 0;
  for (const id of Object.keys(progress.levels)) total += progress.levels[id].bestFragments;
  return total;
}

// --- Statistics -------------------------------------------------------------

const DEFAULT_STATS = {
  levelsCompleted: 0,
  playTime: 0,
  deaths: 0,
  deathsByCause: {},
  moves: 0,
  forwardMoves: 0,
  polaritySwitches: 0,
  uplinksActivated: 0,
  fragmentsCollected: 0,
  cleanBadges: 0,
  latencyBadges: 0,
  bestStreak: 0,
  currentStreak: 0,
};

export function loadStats() {
  const raw = readJSON(KEY_STATS, {});
  const stats = { ...DEFAULT_STATS, deathsByCause: {} };
  for (const key of Object.keys(DEFAULT_STATS)) {
    if (key === 'deathsByCause') continue;
    stats[key] = Math.max(0, num(raw[key], DEFAULT_STATS[key]));
  }
  if (raw.deathsByCause && typeof raw.deathsByCause === 'object') {
    for (const [cause, count] of Object.entries(raw.deathsByCause)) {
      if (typeof cause === 'string' && Number.isFinite(count)) {
        stats.deathsByCause[cause] = Math.max(0, count);
      }
    }
  }
  return stats;
}

export function saveStats(stats) {
  writeRaw(KEY_STATS, JSON.stringify(stats));
}

// --- Tutorial ---------------------------------------------------------------

export function loadTutorialState() {
  const raw = readJSON(KEY_TUTORIAL, {});
  const seen = {};
  if (raw.seen && typeof raw.seen === 'object') {
    for (const [id, value] of Object.entries(raw.seen)) if (value) seen[id] = true;
  }
  return { seen };
}

export function saveTutorialState(state) {
  writeRaw(KEY_TUTORIAL, JSON.stringify(state));
}

// --- Maintenance ------------------------------------------------------------

export function resetAll() {
  for (const key of [KEY_PROGRESS, KEY_STATS, KEY_TUTORIAL]) {
    memory.delete(key);
    try {
      if (storageAvailable()) localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

export function isPersistent() {
  return storageAvailable();
}
