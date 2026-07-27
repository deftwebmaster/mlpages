// Salvage Zero — global tunables. Nothing here should be frame-rate dependent;
// all motion values are per-second and the sim integrates with real delta time.

export const CONFIG = {
  SAVE_PREFIX: 'salvageZero_',

  SHIP: {
    THRUST: 220,            // px/s^2
    REVERSE_THRUST: 130,
    ROTATE_SPEED: 3.6,      // rad/s
    ROTATE_SPEED_TRACTOR: 2.2,
    DRAG: 0.62,             // fraction of velocity retained per second (exp decay base)
    MAX_SPEED: 480,
    STABILIZE_ASSIST: 0.35, // 0..1, how strongly light auto-damping kicks in on tiny drift
    MAX_HULL: 100,
    RADIUS: 14,
    TRACTOR_THRUST_MULT: 0.72,
  },

  WEAPON: {
    FIRE_RATE: 8,          // shots / second
    PROJECTILE_SPEED: 620,
    PROJECTILE_LIFE: 0.9,
    PROJECTILE_DAMAGE: 12,
    HEAT_PER_SHOT: 9,       // % heat
    HEAT_DISSIPATE: 26,     // % per second
    HEAT_OVERHEAT_LOCK: 1.4,// seconds locked out after hitting 100
  },

  TRACTOR: {
    RANGE: 260,
    HALF_ANGLE: 0.5,        // radians, cone half-angle
    PULL_FORCE: 900,
    HEAT_PER_SEC: 14,
    SMALL_PICKUP_RADIUS: 22, // passive collection radius for tiny items w/o beam
  },

  WORLD: {
    WRAP_MARGIN: 0, // wrapping is exact torus, no margin needed
  },

  PHYSICS: {
    FIXED_DT: 1 / 120,
    MAX_STEPS: 8,
  },

  COMBO: {
    WINDOW: 3.0,
    MULT_STEP_KILLS: 3, // kills needed per multiplier step
    MAX_MULT: 5,
  },

  COLORS: {
    bg: '#05070a',
    steel: '#8b98a5',
    cyan: '#4fd8e8',
    orange: '#ff9540',
    white: '#eef4f8',
    red: '#ff4d4d',
    deepBlue: '#1a2c4d',
  },
};

export const WRECK_DEFS = {
  hull_section: { name: 'Hull Section', hp: 40, radius: 34, mass: 3, splits: 2, salvage: ['metal'], color: '#8b98a5' },
  cargo_module: { name: 'Cargo Module', hp: 80, radius: 30, mass: 4, splits: 1, salvage: ['metal', 'tech', 'rare'], color: '#5b7a9d' },
  fuel_tank: { name: 'Fuel Tank', hp: 26, radius: 22, mass: 2, splits: 0, salvage: ['energy'], color: '#ff9540', explosive: true },
  reactor_core: { name: 'Reactor Core', hp: 60, radius: 38, mass: 6, splits: 0, salvage: ['energy', 'rare', 'blackbox'], color: '#ff4d4d', reactor: true },
  satellite_array: { name: 'Satellite Array', hp: 34, radius: 40, mass: 3, splits: 1, salvage: ['tech'], color: '#4fd8e8', rotates: true },
  crystal_debris: { name: 'Crystal Debris', hp: 18, radius: 20, mass: 1.4, splits: 2, salvage: ['rare'], color: '#c58bff', fast: true, sharp: true },
};

export const SALVAGE_DEFS = {
  metal:    { name: 'Metal',         color: '#8b98a5', value: 5,  size: 6 },
  tech:     { name: 'Technology',    color: '#4fd8e8', value: 15, size: 7 },
  energy:   { name: 'Energy Cell',   color: '#ffd24f', value: 10, size: 6 },
  blackbox: { name: 'Black Box',     color: '#ff4d4d', value: 40, size: 8 },
  rare:     { name: 'Rare Component',color: '#c58bff', value: 30, size: 7 },
};

// Salvage-funded ship upgrades. Each maxes at level 3; costs[i] is the price to buy
// level i+1 (i.e. costs[0] takes you from 0->1). Purchased with save.credits, earned
// from mission.cargoValue on contract completion.
export const UPGRADE_DEFS = {
  tractorRange: {
    name: 'Tractor Range',
    description: 'Extends the beam\'s effective reach.',
    costs: [150, 350, 700],
    describe: (level) => `${CONFIG.TRACTOR.RANGE + level * 40}px range`,
  },
  cooling: {
    name: 'Cooling Efficiency',
    description: 'Faster heat dissipation and cooler shots.',
    costs: [150, 350, 700],
    describe: (level) => `+${level * 15}% dissipation, -${level * 8}% heat/shot`,
  },
  hullReinforcement: {
    name: 'Hull Reinforcement',
    description: 'Reinforced plating raises max hull integrity.',
    costs: [150, 350, 700],
    describe: (level) => `${CONFIG.SHIP.MAX_HULL + level * 20} max hull`,
  },
};
export const UPGRADE_MAX_LEVEL = 3;
