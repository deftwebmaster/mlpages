import { BOTTLE_SIZES, getBottleSize } from '../data/bottles.js';
import { CONTRACT_CLIENTS } from '../data/contracts.js';
import { perCupIngredients, qualityScore } from './recipe-system.js';
import { maxCupsFromInventory, consumeIngredient } from './inventory-system.js';
import { spendCash, canAfford, addCash } from './finance-system.js';
import { CUP_SERVING_OZ } from '../utils/constants.js';
import { roundTo, clamp } from '../utils/math.js';
import { randInt, randRange, pick, chance } from '../utils/random.js';
import { notify } from './notification-system.js';

const PRODUCTION_FACILITY_ID = 'production-facility';

export function isBottlingOperational(state) {
  return state.locations.ownedIds.includes(PRODUCTION_FACILITY_ID);
}

export function getAvailableBottleSizes(state) {
  return BOTTLE_SIZES.filter((b) => !b.unlockRequirement || state.reputation.score >= b.unlockRequirement.reputation);
}

/** Ingredient amounts needed for one bottle of the given size, at the current recipe. */
function perBottleIngredients(state, bottleId) {
  const bottle = getBottleSize(bottleId);
  const scale = bottle.ozSize / CUP_SERVING_OZ;
  const perCup = perCupIngredients(state.recipes.activeMenuItemId, state.recipes.current);
  return Object.fromEntries(Object.entries(perCup).map(([id, amount]) => [id, amount * scale]));
}

export function maxBottlesFromInventory(state, bottleId) {
  return maxCupsFromInventory(state, perBottleIngredients(state, bottleId));
}

export function produceBottles(state, bottleId, quantityRequested) {
  const bottle = getBottleSize(bottleId);
  if (!bottle) return { success: false, reason: 'not-found' };

  const maxQty = maxBottlesFromInventory(state, bottleId);
  const actualQty = Math.min(quantityRequested, maxQty);
  if (actualQty <= 0) return { success: false, reason: 'insufficient-ingredients', maxQty };

  const packagingTotal = roundTo(bottle.packagingCost * actualQty, 2);
  if (!canAfford(state, packagingTotal)) return { success: false, reason: 'insufficient-funds', packagingTotal };

  const perBottle = perBottleIngredients(state, bottleId);
  for (const [id, amount] of Object.entries(perBottle)) {
    if (amount > 0) consumeIngredient(state, id, amount * actualQty);
  }
  spendCash(state, packagingTotal);

  if (!state.wholesale.bottleInventory[bottleId]) {
    state.wholesale.bottleInventory[bottleId] = { quantity: 0, batches: [] };
  }
  const entry = state.wholesale.bottleInventory[bottleId];
  entry.quantity += actualQty;
  entry.batches.push({ quantity: actualQty, producedDay: state.calendar.day });

  return { success: true, quantityProduced: actualQty, cost: packagingTotal, shortfall: quantityRequested - actualQty };
}

function consumeBottles(state, bottleId, amount) {
  const entry = state.wholesale.bottleInventory[bottleId];
  if (!entry || amount <= 0) return 0;
  let remaining = amount;
  let consumed = 0;
  entry.batches.sort((a, b) => a.producedDay - b.producedDay);
  for (const batch of entry.batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.quantity, remaining);
    batch.quantity -= take;
    remaining -= take;
    consumed += take;
  }
  entry.batches = entry.batches.filter((b) => b.quantity > 0.0001);
  entry.quantity = Math.max(0, roundTo(entry.quantity - consumed, 3));
  return consumed;
}

/** Day-end: bottles past their shelf life are written off. Returns spoiled counts by bottleId. */
export function applyBottleSpoilage(state) {
  const spoiled = {};
  for (const [bottleId, entry] of Object.entries(state.wholesale.bottleInventory)) {
    const bottle = getBottleSize(bottleId);
    if (!bottle) continue;
    let lost = 0;
    entry.batches = entry.batches.filter((batch) => {
      const age = state.calendar.day - batch.producedDay;
      if (age >= bottle.shelfLifeDays) {
        lost += batch.quantity;
        return false;
      }
      return true;
    });
    if (lost > 0) {
      spoiled[bottleId] = lost;
      entry.quantity = Math.max(0, roundTo(entry.quantity - lost, 3));
    }
  }
  return spoiled;
}

