/**
 * Headless audit of the simulation.
 *
 *   node tools/audit.mjs [--runs 12] [--seconds 300]
 *
 * The gameplay modules are free of browser dependencies, so the whole
 * simulation can be driven from Node. This exercises the things that are slow
 * and unreliable to check by hand: route validity across thousands of chunks,
 * frame-rate independence, collision reliability at maximum speed, and pool
 * growth over long runs.
 *
 * Exits non-zero if any assertion fails.
 */

import { World } from '../js/world.js';
import { Player } from '../js/player.js';
import { CollisionSystem } from '../js/collisions.js';
import { Generator, wallsAt, _internals } from '../js/generator.js';
import { TEMPLATES } from '../js/chunks.js';
import { T } from '../js/obstacles.js';
import { PLAYER, SPEED, STABILITY, PHASE, WORLD, COLLISION } from '../js/config.js';
import { makeRng, IntervalSet, clamp } from '../js/utils.js';

const args = process.argv.slice(2);
const argOf = (name, def) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? Number(args[i + 1]) : def;
};
const RUNS = argOf('runs', 12);
const SECONDS = argOf('seconds', 300);

let failures = 0;
let checks = 0;

function ok(cond, label, detail = '') {
  checks++;
  if (!cond) {
    failures++;
    console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`);
  } else {
    console.log(`  ✓ ${label}${detail ? ' — ' + detail : ''}`);
  }
}

function section(name) {
  console.log(`\n${name}`);
}

/* ------------------------------------------------------------------ *
 * 1. Route generation
 * ------------------------------------------------------------------ */

section('1. Route generation and safe-path validation');
{
  const seen = new Map();
  let chunks = 0;
  let fallbacks = 0;
  let phaseChunks = 0;
  let emptyReach = 0;
  let narrowest = Infinity;
  let reverifyFailures = 0;

  for (let run = 0; run < 40; run++) {
    const rng = makeRng(1000 + run);
    const gen = new Generator(rng);
    let elapsed = 0;
    for (let i = 0; i < 120; i++) {
      const speed = clamp(SPEED.start + elapsed * 0.18, SPEED.start, SPEED.max);
      const plan = gen.next(elapsed, speed);
      chunks++;
      elapsed += plan.seconds;
      seen.set(plan.id, (seen.get(plan.id) || 0) + 1);
      if (plan.requiresPhase) phaseChunks++;
      if (!plan.reachOut || plan.reachOut.length === 0) emptyReach++;

      // Independent re-verification: sweep the finished chunk again from the
      // exact set it was accepted against.
      const re = _internals.sweep(plan, plan.reachIn, speed, plan.requiresPhase);
      if (!re.ok) reverifyFailures++;

      // Corridor never narrows below what the craft can physically fit through.
      for (let t = 0; t <= 1.0001; t += 0.02) {
        const w = wallsAt(plan.walls, t);
        narrowest = Math.min(narrowest, w.r - w.l);
      }
      if (gen.failures > fallbacks) fallbacks = gen.failures;
    }
  }

  ok(emptyReach === 0, 'every generated chunk leaves a reachable exit', `${chunks} chunks`);
  ok(reverifyFailures === 0, 'every chunk re-verifies against an independent sweep', `${reverifyFailures} failures`);
  ok(fallbacks === 0, 'no chunk fell back to the safety corridor', `${fallbacks} fallbacks`);
  ok(
    narrowest >= PLAYER.radius * 2 + 0.04,
    'narrowest corridor still fits the craft',
    `min width ${narrowest.toFixed(3)} vs craft ${(PLAYER.radius * 2).toFixed(3)}`
  );
  ok(seen.size === TEMPLATES.length, 'every chunk template is reachable by the generator',
    `${seen.size}/${TEMPLATES.length}`);
  ok(phaseChunks > 0, 'phase-mandatory chunks are produced', `${phaseChunks} of ${chunks}`);

  const missing = TEMPLATES.filter((t) => !seen.has(t.id)).map((t) => t.id);
  if (missing.length) console.log(`     missing: ${missing.join(', ')}`);
  const dist = [...seen.entries()].sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}:${((v / chunks) * 100).toFixed(1)}%`).join('  ');
  console.log(`     mix: ${dist}`);
}

