/**
 * Route generator + safe-path validator.
 *
 * Chunks are chosen from the handcrafted templates in chunks.js, resolved into
 * concrete geometry, and then *proved* traversable before they are allowed into
 * the world. Anything that fails validation is rebuilt; if that keeps failing,
 * a known-safe corridor is emitted instead. The player can therefore never meet
 * a route that has no solution.
 *
 * The validator sweeps the chunk from the near end to the far end carrying a
 * set of lateral positions the craft could occupy ("reachable intervals"):
 *
 *   1. widen the set by how far the craft can steer over this slice of depth
 *   2. remove everything blocked by hazards present in that slice
 *   3. clip to the tunnel walls
 *
 * If the set ever empties, the chunk is impossible. The set that survives to
 * the far end is carried into the next chunk, which is what makes joins between
 * chunks provably safe rather than merely plausible.
 *
 * Moving hazards are reasoned about using their *swept* extent — every position
 * they could ever occupy — so timing-based hazards are conservative by
 * construction and never depend on the player reading a phase offset.
 */

import { TEMPLATES, TEMPLATES_BY_ID, FALLBACK_ID } from './chunks.js';
import { T } from './obstacles.js';
import { PLAYER, PHASE, DIFFICULTY, SPEED } from './config.js';
import { IntervalSet, clamp } from './utils.js';

/** Half-clearance the craft needs, including a fairness margin. */
const CLEARANCE = PLAYER.radius + 0.03;
/** Wall clamp margin. */
const WALL_MARGIN = PLAYER.radius + 0.01;
/** Maximum depth advanced per validation step (bounds the widening per step). */
const MAX_STEP_Z = 1.0;
/**
 * Fraction of the craft's top speed the validator is willing to assume. Routes
 * that only work with frame-perfect steering are rejected, so an accepted route
 * always leaves the player headroom.
 */
const REACH_SAFETY = 0.75;

/* ------------------------------------------------------------------ *
 * Spec geometry
 * ------------------------------------------------------------------ */

/** Resolve an item spec's absolute depth range within the chunk. */
function specZ(spec, length) {
  const z0 = spec.t * length;
  const depth = spec.tDepth !== undefined ? spec.tDepth * length : spec.depth;
  return [z0, z0 + depth];
}

/** Every lateral range the spec's solid body could ever occupy. */
function specSwept(spec) {
  switch (spec.kind) {
    case T.CORRUPTION:
      return [];
    case T.MINE:
      return [[spec.x - spec.radius, spec.x + spec.radius]];
    case T.GATE: {
      const h = spec.halfW + spec.amp;
      return [[spec.x - h, spec.x + h]];
    }
    case T.ROTOR: {
      const h = spec.length * 0.5 + 0.035;
      return [[spec.x - h, spec.x + h]];
    }
    case T.COLLAPSER: {
      const w = spec.halfW * 2;
      return spec.side < 0 ? [[-10, -1 + w]] : [[1 - w, 10]];
    }
    case T.CALIBRATION:
      return [
        [spec.x - spec.halfW, spec.x - spec.gap],
        [spec.x + spec.gap, spec.x + spec.halfW],
      ];
    default:
      return [[spec.x - spec.halfW, spec.x + spec.halfW]];
  }
}

const isPhaseable = (spec) => spec.kind === T.BARRIER;

/* ------------------------------------------------------------------ *
 * Wall profile
 * ------------------------------------------------------------------ */

/** Interpolate a wall keyframe list at normalised position t. */
export function wallsAt(keys, t) {
  if (t <= keys[0].t) return { l: keys[0].l, r: keys[0].r };
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i];
    if (t <= b.t) {
      const a = keys[i - 1];
      const span = b.t - a.t || 1;
      const u = (t - a.t) / span;
      const s = u * u * (3 - 2 * u); // smoothstep keeps tapers gentle
      return { l: a.l + (b.l - a.l) * s, r: a.r + (b.r - a.r) * s };
    }
  }
  const last = keys[keys.length - 1];
  return { l: last.l, r: last.r };
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

/**
 * @param plan     { walls, hazards, length }
 * @param reachIn  reachable interval set entering the chunk
 * @param speed    forward speed used for the reachability budget
 * @param allowPhase treat phaseable hazards as passable
 * @returns { ok, reach }
 */
