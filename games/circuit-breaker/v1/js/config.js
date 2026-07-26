/**
 * Central balance + tuning configuration.
 * Every gameplay number lives here so the game can be rebalanced in one place.
 */

export const NODE_TYPES = [
  { id: 'cyan',    symbol: 'circle',   name: 'Cyan circle' },
  { id: 'violet',  symbol: 'diamond',  name: 'Violet diamond' },
  { id: 'lime',    symbol: 'triangle', name: 'Lime triangle' },
  { id: 'gold',    symbol: 'hexagon',  name: 'Gold hexagon' },
  { id: 'magenta', symbol: 'cross',    name: 'Magenta cross' },
];

export const SPECIAL = {
  LINE_H: 'lineH',
  LINE_V: 'lineV',
};

export const CONFIG = {
  BOARD_ROWS: 7,
  BOARD_COLUMNS: 7,
  NODE_TYPE_COUNT: 5,
  MIN_MATCH: 3,

  /* ---- Heat ---- */
  STARTING_HEAT: 15,
  HEAT_PER_VALID_MOVE: 7,
  MAX_HEAT: 100,
  COOLING_MATCH_4: 2,
  COOLING_MATCH_5_PLUS: 5,
  COOLING_FIRST_CASCADE: 2,
  COOLING_ADDITIONAL_CASCADE: 3,
  COOLING_SPECIAL: 2,
  COOLING_LARGE_CHAIN: 3,
  /* A resolution step clearing this many nodes counts as a board-clearing chain. */
  LARGE_CHAIN_NODE_COUNT: 12,

  /* ---- Scoring ---- */
  MATCH_3_SCORE: 100,
  MATCH_4_SCORE: 200,
  MATCH_5_SCORE: 350,
  ADDITIONAL_NODE_SCORE: 150,
  SPECIAL_ACTIVATION_SCORE: 100,
  FULL_LINE_SCORE: 250,
  BASE_CASCADE_MULTIPLIER: 1,
  CASCADE_MULTIPLIER_INCREMENT: 0.5,

  /* ---- Animation timing (ms) ---- */
  TIMING: {
    SWAP: 190,
    INVALID_HOLD: 130,
    CHARGE: 130,
    DISCHARGE: 210,
    FALL: 250,
    CASCADE_PAUSE: 100,
    SPECIAL_BEAM: 200,
    DEADLOCK: 950,
    OVERLOAD: 1150,
  },

  /* Reduced-motion multiplier applied to every duration above. */
  REDUCED_MOTION_SCALE: 0.35,

  /* ---- Input ---- */
  SWIPE_THRESHOLD_PX: 14,
  /* Below this ratio a swipe is too diagonal to read as a direction. */
  SWIPE_AXIS_RATIO: 1.25,

  /* ---- Heat presentation stages ---- */
  HEAT_STAGES: [
    { max: 49,  key: 'stable',   status: 'SYSTEM STABLE' },
    { max: 74,  key: 'elevated', status: 'HEAT RISING' },
    { max: 89,  key: 'critical', status: 'CRITICAL LOAD' },
    { max: 99,  key: 'overload', status: 'OVERLOAD IMMINENT' },
    { max: 100, key: 'overload', status: 'SHUTDOWN' },
  ],

  /* ---- Cascade labels ---- */
  CASCADE_LABELS: {
    2: 'CHAIN x2',
    3: 'CHAIN x3',
  },
  CASCADE_SURGE_LABEL: 'SYSTEM SURGE',

  /* ---- Feature flags ---- */
  FEATURES: {
    specials: true,
    tutorial: true,
    particles: true,
    keyboard: true,
  },
};

export const STORAGE_PREFIX = 'circuitBreaker_';

/** Score awarded for a single match group of `length` nodes, before multipliers. */
export function baseMatchScore(length) {
  if (length <= 3) return CONFIG.MATCH_3_SCORE;
  if (length === 4) return CONFIG.MATCH_4_SCORE;
  if (length === 5) return CONFIG.MATCH_5_SCORE;
  return CONFIG.MATCH_5_SCORE + (length - 5) * CONFIG.ADDITIONAL_NODE_SCORE;
}

/** Cooling granted by a single match group of `length` nodes. */
export function matchCooling(length) {
  if (length === 4) return CONFIG.COOLING_MATCH_4;
  if (length >= 5) return CONFIG.COOLING_MATCH_5_PLUS;
  return 0;
}

/** Multiplier for the Nth resolution step of a turn (1 = the player's own match). */
export function cascadeMultiplier(step) {
  return CONFIG.BASE_CASCADE_MULTIPLIER + (Math.max(1, step) - 1) * CONFIG.CASCADE_MULTIPLIER_INCREMENT;
}

/** Cooling granted purely for reaching cascade `step`. */
export function cascadeCooling(step) {
  if (step <= 1) return 0;
  if (step === 2) return CONFIG.COOLING_FIRST_CASCADE;
  return CONFIG.COOLING_ADDITIONAL_CASCADE;
}
