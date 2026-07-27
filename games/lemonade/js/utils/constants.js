// Central configuration for branding, calendar, and tunable balance constants.
// Change GAME_TITLE / GAME_SUBTITLE here to re-brand the whole app.

export const GAME_TITLE = 'Lemonade Empire';
export const GAME_SUBTITLE = 'Squeeze. Sell. Expand.';
export const SAVE_VERSION = 2;
export const DB_NAME = 'lemonade-empire';
export const DB_VERSION = 1;
export const MAX_SAVE_SLOTS = 3;

export const DAYS_PER_WEEK = 7;
export const DAYS_PER_SEASON = 28;
export const SEASONS = ['spring', 'summer', 'fall', 'winter'];
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const REPUTATION_TIERS = [
  { min: 0, label: 'Unknown' },
  { min: 15, label: 'Neighborhood Favorite' },
  { min: 35, label: 'Local Hotspot' },
  { min: 55, label: 'City Favorite' },
  { min: 75, label: 'Regional Brand' },
  { min: 90, label: 'Lemonade Icon' },
];

export const DIFFICULTIES = {
  relaxed: {
    label: 'Relaxed',
    startingCash: 40,
    spoilageMultiplier: 0.6,
    demandMultiplier: 1.15,
    competitorAggression: 0.6,
    bankruptcyGrace: true,
  },
  standard: {
    label: 'Standard',
    startingCash: 25,
    spoilageMultiplier: 1,
    demandMultiplier: 1,
    competitorAggression: 1,
    bankruptcyGrace: false,
  },
  entrepreneur: {
    label: 'Entrepreneur',
    startingCash: 18,
    spoilageMultiplier: 1.35,
    demandMultiplier: 0.9,
    competitorAggression: 1.4,
    bankruptcyGrace: false,
  },
};

// Operating day is broken into ticks for the live simulation.
export const DAY_START_HOUR = 10;
export const DAY_END_HOUR = 18;
export const TICK_MINUTES = 15;
export const TICKS_PER_DAY = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / TICK_MINUTES;

// Real-world milliseconds per sim-tick at 1x speed.
export const MS_PER_TICK_BASE = 2200;

export const CUSTOMER_SEGMENTS = ['children', 'parents', 'fitness', 'tourists', 'commuters'];

export const NOTIFICATION_DURATION_MS = 3200;

// A standard prepared cup is treated as this many fluid ounces when scaling
// ingredient consumption for bottled products (see wholesale-system.js).
export const CUP_SERVING_OZ = 9;