/* ------------------------------------------------------------------ *
 * 2. Conservative geometry guarantees for moving hazards
 * ------------------------------------------------------------------ */

section('2. Moving hazards leave a static lane');
{
  const rng = makeRng(7);
  let worstGate = Infinity;
  let worstRotor = Infinity;
  for (let tier = 0; tier <= 4; tier++) {
    for (const tpl of TEMPLATES) {
      if (tier < tpl.tiers[0] || tier > tpl.tiers[1]) continue;
      for (let i = 0; i < 60; i++) {
        const built = tpl.build(rng, tier);
        for (const h of built.hazards) {
          if (h.kind === T.GATE) {
            worstGate = Math.min(worstGate, 1 - (h.halfW + h.amp + Math.abs(h.x)));
          } else if (h.kind === T.ROTOR) {
            worstRotor = Math.min(worstRotor, 1 - (h.length * 0.5 + 0.035 + Math.abs(h.x)));
          }
        }
      }
    }
  }
  const need = PLAYER.radius + 0.03;
  ok(worstGate >= need, 'sliding gates never sweep the full corridor',
    `narrowest surviving lane ${worstGate.toFixed(3)} ≥ ${need.toFixed(3)}`);
  ok(worstRotor >= need, 'rotors never sweep the full corridor',
    `narrowest surviving lane ${worstRotor.toFixed(3)} ≥ ${need.toFixed(3)}`);
}

/* ------------------------------------------------------------------ *
 * Simulation harness
 * ------------------------------------------------------------------ */

const CLEARANCE = PLAYER.radius + 0.03;
const spanBuf = [];

/** Free lateral intervals at world depth z, from live entities. */
function freeAt(world, z, allowPhase) {
  const w = world.wallAt(Math.max(0, z));
  let free = [[w.l + PLAYER.radius, w.r - PLAYER.radius]];
  for (const { h } of world.allHazards()) {
    if (h.type === T.CORRUPTION) continue;
    if (allowPhase && h.isPhaseable) continue;
    if (h.zFar + PLAYER.halfDepth < z || h.z - PLAYER.halfDepth > z) continue;
    const spans = h.blockedSpans(spanBuf);
    for (const [lo, hi] of spans) free = IntervalSet.subtract(free, lo - CLEARANCE, hi + CLEARANCE);
  }
  return free;
}

/**
 * Reference pilot.
 *
 * Scans the corridor ahead at a fine step, finds the first depth at which its
 * current line is blocked, and steers at the nearest free lane there. When that
 * lane only exists with a phase shift, it phases. Deliberately simple — its job
 * is to demonstrate that generated routes are survivable, not to play well.
 */
function autopilot(world, player) {
  const horizon = clamp(world.speed * 1.7, 45, 95);
  const step = 2;
  let target = player.x;
  let wantPhase = false;
  let phaseNeededAt = Infinity;

  // Pass 1: thread a single lane through every slice ahead, nearest first.
  for (let z = 1; z <= horizon; z += step) {
    const solid = freeAt(world, z, false);
    if (solid.length === 0) {
      const phased = freeAt(world, z, true);
      if (phased.length === 0) break; // unreachable slice — nothing to plan for
      phaseNeededAt = Math.min(phaseNeededAt, z);
      if (!IntervalSet.contains(phased, target)) target = nearestIn(phased, target);
      continue;
    }
    if (!IntervalSet.contains(solid, target)) target = nearestIn(solid, target);
  }

  // Pass 2: the immediate slices win any conflict the far plan introduced.
  for (let z = 1; z <= Math.min(horizon, 14); z += step) {
    const solid = freeAt(world, z, false);
    if (solid.length && !IntervalSet.contains(solid, target)) target = nearestIn(solid, target);
  }

  // Engage phase just before entering a barrier and hold until through it.
  if (phaseNeededAt < world.speed * 0.5 && player.phaseEnergy > PHASE.minActivation + 6) {
    wantPhase = true;
  }
  for (const { h } of world.allHazards()) {
    if (h.type !== T.BARRIER) continue;
    if (h.z < PLAYER.halfDepth + 4 && h.zFar > -PLAYER.halfDepth - 1) {
      const free = freeAt(world, Math.max(0, h.z), false);
      if (!IntervalSet.contains(free, player.x) && player.phaseEnergy > 2) wantPhase = true;
    }
  }

  return { steerTarget: clamp(target, -0.97, 0.97), steerAxis: 0, phaseHeld: wantPhase };
}

