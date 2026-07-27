import { CONFIG } from './config.js';
import { Orb } from './orb.js';
import { circleVsAabb, circleVsRotatedRect, circleVsCapsule, circleVsCircle } from './collisions.js';
import { reflectVelocity, enforceMinimumVerticalSpeed, clampSpeed, deflectorBounceAngle, sweepSteps } from './physics.js';
import { clamp } from './utils.js';
import { handleDestruction } from './componentBehaviors.js';

export class OrbManager {
  constructor(chamberWidth, chamberHeight) {
    this.chamberWidth = chamberWidth;
    this.chamberHeight = chamberHeight;
    this.orbs = [];
  }

  setChamberSize(w, h) {
    this.chamberWidth = w;
    this.chamberHeight = h;
  }

  spawnHeldOrb(deflector) {
    const orb = new Orb(deflector.x, deflector.top - CONFIG.orb.radius - 2, this.orbs.length);
    orb.held = true;
    this.orbs.push(orb);
    return orb;
  }

  count() {
    return this.orbs.length;
  }

  launch(orb, deflector, aimRatio = 0) {
    orb.held = false;
    const maxAngle = (CONFIG.orb.maxBounceAngleDeg * Math.PI) / 180;
    const angle = clamp(aimRatio, -1, 1) * maxAngle * 0.6 + CONFIG.orb.launchUpBias * 0;
    const speed = CONFIG.orb.baseSpeed * orb.speedTierMult;
    orb.vx = Math.sin(angle) * speed;
    orb.vy = -Math.cos(angle) * speed;
    orb.launchGraceTimer = 0.12;
  }

  spawnExtraOrb(sourceOrb) {
    if (this.orbs.length >= CONFIG.orb.maxOrbs) {
      // Upgrade an existing orb instead of exceeding the cap.
      const target = this.orbs[Math.floor(Math.random() * this.orbs.length)];
      target.speedTierMult = Math.min(target.speedTierMult * 1.08, 1.6);
      return null;
    }
    const angleOffset = (Math.random() - 0.5) * 0.9;
    const speed = sourceOrb.speed() || CONFIG.orb.baseSpeed;
    const baseAngle = Math.atan2(sourceOrb.vx, -sourceOrb.vy);
    const newAngle = baseAngle + angleOffset;
    const orb = new Orb(sourceOrb.x, sourceOrb.y, this.orbs.length);
    orb.held = false;
    orb.vx = Math.sin(newAngle) * speed;
    orb.vy = -Math.abs(Math.cos(newAngle) * speed) - 40;
    orb.speedTierMult = sourceOrb.speedTierMult;
    this.orbs.push(orb);
    return orb;
  }

  removeOrb(orb) {
    const idx = this.orbs.indexOf(orb);
    if (idx >= 0) this.orbs.splice(idx, 1);
  }

  clear() {
    this.orbs.length = 0;
  }

  _resolveShields(orb, world) {
    for (const barrier of world.shields?.activeBarriers() || []) {
      let hit = null;
      if (barrier.shape === 'wall') {
        hit = circleVsCapsule(orb.x, orb.y, orb.radius, barrier.x1, barrier.y1, barrier.x2, barrier.y2, barrier.thickness / 2);
      } else if (barrier.shape === 'ring') {
        const dist = Math.hypot(orb.x - barrier.cx, orb.y - barrier.cy);
        if (dist < barrier.radius + orb.radius && dist > barrier.radius - orb.radius - barrier.thickness) {
          const nx = (orb.x - barrier.cx) / (dist || 1);
          const ny = (orb.y - barrier.cy) / (dist || 1);
          hit = { nx, ny, penetration: orb.radius };
        }
      }
      if (hit) {
        [orb.vx, orb.vy] = reflectVelocity(orb.vx, orb.vy, hit.nx, hit.ny);
        orb.x += hit.nx * (hit.penetration + 0.5);
        orb.y += hit.ny * (hit.penetration + 0.5);
        world.audio?.play('shieldReflect');
        world.particles.burst(orb.x, orb.y, 6, { color: '#b98bff', shape: 'circle', minSpeed: 40 });
        world.onShieldReflect?.(barrier);
        return true;
      }
    }
    return false;
  }

