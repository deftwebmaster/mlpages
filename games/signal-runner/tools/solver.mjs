/**
 * solver.mjs — Breadth-first route finder over the real game world.
 *
 * Shared by validate-levels.mjs (does a route exist?) and playtest.mjs
 * (drive the actual Game class along that route). It uses the engine's own
 * motion, lane and collision modules, so a route it certifies is a route the
 * browser build can genuinely walk.
 *
 * The search is exact rather than sampled because the world is a pure
 * function of time: every hazard position at tick n is computable, so
 * exploring (row, x, frequency, tick) covers the space with no guessing.
 */

import { updateWorld } from '../src/lanes.js';
import { CONFIG } from '../src/config.js';
import {
  createMotionState,
  stepMotion,
  tryMove,
  switchPolarity,
  centerX,
  centerY,
  MOVE_OK,
} from '../src/motion.js';
import { queryHazards, makeHazardResult, makeSupportResult } from '../src/collisions.js';

export const DT = 1 / 60;
export const TIME_CAP = 30;
export const MAX_TICKS = Math.round(TIME_CAP / DT);

const X_BUCKETS = 96;
const REM_BUCKETS = 14;

export const ACTIONS = [
  { name: 'wait', dx: 0, dy: 0, kind: 'wait' },
  { name: 'up', dx: 0, dy: -1, kind: 'move' },
  { name: 'left', dx: -1, dy: 0, kind: 'move' },
  { name: 'right', dx: 1, dy: 0, kind: 'move' },
  { name: 'down', dx: 0, dy: 1, kind: 'move' },
  { name: 'switch', dx: 0, dy: 0, kind: 'switch' },
];

const hazards = makeHazardResult();
const scratchSupport = makeSupportResult();
const events = {};

function cloneState(s) {
  return {
    x: s.x, y: s.y, row: s.row, polarity: s.polarity,
    moving: s.moving, moveT: s.moveT,
    fromX: s.fromX, fromY: s.fromY, toX: s.toX, toY: s.toY,
    carryLane: s.carryLane, support: s.support,
    switchCooldown: s.switchCooldown,
    lastMoveDx: s.lastMoveDx, lastMoveDy: s.lastMoveDy,
    fail: null, enteredUplink: s.enteredUplink,
    _support: scratchSupport,
    _parent: s._parent, _action: s._action,
  };
}

function stateKey(s) {
  const xb = Math.max(0, Math.min(X_BUCKETS - 1, Math.round((s.x + 1) * 8)));
  const pol = s.polarity === 'cyan' ? 0 : 1;
  let rem = 0;
  let toXb = 0;
  if (s.moving) {
    rem = Math.max(1, Math.min(REM_BUCKETS - 1,
      Math.ceil((CONFIG.player.moveDuration - s.moveT) / DT)));
    toXb = Math.max(0, Math.min(X_BUCKETS - 1, Math.round((s.toX + 1) * 8)));
  }
  return ((((s.row * 2 + pol) * REM_BUCKETS + rem) * X_BUCKETS + xb) * X_BUCKETS) + toXb;
}

export function isDeadNow(level, s) {
  if (events.fell || events.carriedOff) return true;
  queryHazards(level, centerX(s), centerY(s), CONFIG.player.radius, s.polarity, hazards);
  return hazards.lethal !== null;
}

/**
 * Find the fastest route from spawn to uplink `slot`.
 *
 * @param {object} level    prepared level
 * @param {number} slot     target uplink index
 * @param {object} options  { wantRoute, t0 }
 * @returns {{ ok, ticks, seconds, expanded, state?, route? }}
 */
export function findRoute(level, slot, options = {}) {
  const { wantRoute = false, t0 = 0 } = options;
  const uplinkStates = level.uplinks.map((_, i) => i !== slot);
  const start = createMotionState(level, 'cyan');
  start._support = scratchSupport;
  start._parent = null;
  start._action = null;

  let frontier = [start];
  let expanded = 0;

  for (let tick = 1; tick <= MAX_TICKS && frontier.length; tick++) {
    updateWorld(level, t0 + tick * DT);
    const next = [];
    const nextSeen = new Set();

    for (let i = 0; i < frontier.length; i++) {
      const base = frontier[i];

      for (let a = 0; a < ACTIONS.length; a++) {
        const action = ACTIONS[a];
        // Only an idle player may start a move or flip frequency.
        if (action.kind !== 'wait' && base.moving) continue;
        if (action.kind === 'switch' && base.switchCooldown > 0) continue;

        const s = cloneState(base);
        s._parent = base;
        s._action = action.name;

        if (action.kind === 'move') {
          if (tryMove(s, level, action.dx, action.dy, uplinkStates) !== MOVE_OK) continue;
        } else if (action.kind === 'switch') {
          if (!switchPolarity(s)) continue;
        }

        stepMotion(s, level, DT, uplinkStates, events);
        expanded++;

        if (events.settled && s.enteredUplink === slot) {
          return {
            ok: true,
            ticks: tick,
            seconds: tick * DT,
            expanded,
            state: s,
            route: wantRoute ? extractRoute(s) : null,
          };
        }
        if (isDeadNow(level, s)) continue;

        const key = stateKey(s);
        if (nextSeen.has(key)) continue;
        nextSeen.add(key);
        next.push(s);
      }
    }
    frontier = next;
  }

  return { ok: false, expanded };
}

/** Ordered list of actions, one per tick, that reaches the goal. */
export function extractRoute(endState) {
  const steps = [];
  let cur = endState;
  while (cur && cur._action) {
    steps.push(cur._action);
    cur = cur._parent;
  }
  steps.reverse();
  return steps;
}

/** Human-readable route with runs of waiting collapsed into holds. */
export function describeRoute(route) {
  const out = [];
  let waits = 0;
  for (const step of route) {
    if (step === 'wait') { waits++; continue; }
    if (waits) { out.push(`hold ${(waits * DT).toFixed(2)}s`); waits = 0; }
    out.push(step);
  }
  if (waits) out.push(`hold ${(waits * DT).toFixed(2)}s`);
  return out.join(' → ');
}

/**
 * Triviality check: can a player who never waits, never switches frequency and
 * never steps sideways simply walk from spawn to the top? Tried from many
 * start phases so one lucky alignment does not read as difficulty.
 */
export function rushSurvives(level) {
  const uplinkStates = level.uplinks.map(() => false);
  let wins = 0;
  const attempts = 60;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const t0 = attempt * 0.37;
    const s = createMotionState(level, 'cyan');
    s._support = scratchSupport;
    let alive = true;
    for (let tick = 1; tick <= MAX_TICKS; tick++) {
      updateWorld(level, t0 + tick * DT);
      if (!s.moving) tryMove(s, level, 0, -1, uplinkStates);
      stepMotion(s, level, DT, uplinkStates, events);
      if (events.settled && s.enteredUplink >= 0) break;
      if (isDeadNow(level, s)) { alive = false; break; }
      if (s.row === 0) break;
    }
    if (alive && s.enteredUplink >= 0) wins++;
  }
  return wins / attempts;
}
