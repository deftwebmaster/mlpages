import { LOCATIONS, getLocation } from '../data/locations.js';
import { spendCash, addCash } from './finance-system.js';
import { roundTo, clamp } from '../utils/math.js';

export function getAvailableLocations(state) {
  return LOCATIONS.filter((loc) => {
    if (state.locations.ownedIds.includes(loc.id)) return false;
    const req = loc.unlockRequirement || {};
    return state.reputation.score >= (req.reputation || 0) && state.finances.cash >= (req.cash || 0);
  });
}

export function isLocationUnlocked(state, locationId) {
  const location = getLocation(locationId);
  if (!location) return false;
  if (location.id === 'driveway') return true;
  const req = location.unlockRequirement || {};
  return state.reputation.score >= (req.reputation || 0) && state.finances.cash >= (req.cash || 0);
}

export function acquireLocation(state, locationId) {
  const location = getLocation(locationId);
  if (!location) return { success: false, reason: 'not-found' };
  if (state.locations.ownedIds.includes(locationId)) return { success: false, reason: 'already-owned' };
  if (!isLocationUnlocked(state, locationId)) return { success: false, reason: 'locked' };

  state.locations.ownedIds.push(locationId);
  state.locations.perLocation[locationId] = { managementMode: 'personal', hours: location.hours };
  state.stats.locationsOwned = state.locations.ownedIds.length;
  return { success: true };
}

export function setCurrentLocation(state, locationId) {
  if (!state.locations.ownedIds.includes(locationId)) return { success: false, reason: 'not-owned' };
  state.locations.currentId = locationId;
  return { success: true };
}

export function setManagementMode(state, locationId, mode) {
  if (!state.locations.perLocation[locationId]) return;
  state.locations.perLocation[locationId].managementMode = mode;
}

export function payLocationFee(state, locationId) {
  const location = getLocation(locationId);
  if (!location || !location.dailyFee) return 0;
  spendCash(state, location.dailyFee);
  return location.dailyFee;
}

/** Lightweight automatic simulation for locations the player isn't personally running today. */
export function simulateEmployeeManagedLocation(rng, state, locationId) {
  const location = getLocation(locationId);
  if (!location) return null;
  const fee = location.dailyFee;
  const baseTraffic = location.trafficBase * 6;
  const repFactor = clamp(0.5 + state.reputation.score / 150, 0.4, 1.3);
  const staffFactor = 0.75; // employee-run locations underperform a personally-run stand somewhat
  const avgPrice = (location.priceExpectation[0] + location.priceExpectation[1]) / 2;
  const cupsSold = Math.round(baseTraffic * repFactor * staffFactor * (0.5 + rng() * 0.4));
  const revenue = roundTo(cupsSold * avgPrice, 2);
  const cost = roundTo(cupsSold * avgPrice * 0.35 + fee, 2);
  const profit = roundTo(revenue - cost, 2);
  addCash(state, profit, { trackRevenue: false });
  return { locationId, cupsSold, revenue, cost, profit };
}
