import { CHAMBER } from './stageHelpers.js';

const BG_VARIANTS = {
  graphite: ['#0b0e12', '#161c22'],
  blue: ['#070d14', '#0f1e2c'],
  violet: ['#0c0913', '#1b1226'],
  orange: ['#120c08', '#231407'],
  teal: ['#07120f', '#0d211c'],
  red: ['#150808', '#260c0c']
};

const CHANNEL_GLOW = {
  deflector: 'rgba(90,216,255,0.24)',
  orb: 'rgba(255,157,63,0.24)',
  reactorControl: 'rgba(185,139,255,0.24)'
};

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeTimer = 0;
    this.shakeMag = 0;
    this.bgSparks = Array.from({ length: 54 }, (_, i) => ({
      x: (i * 83) % CHAMBER.width,
      y: (i * 137) % CHAMBER.height,
      r: 0.5 + ((i * 17) % 12) / 10,
      p: (i * 0.37) % 1
    }));
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

  _roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
  }

  _fillRoundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    this._roundRect(x, y, w, h, r);
    ctx.fill();
  }

  _strokeRoundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    this._roundRect(x, y, w, h, r);
    ctx.stroke();
  }

  _drawBackground(variant, w, h, opts) {
    const ctx = this.ctx;
    const colors = BG_VARIANTS[variant] || BG_VARIANTS.graphite;
    const now = performance.now();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(1, colors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const reactorGlow = ctx.createRadialGradient(w / 2, h * 0.28, 10, w / 2, h * 0.28, h * 0.52);
    reactorGlow.addColorStop(0, CHANNEL_GLOW[opts.selectedChannel] || 'rgba(90,216,255,0.2)');
    reactorGlow.addColorStop(0.45, 'rgba(90,216,255,0.05)');
    reactorGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = reactorGlow;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = opts.reducedMotion ? 0.18 : 0.16 + Math.sin(now / 900) * 0.04;
    ctx.strokeStyle = '#5ad8ff';
    ctx.lineWidth = 1;
    for (let r = 88; r <= 330; r += 62) {
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.34, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(120,150,170,0.11)';
    ctx.lineWidth = 1;
    for (let x = 20; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 24; y < h; y += 44) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    for (const spark of this.bgSparks) {
      const drift = opts.reducedMotion ? 0 : ((now / 34 + spark.p * 800) % h);
      const y = (spark.y + drift * 0.018) % h;
      ctx.globalAlpha = 0.12 + Math.sin(now / 500 + spark.p * 10) * 0.05;
      ctx.fillStyle = '#dff8ff';
      ctx.beginPath();
      ctx.arc(spark.x, y, spark.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const rail = ctx.createLinearGradient(0, 0, w, 0);
    rail.addColorStop(0, 'rgba(90,216,255,0.44)');
    rail.addColorStop(0.08, 'rgba(90,216,255,0)');
    rail.addColorStop(0.92, 'rgba(255,77,109,0)');
    rail.addColorStop(1, 'rgba(255,77,109,0.44)');
    ctx.strokeStyle = rail;
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    ctx.strokeStyle = 'rgba(238,246,250,0.34)';
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, w - 24, h - 24);

    if (!opts.reducedMotion) {
      const scanY = (now / 28) % h;
      const scan = ctx.createLinearGradient(0, scanY - 28, 0, scanY + 28);
      scan.addColorStop(0, 'rgba(90,216,255,0)');
      scan.addColorStop(0.5, 'rgba(90,216,255,0.09)');
      scan.addColorStop(1, 'rgba(90,216,255,0)');
      ctx.fillStyle = scan;
      ctx.fillRect(0, scanY - 28, w, 56);
    }

    if (opts.coreExposed) {
      ctx.fillStyle = `rgba(255,90,90,${0.04 + Math.sin(performance.now() / 260) * 0.02})`;
      ctx.fillRect(0, 0, w, h);
    }

    if (opts.abilityState?.dilation > 0) {
      ctx.fillStyle = 'rgba(185,139,255,0.08)';
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
    const now = performance.now();
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
      if (c.damageFlash > 0) {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 18 * c.damageFlash;
      } else {
        ctx.shadowColor = color;
        ctx.shadowBlur = c.typeDef.isCore ? 18 : c.typeDef.isVolatile || c.typeDef.isConduit || c.typeDef.isShieldNode ? 10 : 4;
      }

      if (c.typeDef.isShieldNode) {
        const pulse = 1 + Math.sin(now / 180 + c.x) * 0.08;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, (c.width / 2) * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.68)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, c.width / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(185,139,255,0.82)';
        ctx.beginPath();
        ctx.moveTo(-c.width * 0.22, 0);
        ctx.lineTo(0, -c.width * 0.22);
        ctx.lineTo(c.width * 0.22, 0);
        ctx.lineTo(0, c.width * 0.22);
        ctx.closePath();
        ctx.stroke();
      } else if (c.typeDef.isReflector) {
        const g = ctx.createLinearGradient(-c.width / 2, -c.height / 2, c.width / 2, c.height / 2);
        g.addColorStop(0, '#eef6fa');
        g.addColorStop(0.5, '#647585');
        g.addColorStop(1, '#ffffff');
        ctx.fillStyle = g;
        this._fillRoundRect(-c.width / 2, -c.height / 2, c.width, c.height, 4);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        this._strokeRoundRect(-c.width / 2 + 2, -c.height / 2 + 2, c.width - 4, c.height - 4, 3);
      } else if (c.typeDef.isVolatile) {
        const hot = ctx.createRadialGradient(0, 0, 2, 0, 0, Math.max(c.width, c.height));
        hot.addColorStop(0, '#fff2b8');
        hot.addColorStop(0.42, color);
        hot.addColorStop(1, '#5a2108');
        ctx.fillStyle = hot;
        this._fillRoundRect(-c.width / 2, -c.height / 2, c.width, c.height, 5);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.62)';
        this._fillRoundRect(-c.width / 2 + 5, -3, c.width - 10, 6, 3);
        ctx.strokeStyle = 'rgba(255,255,255,0.34)';
        ctx.lineWidth = 1;
        this._strokeRoundRect(-c.width / 2 + 2, -c.height / 2 + 2, c.width - 4, c.height - 4, 4);
      } else if (c.typeDef.isCorruption) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-c.width / 2, 0);
        ctx.lineTo(0, -c.height / 2);
        ctx.lineTo(c.width / 2, 0);
        ctx.lineTo(0, c.height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = '#130409';
        ctx.beginPath();
        ctx.moveTo(-c.width * 0.22, -c.height * 0.05);
        ctx.lineTo(0, c.height * 0.18);
        ctx.lineTo(c.width * 0.22, -c.height * 0.05);
        ctx.stroke();
      } else if (c.typeDef.isCore) {
        const g = ctx.createLinearGradient(0, -c.height / 2, 0, c.height / 2);
        g.addColorStop(0, '#fff8c9');
        g.addColorStop(0.5, color);
        g.addColorStop(1, '#ff9d3f');
        ctx.fillStyle = g;
        this._fillRoundRect(-c.width / 2, -c.height / 2, c.width, c.height, 6);
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(255,255,255,${0.44 + Math.sin(now / 140) * 0.14})`;
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(c.width, c.height) / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,77,109,0.72)';
        ctx.lineWidth = 2;
        this._strokeRoundRect(-c.width / 2 - 3, -c.height / 2 - 3, c.width + 6, c.height + 6, 7);
      } else if (c.typeDef.isConduit) {
        const g = ctx.createLinearGradient(-c.width / 2, 0, c.width / 2, 0);
        g.addColorStop(0, '#123743');
        g.addColorStop(0.5, color);
        g.addColorStop(1, '#123743');
        ctx.fillStyle = g;
        this._fillRoundRect(-c.width / 2, -c.height / 2, c.width, c.height, 5);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(223,248,255,0.72)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-c.width / 2 + 5, 0);
        ctx.lineTo(c.width / 2 - 5, 0);
        ctx.stroke();
      } else if (c.typeDef.isPhase) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -c.height / 2);
        ctx.lineTo(c.width / 2, 0);
        ctx.lineTo(0, c.height / 2);
        ctx.lineTo(-c.width / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = c.isWarning ? '#fff2b8' : 'rgba(255,255,255,0.42)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        const g = ctx.createLinearGradient(0, -c.height / 2, 0, c.height / 2);
        g.addColorStop(0, c.damageFlash > 0 ? '#ffffff' : '#d7e3ea');
        g.addColorStop(0.35, c.damageFlash > 0 ? '#ffffff' : color);
        g.addColorStop(1, '#29343d');
        ctx.fillStyle = g;
        this._fillRoundRect(-c.width / 2, -c.height / 2, c.width, c.height, 4);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 1;
        this._strokeRoundRect(-c.width / 2 + 1, -c.height / 2 + 1, c.width - 2, c.height - 2, 3);
        if (c.typeDef.armored) {
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 2;
          this._strokeRoundRect(-c.width / 2 + 4, -c.height / 2 + 4, c.width - 8, c.height - 8, 2);
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
    const now = performance.now();
    for (const p of loaded.energyPackets.packets) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(now / 250 + p.x);
      ctx.shadowColor = '#5ad8ff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#5ad8ff';
      ctx.beginPath();
      ctx.moveTo(0, -p.radius * 1.25);
      ctx.lineTo(p.radius * 1.25, 0);
      ctx.lineTo(0, p.radius * 1.25);
      ctx.lineTo(-p.radius * 1.25, 0);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.74)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawPowerUps(loaded) {
    const ctx = this.ctx;
    for (const p of loaded.powerUps.items) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.shadowColor = '#ffce54';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#ffce54';
      ctx.beginPath();
      ctx.moveTo(0, -p.radius * 1.4);
      ctx.lineTo(p.radius * 1.4, 0);
      ctx.lineTo(0, p.radius * 1.4);
      ctx.lineTo(-p.radius * 1.4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#2a1500';
      ctx.fillRect(-2, -p.radius * 0.72, 4, p.radius * 1.44);
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

      ctx.save();
      ctx.shadowColor = orb.explosiveTimer > 0 ? '#ff9d3f' : orb.pierceCharges > 0 ? '#ffe27a' : '#5ad8ff';
      ctx.shadowBlur = 18;
      ctx.fillStyle = orb.explosiveTimer > 0 ? '#ffb166' : orb.pierceCharges > 0 ? '#ffe27a' : '#eafcff';
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      const shine = ctx.createRadialGradient(orb.x - 3, orb.y - 4, 1, orb.x, orb.y, orb.radius);
      shine.addColorStop(0, 'rgba(255,255,255,0.95)');
      shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
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

    const body = ctx.createLinearGradient(0, -d.height / 2, 0, d.height / 2);
    body.addColorStop(0, '#43515d');
    body.addColorStop(0.5, '#161f27');
    body.addColorStop(1, '#06090d');
    ctx.shadowColor = '#5ad8ff';
    ctx.shadowBlur = d.impactFlash > 0 ? 22 : 7;
    ctx.fillStyle = body;
    this._fillRoundRect(-d.width / 2, -d.height / 2, d.width, d.height, 6);
    ctx.shadowBlur = 0;

    const edgeColor = d.impactFlash > 0 ? `rgba(255,255,255,${d.impactFlash})` : '#5ad8ff';
    ctx.fillStyle = edgeColor;
    this._fillRoundRect(-d.width / 2, -d.height / 2, 8, d.height, 4);
    this._fillRoundRect(d.width / 2 - 8, -d.height / 2, 8, d.height, 4);
    ctx.fillStyle = 'rgba(238,246,250,0.28)';
    this._fillRoundRect(-d.width * 0.25, -2, d.width * 0.5, 4, 2);

    if (d.durabilityEnabled) {
      const ratio = d.durability / 100;
      ctx.fillStyle = ratio < 0.35 ? '#ff8a3f' : '#3fd0ff';
      ctx.fillRect(-d.width / 2, d.height / 2 + 2, d.width * ratio, 3);
    }
    ctx.restore();
  }
}
