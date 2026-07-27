/**
 * config.js — Central tuning constants and enumerations.
 *
 * Everything that a designer might want to tweak lives here. No magic numbers
 * should appear in gameplay code; import from this module instead.
 */

/** Tile identifiers. Stored in the maze grid as a Uint8Array. */
export const TILE = Object.freeze({
  FLOOR: 0,
  WALL: 1,
  GATE_CLOSED: 2,
  GATE_OPEN: 3,
  BARRIER: 4, // breakable barrier — solid, reserved for future use
  SECRET: 5, // secret entrance — solid until a shift reveals it
  BRIDGE_OFF: 6, // an inactive bridge span — solid
  BRIDGE_ON: 7, // an extended bridge span — walkable
});

/** Tiles an entity may occupy. */
const WALKABLE = new Uint8Array(8);
WALKABLE[TILE.FLOOR] = 1;
WALKABLE[TILE.GATE_OPEN] = 1;
WALKABLE[TILE.BRIDGE_ON] = 1;

/** @returns {boolean} true when `tile` can be walked on. */
export function isWalkable(tile) {
  return WALKABLE[tile] === 1;
}

/** Cardinal directions. Index order matters: opposite(d) === (d + 2) % 4. */
export const DIR = Object.freeze({ UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3, NONE: -1 });

/** Direction unit vectors, indexed by DIR. */
export const DIR_VEC = Object.freeze([
  Object.freeze({ x: 0, y: -1 }),
  Object.freeze({ x: 1, y: 0 }),
  Object.freeze({ x: 0, y: 1 }),
  Object.freeze({ x: -1, y: 0 }),
]);

/** @returns {number} the direction facing the other way. */
export const opposite = (d) => (d < 0 ? -1 : (d + 2) % 4);

/** Drone finite-state-machine states. */
export const DRONE_STATE = Object.freeze({
  PATROL: 'patrol',
  CHASE: 'chase',
  FRIGHTENED: 'frightened',
  RETURNING: 'returning',
  RECOVERING: 'recovering',
});

/** Drone personality identifiers, matched to the level map legend. */
export const PERSONALITY = Object.freeze({
  HUNTER: 'hunter',
  INTERCEPTOR: 'interceptor',
  SENTINEL: 'sentinel',
  TRACKER: 'tracker',
  WANDERER: 'wanderer',
});

/** High-level game states. */
export const STATE = Object.freeze({
  LOADING: 'loading',
  MENU: 'menu',
  LEVEL_SELECT: 'levelSelect',
  PLAYING: 'playing',
  PAUSED: 'paused',
  LEVEL_COMPLETE: 'levelComplete',
  SETTINGS: 'settings',
  HELP: 'help',
  STATS: 'stats',
  TRANSITION: 'transition',
});

