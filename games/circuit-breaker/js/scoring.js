/**
 * Scoring and cooling for one resolution step.
 * `step` is 1 for the player's own match, 2 for the first cascade, and so on.
 */

import {
  CONFIG,
  baseMatchScore,
  matchCooling,
  cascadeMultiplier,
  cascadeCooling,
} from './config.js';

export function evaluateStep({
  groups,
  activations = 0,
  fullLines = 0,
  clearedCount = 0,
  specialCleared = 0,
  step = 1,
}) {
  const multiplier = cascadeMultiplier(step);

  let base = groups.reduce((sum, g) => sum + baseMatchScore(g.length), 0);
  base += activations * CONFIG.SPECIAL_ACTIVATION_SCORE;
  base += fullLines * CONFIG.FULL_LINE_SCORE;
  base += specialCleared * CONFIG.SPECIAL_CLEAR_NODE_SCORE;

  let cooling = groups.reduce((sum, g) => sum + matchCooling(g.length), 0);
  cooling += cascadeCooling(step);
  cooling += activations * CONFIG.COOLING_SPECIAL;
  if (clearedCount >= CONFIG.LARGE_CHAIN_NODE_COUNT) cooling += CONFIG.COOLING_LARGE_CHAIN;

  return {
    points: Math.round(base * multiplier),
    base,
    cooling,
    multiplier,
  };
}

/** Combo caption for a cascade step, or null for the player's own match. */
export function cascadeLabel(step) {
  if (step < 2) return null;
  if (CONFIG.CASCADE_LABELS[step]) return CONFIG.CASCADE_LABELS[step];
  return `${CONFIG.CASCADE_SURGE_LABEL} x${step}`;
}
