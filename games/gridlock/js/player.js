/**
 * player.js — The energy siphon the player controls.
 *
 * Movement rules, in priority order:
 *   1. A queued turn that reverses the current heading takes effect instantly.
 *   2. Otherwise the queued turn is consumed at the next tile centre.
 *   3. Otherwise the current heading continues until a wall stops it.
 *
 * The queue expires after `INPUT_BUFFER_TIME`, so an early swipe registers but
 * a stale one never hijacks the player two junctions later.
 */

import { CFG, DIR, DIR_VEC, opposite } from './config.js';
import { GridMover } from './entity.js';

export class Player extends GridMover {
  constructor(maze) {
    super(maze, maze.playerSpawn.x, maze.playerSpawn.y);
    this.baseSpeed = CFG.PLAYER_SPEED;
    this.speed = this.baseSpeed;

    /** Queued direction awaiting a legal moment. */
    this.desiredDir = DIR.NONE;
    this.desiredAge = 0;
    /** Last heading, so the siphon keeps rolling down a corridor. */
    this.facing = DIR.RIGHT;
    /**
     * Cleared on every spawn. Until the player actually steers, the siphon
     * holds position — otherwise an idle start sends it charging down the
     * corridor and into whatever is waiting there.
     */
    this.hasInput = false;

    this.powered = false;
    this.powerTimer = 0;
    this.alive = true;
    this.deathTimer = 0;
    this.spawnTimer = 0;
    /** Seconds of spawn intangibility remaining. */
    this.invuln = CFG.SPAWN_INVULN;

    this.trailTimer = 0;
    /** Recent tile history, consumed by the Tracker drone. */
    this.history = [];
    this.pulse = 0;
  }

  /** Feeds a direction from the input layer. */
  request(dir) {
    if (dir === DIR.NONE) return;
    this.hasInput = true;
    this.desiredDir = dir;
    this.desiredAge = 0;
    // Reversing is legal anywhere in a corridor, so honour it immediately.
    if (this.moving && dir === opposite(this.dir)) {
      this.reverse();
      this.facing = dir;
      this.desiredDir = DIR.NONE;
    }
  }

  respawn() {
    this.teleport(this.maze.playerSpawn.x, this.maze.playerSpawn.y);
    this.desiredDir = DIR.NONE;
    this.facing = DIR.RIGHT;
    this.hasInput = false;
    this.alive = true;
    this.powered = false;
    this.powerTimer = 0;
    this.invuln = CFG.SPAWN_INVULN;
    this.history.length = 0;
  }

  get speedNow() {
    return this.baseSpeed * (this.powered ? CFG.PLAYER_POWER_SPEED_MULT : 1);
  }

  /** True while the siphon is still phasing in and cannot be caught. */
  get intangible() {
    return this.invuln > 0;
  }

  /** Seconds of vulnerability window left, or 0. */
  get powerRemaining() {
    return this.powerTimer;
  }

  startPower() {
    this.powered = true;
    this.powerTimer = CFG.POWER_DURATION;
  }

  /**
   * @param {number} dt seconds
   * @param {(x:number,y:number)=>void} onTile called once per tile entered
   */
  update(dt, onTile) {
    this.pulse += dt;
    this.speed = this.speedNow;

    if (this.desiredDir !== DIR.NONE) {
      this.desiredAge += dt;
      if (this.desiredAge > CFG.INPUT_BUFFER_TIME) this.desiredDir = DIR.NONE;
    }

    if (this.invuln > 0) this.invuln = Math.max(0, this.invuln - dt);

    if (this.powered) {
      this.powerTimer -= dt;
      if (this.powerTimer <= 0) {
        this.powered = false;
        this.powerTimer = 0;
      }
    }

    this.step(dt, () => this._decide(onTile));

    this.trailTimer += dt;
  }

  _decide(onTile) {
    onTile(this.tx, this.ty);
    this._recordHistory();

    if (this.desiredDir !== DIR.NONE && this.canEnter(this.desiredDir)) {
      this.facing = this.desiredDir;
      this.startMove(this.desiredDir);
      this.desiredDir = DIR.NONE;
      return;
    }
    if (this.hasInput && this.facing !== DIR.NONE && this.canEnter(this.facing)) {
      this.startMove(this.facing);
      return;
    }
    // Nose against a wall: hold position but keep the buffered turn alive so it
    // fires the instant the corridor opens (including via a Grid Shift).
    this.dir = DIR.NONE;
  }

  _recordHistory() {
    const last = this.history[this.history.length - 1];
    if (last && last.x === this.tx && last.y === this.ty) return;
    this.history.push({ x: this.tx, y: this.ty });
    if (this.history.length > 24) this.history.shift();
  }

  /**
   * Average heading over the last few tiles — the Tracker uses this to guess
   * where the player is escaping to.
   * @returns {{x:number,y:number}} a unit-ish vector
   */
  headingEstimate() {
    const h = this.history;
    if (h.length < 2) {
      const v = DIR_VEC[this.facing === DIR.NONE ? DIR.RIGHT : this.facing];
      return { x: v.x, y: v.y };
    }
    const n = Math.min(6, h.length);
    const a = h[h.length - n];
    const b = h[h.length - 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }

  /** True if a trail puff is due; resets the timer as a side effect. */
  consumeTrailTick() {
    if (this.trailTimer < CFG.TRAIL_INTERVAL) return false;
    this.trailTimer = 0;
    return true;
  }
}
