/**
 * tools/validate-levels.mjs — the level linter.
 *
 * Loads the shipped `js/levels.js` through the real `Maze` and `ShiftController`
 * code and proves, for every level:
 *
 *   • the map is rectangular and uses only legal characters
 *   • exactly one player spawn, at least one drone, terminals match shifts[]
 *   • every required energy node, power module and terminal is reachable from
 *     the player spawn in the untouched maze
 *   • the same holds after *every reachable combination of Grid Shift states* —
 *     this is acceptance criterion 4, checked exhaustively rather than assumed
 *   • bonus compartments are sealed at the start and openable by some terminal
 *   • no shift's cells collide with another shift's rotation block
 *
 * Run: node tools/validate-levels.mjs
 * Exit code is non-zero when any level fails, so it works as a CI gate.
 */

import { LEVELS } from '../js/levels.js';
import { Maze, LEGEND } from '../js/maze.js';
import { proveShiftSafety, SHIFT_BEHAVIOURS } from '../js/shift.js';
import { TILE, isWalkable } from '../js/config.js';
import { reachableSet } from '../js/pathfinding.js';

let failures = 0;
let warnings = 0;

const fail = (level, msg) => {
  console.error(`  ✗ ${level.id}: ${msg}`);
  failures++;
};
const warn = (level, msg) => {
  console.warn(`  ! ${level.id}: ${msg}`);
  warnings++;
};

/** Collects the tiles every rotate-type shift would sweep. */
function rotationCells(shift, out = []) {
  if (shift.type === 'rotate') {
    const h = ((shift.size || 3) - 1) / 2;
    for (let y = shift.cy - h; y <= shift.cy + h; y++) {
      for (let x = shift.cx - h; x <= shift.cx + h; x++) out.push(`${x},${y}`);
    }
  }
  if (shift.parts) for (const p of shift.parts) rotationCells(p, out);
  return out;
}

/** Collects the fixed tiles a non-rotate shift writes to. */
function fixedCells(shift, out = []) {
  if (Array.isArray(shift.cells)) for (const [x, y] of shift.cells) out.push(`${x},${y}`);
  if (shift.parts) for (const p of shift.parts) fixedCells(p, out);
  return out;
}

console.log(`Validating ${LEVELS.length} levels…\n`);

