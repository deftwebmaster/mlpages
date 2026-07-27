import { CONFIG } from './config.js';

let orbSerial = 1;

export class Orb {
  constructor(x, y, variantIndex = 0) {
    this.id = orbSerial++;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = CONFIG.orb.radius;
    this.held = true;
    this.variantIndex = variantIndex;
    this.trail = [];
    this.pierceCharges = 0;
    this.explosiveTimer = 0;
    this.speedTierMult = 1;
    this.accelTimer = 0;
    this.consecutiveShallowBounces = 0;
    this.lastHitComponentId = null;
    this.lastHitCooldown = 0;
    this.phaseTimer = 0; // e.g. temporary intangibility from effects
    this.alive = true;
    this.launchGraceTimer = 0.12; // brief immunity to instant re-catch after launch
  }

  speed() {
    return Math.hypot(this.vx, this.vy);
  }

  pushTrail() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > CONFIG.orb.trailLength) this.trail.shift();
  }

  markHit(componentId) {
    this.lastHitComponentId = componentId;
    this.lastHitCooldown = 0.05;
  }

  recentlyHit(componentId) {
    return this.lastHitComponentId === componentId && this.lastHitCooldown > 0;
  }
}
