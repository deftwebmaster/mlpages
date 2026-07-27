import { CONFIG } from './config.js';
import { Pool } from './utils.js';
import { integrate } from './physics.js';

function factory() {
  return { type: 'projectile', x: 0, y: 0, vx: 0, vy: 0, angle: 0, radius: 3, mass: 0.1, drag: 0, life: 0, damage: 0 };
}
function reset(p, x, y, angle, speed, ownerVx, ownerVy) {
  p.x = x; p.y = y; p.angle = angle;
  p.vx = Math.cos(angle) * speed + ownerVx * 0.3;
  p.vy = Math.sin(angle) * speed + ownerVy * 0.3;
  p.life = CONFIG.WEAPON.PROJECTILE_LIFE;
  p.damage = CONFIG.WEAPON.PROJECTILE_DAMAGE;
  p.radius = 3;
  p.__hit = false;
}

export function createProjectilePool() {
  return new Pool(factory, reset, 64);
}

export function spawnProjectile(pool, ship) {
  const noseX = ship.x + Math.cos(ship.angle) * (ship.radius + 6);
  const noseY = ship.y + Math.sin(ship.angle) * (ship.radius + 6);
  return pool.spawn(noseX, noseY, ship.angle, CONFIG.WEAPON.PROJECTILE_SPEED, ship.vx, ship.vy);
}

export function updateProjectiles(pool, dt, worldW, worldH) {
  pool.update((p) => {
    integrate(p, dt, worldW, worldH);
    p.life -= dt;
    return p.life > 0 && !p.__hit;
  });
}
