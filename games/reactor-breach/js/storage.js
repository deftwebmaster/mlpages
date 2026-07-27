import { STORAGE_PREFIX } from './config.js';

const SAVE_KEY = STORAGE_PREFIX + 'save';
const SCHEMA_VERSION = 1;

function defaultSave() {
  return {
    schemaVersion: SCHEMA_VERSION,
    highestUnlockedStage: 1,
    challengeUnlocks: {},
    stageRecords: {}, // id -> {bestScore,bestTime,bestRank,medals:{breach,stable,control},secondaryDone:[]}
    stats: {
      stagesCompleted: 0,
      playTimeSeconds: 0,
      componentsDestroyed: 0,
      structuralDestroyed: 0,
      shieldNodesDestroyed: 0,
      volatileChains: 0,
      energyCollected: 0,
      energyMissed: 0,
      routingChanges: 0,
      abilitiesActivated: 0,
      orbsLost: 0,
      magneticCatches: 0,
      bossesDefeated: 0,
      highestCombo: 0,
      sPlusRanks: 0,
      perfectStages: 0
    },
    settings: {
      sound: true,
      music: true,
      haptics: true,
      reducedMotion: false,
      reducedEffects: false,
      assist: false,
      screenShake: 'full'
    },
    tutorialSeen: {}
  };
}

function isValidSave(data) {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.highestUnlockedStage === 'number' &&
    typeof data.stageRecords === 'object' &&
    typeof data.stats === 'object' &&
    typeof data.settings === 'object'
  );
}

// Deep-merges `incoming` onto `base`, filling in any keys missing from an
// older save (forward compatibility). Only walks keys known to `base`, so it
// must NOT be used for dynamic dictionaries keyed by id (stageRecords,
// tutorialSeen, challengeUnlocks) — those are merged separately below as a
// straight passthrough, since their keys aren't part of the fixed schema.
function deepMerge(base, incoming) {
  const out = { ...base };
  for (const k of Object.keys(base)) {
    if (incoming && incoming[k] !== undefined) {
      if (typeof base[k] === 'object' && base[k] !== null && !Array.isArray(base[k])) {
        out[k] = deepMerge(base[k], incoming[k]);
      } else {
        out[k] = incoming[k];
      }
    }
  }
  return out;
}

const DYNAMIC_DICT_KEYS = ['stageRecords', 'tutorialSeen', 'challengeUnlocks'];

function mergeSave(defaults, incoming) {
  const merged = deepMerge(defaults, incoming);
  for (const key of DYNAMIC_DICT_KEYS) {
    if (incoming && incoming[key] && typeof incoming[key] === 'object') {
      merged[key] = { ...incoming[key] };
    }
  }
  return merged;
}

let localStorageAvailable = true;
try {
  const testKey = STORAGE_PREFIX + '__test__';
  window.localStorage.setItem(testKey, '1');
  window.localStorage.removeItem(testKey);
} catch (e) {
  localStorageAvailable = false;
}

let cachedSave = null;

export function loadSave() {
  if (cachedSave) return cachedSave;
  if (!localStorageAvailable) {
    cachedSave = defaultSave();
    return cachedSave;
  }
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      cachedSave = defaultSave();
      return cachedSave;
    }
    const parsed = JSON.parse(raw);
    if (!isValidSave(parsed)) {
      cachedSave = defaultSave();
      return cachedSave;
    }
    cachedSave = mergeSave(defaultSave(), parsed);
    return cachedSave;
  } catch (e) {
    console.warn('[storage] Failed to load save, resetting.', e);
    cachedSave = defaultSave();
    return cachedSave;
  }
}

export function saveGame(mutatorFn) {
  const save = loadSave();
  if (mutatorFn) mutatorFn(save);
  cachedSave = save;
  if (!localStorageAvailable) return;
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (e) {
    console.warn('[storage] Failed to persist save.', e);
  }
}

export function getStageRecord(stageId) {
  const save = loadSave();
  return (
    save.stageRecords[stageId] || {
      bestScore: 0,
      bestTime: null,
      bestRank: null,
      medals: { breach: false, stable: false, control: false },
      secondaryDone: []
    }
  );
}

export function recordStageResult(stageId, result) {
  saveGame((save) => {
    const existing = save.stageRecords[stageId] || {
      bestScore: 0,
      bestTime: null,
      bestRank: null,
      medals: { breach: false, stable: false, control: false },
      secondaryDone: []
    };
    existing.bestScore = Math.max(existing.bestScore, result.score);
    if (existing.bestTime == null || result.time < existing.bestTime) {
      existing.bestTime = result.time;
    }
    const rankOrder = ['C', 'B', 'A', 'S', 'S+'];
    if (!existing.bestRank || rankOrder.indexOf(result.rank) > rankOrder.indexOf(existing.bestRank)) {
      existing.bestRank = result.rank;
    }
    existing.medals.breach = existing.medals.breach || result.medals.breach;
    existing.medals.stable = existing.medals.stable || result.medals.stable;
    existing.medals.control = existing.medals.control || result.medals.control;
    const merged = new Set([...(existing.secondaryDone || []), ...(result.secondaryDone || [])]);
    existing.secondaryDone = Array.from(merged);
    save.stageRecords[stageId] = existing;
    if (result.completed && stageId >= save.highestUnlockedStage && stageId < 18) {
      save.highestUnlockedStage = stageId + 1;
    }
    if (result.completed) save.stats.stagesCompleted += 1;
  });
}

export function updateStats(delta) {
  saveGame((save) => {
    for (const key of Object.keys(delta)) {
      if (typeof save.stats[key] === 'number') {
        if (key === 'highestCombo') {
          save.stats[key] = Math.max(save.stats[key], delta[key]);
        } else {
          save.stats[key] += delta[key];
        }
      }
    }
  });
}

export function updateSettings(partial) {
  saveGame((save) => {
    Object.assign(save.settings, partial);
  });
}

export function markTutorialSeen(key) {
  saveGame((save) => {
    save.tutorialSeen[key] = true;
  });
}

export function isStorageAvailable() {
  return localStorageAvailable;
}
