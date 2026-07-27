// Suppliers modify purchase price, quality, and delivery reliability for
// ingredient orders. `priceMultiplier` applies to packPrice; `qualityBonus`
// adds to the ingredient's base quality level.

export const SUPPLIERS = [
  { id: 'corner-grocery', name: 'Corner Grocery', unlocked: true,
    priceMultiplier: 1.0, qualityBonus: 0, minOrderPacks: 1, reliability: 0.97,
    description: 'Convenient and always in stock.' },
  { id: 'wholesale-club', name: 'Wholesale Club', unlockRequirement: { reputation: 12 },
    priceMultiplier: 0.78, qualityBonus: 0, minOrderPacks: 4, reliability: 0.93,
    description: 'Bulk pricing, but you must buy more at once.' },
  { id: 'produce-market', name: 'Produce Market', unlockRequirement: { reputation: 18 },
    priceMultiplier: 1.05, qualityBonus: 1, minOrderPacks: 1, reliability: 0.9,
    description: 'Fresher produce at a modest premium.' },
  { id: 'restaurant-supplier', name: 'Restaurant Supplier', unlockRequirement: { reputation: 30 },
    priceMultiplier: 0.85, qualityBonus: 1, minOrderPacks: 2, reliability: 0.95,
    description: 'Solid quality and dependable delivery windows.' },
  { id: 'regional-distributor', name: 'Regional Distributor', unlockRequirement: { reputation: 45 },
    priceMultiplier: 0.65, qualityBonus: 0, minOrderPacks: 8, reliability: 0.9,
    description: 'Best prices at real volume, less flexible.' },
  { id: 'direct-farm', name: 'Direct Farm Supplier', unlockRequirement: { reputation: 40 },
    priceMultiplier: 0.95, qualityBonus: 2, minOrderPacks: 2, reliability: 0.85,
    description: 'Exceptional quality, occasionally delayed.' },
  { id: 'packaging-supplier', name: 'Packaging Supplier', unlockRequirement: { reputation: 20 },
    priceMultiplier: 0.8, qualityBonus: 0, minOrderPacks: 2, reliability: 0.96,
    description: 'Best rates on cups, lids, and straws.' },
];

export function getSupplier(id) {
  return SUPPLIERS.find((s) => s.id === id);
}