function nearestIn(set, x) {
  let best = x;
  let bestD = Infinity;
  for (const [lo, hi] of set) {
    const c = clamp(x, lo + 0.01, hi - 0.01);
    const d = Math.abs(c - x) - (hi - lo) * 0.12; // prefer wider lanes
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/** Run one full simulated delivery. */
function simulate({ seed, dt, maxSeconds, pilot = true }) {
  const rng = makeRng(seed);
  const world = new World(rng);
  const player = new Player();
  const collisions = new CollisionSystem();
  world.reset(0);
  world.ensureAhead(0);

  const state = {
    time: 0,
    distance: 0,
    stability: STABILITY.start,
    fragments: 0,
    nearMisses: 0,
    damage: 0,
    invuln: 0,
    cause: null,
    maxChunks: 0,
    maxObstacles: 0,
    maxCollectibles: 0,
    maxLive: 0,
  };

  const input = { steerTarget: null, steerAxis: 0, phaseHeld: false };

  while (state.time < maxSeconds) {
    state.time += dt;
    if (state.invuln > 0) state.invuln = Math.max(0, state.invuln - dt);

    if (pilot) Object.assign(input, autopilot(world, player));

    const dz = world.update(dt, state.time, 1);
    state.distance += dz;

    player.update(dt, input, world.wallAt(0), {});

    const res = collisions.resolve(world, player, dt, state.invuln);

    if (player.crushed) {
      state.cause = 'crushed';
      break;
    }
    if (res.lethal) {
      state.cause = res.lethalType;
      break;
    }

    let drain = STABILITY.baseDrain * dt + player.phaseStabilityCost(dt);
    if (res.inCorruption) drain += STABILITY.corruptionDrain * dt;
    if (player.scraping !== 0) drain += STABILITY.scrapeDrain * dt;
    state.stability -= drain;
    if (res.damage > 0) {
      state.stability -= res.damage;
      state.damage++;
      state.invuln = STABILITY.invulnAfterHit;
    }
    for (const p of res.collected) {
      if (p.type === 'fragment') state.fragments++;
      else if (p.type === 'repair') state.stability = Math.min(STABILITY.max, state.stability + STABILITY.repairNode);
      else player.addPhaseEnergy(45);
    }
    for (const g of res.calibrations) {
      state.stability = Math.min(STABILITY.max, state.stability + STABILITY.calibrationGate);
    }
    state.nearMisses += res.nearMisses.length;

    if (state.stability <= 0) {
      state.cause = 'payload';
      break;
    }
    if (state.stability > STABILITY.max) state.stability = STABILITY.max;

    state.maxChunks = Math.max(state.maxChunks, world.chunks.length);
    state.maxObstacles = Math.max(state.maxObstacles, world.obstacles.size);
    state.maxCollectibles = Math.max(state.maxCollectibles, world.collectibles.size);
    state.maxLive = Math.max(state.maxLive, world.liveObstacleCount);

    if (!Number.isFinite(player.x) || Math.abs(player.x) > 1.2) {
      state.cause = 'out-of-bounds';
      break;
    }
  }
  state.world = world;
  return state;
}

/* ------------------------------------------------------------------ *
 * 3. Long runs
 * ------------------------------------------------------------------ */

section(`3. Long runs (${RUNS} runs × up to ${SECONDS}s, autopiloted)`);
{
  const results = [];
  for (let i = 0; i < RUNS; i++) {
    results.push(simulate({ seed: 4242 + i * 17, dt: 1 / 60, maxSeconds: SECONDS }));
  }

  const survived = results.filter((r) => !r.cause).length;
  const times = results.map((r) => r.time).sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  const causes = {};
  for (const r of results) if (r.cause) causes[r.cause] = (causes[r.cause] || 0) + 1;

  console.log(`     survival: ${survived}/${RUNS} reached ${SECONDS}s; median ${median.toFixed(1)}s`);
  console.log(`     ends: ${Object.entries(causes).map(([k, v]) => `${k}×${v}`).join('  ') || 'none'}`);

  ok(median >= 60, 'a simple pilot survives at least a minute on median', `${median.toFixed(1)}s`);
  ok(!results.some((r) => r.cause === 'out-of-bounds'), 'craft never leaves the corridor');

  const maxChunks = Math.max(...results.map((r) => r.maxChunks));
  const maxObs = Math.max(...results.map((r) => r.maxObstacles));
  const maxCol = Math.max(...results.map((r) => r.maxCollectibles));
  ok(maxChunks <= 12, 'live chunk list stays bounded', `peak ${maxChunks}`);
  ok(maxObs <= 200, 'obstacle pool does not grow without bound', `peak ${maxObs} slots`);
  ok(maxCol <= 320, 'collectible pool does not grow without bound', `peak ${maxCol} slots`);

  const frags = results.reduce((a, r) => a + r.fragments, 0);
  const nm = results.reduce((a, r) => a + r.nearMisses, 0);
  console.log(`     collected ${frags} fragments, ${nm} near misses across all runs`);
  ok(frags > 0, 'fragments are collectable');
  ok(nm > 0, 'near misses fire');
}

/* ------------------------------------------------------------------ *
 * 4. Frame-rate independence
 * ------------------------------------------------------------------ */

section('4. Frame-rate independence');
{
  const seed = 90210;
  const T_END = 45;
  const at144 = simulate({ seed, dt: 1 / 144, maxSeconds: T_END, pilot: false });
  const at60 = simulate({ seed, dt: 1 / 60, maxSeconds: T_END, pilot: false });
  const at30 = simulate({ seed, dt: 1 / 30, maxSeconds: T_END, pilot: false });

  const d = [at144.distance, at60.distance, at30.distance];
  const spread = (Math.max(...d) - Math.min(...d)) / Math.max(...d);
  console.log(`     distance @144/60/30 Hz: ${d.map((v) => v.toFixed(1)).join(' / ')}`);
  ok(spread < 0.02, 'distance travelled is frame-rate independent', `${(spread * 100).toFixed(2)}% spread`);

  const s = [at144.stability, at60.stability, at30.stability];
  const sSpread = (Math.max(...s) - Math.min(...s)) / 100;
  ok(sSpread < 0.02, 'stability drain is frame-rate independent', `${(sSpread * 100).toFixed(2)}% spread`);
}

/* ------------------------------------------------------------------ *
 * 5. Collision reliability
 * ------------------------------------------------------------------ */

section('5. Collision reliability');
{
  /** Build a minimal world containing exactly one hazard in front of the craft. */
  function scenario(type, extra = {}) {
    const world = new World(makeRng(1));
    world.reset(0);
    world.chunks.length = 0;
    world.obstacles.releaseAll();
    world.collectibles.releaseAll();
    const o = world.obstacles.acquire();
    o.type = type;
    o.x = o.baseX = 0;
    o.halfW = 0.4;
    o.radius = 0.12;
    o.gap = 0.24;
    o.length = 0.6;
    o.depth = extra.depth ?? 3;
    o.z = extra.z ?? 40;
    o.prevZ = o.z;
    Object.assign(o, extra);
    // A one-chunk world so wallAt() reports the full corridor.
    world.chunks.push({
      plan: { walls: [{ t: 0, l: -1, r: 1 }, { t: 1, l: -1, r: 1 }] },
      zStart: -20, length: 200, get zEnd() { return 180; }, get traversed() { return false; },
      hazards: [o], pickups: [], fragTotal: 0, fragTaken: 0,
      damaged: false, corrupted: false, scraped: false, resolved: false, active: true,
    });
    return { world, o };
  }

  /** Step the hazard toward the craft at `speed` using frame time `dt`. */
  function crash(type, { phased = false, dt = 1 / 30, speed = SPEED.max + 20, x = 0, extra = {} } = {}) {
    const { world, o } = scenario(type, extra);
    const player = new Player();
    player.x = x;
    player.phased = phased;
    const cs = new CollisionSystem();
    let lethal = false;
    let damage = 0;
    for (let i = 0; i < 200 && o.z > -20; i++) {
      o.advance(speed * dt);
      o.update(dt);
      const res = cs.resolve(world, player, dt, 0);
      if (res.lethal) lethal = true;
      damage += res.damage;
    }
    return { lethal, damage };
  }

  ok(crash(T.DEBRIS).lethal, 'debris is lethal at maximum speed with 30 Hz frames');
  ok(crash(T.DEBRIS, { dt: 1 / 15 }).lethal, 'debris is still lethal at 15 Hz (no tunnelling)');
  ok(crash(T.DEBRIS, { phased: true }).lethal, 'phasing does not pass through solid debris');
  ok(crash(T.GATE, { extra: { amp: 0, speed: 0 } }).lethal, 'sliding gates are solid');
  ok(crash(T.MINE).lethal, 'mine core is lethal');
  {
    const graze = crash(T.MINE, { x: 0.15 });
    ok(graze.damage > 0 && !graze.lethal, 'mine outer ring damages without killing',
      `${graze.damage} stability`);
  }
  ok(!crash(T.BARRIER, { phased: true }).lethal, 'energy barrier is passable while phased');
  ok(crash(T.BARRIER, { phased: true }).damage === 0, 'phasing a barrier costs no stability hit');
  ok(crash(T.BARRIER, { phased: false }).damage >= STABILITY.minorCollision,
    'energy barrier damages an un-phased craft');
  ok(!crash(T.BARRIER, { phased: false }).lethal, 'energy barrier is never instantly lethal');
  ok(crash(T.CALIBRATION, { x: 0.6, extra: { halfW: 1.25, gap: 0.24 } }).lethal,
    'calibration gate sides are solid');
  ok(!crash(T.CALIBRATION, { x: 0, extra: { halfW: 1.25, gap: 0.24 } }).lethal,
    'calibration gate opening is passable');

  // Near miss: skim a lethal block without touching it.
  {
    const nearGap = 0.4 + PLAYER.radius * COLLISION.playerForgiveness + 0.05;
    const skim = (() => {
      const { world, o } = scenario(T.DEBRIS, { z: 40, depth: 3 });
      const player = new Player();
      player.x = nearGap;
      const cs = new CollisionSystem();
      let hits = 0;
      let lethal = false;
      for (let i = 0; i < 400 && o.z > -20; i++) {
        o.advance(40 / 60);
        o.update(1 / 60);
        const res = cs.resolve(world, player, 1 / 60, 0);
        if (res.lethal) lethal = true;
        hits += res.nearMisses.length;
      }
      return { hits, lethal };
    })();
    ok(skim.hits === 1 && !skim.lethal, 'a close pass awards exactly one near miss',
      `${skim.hits} near misses, lethal=${skim.lethal}`);
  }

  // Far pass: no near miss.
  {
    const { world, o } = scenario(T.DEBRIS, { z: 40, depth: 3 });
    const player = new Player();
    player.x = 0.95;
    const cs = new CollisionSystem();
    let hits = 0;
    for (let i = 0; i < 400 && o.z > -20; i++) {
      o.advance(40 / 60);
      o.update(1 / 60);
      hits += cs.resolve(world, player, 1 / 60, 0).nearMisses.length;
    }
    ok(hits === 0, 'a wide pass awards no near miss', `${hits}`);
  }

  // A collectible must fire exactly once even across a very long frame.
  {
    const world = new World(makeRng(2));
    world.reset(0);
    world.chunks.length = 0;
    const p = world.collectibles.acquire();
    p.type = 'fragment';
    p.x = 0;
    p.z = 30;
    p.prevZ = 30;
    world.chunks.push({
      plan: { walls: [{ t: 0, l: -1, r: 1 }, { t: 1, l: -1, r: 1 }] },
      zStart: -20, length: 200, get zEnd() { return 180; }, get traversed() { return false; },
      hazards: [], pickups: [p], fragTotal: 1, fragTaken: 0,
      damaged: false, corrupted: false, scraped: false, resolved: false, active: true,
    });
    const player = new Player();
    const cs = new CollisionSystem();
    let hits = 0;
    for (let i = 0; i < 40; i++) {
      p.advance(12);
      hits += cs.resolve(world, player, 1 / 20, 0).collected.length;
    }
    ok(hits === 1, 'a collectible triggers exactly once', `${hits} triggers`);
  }
}

/* ------------------------------------------------------------------ *
 * 6. Phase energy behaviour
 * ------------------------------------------------------------------ */

section('6. Phase energy');
{
  const p = new Player();
  const held = { steerTarget: null, steerAxis: 0, phaseHeld: true };
  const idle = { steerTarget: null, steerAxis: 0, phaseHeld: false };
  const wall = { l: -1, r: 1 };
  let emptied = 0;
  let starts = 0;

  for (let i = 0; i < 600; i++) {
    p.update(1 / 60, held, wall, {
      onPhaseEmpty: () => emptied++,
      onPhaseStart: () => starts++,
    });
  }
  ok(emptied === 1, 'phase deactivates automatically when energy runs out', `${emptied} depletions`);
  ok(starts === 1 && !p.phased,
    'a held control does not strobe phase back on after depletion', `${starts} activations`);

  for (let i = 0; i < 600; i++) p.update(1 / 60, idle, wall, {});
  ok(Math.abs(p.phaseEnergy - PHASE.max) < 0.001, 'phase energy recharges to full and stops there');

  p.phaseEnergy = PHASE.minActivation - 1;
  p.update(1 / 60, held, wall, {});
  ok(!p.phased, 'phase cannot be engaged below the activation threshold');

  // Drain and recharge rates match the configuration.
  p.phaseEnergy = PHASE.max;
  p.phased = false;
  for (let i = 0; i < 60; i++) p.update(1 / 60, held, wall, {});
  ok(Math.abs(PHASE.max - p.phaseEnergy - PHASE.drain) < 0.6,
    'drain rate matches config', `${(PHASE.max - p.phaseEnergy).toFixed(2)}/s vs ${PHASE.drain}`);
}

/* ------------------------------------------------------------------ *
 * 7. Corridor clamping
 * ------------------------------------------------------------------ */

section('7. Corridor clamping and wall crush');
{
  const p = new Player();
  p.x = 0;
  const input = { steerTarget: 5, steerAxis: 0, phaseHeld: false };
  for (let i = 0; i < 300; i++) p.update(1 / 60, input, { l: -1, r: 1 }, {});
  ok(p.x <= 1 - PLAYER.radius + 1e-6, 'craft is clamped inside the corridor', `x=${p.x.toFixed(4)}`);
  ok(p.scraping === 1, 'scraping is reported while held against a wall');

  const q = new Player();
  q.update(1 / 60, { steerTarget: null, steerAxis: 0, phaseHeld: false },
    { l: -0.02, r: 0.02 }, {});
  ok(q.crushed, 'a corridor narrower than the craft is fatal');

  const r = new Player();
  r.update(1 / 60, { steerTarget: null, steerAxis: 0, phaseHeld: false },
    { l: -PLAYER.radius, r: PLAYER.radius }, {});
  ok(!r.crushed, 'a corridor exactly craft-width is survivable');
}

/* ------------------------------------------------------------------ *
 * 8. Collision forgiveness
 * ------------------------------------------------------------------ */

section('8. Collision forgiveness');
{
  ok(COLLISION.forgiveness < 1 && COLLISION.playerForgiveness < 1,
    'collision shapes are smaller than what is drawn',
    `hazard ${COLLISION.forgiveness}, craft ${COLLISION.playerForgiveness}`);
  const p = new Player();
  ok(p.radius < p.visualRadius, 'craft collision radius is inside its silhouette',
    `${p.radius.toFixed(4)} < ${p.visualRadius.toFixed(4)}`);
}

/* ------------------------------------------------------------------ */

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${checks - failures}/${checks} checks passed`);
process.exit(failures === 0 ? 0 : 1);
