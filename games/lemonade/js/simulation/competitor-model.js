import { COMPETITORS } from '../data/competitors.js';

/** Competitors become locally relevant once your business reaches their scale. */
export function getActiveCompetitors(reputation) {
  return COMPETITORS.filter((c) => reputation >= c.introReputation);
}

export function competitorPressure(activeCompetitors, aggression = 1) {
  return activeCompetitors.length * 0.07 * aggression;
}

export function strongestCompetitorFor(segment, activeCompetitors) {
  return activeCompetitors.find((c) => c.strongSegments.includes(segment)) || null;
}
