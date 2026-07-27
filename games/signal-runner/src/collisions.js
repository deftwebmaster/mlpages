/**
 * collisions.js — All collision categories, resolved in one fixed priority.
 *
 * Priority (per the design brief) is:
 *   1. lethal contact
 *   2. unsupported over a void lane
 *   3. uplink activation
 *   4. collectible
 *   5. near miss
 *
 * Keeping the order in one place is what makes ambiguous frames — dying while
 * touching a fragment, reaching an uplink as a packet clips you — behave the
 * same way every single time.
 */

import { CONFIG } from './config.js';
import { circleRect, pointRectDistance, clamp } from './utils.js';
import { findSupport, findIncompatibleSupport, isOverVoid } from './platforms.js';

const INSET = CONFIG.grid.objectInset;

/** Kind codes give every shape a stable numeric identity for near-miss sets. */
const KIND_CODE = {
  packet: 1,
  pulse: 2,
  corruption: 3,
  trail: 4,
  platform: 5,
  relay: 6,
  scanner: 7,
  scannerWarn: 8,
  scannerIdle: 9,
  gate: 10,
};

const NEAR_MISS_KINDS = new Set(['packet', 'corruption', 'pulse', 'scanner']);

export function shapeKey(row, shape) {
  return row * 100000 + (KIND_CODE[shape.kind] ?? 0) * 1000 + shape.index;
}

export function isHostileTo(shape, polarity) {
  return shape.hostileTo === 'both' || shape.hostileTo === polarity;
}

export function shapeTop(row) {
  return row + INSET;
}

export function shapeHeight() {
  return 1 - INSET * 2;
}

/**
 * Test the player circle against every lane band it currently overlaps.
 * `result` is caller-owned and reused to keep the hot path allocation-free.
 */
export function queryHazards(level, cx, cy, radius, polarity, result) {
  result.lethal = null;
  result.lethalLane = null;
  result.nearCount = 0;

  // Lethal contact needs real overlap, not tangency — see config.collision.epsilon.
  const hitRadius = Math.max(0, radius - CONFIG.collision.epsilon);
  const first = clamp(Math.floor(cy - radius), 0, level.rows - 1);
  const last = clamp(Math.floor(cy + radius), 0, level.rows - 1);
  const nearDist = CONFIG.collision.nearMissDistance;
  const h = shapeHeight();

  for (let row = first; row <= last; row++) {
    const lane = level.laneByRow[row];
    if (!lane || !lane.shapes.length) continue;
    const top = shapeTop(row);

    for (let i = 0; i < lane.shapes.length; i++) {
      const s = lane.shapes[i];
      if (s.hostileTo === 'none') continue;
      const deadly = isHostileTo(s, polarity);
      if (!deadly) continue;

      if (circleRect(cx, cy, hitRadius, s.x, top, s.w, h)) {
        if (!result.lethal) {
          result.lethal = s;
          result.lethalLane = lane;
        }
        continue;
      }

      if (NEAR_MISS_KINDS.has(s.kind) && result.nearCount < result.near.length) {
        const d = pointRectDistance(cx, cy, s.x, top, s.w, h);
        if (d < nearDist) {
          result.near[result.nearCount++] = shapeKey(row, s);
        }
      }
    }
  }

  return result;
}

export function makeHazardResult(maxNear = 8) {
  return {
    lethal: null,
    lethalLane: null,
    near: new Array(maxNear).fill(0),
    nearCount: 0,
  };
}

/**
 * Support test for the row the player's centre sits in. Returns:
 *   { needsSupport, platform, phasedOut }
 * `phasedOut` means a bar *is* there but on the wrong frequency — worth
 * distinguishing so the death feedback can say why.
 */
export function querySupport(level, cx, row, polarity, out) {
  out.needsSupport = false;
  out.platform = null;
  out.lane = null;
  out.phasedOut = null;

  const lane = level.laneByRow[row];
  if (!lane || !lane.isVoid) return out;
  if (!isOverVoid(lane, level.cols, cx)) return out;

  out.needsSupport = true;
  out.lane = lane;
  const grace = CONFIG.collision.platformGrace;
  out.platform = findSupport(lane.shapes, cx, polarity, grace);
  if (!out.platform) {
    out.phasedOut = findIncompatibleSupport(lane.shapes, cx, polarity, grace);
  }
  return out;
}

export function makeSupportResult() {
  return { needsSupport: false, platform: null, lane: null, phasedOut: null };
}

/**
 * Can the player legally occupy (row, col) right now?
 * Returns a reason string when they cannot, or null when the move is allowed.
 */
export function blockReason(level, row, col, polarity, uplinkStates) {
  if (col < 0 || col >= level.cols || row < 0 || row >= level.rows) return 'bounds';

  const lane = level.laneByRow[row];
  if (!lane) return 'bounds';

  if (lane.type === 'terminal') {
    const slot = level.uplinkByCol[col];
    if (slot === undefined) return 'wall';
    if (uplinkStates && uplinkStates[slot]) return 'uplinkDone';
    return null;
  }

  if (lane.type === 'gate') {
    for (let i = 0; i < lane.shapes.length; i++) {
      const s = lane.shapes[i];
      if (s.kind !== 'gate' || s.index !== col) continue;
      if (s.blocksFor === 'both' || s.blocksFor === polarity) return 'gate';
    }
  }

  if (level.wallSet && level.wallSet.has(row * 100 + col)) return 'wall';

  return null;
}

/** Has a carried player been dragged past the edge of the network? */
export function isOffBoard(level, cx) {
  const margin = CONFIG.collision.offBoardMargin;
  return cx < -margin || cx > level.cols + margin;
}