function sweep(plan, reachIn, speed, allowPhase) {
  const { walls, hazards, length } = plan;
  let reach = IntervalSet.normalize(reachIn.map((s) => [s[0], s[1]]));
  if (reach.length === 0) return { ok: false, reach };

  // Pre-resolve hazard depth ranges (padded by the craft's own depth) and spans.
  const solids = [];
  for (const spec of hazards) {
    if (spec.kind === T.CORRUPTION) continue;
    if (allowPhase && isPhaseable(spec)) continue;
    const [a, b] = specZ(spec, length);
    solids.push({
      z0: a - PLAYER.halfDepth,
      z1: b + PLAYER.halfDepth,
      spans: specSwept(spec),
    });
  }

  // Breakpoints: chunk ends, wall keyframes, and every hazard boundary.
  const points = new Set([0, length]);
  for (const k of walls) points.add(clamp(k.t * length, 0, length));
  for (const s of solids) {
    points.add(clamp(s.z0, 0, length));
    points.add(clamp(s.z1, 0, length));
  }
  const cuts = [...points].sort((a, b) => a - b);

  // Subdivide so no step widens the reachable set by more than a hazard width.
  const steps = [];
  for (let i = 1; i < cuts.length; i++) {
    const a = cuts[i - 1];
    const b = cuts[i];
    const n = Math.max(1, Math.ceil((b - a) / MAX_STEP_Z));
    for (let k = 0; k < n; k++) steps.push([a + ((b - a) * k) / n, a + ((b - a) * (k + 1)) / n]);
  }

  const lateralPerZ = (PLAYER.maxSpeed * REACH_SAFETY) / Math.max(1, speed);

  for (const [a, b] of steps) {
    const dz = b - a;
    if (dz <= 1e-6) continue;

    // Blocked ranges present anywhere in this slice.
    const blocked = [];
    for (const s of solids) {
      if (s.z1 <= a || s.z0 >= b) continue;
      for (const sp of s.spans) blocked.push(sp);
    }

    const applyBlocked = () => {
      for (const [lo, hi] of blocked) {
        reach = IntervalSet.subtract(reach, lo - CLEARANCE, hi + CLEARANCE);
      }
    };
    const applyWalls = () => {
      // Use the tightest corridor anywhere in the slice.
      const wa = wallsAt(walls, a / length);
      const wb = wallsAt(walls, b / length);
      const wm = wallsAt(walls, (a + b) / (2 * length));
      const lo = Math.max(wa.l, wb.l, wm.l) + WALL_MARGIN;
      const hi = Math.min(wa.r, wb.r, wm.r) - WALL_MARGIN;
      reach = IntervalSet.clampTo(reach, lo, hi);
    };

    applyBlocked();
    applyWalls();
    if (reach.length === 0) return { ok: false, reach };

    reach = IntervalSet.dilate(reach, lateralPerZ * dz);

    applyBlocked();
    applyWalls();
    if (reach.length === 0) return { ok: false, reach };
  }

  return { ok: true, reach };
}

/** Estimated phase energy needed to cross this chunk's mandatory barriers. */
function estimatePhaseCost(plan, speed) {
  let total = 0;
  for (const spec of plan.hazards) {
    if (!isPhaseable(spec)) continue;
    const [a, b] = specZ(spec, plan.length);
    const traversal = b - a + PLAYER.halfDepth * 2;
    total += (PHASE.drain * traversal) / Math.max(1, speed);
  }
  // Players engage phase early and release late; budget for that.
  return total * 1.6 + 8;
}

/* ------------------------------------------------------------------ *
 * Generator
 * ------------------------------------------------------------------ */

export class Generator {
  constructor(rng) {
    this.rng = rng;
    this.reset();
  }

  reset(startX = 0) {
    this.index = 0;
    this.sinceRecovery = 0;
    this.consecutiveHard = 0;
    this.lastId = null;
    this.estPhase = PHASE.max;
    this.reach = [[startX - 0.01, startX + 0.01]];
    this.failures = 0;
  }

  tierFor(elapsed) {
    let tier = 0;
    for (let i = 0; i < DIFFICULTY.tierSeconds.length; i++) {
      if (elapsed >= DIFFICULTY.tierSeconds[i]) tier = i;
    }
    return tier;
  }

  _candidates(tier, forceRecovery) {
    const out = [];
    for (const tpl of TEMPLATES) {
      if (tier < tpl.tiers[0] || tier > tpl.tiers[1]) continue;
      if (forceRecovery && !tpl.recovery) continue;
      if (!forceRecovery && tpl.recovery && this.sinceRecovery < 1) continue;
      if (tpl.hard && this.consecutiveHard >= DIFFICULTY.maxConsecutiveHard) continue;
      if (tpl.phaseCost && this.estPhase < tpl.phaseCost + DIFFICULTY.phaseBudgetMargin) continue;
      if (tpl.id === this.lastId && TEMPLATES.length > 3) continue;
      out.push(tpl);
    }
    return out;
  }

