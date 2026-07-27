/**
 * particles.js — Bounded, pooled particle system.
 *
 * Fixed-capacity array, swap-remove on death, zero allocation while running.
 * When the pool is full new emissions are dropped rather than growing the
 * array — a long session must not be able to leak memory or drift below 60fps,
 * and particles are the first thing that should be sacrificed for that.
 *
 * Positions are in grid cells so effects survive a resize unchanged.
 */

import { CONFIG } from './config.js';
import { hash01 } from './utils.js';

export const ParticleKind = {
  SPARK: 0,
  SHARD: 1,
  RING: 2,
  TRAIL: 3,
};

export class ParticleSystem {
  constructor(capacity = CONFIG.particles.max) {
    this.capacity = capacity;
    this.count = 0;
    this.items = new Array(capacity);
    for (let i = 0; i < capacity; i++) {
      this.items[i] = {
        kind: ParticleKind.SPARK,
        x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 1,
        size: 0.1, color: '#fff',
        drag: 0.9, seed: 0,
      };
    }
    this.reducedEffects = false;
  }

  get activeLimit() {
    return this.reducedEffects ? CONFIG.particles.reducedMax : this.capacity;
  }

  clear() {
    this.count = 0;
  }

  spawn() {
    if (this.count >= this.activeLimit) return null;
    return this.items[this.count++];
  }

  burst(x, y, count, color, speed = 2.2, kind = ParticleKind.SPARK) {
    const n = this.reducedEffects ? Math.ceil(count * 0.35) : count;
    for (let i = 0; i < n; i++) {
      const p = this.spawn();
      if (!p) return;
      const angle = (i / n) * Math.PI * 2 + hash01(i * 7.3) * 0.9;
      const v = speed * (0.55 + hash01(i * 3.1) * 0.75);
      p.kind = kind;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * v;
      p.vy = Math.sin(angle) * v;
      p.maxLife = 0.35 + hash01(i * 11.7) * 0.35;
      p.life = p.maxLife;
      p.size = 0.05 + hash01(i * 5.9) * 0.07;
      p.color = color;
      p.drag = 0.86;
      p.seed = i;
    }
  }

  /** Directional spray — used for falling and impacts. */
  spray(x, y, count, color, dirX, dirY, speed = 2.4) {
    const n = this.reducedEffects ? Math.ceil(count * 0.35) : count;
    for (let i = 0; i < n; i++) {
      const p = this.spawn();
      if (!p) return;
      const spread = (hash01(i * 2.7) - 0.5) * 1.4;
      const v = speed * (0.5 + hash01(i * 4.3) * 0.8);
      p.kind = ParticleKind.SHARD;
      p.x = x;
      p.y = y;
      p.vx = (dirX + spread * -dirY) * v;
      p.vy = (dirY + spread * dirX) * v;
      p.maxLife = 0.3 + hash01(i * 8.1) * 0.3;
      p.life = p.maxLife;
      p.size = 0.06 + hash01(i * 6.5) * 0.08;
      p.color = color;
      p.drag = 0.9;
      p.seed = i;
    }
  }

  ring(x, y, color, radius = 1.2, life = 0.4) {
    const p = this.spawn();
    if (!p) return;
    p.kind = ParticleKind.RING;
    p.x = x;
    p.y = y;
    p.vx = radius; // ring grows to this radius over its life
    p.vy = 0;
    p.maxLife = life;
    p.life = life;
    p.size = 0.05;
    p.color = color;
    p.drag = 1;
    p.seed = 0;
  }

  trail(x, y, color) {
    if (this.reducedEffects) return;
    const p = this.spawn();
    if (!p) return;
    p.kind = ParticleKind.TRAIL;
    p.x = x;
    p.y = y;
    p.vx = 0;
    p.vy = 0.35;
    p.maxLife = 0.32;
    p.life = p.maxLife;
    p.size = 0.13;
    p.color = color;
    p.drag = 0.9;
    p.seed = 0;
  }

  update(dt) {
    let i = 0;
    while (i < this.count) {
      const p = this.items[i];
      p.life -= dt;
      if (p.life <= 0) {
        // Swap-remove keeps the live range contiguous with no allocation.
        this.items[i] = this.items[this.count - 1];
        this.items[this.count - 1] = p;
        this.count--;
        continue;
      }
      if (p.kind !== ParticleKind.RING) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const d = Math.pow(p.drag, dt * 60);
        p.vx *= d;
        p.vy *= d;
      }
      i++;
    }
  }
}
