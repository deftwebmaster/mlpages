/**
 * drone.js — Autonomous security drones.
 *
 * Every drone runs the same five-state machine (patrol → chase → frightened →
 * returning → recovering); what makes them feel like distinct characters is the
 * *goal tile* each personality picks while chasing, not different code paths.
 *
 * Steering is gradient descent on a BFS distance field rebuilt a few times a
 * second (`DRONE_REPATH_HZ`) rather than every frame. A field is also rebuilt
 * immediately when `maze.version` changes, which is how drones recover from a
 * Grid Shift without ever entering an invalid state.
 */

import { CFG, DIR, DIR_VEC, DRONE_STATE, PERSONALITY, COLORS, opposite } from './config.js';
import { GridMover } from './entity.js';
import { FlowField, chooseDirection, UNREACHABLE, exitCount } from './pathfinding.js';
import { makeRng } from './utils.js';

/** Scatter corners, assigned round-robin so drones spread out while patrolling. */
const CORNERS = [
  { x: 1, y: 1 },
  { x: -2, y: 1 },
  { x: -2, y: -2 },
  { x: 1, y: -2 },
];

const ORDER_SCRATCH = [0, 1, 2, 3];

export class Drone {
  /**
   * @param {import('./maze.js').Maze} maze
   * @param {{x:number,y:number,personality:string}} spawn
   * @param {number} index ordinal, used for colour, scatter corner and stagger
   * @param {number} speed base tiles/second for this level
   */
  constructor(maze, spawn, index, speed) {
    this.maze = maze;
    this.index = index;
    this.personality = spawn.personality;
    this.spawn = { x: spawn.x, y: spawn.y };
    this.baseSpeed = speed;
    this.color = COLORS.drone[index % COLORS.drone.length];

    this.mover = new GridMover(maze, spawn.x, spawn.y);
    this.mover.speed = speed;

    this.field = new FlowField(maze.width, maze.height);
    this.repathTimer = (index * 0.037) % (1 / CFG.DRONE_REPATH_HZ); // stagger the work
    this.rng = makeRng(0x51ed + index * 7919);

    this.state = DRONE_STATE.PATROL;
    this.stateTimer = 0;
    this.goal = { x: spawn.x, y: spawn.y };
    this.forceReverse = false;
    this.alerted = false;
    this.wanderTimer = 0;
    this.patrolIndex = 0;
    this.bob = this.rng() * Math.PI * 2;
    /** Rendering-only: smoothed facing angle. */
    this.angle = 0;
    /** Set for one frame when the drone newly acquires the player. */
    this.justSpotted = false;

    const c = CORNERS[index % CORNERS.length];
    this.corner = {
      x: c.x < 0 ? maze.width + c.x : c.x,
      y: c.y < 0 ? maze.height + c.y : c.y,
    };
    /** Sentinels walk a beat between the corner and their spawn. */
    this.patrolPoints = [this.corner, { x: spawn.x, y: spawn.y }];
  }

  // Position proxies so drones and the player share one collision interface.
  get tx() {
    return this.mover.tx;
  }
  get ty() {
    return this.mover.ty;
  }
  get px() {
    return this.mover.px;
  }
  get py() {
    return this.mover.py;
  }
  get dir() {
    return this.mover.dir;
  }

  /** Used by the Grid Shift executor when a rotation carries a drone along. */
  teleport(x, y) {
    this.mover.teleport(x, y);
    this.field.mazeVersion = -1;
  }

  get frightened() {
    return this.state === DRONE_STATE.FRIGHTENED;
  }

  get edible() {
    return this.state === DRONE_STATE.FRIGHTENED;
  }

  get dangerous() {
    return this.state === DRONE_STATE.PATROL || this.state === DRONE_STATE.CHASE;
  }

  reset() {
    this.mover.teleport(this.spawn.x, this.spawn.y);
    this.state = DRONE_STATE.PATROL;
    this.stateTimer = 0;
    this.alerted = false;
    this.forceReverse = false;
    this.field.mazeVersion = -1;
  }

  /** Called when a power module goes live. */
  frighten() {
    if (this.state === DRONE_STATE.RETURNING || this.state === DRONE_STATE.RECOVERING) return;
    this.state = DRONE_STATE.FRIGHTENED;
    this.stateTimer = 0;
    this.forceReverse = true; // classic tell: they visibly turn tail
    this.field.mazeVersion = -1;
  }

  /** Called when the vulnerability window ends. */
  unfrighten() {
    if (this.state === DRONE_STATE.FRIGHTENED) {
      this.state = DRONE_STATE.PATROL;
      this.stateTimer = 0;
      this.field.mazeVersion = -1;
    }
  }

