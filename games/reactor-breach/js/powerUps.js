import { CONFIG } from './config.js';
import { circleIntersectsRect } from './utils.js';

export const POWERUP_TYPES = {
  wideField: { color: '#5ad8ff', label: 'WIDE FIELD' },
  slowField: { color: '#7d8bff', label: 'SLOW FIELD' },
  multiOrb: { color: '#ffce54', label: 'MULTI-ORB' },
  piercingCore: { color: '#ff8a5c', label: 'PIERCING' },
  energySurge: { color: '#5aff9d', label: 'ENERGY SURGE' },
  containmentShield: { color: '#b98bff', label: 'SHIELD' },
  magneticRecovery: { color: '#ff5ad0', label: 'RECOVERY' }
};

let powerUpSerial = 1;

export class PowerUp {
  constructor(x, y, type) {
    this.id = powerUpSerial++;
    this.x = x;
    this.y = y;
    this.type = type;
    this.vy = 90;
    this.radius = 10;
    this.rotation = 0;
  }
}

export class PowerUpManager {
  constructor(chamberWidth, chamberHeight, dropChance = 0.08) {
    this.chamberWidth = chamberWidth;
    this.chamberHeight = chamberHeight;
    this.dropChance = dropChance;
    this.items = [];
    this.slowFieldTimer = 0;
  }

  setChamberSize(w, h) {
    this.chamberWidth = w;
    this.chamberHeight = h;
  }

  maybeDrop(component) {
    if (component.typeDef.isReflector) return;
    if (Math.random() > this.dropChance) return;
    const types = Object.keys(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    this.items.push(new PowerUp(component.x, component.y, type));
  }

  update(dt, deflector, world) {
    this.slowFieldTimer = Math.max(0, this.slowFieldTimer - dt);
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.y += p.vy * dt;
      p.rotation += dt * 2;
      if (
        circleIntersectsRect(p.x, p.y, p.radius, deflector.left - 6, deflector.top - 6, deflector.width + 12, 14)
      ) {
        this._apply(p.type, world);
        world.audio?.play('energyCollect');
        world.particles.burst(p.x, p.y, 14, { color: POWERUP_TYPES[p.type].color, shape: 'circle', minSpeed: 60 });
        this.items.splice(i, 1);
        continue;
      }
      if (p.y - p.radius > this.chamberHeight) this.items.splice(i, 1);
    }
  }

  _apply(type, world) {
    const { deflector, orbManager, routing } = world;
    switch (type) {
      case 'wideField':
        deflector.applyExpansion(CONFIG.abilities.deflector.expansionDuration);
        break;
      case 'slowField':
        this.slowFieldTimer = 6;
        break;
      case 'multiOrb': {
        const src = orbManager.orbs[0];
        if (src) {
          orbManager.spawnExtraOrb(src);
          orbManager.spawnExtraOrb(src);
        }
        break;
      }
      case 'piercingCore':
        for (const o of orbManager.orbs) o.pierceCharges += CONFIG.abilities.orb.pierceCharges;
        break;
      case 'energySurge':
        routing.addEnergy(20);
        break;
      case 'containmentShield':
        deflector.applyShield(CONFIG.abilities.deflector.shieldDuration);
        break;
      case 'magneticRecovery':
        deflector.addCatchCharge(1);
        break;
      default:
        break;
    }
    world.onAbilityActivated?.(type, 1);
  }

  isSlowFieldActive() {
    return this.slowFieldTimer > 0;
  }

  clear() {
    this.items.length = 0;
  }
}
