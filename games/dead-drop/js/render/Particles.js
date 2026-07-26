// Small, cheap particle bursts (package collected, door opens, mission
// complete, detection flash). Kept intentionally tiny per the brief.

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  burst(x, y, { color = '#3fe0ff', count = 10, speed = 1.4, life = 500, size = 3 } = {}) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const spd = speed * (0.5 + Math.random() * 0.6);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life, age: 0, color, size: size * (0.6 + Math.random() * 0.8),
      });
    }
  }

  flash(x, y, color = '#ff4d5e') {
    this.burst(x, y, { color, count: 16, speed: 2.2, life: 400, size: 4 });
  }

  tick(dtSec) {
    for (const p of this.particles) {
      p.age += p.vx !== undefined ? dtSec * 1000 : 0;
      p.x += p.vx * dtSec * 60 * 0.016;
      p.y += p.vy * dtSec * 60 * 0.016;
      p.vx *= 0.92;
      p.vy *= 0.92;
    }
    this.particles = this.particles.filter((p) => p.age < p.life);
  }

  draw(ctx, tileSize) {
    for (const p of this.particles) {
      const t = p.age / p.life;
      const alpha = 1 - t;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - t * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.particles = [];
  }
}