  /** Called when the player catches it. */
  consume() {
    this.state = DRONE_STATE.RETURNING;
    this.stateTimer = 0;
    this.field.mazeVersion = -1;
  }

  /**
   * @param {number} dt seconds
   * @param {object} ctx { player, phase, powerActive }
   */
  update(dt, ctx) {
    this.stateTimer += dt;
    this.bob += dt * 4;
    this.justSpotted = false;

    switch (this.state) {
      case DRONE_STATE.RECOVERING:
        this.mover.speed = 0;
        if (this.stateTimer >= CFG.DRONE_RECOVER_TIME) {
          this.state = ctx.powerActive ? DRONE_STATE.FRIGHTENED : DRONE_STATE.PATROL;
          this.stateTimer = 0;
          this.field.mazeVersion = -1;
        }
        return;
      case DRONE_STATE.RETURNING:
        this.mover.speed = CFG.DRONE_RETURN_SPEED;
        if (this._dockIfHome()) return;
        break;
      case DRONE_STATE.FRIGHTENED:
        this.mover.speed = CFG.DRONE_FRIGHTENED_SPEED;
        break;
      default:
        this.mover.speed = this.baseSpeed;
        this._updateAlertness(ctx);
        break;
    }

    this._maybeRepath(dt, ctx);
    this.mover.step(dt, () => this._decide(ctx));
    this._updateAngle();
  }

  /** Sentinels engage on proximity; the rest follow the global phase clock. */
  _updateAlertness(ctx) {
    if (this.personality === PERSONALITY.SENTINEL) {
      const d = this.field.goal === this.maze.idx(ctx.player.tx, ctx.player.ty) ? this.field.at(this.tx, this.ty) : null;
      const approx = d !== null && d !== UNREACHABLE ? d : Math.abs(this.tx - ctx.player.tx) + Math.abs(this.ty - ctx.player.ty);
      const shouldChase = approx <= CFG.SENTINEL_ALERT_RANGE;
      if (shouldChase && this.state !== DRONE_STATE.CHASE) {
        this.state = DRONE_STATE.CHASE;
        this.justSpotted = true;
        this.field.mazeVersion = -1;
      } else if (!shouldChase && this.state === DRONE_STATE.CHASE) {
        this.state = DRONE_STATE.PATROL;
        this.field.mazeVersion = -1;
      }
      return;
    }

    const want = ctx.phase === 'chase' ? DRONE_STATE.CHASE : DRONE_STATE.PATROL;
    if (want !== this.state) {
      if (want === DRONE_STATE.CHASE) this.justSpotted = true;
      this.state = want;
      this.forceReverse = true; // phase flips make drones turn around, as in the classics
      this.field.mazeVersion = -1;
    }
  }

  _maybeRepath(dt, ctx) {
    this.repathTimer -= dt;
    const stale = this.field.mazeVersion !== this.maze.version;
    if (this.repathTimer > 0 && !stale) return;
    this.repathTimer = 1 / CFG.DRONE_REPATH_HZ;

    const goal = this._pickGoal(ctx, dt);
    this.goal = goal;
    this.field.compute(this.maze.grid, this.maze.idx(goal.x, goal.y), this.maze.version);
  }

  /** The personality layer: each drone wants a different tile. */
  _pickGoal(ctx, dt) {
    const player = ctx.player;

    if (this.state === DRONE_STATE.RETURNING) return this.spawn;

    if (this.state === DRONE_STATE.FRIGHTENED) {
      // Flee: the field is built toward the player and then descended backwards.
      return { x: player.tx, y: player.ty };
    }

    if (this.personality === PERSONALITY.WANDERER) {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0 || !this.maze.walkable(this.goal.x, this.goal.y)) {
        this.wanderTimer = CFG.WANDERER_RETARGET;
        return this._randomWalkable();
      }
      return this.goal;
    }

    if (this.state === DRONE_STATE.PATROL) {
      if (this.personality === PERSONALITY.SENTINEL) {
        const p = this.patrolPoints[this.patrolIndex % this.patrolPoints.length];
        if (this.tx === p.x && this.ty === p.y) this.patrolIndex++;
        return this._sanitise(p);
      }
      return this._sanitise(this.corner);
    }

