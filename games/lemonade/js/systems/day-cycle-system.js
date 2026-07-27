import { getLocation } from '../data/locations.js';
import { getMenuItem } from '../data/recipes.js';
import { DIFFICULTIES, SEASONS, DAYS_PER_SEASON } from '../utils/constants.js';
import { clamp, roundTo } from '../utils/math.js';
import { ensureDayBriefing } from './briefing-system.js';
import {
  perCupIngredients, costPerCup, qualityScore, unitCost, refreshMenuUnlocks,
} from './recipe-system.js';
import {
  maxCupsFromInventory, consumeIngredient, applyDailySpoilage, autoRestockIfEnabled,
} from './inventory-system.js';
import { getUpgradeEffects } from './upgrade-system.js';
import { getActiveCompetitors } from '../simulation/competitor-model.js';
import { getActiveCampaignReach, tickMarketing } from './marketing-system.js';
import { serviceContributionFromEmployees, dailyWageCost, updateEmployeesEndOfDay } from './employee-system.js';
import { computeDayModifier, estimateDemandRange } from '../simulation/demand-model.js';
import { computeLocalPriceExpectation, priceReaction, buildWaterfall, computeBusinessValue, applyLoanPayment, reputationDelta } from '../simulation/economy-model.js';
import { createDaySession } from '../simulation/day-simulator.js';
import { recordDayFinancials } from './finance-system.js';
import { checkAchievements } from './achievement-system.js';
import { checkMilestones } from './progression-system.js';
import { tickWholesale } from './wholesale-system.js';
import { notify } from './notification-system.js';

export function getPrepEstimate(state) {
  ensureDayBriefing(state);
  const location = getLocation(state.locations.currentId);
  const menuItemId = state.recipes.activeMenuItemId;
  const recipe = state.recipes.current;
  const menuItem = getMenuItem(menuItemId);
  const quality = qualityScore(menuItemId, recipe, state);
  const cupCost = costPerCup(menuItemId, recipe);
  const activeCompetitors = getActiveCompetitors(state.reputation.score);
  const campaignReach = getActiveCampaignReach(state);

  const dayModifier = computeDayModifier({
    location,
    weather: state.today.forecast,
    season: state.calendar.season,
    reputation: state.reputation.score,
    brandAwareness: state.reputation.brandAwareness,
    campaignReach,
    competitorCount: activeCompetitors.length,
    localEventMultiplier: state.today.localActivity.trafficMultiplier,
    menuSeasonality: menuItem.seasonality[state.calendar.season] ?? 1,
  });

  const demandRange = estimateDemandRange(dayModifier, location, location.hours);
  const priceExpectation = computeLocalPriceExpectation({ location, reputation: state.reputation.score, quality });
  const reaction = priceReaction(state.pricing.price, priceExpectation);
  const batchCap = getUpgradeEffects(state).batchSize || 20;
  const maxCupsAffordable = Math.min(maxCupsFromInventory(state, perCupIngredients(menuItemId, recipe)), batchCap);

  return {
    demandRange,
    cupCost,
    priceExpectation,
    reaction,
    maxCupsAffordable,
    batchCap,
    quality,
    potentialRevenue: roundTo(state.production.cupsPlanned * state.pricing.price, 2),
    estimatedMargin: roundTo(state.pricing.price - cupCost, 2),
    estimatedCostToPrepare: roundTo(cupCost * state.production.cupsPlanned, 2),
  };
}

export function prepareBatch(state, cupsRequested) {
  const menuItemId = state.recipes.activeMenuItemId;
  const recipe = state.recipes.current;
  const perCup = perCupIngredients(menuItemId, recipe);
  const batchCap = getUpgradeEffects(state).batchSize || 20;
  const maxCups = Math.min(maxCupsFromInventory(state, perCup), batchCap);
  const actualCups = Math.min(cupsRequested, maxCups);

  if (actualCups <= 0) {
    return { success: false, reason: 'insufficient-ingredients', maxCups };
  }

  for (const [id, amountPerCup] of Object.entries(perCup)) {
    if (amountPerCup > 0) consumeIngredient(state, id, amountPerCup * actualCups);
  }

  state.production.cupsPlanned = actualCups;
  state.pendingPrep = {
    cupsPlanned: actualCups,
    menuItemId,
    recipe: { ...recipe },
    price: state.pricing.price,
  };
  state.ui.currentDayPrepared = true;

  return { success: true, cupsPrepared: actualCups, shortfall: cupsRequested - actualCups };
}

