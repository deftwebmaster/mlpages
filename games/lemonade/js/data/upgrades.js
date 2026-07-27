// Upgrades are grouped into categories. Only one upgrade per category+tier line
// can be owned at a time; buying a later tier replaces the earlier one.
// effects are read by systems/upgrade-system.js and applied additively/multiplicatively.

export const UPGRADES = [
  // Stand
  { id: 'stand-folding-table', category: 'stand', tier: 0, name: 'Folding Table', cost: 0, owned: true,
    effects: { capacity: 0 }, description: 'A humble start.' },
  { id: 'stand-painted', category: 'stand', tier: 1, name: 'Painted Wooden Stand', cost: 60,
    requirements: { reputation: 5 }, effects: { capacity: 15, appealBonus: 0.03 },
    description: 'Looks like a real business now.' },
  { id: 'stand-branded-cart', category: 'stand', tier: 2, name: 'Branded Cart', cost: 220,
    requirements: { reputation: 20 }, effects: { capacity: 35, appealBonus: 0.07 },
    description: 'Mobile, colorful, and eye-catching.' },
  { id: 'stand-mobile-kiosk', category: 'stand', tier: 3, name: 'Mobile Kiosk', cost: 650,
    requirements: { reputation: 40 }, effects: { capacity: 60, appealBonus: 0.12 },
    description: 'A real structure that commands attention.' },
  { id: 'stand-permanent-counter', category: 'stand', tier: 4, name: 'Permanent Counter', cost: 1800,
    requirements: { reputation: 60 }, effects: { capacity: 100, appealBonus: 0.18 },
    description: 'Built to last, and it shows.' },

  // Production
  { id: 'prod-plastic-pitcher', category: 'production', tier: 0, name: 'Plastic Pitcher', cost: 0, owned: true,
    effects: { batchSize: 20, prepSpeed: 1 }, description: 'One pitcher at a time.' },
  { id: 'prod-large-dispenser', category: 'production', tier: 1, name: 'Large Dispenser', cost: 45,
    requirements: { reputation: 3 }, effects: { batchSize: 40, prepSpeed: 1.1 },
    description: 'Bigger batches, less running back and forth.' },
  { id: 'prod-citrus-press', category: 'production', tier: 2, name: 'Citrus Press', cost: 140,
    requirements: { reputation: 12 }, effects: { batchSize: 60, prepSpeed: 1.25, qualityBonus: 0.05 },
    description: 'Faster juicing, better yield per lemon.' },
  { id: 'prod-electric-juicer', category: 'production', tier: 3, name: 'Electric Juicer', cost: 400,
    requirements: { reputation: 25 }, effects: { batchSize: 100, prepSpeed: 1.5, qualityBonus: 0.08 },
    description: 'Cuts prep time dramatically.' },
  { id: 'prod-batch-mixer', category: 'production', tier: 4, name: 'Batch Mixer', cost: 1100,
    requirements: { reputation: 45 }, effects: { batchSize: 180, prepSpeed: 1.8, qualityBonus: 0.1 },
    description: 'Consistent quality at real volume.' },
  { id: 'prod-commercial-line', category: 'production', tier: 5, name: 'Commercial Production Line', cost: 3200,
    requirements: { reputation: 65 }, effects: { batchSize: 400, prepSpeed: 2.4, qualityBonus: 0.12 },
    description: 'Enables bottling-scale output.' },

  // Cooling
  { id: 'cool-ice-bucket', category: 'cooling', tier: 0, name: 'Ice Bucket', cost: 0, owned: true,
    effects: { iceRetention: 0, storageCapacity: 20 }, description: 'Melts by afternoon.' },
  { id: 'cool-cooler', category: 'cooling', tier: 1, name: 'Cooler', cost: 35,
    requirements: { reputation: 4 }, effects: { iceRetention: 0.2, storageCapacity: 40 },
    description: 'Keeps ice around longer.' },
  { id: 'cool-insulated-chest', category: 'cooling', tier: 2, name: 'Insulated Chest', cost: 120,
    requirements: { reputation: 10 }, effects: { iceRetention: 0.35, storageCapacity: 70 },
    description: 'Keeps ice usable longer and increases cold storage.' },
  { id: 'cool-refrigerator', category: 'cooling', tier: 3, name: 'Refrigerator', cost: 500,
    requirements: { reputation: 30 }, effects: { iceRetention: 0.6, storageCapacity: 150, spoilageReduction: 0.25 },
    description: 'Fresh ingredients last noticeably longer.' },
  { id: 'cool-commercial-cold-room', category: 'cooling', tier: 4, name: 'Commercial Cold Storage', cost: 1600,
    requirements: { reputation: 50 }, effects: { iceRetention: 0.85, storageCapacity: 400, spoilageReduction: 0.5 },
    description: 'Near-zero waste from melting or spoilage.' },

  // Service
  { id: 'svc-handwritten-sign', category: 'service', tier: 0, name: 'Handwritten Sign', cost: 0, owned: true,
    effects: { serviceSpeed: 1 }, description: 'Charming, if a little crooked.' },
  { id: 'svc-printed-menu', category: 'service', tier: 1, name: 'Printed Menu', cost: 25,
    requirements: { reputation: 6 }, effects: { serviceSpeed: 1.1, appealBonus: 0.02 },
    description: 'Customers decide faster.' },
  { id: 'svc-pos-tablet', category: 'service', tier: 2, name: 'Point-of-Sale Tablet', cost: 180,
    requirements: { reputation: 18 }, effects: { serviceSpeed: 1.3, satisfactionBonus: 0.05 },
    description: 'Faster, more accurate checkout.' },
  { id: 'svc-cup-dispenser', category: 'service', tier: 3, name: 'Cup Dispenser', cost: 90,
    requirements: { reputation: 14 }, effects: { serviceSpeed: 1.15 },
    description: 'One less fumble per order.' },
  { id: 'svc-second-station', category: 'service', tier: 4, name: 'Second Service Station', cost: 600,
    requirements: { reputation: 35 }, effects: { serviceSpeed: 1.6, capacity: 40 },
    description: 'Serve two lines of customers at once.' },
  { id: 'svc-self-service-shelf', category: 'service', tier: 5, name: 'Self-Service Pickup Shelf', cost: 950,
    requirements: { reputation: 45 }, effects: { serviceSpeed: 1.8, waitTolerance: 0.1 },
    description: 'Cuts wait times during rushes.' },

  // Business
  { id: 'biz-accounting-notebook', category: 'business', tier: 0, name: 'Accounting Notebook', cost: 0, owned: true,
    effects: {}, description: 'The basics, on paper.' },
  { id: 'biz-sales-analytics', category: 'business', tier: 1, name: 'Sales Analytics', cost: 80,
    requirements: { reputation: 10 }, effects: { forecastAccuracy: 0.15 },
    description: 'Better read on what sold and why.' },
  { id: 'biz-demand-forecasting', category: 'business', tier: 2, name: 'Demand Forecasting', cost: 260,
    requirements: { reputation: 22 }, effects: { forecastAccuracy: 0.3 },
    description: 'Tighter demand estimates before you prep.' },
  { id: 'biz-inventory-forecasting', category: 'business', tier: 3, name: 'Inventory Forecasting', cost: 350,
    requirements: { reputation: 28 }, effects: { spoilageReduction: 0.15 },
    description: 'Order closer to what you will actually use.' },
  { id: 'biz-automated-ordering', category: 'business', tier: 4, name: 'Automated Ordering', cost: 900,
    requirements: { reputation: 50 }, effects: { autoRestock: true },
    description: 'Never run out of the basics again.' },
];

export const UPGRADE_CATEGORIES = ['stand', 'production', 'cooling', 'service', 'business', 'logistics'];

export function getUpgrade(id) {
  return UPGRADES.find((upgrade) => upgrade.id === id);
}
