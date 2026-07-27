/**
 * laneObjects.js — Deterministic placement maths for lane traffic.
 *
 * Every moving object in Signal Runner is an *analytic function of lane time*
 * rather than a simulated entity. A lane declares how many cells apart its
 * objects sit; from that we derive a fixed number of slots and a wrap period,
 * then evaluate each slot's position directly from `t`.
 *
 * This buys three things that matter a lot here:
 *   - Perfect frame-rate independence (no accumulated drift).
 *   - Seamless wrapping with exact spacing, no spawn/despawn bookkeeping.
 *   - The whole world is replayable from a single number, which is what lets
 *     tools/validate-levels.mjs brute-force a route through every level.
 */

import { OPPOSITE_POLARITY } from './config.js';
import { mod } from './utils.js';

/** Hazards are dangerous to the *opposite* frequency. Unpolarised = both. */
export function hostileToFor(polarity) {
  if (!polarity) return 'both';
  return OPPOSITE_POLARITY[polarity];
}

/** Platforms carry only their *own* frequency. Unpolarised = everyone. */
export function supportForFor(polarity) {
  return polarity || 'both';
}

export function objectSizeAt(lane, index) {
  if (lane.sizes && lane.sizes.length) return lane.sizes[index % lane.sizes.length];
  return lane.size ?? 1;
}

export function objectPolarityAt(lane, index) {
  if (lane.polarities && lane.polarities.length) {
    return lane.polarities[index % lane.polarities.length];
  }
  return lane.polarity ?? null;
}

export function maxObjectSize(lane) {
  if (lane.sizes && lane.sizes.length) return Math.max(...lane.sizes);
  return lane.size ?? 1;
}

/**
 * Lanes may occupy only part of the board width. A half-width lane wraps
 * within its own span, which lets one row offer two genuinely different
 * routes side by side.
 */
export function laneFrom(lane) {
  return lane.from ?? 0;
}

export function laneTo(lane, cols) {
  return lane.to ?? cols;
}

/**
 * Number of evenly spaced slots needed so that the lane's span is always
 * fully tiled and every wrap happens outside it.
 */
export function slotCount(lane, cols) {
  const width = laneTo(lane, cols) - laneFrom(lane);
  const span = width + maxObjectSize(lane) + 2;
  return Math.max(1, Math.ceil(span / lane.spacing));
}

/** Left edge of slot `index` at lane time `t`, in column units. */
export function slotX(lane, index, t, cols) {
  const n = slotCount(lane, cols);
  const period = n * lane.spacing;
  const low = laneFrom(lane) - maxObjectSize(lane) - 1;
  const travel = (lane.direction ?? 1) * (lane.speed ?? 0) * t;
  const raw = (lane.offset ?? 0) + index * lane.spacing + travel;
  return low + mod(raw - low, period);
}

/**
 * Security packets: solid traffic. Lethal on contact unless the lane declares
 * a polarity, in which case a matching player phases straight through.
 */
export function buildPacketShapes(lane, t, cols, push) {
  const n = slotCount(lane, cols);
  for (let i = 0; i < n; i++) {
    const size = objectSizeAt(lane, i);
    const polarity = objectPolarityAt(lane, i);
    const shape = push();
    shape.kind = 'packet';
    shape.index = i;
    shape.x = slotX(lane, i, t, cols);
    shape.w = size;
    shape.polarity = polarity;
    shape.hostileTo = hostileToFor(polarity);
    shape.supportFor = 'none';
    shape.blocksFor = 'none';
    shape.state = 'active';
    shape.intensity = 1;
    shape.direction = lane.direction ?? 1;
  }
}

/**
 * Pulse stream: a moving chain whose links switch on and off, opening a
 * travelling safe gap. `cycle` is the on/off period, `duty` the lit fraction,
 * and each link is offset by `phaseStep` so the gap ripples along the lane.
 */
export function buildPulseShapes(lane, t, cols, push) {
  const n = slotCount(lane, cols);
  const cycle = lane.cycle ?? 1.6;
  const duty = lane.duty ?? 0.55;
  const phaseStep = lane.phaseStep ?? 0.5;
  for (let i = 0; i < n; i++) {
    const size = objectSizeAt(lane, i);
    const polarity = objectPolarityAt(lane, i);
    const phase = mod(t / cycle + i * phaseStep + (lane.phase ?? 0), 1);
    const active = phase < duty;
    const shape = push();
    shape.kind = 'pulse';
    shape.index = i;
    shape.x = slotX(lane, i, t, cols);
    shape.w = size;
    shape.polarity = polarity;
    shape.hostileTo = active ? hostileToFor(polarity) : 'none';
    shape.supportFor = 'none';
    shape.blocksFor = 'none';
    shape.state = active ? 'active' : 'idle';
    // Ramp the glow in over the last slice of the off phase so the player can
    // see a link about to light up rather than being surprised by it.
    shape.intensity = active ? 1 : Math.max(0, (phase - duty) / (1 - duty));
    shape.direction = lane.direction ?? 1;
  }
}

/**
 * Corruption: lethal clusters that leave a decaying danger smear behind them.
 * Because cluster positions are analytic, "this tile was covered within the
 * last `trail` seconds" reduces to a rectangle of length speed * trail sitting
 * directly behind the cluster.
 */
export function buildCorruptionShapes(lane, t, cols, push) {
  const n = slotCount(lane, cols);
  const trail = lane.trail ?? 0;
  const trailLength = trail * (lane.speed ?? 0);
  const dir = lane.direction ?? 1;
  for (let i = 0; i < n; i++) {
    const size = objectSizeAt(lane, i);
    const x = slotX(lane, i, t, cols);

    if (trailLength > 0.05) {
      const smear = push();
      smear.kind = 'trail';
      smear.index = 500 + i;
      smear.x = dir > 0 ? x - trailLength : x + size;
      smear.w = trailLength;
      smear.polarity = null;
      smear.hostileTo = 'both';
      smear.supportFor = 'none';
      smear.blocksFor = 'none';
      smear.state = 'active';
      smear.intensity = 0.7;
      smear.direction = dir;
    }

    const shape = push();
    shape.kind = 'corruption';
    shape.index = i;
    shape.x = x;
    shape.w = size;
    shape.polarity = null;
    shape.hostileTo = 'both';
    shape.supportFor = 'none';
    shape.blocksFor = 'none';
    shape.state = 'active';
    shape.intensity = 1;
    shape.direction = dir;
  }
}
