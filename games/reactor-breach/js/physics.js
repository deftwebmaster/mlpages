import { reflect, clamp, vecLen } from './utils.js';
import { CONFIG } from './config.js';

export function reflectVelocity(vx, vy, nx, ny, restitution = 1) {
  const [rx, ry] = reflect(vx, vy, nx, ny);
  return [rx * restitution, ry * restitution];
}

// Ensures the orb never travels too close to horizontal, which would create
// an unrecoverable stall loop between two walls.
export function enforceMinimumVerticalSpeed(vx, vy) {
  const speed = vecLen(vx, vy) || 1;
  const minVy = speed * CONFIG.orb.minVerticalSpeedRatio;
  if (Math.abs(vy) < minVy) {
    const sign = vy === 0 ? -1 : Math.sign(vy);
    const newVy = minVy * sign;
    const remainingSq = Math.max(speed * speed - newVy * newVy, 0);
    const newVx = Math.sign(vx || 1) * Math.sqrt(remainingSq);
    return [newVx, newVy];
  }
  return [vx, vy];
}

export function clampSpeed(vx, vy, min, max) {
  const speed = vecLen(vx, vy);
  if (speed < 1e-4) return [vx, vy];
  const clamped = clamp(speed, min, max);
  const scale = clamped / speed;
  return [vx * scale, vy * scale];
}

// Splits a frame's movement into fixed-length substeps so fast-moving
// circles cannot tunnel through thin geometry. Calls `stepFn(dt)` per substep;
// stepFn should return false to abort remaining substeps (e.g. orb destroyed).
export function sweepSteps(distance, dt, maxStepDist, stepFn) {
  const steps = Math.max(1, Math.ceil(distance / maxStepDist));
  const subDt = dt / steps;
  for (let i = 0; i < steps; i++) {
    const cont = stepFn(subDt);
    if (cont === false) return;
  }
}

export function deflectorBounceAngle(contactRatio, deflectorVx) {
  // contactRatio: -1 (far left) .. 1 (far right)
  const maxAngle = (CONFIG.orb.maxBounceAngleDeg * Math.PI) / 180;
  let angle = contactRatio * maxAngle;
  // Deflector motion nudges the angle: moving into the ball sharpens it,
  // moving away softens it.
  const velInfluence = clamp(deflectorVx / CONFIG.deflector.baseSpeed, -1, 1);
  angle += velInfluence * 0.18;
  return clamp(angle, -maxAngle, maxAngle);
}
