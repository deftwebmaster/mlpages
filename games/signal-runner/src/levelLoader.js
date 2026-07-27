/**
 * levelLoader.js — Turns a level *definition* into a runnable level.
 *
 * Definitions are plain data (see src/levels.js). The loader clones them,
 * fills in defaults, builds the lookup tables the engine needs, and — during
 * development — validates the result loudly. The engine never reads a level
 * definition directly, so new levels can be added without touching engine
 * code.
 */

import { CONFIG, POLARITY } from './config.js';
import { LANE_TYPES, initLaneRuntime } from './lanes.js';
import { maxObjectSize } from './laneObjects.js';

const MOVING_TYPES = new Set(['packet', 'platform', 'relay', 'pulse', 'corruption']);
const VALID_POLARITIES = new Set([POLARITY.CYAN, POLARITY.VIOLET, null, undefined]);

/** Development builds get loud validation; production stays quiet. */
export const IS_DEV =
  typeof location !== 'undefined' &&
  /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname || '');

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function prepareLevel(definition) {
  const level = clone(definition);

  level.rows = level.rows ?? CONFIG.grid.rows;
  level.cols = level.cols ?? CONFIG.grid.cols;
  level.targetTime = level.targetTime ?? 45;
  level.difficulty = level.difficulty ?? 1;
  level.backgroundVariant = level.backgroundVariant ?? 0;
  level.playerStart = level.playerStart ?? { row: level.rows - 1, col: Math.floor(level.cols / 2) };
  level.uplinks = (level.uplinks ?? [{ col: Math.floor(level.cols / 2) }]).map((u, i) => ({
    col: u.col,
    row: u.row ?? 0,
    slot: i,
  }));
  level.collectibles = (level.collectibles ?? []).map((c, i) => ({
    row: c.row,
    col: c.col,
    id: i,
  }));
  level.tutorialPrompts = level.tutorialPrompts ?? [];
  level.walls = level.walls ?? [];

  // --- Lane table ---------------------------------------------------------
  const declared = level.lanes ?? [];
  const byRow = new Array(level.rows);
  for (const lane of declared) {
    if (lane.row < 0 || lane.row >= level.rows) continue;
    byRow[lane.row] = lane;
  }
  const lanes = [];
  for (let row = 0; row < level.rows; row++) {
    if (!byRow[row]) {
      byRow[row] = { row, type: row === 0 ? 'terminal' : 'safe' };
    } else if (row === 0) {
      byRow[row].type = 'terminal';
    }
    const lane = byRow[row];
    lane.row = row;
    if (MOVING_TYPES.has(lane.type)) {
      lane.speed = lane.speed ?? 1.5;
      lane.spacing = lane.spacing ?? 5;
      lane.size = lane.size ?? 1;
      lane.direction = lane.direction ?? 1;
      lane.offset = lane.offset ?? 0;
    }
    lanes.push(lane);
  }
  level.lanes = lanes;
  level.laneByRow = byRow;

  // --- Lookup tables ------------------------------------------------------
  level.uplinkByCol = Object.create(null);
  for (const u of level.uplinks) level.uplinkByCol[u.col] = u.slot;

  level.wallSet = new Set(level.walls.map((w) => w.row * 100 + w.col));

  initLaneRuntime(level);

  if (IS_DEV) {
    const problems = validateLevel(level);
    for (const p of problems) console.warn(`[level ${level.id}] ${p}`);
  }

  return level;
}

/**
 * Structural checks. These catch the mistakes that make a level unplayable in
 * ways that are hard to see by eye. Route-level solvability is proved
 * separately and offline by tools/validate-levels.mjs.
 */
