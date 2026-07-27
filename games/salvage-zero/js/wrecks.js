import { WRECK_DEFS } from './config.js';
import { randRange, nextId, wrapValue } from './utils.js';

const SIZE_SCALE = [1, 0.62, 0.38]; // large, medium, small
const REACTOR_COUNTDOWN = 2.2;

export function createWreck(kind, x, y, level = 0, opts = {}) {
  const def = WRECK_DEFS[kind];
  const scale = SIZE_SCALE[level] ?? 0.38;
  return {
    id: nextId(),
    type: 'wreck',
    kind,
    x, y,
    vx: opts.vx ?? randRange(-20, 20),
    vy: opts.vy ?? randRange(-20, 20),
    angle: opts.angle ?? randRange(0, Math.PI * 2),
    angularVelocity: opts.angularVelocity ?? (def.rotates ? randRange(0.3, 0.7) : randRange(-0.6, 0.6)),
    radius: def.radius * scale,
    mass: def.mass * scale,
    drag: 0.02,
    hp: def.hp * (level === 0 ? 1 : 0.55),
    maxHp: def.hp * (level === 0 ? 1 : 0.55),
    level,
    def,
    color: def.color,
    reactorCountdown: -1,
    exploding: false,
    alive: true,
    sharp: !!def.sharp,
  };
}

export function updateWreck(wreck, dt, worldW, worldH, events) {
  wreck.x = wrapValue(wreck.x + wreck.vx * dt, worldW);
  wreck.y = wrapValue(wreck.y + wreck.vy * dt, worldH);
  wreck.angle += wreck.angularVelocity * dt;

  if (wreck.reactorCountdown >= 0) {
    wreck.reactorCountdown -= dt;
    if (wreck.reactorCountdown <= 0) {
      wreck.exploding = true;
      wreck.alive = false;
      events.push({ type: 'reactorExplosion', x: wreck.x, y: wreck.y, radius: wreck.radius * 5 });
      events.push({ type: 'salvageBurst', x: wreck.x, y: wreck.y, kinds: ['energy', 'rare', 'blackbox', 'rare'] });
    }
  }
}

// Returns true if the wreck should be removed this frame.
export function applyDamageToWreck(wreck, amount, events) {
  if (!wreck.alive || wreck.reactorCountdown >= 0) return false;

  // Reactor cores don't die from hp depletion — any hit arms the meltdown countdown.
  if (wreck.def.reactor) {
    wreck.reactorCountdown = REACTOR_COUNTDOWN;
    events.push({ type: 'reactorArmed', x: wreck.x, y: wreck.y });
    return false;
  }

  wreck.hp -= amount;
  return wreck.hp <= 0; // destroyed this frame -> fragmentation.js handles the rest
}
