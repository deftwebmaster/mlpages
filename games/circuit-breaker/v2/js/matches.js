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
export function expandActivations(board, matchedCells) {
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
    activations.push({ row: cell.row, col: cell.col, special: node.special, type: node.type });

    board.lineCells(cell.row, cell.col, node.special).forEach((lineCell) => {
      const target = board.at(lineCell.row, lineCell.col);
      if (!target) return;
      const id = key(lineCell.row, lineCell.col);
      if (!keys.has(id)) {
        keys.add(id);
        cells.push(lineCell);
      }
      if (target.special && !queued.has(id)) {
        queued.add(id);
        queue.push(lineCell);
      }
    });
  }

  return { cells, activations, keys };
}

/**
 * Which special nodes this resolution earns.
 *
 * A run of exactly four forges a Line Breaker oriented along the run. It is
 * placed on the cell the player moved when that cell is part of the run,
 * otherwise on the centre-most cell of the run (deterministic for cascades).
 *
 * Longer runs and L/T intersections are deliberately left alone — they are
 * reserved for the Wildcard Core and Pulse Bomb in a later phase.
 */
export function planSpecials(groups, originCells = []) {
  if (!CONFIG.FEATURES.specials) return [];
  const origins = new Set(originCells.map((c) => key(c.row, c.col)));
  const taken = new Set();
  const plans = [];

  groups.forEach((group) => {
    if (group.length !== 4) return;
    const host = group.cells.find((cell) => origins.has(key(cell.row, cell.col)))
      || group.cells[Math.floor((group.cells.length - 1) / 2)];
    const id = key(host.row, host.col);
    if (taken.has(id)) return;
    taken.add(id);
    plans.push({
      row: host.row,
      col: host.col,
      type: group.type,
      special: group.orientation === 'h' ? SPECIAL.LINE_H : SPECIAL.LINE_V,
    });
  });

  return plans;
}