export const CFG = Object.freeze({
  // ── Timing ────────────────────────────────────────────────────────────────
  MAX_FRAME_DT: 1 / 20, // clamp long frames so physics never tunnels
  FIXED_STEP: 1 / 120, // gameplay integrates in fixed slices

  // ── Player ────────────────────────────────────────────────────────────────
  PLAYER_SPEED: 6.4, // tiles per second
  PLAYER_POWER_SPEED_MULT: 1.1, // +10% while a power module is active
  PLAYER_RADIUS: 0.36, // in tiles, for rendering
  INPUT_BUFFER_TIME: 0.42, // seconds a queued turn stays valid

  // ── Drones ────────────────────────────────────────────────────────────────
  // Drones path perfectly, so their speed is the whole difficulty dial: at
  // parity with the player a chase is mathematically unwinnable. These values
  // keep them at roughly 76%–88% of player speed across the campaign, which is
  // fast enough to corner you and slow enough that a good route always exists.
  DRONE_SPEED: 4.9,
  DRONE_SPEED_RAMP: 0.05, // added per level index
  DRONE_SPEED_MAX: 6.0,
  DRONE_FRIGHTENED_SPEED: 3.4,
  DRONE_RETURN_SPEED: 12.0,
  DRONE_RADIUS: 0.38,
  DRONE_RECOVER_TIME: 1.6, // seconds parked at spawn after being eaten
  DRONE_REPATH_HZ: 8, // pathfinding recalculations per second
  SENTINEL_ALERT_RANGE: 7, // tiles (BFS distance) before a sentinel engages
  INTERCEPTOR_LEAD: 4, // tiles ahead of the player it aims for
  TRACKER_LEAD: 6, // tiles along the player's recent heading
  WANDERER_RETARGET: 2.8, // seconds between random goals
  /**
   * Scatter/chase cadence in seconds, alternating patrol → chase → patrol …
   * The pattern loops rather than locking into permanent pursuit: with up to
   * five perfect pathfinders on the board, a never-ending chase phase turns
   * into a death loop rather than a challenge.
   */
  PHASE_PATTERN: Object.freeze([7, 18, 6, 20, 5, 22, 5, 24]),

  // ── Power modules ─────────────────────────────────────────────────────────
  POWER_DURATION: 8.0,
  POWER_WARN_TIME: 2.0, // final seconds where drones flash

  // ── Grid Shift ────────────────────────────────────────────────────────────
  SHIFT_COOLDOWN: 15.0,
  SHIFT_ANIM_TIME: 0.42, // gameplay freezes for this long during a shift
  BRIDGE_DURATION: 7.0, // how long a Bridge Extend stays walkable

  // ── Collision ─────────────────────────────────────────────────────────────
  CATCH_DISTANCE: 0.72, // tiles, centre-to-centre

  // ── Scoring ───────────────────────────────────────────────────────────────
  SCORE_NODE: 10,
  SCORE_SECRET_NODE: 25,
  SCORE_POWER: 50,
  SCORE_DRONE_BASE: 100,
  SCORE_DRONE_MAX: 1600,
  SCORE_SHIFT: 250,
  SCORE_SECRET: 500,
  SCORE_PERFECT: 1000,

  // ── Presentation ──────────────────────────────────────────────────────────
  DEATH_FREEZE: 1.25, // seconds of death animation before respawn
  READY_TIME: 1.35, // "READY" countdown at level start / after death
  /**
   * Intangible "phase-in" after every spawn. Without it the board resets to an
   * identical state on death, so a player who repeats their opening repeats
   * their death — forever. This window guarantees a way out of the loop.
   */
  SPAWN_INVULN: 1.5,
  MAX_PARTICLES: 900,
  TRAIL_INTERVAL: 0.028, // seconds between player trail puffs
});

/** Rank thresholds applied to the 0–100 performance rating. */
export const RANKS = Object.freeze([
  { key: 'S+', min: 97 },
  { key: 'S', min: 88 },
  { key: 'A', min: 75 },
  { key: 'B', min: 60 },
  { key: 'C', min: 0 },
]);

/** Palette — dark industrial computer core. Kept small and high-contrast. */
export const COLORS = Object.freeze({
  bg: '#05070b',
  bgPanel: '#0a0e15',
  wall: '#0e1420',
  wallEdge: '#25406b',
  wallEdgeHot: '#3d74b8',
  floor: '#04060b',
  node: '#8fd7ff',
  nodeCore: '#ffffff',
  power: '#ffb44d',
  player: '#3ff0ff',
  playerCore: '#ffffff',
  terminal: '#c07bff',
  terminalReady: '#e0b3ff',
  gate: '#ff8a3c',
  bridge: '#5cf2c0',
  secret: '#ffd166',
  frightened: '#4b7bff',
  frightenedFlash: '#dfe8ff',
  danger: '#ff3b5c',
  text: '#dbe6f5',
  textDim: '#6d7d95',
  drone: ['#ff3b5c', '#ff8a3c', '#c07bff', '#5cf2c0', '#ffd166'],
});

export const STORAGE_PREFIX = 'gridlock_';