for (const level of LEVELS) {
  // ── Shape and legend ──────────────────────────────────────────────────────
  if (level.map.length !== level.height) fail(level, `map has ${level.map.length} rows, height says ${level.height}`);
  level.map.forEach((row, y) => {
    if (row.length !== level.width) fail(level, `row ${y} is ${row.length} chars, width says ${level.width}`);
    for (const ch of row) if (!LEGEND[ch]) fail(level, `illegal map character "${ch}" on row ${y}`);
  });

  let maze;
  try {
    maze = new Maze(level);
  } catch (err) {
    fail(level, err.message);
    continue;
  }

  // ── Population ────────────────────────────────────────────────────────────
  const playerSpawns = level.map.join('').split('P').length - 1;
  if (playerSpawns !== 1) fail(level, `expected exactly 1 player spawn, found ${playerSpawns}`);
  if (maze.droneSpawns.length === 0) fail(level, 'no drone spawns');
  if (maze.nodesRemaining < 40) warn(level, `only ${maze.nodesRemaining} energy nodes — level may end too fast`);
  if (maze.terminals.length !== (level.shifts || []).length) {
    fail(level, `${maze.terminals.length} terminals vs ${(level.shifts || []).length} shift definitions`);
  }
  for (const s of level.shifts || []) {
    if (!SHIFT_BEHAVIOURS[s.type]) fail(level, `unknown shift type "${s.type}"`);
  }

  // Nothing may spawn inside a wall.
  if (!maze.walkable(maze.playerSpawn.x, maze.playerSpawn.y)) fail(level, 'player spawn is not walkable');
  for (const d of maze.droneSpawns) {
    if (!maze.walkable(d.x, d.y)) fail(level, `drone spawn ${d.x},${d.y} is not walkable`);
  }

  // ── Base connectivity ─────────────────────────────────────────────────────
  const verdict = maze.validateFrom(maze.playerSpawn.x, maze.playerSpawn.y);
  if (!verdict.ok) fail(level, `base maze is not completable — ${verdict.reason}`);

  const seen = reachableSet(
    maze.grid,
    maze.width,
    maze.height,
    maze.idx(maze.playerSpawn.x, maze.playerSpawn.y),
    new Uint8Array(maze.grid.length)
  );
  for (const d of maze.droneSpawns) {
    if (!seen[maze.idx(d.x, d.y)]) warn(level, `drone spawn ${d.x},${d.y} starts in an isolated pocket`);
  }

  // Bare floor that nothing can ever reach is a level-design smell.
  let orphanFloor = 0;
  for (let i = 0; i < maze.grid.length; i++) {
    if (isWalkable(maze.grid[i]) && !seen[i] && !maze.secretNodes[i]) orphanFloor++;
  }
  if (orphanFloor > 0) warn(level, `${orphanFloor} walkable tiles are unreachable and hold nothing`);

  // ── Secret compartments ───────────────────────────────────────────────────
  for (const secret of maze.secrets) {
    let bonus = 0;
    let reachableNow = false;
    for (let y = secret.y; y < secret.y + secret.h; y++) {
      for (let x = secret.x; x < secret.x + secret.w; x++) {
        const i = maze.idx(x, y);
        if (maze.secretNodes[i]) bonus++;
        if (seen[i]) reachableNow = true;
      }
    }
    if (bonus === 0) fail(level, `secret "${secret.name}" contains no bonus nodes`);
    if (reachableNow) warn(level, `secret "${secret.name}" is open from the start`);
  }

  const sealTiles = [];
  for (let i = 0; i < maze.grid.length; i++) if (maze.grid[i] === TILE.SECRET) sealTiles.push(i);
  if (sealTiles.length && !(level.shifts || []).some((s) => JSON.stringify(s).includes('"reveal"'))) {
    fail(level, 'map has sealed bulkheads but no reveal terminal to breach them');
  }

  // ── Shift definitions do not collide ──────────────────────────────────────
  const rotCells = new Set();
  const rotOwner = new Map();
  (level.shifts || []).forEach((s, si) => {
    for (const key of rotationCells(s)) {
      rotCells.add(key);
      if (!rotOwner.has(key)) rotOwner.set(key, si);
    }
  });
  (level.shifts || []).forEach((s, si) => {
    for (const key of fixedCells(s)) {
      if (rotCells.has(key) && rotOwner.get(key) !== si) {
        fail(level, `shift ${si} writes tile ${key}, which shift ${rotOwner.get(key)} rotates — the two would fight`);
      }
    }
  });

  // ── Exhaustive shift safety ───────────────────────────────────────────────
  const proof = proveShiftSafety(maze);
  if (!proof.ok) for (const p of proof.problems) fail(level, p);

  // ── After all that, the maze must be back exactly as authored ─────────────
  const after = maze.validateFrom(maze.playerSpawn.x, maze.playerSpawn.y);
  if (!after.ok) fail(level, `safety proof left the maze dirty — ${after.reason}`);

  const shiftNames = (level.shifts || []).map((s) => s.label || s.type).join(', ') || 'none';
  console.log(
    `  ✓ ${level.id} ${level.name.padEnd(15)} ${String(maze.nodesRemaining).padStart(3)} nodes · ` +
      `${maze.droneSpawns.length} drones · ${maze.secrets.length} secrets · ` +
      `${proof.statesChecked} shift states · ${shiftNames}`
  );
}

console.log('');
if (failures) {
  console.error(`FAILED — ${failures} problem${failures === 1 ? '' : 's'}, ${warnings} warning(s)`);
  process.exit(1);
}
console.log(`All ${LEVELS.length} levels valid. ${warnings} warning(s).`);
