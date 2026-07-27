// Bottled product sizes for the late-game wholesale/bottling system. ozSize is
// used to scale ingredient consumption relative to a standard ~9oz cup serving
// (see CUP_SERVING_OZ in utils/constants.js).

export const BOTTLE_SIZES = [
  {
    id: 'bottle-12oz',
    name: '12 oz Bottle',
    ozSize: 12,
    packagingCost: 0.35,
    shelfLifeDays: 21,
    description: 'A standard retail single-serve bottle.',
  },
  {
    id: 'bottle-16oz',
    name: '16 oz Bottle',
    ozSize: 16,
    packagingCost: 0.45,
    shelfLifeDays: 21,
    unlockRequirement: { reputation: 50 },
    description: 'A larger bottle for bigger appetites and better shelf presence.',
  },
  {
    id: 'growler-32oz',
    name: '32 oz Growler',
    ozSize: 32,
    packagingCost: 0.9,
    shelfLifeDays: 14,
    unlockRequirement: { reputation: 60 },
    description: 'A premium refillable growler for cafés and events.',
  },
];

export function getBottleSize(id) {
  return BOTTLE_SIZES.find((b) => b.id === id);
}