  _resolveComponents(orb, world) {
    for (const comp of world.components) {
      if (!comp.isCollidable()) continue;
      if (orb.recentlyHit(comp.id)) continue;
      let hit;
      if (comp.rotation) {
        hit = circleVsRotatedRect(orb.x, orb.y, orb.radius, comp.x, comp.y, comp.width, comp.height, comp.rotation);
      } else {
        hit = circleVsAabb(orb.x, orb.y, orb.radius, comp.x - comp.width / 2, comp.y - comp.height / 2, comp.width, comp.height);
      }
      if (!hit) continue;

      const isReflector = comp.typeDef.isReflector;
      const piercing = orb.pierceCharges > 0 && !isReflector;

      if (isReflector) {
        [orb.vx, orb.vy] = reflectVelocity(orb.vx, orb.vy, hit.nx, hit.ny);
        orb.x += hit.nx * (hit.penetration + 0.5);
        orb.y += hit.ny * (hit.penetration + 0.5);
        world.audio?.play('wallBounce');
        world.particles.burst(orb.x, orb.y, 6, { color: comp.typeDef.color, minSpeed: 30 });
        orb.markHit(comp.id);
        return true;
      }

      const explosive = orb.explosiveTimer > 0;
      const wasDestroyed = comp.damage(1, { pierceOrExplosive: piercing || explosive });

      if (!piercing) {
        [orb.vx, orb.vy] = reflectVelocity(orb.vx, orb.vy, hit.nx, hit.ny);
        orb.x += hit.nx * (hit.penetration + 0.5);
        orb.y += hit.ny * (hit.penetration + 0.5);
      } else {
        orb.pierceCharges -= 1;
      }
      orb.markHit(comp.id);

      if (wasDestroyed) {
        world.audio?.play('destroy');
        world.particles.burst(comp.x, comp.y, 16, { color: comp.typeDef.color, shape: 'square', minSpeed: 40, speedRange: 160 });
        world.onComponentDestroyed?.(comp);
        handleDestruction(comp, world);
      } else {
        const armored = comp.typeDef.armored;
        world.audio?.play(armored ? 'armorHit' : 'plateHit');
        world.particles.burst(comp.x, comp.y, 5, { color: comp.typeDef.color, minSpeed: 20 });
        world.onComponentHit?.(comp);
      }
      world.haptics?.('contact');
      return true;
    }
    return false;
  }

  _resolveDeflector(orb, world) {
    const d = world.deflector;
    const hit = circleVsAabb(orb.x, orb.y, orb.radius, d.left, d.top, d.width, d.height);
    if (!hit || orb.vy < 0) return false;

    if (d.holding) {
      orb.held = true;
      orb.vx = 0;
      orb.vy = 0;
      orb.y = d.top - orb.radius - 1;
      d.onOrbContact();
      world.audio?.play('magneticCatch');
      world.haptics?.('catch');
      world.onMagneticCatch?.();
      return true;
    }

    const ratio = d.contactRatio(orb.x);
    const angle = deflectorBounceAngle(ratio, d.vx);
    let speed = orb.speed() || CONFIG.orb.baseSpeed;
    speed = clamp(speed, CONFIG.orb.minSpeed, CONFIG.orb.maxSpeed);
    orb.vx = Math.sin(angle) * speed;
    orb.vy = -Math.abs(Math.cos(angle) * speed);
    [orb.vx, orb.vy] = enforceMinimumVerticalSpeed(orb.vx, orb.vy);
    orb.y = d.top - orb.radius - 0.5;
    d.onOrbContact();
    orb.consecutiveShallowBounces = 0;
    world.audio?.play('deflectorHit');
    world.haptics?.('contact');
    world.particles.burst(orb.x, orb.y, 10, { color: '#5ad8ff', minSpeed: 40, shape: 'circle' });
    world.onDeflectorHit?.(ratio);
    return true;
  }

