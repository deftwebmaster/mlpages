// Wholesale client templates. Each generates rotating contract offers scaled
// within these ranges (see systems/wholesale-system.js#refreshContractOffers).
// quantity is in bottles; pricePerUnitRange is wholesale $/bottle.

export const CONTRACT_CLIENTS = [
  {
    id: 'local-cafe',
    name: 'Local Café',
    minReputation: 40,
    quantityRange: [24, 48],
    deadlineDays: 5,
    pricePerUnitRange: [2.0, 2.8],
    qualityRequirement: 0.5,
    penalty: 40,
    reputationReward: 3,
  },
  {
    id: 'school-event',
    name: 'School Event',
    minReputation: 40,
    quantityRange: [30, 60],
    deadlineDays: 3,
    pricePerUnitRange: [1.6, 2.0],
    qualityRequirement: 0.4,
    penalty: 25,
    reputationReward: 2,
  },
  {
    id: 'grocery-store',
    name: 'Grocery Store',
    minReputation: 45,
    quantityRange: [80, 150],
    deadlineDays: 10,
    pricePerUnitRange: [1.8, 2.4],
    qualityRequirement: 0.55,
    penalty: 100,
    reputationReward: 5,
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    minReputation: 50,
    quantityRange: [40, 80],
    deadlineDays: 7,
    pricePerUnitRange: [2.2, 3.0],
    qualityRequirement: 0.6,
    penalty: 60,
    reputationReward: 4,
  },
  {
    id: 'sports-venue',
    name: 'Sports Venue',
    minReputation: 55,
    quantityRange: [150, 300],
    deadlineDays: 4,
    pricePerUnitRange: [1.9, 2.5],
    qualityRequirement: 0.45,
    penalty: 150,
    reputationReward: 6,
  },
  {
    id: 'hotel-chain',
    name: 'Hotel Chain',
    minReputation: 70,
    quantityRange: [200, 400],
    deadlineDays: 12,
    pricePerUnitRange: [2.4, 3.2],
    qualityRequirement: 0.65,
    penalty: 250,
    reputationReward: 8,
  },
  {
    id: 'regional-supermarket',
    name: 'Regional Supermarket',
    minReputation: 65,
    quantityRange: [300, 600],
    deadlineDays: 14,
    pricePerUnitRange: [1.7, 2.2],
    qualityRequirement: 0.6,
    penalty: 300,
    reputationReward: 10,
  },
];

export function getContractClient(id) {
  return CONTRACT_CLIENTS.find((c) => c.id === id);
}
