/**
 * maze.js — The playfield: tile grid plus the collectables and fixtures on it.
 *
 * Levels are authored as ASCII art (see `levels.js`) because handcrafting 15
 * mazes in coordinate lists would be unreadable and error-prone. This module
 * owns the parse step and every mutation the Grid Shift system performs.
 *
 * `version` increments on every structural change; pathfinding caches compare
 * against it to know when to rebuild.
 */

import { TILE, isWalkable } from './config.js';
import { reachableSet } from './pathfinding.js';

/**
 * Level map legend. Each character maps to a tile plus optional contents.
 * Keep this table in sync with the authoring notes in `levels.js`.
 */
export const LEGEND = {
  '#': { tile: TILE.WALL },
  ' ': { tile: TILE.FLOOR },
  '.': { tile: TILE.FLOOR, node: true },
  o: { tile: TILE.FLOOR, power: true },
  P: { tile: TILE.FLOOR, playerSpawn: true },
  H: { tile: TILE.FLOOR, drone: 'hunter' },
  I: { tile: TILE.FLOOR, drone: 'interceptor' },
  N: { tile: TILE.FLOOR, drone: 'sentinel' },
  T: { tile: TILE.FLOOR, drone: 'tracker' },
  W: { tile: TILE.FLOOR, drone: 'wanderer' },
  S: { tile: TILE.FLOOR, terminal: true },
  '=': { tile: TILE.GATE_CLOSED },
  '-': { tile: TILE.GATE_OPEN },
  '~': { tile: TILE.BRIDGE_OFF },
  '%': { tile: TILE.SECRET },
  '*': { tile: TILE.FLOOR, node: true, secretNode: true },
};

export class Maze {
  /**
   * @param {object} level a level definition from `levels.js`
   */
  constructor(level) {
    this.level = level;
    const rows = level.map;
    this.height = rows.length;
    this.width = rows[0].length;
    const size = this.width * this.height;

    this.grid = new Uint8Array(size);
    /** Tile ids as authored — used to reset and to resolve slide origins. */
    this.baseGrid = new Uint8Array(size);
    /** 1 where an energy node is currently present. */
    this.nodes = new Uint8Array(size);
    /** 1 where a *secret* (optional) node is present. */
    this.secretNodes = new Uint8Array(size);
    /** 1 where a power module is currently present. */
    this.powers = new Uint8Array(size);

    this.nodesRemaining = 0;
    this.secretNodesRemaining = 0;
    this.powersRemaining = 0;

    this.playerSpawn = { x: 1, y: 1 };
    /** @type {{x:number,y:number,personality:string}[]} */
    this.droneSpawns = [];
    /** @type {{x:number,y:number,index:number,shift:object,used:boolean}[]} */
    this.terminals = [];
    /** @type {{x:number,y:number,w:number,h:number,found:boolean,name:string}[]} */
    this.secrets = [];

    /** Bumped on every structural change so caches can invalidate. */
    this.version = 0;
    /** Scratch buffer for validation flood fills. */
    this._scratch = new Uint8Array(size);
    /** Bridges currently extended: { cells, expires }. */
    this.activeBridges = [];

    this._parse(rows, level);
  }