/** Consume more inventory mid-day for the "prepare another batch" live decision. */
export function prepareAdditionalBatch(state, session, cupsRequested) {
  const perCup = perCupIngredients(session.menuItem.id, session.recipe);
  const batchCap = getUpgradeEffects(state).batchSize || 20;
  const maxCups = Math.min(maxCupsFromInventory(state, perCup), batchCap);
  const actualCups = Math.min(cupsRequested, maxCups);
  if (actualCups <= 0) return { success: false, reason: 'insufficient-ingredients' };
  for (const [id, amountPerCup] of Object.entries(perCup)) {
    if (amountPerCup > 0) consumeIngredient(state, id, amountPerCup * actualCups);
  }
  return { success: true, cupsAdded: actualCups };
}

export function startDay(state) {
  if (!state.pendingPrep) return null;
  ensureDayBriefing(state);
  const location = getLocation(state.locations.currentId);
  const menuItem = getMenuItem(state.pendingPrep.menuItemId);
  const quality = qualityScore(state.pendingPrep.menuItemId, state.pendingPrep.recipe, state);
  const effects = getUpgradeEffects(state);
  const activeCompetitors = getActiveCompetitors(state.reputation.score);
  const campaignReach = getActiveCampaignReach(state);
  const empContribution = serviceContributionFromEmployees(state);
  const difficulty = DIFFICULTIES[state.meta.difficulty] || DIFFICULTIES.standard;

  const session = createDaySession({
    day: state.calendar.day,
    location,
    weather: state.today.actualWeather,
    season: state.calendar.season,
    menuItem,
    recipe: state.pendingPrep.recipe,
    price: state.pendingPrep.price,
    quality: clamp(
      quality + empContribution.satisfactionBonus + effects.appealBonus + effects.satisfactionBonus + (effects.prepSpeed - 1) * 0.05,
      0, 1.3
    ),
    reputation: state.reputation.score,
    brandAwareness: state.reputation.brandAwareness,
    campaignReach,
    activeCompetitors,
    competitorAggression: difficulty.competitorAggression,
    cupsAvailable: state.pendingPrep.cupsPlanned,
    serviceSpeedFactor: effects.serviceSpeed * empContribution.speedBonus,
    capacityBonus: effects.capacity,
    waitTolerance: effects.waitTolerance,
    localActivity: state.today.localActivity,
    rngSeed: (state.meta.rngSeed + state.calendar.day * 104729 + 17) >>> 0,
  });

  state.ui.dayPhase = 'live';
  return session;
}

