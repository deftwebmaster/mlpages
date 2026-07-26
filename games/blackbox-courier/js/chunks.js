/**
 * Handcrafted route-chunk templates.
 *
 * A template describes a section of tunnel in *normalised* coordinates:
 *   t : 0 at the end the craft reaches first, 1 at the far end
 *   x : world lateral units, where the widest corridor is [-1, 1]
 *
 * Length is expressed in seconds of travel, so pacing stays constant as the run
 * speeds up; the extra pressure at high speed comes from the shorter warning
 * distance, not from chunks arriving faster than they can be read.
 *
 * Every template tapers back to full corridor width at t = 0 and t = 1, so any
 * two chunks join cleanly. The generator still validates each join.
 */

import { T } from './obstacles.js';

/* ------------------------------------------------------------------ *
 * Item constructors
 * ------------------------------------------------------------------ */

const debris = (t, x, halfW, depth = 5) => ({ kind: T.DEBRIS, t, x, halfW, depth });
const barrier = (t, x, halfW, depth = 2.6) => ({ kind: T.BARRIER, t, x, halfW, depth });
/** Build an item that exactly covers the lateral range [lo, hi]. */
const spanning = (make, t, lo, hi, depth) => make(t, (lo + hi) / 2, (hi - lo) / 2, depth);
const mine = (t, x, radius = 0.105) => ({ kind: T.MINE, t, x, radius, depth: radius * 26 });
const gate = (t, x, halfW, amp, speed, phaseOff, depth = 5) => ({
  kind: T.GATE, t, x, halfW, amp, speed, phaseOff, depth,
});
const rotor = (t, x, length, speed, phaseOff, depth = 5) => ({
  kind: T.ROTOR, t, x, length, speed, phaseOff, depth,
});
const corruption = (t, tDepth, x, halfW) => ({ kind: T.CORRUPTION, t, tDepth, x, halfW });
const collapser = (t, side, halfW, depth = 8) => ({ kind: T.COLLAPSER, t, side, halfW, depth });
const calibration = (t, x, gap, depth = 4) => ({ kind: T.CALIBRATION, t, x, gap, halfW: 1.25, depth });

const frag = (t, x) => ({ kind: 'fragment', t, x });
const repair = (t, x) => ({ kind: 'repair', t, x });
const cell = (t, x) => ({ kind: 'phase', t, x });

/** Evenly spaced fragments along a path. */
function fragLine(t0, t1, n, xAt) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0.5 : i / (n - 1);
    out.push(frag(t0 + (t1 - t0) * u, typeof xAt === 'function' ? xAt(u) : xAt));
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Wall profiles
 * ------------------------------------------------------------------ */

const FULL = () => [
  { t: 0, l: -1, r: 1 },
  { t: 1, l: -1, r: 1 },
];

/** Taper from full width down to a corridor of half-width `half` around `c`. */
const pinch = (c, half, tIn = 0.28, tOut = 0.72) => [
  { t: 0, l: -1, r: 1 },
  { t: tIn, l: c - half, r: c + half },
  { t: tOut, l: c - half, r: c + half },
  { t: 1, l: -1, r: 1 },
];

/** A corridor that drifts sideways across the chunk. */
const drift = (cA, cB, half) => [
  { t: 0, l: -1, r: 1 },
  { t: 0.22, l: cA - half, r: cA + half },
  { t: 0.78, l: cB - half, r: cB + half },
  { t: 1, l: -1, r: 1 },
];

/** Difficulty-scaled helper: value at tier 0 → value at tier 4. */
const byTier = (tier, a, b) => a + ((b - a) * Math.min(tier, 4)) / 4;

/* ------------------------------------------------------------------ *
 * Templates
 * ------------------------------------------------------------------ */

