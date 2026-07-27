// Employee role templates and traits used when generating job applicants.

export const EMPLOYEE_ROLES = [
  { id: 'server', name: 'Server', baseWage: 9, unlockRequirement: { cupsSold: 250 },
    description: 'Serves customers, boosts service speed.' },
  { id: 'prep-worker', name: 'Prep Worker', baseWage: 8, unlockRequirement: { cupsSold: 250 },
    description: 'Preps batches faster, reduces waste.' },
  { id: 'cashier', name: 'Cashier', baseWage: 8, unlockRequirement: { cupsSold: 400 },
    description: 'Speeds up checkout, improves accuracy.' },
  { id: 'promoter', name: 'Promoter', baseWage: 10, unlockRequirement: { reputation: 30 },
    description: 'Draws in extra foot traffic nearby.' },
  { id: 'shift-supervisor', name: 'Shift Supervisor', baseWage: 14, unlockRequirement: { businessValue: 2500 },
    description: 'Improves morale and reliability of the whole shift.' },
  { id: 'store-manager', name: 'Store Manager', baseWage: 20, unlockRequirement: { locationsOwned: 2 },
    description: 'Can run a location without you present.' },
  { id: 'delivery-driver', name: 'Delivery Driver', baseWage: 15, unlockRequirement: { businessValue: 5000 },
    description: 'Required for wholesale delivery routes.' },
  { id: 'production-worker', name: 'Production Worker', baseWage: 12, unlockRequirement: { businessValue: 8000 },
    description: 'Staffs the bottling line.' },
  { id: 'regional-manager', name: 'Regional Manager', baseWage: 28, unlockRequirement: { locationsOwned: 3 },
    description: 'Oversees several employee-managed locations.' },
];

export const EMPLOYEE_TRAITS = [
  { id: 'friendly', label: 'Friendly', satisfactionBonus: 0.08 },
  { id: 'fast-learner', label: 'Fast Learner', experienceRateBonus: 0.5 },
  { id: 'reliable', label: 'Reliable', reliabilityBonus: 0.15 },
  { id: 'upseller', label: 'Upseller', revenueBonus: 0.06 },
  { id: 'perfectionist', label: 'Perfectionist', wasteReduction: 0.1, speedPenalty: 0.05 },
  { id: 'clumsy', label: 'Clumsy', wasteIncrease: 0.08 },
  { id: 'late-arrival', label: 'Late Arrival', reliabilityPenalty: 0.1 },
  { id: 'weatherproof', label: 'Weatherproof', badWeatherBonus: 0.1 },
  { id: 'crowd-favorite', label: 'Crowd Favorite', satisfactionBonus: 0.12, wageMultiplier: 1.15 },
];

const FIRST_NAMES = ['Jordan', 'Casey', 'Riley', 'Sam', 'Morgan', 'Avery', 'Taylor', 'Quinn', 'Reese', 'Drew', 'Skyler', 'Emerson'];

export function generateApplicantName(rng) {
  const idx = Math.floor(rng() * FIRST_NAMES.length);
  return FIRST_NAMES[idx];
}
