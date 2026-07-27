import { DIFFICULTIES, SAVE_VERSION } from '../utils/constants.js';
import { makeSeed } from '../utils/random.js';

export function createDefaultState({ businessName, ownerName, difficulty = 'standard', tutorialEnabled = true } = {}) {
  const diff = DIFFICULTIES[difficulty] || DIFFICULTIES.standard;

  return {
    version: SAVE_VERSION,
    meta: {
      businessName: businessName || 'Sunny Day Lemonade',
      ownerName: ownerName || '',
      difficulty,
      createdAt: Date.now(),
      lastSavedAt: null,
      rngSeed: makeSeed(),
      daySeedOffset: 0,
    },
    calendar: {
      day: 1,
      season: 'summer',
      seasonDay: 1,
    },
    finances: {
      cash: diff.startingCash,
      lifetimeRevenue: 0,
      lifetimeExpenses: 0,
      lifetimeProfit: 0,
      loans: [],
    },
    reputation: {
      score: 0,
      brandAwareness: 0,
    },
    inventory: {
      // ingredientId -> { quantity, batches: [{ quantity, purchasedDay, shelfLifeDays }] }
      lemons: { quantity: 12, batches: [{ quantity: 12, purchasedDay: 1, shelfLifeDays: 6 }] },
      sugar: { quantity: 11, batches: [{ quantity: 11, purchasedDay: 1, shelfLifeDays: Infinity }] },
      water: { quantity: 2, batches: [{ quantity: 2, purchasedDay: 1, shelfLifeDays: Infinity }] },
      ice: { quantity: 20, batches: [{ quantity: 20, purchasedDay: 1, shelfLifeDays: 1 }] },
      cups: { quantity: 50, batches: [{ quantity: 50, purchasedDay: 1, shelfLifeDays: Infinity }] },
    },
    unlockedIngredients: ['lemons', 'sugar', 'water', 'ice', 'cups'],
    supplierPreferences: {},
    recipes: {
      unlockedMenuItems: ['classic-lemonade'],
      activeMenuItemId: 'classic-lemonade',
      saved: [
        {
          id: 'default-classic',
          name: 'Classic',
          menuItemId: 'classic-lemonade',
          lemon: 4,
          sugar: 3,
          ice: 2,
        },
      ],
      current: { lemon: 4, sugar: 3, ice: 2 },
    },
    pricing: {
      price: 1.75,
    },
    production: {
      cupsPlanned: 20,
      iceLevel: 2,
    },
    locations: {
      ownedIds: ['driveway'],
      currentId: 'driveway',
      perLocation: {
        driveway: { managementMode: 'personal', hours: [10, 18] },
      },
    },
    upgrades: {
      owned: [
        'stand-folding-table',
        'prod-plastic-pitcher',
        'cool-ice-bucket',
        'svc-handwritten-sign',
        'biz-accounting-notebook',
      ],
    },
    employees: [],
    marketing: {
      activeCampaigns: [],
    },
    competitors: {
      active: [],
    },
    wholesale: {
      bottleInventory: {},
      offers: [],
      activeContracts: [],
      completedContracts: [],
    },
    achievements: {
      earned: [],
    },
    milestones: {
      completed: [],
      unlockedFeatures: [],
    },
    objectives: {
      primary: 'earn-100-profit',
    },
    stats: {
      daysCompleted: 0,
      totalCupsSold: 0,
      totalCupsWasted: 0,
      totalCustomersServed: 0,
      lifetimeProfit: 0,
      businessValue: diff.startingCash,
      reputation: 0,
      soldOutDays: 0,
      zeroWasteDays: 0,
      zeroWasteStreak: 0,
      bestDayCustomers: 0,
      bestDayProfit: -Infinity,
      bestDaySatisfaction: 0,
      profitableRainDays: 0,
      employeesHired: 0,
      locationsOwned: 1,
      contractsCompleted: 0,
      priceWarsWon: 0,
      seasonsCompleted: { spring: 0, summer: 0, fall: 0, winter: 0 },
    },
    history: {
      days: [], // completed DailyReport objects, most recent last
    },
    settings: {
      soundEnabled: true,
      musicEnabled: true,
      animationIntensity: 'full', // full | reduced | none
      reducedMotion: false,
      theme: 'auto', // auto | light | dark
      confirmExpensivePurchases: true,
      defaultSimSpeed: 1,
      tutorialEnabled,
    },
    tutorial: {
      enabled: tutorialEnabled,
      step: tutorialEnabled ? 'welcome' : 'done',
      completedSteps: [],
    },
    ui: {
      dayPhase: 'briefing', // briefing | prep | live | results
      currentDayPrepared: false,
    },
    liveDay: null, // populated when a day is running; not persisted across app reload
  };
}