export function refreshContractOffers(state, rng = Math.random, count = 3, { replace = true } = {}) {
  const eligible = CONTRACT_CLIENTS.filter((c) => state.reputation.score >= c.minReputation);
  const offers = replace ? [] : [...state.wholesale.offers];
  for (let i = 0; i < count && eligible.length; i += 1) {
    const client = pick(rng, eligible);
    const quantity = randInt(rng, client.quantityRange[0], client.quantityRange[1]);
    const pricePerUnit = roundTo(randRange(rng, client.pricePerUnitRange[0], client.pricePerUnitRange[1]), 2);
    offers.push({
      id: `offer-${state.calendar.day}-${i}-${Math.round(rng() * 1e6)}`,
      clientId: client.id,
      clientName: client.name,
      quantity,
      pricePerUnit,
      deadlineDays: client.deadlineDays,
      qualityRequirement: client.qualityRequirement,
      penalty: client.penalty,
      reputationReward: client.reputationReward,
    });
  }
  state.wholesale.offers = offers;
}

export function acceptContract(state, offerId, bottleId) {
  const offer = state.wholesale.offers.find((o) => o.id === offerId);
  if (!offer) return { success: false, reason: 'not-found' };
  state.wholesale.activeContracts.push({
    ...offer,
    bottleId,
    fulfilled: 0,
    daysRemaining: offer.deadlineDays,
    acceptedDay: state.calendar.day,
  });
  state.wholesale.offers = state.wholesale.offers.filter((o) => o.id !== offerId);
  return { success: true };
}

export function deliverContract(state, contractId, quantityRequested) {
  const contract = state.wholesale.activeContracts.find((c) => c.id === contractId);
  if (!contract) return { success: false, reason: 'not-found' };

  const quality = qualityScore(state.recipes.activeMenuItemId, state.recipes.current, state);
  if (quality < contract.qualityRequirement) {
    return { success: false, reason: 'quality-too-low', quality };
  }

  const available = state.wholesale.bottleInventory[contract.bottleId]?.quantity || 0;
  const remaining = contract.quantity - contract.fulfilled;
  const actualQty = Math.min(quantityRequested, available, remaining);
  if (actualQty <= 0) return { success: false, reason: 'nothing-to-deliver' };

  consumeBottles(state, contract.bottleId, actualQty);
  const payment = roundTo(actualQty * contract.pricePerUnit, 2);
  addCash(state, payment, { trackRevenue: true });
  state.finances.lifetimeRevenue = roundTo(state.finances.lifetimeRevenue + payment, 2);
  contract.fulfilled = roundTo(contract.fulfilled + actualQty, 3);

  let completed = false;
  if (contract.fulfilled >= contract.quantity) {
    completed = true;
    state.reputation.score = clamp(roundTo(state.reputation.score + contract.reputationReward, 2), 0, 100);
    state.stats.contractsCompleted += 1;
    state.wholesale.activeContracts = state.wholesale.activeContracts.filter((c) => c.id !== contractId);
    state.wholesale.completedContracts.push({ ...contract, completedDay: state.calendar.day, outcome: 'fulfilled' });
    notify(`Contract fulfilled: ${contract.clientName}`, 'achievement');
  }

  return { success: true, delivered: actualQty, payment, completed };
}

/** Day-end housekeeping: age bottle inventory, expire overdue contracts, top up offers. */
export function tickWholesale(state, rng = Math.random) {
  const spoiled = applyBottleSpoilage(state);
  const failedClients = [];

  const stillActive = [];
  for (const contract of state.wholesale.activeContracts) {
    contract.daysRemaining -= 1;
    if (contract.daysRemaining <= 0 && contract.fulfilled < contract.quantity) {
      spendCash(state, contract.penalty, { trackExpense: true });
      state.reputation.score = clamp(roundTo(state.reputation.score - 1, 2), 0, 100);
      state.wholesale.completedContracts = [
        ...state.wholesale.completedContracts,
        { ...contract, completedDay: state.calendar.day, outcome: 'failed' },
      ];
      failedClients.push(contract.clientName);
    } else {
      stillActive.push(contract);
    }
  }
  state.wholesale.activeContracts = stillActive;

  if (isBottlingOperational(state) && state.wholesale.offers.length < 3 && chance(rng, 0.6)) {
    refreshContractOffers(state, rng, 3 - state.wholesale.offers.length, { replace: false });
  }

  return { spoiled, failedClients };
}
