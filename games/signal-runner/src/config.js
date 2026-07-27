/**
 * config.js — Centralised balance and tuning values.
 *
 * Every number that affects how the game *feels* lives here. Nothing in the
 * engine should invent its own magic constant; import from CONFIG instead.
 * All spatial values are expressed in grid cells, all durations in seconds.
 */

export const CONFIG = {
  grid: {
    cols: 9,
    rows: 13,
    /** Fraction of a cell left as padding around lane objects when drawing. */
    objectInset: 0.11,
  },

  player: {
    /** Time to slide from one cell to the next. */
    moveDuration: 0.13,
    /** How long a queued input stays valid after the current move ends. */
    inputBufferWindow: 0.22,
    /** Collision radius in cells — deliberately smaller than the drawn body. */
    radius: 0.3,
    /** Visual radius in cells. */
    visualRadius: 0.38,
    /** Signal-collapse animation length. */
    deathDuration: 0.7,
    /** Delay after the collapse before the player is playable again. */
    respawnDelay: 0.12,
    /** Uplink upload animation length. */
    uploadDuration: 0.85,
    /** Grace period after (re)spawning during which nothing can kill you. */
    spawnGrace: 0.25,
    /** Landing squash animation length. */
    landSquash: 0.11,
  },

  polarity: {
    /** Minimum gap between two frequency switches. */
    cooldown: 0.4,
    /** Length of the expanding ring effect. */
    flashDuration: 0.3,
  },

  input: {
    /** Minimum travel (CSS px) before a touch counts as a swipe. */
    swipeMinDistance: 26,
    /** A gesture slower than this is not treated as a swipe. */
    swipeMaxTime: 800,
    /** Dominant axis must beat the other axis by this factor. */
    dominantAxisRatio: 1.2,
    /** Movement (CSS px) below which a touch is treated as a tap. */
    tapMaxDistance: 14,
    /** Ignore a second identical swipe fired within this window. */
    repeatGuard: 0.05,
  },

  collision: {
    /** Extra reach, in cells, when deciding whether a platform supports you. */
    platformGrace: 0.2,
    /**
     * Lethal contact requires this much genuine penetration, in cells.
     *
     * Without it, a hazard exactly tangent to the collision circle counts as a
     * hit, so a graze with zero visible clearance kills — and worse, whether
     * it kills is decided by floating-point noise in the accumulated world
     * time. A hair of required overlap makes near-misses survivable, which is
     * what they look like, and puts the decision boundary far away from the
     * last bits of a double.
     */
    epsilon: 0.01,
    /** Proximity radius (cells) that scores a near miss. */
    nearMissDistance: 0.72,
    /** How far past the board edge a carried player may drift before dying. */
    offBoardMargin: 0.45,
  },

  world: {
    /** Largest delta-time a single frame may contribute (tab-switch guard). */
    maxDelta: 0.05,
    /** World speed multiplier while the death animation plays. */
    deathTimeScale: 0.25,
    /** World speed multiplier during an uplink upload. */
    uploadTimeScale: 0.6,
    /** Countdown shown before a level begins. */
    startDelay: 0.7,
  },

  score: {
    forwardRow: 10,
    fragment: 100,
    nearMiss: 75,
    uplink: 1000,
    levelComplete: 2000,
    cleanSignal: 1500,
    lowLatency: 1500,
  },

  scanner: {
    /** Fraction of the "on" phase spent charging before the beam is lethal. */
    warnRatio: 0.35,
  },

  particles: {
    max: 240,
    trailInterval: 0.045,
    reducedMax: 60,
  },

  audio: {
    masterVolume: 0.55,
    musicVolume: 0.3,
  },

  haptics: {
    switch: 12,
    nearMiss: 8,
    death: [30, 40, 30],
    uplink: [12, 30, 12],
    complete: [20, 40, 20, 40, 60],
  },

  tutorial: {
    /** World speed multiplier while a tutorial prompt is on screen. */
    timeScale: 0.25,
    /** Auto-dismiss after this long if the player does not tap. */
    autoDismiss: 5.5,
  },

  ui: {
    /** HUD text is only rewritten this often, never every frame. */
    hudInterval: 0.1,
    maxPixelRatio: 2,
    /**
     * How far a cell may depart from square. Phones are far taller than a
     * 9x13 board, so fitting square cells to the width wastes a lot of
     * height; letting rows stretch slightly reclaims it without making lane
     * heights misleading.
     */
    maxCellAspect: 1.16,
  },

  storagePrefix: 'signalRunner_',
  levelCount: 12,
};

/** Canonical polarity values. */
export const POLARITY = {
  CYAN: 'cyan',
  VIOLET: 'violet',
};

export const OPPOSITE_POLARITY = {
  cyan: POLARITY.VIOLET,
  violet: POLARITY.CYAN,
};

/** Palette — shared by the renderer and the CSS custom properties. */
export const PALETTE = {
  background: '#05070d',
  panel: '#0b1020',
  panelDeep: '#070b16',
  grid: 'rgba(140, 180, 230, 0.07)',
  gridStrong: 'rgba(140, 180, 230, 0.14)',
  cyan: '#3ef2f0',
  cyanDim: '#12707a',
  violet: '#b06cff',
  violetDim: '#4a2a8a',
  warning: '#ff9a3c',
  hostile: '#ff5a4d',
  corruption: '#ff2f6d',
  safe: '#132038',
  white: '#f2f7ff',
  text: '#9fb3d1',
};

export function polarityColor(polarity) {
  if (polarity === POLARITY.CYAN) return PALETTE.cyan;
  if (polarity === POLARITY.VIOLET) return PALETTE.violet;
  return PALETTE.white;
}

export function polarityDimColor(polarity) {
  if (polarity === POLARITY.CYAN) return PALETTE.cyanDim;
  if (polarity === POLARITY.VIOLET) return PALETTE.violetDim;
  return '#2a3348';
}
