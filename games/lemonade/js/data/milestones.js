// Milestones gate the introduction of new systems so the UI never overwhelms
// a new player. `check(stats)` mirrors achievements; `unlocks` is a list of
// feature flag strings read by progression-system.js / router guards.

export const MILESTONES = [
  { id: 'milestone-marketing', name: 'Open for Business', description: 'Complete Day 3.',
    check: (s) => s.daysCompleted >= 3, unlocks: ['marketing'] },
  { id: 'milestone-upgrades', name: 'Building Momentum', description: 'Earn $100 lifetime profit.',
    check: (s) => s.lifetimeProfit >= 100, unlocks: ['upgrades'] },
  { id: 'milestone-park', name: 'Making a Name', description: 'Reach 15 reputation.',
    check: (s) => s.reputation >= 15, unlocks: ['location-community-park'] },
  { id: 'milestone-employees', name: 'Growing Fast', description: 'Sell 250 total cups.',
    check: (s) => s.totalCupsSold >= 250, unlocks: ['employees'] },
  { id: 'milestone-second-location', name: 'Time to Expand', description: 'Reach a $2,500 business value.',
    check: (s) => s.businessValue >= 2500, unlocks: ['second-location'] },
  { id: 'milestone-bottling', name: 'Scaling Up', description: 'Reach 40 reputation.',
    check: (s) => s.reputation >= 40, unlocks: ['bottling'] },
  { id: 'milestone-regional', name: 'Regional Player', description: 'Operate three locations.',
    check: (s) => s.locationsOwned >= 3, unlocks: ['regional-expansion'] },
];

export function getMilestone(id) {
  return MILESTONES.find((m) => m.id === id);
}
