/**
 * storage.js — Local persistence (progress, records, settings, achievements).
 *
 * Everything lives under the `gridlock_` prefix in localStorage. All reads are
 * defensive: a corrupted or absent entry simply falls back to defaults, so the
 * game never fails to boot because of bad save data.
 */

import { STORAGE_PREFIX } from './config.js';

const KEY = {
  PROGRESS: STORAGE_PREFIX + 'progress',
  SETTINGS: STORAGE_PREFIX + 'settings',
  STATS: STORAGE_PREFIX + 'stats',
  ACHIEVEMENTS: STORAGE_PREFIX + 'achievements',
};

const DEFAULT_SETTINGS = {
  sound: true,
  music: true,
  dpad: 'auto', // 'auto' | 'on' | 'off'
  particles: true,
  screenShake: true,
  highContrast: false,
  hapticFeedback: true,
};

const DEFAULT_STATS = {
  levelsCompleted: 0,
  totalScore: 0,
  totalDeaths: 0,
  totalNodes: 0,
  totalDrones: 0,
  totalShifts: 0,
  totalSecrets: 0,
  bestCombo: 0,
  playTime: 0,
  sessions: 0,
};

/** Definitions for every achievement the game can award. */
export const ACHIEVEMENTS = [
  { id: 'first_shift', name: 'First Shift', desc: 'Activate a Grid Shift terminal.' },
  { id: 'perfect_escape', name: 'Perfect Escape', desc: 'Clear a level without dying.' },
  { id: 'drone_hunter', name: 'Drone Hunter', desc: 'Eliminate 25 drones.' },
  { id: 'combo_master', name: 'Combo Master', desc: 'Chain all four drones on one power module.' },
  { id: 'secret_finder', name: 'Secret Finder', desc: 'Discover 10 secret areas.' },
  { id: 'zero_death_run', name: 'Zero Death Run', desc: 'Clear five levels in a row without dying.' },
  { id: 'speed_runner', name: 'Speed Runner', desc: 'Beat a level in half its target time.' },
  { id: 'master_hacker', name: 'Master Hacker', desc: 'Earn an S+ rank on every level.' },
];

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredClone(fallback);
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') return structuredClone(fallback);
    return { ...structuredClone(fallback), ...parsed };
  } catch {
    return structuredClone(fallback);
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Private browsing or a full quota — the game stays playable, just amnesiac.
    return false;
  }
}

class Storage {
  constructor() {
    this.settings = read(KEY.SETTINGS, DEFAULT_SETTINGS);
    this.stats = read(KEY.STATS, DEFAULT_STATS);
    /** @type {{unlocked:number, levels:Record<string, object>}} */
    this.progress = read(KEY.PROGRESS, { unlocked: 1, levels: {} });
    this.achievements = read(KEY.ACHIEVEMENTS, {});
    this.streak = 0; // consecutive deathless clears, in-session
  }

  // ── Settings ──────────────────────────────────────────────────────────────
  getSetting(name) {
    return this.settings[name];
  }

  setSetting(name, value) {
    this.settings[name] = value;
    write(KEY.SETTINGS, this.settings);
  }

  // ── Progress ──────────────────────────────────────────────────────────────
  get unlocked() {
    return Math.max(1, this.progress.unlocked | 0);
  }

  isUnlocked(levelNumber) {
    return levelNumber <= this.unlocked;
  }

  unlock(levelNumber) {
    if (levelNumber > this.progress.unlocked) {
      this.progress.unlocked = levelNumber;
      write(KEY.PROGRESS, this.progress);
    }
  }

  /** @returns {{bestScore:number,bestTime:number,rank:string|null,perfect:boolean,secrets:number,plays:number}} */
  getLevelRecord(levelId) {
    return (
      this.progress.levels[levelId] || {
        bestScore: 0,
        bestTime: Infinity,
        rank: null,
        perfect: false,
        secrets: 0,
        plays: 0,
      }
    );
  }

  /**
   * Merges a completed run into the stored record, keeping the best of each
   * field. Returns which fields were improved so the UI can celebrate them.
   */
  saveLevelResult(levelId, result) {
    const prev = this.getLevelRecord(levelId);
    const bestTime = isFinite(prev.bestTime) ? prev.bestTime : Infinity;
    const improved = {
      score: result.score > prev.bestScore,
      time: result.time < bestTime,
      rank: rankValue(result.rank) > rankValue(prev.rank),
    };
    this.progress.levels[levelId] = {
      bestScore: Math.max(prev.bestScore, result.score),
      bestTime: Math.min(bestTime, result.time),
      rank: improved.rank ? result.rank : prev.rank,
      perfect: prev.perfect || result.perfect,
      secrets: Math.max(prev.secrets, result.secrets),
      plays: (prev.plays || 0) + 1,
    };
    write(KEY.PROGRESS, this.progress);
    return improved;
  }

  // ── Statistics ────────────────────────────────────────────────────────────
  addStats(delta) {
    for (const k of Object.keys(delta)) {
      if (k === 'bestCombo') this.stats.bestCombo = Math.max(this.stats.bestCombo, delta[k]);
      else this.stats[k] = (this.stats[k] || 0) + delta[k];
    }
    write(KEY.STATS, this.stats);
  }

  // ── Achievements ──────────────────────────────────────────────────────────
  hasAchievement(id) {
    return Boolean(this.achievements[id]);
  }

  /** @returns {boolean} true if this call is what unlocked it. */
  award(id) {
    if (this.achievements[id]) return false;
    this.achievements[id] = Date.now();
    write(KEY.ACHIEVEMENTS, this.achievements);
    return true;
  }

  /** Wipes every `gridlock_` key. Used by the "reset progress" button. */
  resetAll() {
    for (const key of Object.values(KEY)) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
    this.settings = structuredClone(DEFAULT_SETTINGS);
    this.stats = structuredClone(DEFAULT_STATS);
    this.progress = { unlocked: 1, levels: {} };
    this.achievements = {};
  }
}

const ORDER = ['C', 'B', 'A', 'S', 'S+'];
export function rankValue(rank) {
  const i = ORDER.indexOf(rank);
  return i < 0 ? -1 : i;
}

export const storage = new Storage();
