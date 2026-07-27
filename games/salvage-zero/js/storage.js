import { CONFIG } from './config.js';

const PREFIX = CONFIG.SAVE_PREFIX;

const DEFAULT_SAVE = {
  unlockedMissions: 1, // number of missions unlocked (1-indexed count)
  bestScores: {},      // missionId -> score
  bestRanks: {},        // missionId -> rank string
  completed: {},         // missionId -> true
  optionalCompleted: {}, // missionId -> { [objectiveId]: true }
  stats: {
    totalSalvage: 0,
    contractsCompleted: 0,
    distanceFlown: 0,
    shotsFired: 0,
    shotsHit: 0,
    largestCombo: 0,
    reactorExplosions: 0,
    playTimeSec: 0,
  },
  settings: {
    sfxVolume: 0.8,
    musicVolume: 0.5,
    screenShake: true,
    reducedMotion: false,
    highContrast: false,
    controlSide: 'left', // which thumb steers on mobile
  },
};

function deepMerge(base, over) {
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const k in over) {
    if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && base[k] && typeof base[k] === 'object') {
      out[k] = deepMerge(base[k], over[k]);
    } else {
      out[k] = over[k];
    }
  }
  return out;
}

function key(name) {
  return PREFIX + name;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(key('save'));
    if (!raw) return structuredCloneSafe(DEFAULT_SAVE);
    const parsed = JSON.parse(raw);
    return deepMerge(DEFAULT_SAVE, parsed);
  } catch (e) {
    console.warn('Save load failed, using defaults', e);
    return structuredCloneSafe(DEFAULT_SAVE);
  }
}

export function writeSave(save) {
  try {
    localStorage.setItem(key('save'), JSON.stringify(save));
  } catch (e) {
    console.warn('Save write failed', e);
  }
}

function structuredCloneSafe(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function isStorageAvailable() {
  try {
    const t = key('__test__');
    localStorage.setItem(t, '1');
    localStorage.removeItem(t);
    return true;
  } catch (e) {
    return false;
  }
}