export function finalizeDay(state, session) {
  const cupCost = costPerCup(session.menuItem.id, session.recipe);
  const cupsWasted = Math.max(0, session.cupsAvailable);
  const cupsSold = session.totals.cupsSold;

  const spoiledRaw = applyDailySpoilage(state);
  const spoiledRawValue = Object.entries(spoiledRaw).reduce(
    (sum, [id, qty]) => sum + qty * unitCost(id), 0
  );

  const wages = dailyWageCost(state);
  const rent = getLocation(session.location.id).dailyFee;
  let loanPayment = 0;
  state.finances.loans = state.finances.loans
    .map((loan) => {
      const { updated, payment } = applyLoanPayment(loan);
      loanPayment += payment;
      return updated;
    })
    .filter((loan) => loan.remainingPrincipal > 0.01);

  const marketingNotes = tickMarketing(state);

  const waterfall = buildWaterfall({
    revenue: session.totals.revenue,
    ingredientCost: roundTo(cupCost * cupsSold, 2),
    wages,
    marketing: 0,
    rent,
    wasteCost: roundTo(cupCost * cupsWasted + spoiledRawValue, 2),
    loanPayment,
  });

  let donated = 0;
  if (session.totals.donatePercent) {
    donated = Math.max(0, roundTo(waterfall.netProfit * session.totals.donatePercent, 2));
  }

  const cashDelta = roundTo(
    session.totals.revenue - wages - rent - loanPayment + session.totals.eventCashAdjustments - donated,
    2
  );
  recordDayFinancials(state, waterfall, cashDelta);

  const avgSatisfaction = session.totals.satisfactionCount
    ? session.totals.satisfactionSum / session.totals.satisfactionCount
    : 0.5;
  const repDelta = roundTo(
    reputationDelta({ avgSatisfaction, stockouts: session.totals.lostSales.unavailable }) +
      session.totals.reputationEventDelta,
    2
  );
  state.reputation.score = clamp(roundTo(state.reputation.score + repDelta, 2), 0, 100);
  state.reputation.brandAwareness = clamp(
    state.reputation.brandAwareness + session.totals.awarenessEventDelta, 0, 100
  );

  const stats = state.stats;
  stats.daysCompleted += 1;
  stats.totalCupsSold += cupsSold;
  stats.totalCupsWasted += cupsWasted;
  stats.totalCustomersServed += session.totals.customersServed;
  stats.reputation = state.reputation.score;
  stats.businessValue = computeBusinessValue(state);
  stats.lifetimeProfit = state.finances.lifetimeProfit;
  if (cupsWasted === 0 && session.cupsPreparedTotal > 0) {
    stats.zeroWasteDays += 1;
    stats.zeroWasteStreak += 1;
    stats.soldOutDays += 1;
  } else {
    stats.zeroWasteStreak = 0;
  }
  stats.bestDayCustomers = Math.max(stats.bestDayCustomers, session.totals.customersServed);
  stats.bestDayProfit = Math.max(stats.bestDayProfit, waterfall.netProfit);
  stats.bestDaySatisfaction = Math.max(stats.bestDaySatisfaction, avgSatisfaction);
  if (session.weather.type.includes('rain') && waterfall.netProfit > 0) stats.profitableRainDays += 1;

  const departures = updateEmployeesEndOfDay(state);
  const newMenuItems = refreshMenuUnlocks(state);
  const newAchievements = checkAchievements(state);
  const newMilestones = checkMilestones(state);

  const report = {
    day: state.calendar.day,
    season: state.calendar.season,
    weather: session.weather,
    forecast: state.today.forecast,
    localActivity: state.today.localActivity,
    locationId: session.location.id,
    menuItemId: session.menuItem.id,
    recipe: session.recipe,
    price: session.price,
    waterfall,
    cupsPrepared: session.cupsPreparedTotal,
    cupsSold,
    cupsWasted,
    customersArrived: session.totals.customersArrived,
    customersServed: session.totals.customersServed,
    lostSales: session.totals.lostSales,
    avgSatisfaction,
    reputationDelta: repDelta,
    reputationAfter: state.reputation.score,
    segmentSales: session.totals.segmentSales,
    departures,
    newAchievements: newAchievements.map((a) => a.id),
    newMilestones: newMilestones.map((m) => m.id),
    newMenuItems: newMenuItems.map((m) => m.id),
    marketingNotes,
    donated,
    feed: session.feed,
  };

  state.history.days.push(report);
  if (state.history.days.length > 200) state.history.days.shift();

  state.ui.dayPhase = 'results';
  state.ui.currentDayPrepared = false;
  state.pendingPrep = null;

  return report;
}

export function advanceToNextDay(state) {
  state.calendar.day += 1;
  state.calendar.seasonDay += 1;
  if (state.calendar.seasonDay > DAYS_PER_SEASON) {
    state.stats.seasonsCompleted[state.calendar.season] =
      (state.stats.seasonsCompleted[state.calendar.season] || 0) + 1;
    const idx = SEASONS.indexOf(state.calendar.season);
    state.calendar.season = SEASONS[(idx + 1) % SEASONS.length];
    state.calendar.seasonDay = 1;
  }
  const { failedClients } = tickWholesale(state);
  for (const clientName of failedClients) {
    notify(`Missed the delivery deadline for ${clientName} — contract penalty applied.`, 'error');
  }

  const restocked = autoRestockIfEnabled(state);
  if (restocked.length) {
    notify(`Automated Ordering restocked ${restocked.map((r) => r.name).join(', ')}.`, 'info');
  }

  state.ui.dayPhase = 'briefing';
  state.today = null;
}
