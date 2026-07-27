/**
 * particles.js — Pooled particle system.
 *
 * All particles live in one pre-allocated flat array; emitting reuses the
 * oldest dead slot and never allocates. Coordinates are in *tile space* so the
 * effects scale automatically with the responsive board.
 */

import { CFG } from './config.js';
import { rgba, TAU } from './utils.js';

/** Particle shapes. */
export const SHAPE = { SPARK: 0, DOT: 1, RING: 2, SHARD: 3, GLYPH: 4 };

class Particle {
  constructor() {
    this.alive = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 1;
    this.size = 0.1;
    this.grow = 0;
    this.drag = 0.9;
    this.gravity = 0;
    this.color = '#fff';
    this.shape = SHAPE.DOT;
    this.rot = 0;
    this.spin = 0;
    this.additive = true;
  }
}

export class ParticleSystem {
  constructor(max = CFG.MAX_PARTICLES) {
    /** @type {Particle[]} */
    this.pool = new Array(max);
    for (let i = 0; i < max; i++) this.pool[i] = new Particle();
    this.cursor = 0;
    this.liveCount = 0;
    this.enabled = true;
  }

  clear() {
    for (const p of this.pool) p.alive = false;
    this.liveCount = 0;
  }

  /** Grabs the next slot, recycling the oldest if the pool is saturated. */
  _acquire() {
    const pool = this.pool;
    for (let i = 0; i < pool.length; i++) {
      const idx = (this.cursor + i) % pool.length;
      if (!pool[idx].alive) {
        this.cursor = (idx + 1) % pool.length;
        pool[idx].alive = true;
        this.liveCount++;
        return pool[idx];
      }
    }
    const p = pool[this.cursor];
    this.cursor = (this.cursor + 1) % pool.length;
    return p;
  }

  emit(opts) {
    if (!this.enabled) return;
    const p = this._acquire();
    p.x = opts.x;
    p.y = opts.y;
    p.vx = opts.vx || 0;
    p.vy = opts.vy || 0;
    p.maxLife = opts.life || 0.5;
    p.life = p.maxLife;
    p.size = opts.size || 0.08;
    p.grow = opts.grow || 0;
    p.drag = opts.drag === undefined ? 0.88 : opts.drag;
    p.gravity = opts.gravity || 0;
    p.color = opts.color || '#fff';
    p.shape = opts.shape === undefined ? SHAPE.DOT : opts.shape;
    p.rot = opts.rot || 0;
    p.spin = opts.spin || 0;
    p.additive = opts.additive !== false;
    return p;
  }

  /** Radial burst — the workhorse for pickups and explosions. */
  burst(x, y, count, opts = {}) {
    if (!this.enabled) return;
    const speed = opts.speed || 3;
    const spread = opts.spread || TAU;
    const base = opts.angle || 0;
    for (let i = 0; i < count; i++) {
      const a = base + (spread === TAU ? (i / count) * TAU : (Math.random() - 0.5) * spread);
      const s = speed * (0.55 + Math.random() * 0.75);
      this.emit({
        ...opts,
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        rot: a,
        life: (opts.life || 0.5) * (0.7 + Math.random() * 0.6),
      });
    }
  }

  update(dt) {
    const pool = this.pool;
    let live = 0;
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.alive = false;
        continue;
      }
      live++;
      const d = Math.pow(p.drag, dt * 60);
      p.vx *= d;
      p.vy *= d;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size += p.grow * dt;
      p.rot += p.spin * dt;
    }
    this.liveCount = live;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx already translated to board space
   * @param {number} tile pixel size of one tile
   */
  draw(ctx, tile) {
    const pool = this.pool;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    let additive = true;
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
      if (!p.alive) continue;
      const t = p.life / p.maxLife;
      const alpha = t < 0.25 ? t / 0.25 : 1;
      if (p.additive !== additive) {
        additive = p.additive;
        ctx.globalCompositeOperation = additive ? 'lighter' : 'source-over';
      }
      const x = (p.x + 0.5) * tile;
      const y = (p.y + 0.5) * tile;
      const r = Math.max(0.4, p.size * tile);
      ctx.fillStyle = rgba(p.color, alpha);

      switch (p.shape) {
        case SHAPE.RING:
          ctx.strokeStyle = rgba(p.color, alpha);
          ctx.lineWidth = Math.max(1, r * 0.22);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.stroke();
          break;
        case SHAPE.SPARK: {
          const len = r * 2.4;
          ctx.strokeStyle = rgba(p.color, alpha);
          ctx.lineWidth = Math.max(1, r * 0.5);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - Math.cos(p.rot) * len, y - Math.sin(p.rot) * len);
          ctx.stroke();
          break;
        }
        case SHAPE.SHARD:
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(p.rot);
          ctx.fillRect(-r, -r * 0.35, r * 2, r * 0.7);
          ctx.restore();
          break;
        default:
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fill();
          break;
      }
    }
    ctx.restore();
  }
}

