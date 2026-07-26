// Shared enums, tile legend, colors, and timing constants used across the engine.

export const TILE = {
  FLOOR: '.',
  WALL: '#',
  SPAWN: 'S',
  EXTRACTION: 'X',
  DOOR: 'D',
  LOCKED_DOOR: 'L',
  SWITCH: 'W',
  PACKAGE: 'P',
  DECORATION: ',',
  VENT: 'V',
};

// Tiles a player/guard may stand on (doors are conditionally walkable based on state).
export const WALKABLE_TILES = new Set([
  TILE.FLOOR, TILE.SPAWN, TILE.EXTRACTION, TILE.SWITCH, TILE.PACKAGE, TILE.DECORATION, TILE.VENT,
]);

export const DIRECTIONS = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
};

export const DIRECTION_ORDER = ['N', 'E', 'S', 'W'];

export function deltaToDirection(dx, dy) {
  if (dx === 0 && dy === -1) return 'N';
  if (dx === 1 && dy === 0) return 'E';
  if (dx === 0 && dy === 1) return 'S';
  if (dx === -1 && dy === 0) return 'W';
  return null;
}

export const DEFAULT_VISION_ANGLE = 45;
export const DEFAULT_VISION_RANGE = 6;

export const ANIM_MS = {
  MOVE: 150,
  DOOR: 200,
  COLLECT: 150,
  FAIL: 300,
  VICTORY: 300,
};

export const REDUCED_MOTION_SCALE = 0.35;

export const COLORS = {
  bgNearBlack: '#0b0f14',
  panelBlueGray: '#1a2430',
  panelBlueGrayLight: '#243244',
  gridLine: '#233042',
  wall: '#2c3b4e',
  wallEdge: '#3a4d64',
  floor: '#141c26',
  floorAlt: '#161f2a',
  cyan: '#3fe0ff',
  cyanDim: 'rgba(63,224,255,0.35)',
  violet: '#b98bff',
  violetDim: 'rgba(185,139,255,0.35)',
  orange: '#ff9a3c',
  orangeDim: 'rgba(255,154,60,0.28)',
  red: '#ff4d5e',
  redDim: 'rgba(255,77,94,0.35)',
  textPrimary: '#e6f1f8',
  textSecondary: '#8ea3b8',
  textDim: '#5b6d80',
  doorClosed: '#5c4a2e',
  doorOpen: '#2e3a2c',
  switchOff: '#63758a',
  switchOn: '#3fe0ff',
};

export const STORAGE_KEY = 'dead-drop-save-v1';

export const GAME_STATUS = {
  PLAYING: 'playing',
  FAILED: 'failed',
  COMPLETE: 'complete',
};

export const EVENT = {
  MOVE: 'move',
  BLOCKED: 'blocked',
  DOOR_OPEN: 'doorOpen',
  DOOR_CLOSE: 'doorClose',
  DETECTED: 'detected',
  COLLECTED: 'collected',
  COMPLETE: 'complete',
};