  _resolveWalls(orb, world) {
    let hit = false;
    if (orb.x - orb.radius <= 0 && orb.vx < 0) {
      orb.x = orb.radius;
      orb.vx *= -1;
      hit = true;
    } else if (orb.x + orb.radius >= this.chamberWidth && orb.vx > 0) {
      orb.x = this.chamberWidth - orb.radius;
      orb.vx *= -1;
      hit = true;
    }
    if (orb.y - orb.radius <= 0 && orb.vy < 0) {
      orb.y = orb.radius;
      orb.vy *= -1;
      hit = true;
    }
    if (hit) {
      const angleFromVertical = Math.abs(Math.atan2(orb.vx, -orb.vy));
      if (angleFromVertical > 1.15) {
        orb.consecutiveShallowBounces += 1;
      } else {
        orb.consecutiveShallowBounces = 0;
      }
      if (orb.consecutiveShallowBounces >= CONFIG.orb.wallLoopBounceThreshold) {
        [orb.vx, orb.vy] = enforceMinimumVerticalSpeed(orb.vx, orb.vy * 1.15);
        orb.consecutiveShallowBounces = 0;
      }
      world.audio?.play('wallBounce');
      world.particles.burst(orb.x, orb.y, 4, { color: '#8fa3b0', minSpeed: 20 });
    }
    return hit;
  }

  _resolveContainmentShield(orb, world) {
    const d = world.deflector;
    if (!d.shieldActive) return false;
    const shieldY = this.chamberHeight - 6;
    if (orb.y + orb.radius >= shieldY && orb.vy > 0) {
      orb.y = shieldY - orb.radius;
      orb.vy *= -1;
      world.audio?.play('shieldReflect');
      world.particles.burst(orb.x, orb.y, 10, { color: '#b98bff', minSpeed: 40 });
      return true;
    }
    return false;
  }

  update(dt, world) {
    const lost = [];
    for (const orb of this.orbs) {
      orb.lastHitCooldown = Math.max(0, orb.lastHitCooldown - dt);
      orb.explosiveTimer = Math.max(0, orb.explosiveTimer - dt);
      orb.launchGraceTimer = Math.max(0, orb.launchGraceTimer - dt);
      if (orb.accelTimer > 0) {
        orb.accelTimer = Math.max(0, orb.accelTimer - dt);
        if (orb.accelTimer === 0) orb.speedTierMult = 1;
      }

      if (orb.held) {
        orb.x = world.deflector.x;
        orb.y = world.deflector.top - orb.radius - 2;
        orb.pushTrail();
        continue;
      }

      [orb.vx, orb.vy] = clampSpeed(orb.vx, orb.vy, CONFIG.orb.minSpeed * 0.85, CONFIG.orb.maxSpeed);

      for (const well of world.gravityWells || []) {
        const dx = well.x - orb.x;
        const dy = well.y - orb.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq) || 1;
        if (dist < (well.radius || 160)) {
          const force = (CONFIG.hazards.gravityWellStrength * (well.strength || 1)) / Math.max(distSq, 900);
          orb.vx += (dx / dist) * force * dt;
          orb.vy += (dy / dist) * force * dt;
        }
      }

      const distance = orb.speed() * dt;
      let aborted = false;
      sweepSteps(distance, dt, CONFIG.orb.substepMaxDist, (subDt) => {
        orb.x += orb.vx * subDt;
        orb.y += orb.vy * subDt;

        if (this._resolveShields(orb, world)) return true;
        if (this._resolveComponents(orb, world)) return true;
        if (this._resolveDeflector(orb, world)) return true;
        if (this._resolveContainmentShield(orb, world)) return true;
        this._resolveWalls(orb, world);

        if (orb.y - orb.radius > this.chamberHeight + 4) {
          aborted = true;
          return false;
        }
        return true;
      });

      orb.pushTrail();
      if (aborted) lost.push(orb);
    }

    for (const orb of lost) {
      this.removeOrb(orb);
    }
    return { lostOrbs: lost };
  }
}
