/**
 * motion.js — The player's movement rules, as a pure state machine.
 *
 * This module deliberately knows nothing about canvases, audio or scoring. It
 * is imported by both the live game (src/player.js, which layers visuals on
 * top) and by tools/validate-levels.mjs, which drives it headlessly to prove
 * that every level can actually be finished. One implementation, one set of
 * rules, no chance of the validator certifying a game that plays differently.
 *
 * Core contract:
 *   - The player occupies a float column `x` (centre = x + 0.5) and a logical
 *     integer `row`; `y` interpolates during a move.
 *   - Moves are committed instantly and tween over `moveDuration`.
 *   - While attached to a platform, both tween endpoints drift with the
 *     platform, so a move made while riding is expressed in platform-relative
 *     space for free.
 */

import { CONFIG } from './config.js';
import { clamp, easeOutCubic } from './utils.js';
import { blockReason, querySupport, makeSupportResult } from './collisions.js';
import { shapeVelocity } from './lanes.js';
import { OPPOSITE_POLARITY } from './config.js';

export const MOVE_OK = 'ok';
export const MOVE_BUSY = 'busy';

export function createMotionState(level, polarity = 'cyan') {
  return {
    x: level.playerStart.col,
    y: level.playerStart.row,
    row: level.playerStart.row,
    polarity,
    moving: false,
    moveT: 0,
    fromX: level.playerStart.col,
    fromY: level.playerStart.row,
    toX: level.playerStart.col,
    toY: level.playerStart.row,
    /** Lane we are currently carried by, or null. */
    carryLane: null,
    /** Shape record of the supporting platform, refreshed while idle. */
    support: null,
    switchCooldown: 0,
    lastMoveDx: 0,
    lastMoveDy: -1,
    /** Set when the frame's resolution demands a death. */
    fail: null,
    /** Set when the player settled onto a terminal cell. */
    enteredUplink: -1,
    _support: makeSupportResult(),
  };
}

export function resetMotion(state, level, polarity) {
  state.x = level.playerStart.col;
  state.y = level.playerStart.row;
  state.row = level.playerStart.row;
  state.polarity = polarity ?? state.polarity;
  state.moving = false;
  state.moveT = 0;
  state.fromX = state.toX = state.x;
  state.fromY = state.toY = state.y;
  state.carryLane = null;
  state.support = null;
  state.switchCooldown = 0;
  state.fail = null;
  state.enteredUplink = -1;
}

export function centerX(state) {
  return state.x + 0.5;
}

export function centerY(state) {
  return state.y + 0.5;
}

export function canSwitchPolarity(state) {
  return state.switchCooldown <= 0;
}

export function switchPolarity(state) {
  if (!canSwitchPolarity(state)) return false;
  state.polarity = OPPOSITE_POLARITY[state.polarity];
  state.switchCooldown = CONFIG.polarity.cooldown;
  return true;
}

/**
 * Attempt a one-cell move. Returns MOVE_OK, MOVE_BUSY, or a block reason
 * string ('bounds' | 'wall' | 'gate' | 'uplinkDone').
 */
export function tryMove(state, level, dx, dy, uplinkStates) {
  if (state.moving) return MOVE_BUSY;

  // A move is aimed from the column the player is *nearest*, which matters
  // when they are mid-drift on a platform.
  const targetCol = Math.round(state.x) + dx;
  const targetRow = state.row + dy;

  const reason = blockReason(level, targetRow, targetCol, state.polarity, uplinkStates);
  if (reason) return reason;

  state.fromX = state.x;
  state.fromY = state.y;
  state.toX = targetCol;
  state.toY = targetRow;
  state.row = targetRow;
  state.moving = true;
  state.moveT = 0;
  state.lastMoveDx = dx;
  state.lastMoveDy = dy;
  return MOVE_OK;
}

/**
 * Advance motion by `dt`. Must be called after the world's lane shapes have
 * been refreshed for this frame.
 *
 * Returns an event record describing what changed, so callers can fire
 * particles / audio / scoring without re-deriving it.
 */
