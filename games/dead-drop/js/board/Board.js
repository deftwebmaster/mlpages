import { TILE, WALKABLE_TILES } from '../utils/constants.js';

export function inBounds(level, x, y) {
  return x >= 0 && y >= 0 && x < level.width && y < level.height;
}

export function tileAt(level, x, y) {
  if (!inBounds(level, x, y)) return null;
  return level.grid[y][x];
}

// Doors keyed by "x,y" for O(1) lookup during pathing/vision/detection.
export function buildDoorLookup(level) {
  const byPos = new Map();
  for (const d of level.doors) {
    byPos.set(`${d.pos[0]},${d.pos[1]}`, d.id);
  }
  return byPos;
}

export function doorIdAt(doorLookup, x, y) {
  return doorLookup.get(`${x},${y}`) || null;
}

// Whether a tile can be entered/seen-through right now given live door state.
export function isPassable(level, doorLookup, doorStates, x, y) {
  const tile = tileAt(level, x, y);
  if (tile == null) return false;
  if (tile === TILE.WALL) return false;
  if (tile === TILE.DOOR || tile === TILE.LOCKED_DOOR) {
    const doorId = doorIdAt(doorLookup, x, y);
    const doorState = doorId ? doorStates[doorId] : null;
    if (!doorState) return false;
    if (doorState.locked) return false;
    return !!doorState.open;
  }
  return WALKABLE_TILES.has(tile);
}

export function blocksVision(level, doorLookup, doorStates, x, y) {
  const tile = tileAt(level, x, y);
  if (tile == null) return true;
  if (tile === TILE.WALL) return true;
  if (tile === TILE.DOOR || tile === TILE.LOCKED_DOOR) {
    const doorId = doorIdAt(doorLookup, x, y);
    const doorState = doorId ? doorStates[doorId] : null;
    if (!doorState) return true;
    return !doorState.open; // open doors do not block vision; closed/locked do
  }
  return false;
}