  // ── Indexing helpers ──────────────────────────────────────────────────────
  idx(x, y) {
    return y * this.width + x;
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  tileAt(x, y) {
    return this.inBounds(x, y) ? this.grid[y * this.width + x] : TILE.WALL;
  }

  /** True when an entity may stand on (x, y). */
  walkable(x, y) {
    return this.inBounds(x, y) && isWalkable(this.grid[y * this.width + x]);
  }

  // ── Parsing ───────────────────────────────────────────────────────────────
  _parse(rows, level) {
    const terminalCells = [];
    for (let y = 0; y < this.height; y++) {
      const row = rows[y];
      for (let x = 0; x < this.width; x++) {
        const ch = row[x];
        const entry = LEGEND[ch];
        if (!entry) {
          throw new Error(`Level "${level.id}": unknown map character "${ch}" at ${x},${y}`);
        }
        const i = this.idx(x, y);
        this.grid[i] = entry.tile;
        this.baseGrid[i] = entry.tile;

        if (entry.node) {
          if (entry.secretNode) {
            this.secretNodes[i] = 1;
            this.secretNodesRemaining++;
          } else {
            this.nodes[i] = 1;
            this.nodesRemaining++;
          }
        }
        if (entry.power) {
          this.powers[i] = 1;
          this.powersRemaining++;
        }
        if (entry.playerSpawn) this.playerSpawn = { x, y };
        if (entry.drone) this.droneSpawns.push({ x, y, personality: entry.drone });
        if (entry.terminal) terminalCells.push({ x, y });
      }
    }

    // Terminals are matched to `level.shifts` in reading order (top-to-bottom,
    // left-to-right) so the map stays the single source of truth for position.
    const shifts = level.shifts || [];
    terminalCells.forEach((cell, index) => {
      const shift = shifts[index];
      if (!shift) {
        throw new Error(
          `Level "${level.id}": terminal #${index + 1} at ${cell.x},${cell.y} has no matching entry in shifts[]`
        );
      }
      this.terminals.push({ ...cell, index, shift, used: false, state: 0 });
    });
    if (shifts.length > terminalCells.length) {
      throw new Error(
        `Level "${level.id}": ${shifts.length} shifts defined but only ${terminalCells.length} "S" terminals on the map`
      );
    }

    this.secrets = (level.secrets || []).map((s, i) => ({
      ...s,
      found: false,
      name: s.name || `Sector ${String.fromCharCode(65 + i)}`,
    }));
  }

  // ── Collectables ──────────────────────────────────────────────────────────
  /** Removes and reports whatever the player picked up at (x, y). */
  collect(x, y) {
    const i = this.idx(x, y);
    const out = { node: false, secretNode: false, power: false };
    if (this.nodes[i]) {
      this.nodes[i] = 0;
      this.nodesRemaining--;
      out.node = true;
    }
    if (this.secretNodes[i]) {
      this.secretNodes[i] = 0;
      this.secretNodesRemaining--;
      out.secretNode = true;
    }
    if (this.powers[i]) {
      this.powers[i] = 0;
      this.powersRemaining--;
      out.power = true;
    }
    return out;
  }

  get cleared() {
    return this.nodesRemaining === 0;
  }

  /** Terminal standing on (x, y), if any. */
  terminalAt(x, y) {
    for (const t of this.terminals) if (t.x === x && t.y === y) return t;
    return null;
  }

  /** Secret region containing (x, y) that has not been found yet. */
  undiscoveredSecretAt(x, y) {
    for (const s of this.secrets) {
      if (s.found) continue;
      if (x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h) return s;
    }
    return null;
  }

  // ── Mutation ──────────────────────────────────────────────────────────────
  /**
   * Applies a set of tile writes and bumps the version.
   * @param {{i:number, tile:number}[]} writes
   */
  applyWrites(writes) {
    for (const w of writes) this.grid[w.i] = w.tile;
    this.version++;
  }

  /** Snapshot of everything a shift can alter, for validation and rollback. */
  snapshot() {
    return {
      grid: this.grid.slice(),
      nodes: this.nodes.slice(),
      secretNodes: this.secretNodes.slice(),
      powers: this.powers.slice(),
      nodesRemaining: this.nodesRemaining,
      secretNodesRemaining: this.secretNodesRemaining,
      powersRemaining: this.powersRemaining,
    };
  }

  restore(snap) {
    this.grid.set(snap.grid);
    this.nodes.set(snap.nodes);
    this.secretNodes.set(snap.secretNodes);
    this.powers.set(snap.powers);
    this.nodesRemaining = snap.nodesRemaining;
    this.secretNodesRemaining = snap.secretNodesRemaining;
    this.powersRemaining = snap.powersRemaining;
    this.version++;
  }

  /**
   * Proves the maze is still winnable from `start`.
   *
   * A maze is valid when, flood-filling from the player's tile, every
   * *required* energy node, every power module and every shift terminal is
   * reachable. Secret nodes are deliberately excluded: sealing a bonus room is
   * a legal (and sometimes intended) consequence of a shift.
   *
   * @param {number} startX
   * @param {number} startY
   * @returns {{ok:boolean, reason?:string}}
   */
  validateFrom(startX, startY) {
    if (!this.walkable(startX, startY)) {
      return { ok: false, reason: 'player would be inside a wall' };
    }
    const seen = reachableSet(this.grid, this.width, this.height, this.idx(startX, startY), this._scratch);

    for (let i = 0; i < this.grid.length; i++) {
      if (this.nodes[i] && !seen[i]) return { ok: false, reason: 'an energy node would be sealed off' };
      if (this.powers[i] && !seen[i]) return { ok: false, reason: 'a power module would be sealed off' };
    }
    for (const t of this.terminals) {
      if (!seen[this.idx(t.x, t.y)]) return { ok: false, reason: 'a shift terminal would be unreachable' };
    }
    return { ok: true };
  }

  /** Convenience for the offline level linter. */
  reachableFrom(x, y) {
    return reachableSet(this.grid, this.width, this.height, this.idx(x, y), new Uint8Array(this.grid.length));
  }
}