export function stepMotion(state, level, dt, uplinkStates, events) {
  events.settled = false;
  events.fell = false;
  events.phasedOut = false;
  events.carriedOff = false;
  events.attached = false;
  events.detached = false;

  if (state.switchCooldown > 0) state.switchCooldown = Math.max(0, state.switchCooldown - dt);

  // --- 1. Carry -----------------------------------------------------------
  // While moving we keep the attachment captured at move start; while idle we
  // re-resolve it every frame, because support is a continuous relationship.
  if (!state.moving) {
    const lane = level.laneByRow[state.row];
    const res = lane && lane.isVoid
      ? querySupport(level, centerX(state), state.row, state.polarity, state._support)
      : null;
    if (res && res.needsSupport) {
      const had = state.carryLane;
      if (res.platform) {
        state.support = res.platform;
        state.carryLane = res.lane;
        if (!had) events.attached = true;
      } else {
        state.support = null;
        state.carryLane = null;
        if (had) events.detached = true;
        events.fell = true;
        events.phasedOut = !!res.phasedOut;
      }
    } else if (state.carryLane) {
      state.support = null;
      state.carryLane = null;
      events.detached = true;
    }
  }

  if (state.carryLane) {
    const dxCarry = shapeVelocity(state.carryLane) * dt;
    state.x += dxCarry;
    state.fromX += dxCarry;
    state.toX += dxCarry;
  }

  // --- 2. Tween -----------------------------------------------------------
  if (state.moving) {
    state.moveT += dt;
    const duration = CONFIG.player.moveDuration;
    if (state.moveT >= duration) {
      state.x = state.toX;
      state.y = state.toY;
      state.moving = false;
      state.moveT = 0;
      settle(state, level, uplinkStates, events);
      events.settled = true;
    } else {
      const p = easeOutCubic(state.moveT / duration);
      state.x = state.fromX + (state.toX - state.fromX) * p;
      state.y = state.fromY + (state.toY - state.fromY) * p;
    }
  }

  // --- 3. Boundary --------------------------------------------------------
  if (
    centerX(state) < -CONFIG.collision.offBoardMargin ||
    centerX(state) > level.cols + CONFIG.collision.offBoardMargin
  ) {
    events.carriedOff = true;
  }

  return events;
}

/**
 * Resolve the destination cell once a move lands: attach to a platform and
 * stay continuous, or detach and snap cleanly into the grid.
 */
function settle(state, level, uplinkStates, events) {
  state.enteredUplink = -1;
  const lane = level.laneByRow[state.row];

  if (lane && lane.type === 'terminal') {
    const slot = level.uplinkByCol[Math.round(state.x)];
    if (slot !== undefined) state.enteredUplink = slot;
    state.x = Math.round(state.x);
    state.carryLane = null;
    state.support = null;
    return;
  }

  if (lane && lane.isVoid) {
    const res = querySupport(level, centerX(state), state.row, state.polarity, state._support);
    if (res.needsSupport) {
      if (res.platform) {
        state.support = res.platform;
        state.carryLane = res.lane;
        events.attached = true;
        return;
      }
      state.support = null;
      state.carryLane = null;
      events.fell = true;
      events.phasedOut = !!res.phasedOut;
      return;
    }
  }

  // Solid ground: detach and snap into the nearest legal column.
  if (state.carryLane) events.detached = true;
  state.carryLane = null;
  state.support = null;
  state.x = snapColumn(state, level, uplinkStates);
}

/**
 * Snap to the nearest column that the player may legally occupy. A platform
 * can drift you a fraction of a cell during a hop, so the "obvious" cell is
 * occasionally a gate that has since closed — fall back to a neighbour before
 * declaring the landing fatal.
 */
function snapColumn(state, level, uplinkStates) {
  const wanted = clamp(Math.round(state.x), 0, level.cols - 1);
  if (!blockReason(level, state.row, wanted, state.polarity, uplinkStates)) return wanted;
  for (const delta of [-1, 1]) {
    const alt = wanted + delta;
    if (alt < 0 || alt >= level.cols) continue;
    if (!blockReason(level, state.row, alt, state.polarity, uplinkStates)) return alt;
  }
  return wanted;
}
