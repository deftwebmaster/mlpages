// Shared constants for the isometric grid, camera, and renderer.

export const TILE_WIDTH = 64;   // screen px, iso diamond full width at zoom 1
export const TILE_HEIGHT = 32;  // screen px, iso diamond full height at zoom 1

export const ZOOM_MIN = 0.4;
export const ZOOM_MAX = 2.5;
export const ZOOM_DEFAULT = 1;

export const PAN_FRICTION = 0.90;      // per-frame velocity decay while coasting
export const PAN_MIN_VELOCITY = 0.0005; // tile-units/ms below which coasting stops
export const PAN_MAX_VELOCITY = 0.03;  // tile-space units/ms ceiling — guards against
                                        // velocity spikes from coalesced/bursty move events
export const CAMERA_EASE = 0.18;       // lerp factor per frame toward target (centering/zoom)

export const SIM_TICK_RATE = 20;               // ticks per second
export const SIM_TICK_MS = 1000 / SIM_TICK_RATE;

export const AUTOSAVE_INTERVAL_MS = 30000;

export const FLOOR_TYPES = {
  concrete: { color: '#4a4d52', tint: 0.0 },
  concrete_worn: { color: '#3f4247', tint: 0.15 },
  metal_grate: { color: '#43494f', tint: 0.05 },
  rusted_metal: { color: '#5a4632', tint: 0.35 },
};

export const COLORS = {
  cyan: '#3ddbd9',
  orange: '#ff9142',
  amber: '#f5c542',
  red: '#e5484d',
  green: '#4ade80',
  charcoal: '#15171a',
};

export const DIRECTIONS = ['N', 'E', 'S', 'W'];

// Grid-space unit vector for each rotation value (matches the rotation
// convention already used by PlacedObject/renderer: 0=N -y, 90=E +x, 180=S +y, 270=W -x).
export const DIRECTION_VECTORS = {
  0: { dx: 0, dy: -1 },
  90: { dx: 1, dy: 0 },
  180: { dx: 0, dy: 1 },
  270: { dx: -1, dy: 0 },
};

export const CONVEYOR_TIERS = {
  basic: { label: 'Conveyor', speed: 1, color: '#3ddbd9' }, // 1 tile/sec, per Part 7 balancing
};

export const ITEM_MIN_SPACING = 0.35; // minimum progress gap maintained between queued items
export const ITEM_RADIUS_SCALE = 0.18; // fraction of tile half-width used for item render radius

export const SOURCE_INTERVAL_MS = 1200;