  _pick(list) {
    let total = 0;
    for (const t of list) total += t.weight;
    let r = this.rng() * total;
    for (const t of list) {
      r -= t.weight;
      if (r <= 0) return t;
    }
    return list[list.length - 1];
  }

  /**
   * Produce the next validated chunk plan.
   * @param elapsed run time in seconds
   * @param speed   current forward speed (z units / second)
   */
  next(elapsed, speed) {
    const tier = this.tierFor(elapsed);
    const recoveryEvery = DIFFICULTY.recoveryEvery[Math.min(tier, DIFFICULTY.recoveryEvery.length - 1)];
    const forceRecovery = this.sinceRecovery >= recoveryEvery;

    let list = this._candidates(tier, forceRecovery);
    if (list.length === 0) list = this._candidates(tier, false);
    if (list.length === 0) list = [TEMPLATES_BY_ID[FALLBACK_ID]];

    for (let attempt = 0; attempt < 8; attempt++) {
      const tpl = attempt < 6 ? this._pick(list) : TEMPLATES_BY_ID[FALLBACK_ID];
      const seconds = this.rng.range(tpl.seconds[0], tpl.seconds[1]);
      const length = Math.max(48, seconds * clamp(speed, SPEED.start, SPEED.max));
      const built = tpl.build(this.rng, tier);
      const plan = {
        id: tpl.id,
        name: tpl.name,
        template: tpl,
        reachIn: this.reach,
        length,
        seconds,
        tier,
        boost: !!tpl.boost,
        walls: built.walls,
        hazards: built.hazards,
        pickups: built.pickups,
      };

      const noPhase = sweep(plan, this.reach, speed, false);
      let requiresPhase = false;
      let result = noPhase;

      if (!noPhase.ok) {
        const withPhase = sweep(plan, this.reach, speed, true);
        if (!withPhase.ok) continue; // impossible even with phase — rebuild
        const cost = estimatePhaseCost(plan, speed);
        if (this.estPhase < cost + DIFFICULTY.phaseBudgetMargin) continue;
        requiresPhase = true;
        plan.phaseCost = cost;
        result = withPhase;
      }

      plan.requiresPhase = requiresPhase;
      plan.reachOut = result.reach;
      this._commit(plan, seconds);
      return plan;
    }

    // Every attempt failed: emit a corridor that is safe by construction.
    this.failures++;
    const plan = this._safeCorridor(speed, tier);
    this._commit(plan, plan.seconds);
    return plan;
  }

  _safeCorridor(speed, tier) {
    const length = Math.max(48, 2.8 * clamp(speed, SPEED.start, SPEED.max));
    return {
      id: FALLBACK_ID,
      name: 'OPEN CORRIDOR',
      template: TEMPLATES_BY_ID[FALLBACK_ID],
      length,
      seconds: 2.8,
      tier,
      boost: false,
      walls: [
        { t: 0, l: -1, r: 1 },
        { t: 1, l: -1, r: 1 },
      ],
      hazards: [],
      pickups: [
        { kind: 'fragment', t: 0.3, x: 0 },
        { kind: 'fragment', t: 0.5, x: 0 },
        { kind: 'fragment', t: 0.7, x: 0 },
      ],
      requiresPhase: false,
      reachOut: IntervalSet.clampTo(
        IntervalSet.dilate(this.reach, ((PLAYER.maxSpeed * REACH_SAFETY) / Math.max(1, speed)) * length),
        -1 + WALL_MARGIN,
        1 - WALL_MARGIN
      ),
    };
  }

  _commit(plan, seconds) {
    this.reach = plan.reachOut.length ? plan.reachOut : [[-0.2, 0.2]];
    this.lastId = plan.id;
    this.index++;
    this.sinceRecovery = plan.template.recovery ? 0 : this.sinceRecovery + 1;
    this.consecutiveHard = plan.template.hard ? this.consecutiveHard + 1 : 0;

    // Phase budget carried to the next decision.
    const recovered = PHASE.recharge * seconds;
    const spent = plan.requiresPhase ? plan.phaseCost : 0;
    this.estPhase = clamp(this.estPhase - spent + recovered, 0, PHASE.max);
  }
}

/** Exposed for the offline route audit in tools/. */
export const _internals = { sweep, specSwept, specZ, estimatePhaseCost, CLEARANCE };
