import { CONFIG } from './config.js';
import { loadSave } from './storage.js';

function makeParticle() {
  return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 2, color: '#ffffff', shape: 'square', gravity: 0, alive: false };
}

export class ParticleSystem {
  constructor() {
    this.pool = [];
    this.active = [];
    const cap = CONFIG.particles.maxParticles;
    for (let i = 0; i < cap; i++) this.pool.push(makeParticle());
  }

  _cap() {
    return loadSave().settings.reducedEffects ? CONFIG.particles.maxParticlesReduced : CONFIG.particles.maxParticles;
  }

  spawn(opts) {
    if (this.active.length >= this._cap()) return;
    const p = this.pool.pop() || makeParticle();
    p.x = opts.x;
    p.y = opts.y;
    p.vx = opts.vx || 0;
    p.vy = opts.vy || 0;
    p.life = opts.life || 0.5;
    p.maxLife = p.life;
    p.size = opts.size || 3;
    p.color = opts.color || '#5ad8ff';
    p.shape = opts.shape || 'square';
    p.gravity = opts.gravity || 0;
    p.alive = true;
    this.active.push(p);
  }

  burst(x, y, count, opts = {}) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (opts.minSpeed || 40) + Math.random() * (opts.speedRange || 120);
      this.spawn({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: (opts.minLife || 0.3) + Math.random() * (opts.lifeRange || 0.4),
        size: (opts.minSize || 2) + Math.random() * (opts.sizeRange || 3),
        color: opts.color || '#5ad8ff',
        shape: opts.shape || 'square',
        gravity: opts.gravity || 0
      });
    }
  }

  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.alive = false;
        this.active.splice(i, 1);
        this.pool.push(p);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  render(ctx) {
    for (const p of this.active) {
      const t = p.life / p.maxLife;
      ctx.globalAlpha = clampAlpha(t);
      ctx.fillStyle = p.color;
      const s = p.size * t;
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    while (this.active.length) {
      const p = this.active.pop();
      p.alive = false;
      this.pool.push(p);
    }
  }
}

function clampAlpha(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
