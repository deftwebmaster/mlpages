import { clamp } from '../utils/math.js';
import { randInt, chance } from '../utils/random.js';
import {
  weatherTrafficMultiplier,
  temperatureDemandFactor,
  hourlyWeatherFactor,
} from './weather-model.js';

export function reputationTrafficFactor(reputation) {
  return clamp(0.6 + (reputation / 100) * 0.7, 0.5, 1.5);
}

export function awarenessTrafficFactor(brandAwareness, campaignReach = 0) {
  const base = clamp(0.85 + (brandAwareness / 100) * 0.3, 0.85, 1.3);
  return base + campaignReach;
}

export function competitionTrafficFactor(competitionLevel, competitorCount) {
  return clamp(1 - competitionLevel * 0.5 - competitorCount * 0.03, 0.4, 1);
}

// Rough intraday shape: slow morning, lunch peak, afternoon lull, second peak.
const HOUR_CURVE = {
  9: 0.5, 10: 0.7, 11: 0.9, 12: 1.3, 13: 1.25, 14: 1.0, 15: 1.1, 16: 1.15,
  17: 0.9, 18: 0.7, 19: 0.55, 20: 0.4, 21: 0.3,
};

export function hourWeight(hour) {
  return HOUR_CURVE[Math.floor(hour)] ?? 0.6;
}

/**
 * Combines every non-hour-specific modifier into one multiplier so the demand
 * curve just needs to be scaled by hour weight and weather's hourly dip.
 */
export function computeDayModifier({
  location,
  weather,
  season,
  reputation,
  brandAwareness,
  campaignReach = 0,
  competitorCount = 0,
  localEventMultiplier = 1,
  menuSeasonality = 1,
}) {
  const weatherMod = weatherTrafficMultiplier(weather.type) * temperatureDemandFactor(weather.temperature);
  const repMod = reputationTrafficFactor(reputation);
  const awareMod = awarenessTrafficFactor(brandAwareness, campaignReach);
  const compMod = competitionTrafficFactor(location.competitionLevel || 0, competitorCount);
  const exposureMod = 1 - (location.weatherExposure || 0.5) * (1 - clamp(weatherMod, 0.3, 1.3)) * 0.6;
  return weatherMod * repMod * awareMod * compMod * exposureMod * localEventMultiplier * menuSeasonality;
}

/** Estimated cup-demand range shown on the prep screen (never an exact number). */
export function estimateDemandRange(dayModifier, location, hours) {
  const [startHour, endHour] = hours;
  let totalWeight = 0;
  for (let h = Math.floor(startHour); h < endHour; h += 1) totalWeight += hourWeight(h);
  const expectedGroups = location.trafficBase * dayModifier * (totalWeight / 9);
  const expectedCups = expectedGroups * 1.3; // avg group size ~1.3 cups
  const low = Math.max(0, Math.round(expectedCups * 0.72));
  const high = Math.round(expectedCups * 1.28);
  return { low, high, expected: Math.round(expectedCups) };
}

/**
 * Actual number of customer groups arriving in a single tick during live sim.
 * Uses stochastic rounding (whole part guaranteed, fractional part treated as
 * a probability) instead of naive Math.round — otherwise any mean below 0.5
 * (the common case for a single 15-minute tick) would always round to zero
 * and no customers would ever show up.
 */
export function tickArrivals(rng, { dayModifier, location, weather, hour, tickFraction }) {
  const weight = hourWeight(hour) * hourlyWeatherFactor(weather.type, hour);
  const meanGroups = (location.trafficBase * dayModifier * weight * tickFraction) / 9;
  if (meanGroups <= 0) return 0;
  const wholePart = Math.floor(meanGroups);
  const fractional = meanGroups - wholePart;
  const extra = chance(rng, fractional) ? 1 : 0;
  const jitterBonus = meanGroups >= 1 ? Math.round((rng() - 0.5) * meanGroups * 0.5) : 0;
  return Math.max(0, wholePart + extra + jitterBonus);
}

export function randomGroupSize(rng, segment) {
  if (segment === 'parents' || segment === 'tourists') return randInt(rng, 1, 3);
  if (segment === 'commuters') return 1;
  return randInt(rng, 1, 2);
}
