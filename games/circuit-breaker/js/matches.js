/**
 * Match detection.
 *
 * Nodes match purely on `type`, so a special node still participates in (and is
 * consumed by) an ordinary match — that is how specials get activated. Detection
 * returns *groups* (one per straight run) plus a deduplicated cell set, so an
 * L/T intersection scores each run once but never clears a tile twice.
 */

import { CONFIG, SPECIAL } from './config.js';
import { key } from './utils.js';

function makeGroup(type, orientation, cells) {
  return { type, orientation, cells, length: cells.length };
}

/** All straight runs of MIN_MATCH or more same-type nodes. */
export function findMatchGroups(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const groups = [];

  for (let r = 0; r < rows; r++) {
    let start = 0;
    for (let c = 1; c <= cols; c++) {
      const prev = grid[r][c - 1];
      const cur = c < cols ? grid[r][c] : null;
      if (!prev || !cur || cur.type !== prev.type) {
        const len = c - start;
        if (prev && len >= CONFIG.MIN_MATCH) {
          const cells = [];
          for (let i = start; i < c; i++) cells.push({ row: r, col: i });
          groups.push(makeGroup(prev.type, 'h', cells));
        }
        start = c;
      }
    }
  }

  for (let c = 0; c < cols; c++) {
    let start = 0;
    for (let r = 1; r <= rows; r++) {
      const prev = grid[r - 1][c];
      const cur = r < rows ? grid[r][c] : null;
      if (!prev || !cur || cur.type !== prev.type) {
        const len = r - start;
        if (prev && len >= CONFIG.MIN_MATCH) {
          const cells = [];
          for (let i = start; i < r; i++) cells.push({ row: i, col: c });
          groups.push(makeGroup(prev.type, 'v', cells));
        }
        start = r;
      }
    }
  }

  return groups;
}

/** Deduplicated cells covered by the given groups. */
export function groupCells(groups) {
  const seen = new Map();
  groups.forEach((g) => g.cells.forEach((cell) => {
    seen.set(key(cell.row, cell.col), cell);
  }));
  return [...seen.values()];
}

/** Cheap single-cell test used by the possible-move scan. */
export function hasMatchAt(grid, row, col) {
  const node = grid[row][col];
  if (!node) return false;
  const { type } = node;
  const rows = grid.length;
  const cols = grid[0].length;

  let run = 1;
  for (let c = col - 1; c >= 0 && grid[row][c] && grid[row][c].type === type; c--) run++;
  for (let c = col + 1; c < cols && grid[row][c] && grid[row][c].type === type; c++) run++;
  if (run >= CONFIG.MIN_MATCH) return true;

  run = 1;
  for (let r = row - 1; r >= 0 && grid[r][col] && grid[r][col].type === type; r--) run++;
  for (let r = row + 1; r < rows && grid[r][col] && grid[r][col].type === type; r++) run++;
  return run >= CONFIG.MIN_MATCH;
}

export function hasAnyMatch(grid) {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] && hasMatchAt(grid, r, c)) return true;
    }
  }
  return false;
}

/**
 * Walks the chain of Line Breakers caught in a resolution.
 *
 * A breaker inside the cleared set discharges its whole line; any breaker found
 * in that line discharges as well, until the chain runs out. Returns the full
 * cleared cell list (matches + discharged lines), the activated breakers, and
 * the key set used for full-row/column scoring.
 */
export function expandActivations(board, matchedCells, typeOverrides = null) {
  const keys = new Set(matchedCells.map((c) => key(c.row, c.col)));
  const cells = [...matchedCells];
  const activations = [];
  const queued = new Set();
  const queue = [];

  matchedCells.forEach((cell) => {
    const node = board.at(cell.row, cell.col);
    if (node && node.special) {
      queued.add(key(cell.row, cell.col));
      queue.push(cell);
    }
  });

  while (queue.length) {
    const cell = queue.shift();
    const node = board.at(cell.row, cell.col);
    if (!node || !node.special) continue;

    // A Wildcard swapped onto a standard node targets *that* node's type;
    // otherwise every special acts on its own colour.
    const override = typeOverrides ? typeOverrides.get(key(cell.row, cell.col)) : undefined;
    activations.push({
      row: cell.row,
      col: cell.col,
      special: node.special,
      type: node.type,
      targetType: override ?? node.type,
    });

    board.blastCells(cell.row, cell.col, node, override).forEach((hit) => {
      const target = board.at(hit.row, hit.col);
      if (!target) return;
      const id = key(hit.row, hit.col);
      if (!keys.has(id)) {
        keys.add(id);
        cells.push(hit);
      }
      if (target.special && !queued.has(id)) {
        queued.add(id);
        queue.push(hit);
      }
    });
  }

  return { cells, activations, keys };
}

