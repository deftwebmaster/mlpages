import { CONFIG } from './config.js';
import { circleIntersectsRect, circleIntersectsCircle, clamp } from './utils.js';

let hazardSerial = 1;

export class HazardManager {
  constructor(defs, chamberWidth, chamberHeight) {
    this.chamberWidth = chamberWidth;
    this.chamberHeight = chamberHeight;
    this.defs = defs || [];
    this.debris = [];
    this.projectiles = [];
    this.heatZones = (defs || []).filter((d) => d.type === 'heatZone');
    this.energyDrains = (defs || []).filter((d) => d.type === 'energyDrain');
    this.gravityWells = (defs || [])
      .filter((d) => d.type === 'gravityWell')
      .map((d) => ({ x: d.x, y: d.y, radius: d.radius || 160, strength: d.strength || 1 }));
    this.turrets = (defs || []).filter((d) => d.type === 'turret').map((d) => ({ ...d, cooldown: d.interval || 3 }));
    this.debrisSources = (defs || []).filter((d) => d.type === 'debris').map((d) => ({ ...d, cooldown: d.interval || 2.5 }));
    this.pulses = (defs || []).filter((d) => d.type === 'containmentPulse').map((d) => ({ ...d, cooldown: d.interval || 8, warning: 0, active: false, activeTimer: 0 }));
  }

  setChamberSize(w, h) {
    this.chamberWidth = w;
    this.chamberHeight = h;
  }

  update(dt, world) {
    const timeScale = world.abilities?.getTimeScale() ?? 1;
    const suppressed = world.abilities?.isSuppressed();
    const scaledDt = dt * timeScale;

    if (!suppressed) {
      for (const t of this.turrets) {
        t.cooldown -= scaledDt;
        if (t.cooldown <= 0) {
          t.cooldown = t.interval || 3;
          this.projectiles.push({
            id: hazardSerial++,
            x: t.x,
            y: t.y,
            vy: CONFIG.hazards.turretProjectileSpeed,
            radius: 6
          });
          world.audio?.play('warning');
        }
      }
    }

    for (const s of this.debrisSources) {
      s.cooldown -= scaledDt;
      if (s.cooldown <= 0) {
        s.cooldown = s.interval || 2.5;
        this.debris.push({
          id: hazardSerial++,
          x: s.x + (Math.random() - 0.5) * (s.spread || 30),
          y: s.y,
          vy: CONFIG.hazards.debrisFallSpeed,
          radius: 7
        });
      }
    }

    for (const p of this.pulses) {
      p.cooldown -= scaledDt;
      if (!p.active && p.cooldown <= 1.2) p.warning = 1;
      if (p.cooldown <= 0) {
        p.active = true;
        p.activeTimer = p.duration || 1.2;
        p.cooldown = p.interval || 8;
        p.warning = 0;
        world.audio?.play('warning');
        world.onContainmentPulse?.(p);
      }
      if (p.active) {
        p.activeTimer -= scaledDt;
        if (p.activeTimer <= 0) p.active = false;
      }
    }

    this._updateFallers(this.debris, scaledDt, world, 'debris');
    this._updateFallers(this.projectiles, scaledDt, world, 'projectile');
  }

  _updateFallers(list, dt, world, kind) {
    const d = world.deflector;
    for (let i = list.length - 1; i >= 0; i--) {
      const item = list[i];
      item.y += item.vy * dt;

      let consumed = false;
      for (const orb of world.orbManager.orbs) {
        if (orb.held) continue;
        if (circleIntersectsCircle(item.x, item.y, item.radius, orb.x, orb.y, orb.radius)) {
          world.particles.burst(item.x, item.y, 10, { color: '#ff9d3f', minSpeed: 40 });
          world.onScore?.(20);
          list.splice(i, 1);
          consumed = true;
          break;
        }
      }
      if (consumed) continue;

      if (circleIntersectsRect(item.x, item.y, item.radius, d.left, d.top, d.width, d.height)) {
        const chargeLost = d.damage(kind === 'projectile' ? 22 : 16);
        world.audio?.play('warning');
        world.haptics?.('contact');
        world.particles.burst(item.x, item.y, 12, { color: '#ff4d6d', minSpeed: 50 });
        world.onHazardImpact?.(chargeLost);
        list.splice(i, 1);
        continue;
      }

      if (item.y - item.radius > this.chamberHeight) {
        list.splice(i, 1);
      }
    }
  }

  heatMultiplierAt(x, y) {
    for (const z of this.heatZones) {
      if (circleIntersectsRect(x, y, 1, z.x, z.y, z.width, z.height)) {
        return CONFIG.hazards.heatSpeedMult;
      }
    }
    return 1;
  }

  drainAt(x, y) {
    for (const z of this.energyDrains) {
      if (circleIntersectsRect(x, y, 1, z.x, z.y, z.width, z.height)) {
        return z.drainRate || 2;
      }
    }
    return 0;
  }

  isPulseDangerNow() {
    return this.pulses.some((p) => p.active);
  }

  clear() {
    this.debris.length = 0;
    this.projectiles.length = 0;
  }
}