export function validateLevel(level) {
  const problems = [];
  const add = (msg) => problems.push(msg);

  if (!level.id) add('missing id');
  if (!level.name) add('missing name');
  if (level.rows < 5 || level.cols < 5) add('grid is too small to be playable');

  const start = level.playerStart;
  if (start.row < 0 || start.row >= level.rows) add('playerStart.row out of range');
  if (start.col < 0 || start.col >= level.cols) add('playerStart.col out of range');
  const startLane = level.laneByRow[start.row];
  if (startLane && startLane.type !== 'safe') {
    add(`playerStart sits on a "${startLane.type}" lane — spawn rows must be safe`);
  }

  if (!level.uplinks.length) add('level has no uplinks');
  for (const u of level.uplinks) {
    if (u.col < 0 || u.col >= level.cols) add(`uplink column ${u.col} out of range`);
    if (u.row !== 0) add(`uplink at row ${u.row}; uplinks belong on row 0`);
  }
  const uplinkCols = new Set(level.uplinks.map((u) => u.col));
  if (uplinkCols.size !== level.uplinks.length) add('two uplinks share a column');

  for (const lane of level.lanes) {
    const where = `row ${lane.row}`;
    if (!LANE_TYPES.includes(lane.type)) {
      add(`${where}: unknown lane type "${lane.type}"`);
      continue;
    }
    if (!VALID_POLARITIES.has(lane.polarity ?? null)) {
      add(`${where}: invalid polarity "${lane.polarity}"`);
    }
    if (lane.polarities) {
      for (const p of lane.polarities) {
        if (!VALID_POLARITIES.has(p)) add(`${where}: invalid polarity "${p}" in polarities`);
      }
    }

    if (MOVING_TYPES.has(lane.type)) {
      if (!(lane.spacing > 0)) add(`${where}: spacing must be positive`);
      if (!(lane.speed >= 0)) add(`${where}: speed must be zero or positive`);
      if (lane.direction !== 1 && lane.direction !== -1) {
        add(`${where}: direction must be 1 or -1`);
      }
      const size = maxObjectSize(lane);
      if (size >= lane.spacing) {
        add(`${where}: objects (${size}) are wider than their spacing (${lane.spacing})`);
      }
      const gap = lane.spacing - size;
      if (lane.type === 'packet' || lane.type === 'pulse' || lane.type === 'corruption') {
        if (gap < 1.4) add(`${where}: gap of ${gap.toFixed(2)} cells is too tight to stand in`);
      }
      if (lane.type === 'platform' || lane.type === 'relay') {
        // Coverage below ~40% makes a void row a coin flip rather than a read.
        const coverage = size / lane.spacing;
        if (coverage < 0.38) {
          add(`${where}: platform coverage ${(coverage * 100).toFixed(0)}% is too sparse`);
        }
        if (size < 2) add(`${where}: platforms should be at least 2 cells wide`);
      }
    }

    if (lane.type === 'scanner') {
      if (lane.pattern && !['sweep', 'blink', 'segments'].includes(lane.pattern)) {
        add(`${where}: unknown scanner pattern "${lane.pattern}"`);
      }
      if (lane.pattern === 'blink' || lane.pattern === 'segments') {
        const duty = lane.duty ?? 0.34;
        if (duty >= 0.85) add(`${where}: scanner duty ${duty} leaves almost no safe window`);
        if ((lane.cycle ?? 2.6) < 0.8) add(`${where}: scanner cycle is too fast to read`);
      }
      if (lane.pattern === 'sweep' && !(lane.spacing > 0)) {
        add(`${where}: sweep scanners need spacing`);
      }
    }

    if (lane.type === 'gate') {
      if (!Array.isArray(lane.cells) || !lane.cells.length) {
        add(`${where}: gate lane has no cells`);
      } else {
        const open = level.cols - lane.cells.length;
        if (open <= 0 && (lane.mode ?? 'toggle') === 'toggle') {
          const duty = lane.duty ?? 0.5;
          if (duty >= 0.9) add(`${where}: gate row is sealed for ${duty * 100}% of its cycle`);
        }
        for (const cell of lane.cells) {
          const col = typeof cell === 'number' ? cell : cell.col;
          if (col < 0 || col >= level.cols) add(`${where}: gate column ${col} out of range`);
        }
      }
    }

    if (lane.type === 'corruption' && (lane.trail ?? 0) > 2.5) {
      add(`${where}: corruption trail of ${lane.trail}s is longer than a lane pass`);
    }
  }

  // Nothing lethal may share the spawn cell at t = 0.
  const spawnLane = level.laneByRow[start.row];
  if (spawnLane && spawnLane.type !== 'safe') {
    add('spawn row is not a safe zone');
  }

  for (const c of level.collectibles) {
    if (c.row < 0 || c.row >= level.rows) add(`collectible row ${c.row} out of range`);
    if (c.col < 0 || c.col >= level.cols) add(`collectible column ${c.col} out of range`);
    if (c.row === 0) add('collectible placed on the terminal row');
  }

  return problems;
}
