/**
 * The authoritative board model.
 *
 * The DOM never holds game state — it only ever mirrors this grid. Every
 * structural change ends with reindex() so each node knows its own row/col,
 * which the renderer and the ARIA labels both read.
 */

import { CONFIG, NODE_TYPES, SPECIAL } from './config.js';
import { hasMatchAt, hasAnyMatch } from './matches.js';
import { pick, randInt, shuffle, key } from './utils.js';

const TYPE_IDS = NODE_TYPES.slice(0, CONFIG.NODE_TYPE_COUNT).map((t) => t.id);

export class Board {
  constructor(rows = CONFIG.BOARD_ROWS, cols = CONFIG.BOARD_COLUMNS) {
    this.rows = rows;
    this.cols = cols;
    this.nextId = 1;
    this.grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  }

  /* ---------------- basics ---------------- */

  createNode(type, special = null) {
    return { id: this.nextId++, type, special, row: -1, col: -1 };
  }

  at(row, col) {
    if (row < 0 || col < 0 || row >= this.rows || col >= this.cols) return null;
    return this.grid[row][col];
  }

  set(row, col, node) {
    this.grid[row][col] = node;
    if (node) {
      node.row = row;
      node.col = col;
    }
  }

  reindex() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const node = this.grid[r][c];
        if (node) {
          node.row = r;
          node.col = c;
        }
      }
    }
  }

  forEachNode(fn) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const node = this.grid[r][c];
        if (node) fn(node, r, c);
      }
    }
  }

  allNodes() {
    const out = [];
    this.forEachNode((node) => out.push(node));
    return out;
  }

  randomType() {
    return pick(TYPE_IDS);
  }

  /**
   * A type that cannot complete a run of three with the cells already placed
   * above or to the left. Used for the initial board and for reshuffles.
   */
  safeTypeAt(row, col) {
    const banned = new Set();
    const left1 = this.at(row, col - 1);
    const left2 = this.at(row, col - 2);
    if (left1 && left2 && left1.type === left2.type) banned.add(left1.type);
    const up1 = this.at(row - 1, col);
    const up2 = this.at(row - 2, col);
    if (up1 && up2 && up1.type === up2.type) banned.add(up1.type);
    const pool = TYPE_IDS.filter((t) => !banned.has(t));
    return pick(pool.length ? pool : TYPE_IDS);
  }

  /* ---------------- generation ---------------- */

  /** Fresh board: no starting matches, and guaranteed to have a legal move. */
  generate() {
    for (let attempt = 0; attempt < 60; attempt++) {
      this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          this.set(r, c, this.createNode(this.safeTypeAt(r, c)));
        }
      }
      if (!hasAnyMatch(this.grid) && this.findPossibleMove()) return true;
    }
    // Extremely unlikely; guarantee a playable board by forcing a legal move in.
    this.forceLegalMove();
    return true;
  }

  /** Last-resort repair: plant a horizontal pair plus a swappable third node. */
  forceLegalMove() {
    const type = this.randomType();
    const other = TYPE_IDS.find((t) => t !== type);
    const r = this.rows - 1;
    this.set(r, 0, this.createNode(type));
    this.set(r, 1, this.createNode(type));
    this.set(r, 2, this.createNode(other));
    this.set(r - 1, 2, this.createNode(type));
    this.set(r, 3, this.createNode(other === TYPE_IDS[0] ? TYPE_IDS[1] : TYPE_IDS[0]));
  }

  /* ---------------- moves ---------------- */

  static isAdjacent(a, b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
  }

  swap(a, b) {
    const nodeA = this.grid[a.row][a.col];
    const nodeB = this.grid[b.row][b.col];
    this.set(a.row, a.col, nodeB);
    this.set(b.row, b.col, nodeA);
  }

  /** Would swapping these two cells create at least one match? */
  swapCreatesMatch(a, b) {
    if (!this.at(a.row, a.col) || !this.at(b.row, b.col)) return false;
    this.swap(a, b);
    const ok = hasMatchAt(this.grid, a.row, a.col) || hasMatchAt(this.grid, b.row, b.col);
    this.swap(a, b);
    return ok;
  }

  /** First legal swap found, or null when the board is deadlocked. */
  findPossibleMove() {
    // A Wildcard Core discharges on contact, so a board holding one always has
    // a legal move even if nothing can be lined up.
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const node = this.grid[r][c];
        if (!node || node.special !== SPECIAL.WILDCARD) continue;
        const a = { row: r, col: c };
        if (c + 1 < this.cols) return { a, b: { row: r, col: c + 1 } };
        if (c > 0) return { a, b: { row: r, col: c - 1 } };
        if (r + 1 < this.rows) return { a, b: { row: r + 1, col: c } };
        if (r > 0) return { a, b: { row: r - 1, col: c } };
      }
    }

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (c + 1 < this.cols) {
          const a = { row: r, col: c };
          const b = { row: r, col: c + 1 };
          if (this.swapCreatesMatch(a, b)) return { a, b };
        }
        if (r + 1 < this.rows) {
          const a = { row: r, col: c };
          const b = { row: r + 1, col: c };
          if (this.swapCreatesMatch(a, b)) return { a, b };
        }
      }
    }
    return null;
  }

  /* ---------------- clearing, gravity, refill ---------------- */

  /** Empties the given cells. Returns the removed node objects. */
  clearCells(cells) {
    const removed = [];
    cells.forEach(({ row, col }) => {
      const node = this.grid[row][col];
      if (node) {
        removed.push(node);
        this.grid[row][col] = null;
      }
    });
    return removed;
  }

  /**
   * The cells a special node discharges.
   *
   * `targetType` only applies to the Wildcard Core: when it is swapped onto a
   * standard node it takes that node's type, and the sentinel '*' (two
   * Wildcards swapped together) wipes the whole board.
   */
  blastCells(row, col, node, targetType = null) {
    const special = node && node.special;
    const cells = [];

    if (special === SPECIAL.LINE_H) {
      for (let c = 0; c < this.cols; c++) cells.push({ row, col: c });
      return cells;
    }

    if (special === SPECIAL.LINE_V) {
      for (let r = 0; r < this.rows; r++) cells.push({ row: r, col });
      return cells;
    }

    if (special === SPECIAL.BOMB) {
      for (let r = Math.max(0, row - 1); r <= Math.min(this.rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(this.cols - 1, col + 1); c++) {
          cells.push({ row: r, col: c });
        }
      }
      return cells;
    }

    if (special === SPECIAL.WILDCARD) {
      const wanted = targetType || node.type;
      cells.push({ row, col }); // the core always goes with it
      this.forEachNode((other, r, c) => {
        if (r === row && c === col) return;
        if (wanted === '*' || other.type === wanted) cells.push({ row: r, col: c });
      });
      return cells;
    }

    return cells;
  }

  /** How many rows and columns are entirely inside the given cleared set. */
  countFullLines(clearedKeys) {
    let count = 0;
    for (let r = 0; r < this.rows; r++) {
      let full = true;
      for (let c = 0; c < this.cols; c++) {
        if (!clearedKeys.has(key(r, c))) { full = false; break; }
      }
      if (full) count++;
    }
    for (let c = 0; c < this.cols; c++) {
      let full = true;
      for (let r = 0; r < this.rows; r++) {
        if (!clearedKeys.has(key(r, c))) { full = false; break; }
      }
      if (full) count++;
    }
    return count;
  }

  placeNode(row, col, type, special = null) {
    const node = this.createNode(type, special);
    this.set(row, col, node);
    return node;
  }

  /**
   * Drops surviving nodes and generates replacements for the gap at the top of
   * each column. Spawned nodes carry a negative `spawnRow` so the renderer can
   * animate them in from just above the board.
   */
  collapse() {
    const falls = [];
    const spawns = [];

    for (let c = 0; c < this.cols; c++) {
      let write = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        const node = this.grid[r][c];
        if (!node) continue;
        if (r !== write) {
          this.grid[write][c] = node;
          this.grid[r][c] = null;
          falls.push({ node, fromRow: r, toRow: write, col: c });
        }
        write--;
      }
      const emptyCount = write + 1;
      for (let i = 0; i < emptyCount; i++) {
        const row = write - i;
        const node = this.createNode(this.randomType());
        this.grid[row][c] = node;
        spawns.push({ node, row, col: c, spawnRow: row - emptyCount });
      }
    }

    this.reindex();
    return { falls, spawns };
  }

  /* ---------------- deadlock recovery ---------------- */

  /**
   * Rearranges the existing nodes (keeping their identities so the shuffle can
   * be animated) into a layout with no immediate matches and at least one move.
   * Falls back to re-typing the board if shuffling cannot find one.
   */
  reshuffle() {
    const nodes = this.allNodes();

    for (let attempt = 0; attempt < 80; attempt++) {
      shuffle(nodes);
      let i = 0;
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          this.set(r, c, nodes[i++]);
        }
      }
      if (!hasAnyMatch(this.grid) && this.findPossibleMove()) {
        return { rebuilt: false };
      }
    }

    // Shuffling failed (possible with an unlucky type distribution): re-type in
    // place, keeping node identities so nothing pops out of the DOM.
    for (let guard = 0; guard < 60; guard++) {
      let i = 0;
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const node = nodes[i++];
          node.special = null;
          this.set(r, c, node);
          node.type = this.safeTypeAt(r, c);
        }
      }
      if (!hasAnyMatch(this.grid) && this.findPossibleMove()) return { rebuilt: true };
    }

    this.forceLegalMove();
    return { rebuilt: true };
  }

  /** Debug/testing helper: a compact string view of the grid. */
  toString() {
    return this.grid
      .map((row) => row.map((n) => (n ? n.type[0].toUpperCase() : '.')).join(' '))
      .join('\n');
  }
}

export { TYPE_IDS, randInt };
