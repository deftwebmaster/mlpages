import { STORAGE_KEY } from '../utils/constants.js';

const SCHEMA_VERSION = 1;

function defaultSave() {
  return {
    version: SCHEMA_VERSION,
    currentMissionId: null,
    unlockedMissionIds: [],
    bestStars: {},      // { [missionId]: 0-3 }
    bestMoves: {},       // { [missionId]: number }
    settings: {
      sound: true,
      music: true,
      haptics: true,
      reducedMotion: false,
    },
    statistics: {
      missionsCompleted: 0,
      totalMoves: 0,
      totalRestarts: 0,
      bestRuns: 0,
      perfectMissions: 0,
      playTimeMs: 0,
      detectionCount: 0,
    },
  };
}

let cache = null;

function load() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cache = defaultSave();
      return cache;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== SCHEMA_VERSION) {
      cache = defaultSave();
      return cache;
    }
    // Merge with defaults so newly added fields are always present.
    const def = defaultSave();
    cache = {
      ...def,
      ...parsed,
      settings: { ...def.settings, ...(parsed.settings || {}) },
      statistics: { ...def.statistics, ...(parsed.statistics || {}) },
      bestStars: { ...(parsed.bestStars || {}) },
      bestMoves: { ...(parsed.bestMoves || {}) },
    };
  } catch {
    cache = defaultSave();
  }
  return cache;
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage unavailable (private mode/quota) — fail silently, game still playable this session.
  }
}

export const Storage = {
  getSave() {
    return load();
  },
  setCurrentMission(missionId) {
    const s = load();
    s.currentMissionId = missionId;
    persist();
  },
  unlockMission(missionId) {
    const s = load();
    if (!s.unlockedMissionIds.includes(missionId)) {
      s.unlockedMissionIds.push(missionId);
      persist();
    }
  },
  isUnlocked(missionId, isFirst) {
    const s = load();
    return isFirst || s.unlockedMissionIds.includes(missionId);
  },
  recordMissionResult(missionId, { stars, moves, usedUndo, restarts, detections }) {
    const s = load();
    const prevStars = s.bestStars[missionId] || 0;
    if (stars > prevStars) s.bestStars[missionId] = stars;
    const prevMoves = s.bestMoves[missionId];
    if (prevMoves == null || moves < prevMoves) s.bestMoves[missionId] = moves;

    s.statistics.missionsCompleted += 1;
    s.statistics.totalMoves += moves;
    s.statistics.totalRestarts += restarts || 0;
    s.statistics.detectionCount += detections || 0;
    if (!usedUndo && (prevMoves == null || moves <= prevMoves)) s.statistics.bestRuns += 1;
    if (stars >= 3) s.statistics.perfectMissions += 1;
    persist();
  },
  recordRestart() {
    const s = load();
    s.statistics.totalRestarts += 1;
    persist();
  },
  recordDetection() {
    const s = load();
    s.statistics.detectionCount += 1;
    persist();
  },
  addPlayTime(ms) {
    const s = load();
    s.statistics.playTimeMs += ms;
    persist();
  },
  updateSettings(partial) {
    const s = load();
    s.settings = { ...s.settings, ...partial };
    persist();
  },
  resetProgress() {
    cache = defaultSave();
    persist();
  },
};
