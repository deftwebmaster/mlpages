/**
 * The scrolling route: live chunks, their pooled entities, and the queries the
 * rest of the game makes against them.
 *
 * Chunks are instantiated from validated plans, advanced toward the craft each
 * frame, and recycled once they fall behind it. Entity storage is pooled, so a
 * long run performs no sustained allocation.
 */

import { Generator, wallsAt } from './generator.js';
import { Obstacle, Collectible, Pool, T } from './obstacles.js';
import { WORLD, SPEED } from './config.js';
import { clamp } from './utils.js';

const FULL_WALLS = { l: -1, r: 1 };

class LiveChunk {
  constructor() {
    this.reset(null, 0);
  }

  reset(plan, zStart) {
    this.plan = plan;
    this.zStart = zStart;
    this.length = plan ? plan.length : 0;
    this.hazards = [];
    this.pickups = [];
    this.fragTotal = 0;
    this.fragTaken = 0;
    this.damaged = false;
    this.corrupted = false;
    this.scraped = false;
    this.resolved = false;
    this.active = true;
  }

  get zEnd() {
    return this.zStart + this.length;
  }

  /** Chunk is fully behind the craft. */
  get traversed() {
    return this.zEnd <= 0;
  }
}

export class World {
  constructor(rng) {
    this.rng = rng;
    this.generator = new Generator(rng);
    this.obstacles = new Pool(Obstacle, 140);
    this.collectibles = new Pool(Collectible, 220);
    this.chunks = [];
    this._chunkPool = [];
    this.reset();
  }

  reset(startX = 0) {
    for (const c of this.chunks) this._recycleChunk(c);
    this.chunks.length = 0;
    this.obstacles.releaseAll();
    this.collectibles.releaseAll();
    this.generator.reset(startX);
    this.speed = SPEED.start;
    this.targetSpeed = SPEED.start;
    this.distanceZ = 0;
    this.slowTimer = 0;
    this.slowFactor = 1;
    this.nextZ = 40; // leading edge of generated route
    this.activeChunk = null;
  }

  _acquireChunk(plan, zStart) {
    const c = this._chunkPool.pop() || new LiveChunk();
    c.reset(plan, zStart);
    return c;
  }

  _recycleChunk(c) {
    for (const h of c.hazards) this.obstacles.release(h);
    for (const p of c.pickups) this.collectibles.release(p);
    c.hazards.length = 0;
    c.pickups.length = 0;
    c.plan = null;
    c.active = false;
    if (this._chunkPool.length < 24) this._chunkPool.push(c);
  }

  /** Instantiate one validated plan into pooled entities. */
  _spawn(plan) {
    const chunk = this._acquireChunk(plan, this.nextZ);

    for (const spec of plan.hazards) {
      const o = this.obstacles.acquire();
      o.type = spec.kind;
      o.z = this.nextZ + spec.t * plan.length;
      o.depth = spec.tDepth !== undefined ? spec.tDepth * plan.length : spec.depth;
      o.prevZ = o.z;
      o.x = o.baseX = spec.x ?? 0;
      o.halfW = spec.halfW ?? 0.15;
      o.amp = spec.amp ?? 0;
      o.speed = spec.speed ?? 0;
      o.phaseOff = spec.phaseOff ?? 0;
      o.radius = spec.radius ?? 0.1;
      o.gap = spec.gap ?? 0.24;
      o.length = spec.length ?? 0.5;
      o.side = spec.side ?? -1;
      o.t = 0;
      o.pulse = this.rng() * Math.PI * 2; // decorrelate identical mines
      o.seed = Math.floor(this.rng() * 1e6);
      chunk.hazards.push(o);
    }

    for (const spec of plan.pickups) {
      const p = this.collectibles.acquire();
      p.type = spec.kind;
      p.x = spec.x;
      p.z = this.nextZ + spec.t * plan.length;
      p.prevZ = p.z;
      p.spin = this.rng() * 6.28;
      p.bob = this.rng() * 6.28;
      if (spec.kind === 'fragment') chunk.fragTotal++;
      chunk.pickups.push(p);
    }

    this.chunks.push(chunk);
    this.nextZ += plan.length;
    return chunk;
  }

