import { Pool, randRange, wrapValue } from './utils.js';

function factory() {
  return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 2, color: '#fff', type: 'spark' };
}
function reset(p, x, y, vx, vy, life, size, color, type) {
  p.x = x; p.y = y; p.vx = vx; p.vy = vy;
  p.life = life; p.maxLife = life; p.size = size; p.color = color; p.type = type;
}

export function createParticlePool(size = 400) {
  return new Pool(factory, reset, size);
}

export function updateParticles(pool, dt, worldW, worldH) {
  pool.update((p) => {
    p.x = wrapValue(p.x + p.vx * dt, worldW);
    p.y = wrapValue(p.y + p.vy * dt, worldH);
    p.vx *= Math.pow(0.9, dt * 60);
    p.vy *= Math.pow(0.9, dt * 60);
    p.life -= dt;
    return p.life > 0;
  });
}

export function emitThruster(pool, ship, dt, reverse = false) {
  if (Math.random() > 0.6) return;
  const back = ship.angle + Math.PI + (reverse ? Math.PI : 0);
  const spread = randRange(-0.35, 0.35);
  const a = back + spread;
  const speed = randRange(60, 140);
  const px = ship.x - Math.cos(ship.angle) * ship.radius;
  const py = ship.y - Math.sin(ship.angle) * ship.radius;
  pool.spawn(px, py, Math.cos(a) * speed + ship.vx * 0.3, Math.sin(a) * speed + ship.vy * 0.3,
    randRange(0.2, 0.4), randRange(1.5, 3), '#4fd8e8', 'thruster');
}

export function emitImpact(pool, x, y, count = 6, color = '#ffd24f') {
  for (let i = 0; i < count; i++) {
    const a = randRange(0, Math.PI * 2);
    const speed = randRange(40, 160);
    pool.spawn(x, y, Math.cos(a) * speed, Math.sin(a) * speed, randRange(0.2, 0.5), randRange(1, 2.5), color, 'spark');
  }
}

export function emitExplosion(pool, x, y, radius = 40, color = '#ff9540') {
  const count = Math.round(radius * 0.9);
  for (let i = 0; i < count; i++) {
    const a = randRange(0, Math.PI * 2);
    const speed = randRange(30, radius * 4);
    pool.spawn(x, y, Math.cos(a) * speed, Math.sin(a) * speed, randRange(0.4, 1.1), randRange(2, 5), color, 'explosion');
  }
  pool.spawn(x, y, 0, 0, 0.4, radius * 1.6, color, 'shockwave');
}

export function emitTractorParticle(pool, ship) {
  const a = ship.angle + randRange(-0.5, 0.5);
  const dist = randRange(20, 240);
  const px = ship.x + Math.cos(a) * dist;
  const py = ship.y + Math.sin(a) * dist;
  pool.spawn(px, py, -Math.cos(a) * 200, -Math.sin(a) * 200, 0.25, 2, '#4fd8e8', 'tractor');
}

export function emitPickup(pool, x, y, color) {
  for (let i = 0; i < 8; i++) {
    const a = randRange(0, Math.PI * 2);
    const speed = randRange(40, 100);
    pool.spawn(x, y, Math.cos(a) * speed, Math.sin(a) * speed, randRange(0.3, 0.6), randRange(1.5, 3), color, 'pickup');
  }
}
