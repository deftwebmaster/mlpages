/**
 * Pooled particle + floating-label system.
 *
 * Particles live in world space (x, z) so they inherit the tunnel's perspective
 * for free; `rise` adds a screen-space vertical drift on top of that.
 *
 * The pool is allocated once and never grows during play: emit() recycles the
 * oldest particle when the pool is exhausted, so the array length is constant
 * and no allocation happens in the hot loop.
 */

import { PARTICLES } from './config.js';

const KIND_DOT = 0;
const KIND_SPARK = 1;
const KIND_RING = 2;
const KIND_SHARD = 3;

export class Particles {
  constructor() {
    this.pool = [];
    this.labels = [];
    this.capacity = PARTICLES.max;
    this._cursor = 0;
    for (let i = 0; i < PARTICLES.max; i++) {
      this.pool.push({
        active: false,
        kind: KIND_DOT,
        x: 0, z: 0, vx: 0, vz: 0,
        rise: 0, vrise: 0,
        life: 0, maxLife: 1,
        size: 1, spin: 0, rot: 0,
        r: 63, g: 242, b: 255,
        additive: true,
      });
    }
    for (let i = 0; i < 14; i++) {
      this.labels.push({ active: false, x: 0, z: 0, rise: 0, life: 0, maxLife: 1, text: '', color: '#fff', scale: 1 });
    }
  }

  setReduced(reduced) {
    this.capacity = reduced ? PARTICLES.maxReduced : PARTICLES.max;
  }

  get liveCount() {
    let n = 0;
    for (const p of this.pool) if (p.active) n++;
    return n;
  }

  _acquire() {
    // One pass from the rotating cursor keeps acquisition O(1) amortised.
    for (let i = 0; i < this.capacity; i++) {
      const idx = (this._cursor + i) % this.capacity;
      const p = this.pool[idx];
      if (!p.active) {
        this._cursor = (idx + 1) % this.capacity;
        return p;
      }
    }
    // Saturated: steal the slot under the cursor rather than allocating.
    const p = this.pool[this._cursor];
    this._cursor = (this._cursor + 1) % this.capacity;
    return p;
  }

  emit(opts) {
    const p = this._acquire();
    p.active = true;
    p.kind = opts.kind ?? KIND_DOT;
    p.x = opts.x;
    p.z = opts.z;
    p.vx = opts.vx ?? 0;
    p.vz = opts.vz ?? 0;
    p.rise = opts.rise ?? 0;
    p.vrise = opts.vrise ?? 0;
    p.life = p.maxLife = opts.life ?? 0.6;
    p.size = opts.size ?? 3;
    p.rot = opts.rot ?? 0;
    p.spin = opts.spin ?? 0;
    p.r = opts.r ?? 63;
    p.g = opts.g ?? 242;
    p.b = opts.b ?? 255;
    p.additive = opts.additive !== false;
    return p;
  }

  label(x, z, text, color, scale = 1) {
    let slot = this.labels.find((l) => !l.active);
    if (!slot) {
      // Recycle the label closest to expiring.
      slot = this.labels.reduce((a, b) => (a.life <= b.life ? a : b));
    }
    slot.active = true;
    slot.x = x;
    slot.z = z;
    slot.rise = 0;
    slot.life = slot.maxLife = 0.9;
    slot.text = text;
    slot.color = color;
    slot.scale = scale;
  }

  /**
   * @param dt   seconds
   * @param zVel world speed, so particles are carried by the tunnel
   */
  update(dt, zVel) {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.z += (p.vz - zVel) * dt;
      p.rise += p.vrise * dt;
      p.vrise *= 1 - Math.min(1, 2.2 * dt);
      p.vx *= 1 - Math.min(1, 1.6 * dt);
      p.rot += p.spin * dt;
      if (p.z < -14) p.active = false;
    }
    for (const l of this.labels) {
      if (!l.active) continue;
      l.life -= dt;
      l.rise += 46 * dt;
      l.z -= zVel * dt;
      if (l.life <= 0 || l.z < -8) l.active = false;
    }
  }

  clear() {
    for (const p of this.pool) p.active = false;
    for (const l of this.labels) l.active = false;
  }

  /* ---------------------------------------------------------------- *
   * Emitters
   * ---------------------------------------------------------------- */

  trail(x, z, rng, phased, amount = 1) {
    const n = Math.random() < amount ? 1 : 0;
    for (let i = 0; i < n; i++) {
      this.emit({
        kind: KIND_DOT,
        x: x + (rng() - 0.5) * 0.05,
        z: z - 0.6,
        vz: -6 - rng() * 8,
        vx: (rng() - 0.5) * 0.12,
        life: 0.28 + rng() * 0.22,
        size: 2.6 + rng() * 2.4,
        r: phased ? 168 : 63,
        g: phased ? 120 : 242,
        b: 255,
      });
    }
  }

  burst(x, z, count, color, opts = {}) {
    const [r, g, b] = color;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (opts.speed ?? 1) * (0.4 + Math.random() * 0.9);
      this.emit({
        kind: opts.kind ?? KIND_SPARK,
        x, z,
        vx: Math.cos(a) * 0.5 * s,
        vz: Math.sin(a) * 14 * s,
        vrise: (Math.random() - 0.35) * 70 * s,
        life: (opts.life ?? 0.5) * (0.6 + Math.random() * 0.7),
        size: (opts.size ?? 3) * (0.7 + Math.random() * 0.8),
        spin: (Math.random() - 0.5) * 12,
        r, g, b,
      });
    }
  }

  ring(x, z, color, size = 26, life = 0.45) {
    const [r, g, b] = color;
    this.emit({ kind: KIND_RING, x, z, life, size, r, g, b });
  }

  debris(x, z, count, color) {
    const [r, g, b] = color;
    for (let i = 0; i < count; i++) {
      this.emit({
        kind: KIND_SHARD,
        x, z,
        vx: (Math.random() - 0.5) * 1.4,
        vz: (Math.random() - 0.3) * 26,
        vrise: (Math.random() - 0.5) * 120,
        life: 0.7 + Math.random() * 0.8,
        size: 3 + Math.random() * 6,
        spin: (Math.random() - 0.5) * 18,
        r, g, b,
      });
    }
  }
}

export const KINDS = { KIND_DOT, KIND_SPARK, KIND_RING, KIND_SHARD };