  /** Keep the route buffered ahead of the craft. */
  ensureAhead(elapsed) {
    let guard = 0;
    while (this.nextZ < WORLD.bufferAhead && guard++ < 6) {
      const plan = this.generator.next(elapsed, this.speed);
      this._spawn(plan);
    }
  }

  /** Target forward speed for the current run time. */
  computeTargetSpeed(elapsed) {
    const t = clamp(elapsed / SPEED.rampSeconds, 0, 1);
    // Ease-out ramp: quick early gains, a long tail toward the ceiling.
    const eased = 1 - Math.pow(1 - t, 1.7);
    let target = SPEED.start + (SPEED.max - SPEED.start) * eased;
    if (this.activeChunk && this.activeChunk.plan.boost) target += SPEED.straightawayBoost;
    return Math.min(target, SPEED.max + SPEED.straightawayBoost);
  }

  triggerCheckpointSlow() {
    this.slowTimer = SPEED.checkpointSlowTime;
  }

  /**
   * @param dt        seconds
   * @param elapsed   run time
   * @param timeScale global slow-motion factor
   * @returns distance travelled this frame, in z units
   */
  update(dt, elapsed, timeScale = 1) {
    this.targetSpeed = this.computeTargetSpeed(elapsed);

    if (this.slowTimer > 0) {
      this.slowTimer = Math.max(0, this.slowTimer - dt);
      const u = this.slowTimer / SPEED.checkpointSlowTime;
      this.slowFactor = SPEED.checkpointSlow + (1 - SPEED.checkpointSlow) * (1 - u);
    } else {
      this.slowFactor = 1;
    }

    const goal = this.targetSpeed * this.slowFactor;
    this.speed += (goal - this.speed) * Math.min(1, SPEED.lerp * dt);

    const dz = this.speed * dt * timeScale;
    this.distanceZ += dz;

    for (const c of this.chunks) {
      c.zStart -= dz;
      for (const h of c.hazards) {
        h.advance(dz);
        h.update(dt * timeScale);
      }
      for (const p of c.pickups) {
        p.advance(dz);
        p.update(dt * timeScale);
      }
    }

    this.activeChunk = this.chunkAt(0);
    this._cull();
    this.ensureAhead(elapsed);
    return dz;
  }

  _cull() {
    for (let i = this.chunks.length - 1; i >= 0; i--) {
      const c = this.chunks[i];
      if (c.zEnd < WORLD.cullZ) {
        this._recycleChunk(c);
        this.chunks.splice(i, 1);
      } else {
        // Recycle individual entities that have passed, freeing pool slots early.
        for (let j = c.hazards.length - 1; j >= 0; j--) {
          const h = c.hazards[j];
          if (h.zFar < WORLD.cullZ) {
            this.obstacles.release(h);
            c.hazards.splice(j, 1);
          }
        }
        for (let j = c.pickups.length - 1; j >= 0; j--) {
          const p = c.pickups[j];
          if (p.z < WORLD.cullZ || !p.active) {
            this.collectibles.release(p);
            c.pickups.splice(j, 1);
          }
        }
      }
    }
    // nextZ must follow the world so newly generated chunks stay contiguous.
    this.nextZ = this.chunks.length ? this.chunks[this.chunks.length - 1].zEnd : Math.max(this.nextZ, 40);
  }

  chunkAt(z) {
    for (const c of this.chunks) {
      if (z >= c.zStart && z <= c.zEnd) return c;
    }
    return null;
  }

  /** Corridor walls at world depth z. */
  wallAt(z) {
    const c = this.chunkAt(z);
    if (!c || !c.plan) return FULL_WALLS;
    const t = clamp((z - c.zStart) / c.length, 0, 1);
    return wallsAt(c.plan.walls, t);
  }

  /** Chunks that have been fully traversed and are awaiting scoring. */
  *newlyTraversed() {
    for (const c of this.chunks) {
      if (!c.resolved && c.traversed) {
        c.resolved = true;
        yield c;
      }
    }
  }

  /** Iterate every live hazard, nearest first. */
  *allHazards() {
    for (const c of this.chunks) {
      for (const h of c.hazards) if (h.active) yield { h, c };
    }
  }

  *allPickups() {
    for (const c of this.chunks) {
      for (const p of c.pickups) if (p.active && !p.collected) yield { p, c };
    }
  }

  get liveObstacleCount() {
    let n = 0;
    for (const c of this.chunks) n += c.hazards.length;
    return n;
  }
}