/**
 * Groups intersecting runs into connected shapes.
 *
 * Two runs belong to the same shape when they share a cell, which only happens
 * where a horizontal and a vertical run cross. Classifying whole shapes (rather
 * than individual runs) is what stops one L-shaped match from spawning two
 * specials.
 */
export function connectedShapes(groups) {
  const cellSets = groups.map((g) => new Set(g.cells.map((c) => key(c.row, c.col))));
  const shapeOf = new Array(groups.length).fill(-1);
  const shapes = [];

  groups.forEach((_, i) => {
    if (shapeOf[i] !== -1) return;
    const index = shapes.length;
    const runs = [];
    const stack = [i];
    while (stack.length) {
      const j = stack.pop();
      if (shapeOf[j] !== -1) continue;
      shapeOf[j] = index;
      runs.push(groups[j]);
      groups.forEach((_unused, k) => {
        if (shapeOf[k] !== -1) return;
        for (const id of cellSets[k]) {
          if (cellSets[j].has(id)) { stack.push(k); return; }
        }
      });
    }
    shapes.push({ runs, type: runs[0].type });
  });

  return shapes;
}

/**
 * Where a Wildcard Core swap lands and which type it will consume, or null when
 * neither node is a Wildcard. A Wildcard discharges on contact, so this is also
 * what makes such a swap legal when it lines nothing up.
 */
export function planWildcardSwap(board, a, b) {
  if (!CONFIG.FEATURES.specials) return null;
  const nodeA = board.at(a.row, a.col);
  const nodeB = board.at(b.row, b.col);
  if (!nodeA || !nodeB) return null;
  const aWild = nodeA.special === SPECIAL.WILDCARD;
  const bWild = nodeB.special === SPECIAL.WILDCARD;
  if (!aWild && !bWild) return null;

  // Two cores together take the whole grid with them.
  if (aWild && bWild) return { row: b.row, col: b.col, targetType: '*' };

  // The core ends up in the other cell once the swap completes.
  const destination = aWild ? b : a;
  const partner = aWild ? nodeB : nodeA;
  return { row: destination.row, col: destination.col, targetType: partner.type };
}

/** The cell where two runs of a shape cross, if there is one. */
function intersectionCell(shape) {
  const seen = new Map();
  for (const run of shape.runs) {
    for (const cell of run.cells) {
      const id = key(cell.row, cell.col);
      if (seen.has(id)) return seen.get(id);
      seen.set(id, cell);
    }
  }
  return null;
}

/**
 * Which special nodes this resolution earns — at most one per connected shape.
 *
 * Rarity decides which one a shape produces:
 *   five or more in a line  → Wildcard Core
 *   crossing runs (L or T)  → Pulse Bomb
 *   exactly four in a line  → Line Breaker
 *   plain three             → nothing
 *
 * The special lands on the cell the player moved when that cell is part of the
 * shape; otherwise on the crossing point, or the centre-most cell of the
 * longest run. Both fallbacks are deterministic, so cascades are reproducible.
 */
export function planSpecials(groups, originCells = []) {
  if (!CONFIG.FEATURES.specials) return [];
  const origins = new Set(originCells.map((c) => key(c.row, c.col)));
  const taken = new Set();
  const plans = [];

  connectedShapes(groups).forEach((shape) => {
    const longest = shape.runs.reduce((a, b) => (b.length > a.length ? b : a));
    const crossing = shape.runs.length > 1 ? intersectionCell(shape) : null;

    let special = null;
    if (longest.length >= 5) special = SPECIAL.WILDCARD;
    else if (crossing) special = SPECIAL.BOMB;
    else if (longest.length === 4) special = longest.orientation === 'h' ? SPECIAL.LINE_H : SPECIAL.LINE_V;
    if (!special) return;

    const shapeCells = shape.runs.flatMap((run) => run.cells);
    const host = shapeCells.find((cell) => origins.has(key(cell.row, cell.col)))
      || crossing
      || longest.cells[Math.floor((longest.cells.length - 1) / 2)];

    const id = key(host.row, host.col);
    if (taken.has(id)) return;
    taken.add(id);
    plans.push({ row: host.row, col: host.col, type: shape.type, special });
  });

  return plans;
}