    // ── Chase goals ─────────────────────────────────────────────────────────
    switch (this.personality) {
      case PERSONALITY.INTERCEPTOR: {
        const v = DIR_VEC[player.facing === DIR.NONE ? DIR.RIGHT : player.facing];
        return this._sanitise({
          x: player.tx + v.x * CFG.INTERCEPTOR_LEAD,
          y: player.ty + v.y * CFG.INTERCEPTOR_LEAD,
        });
      }
      case PERSONALITY.TRACKER: {
        const h = player.headingEstimate();
        return this._sanitise({
          x: Math.round(player.tx + h.x * CFG.TRACKER_LEAD),
          y: Math.round(player.ty + h.y * CFG.TRACKER_LEAD),
        });
      }
      case PERSONALITY.HUNTER:
      case PERSONALITY.SENTINEL:
      default:
        return { x: player.tx, y: player.ty };
    }
  }

  /** Pulls an off-grid or in-wall goal back to the nearest usable tile. */
  _sanitise(pt) {
    const maze = this.maze;
    let x = Math.max(0, Math.min(maze.width - 1, pt.x));
    let y = Math.max(0, Math.min(maze.height - 1, pt.y));
    if (maze.walkable(x, y)) return { x, y };
    for (let r = 1; r <= 5; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const cx = x + dx;
          const cy = y + dy;
          if (maze.walkable(cx, cy)) return { x: cx, y: cy };
        }
      }
    }
    return { x: this.spawn.x, y: this.spawn.y };
  }

  _randomWalkable() {
    const maze = this.maze;
    for (let attempts = 0; attempts < 40; attempts++) {
      const x = 1 + Math.floor(this.rng() * (maze.width - 2));
      const y = 1 + Math.floor(this.rng() * (maze.height - 2));
      if (maze.walkable(x, y)) return { x, y };
    }
    return { x: this.spawn.x, y: this.spawn.y };
  }

  /**
   * Parks a returning drone once it reaches its spawn pad.
   * @returns {boolean} true when the drone docked this tick
   */
  _dockIfHome() {
    if (this.state !== DRONE_STATE.RETURNING) return false;
    if (this.mover.tx !== this.spawn.x || this.mover.ty !== this.spawn.y) return false;
    if (this.mover.progress > 0 && this.mover.moving) return false;
    this.mover.teleport(this.spawn.x, this.spawn.y);
    this.state = DRONE_STATE.RECOVERING;
    this.stateTimer = 0;
    return true;
  }

  /** Runs at every tile centre: pick the next step. */
  _decide() {
    if (this._dockIfHome()) return;
    const maze = this.maze;
    const field = this.field;
    const fleeing = this.state === DRONE_STATE.FRIGHTENED;

    // Shuffle the evaluation order so ties break differently each time; this is
    // what stops packs of drones marching in lockstep down the same corridor.
    const order = ORDER_SCRATCH;
    for (let i = 3; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      const t = order[i];
      order[i] = order[j];
      order[j] = t;
    }

    let banned = opposite(this.mover.dir);
    if (this.forceReverse) {
      // Deliberately turn around once, then resume normal no-U-turn movement.
      banned = this.mover.dir;
      this.forceReverse = false;
    }
    // A dead end must always be escapable, U-turn rule or not.
    if (exitCount(maze.grid, maze.width, maze.height, this.tx, this.ty) <= 1) banned = -1;

    const jitter = fleeing ? 2.5 : this.personality === PERSONALITY.WANDERER ? 1.5 : 0;
    const rng = this.rng;

    const dir = chooseDirection(
      maze.grid,
      maze.width,
      maze.height,
      this.tx,
      this.ty,
      banned,
      (nx, ny) => {
        const d = field.at(nx, ny);
        const base =
          d === UNREACHABLE
            ? 5000 + Math.abs(nx - this.goal.x) + Math.abs(ny - this.goal.y)
            : fleeing
              ? -d
              : d;
        return base + (jitter ? rng() * jitter : 0);
      },
      order
    );

    if (dir === -1) {
      // Sealed in by a shift. Idle politely until the maze opens up again
      // (design brief §37) instead of thrashing or teleporting.
      this.mover.dir = DIR.NONE;
      return;
    }
    this.mover.startMove(dir);
  }

  _updateAngle() {
    if (this.mover.dir === DIR.NONE) return;
    const target = this.mover.dir * (Math.PI / 2);
    let delta = target - this.angle;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    this.angle += delta * 0.25;
  }

  /** Short label used by the help screen and level select. */
  static describe(personality) {
    switch (personality) {
      case PERSONALITY.HUNTER:
        return { name: 'Hunter', desc: 'Locks on and takes the shortest route to you.' };
      case PERSONALITY.INTERCEPTOR:
        return { name: 'Interceptor', desc: 'Aims where you are going, not where you are.' };
      case PERSONALITY.SENTINEL:
        return { name: 'Sentinel', desc: 'Walks a beat, then engages when you get close.' };
      case PERSONALITY.TRACKER:
        return { name: 'Tracker', desc: 'Reads your recent path and cuts off the escape.' };
      case PERSONALITY.WANDERER:
        return { name: 'Wanderer', desc: 'Unpredictable. Ignores the rules everyone else follows.' };
      default:
        return { name: 'Drone', desc: '' };
    }
  }
}
