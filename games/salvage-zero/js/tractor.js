import { CONFIG, SALVAGE_DEFS } from './config.js';
import { nextId, wrapValue, wrapDelta, clamp } from './utils.js';

export function createSalvage(kind, x, y, vx = 0, vy = 0) {
  const def = SALVAGE_DEFS[kind];
  return {
    id: nextId(),
    type: 'salvage',
    kind, x, y, vx, vy,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 3,
    radius: def.size,
    drag: 0.5,
    mass: 0.4,
    value: def.value,
    color: def.color,
    collected: false,
    beamed: false,
  };
}

export function updateSalvage(list, dt, worldW, worldH) {
  for (const s of list) {
    s.x = wrapValue(s.x + s.vx * dt, worldW);
    s.y = wrapValue(s.y + s.vy * dt, worldH);
    s.angle += s.spin * dt;
    const f = Math.pow(1 - s.drag, dt);
    s.vx *= f; s.vy *= f;
  }
}

// Cone-shaped pull toward the ship while tractor is held; also handles the
// small-item passive pickup radius (metal only) so brushing past debris still feels rewarding.
export function applyTractorBeam(ship, salvageList, dt, events, worldW, worldH) {
  for (const s of salvageList) {
    if (s.collected) continue;

    const dx = wrapDelta(s.x, ship.x, worldW);
    const dy = wrapDelta(s.y, ship.y, worldH);
    const dist = Math.hypot(dx, dy);

    const range = ship.tractorRange || CONFIG.TRACTOR.RANGE;
    if (ship.tractorActive && dist < range) {
      const angleToSalvage = Math.atan2(dy, dx);
      const beamAngle = ship.angle;
      let diff = angleToSalvage - beamAngle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      if (Math.abs(diff) < CONFIG.TRACTOR.HALF_ANGLE) {
        s.beamed = true;
        const pull = CONFIG.TRACTOR.PULL_FORCE * (1 - dist / range);
        s.vx += (-dx / dist) * pull * dt;
        s.vy += (-dy / dist) * pull * dt;
      } else {
        s.beamed = false;
      }
    } else {
      s.beamed = false;
    }

    const collectRadius = ship.radius + s.radius + 4;
    const isSmall = s.kind === 'metal';
    if (dist < collectRadius && (s.beamed || (isSmall && dist < CONFIG.TRACTOR.SMALL_PICKUP_RADIUS))) {
      s.collected = true;
      events.push({ type: 'salvageCollected', kind: s.kind, value: s.value, x: s.x, y: s.y });
    }
  }
}
