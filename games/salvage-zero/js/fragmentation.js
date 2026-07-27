import { createWreck } from './wrecks.js';
import { randRange, choice } from './utils.js';

// Destroys a wreck: spawns child fragments (inheriting velocity/rotation/mass with variation),
// queues salvage drops, and queues explosion/particle events for anything special (fuel, crystal).
export function destroyWreck(wreck, wrecksArray, events) {
  const def = wreck.def;

  events.push({ type: 'wreckDestroyed', x: wreck.x, y: wreck.y, kind: wreck.kind, level: wreck.level, radius: wreck.radius });

  // Salvage drop — bigger/less-fragmented pieces drop more.
  const dropCount = wreck.level === 0 ? randRange(2, 3) : wreck.level === 1 ? randRange(1, 2) : 1;
  for (let i = 0; i < Math.round(dropCount); i++) {
    const kind = choice(def.salvage);
    events.push({
      type: 'salvageDrop', kind,
      x: wreck.x + randRange(-12, 12),
      y: wreck.y + randRange(-12, 12),
      vx: wreck.vx + randRange(-40, 40),
      vy: wreck.vy + randRange(-40, 40),
    });
  }

  if (def.explosive) {
    events.push({ type: 'fuelExplosion', x: wreck.x, y: wreck.y, radius: wreck.radius * 3.2 });
  }

  // Fragment into smaller pieces if this size tier still has splits left.
  if (wreck.level < def.splits) {
    const childCount = 2;
    for (let i = 0; i < childCount; i++) {
      const spreadAngle = wreck.angle + randRange(-1, 1) + i * Math.PI;
      const speedBoost = def.fast ? randRange(60, 140) : randRange(20, 70);
      const child = createWreck(wreck.kind, wreck.x, wreck.y, wreck.level + 1, {
        vx: wreck.vx + Math.cos(spreadAngle) * speedBoost,
        vy: wreck.vy + Math.sin(spreadAngle) * speedBoost,
        angularVelocity: wreck.angularVelocity + randRange(-1, 1),
      });
      wrecksArray.push(child);
    }
  } else if (def.explosive) {
    // Fuel tank debris: a few small fast hazard shards instead of standard fragments.
    for (let i = 0; i < 4; i++) {
      const a = randRange(0, Math.PI * 2);
      events.push({ type: 'debrisShard', x: wreck.x, y: wreck.y, angle: a, speed: randRange(180, 320) });
    }
  }
}
