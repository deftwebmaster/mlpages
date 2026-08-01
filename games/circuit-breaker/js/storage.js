/**
 * Local persistence. Everything is optional — if localStorage is unavailable
 * (private browsing, blocked storage) the game keeps working with in-memory
 * defaults and simply forgets between sessions.
 */

import { STORAGE_PREFIX } from './config.js';

const KEY = {
  bestScore: 'bestScore',
  gamesPlayed: 'gamesPlayed',
  lifetimeScore: 'lifetimeScore',
  soundEnabled: 'soundEnabled',
  hapticsEnabled: 'hapticsEnabled',
  reducedEffects: 'reducedEffects',
  helpSeen: 'helpSeen',
  tutorialDone: 'tutorialDone',
  bestCascade: 'bestCascade',
  bestCooling: 'bestCooling',
  bestSpecials: 'bestSpecials',
};

let available = true;
const memory = new Map();

try {
  const probe = `${STORAGE_PREFIX}__probe`;
  localStorage.setItem(probe, '1');
  localStorage.removeItem(probe);
} catch {
  available = false;
}

function readRaw(name) {
  if (!available) return memory.has(name) ? memory.get(name) : null;
  try {
    return localStorage.getItem(STORAGE_PREFIX + name);
  } catch {
    return null;
  }
}

function writeRaw(name, value) {
  if (!available) {
    memory.set(name, value);
    return;
  }
  try {
    localStorage.setItem(STORAGE_PREFIX + name, value);
  } catch {
    /* Quota or blocked storage — non-fatal. */
  }
}

function readNumber(name, fallback = 0) {
  const raw = readRaw(name);
  if (raw === null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function readBool(name, fallback) {
  const raw = readRaw(name);
  if (raw === null) return fallback;
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return fallback;
}

export const storage = {
  get bestScore() { return Math.floor(readNumber(KEY.bestScore, 0)); },
  get gamesPlayed() { return Math.floor(readNumber(KEY.gamesPlayed, 0)); },
  get lifetimeScore() { return Math.floor(readNumber(KEY.lifetimeScore, 0)); },
  get bestCascade() { return Math.floor(readNumber(KEY.bestCascade, 0)); },
  get bestCooling() { return Math.floor(readNumber(KEY.bestCooling, 0)); },
  get bestSpecials() { return Math.floor(readNumber(KEY.bestSpecials, 0)); },

  get soundEnabled() { return readBool(KEY.soundEnabled, true); },
  set soundEnabled(v) { writeRaw(KEY.soundEnabled, String(!!v)); },

  get hapticsEnabled() { return readBool(KEY.hapticsEnabled, true); },
  set hapticsEnabled(v) { writeRaw(KEY.hapticsEnabled, String(!!v)); },

  get reducedEffects() { return readBool(KEY.reducedEffects, false); },
  set reducedEffects(v) { writeRaw(KEY.reducedEffects, String(!!v)); },

  get helpSeen() { return readBool(KEY.helpSeen, false); },
  set helpSeen(v) { writeRaw(KEY.helpSeen, String(!!v)); },

  get tutorialDone() { return readBool(KEY.tutorialDone, false); },
  set tutorialDone(v) { writeRaw(KEY.tutorialDone, String(!!v)); },

  /** Commits a finished run. Returns true when it set a new best score. */
  recordGame(stats) {
    const score = Math.max(0, Math.floor(stats.score || 0));
    const isBest = score > this.bestScore;
    if (isBest) writeRaw(KEY.bestScore, String(score));
    writeRaw(KEY.gamesPlayed, String(this.gamesPlayed + 1));
    writeRaw(KEY.lifetimeScore, String(this.lifetimeScore + score));
    if ((stats.largestCascade || 0) > this.bestCascade) {
      writeRaw(KEY.bestCascade, String(Math.floor(stats.largestCascade)));
    }
    if ((stats.totalCooled || 0) > this.bestCooling) {
      writeRaw(KEY.bestCooling, String(Math.floor(stats.totalCooled)));
    }
    if ((stats.specialsActivated || 0) > this.bestSpecials) {
      writeRaw(KEY.bestSpecials, String(Math.floor(stats.specialsActivated)));
    }
    return isBest;
  },
};
