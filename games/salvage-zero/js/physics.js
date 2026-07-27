import { wrapValue } from './utils.js';

// Lightweight momentum-based physics shared by ship, projectiles, wrecks, fragments.
// All bodies are plain objects with: x, y, vx, vy, angle, angularVelocity, radius, mass, drag

export function integrate(body, dt, worldW, worldH) {
  body.x += body.vx * dt;
  body.y += body.vy * dt;
  if (body.angularVelocity) body.angle += body.angularVelocity * dt;

  if (body.drag) {
    const f = Math.pow(1 - body.drag, dt);
    body.vx *= f;
    body.vy *= f;
  }

  body.x = wrapValue(body.x, worldW);
  body.y = wrapValue(body.y, worldH);
}

export function applyThrust(body, angle, magnitude, dt) {
  body.vx += Math.cos(angle) * magnitude * dt;
  body.vy += Math.sin(angle) * magnitude * dt;
}

export function clampSpeed(body, maxSpeed) {
  const sp = Math.hypot(body.vx, body.vy);
  if (sp > maxSpeed) {
    const f = maxSpeed / sp;
    body.vx *= f;
    body.vy *= f;
  }
}

export function speedOf(body) {
  return Math.hypot(body.vx, body.vy);
}

// Elastic-ish impulse split between two circular bodies (used for wreck/fragment collisions)
export function resolveElastic(a, b, nx, ny) {
  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const velAlongNormal = rvx * nx + rvy * ny;
  if (velAlongNormal > 0) return;
  const restitution = 0.55;
  const invMassA = 1 / (a.mass || 1);
  const invMassB = 1 / (b.mass || 1);
  const j = -(1 + restitution) * velAlongNormal / (invMassA + invMassB);
  const ix = j * nx, iy = j * ny;
  a.vx -= ix * invMassA;
  a.vy -= iy * invMassA;
  b.vx += ix * invMassB;
  b.vy += iy * invMassB;
}
