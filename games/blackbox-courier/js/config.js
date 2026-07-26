/**
 * Central balance + tuning configuration for Blackbox Courier.
 *
 * Every gameplay-affecting number lives here. Nothing in the rest of the
 * codebase should hard-code a balance value.
 *
 * WORLD SPACE
 *   x : lateral position. The maximum corridor spans [-1, 1].
 *   z : depth ahead of the craft. The craft sits at z = 0; hazards spawn far
 *       away at large z and travel toward 0 as the run advances.
 */

export const WORLD = {
  /** Half-width of the widest possible corridor, in world x units. */
  corridorHalf: 1.0,
  /** How far ahead (in z units) geometry is spawned and drawn. */
  viewDepth: 118,
  /** Perspective focal length. Larger = flatter, less aggressive foreshortening. */
  focal: 30,
  /** Objects behind this z are recycled. */
  cullZ: -10,
  /** Chunks are kept queued until this much z is buffered ahead of the craft. */
  bufferAhead: 190,
};

export const VIEW = {
  /** Vanishing point, as a fraction of canvas height. */
  horizonY: 0.17,
  /** The craft's row, as a fraction of canvas height. */
  playerY: 0.795,
  /** Corridor half-width at the craft's row, as a fraction of canvas width. */
  halfWidthAtPlayer: 0.435,
  /** Number of depth rings drawn for the tunnel. */
  depthRings: 30,
  /** Upper bound on devicePixelRatio used for the backing store. */
  maxPixelRatio: 2,
};

export const PLAYER = {
  /** Collision radius in world x units (also the craft's visual half-width). */
  radius: 0.082,
  /** Depth half-extent of the craft's collision capsule, in z units. */
  halfDepth: 1.15,
  /** Peak lateral speed, world x units per second. */
  maxSpeed: 2.55,
  /** Lateral acceleration toward the input target. */
  accel: 20.0,
  /** Deceleration applied when there is no steering input. */
  drag: 14.0,
  /** Drag-steering gain: how hard the craft chases the pointer's x. */
  followGain: 9.5,
  /** Pointer offsets smaller than this are treated as "on target". */
  followDeadzone: 0.006,
  /** Visual bank angle at full lateral speed, radians. */
  maxBank: 0.55,
  /** Emitted trail particles per second. */
  trailRate: 44,
};

export const PHASE = {
  max: 100,
  /** Energy consumed per second while phased. */
  drain: 35,
  /** Energy recovered per second while not phased. */
  recharge: 18,
  /** Phase cannot be engaged below this energy level. */
  minActivation: 10,
  /** Grace window after depletion before recharge resumes, seconds. */
  rechargeDelay: 0.35,
  /** Extra stability lost per second while phased, in stability points. */
  stabilityCost: 0.5,
  /** Score multiplier bonus applied while phased. */
  multiplierBonus: 0.35,
  /** Seconds the phase visual takes to ramp in / out. */
  rampTime: 0.12,
};

export const STABILITY = {
  max: 100,
  start: 100,
  /** Passive loss per second. */
  baseDrain: 0.8,
  /** Additional loss per second while inside a corruption field. */
  corruptionDrain: 4.0,
  /** Additional loss per second while scraping a tunnel wall. */
  scrapeDrain: 18.0,
  /** Loss from a glancing hit against a damaging hazard. */
  minorCollision: 11,
  /** Loss from clipping the outer edge of a mine. */
  mineGraze: 15,
  /** Recovered by a repair node. */
  repairNode: 10,
  /** Recovered by passing through a calibration gate. */
  calibrationGate: 20,
  /** Recovered for completing a chunk without damage. */
  cleanSection: 2,
  /** Recovered at each delivery checkpoint. */
  checkpoint: 12,
  /** Seconds of damage immunity after a non-lethal hit. */
  invulnAfterHit: 0.7,
  /** Display thresholds, high to low. */
  states: [
    { min: 75, label: 'STABLE', tone: 'ok' },
    { min: 50, label: 'DEGRADING', tone: 'warn' },
    { min: 25, label: 'CRITICAL', tone: 'bad' },
    { min: 0.0001, label: 'COLLAPSE IMMINENT', tone: 'crit' },
    { min: -1, label: 'PAYLOAD LOST', tone: 'crit' },
  ],
};

export const SPEED = {
  /** Forward speed at the start of a run, z units per second. */
  start: 27,
  /** Hard ceiling on forward speed. */
  max: 64,
  /** Seconds of elapsed run time to reach maximum speed. */
  rampSeconds: 210,
  /** Extra forward speed applied inside a straightaway chunk. */
  straightawayBoost: 9,
  /** Forward speed is scaled by this immediately after a checkpoint... */
  checkpointSlow: 0.72,
  /** ...and recovers over this many seconds. */
  checkpointSlowTime: 2.2,
  /** How quickly actual speed chases target speed. */
  lerp: 1.6,
};

