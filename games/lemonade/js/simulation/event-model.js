import { pickWeighted, chance, pick } from '../utils/random.js';
import { EVENTS } from '../data/events.js';

// Flavor text + traffic modifier shown in the morning briefing. Distinct from
// the mid-day decision events below.
const LOCAL_ACTIVITIES = [
  { id: 'quiet-day', label: null, trafficMultiplier: 1, weight: 6 },
  { id: 'soccer-tournament', label: 'Youth soccer tournament at Riverside Park', trafficMultiplier: 1.25, weight: 1,
    segmentBoost: { children: 0.15, parents: 0.15 } },
  { id: 'farmers-market-day', label: 'Weekend farmers market downtown', trafficMultiplier: 1.15, weight: 1 },
  { id: 'street-fair', label: 'Street fair a few blocks over', trafficMultiplier: 1.3, weight: 0.7 },
  { id: 'school-day', label: 'Regular school day nearby', trafficMultiplier: 0.95, weight: 1 },
  { id: 'holiday-weekend', label: 'Holiday weekend crowds', trafficMultiplier: 1.2, weight: 0.6 },
  { id: 'construction-nearby', label: 'Minor road construction nearby', trafficMultiplier: 0.88, weight: 0.6 },
  { id: 'block-party', label: 'Neighborhood block party today', trafficMultiplier: 1.2, weight: 0.5,
    segmentBoost: { parents: 0.2 } },
];

export function rollLocalActivity(rng) {
  return pickWeighted(rng, LOCAL_ACTIVITIES.map((a) => ({ value: a, weight: a.weight })));
}

/** ~35% chance of a mid-day event on any given day, filtered by eligibility. */
export function rollDailyEvent(rng, { day, hasEmployees, hasCompetitors, hasElectricEquipment }) {
  if (!chance(rng, 0.35)) return null;
  const eligible = EVENTS.filter((event) => {
    const t = event.trigger;
    if (day < t.minDay) return false;
    if (t.requiresEmployees && !hasEmployees) return false;
    if (t.requiresCompetitors && !hasCompetitors) return false;
    if (t.requiresElectricEquipment && !hasElectricEquipment) return false;
    return true;
  });
  if (!eligible.length) return null;
  return pickWeighted(rng, eligible.map((e) => ({ value: e, weight: e.trigger.weight })));
}

/** Merge a chosen event effect into the running day-context multipliers. */
export function applyEventChoice(event, choiceId) {
  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) throw new Error(`Unknown choice ${choiceId} for event ${event.id}`);
  return choice;
}

export function pickEventTick(rng, ticksPerDay) {
  // Fire the event sometime after the morning ramp-up, before the final hour.
  return Math.max(2, Math.min(ticksPerDay - 3, Math.floor(rng() * (ticksPerDay - 5)) + 3));
}
