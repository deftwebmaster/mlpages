import { UPGRADES, UPGRADE_CATEGORIES, getUpgrade } from '../data/upgrades.js';
import { spendCash, canAfford } from './finance-system.js';

export function getOwnedUpgradeByCategory(state, category) {
  const owned = UPGRADES.filter((u) => u.category === category && state.upgrades.owned.includes(u.id));
  return owned.sort((a, b) => b.tier - a.tier)[0] || null;
}

const DEFAULT_EFFECTS = {
  capacity: 0, appealBonus: 0, batchSize: 0, prepSpeed: 0, qualityBonus: 0,
  iceRetention: 0, storageCapacity: 0, spoilageReduction: 0, serviceSpeed: 0,
  satisfactionBonus: 0, forecastAccuracy: 0, waitTolerance: 0, autoRestock: false,
};

export function getUpgradeEffects(state) {
  const effects = { ...DEFAULT_EFFECTS };
  for (const category of UPGRADE_CATEGORIES) {
    const top = getOwnedUpgradeByCategory(state, category);
    if (!top) continue;
    for (const [key, value] of Object.entries(top.effects || {})) {
      if (typeof value === 'boolean') effects[key] = effects[key] || value;
      else effects[key] = (effects[key] || 0) + value;
    }
  }
  if (effects.prepSpeed === 0) effects.prepSpeed = 1;
  if (effects.serviceSpeed === 0) effects.serviceSpeed = 1;
  return effects;
}

export function isUpgradeUnlocked(state, upgrade) {
  if (!upgrade.requirements) return true;
  if (upgrade.requirements.reputation && state.reputation.score < upgrade.requirements.reputation) return false;
  return true;
}

export function getNextUpgradeForCategory(state, category) {
  const owned = getOwnedUpgradeByCategory(state, category);
  const currentTier = owned ? owned.tier : -1;
  return UPGRADES.filter((u) => u.category === category && u.tier === currentTier + 1)[0] || null;
}

export function purchaseUpgrade(state, upgradeId) {
  const upgrade = getUpgrade(upgradeId);
  if (!upgrade) return { success: false, reason: 'not-found' };
  if (state.upgrades.owned.includes(upgradeId)) return { success: false, reason: 'already-owned' };
  if (!isUpgradeUnlocked(state, upgrade)) return { success: false, reason: 'locked' };
  if (!canAfford(state, upgrade.cost)) return { success: false, reason: 'insufficient-funds' };

  spendCash(state, upgrade.cost);
  state.upgrades.owned = state.upgrades.owned.filter(
    (id) => getUpgrade(id)?.category !== upgrade.category
  );
  state.upgrades.owned.push(upgradeId);
  return { success: true };
}
