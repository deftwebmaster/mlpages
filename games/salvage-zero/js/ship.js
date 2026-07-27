import { CONFIG } from './config.js';
import { applyThrust, clampSpeed } from './physics.js';
import { clamp, wrapValue } from './utils.js';

export function createShip(x, y, upgrades = {}) {
  const hullLevel = upgrades.hullReinforcement || 0;
  const coolingLevel = upgrades.cooling || 0;
  const tractorLevel = upgrades.tractorRange || 0;
  const maxHull = CONFIG.SHIP.MAX_HULL + hullLevel * 20;

  return {
    type: 'ship',
    x, y,
    vx: 0, vy: 0,
    angle: -Math.PI / 2,
    radius: CONFIG.SHIP.RADIUS,
    mass: 5,
    drag: 0.14,
    hull: maxHull,
    maxHull,
    heat: 0,
    overheated: false,
    overheatTimer: 0,
    fireCooldown: 0,
    tractorActive: false,
    tractorRange: CONFIG.TRACTOR.RANGE + tractorLevel * 40,
    heatDissipateMult: 1 + coolingLevel * 0.15,
    heatPerShotMult: 1 - coolingLevel * 0.08,
    thrusting: false,
    braking: false,
    invuln: 0,
    hitFlash: 0,
    alive: true,
    distanceFlown: 0,
  };
}

export function updateShip(ship, input, dt, worldW, worldH) {
  if (!ship.alive) return;

  ship.tractorActive = input.tractor && !ship.overheated;

  const rotateSpeed = ship.tractorActive ? CONFIG.SHIP.ROTATE_SPEED_TRACTOR : CONFIG.SHIP.ROTATE_SPEED;
  ship.angle += input.rotate * rotateSpeed * dt;

  ship.thrusting = input.thrust;
  ship.braking = input.brake;

  const thrustMult = ship.tractorActive ? CONFIG.SHIP.TRACTOR_THRUST_MULT : 1;

  if (input.thrust) {
    applyThrust(ship, ship.angle, CONFIG.SHIP.THRUST * thrustMult, dt);
  }
  if (input.brake) {
    const sp = Math.hypot(ship.vx, ship.vy);
    if (sp > 0.01) {
      applyThrust(ship, Math.atan2(ship.vy, ship.vx) + Math.PI, CONFIG.SHIP.REVERSE_THRUST, dt);
    }
  }

  // Subtle auto-stabilization: when fully idle (no thrust/brake input), bleed velocity a bit
  // faster than base drag so the ship settles instead of drifting forever — softer than classic Asteroids.
  if (!input.thrust && !input.brake) {
    const assist = Math.pow(1 - CONFIG.SHIP.STABILIZE_ASSIST, dt);
    ship.vx *= assist;
    ship.vy *= assist;
  }

  clampSpeed(ship, CONFIG.SHIP.MAX_SPEED);

  ship.x = wrapValue(ship.x + ship.vx * dt, worldW);
  ship.y = wrapValue(ship.y + ship.vy * dt, worldH);

  ship.distanceFlown += Math.hypot(ship.vx, ship.vy) * dt;

  // Heat
  if (ship.tractorActive) {
    ship.heat += CONFIG.TRACTOR.HEAT_PER_SEC * dt;
  }
  if (ship.fireCooldown > 0) ship.fireCooldown -= dt;

  if (ship.overheated) {
    ship.overheatTimer -= dt;
    if (ship.overheatTimer <= 0) {
      ship.overheated = false;
      ship.heat = 0;
    }
  } else {
    ship.heat = clamp(ship.heat - CONFIG.WEAPON.HEAT_DISSIPATE * ship.heatDissipateMult * dt, 0, 100);
    if (ship.heat >= 100) {
      ship.overheated = true;
      ship.overheatTimer = CONFIG.WEAPON.HEAT_OVERHEAT_LOCK;
      ship.tractorActive = false;
    }
  }

  if (ship.invuln > 0) ship.invuln -= dt;
  if (ship.hitFlash > 0) ship.hitFlash -= dt;
}

export function canFire(ship) {
  return ship.alive && !ship.overheated && ship.fireCooldown <= 0;
}

export function fireWeapon(ship) {
  ship.fireCooldown = 1 / CONFIG.WEAPON.FIRE_RATE;
  ship.heat = clamp(ship.heat + CONFIG.WEAPON.HEAT_PER_SHOT * ship.heatPerShotMult, 0, 100);
  if (ship.heat >= 100) {
    ship.overheated = true;
    ship.overheatTimer = CONFIG.WEAPON.HEAT_OVERHEAT_LOCK;
  }
}

export function damageShip(ship, amount) {
  if (ship.invuln > 0 || !ship.alive) return;
  ship.hull = clamp(ship.hull - amount, 0, ship.maxHull);
  ship.invuln = 0.9;
  ship.hitFlash = 0.35;
  if (ship.hull <= 0) {
    ship.alive = false;
  }
}
