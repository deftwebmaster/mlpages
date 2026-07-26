/**
 * Hazard and collectible entities, plus their pools.
 *
 * Every hazard exposes the same two queries:
 *   blockedSpans(out)     — lateral [lo, hi] ranges that are solid *right now*
 *   sweptSpans(out)       — lateral ranges the hazard can ever occupy
 *
 * `blockedSpans` drives collision; `sweptSpans` drives the safe-path validator,
 * which reasons conservatively about anything that moves.
 */

import { COLLISION, NEARMISS } from './config.js';

export const T = {
  DEBRIS: 'debris',
  BARRIER: 'barrier',
  MINE: 'mine',
  GATE: 'gate',
  ROTOR: 'rotor',
  CORRUPTION: 'corruption',
  COLLAPSER: 'collapser',
  CALIBRATION: 'calibration',
};

/** Hazards a phase shift can pass through. */
export const PHASEABLE = new Set([T.BARRIER]);
/**
 * Hazards whose solid body ends the run outright. A mine's *core* is lethal;
 * its outer ring is handled separately as a graze.
 */
export const LETHAL = new Set([T.DEBRIS, T.GATE, T.ROTOR, T.COLLAPSER, T.CALIBRATION, T.MINE]);
/** Hazards that only cost stability. An un-phased energy barrier is one. */
export const DAMAGING = new Set([T.BARRIER]);

export class Obstacle {
  constructor() {
    this.active = false;
    this.reset();
  }

  reset() {
    this.type = T.DEBRIS;
    this.x = 0;
    this.baseX = 0;
    this.halfW = 0.2;
    this.z = 0;
    this.depth = 4;
    this.prevZ = 0;

    // Motion
    this.amp = 0;
    this.speed = 0;
    this.phaseOff = 0;
    this.t = 0;

    // Type specifics
    this.radius = 0.12;      // mine
    this.gap = 0.3;          // calibration opening half-width
    this.length = 0.5;       // rotor bar length (world x units)
    this.angle = 0;
    this.grow = 0;           // collapser: 0..1 progress of closure
    this.side = -1;          // collapser anchor: -1 left wall, +1 right
    this.pulse = 0;          // mine pulse phase

    // Bookkeeping
    this.hit = false;
    this.nearMissDone = false;
    this.passed = false;
    this.scored = false;
    this.seed = 0;
  }

  get zFar() {
    return this.z + this.depth;
  }

  get isPhaseable() {
    return PHASEABLE.has(this.type);
  }

  get isLethal() {
    return LETHAL.has(this.type);
  }

  update(dt) {
    this.t += dt;
    switch (this.type) {
      case T.GATE:
        this.x = this.baseX + Math.sin(this.t * this.speed + this.phaseOff) * this.amp;
        break;
      case T.ROTOR:
        this.angle = this.phaseOff + this.t * this.speed;
        break;
      case T.MINE:
        this.pulse = (this.pulse + dt * 2.4) % (Math.PI * 2);
        break;
      case T.COLLAPSER:
        // Closure is a function of proximity, so it always telegraphs the same
        // way regardless of the current run speed.
        this.grow = Math.min(1, Math.max(0, 1 - this.z / 42));
        break;
      default:
        break;
    }
  }

  /**
   * Advance z by the world's travel this frame, remembering where the hazard
   * was. Collision and pass detection both read `prevZ`, so this must be the
   * only place z changes during play.
   */
  advance(dz) {
    this.prevZ = this.z;
    this.z -= dz;
  }

  /** Current lateral half-extent for solid geometry. */
  currentHalf() {
    switch (this.type) {
      case T.MINE:
        return this.radius * 0.52; // lethal core only
      case T.ROTOR:
        return Math.abs(Math.cos(this.angle)) * this.length * 0.5 + 0.035;
      case T.COLLAPSER:
        return this.halfW * this.grow;
      default:
        return this.halfW;
    }
  }

  /** Solid ranges as of this frame. Written into `out`, which is reused. */
  blockedSpans(out) {
    out.length = 0;
    const f = COLLISION.forgiveness;
    if (this.type === T.CORRUPTION) return out;
    if (this.type === T.CALIBRATION) {
      const g = this.gap * (2 - f); // opening is forgivingly wide
      out.push([this.x - this.halfW, this.x - g], [this.x + g, this.x + this.halfW]);
      return out;
    }
    if (this.type === T.COLLAPSER) {
      const w = this.halfW * 2 * this.grow * f;
      if (w <= 0.001) return out;
      if (this.side < 0) out.push([-10, -1 + w]);
      else out.push([1 - w, 10]);
      return out;
    }
    const h = this.currentHalf() * f;
    out.push([this.x - h, this.x + h]);
    return out;
  }

  /** Every lateral range the hazard could occupy over its whole lifetime. */
  sweptSpans(out) {
    out.length = 0;
    switch (this.type) {
      case T.CORRUPTION:
        return out;
      case T.CALIBRATION: {
        const g = this.gap;
        out.push([this.x - this.halfW, this.x - g], [this.x + g, this.x + this.halfW]);
        return out;
      }
      case T.GATE: {
        const h = this.halfW + this.amp;
        out.push([this.baseX - h, this.baseX + h]);
        return out;
      }
      case T.ROTOR: {
        const h = this.length * 0.5 + 0.035;
        out.push([this.x - h, this.x + h]);
        return out;
      }
      case T.COLLAPSER: {
        const w = this.halfW * 2;
        if (this.side < 0) out.push([-10, -1 + w]);
        else out.push([1 - w, 10]);
        return out;
      }
      case T.MINE:
        out.push([this.x - this.radius, this.x + this.radius]);
        return out;
      default:
        out.push([this.x - this.halfW, this.x + this.halfW]);
        return out;
    }
  }

  /** Outer, non-lethal radius used by mines for glancing damage. */
  grazeSpan(out) {
    out.length = 0;
    if (this.type !== T.MINE) return out;
    out.push([this.x - this.radius, this.x + this.radius]);
    return out;
  }

  /** Lateral distance from `px` to the nearest solid surface, or Infinity. */
  clearanceTo(px, spans) {
    let best = Infinity;
    for (const [lo, hi] of spans) {
      if (px >= lo && px <= hi) return -1;
      best = Math.min(best, px < lo ? lo - px : px - hi);
    }
    return best;
  }

  nearMissRange() {
    return NEARMISS.band;
  }
}

export class Collectible {
  constructor() {
    this.active = false;
    this.reset();
  }

  reset() {
    this.type = 'fragment'; // 'fragment' | 'repair' | 'phase'
    this.x = 0;
    this.z = 0;
    this.prevZ = 0;
    this.collected = false;
    this.spin = 0;
    this.bob = 0;
    this.value = 1;
    this.missed = false;
  }

  update(dt) {
    this.spin += dt * 2.6;
    this.bob += dt * 3.4;
  }

  advance(dz) {
    this.prevZ = this.z;
    this.z -= dz;
  }
}

/** Generic fixed-capacity pool. Grows only if a chunk genuinely needs more. */
export class Pool {
  constructor(Ctor, size) {
    this.Ctor = Ctor;
    this.items = [];
    for (let i = 0; i < size; i++) this.items.push(new Ctor());
  }

  acquire() {
    for (const it of this.items) {
      if (!it.active) {
        it.reset();
        it.active = true;
        return it;
      }
    }
    const it = new this.Ctor();
    it.active = true;
    this.items.push(it);
    return it;
  }

  release(it) {
    it.active = false;
  }

  releaseAll() {
    for (const it of this.items) it.active = false;
  }

  get size() {
    return this.items.length;
  }
}
