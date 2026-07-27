/**
 * lanes.js — Lane runtime: turns lane *definitions* into per-frame shapes.
 *
 * A "shape" is the single currency the rest of the engine speaks. Collisions,
 * rendering and the offline level validator all consume the same records, so
 * what you can see is exactly what can kill you.
 *
 * Shapes are pooled per lane and rebuilt each frame from lane time, so the
 * steady-state allocation of the running game is zero.
 */

import { RecordPool } from './utils.js';
import {
  buildPacketShapes,
  buildPulseShapes,
  buildCorruptionShapes,
} from './laneObjects.js';
import { buildPlatformShapes, buildRelayShapes, isVoidLane } from './platforms.js';
import { buildScannerShapes } from './scanners.js';
import { buildGateShapes } from './gates.js';

export const LANE_TYPES = [
  'safe',
  'packet',
  'platform',
  'scanner',
  'corruption',
  'gate',
  'pulse',
  'relay',
  'terminal',
];

function makeShape() {
  return {
    kind: 'packet',
    index: 0,
    x: 0,
    w: 1,
    polarity: null,
    hostileTo: 'none',
    supportFor: 'none',
    blocksFor: 'none',
    state: 'active',
    intensity: 1,
    direction: 1,
  };
}

/** Attach per-lane runtime scratch space. Safe to call more than once. */
export function initLaneRuntime(level) {
  for (const lane of level.lanes) {
    lane.shapes = [];
    lane.pool = new RecordPool(makeShape);
    lane.push = () => {
      const shape = lane.pool.next();
      lane.shapes.push(shape);
      return shape;
    };
    lane.isVoid = isVoidLane(lane);
  }
}

export function updateLane(lane, t, cols) {
  lane.pool.reset();
  lane.shapes.length = 0;
  // Each lane may carry its own timing offset so identical lane definitions
  // can be reused at different phases within a level.
  const lt = t * (lane.timeScale ?? 1) + (lane.timeOffset ?? 0);

  switch (lane.type) {
    case 'packet':
      buildPacketShapes(lane, lt, cols, lane.push);
      break;
    case 'pulse':
      buildPulseShapes(lane, lt, cols, lane.push);
      break;
    case 'corruption':
      buildCorruptionShapes(lane, lt, cols, lane.push);
      break;
    case 'platform':
      buildPlatformShapes(lane, lt, cols, lane.push);
      break;
    case 'relay':
      buildRelayShapes(lane, lt, cols, lane.push);
      break;
    case 'scanner':
      buildScannerShapes(lane, lt, cols, lane.push);
      break;
    case 'gate':
      buildGateShapes(lane, lt, cols, lane.push);
      break;
    case 'safe':
    case 'terminal':
    default:
      break;
  }
}

/** Refresh every lane in the level for world time `t`. */
export function updateWorld(level, t) {
  const lanes = level.lanes;
  for (let i = 0; i < lanes.length; i++) {
    updateLane(lanes[i], t, level.cols);
  }
}

/**
 * Horizontal velocity of a shape in columns/second — the player inherits this
 * while riding a platform.
 */
export function shapeVelocity(lane) {
  return (lane.direction ?? 1) * (lane.speed ?? 0) * (lane.timeScale ?? 1);
}
