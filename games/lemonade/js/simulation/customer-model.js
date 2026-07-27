import { clamp, proximityScore, weightedAverage } from '../utils/math.js';
import { chance, randRange, pick } from '../utils/random.js';

// Segment preference profiles. sweetPref/tartPref/icePref are on the same 1-5
// scale as the recipe sliders (recipe-system.js). Centralizing these weights
// here keeps the purchase-decision formula debuggable in one place.
export const SEGMENT_PROFILES = {
  children: {
    label: 'Kids', sweetPref: 4.4, tartPref: 2.0, icePref: 2.5,
    priceSensitivity: 0.9, qualityExpectation: 0.3, patienceTicks: 3, flavorLove: 1.3,
    speedSensitivity: 0.3,
  },
  parents: {
    label: 'Parents', sweetPref: 3.0, tartPref: 3.0, icePref: 3.0,
    priceSensitivity: 0.55, qualityExpectation: 0.6, patienceTicks: 4, flavorLove: 1.0,
    speedSensitivity: 0.4,
  },
  fitness: {
    label: 'Fitness', sweetPref: 1.6, tartPref: 3.8, icePref: 3.2,
    priceSensitivity: 0.35, qualityExpectation: 0.8, patienceTicks: 4, flavorLove: 0.9,
    speedSensitivity: 0.4,
  },
  tourists: {
    label: 'Tourists', sweetPref: 3.4, tartPref: 2.6, icePref: 3.4,
    priceSensitivity: 0.25, qualityExpectation: 0.55, patienceTicks: 5, flavorLove: 1.4,
    speedSensitivity: 0.3,
  },
  commuters: {
    label: 'Commuters', sweetPref: 2.8, tartPref: 3.2, icePref: 2.8,
    priceSensitivity: 0.5, qualityExpectation: 0.45, patienceTicks: 2, flavorLove: 0.8,
    speedSensitivity: 0.9,
  },
};

export const PURCHASE_WEIGHTS = {
  recipeMatch: 0.28,
  price: 0.28,
  wait: 0.16,
  reputation: 0.14,
  quality: 0.09,
  awareness: 0.05,
};

export function expectedPriceFor(segment, priceExpectationRange) {
  const [lo, hi] = priceExpectationRange;
  const profile = SEGMENT_PROFILES[segment];
  // Price-sensitive segments anchor toward the low end of local expectations.
  return lo + (hi - lo) * (1 - profile.priceSensitivity * 0.6);
}

export function generateCustomer(rng, segment) {
  const profile = SEGMENT_PROFILES[segment];
  return {
    segment,
    sweetPref: clamp(profile.sweetPref + randRange(rng, -0.6, 0.6), 1, 5),
    tartPref: clamp(profile.tartPref + randRange(rng, -0.6, 0.6), 1, 5),
    icePref: clamp(profile.icePref + randRange(rng, -0.6, 0.6), 1, 5),
    patience: Math.max(1, Math.round(profile.patienceTicks + randRange(rng, -1, 1))),
    priceSensitivity: profile.priceSensitivity,
  };
}

/**
 * Evaluate whether a single customer buys. Returns an outcome tag plus the
 * satisfaction score (only meaningful when outcome === 'purchased').
 */
export function evaluatePurchase(rng, params) {
  const {
    customer, recipe, menuAppeal, price, expectedPrice, quality,
    reputation, waitTicks, awarenessBoost, available, speedFactor,
  } = params;
  const profile = SEGMENT_PROFILES[customer.segment];

  if (!available) return { outcome: 'unavailable' };
  if (waitTicks > customer.patience) return { outcome: 'left-wait' };

  const sweetMatch = proximityScore(recipe.sugar, customer.sweetPref, 2.2);
  const tartMatch = proximityScore(recipe.lemon, customer.tartPref, 2.2);
  const iceMatch = proximityScore(recipe.ice, customer.icePref, 2.2);
  const recipeMatch = clamp(
    weightedAverage([[sweetMatch, 0.4], [tartMatch, 0.35], [iceMatch, 0.25]]) * menuAppeal,
    0, 1.4
  );

  const priceRatio = expectedPrice > 0 ? price / expectedPrice : 1;
  const priceScore = clamp(1.35 - priceRatio * (0.5 + customer.priceSensitivity * 0.5), 0, 1);

  const waitScore = clamp(1 - waitTicks / customer.patience, 0, 1);
  const speedPenalty = profile.speedSensitivity * clamp(1 - speedFactor, 0, 1) * 0.3;

  let probability =
    PURCHASE_WEIGHTS.recipeMatch * clamp(recipeMatch, 0, 1) +
    PURCHASE_WEIGHTS.price * priceScore +
    PURCHASE_WEIGHTS.wait * waitScore +
    PURCHASE_WEIGHTS.reputation * (reputation / 100) +
    PURCHASE_WEIGHTS.quality * quality +
    PURCHASE_WEIGHTS.awareness * awarenessBoost;
  probability = clamp(probability - speedPenalty, 0.02, 0.97);

  if (!chance(rng, probability)) {
    if (priceScore < 0.35) return { outcome: 'left-price' };
    if (recipeMatch < 0.4) return { outcome: 'left-recipe' };
    return { outcome: 'left-uninterested' };
  }

  const satisfaction = clamp(
    0.45 * recipeMatch + 0.25 * priceScore + 0.15 * waitScore + 0.15 * quality,
    0, 1
  );
  return { outcome: satisfaction >= 0.7 ? 'purchased-delighted' : satisfaction >= 0.4 ? 'purchased' : 'purchased-disappointed', satisfaction };
}

export function pickSegment(rng, customerMix) {
  const entries = Object.entries(customerMix).filter(([, weight]) => weight > 0);
  if (!entries.length) return 'parents';
  return pick(
    rng,
    entries.flatMap(([segment, weight]) => Array(Math.round(weight * 100)).fill(segment))
  );
}
