/**
 * entity.js — Shared tile-locked movement.
 *
 * Both the player and the drones move one tile at a time but render
 * continuously: an entity always owns a tile (`tx`,`ty`) and, while moving,
 * a destination (`nx`,`ny`) with a normalised progress. Decisions are only ever
 * made at tile centres, which is what keeps collision, collection and AI
 * perfectly deterministic regardless of frame rate.
 */

import { DIR, DIR_VEC, opposite } from './config.js';

export class GridMover {
  constructor(maze, x, y) {
    this.maze = maze;
    this.teleport(x, y);
    this.speed = 6;
  }

  /** Snaps the entity onto a tile, cancelling any movement in flight. */
  teleport(x, y) {
    this.tx = x;
    this.ty = y;
    this.nx = x;
    this.ny = y;
    this.progress = 0;
    this.dir = DIR.NONE;
  }

  /** Interpolated position in tile space (tile centres are at integers). */
  get px() {
    return this.tx + (this.nx - this.tx) * this.progress;
  }

  get py() {
    return this.ty + (this.ny - this.ty) * this.progress;
  }

  get moving() {
    return this.dir !== DIR.NONE && (this.nx !== this.tx || this.ny !== this.ty);
  }

  canEnter(dir) {
    if (dir < 0) return false;
    const v = DIR_VEC[dir];
    return this.maze.walkable(this.tx + v.x, this.ty + v.y);
  }

  /** Begins a step in `dir`, assuming it is legal. */
  startMove(dir) {
    const v = DIR_VEC[dir];
    this.dir = dir;
    this.nx = this.tx + v.x;
    this.ny = this.ty + v.y;
    this.progress = 0;
  }

  /**
   * Flips direction mid-tile without waiting for the next centre — this is what
   * makes the controls feel immediate rather than grid-laggy.
   */
  reverse() {
    if (!this.moving) return false;
    const t = this.tx;
    this.tx = this.nx;
    this.nx = t;
    const ty = this.ty;
    this.ty = this.ny;
    this.ny = ty;
    this.progress = 1 - this.progress;
    this.dir = opposite(this.dir);
    return true;
  }

  /**
   * Advances by `dt` seconds, calling `onArrive(entity)` at each tile centre.
   * `onArrive` must set up the next step (via `startMove`) or leave the entity
   * stationary.
   *
   * @param {number} dt seconds
   * @param {(self:GridMover)=>void} onArrive
   */
  step(dt, onArrive) {
    // A stationary entity still gets a decision tick so it can start again
    // (e.g. a drone that was walled in by a shift and is now free).
    if (!this.moving) {
      onArrive(this);
      if (!this.moving) return;
    }

    let budget = this.speed * dt;
    let guard = 0;
    while (budget > 0 && guard++ < 8) {
      const remaining = 1 - this.progress;
      if (budget < remaining) {
        this.progress += budget;
        budget = 0;
      } else {
        budget -= remaining;
        this.tx = this.nx;
        this.ty = this.ny;
        this.progress = 0;
        this.dir = DIR.NONE;
        onArrive(this);
        if (!this.moving) break;
      }
    }
  }

  /** Squared distance in tile space — used for the catch test. */
  distSqTo(other) {
    const dx = this.px - other.px;
    const dy = this.py - other.py;
    return dx * dx + dy * dy;
  }
}
