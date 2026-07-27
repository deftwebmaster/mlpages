import { MENU_ITEMS, getMenuItem } from '../data/recipes.js';
import { getIngredient } from '../data/ingredients.js';
import { getUpgradeEffects } from './upgrade-system.js';
import { clamp, roundTo } from '../utils/math.js';

export function getRecipeDescriptor({ lemon, sugar, ice }) {
  if (ice >= 4.5) return 'Over-Iced';
  if (lemon >= 4 && sugar <= 2) return 'Tart';
  if (sugar >= 4 && lemon <= 2) return 'Sweet';
  if (lemon >= 4 && sugar >= 4) return 'Strong';
  if (lemon <= 2 && sugar <= 2) return 'Watery';
  if (ice >= 4 && lemon >= 3) return 'Refreshing';
  return 'Balanced';
}

/** Ingredient quantities needed for one cup, given the player's slider values. */
export function perCupIngredients(menuItemId, recipe) {
  const menuItem = getMenuItem(menuItemId);
  const result = {};
  for (const [id, base] of Object.entries(menuItem.baseIngredients)) {
    if (id === 'lemons') result[id] = roundTo(base * (recipe.lemon / 3), 4);
    else if (id === 'sugar') result[id] = roundTo(base * (recipe.sugar / 3), 4);
    else if (id === 'ice') result[id] = roundTo(base * (recipe.ice / 3), 4);
    else result[id] = base;
  }
  return result;
}

export function unitCost(ingredientId) {
  const ingredient = getIngredient(ingredientId);
  if (!ingredient) return 0;
  return ingredient.packPrice / ingredient.packSize;
}

export function costPerCup(menuItemId, recipe) {
  const perCup = perCupIngredients(menuItemId, recipe);
  return roundTo(
    Object.entries(perCup).reduce((sum, [id, qty]) => sum + qty * unitCost(id), 0),
    3
  );
}

export function qualityScore(menuItemId, recipe, state) {
  const menuItem = getMenuItem(menuItemId);
  const effects = getUpgradeEffects(state);
  const perCup = perCupIngredients(menuItemId, recipe);
  let weightedQuality = 0;
  let totalWeight = 0;
  for (const id of Object.keys(perCup)) {
    const entry = state.inventory[id];
    const avgQuality = entry?.batches?.length
      ? entry.batches.reduce((s, b) => s + (b.quality || 1), 0) / entry.batches.length
      : 1;
    weightedQuality += avgQuality * perCup[id];
    totalWeight += perCup[id];
  }
  const baseQuality = totalWeight > 0 ? weightedQuality / totalWeight : 1;
  // Baseline ingredients (quality level 1, no upgrades) land exactly on the
  // neutral 0.75 mark so a brand-new stand reads as "fair", not "cheap".
  const normalized = clamp((baseQuality - 1) * 0.4 + 0.75, 0.2, 1);
  return clamp(normalized + effects.qualityBonus, 0, 1);
}

export function getAvailableMenuItems(state) {
  return MENU_ITEMS.filter((item) => {
    if (item.unlocked) return true;
    if (state.recipes.unlockedMenuItems.includes(item.id)) return true;
    if (!item.unlockRequirement) return false;
    return state.reputation.score >= (item.unlockRequirement.reputation || 0);
  });
}

/** Call at day-end to add any newly-qualifying menu items to the unlocked list. */
export function refreshMenuUnlocks(state) {
  const newly = [];
  for (const item of MENU_ITEMS) {
    if (state.recipes.unlockedMenuItems.includes(item.id)) continue;
    if (item.unlockRequirement && state.reputation.score >= (item.unlockRequirement.reputation || 0)) {
      state.recipes.unlockedMenuItems.push(item.id);
      newly.push(item);
    }
  }
  return newly;
}

export function saveRecipe(state, name, menuItemId, recipe) {
  const id = `recipe-${Date.now()}`;
  state.recipes.saved.push({ id, name, menuItemId, ...recipe });
  return id;
}

export function deleteSavedRecipe(state, id) {
  state.recipes.saved = state.recipes.saved.filter((r) => r.id !== id);
}

export function setActiveMenuItem(state, menuItemId) {
  state.recipes.activeMenuItemId = menuItemId;
}

export function setCurrentRecipe(state, recipe) {
  state.recipes.current = { ...state.recipes.current, ...recipe };
}
