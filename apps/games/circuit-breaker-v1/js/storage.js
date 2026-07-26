import { CONFIG } from "./config.js";

const defaults = {
  bestScore: 0,
  totalGames: 0,
  lifetimeScore: 0,
  soundEnabled: true,
  hapticsEnabled: true,
  effectsEnabled: true,
  helpSeen: false,
  tutorialComplete: false
};

const numberKeys = new Set(["bestScore", "totalGames", "lifetimeScore"]);
const booleanKeys = new Set(["soundEnabled", "hapticsEnabled", "effectsEnabled", "helpSeen", "tutorialComplete"]);

function key(name) {
  return `${CONFIG.storagePrefix}${name}`;
}

export function loadSettings() {
  const data = { ...defaults };
  for (const settingKey of Object.keys(defaults)) {
    try {
      const raw = window.localStorage.getItem(key(settingKey));
      if (raw === null) continue;
      if (numberKeys.has(settingKey)) {
        const parsed = Number(raw);
        data[settingKey] = Number.isFinite(parsed) && parsed >= 0 ? parsed : defaults[settingKey];
      }
      if (booleanKeys.has(settingKey)) {
        data[settingKey] = raw === "true";
      }
    } catch {
      data[settingKey] = defaults[settingKey];
    }
  }
  return data;
}

export function saveSetting(name, value) {
  try {
    window.localStorage.setItem(key(name), String(value));
  } catch {
    // Private browsing or storage quotas should never stop gameplay.
  }
}

export function saveRunResults(score) {
  const data = loadSettings();
  const bestScore = Math.max(data.bestScore, score);
  saveSetting("bestScore", bestScore);
  saveSetting("totalGames", data.totalGames + 1);
  saveSetting("lifetimeScore", data.lifetimeScore + score);
  return { bestScore, isNewBest: score > data.bestScore };
}

export function markHelpSeen() {
  saveSetting("helpSeen", true);
}

export function markTutorialComplete() {
  saveSetting("tutorialComplete", true);
}
