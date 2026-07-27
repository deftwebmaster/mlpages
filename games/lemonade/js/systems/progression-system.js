import { MILESTONES } from '../data/milestones.js';
import { REPUTATION_TIERS } from '../utils/constants.js';
import { notify } from './notification-system.js';

export function checkMilestones(state) {
  const newlyCompleted = [];
  for (const milestone of MILESTONES) {
    if (state.milestones.completed.includes(milestone.id)) continue;
    if (milestone.check(state.stats)) {
      state.milestones.completed.push(milestone.id);
      for (const feature of milestone.unlocks) {
        if (!state.milestones.unlockedFeatures.includes(feature)) {
          state.milestones.unlockedFeatures.push(feature);
        }
      }
      newlyCompleted.push(milestone);
      notify(`Milestone reached: ${milestone.name}`, 'milestone');
    }
  }
  return newlyCompleted;
}

export function isFeatureUnlocked(state, feature) {
  if (feature === 'core') return true;
  return state.milestones.unlockedFeatures.includes(feature);
}

export function getReputationTier(reputation) {
  let tier = REPUTATION_TIERS[0];
  for (const t of REPUTATION_TIERS) {
    if (reputation >= t.min) tier = t;
  }
  return tier.label;
}

export function getNextReputationTier(reputation) {
  return REPUTATION_TIERS.find((t) => t.min > reputation) || null;
}
