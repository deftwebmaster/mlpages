import { CHAMBER } from './stageHelpers.js';

const BG_VARIANTS = {
  graphite: ['#0b0e12', '#161c22'],
  blue: ['#070d14', '#0f1e2c'],
  violet: ['#0c0913', '#1b1226'],
  orange: ['#120c08', '#231407'],
  teal: ['#07120f', '#0d211c'],
  red: ['#150808', '#260c0c']
};

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeTimer = 0;
    this.shakeMag = 0;
  }

  triggerShake(magnitude, duration, settings) {
    if (settings.screenShake === 'off') return;
    const scale = settings.screenShake === 'reduced' ? 0.35 : 1;
    this.shakeMag = magnitude * scale;
    this.shakeTimer = duration;
  }

  updateShake(dt) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const t = Math.max(0, this.shakeTimer);
      this.shakeX = (Math.random() - 0.5) * this.shakeMag * t;
      this.shakeY = (Math.random() - 0.5) * this.shakeMag * t;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  render(loaded, opts = {}) {
    const ctx = this.ctx;
    const w = CHAMBER.width;
    const h = CHAMBER.height;
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);

    this._drawBackground(loaded.stage.backgroundVariant, w, h, opts);
    this._drawConnections(loaded, opts);
    this._drawShields(loaded);
    this._drawComponents(loaded, opts);
    this._drawHazards(loaded);
    this._drawEnergyPackets(loaded);
    this._drawPowerUps(loaded);
    loaded.particles.render(ctx);
    this._drawOrbs(loaded, opts);
    this._drawDeflector(loaded, opts);

    ctx.restore();
  }

  _drawBackground(variant, w, h, opts) {
    const ctx = this.ctx;
    const colors = BG_VARIANTS[variant] || BG_VARIANTS.graphite;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(1, colors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(120,150,170,0.10)';
    ctx.lineWidth = 1;
    for (let x = 20; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(150,180,200,0.35)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);

    if (opts.coreExposed) {
      ctx.fillStyle = `rgba(255,90,90,${0.04 + Math.sin(performance.now() / 260) * 0.02})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  _drawConnections(loaded, opts) {
    if (!opts.scanActive) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(63,208,255,0.55)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    for (const c of loaded.components) {
      if (c.destroyed) continue;
      for (const targetId of c.connectionIds || []) {
        const target = loaded.connectionGraph.get(targetId);
        if (!target || target.destroyed) continue;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _drawShields(loaded) {
    const ctx = this.ctx;
    for (const b of loaded.shields.barriers) {
      const active = b.isActive();
      ctx.save();
      ctx.globalAlpha = active ? 0.9 : 0.15;
      ctx.strokeStyle = active ? '#b98bff' : '#4a3d5c';
      ctx.lineWidth = b.thickness;
      ctx.lineCap = 'round';
      if (b.shape === 'wall') {
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.stroke();
      } else if (b.shape === 'ring') {
        ctx.beginPath();
        ctx.arc(b.cx, b.cy, b.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawComponents(loaded, opts) {
    const ctx = this.ctx;
    for (const c of loaded.components) {
      if (c.destroyed) continue;
      ctx.save();
      ctx.translate(c.x, c.y);
      if (c.rotation) ctx.rotate(c.rotation);

      let alpha = 1;
      if (c.typeDef.isPhase) {
        alpha = c.phaseState === 'intangible' ? 0.18 : c.isWarning ? 0.55 + Math.sin(performance.now() / 60) * 0.2 : 1;
      }
      if (c.disabledByConduit) alpha *= 0.4;
      ctx.globalAlpha = alpha;

      const color = c.typeDef.color;
      ctx.fillStyle = color;
      if (c.damageFlash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${0.5 + c.damageFlash * 0.5})`;
      }

      if (c.typeDef.isShieldNode) {
        ctx.beginPath();
        ctx.arc(0, 0, c.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.globalAlpha = alpha * 0.6;
        ctx.stroke();
      } else if (c.typeDef.isVolatile) {
        ctx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(-c.width / 2 + 3, -2, c.width - 6, 4);
      } else if (c.typeDef.isCorruption) {
        ctx.beginPath();
        ctx.moveTo(-c.width / 2, 0);
        ctx.lineTo(0, -c.height / 2);
        ctx.lineTo(c.width / 2, 0);
        ctx.lineTo(0, c.height / 2);
        ctx.closePath();
        ctx.fill();
      } else if (c.typeDef.isCore) {
        ctx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(c.width, c.height) / 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
        if (c.typeDef.armored) {
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 2;
          ctx.strokeRect(-c.width / 2 + 2, -c.height / 2 + 2, c.width - 4, c.height - 4);
        }
      }

      if (c.maxHp !== Infinity && c.maxHp > 1 && !c.typeDef.isCorruption) {
        const dmg = c.damageStage();
        if (dmg > 0) {
          ctx.globalAlpha = alpha * 0.7;
          ctx.strokeStyle = '#000';
          ctx.beginPath();
          ctx.moveTo(-c.width / 4, -c.height / 3);
          ctx.lineTo(0, 0);
          ctx.lineTo(c.width / 4, c.height / 3);
          ctx.stroke();
        }
      }

      if (c.objectiveTag && opts.scanActive) {
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = '#ffe27a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-c.width / 2 - 3, -c.height / 2 - 3, c.width + 6, c.height + 6);
      }

      ctx.restore();
    }
  }

  _drawHazards(loaded) {
    const ctx = this.ctx;
    ctx.fillStyle = '#ff9d3f';
    for (const d of loaded.hazards.debris) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ff4d6d';
    for (const p of loaded.hazards.projectiles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const z of loaded.hazards.heatZones) {
      ctx.fillStyle = 'rgba(255,120,50,0.08)';
      ctx.fillRect(z.x, z.y, z.width, z.height);
    }
    if (loaded.hazards.isPulseDangerNow()) {
      ctx.fillStyle = `rgba(255,60,60,${0.08 + Math.sin(performance.now() / 90) * 0.05})`;
      ctx.fillRect(0, 0, CHAMBER.width, CHAMBER.height);
    }
  }

  _drawEnergyPackets(loaded) {
    const ctx = this.ctx;
    for (const p of loaded.energyPackets.packets) {
      ctx.fillStyle = '#5ad8ff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.stroke();
    }
  }

  _drawPowerUps(loaded) {
    const ctx = this.ctx;
    for (const p of loaded.powerUps.items) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = '#ffce54';
      ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
      ctx.restore();
    }
  }

  _drawOrbs(loaded, opts) {
    const ctx = this.ctx;
    for (const orb of loaded.orbManager.orbs) {
      if (!opts.reducedMotion) {
        for (let i = 0; i < orb.trail.length; i++) {
          const t = orb.trail[i];
          const alpha = (i / orb.trail.length) * 0.35;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = orb.explosiveTimer > 0 ? '#ff9d3f' : orb.pierceCharges > 0 ? '#ffe27a' : '#5ad8ff';
          ctx.beginPath();
          ctx.arc(t.x, t.y, orb.radius * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = orb.explosiveTimer > 0 ? 'rgba(255,157,63,0.6)' : 'rgba(90,216,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = orb.explosiveTimer > 0 ? '#ffb166' : orb.pierceCharges > 0 ? '#ffe27a' : '#eafcff';
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawDeflector(loaded, opts) {
    const ctx = this.ctx;
    const d = loaded.deflector;
    ctx.save();
    ctx.translate(d.x, d.y);
    const squish = 1 - d.contactBounceAnim * 0.18;
    ctx.scale(1 + d.contactBounceAnim * 0.06, squish);

    if (d.holding) {
      ctx.globalAlpha = 0.25 + d.catchFieldAnim * 0.3;
      ctx.strokeStyle = '#b98bff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, d.width / 2 + 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (d.shieldActive) {
      ctx.fillStyle = 'rgba(185,139,255,0.12)';
      ctx.fillRect(-CHAMBER.width / 2, CHAMBER.height - d.y - 8, CHAMBER.width, 6);
    }

    ctx.fillStyle = '#232c34';
    ctx.fillRect(-d.width / 2, -d.height / 2, d.width, d.height);

    const edgeColor = d.impactFlash > 0 ? `rgba(255,255,255,${d.impactFlash})` : '#5ad8ff';
    ctx.fillStyle = edgeColor;
    ctx.fillRect(-d.width / 2, -d.height / 2, 6, d.height);
    ctx.fillRect(d.width / 2 - 6, -d.height / 2, 6, d.height);

    if (d.durabilityEnabled) {
      const ratio = d.durability / 100;
      ctx.fillStyle = ratio < 0.35 ? '#ff8a3f' : '#3fd0ff';
      ctx.fillRect(-d.width / 2, d.height / 2 + 2, d.width * ratio, 3);
    }
    ctx.restore();
  }
}