export const DIFFICULTY = {
  /** Elapsed-time boundaries (seconds) between tiers 1..5. */
  tierSeconds: [0, 30, 60, 120, 180],
  /** A recovery chunk is forced at least this often (in chunks). */
  recoveryEvery: [3, 4, 5, 5, 6],
  /** Phase energy the generator assumes is available before a phase chunk. */
  phaseBudgetMargin: 22,
  /** Hard chunks may not appear more than this many times consecutively. */
  maxConsecutiveHard: 2,
};

export const CHECKPOINT = {
  /** Seconds between delivery checkpoints. */
  intervalSeconds: 30,
};

export const SCORE = {
  /** Points per distance unit (1 distance unit = 10 world z). */
  perDistanceUnit: 10,
  fragment: 100,
  nearMiss: 150,
  perfectChunk: 500,
  calibration: 300,
  checkpoint: 1000,
  repair: 50,
  multiplierStart: 1.0,
  multiplierMax: 5.0,
  /** Multiplier gained per fragment / near miss / clean chunk. */
  multPerFragment: 0.02,
  multPerNearMiss: 0.06,
  multPerCleanChunk: 0.25,
  /** Multiplier decay per second while not scoring, toward the floor. */
  multDecay: 0.05,
  /** Multiplier is reduced to this fraction on damage. */
  multDamagePenalty: 0.5,
  /** Multiplier resets fully below this stability level. */
  multResetStability: 25,
  /** Bonus multiplier contribution from travelling near top speed. */
  multSpeedBonus: 0.5,
};

export const NEARMISS = {
  /**
   * Lateral clearance band, in world x units, beyond the craft's hull. A hazard
   * awards at most one near miss, on the frame it passes the craft.
   */
  band: 0.14,
};

export const COLLISION = {
  /**
   * Collision shapes are shrunk by this fraction relative to what is drawn, so
   * that visually tight passes are survivable.
   */
  forgiveness: 0.86,
  /** Extra forgiveness applied to the craft's own radius. */
  playerForgiveness: 0.8,
  /** Corridor overlap (world x) beyond which a closing wall is fatal. */
  wallCrushDepth: 0.055,
};

export const COLLECTIBLE = {
  /** Pickup radius in world x units. */
  radius: 0.11,
  /** Depth half-extent for pickup, z units. */
  halfDepth: 2.2,
  /** Magnet range: fragments drift toward the craft within this lateral range. */
  magnet: 0.16,
  magnetStrength: 2.4,
};

export const PARTICLES = {
  /** Absolute cap on live particles. */
  max: 420,
  /** Cap when reduced effects are enabled. */
  maxReduced: 120,
  /** Speed streaks drawn behind the craft. */
  streaks: 46,
  streaksReduced: 14,
};

export const FX = {
  shakeDecay: 5.5,
  shakeMaxPixels: 16,
  /** Seconds of slow motion when a run ends. */
  deathSlowTime: 0.9,
  deathSlowFactor: 0.22,
  /** Seconds the results panel waits before fading in. */
  resultsDelay: 1.05,
  /** Countdown before a run begins, seconds. */
  startCountdown: 1.5,
  /** Glitch intensity is driven by (1 - stability/100) raised to this power. */
  glitchCurve: 1.8,
  glitchMax: 1.0,
};

export const AUDIO = {
  masterVolume: 0.55,
  sfxVolume: 0.8,
  musicVolume: 0.32,
};

export const HAPTICS = {
  phase: 12,
  nearMiss: 8,
  damage: [0, 40, 30, 60],
  checkpoint: [0, 18, 40, 18],
  gameOver: [0, 70, 50, 120],
};

/**
 * Score bands for the end-of-run grade. Tuned against representative runs:
 * a first attempt lands around 10k, a competent 2-minute run around 50k, and a
 * strong 4-5 minute run around 200k.
 */
export const GRADES = [
  { min: 150000, label: 'PERFECT DELIVERY', tone: 'grade-s' },
  { min: 60000, label: 'PAYLOAD DELIVERED', tone: 'grade-a' },
  { min: 22000, label: 'PARTIAL TRANSFER', tone: 'grade-b' },
  { min: 7000, label: 'SIGNAL RECOVERED', tone: 'grade-c' },
  { min: -1, label: 'DELIVERY FAILED', tone: 'grade-d' },
];

export const STORAGE_PREFIX = 'blackboxCourier_';

/** Palette shared between canvas rendering and generated assets. */
export const COLORS = {
  void: '#04060e',
  deep: '#070c1c',
  navy: '#0d1730',
  grid: '#173056',
  gridHot: '#1f4d86',
  cyan: '#3ff2ff',
  cyanDim: '#1b8fa8',
  violet: '#a878ff',
  violetHot: '#d4b4ff',
  orange: '#ff9a3c',
  red: '#ff3d5e',
  green: '#4dffb0',
  white: '#eaf6ff',
};