/**
 * Named effect presets. Keeping them here means gameplay code says
 * `fx.nodeCollect(x, y)` rather than juggling twelve emit parameters inline.
 */
export function makeEffects(ps, colors) {
  return {
    trail(x, y, color) {
      ps.emit({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        life: 0.32,
        size: 0.13,
        grow: -0.28,
        color: color || colors.player,
        drag: 0.82,
      });
    },
    nodeCollect(x, y) {
      ps.burst(x, y, 7, { color: colors.node, speed: 3.4, life: 0.32, size: 0.07, grow: -0.12 });
      ps.emit({ x, y, life: 0.3, size: 0.16, grow: 1.5, color: colors.nodeCore, shape: SHAPE.RING, drag: 1 });
    },
    secretNode(x, y) {
      ps.burst(x, y, 10, { color: colors.secret, speed: 4, life: 0.45, size: 0.08, grow: -0.1 });
    },
    power(x, y) {
      ps.burst(x, y, 26, { color: colors.power, speed: 6.5, life: 0.7, size: 0.11, grow: -0.08, shape: SHAPE.SPARK });
      ps.emit({ x, y, life: 0.55, size: 0.3, grow: 7, color: colors.power, shape: SHAPE.RING, drag: 1 });
    },
    droneExplode(x, y, color) {
      ps.burst(x, y, 22, { color, speed: 7, life: 0.6, size: 0.12, grow: -0.1, shape: SHAPE.SHARD, spin: 6 });
      ps.burst(x, y, 12, { color: '#ffffff', speed: 4, life: 0.35, size: 0.08, grow: -0.15 });
      ps.emit({ x, y, life: 0.5, size: 0.25, grow: 6, color, shape: SHAPE.RING, drag: 1 });
    },
    playerDeath(x, y) {
      ps.burst(x, y, 34, { color: colors.player, speed: 5.5, life: 0.9, size: 0.11, grow: -0.06, shape: SHAPE.SPARK });
      ps.burst(x, y, 16, { color: colors.danger, speed: 3.2, life: 0.8, size: 0.1, grow: -0.05 });
      ps.emit({ x, y, life: 0.8, size: 0.2, grow: 9, color: colors.danger, shape: SHAPE.RING, drag: 1 });
    },
    shiftSpark(x, y, color) {
      ps.burst(x, y, 5, {
        color: color || colors.terminal,
        speed: 4.5,
        life: 0.4,
        size: 0.07,
        grow: -0.1,
        shape: SHAPE.SPARK,
      });
    },
    wallDust(x, y) {
      ps.burst(x, y, 4, { color: colors.wallEdgeHot, speed: 1.6, life: 0.5, size: 0.1, grow: -0.1, additive: false });
    },
    secretFound(x, y) {
      ps.burst(x, y, 30, { color: colors.secret, speed: 6, life: 0.9, size: 0.1, grow: -0.06 });
      ps.emit({ x, y, life: 0.9, size: 0.2, grow: 11, color: colors.secret, shape: SHAPE.RING, drag: 1 });
    },
    spawnIn(x, y) {
      ps.burst(x, y, 18, { color: colors.player, speed: -5, life: 0.5, size: 0.09, grow: 0.05 });
      ps.emit({ x, y, life: 0.45, size: 1.6, grow: -3.2, color: colors.player, shape: SHAPE.RING, drag: 1 });
    },
  };
}
