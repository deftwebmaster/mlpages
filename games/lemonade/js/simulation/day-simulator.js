import { createRng, chance } from '../utils/random.js';
import { clamp, roundTo } from '../utils/math.js';
import { DAY_START_HOUR, DAY_END_HOUR, TICK_MINUTES, TICKS_PER_DAY } from '../utils/constants.js';
import { computeDayModifier, tickArrivals, randomGroupSize } from './demand-model.js';
import { generateCustomer, evaluatePurchase, expectedPriceFor, pickSegment } from './customer-model.js';
import { strongestCompetitorFor } from './competitor-model.js';
import { formatHour } from '../utils/format.js';

/**
 * Build a fresh live-day session. All the slow-changing modifiers (weather,
 * reputation, awareness, competition, local event, season) are folded into
 * `dayModifierBase` once up front; only fast-changing things (price, cups
 * remaining, wait queue) are recomputed per tick.
 */
export function createDaySession({
  day, location, weather, season, menuItem, recipe, price, quality,
  reputation, brandAwareness, campaignReach, activeCompetitors, competitorAggression,
  cupsAvailable, serviceSpeedFactor, capacityBonus = 0, waitTolerance = 0, localActivity, rngSeed,
}) {
  const hours = location.weekendOnly ? location.hours : (location.hours || [DAY_START_HOUR, DAY_END_HOUR]);
  const dayModifierBase = computeDayModifier({
    location, weather, season, reputation, brandAwareness, campaignReach,
    competitorCount: activeCompetitors.length,
    localEventMultiplier: localActivity?.trafficMultiplier || 1,
    menuSeasonality: menuItem.seasonality[season] ?? 1,
  });

  return {
    day, location, weather, season, menuItem,
    recipe: { ...recipe },
    price,
    quality,
    reputation,
    activeCompetitors,
    dayModifier: dayModifierBase,
    hours,
    ticksPerDay: Math.round(((hours[1] - hours[0]) * 60) / TICK_MINUTES),
    tickIndex: 0,
    cupsAvailable,
    cupsPreparedTotal: cupsAvailable,
    serviceSpeedFactor: serviceSpeedFactor || 1,
    capacityBonus,
    waitTolerance,
    closeEarly: null,
    rng: createRng(rngSeed),
    ended: false,
    totals: {
      revenue: 0,
      cupsSold: 0,
      customersArrived: 0,
      customersServed: 0,
      satisfactionSum: 0,
      satisfactionCount: 0,
      lostSales: { price: 0, wait: 0, unavailable: 0, other: 0, competitor: 0 },
      segmentSales: {},
      eventCashAdjustments: 0,
      reputationEventDelta: 0,
      awarenessEventDelta: 0,
      donatedAmount: 0,
    },
    feed: [],
    waitQueueTicks: 0,
  };
}

function pushFeed(session, type, text) {
  session.feed.push({ tick: session.tickIndex, hour: currentHour(session), type, text });
  if (session.feed.length > 60) session.feed.shift();
}

function currentHour(session) {
  return session.hours[0] + (session.tickIndex * TICK_MINUTES) / 60;
}

