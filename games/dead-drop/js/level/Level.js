import { TILE } from '../utils/constants.js';
import { buildDoorLookup } from '../board/Board.js';

const LEVELS_BASE = new URL('./levels/', import.meta.url);

let manifestCache = null;

export async function loadManifest() {
  if (manifestCache) return manifestCache;
  const res = await fetch(new URL('manifest.json', LEVELS_BASE));
  manifestCache = await res.json();
  return manifestCache;
}

export async function loadLevelById(id) {
  const manifest = await loadManifest();
  const entry = manifest.find((m) => m.id === id);
  if (!entry) throw new Error(`Unknown level id: ${id}`);
  return loadLevelFile(entry.file);
}

export async function loadLevelByIndex(index) {
  const manifest = await loadManifest();
  const entry = manifest[index];
  if (!entry) return null;
  return loadLevelFile(entry.file);
}

async function loadLevelFile(file) {
  const res = await fetch(new URL(file, LEVELS_BASE));
  const raw = await res.json();
  return normalizeLevel(raw);
}

function normalizeLevel(raw) {
  const { tiles, width, height } = raw;
  if (tiles.length !== height) throw new Error(`Level ${raw.id}: tiles row count != height`);
  for (const row of tiles) {
    if (row.length !== width) throw new Error(`Level ${raw.id}: tile row width mismatch`);
  }

  const grid = tiles.map((row) => row.split(''));

  let spawn = null;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === TILE.SPAWN) {
        spawn = { x, y };
        grid[y][x] = TILE.FLOOR; // spawn marker isn't a persistent terrain feature
      }
    }
  }
  if (!spawn) throw new Error(`Level ${raw.id}: missing spawn (S) tile`);

  const entities = raw.entities || {};

  const level = {
    id: raw.id,
    name: raw.name,
    order: raw.order,
    width,
    height,
    targetMoves: raw.targetMoves,
    grid,
    spawn,
    guards: (entities.guards || []).map(normalizeGuard),
    cameras: (entities.cameras || []).map(normalizeCamera),
    doors: entities.doors || [],
    switches: entities.switches || [],
    keycards: entities.keycards || [],
    package: entities.package,
    extraction: entities.extraction,
  };
  level.doorLookup = buildDoorLookup(level);
  level.guardDefsById = Object.fromEntries(level.guards.map((g) => [g.id, g]));
  level.cameraDefsById = Object.fromEntries(level.cameras.map((c) => [c.id, c]));
  return level;
}

function normalizeGuard(g) {
  return {
    id: g.id,
    start: g.start,
    facing: g.facing || 'S',
    route: g.route && g.route.length ? g.route : [g.start],
    patrolMode: g.patrolMode || 'pingpong',
    waypointPauses: g.waypointPauses || {},
    visionAngle: g.visionAngle,
    visionRange: g.visionRange,
  };
}

function normalizeCamera(c) {
  return {
    id: c.id,
    pos: c.pos,
    sequence: c.sequence && c.sequence.length ? c.sequence : ['N'],
    mode: c.mode || 'continuous',
    pauseDuration: c.pauseDuration || 0,
    startIndex: c.startIndex || 0,
    visionAngle: c.visionAngle,
    visionRange: c.visionRange,
  };
}
