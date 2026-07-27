import { getIngredient } from '../data/ingredients.js';
import { getSupplier } from '../data/suppliers.js';
import { getUpgradeEffects } from './upgrade-system.js';
import { spendCash, canAfford } from './finance-system.js';
import { roundTo } from '../utils/math.js';

const BASE_STORAGE_CAPACITY = 60;

export function getStorageCapacity(state) {
  return BASE_STORAGE_CAPACITY + getUpgradeEffects(state).storageCapacity;
}

export function getStorageUsed(state) {
  return Object.entries(state.inventory).reduce((sum, [id, item]) => {
    const ingredient = getIngredient(id);
    return sum + item.quantity * (ingredient?.storagePerUnit || 0.2);
  }, 0);
}

export function purchaseIngredient(state, ingredientId, packs, supplierId = 'corner-grocery') {
  const ingredient = getIngredient(ingredientId);
  if (!ingredient) throw new Error(`Unknown ingredient: ${ingredientId}`);
  const supplier = getSupplier(supplierId) || getSupplier('corner-grocery');
  const effectivePacks = Math.max(packs, supplier.minOrderPacks);
  const unitPrice = ingredient.packPrice * supplier.priceMultiplier;
  const totalCost = roundTo(unitPrice * effectivePacks, 2);

  if (!canAfford(state, totalCost)) {
    return { success: false, reason: 'insufficient-funds', cost: totalCost };
  }

  spendCash(state, totalCost);
  const quantity = ingredient.packSize * effectivePacks;

  if (!state.inventory[ingredientId]) {
    state.inventory[ingredientId] = { quantity: 0, batches: [] };
  }
  const entry = state.inventory[ingredientId];
  entry.quantity += quantity;
  entry.batches.push({
    quantity,
    purchasedDay: state.calendar.day,
    shelfLifeDays: ingredient.shelfLifeDays,
    quality: ingredient.quality + supplier.qualityBonus,
  });

  if (!state.unlockedIngredients.includes(ingredientId)) {
    state.unlockedIngredients.push(ingredientId);
  }

  return { success: true, cost: totalCost, quantityAdded: quantity };
}

/** FIFO consumption across batches; returns actual quantity consumed (may be less if short). */
export function consumeIngredient(state, ingredientId, amount) {
  const entry = state.inventory[ingredientId];
  if (!entry || amount <= 0) return 0;
  let remaining = amount;
  let consumed = 0;
  entry.batches.sort((a, b) => a.purchasedDay - b.purchasedDay);
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

export function hasEnoughForRecipe(state, ingredientAmounts) {
  return Object.entries(ingredientAmounts).every(([id, amount]) => (state.inventory[id]?.quantity || 0) >= amount);
}

export function maxCupsFromInventory(state, perCupIngredients) {
  let max = Infinity;
  for (const [id, amountPerCup] of Object.entries(perCupIngredients)) {
    if (amountPerCup <= 0) continue;
    const available = state.inventory[id]?.quantity || 0;
    max = Math.min(max, Math.floor(available / amountPerCup));
  }
  return Number.isFinite(max) ? max : 0;
}

/** Ages batches by one day and drops anything past its shelf life. Ice melts
 * fully each night unless cooling upgrades grant retention. */
export function applyDailySpoilage(state) {
  const effects = getUpgradeEffects(state);
  const spoiledSummary = {};

  for (const [id, entry] of Object.entries(state.inventory)) {
    const ingredient = getIngredient(id);
    if (!ingredient) continue;

    if (id === 'ice') {
      const retained = Math.round(entry.quantity * effects.iceRetention);
      const melted = entry.quantity - retained;
      if (melted > 0) spoiledSummary[id] = (spoiledSummary[id] || 0) + melted;
      entry.quantity = retained;
      entry.batches = retained > 0 ? [{ quantity: retained, purchasedDay: state.calendar.day, shelfLifeDays: 1 }] : [];
      continue;
    }

    if (ingredient.shelfLifeDays === Infinity) continue;

    const adjustedShelfLife = ingredient.shelfLifeDays * (1 + effects.spoilageReduction);
    let spoiled = 0;
    entry.batches = entry.batches.filter((batch) => {
      const age = state.calendar.day - batch.purchasedDay;
      if (age >= adjustedShelfLife) {
        spoiled += batch.quantity;
        return false;
      }
      return true;
    });
    if (spoiled > 0) {
      spoiledSummary[id] = (spoiledSummary[id] || 0) + spoiled;
      entry.quantity = Math.max(0, roundTo(entry.quantity - spoiled, 3));
    }
  }
  return spoiledSummary;
}

const AUTO_RESTOCK_IDS = ['lemons', 'sugar', 'water', 'ice', 'cups'];

/**
 * Automated Ordering (business upgrade) quietly tops up the essentials
 * whenever they run low, so a late-game player isn't stuck micromanaging the
 * same five ingredients they mastered on day one. Returns the ingredients
 * (with quantity added) it restocked, if any.
 */
export function autoRestockIfEnabled(state) {
  if (!getUpgradeEffects(state).autoRestock) return [];
  const restocked = [];
  for (const id of AUTO_RESTOCK_IDS) {
    if (!state.unlockedIngredients.includes(id)) continue;
    const ingredient = getIngredient(id);
    const entry = state.inventory[id];
    const lowThreshold = ingredient.packSize * 0.5;
    if ((entry?.quantity || 0) >= lowThreshold) continue;
    const result = purchaseIngredient(state, id, 1);
    if (result.success) restocked.push({ id, name: ingredient.name, quantityAdded: result.quantityAdded });
  }
  return restocked;
}

export function getFreshnessLabel(ingredientId, state) {
  const entry = state.inventory[ingredientId];
  const ingredient = getIngredient(ingredientId);
  if (!entry || !entry.batches.length) return 'none';
  if (ingredient.shelfLifeDays === Infinity) return 'fresh';
  const effects = getUpgradeEffects(state);
  const adjustedShelfLife = ingredient.shelfLifeDays * (1 + effects.spoilageReduction);
  const oldestAge = Math.max(...entry.batches.map((b) => state.calendar.day - b.purchasedDay));
  const ratio = oldestAge / adjustedShelfLife;
  if (ratio >= 1) return 'spoiled';
  if (ratio >= 0.75) return 'use-soon';
  if (ratio >= 0.4) return 'aging';
  return 'fresh';
}