/** Advance the simulation by one tick. Returns a summary of what happened. */
export function simulateTick(session) {
  if (session.ended) return { ended: true };
  const hour = currentHour(session);
  if (session.closeEarly !== null && hour >= session.closeEarly) {
    session.ended = true;
    return { ended: true, hour };
  }
  if (session.tickIndex >= session.ticksPerDay) {
    session.ended = true;
    return { ended: true, hour };
  }

  const rng = session.rng;
  const arrivals = tickArrivals(rng, {
    dayModifier: session.dayModifier,
    location: session.location,
    weather: session.weather,
    hour,
    tickFraction: TICK_MINUTES / 60,
  });

  const tickEvents = [];
  for (let g = 0; g < arrivals; g += 1) {
    const segment = pickSegment(rng, session.location.customerMix);
    const groupSize = randomGroupSize(rng, segment);
    for (let p = 0; p < groupSize; p += 1) {
      session.totals.customersArrived += 1;
      const customer = generateCustomer(rng, segment);
      const expectedPrice = expectedPriceFor(segment, session.location.priceExpectation);
      const available = session.cupsAvailable > 0;
      const waitTicks = Math.min(customer.patience, Math.round(session.waitQueueTicks));
      const result = evaluatePurchase(rng, {
        customer,
        recipe: session.recipe,
        menuAppeal: session.menuItem.appeal[segment] ?? 1,
        price: session.price,
        expectedPrice,
        quality: session.quality,
        reputation: session.reputation,
        waitTicks,
        awarenessBoost: 0,
        available,
        speedFactor: session.serviceSpeedFactor,
      });

      if (result.outcome.startsWith('purchased')) {
        session.cupsAvailable -= 1;
        session.totals.cupsSold += 1;
        session.totals.revenue = roundTo(session.totals.revenue + session.price, 2);
        session.totals.customersServed += 1;
        session.totals.satisfactionSum += result.satisfaction;
        session.totals.satisfactionCount += 1;
        session.totals.segmentSales[segment] = (session.totals.segmentSales[segment] || 0) + 1;
        tickEvents.push({ type: result.outcome, segment });
      } else {
        const competitor = strongestCompetitorFor(segment, session.activeCompetitors);
        if (result.outcome === 'unavailable') {
          session.totals.lostSales.unavailable += 1;
        } else if (result.outcome === 'left-wait') {
          session.totals.lostSales.wait += 1;
        } else if (result.outcome === 'left-price') {
          if (competitor && chance(rng, 0.45)) session.totals.lostSales.competitor += 1;
          else session.totals.lostSales.price += 1;
        } else {
          if (competitor && chance(rng, 0.3)) session.totals.lostSales.competitor += 1;
          else session.totals.lostSales.other += 1;
        }
        tickEvents.push({ type: result.outcome, segment });
      }
    }
  }

  // Queue pressure grows when cups run out or the stand is swamped, easing off
  // otherwise. Stand/service capacity upgrades raise how much traffic a rush
  // can absorb before a line forms; waitTolerance (self-service shelf, etc.)
  // slows how fast pressure builds and speeds how fast it clears.
  const overloadThreshold = 3 + Math.floor(session.capacityBonus / 25);
  const overloaded = arrivals > overloadThreshold || session.cupsAvailable <= 0;
  const growthStep = Math.max(0.4, 1 - session.waitTolerance * 3);
  const decayStep = 0.5 + session.waitTolerance * 3;
  session.waitQueueTicks = overloaded
    ? Math.min(5, session.waitQueueTicks + growthStep)
    : Math.max(0, session.waitQueueTicks - decayStep);

  if (arrivals > 0) {
    const sold = tickEvents.filter((e) => e.type.startsWith('purchased')).length;
    if (session.cupsAvailable <= 0 && session.cupsPreparedTotal > 0) {
      pushFeed(session, 'stockout', `Sold out at ${formatHour(hour)}!`);
    } else if (sold > 0) {
      pushFeed(session, 'sale', `${sold} cup${sold > 1 ? 's' : ''} sold around ${formatHour(hour)}.`);
    }
  }

  session.tickIndex += 1;
  if (session.tickIndex >= session.ticksPerDay) session.ended = true;

  return {
    ended: session.ended,
    hour,
    arrivals,
    tickEvents,
    cupsAvailable: session.cupsAvailable,
    revenue: session.totals.revenue,
    cupsSold: session.totals.cupsSold,
  };
}

/** Apply the chosen effects of a fired random event to the running session. */
export function applyEventEffectsToSession(session, choice) {
  if (choice.trafficMultiplier) session.dayModifier *= choice.trafficMultiplier;
  if (choice.qualityMultiplier) session.quality = clamp(session.quality * choice.qualityMultiplier, 0, 1.5);
  if (choice.productionMultiplier) {
    session.cupsAvailable = Math.max(0, Math.round(session.cupsAvailable * choice.productionMultiplier));
  }
  if (choice.priceCapMultiplier) session.price = roundTo(session.price * choice.priceCapMultiplier, 2);
  if (choice.serviceSpeedMultiplier) session.serviceSpeedFactor *= choice.serviceSpeedMultiplier;
  if (typeof choice.closeEarlyHour === 'number') {
    session.closeEarly = session.hours[1] - choice.closeEarlyHour;
  }
  if (choice.cashDelta) session.totals.eventCashAdjustments += choice.cashDelta;
  if (choice.reputationDelta) session.totals.reputationEventDelta += choice.reputationDelta;
  if (choice.awarenessDelta) session.totals.awarenessEventDelta += choice.awarenessDelta;
  if (choice.donatePercent) session.totals.donatePercent = choice.donatePercent;
  pushFeed(session, 'event', choice.outcome);
}

export function addPreparedCups(session, extraCups) {
  session.cupsAvailable += extraCups;
  session.cupsPreparedTotal += extraCups;
}

export function getSessionProgress(session) {
  return clamp(session.tickIndex / session.ticksPerDay, 0, 1);
}

export { TICKS_PER_DAY };