export const TEMPLATES = [
  {
    id: 'open_corridor',
    name: 'OPEN CORRIDOR',
    tiers: [0, 4],
    weight: 3,
    recovery: true,
    hard: false,
    seconds: [2.4, 3.2],
    build(rng, tier) {
      const side = rng.chance(0.5) ? -1 : 1;
      const hazards = [];
      if (tier >= 2 && rng.chance(0.55)) hazards.push(debris(0.5, side * rng.range(0.62, 0.86), 0.14));
      const pickups = fragLine(0.15, 0.9, 7, (u) => Math.sin(u * Math.PI * 1.2) * 0.42 * -side);
      if (rng.chance(0.34)) pickups.push(repair(0.55, -side * 0.3));
      return { walls: FULL(), hazards, pickups };
    },
  },

  {
    id: 'narrow_channel',
    name: 'NARROW CHANNEL',
    tiers: [0, 4],
    weight: 2.4,
    hard: false,
    seconds: [2.6, 3.4],
    build(rng, tier) {
      const half = byTier(tier, 0.42, 0.26);
      const c = rng.range(-1 + half + 0.08, 1 - half - 0.08);
      return {
        walls: pinch(c, half, 0.24, 0.78),
        hazards: [],
        pickups: fragLine(0.3, 0.74, 6, () => c),
      };
    },
  },

  {
    id: 'drift_channel',
    name: 'DRIFT CHANNEL',
    tiers: [1, 4],
    weight: 2,
    hard: false,
    seconds: [2.8, 3.6],
    build(rng, tier) {
      const half = byTier(tier, 0.4, 0.28);
      const a = rng.range(-0.5, 0.5);
      const b = -Math.sign(a || 1) * rng.range(0.28, 0.58);
      return {
        walls: drift(a, b, half),
        hazards: [],
        pickups: fragLine(0.26, 0.76, 7, (u) => a + (b - a) * u),
      };
    },
  },

  {
    id: 'alternating_gates',
    name: 'ALTERNATING GATES',
    tiers: [0, 4],
    weight: 2.6,
    hard: false,
    seconds: [2.8, 3.6],
    build(rng, tier) {
      const count = tier >= 4 ? 4 : 3;
      const opening = byTier(tier, 0.72, 0.52);
      const blockHalf = (2 - opening) / 2;
      let side = rng.chance(0.5) ? -1 : 1;
      const hazards = [];
      const pickups = [];
      for (let i = 0; i < count; i++) {
        const t = 0.12 + (i * 0.78) / Math.max(1, count - 1);
        // Block hugs one wall; the gap is on the opposite side.
        const cx = side * (1 - blockHalf);
        hazards.push(debris(t, cx, blockHalf, 4.5));
        const gapCentre = -side * (1 - opening / 2);
        pickups.push(frag(t, gapCentre));
        if (i < count - 1) pickups.push(frag(t + 0.34 / count, gapCentre * 0.4));
        side = -side;
      }
      return { walls: FULL(), hazards, pickups };
    },
  },

  {
    id: 'energy_firewall',
    name: 'ENERGY FIREWALL',
    tiers: [1, 4],
    weight: 2.2,
    hard: false,
    phaseCost: 55,
    seconds: [2.6, 3.4],
    build(rng, tier) {
      const count = tier >= 3 ? 3 : 2;
      const hazards = [];
      const pickups = [];
      for (let i = 0; i < count; i++) {
        const t = 0.24 + (i * 0.52) / Math.max(1, count - 1);
        // Full-span energy walls: the only way through is a phase shift.
        hazards.push(barrier(t, 0, 1.25, 2.8));
        pickups.push(frag(t - 0.05, 0), frag(t + 0.05, 0));
      }
      if (rng.chance(0.5)) pickups.push(cell(0.9, rng.range(-0.5, 0.5)));
      return { walls: FULL(), hazards, pickups };
    },
  },

  {
    id: 'firewall_slots',
    name: 'FIREWALL SLOTS',
    tiers: [1, 4],
    weight: 2,
    hard: false,
    seconds: [2.8, 3.6],
    build(rng, tier) {
      // Partial energy walls: a phase shift is optional — there is always a
      // physical gap, it is just tight.
      const hazards = [];
      const pickups = [];
      const n = tier >= 3 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const t = 0.2 + (i * 0.58) / Math.max(1, n - 1);
        const gapC = rng.range(-0.55, 0.55);
        const gapHalf = byTier(tier, 0.3, 0.2);
        hazards.push(spanning(barrier, t, -1.25, gapC - gapHalf, 2.6));
        hazards.push(spanning(barrier, t, gapC + gapHalf, 1.25, 2.6));
        pickups.push(frag(t, gapC));
      }
      return { walls: FULL(), hazards, pickups };
    },
  },

  {
    id: 'debris_field',
    name: 'DEBRIS FIELD',
    tiers: [0, 4],
    weight: 2.6,
    hard: false,
    seconds: [2.8, 3.8],
    build(rng, tier) {
      const rows = tier >= 3 ? 5 : tier >= 1 ? 4 : 3;
      const hazards = [];
      const pickups = [];
      // Carve a continuous safe lane first, then scatter debris outside it.
      const laneA = rng.range(-0.55, 0.55);
      const laneB = rng.range(-0.55, 0.55);
      const laneHalf = byTier(tier, 0.24, 0.17);
      for (let i = 0; i < rows; i++) {
        const u = i / Math.max(1, rows - 1);
        const t = 0.14 + u * 0.74;
        const lane = laneA + (laneB - laneA) * u;
        const blocks = rng.int(1, 2);
        for (let b = 0; b < blocks; b++) {
          const dir = b === 0 ? (rng.chance(0.5) ? -1 : 1) : b % 2 === 0 ? -1 : 1;
          const inner = lane + dir * (laneHalf + 0.06);
          const outer = dir < 0 ? -1 : 1;
          const full = Math.abs(outer - inner);
          if (full < 0.14) continue;
          // Blocks stay anchored to their wall so the free lane is unambiguous.
          const w = full * rng.range(0.6, 0.98);
          hazards.push(debris(t, outer - dir * (w / 2), w / 2, 4.4));
        }
        pickups.push(frag(t, lane));
      }
      return { walls: FULL(), hazards, pickups };
    },
  },

  {
    id: 'moving_gate',
    name: 'MOVING GATE',
    tiers: [1, 4],
    weight: 2.2,
    hard: true,
    seconds: [2.8, 3.6],
    build(rng, tier) {
      const n = tier >= 3 ? 2 : 1;
      const hazards = [];
      const pickups = [];
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.48 : 0.28 + i * 0.42;
        const halfW = byTier(tier, 0.24, 0.3);
        // Amplitude is capped so the swept band never reaches either wall: a
        // static safe lane always survives on both sides.
        const amp = Math.min(0.44, 1 - halfW - 0.3);
        const speed = byTier(tier, 1.5, 2.3) * (rng.chance(0.5) ? 1 : -1);
        hazards.push(gate(t, 0, halfW, amp, speed, rng.range(0, Math.PI * 2), 5.5));
        pickups.push(frag(t + 0.06, 0));
      }
      pickups.push(...fragLine(0.06, 0.94, 4, (u) => Math.sin(u * 4) * 0.7));
      return { walls: FULL(), hazards, pickups };
    },
  },

  {
    id: 'mine_corridor',
    name: 'MINE CORRIDOR',
    tiers: [2, 4],
    weight: 2.2,
    hard: true,
    seconds: [2.8, 3.8],
    build(rng, tier) {
      const rows = tier >= 4 ? 5 : 4;
      const hazards = [];
      const pickups = [];
      let lane = rng.range(-0.4, 0.4);
      for (let i = 0; i < rows; i++) {
        const t = 0.14 + (i * 0.72) / Math.max(1, rows - 1);
        lane += rng.range(-0.34, 0.34);
        lane = Math.max(-0.6, Math.min(0.6, lane));
        const r = 0.1;
        const step = byTier(tier, 0.5, 0.4);
        for (let k = -2; k <= 2; k++) {
          const x = lane + k * step;
          if (Math.abs(x) > 1.05) continue;
          if (Math.abs(x - lane) < 0.01) continue; // keep the lane clear
          hazards.push(mine(t, x, r));
        }
        pickups.push(frag(t, lane));
      }
      return { walls: FULL(), hazards, pickups };
    },
  },

  {
    id: 'corruption_zone',
    name: 'CORRUPTION ZONE',
    tiers: [1, 4],
    weight: 1.9,
    hard: false,
    seconds: [3.0, 3.8],
    build(rng, tier) {
      const full = tier >= 3 && rng.chance(0.45);
      const side = rng.chance(0.5) ? -1 : 1;
      const halfW = full ? 1.25 : 0.62;
      const cx = full ? 0 : side * 0.42;
      const hazards = [corruption(0.16, 0.66, cx, halfW)];
      // High-value fragments sit inside the corruption: risk buys score.
      const pickups = fragLine(0.24, 0.72, 6, (u) => cx + Math.sin(u * Math.PI) * 0.16 * side);
      pickups.push(repair(0.9, -side * 0.45));
      if (tier >= 2 && rng.chance(0.5)) hazards.push(debris(0.5, -side * 0.9, 0.12));
      return { walls: FULL(), hazards, pickups };
    },
  },

  {
    id: 'calibration_gate',
    name: 'CALIBRATION GATE',
    tiers: [0, 4],
    weight: 1.6,
    recovery: true,
    hard: false,
    seconds: [2.4, 3.0],
    build(rng, tier) {
      const x = rng.range(-0.42, 0.42);
      const gap = byTier(tier, 0.26, 0.2);
      return {
        walls: FULL(),
        hazards: [calibration(0.6, x, gap, 4)],
        pickups: fragLine(0.16, 0.5, 5, (u) => x * u),
      };
    },
  },

  {
    id: 'straightaway',
    name: 'HIGH-SPEED RUN',
    tiers: [0, 4],
    weight: 1.8,
    recovery: true,
    boost: true,
    hard: false,
    seconds: [2.6, 3.4],
    build(rng, tier) {
      const hazards = [];
      if (tier >= 2) hazards.push(debris(0.62, rng.range(-0.7, 0.7), 0.13, 4));
      const amp = 0.5;
      return {
        walls: FULL(),
        hazards,
        pickups: fragLine(0.08, 0.96, 12, (u) => Math.sin(u * Math.PI * 2.2) * amp),
      };
    },
  },

  {
    id: 'rotor_section',
    name: 'ROTOR SECTION',
    tiers: [3, 4],
    weight: 1.3,
    hard: true,
    seconds: [3.0, 3.8],
    build(rng, tier) {
      const n = tier >= 4 ? 2 : 1;
      const hazards = [];
      const pickups = [];
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : 0.3 + i * 0.4;
        // Bar length is capped so the swept band leaves lanes at both walls.
        const len = 1.05;
        hazards.push(rotor(t, 0, len, (rng.chance(0.5) ? 1 : -1) * 1.9, rng.range(0, Math.PI * 2), 5));
        pickups.push(frag(t - 0.08, rng.range(-0.8, 0.8)));
      }
      pickups.push(...fragLine(0.08, 0.92, 5, (u) => (u < 0.5 ? -0.82 : 0.82)));
      return { walls: FULL(), hazards, pickups };
    },
  },

  {
    id: 'collapsing_passage',
    name: 'COLLAPSING PASSAGE',
    tiers: [3, 4],
    weight: 1.4,
    hard: true,
    seconds: [3.0, 3.8],
    build(rng, tier) {
      const hazards = [];
      const pickups = [];
      let side = rng.chance(0.5) ? -1 : 1;
      const n = 2;
      for (let i = 0; i < n; i++) {
        const t = 0.26 + i * 0.4;
        hazards.push(collapser(t, side, byTier(tier, 0.5, 0.66), 9));
        pickups.push(frag(t + 0.04, -side * 0.62));
        side = -side;
      }
      pickups.push(cell(0.94, 0));
      return { walls: FULL(), hazards, pickups };
    },
  },
];

export const TEMPLATES_BY_ID = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));

/** Guaranteed-safe fallback used if generation ever fails validation. */
export const FALLBACK_ID = 'open_corridor';
