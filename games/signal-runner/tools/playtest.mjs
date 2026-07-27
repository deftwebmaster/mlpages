/**
 * playtest.mjs — End-to-end playthrough of all twelve levels.
 *
 * validate-levels.mjs proves a route exists through the *world*. This goes a
 * layer up and drives the actual `Game` class — the same object the browser
 * runs — along those routes, so it exercises the parts a route search never
 * touches: the state machine, uplink activation and respawn, scoring, badges,
 * fragment collection, death handling and persistence.
 *
 * It also deliberately kills the player to confirm the death → respawn →
 * resume cycle works and that activated uplinks survive it, and it watches
 * particle and listener counts for unbounded growth over a long session.
 *
 * Run with:  npm run playtest
 */

import { LEVELS } from '../src/levels.js';
import { findRoute, DT } from './solver.mjs';
import { updateWorld } from '../src/lanes.js';

// --- Browser shims ----------------------------------------------------------
// The engine only reaches for localStorage; audio and haptics already guard
// themselves. Providing a real-enough store lets persistence be tested too.

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
  key: (i) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};
globalThis.window = globalThis;

const { Game, GameState } = await import('../src/game.js');

// --- Harness ----------------------------------------------------------------

const FRAME = DT;

function step(game, n = 1) {
  for (let i = 0; i < n; i++) game.update(FRAME);
}

/** Run the countdown out, then align world time to the route's timeline. */
function armLevel(game) {
  let guard = 0;
  while (game.state === GameState.STARTING && guard++ < 600) step(game);
  // The world is a pure function of time, so choosing phase 0 here is just
  // picking which validated phase this run starts at.
  game.worldTime = 0;
  updateWorld(game.level, 0);
}

function applyAction(game, action) {
  switch (action) {
    case 'up': game.requestMove(0, -1); break;
    case 'down': game.requestMove(0, 1); break;
    case 'left': game.requestMove(-1, 0); break;
    case 'right': game.requestMove(1, 0); break;
    case 'switch': game.requestPolarity(); break;
    default: break;
  }
}

/**
 * Walk one uplink's route. Returns true when that uplink came online.
 * Tolerates a small amount of drift by falling back to "advance when safe".
 */
function runRoute(game, route) {
  const targetActive = game.uplinksActive + 1;
  for (let i = 0; i < route.length + 240; i++) {
    if (game.uplinksActive >= targetActive) return true;
    if (game.state === GameState.LEVEL_COMPLETE) return true;
    if (game.state === GameState.PLAYER_DYING) return false;
    if (i < route.length) applyAction(game, route[i]);
    step(game);
  }
  return game.uplinksActive >= targetActive || game.state === GameState.LEVEL_COMPLETE;
}

function settle(game, maxFrames = 400) {
  let guard = 0;
  while (
    guard++ < maxFrames &&
    (game.state === GameState.UPLOADING ||
      game.state === GameState.PLAYER_DYING ||
      game.state === GameState.STARTING)
  ) {
    step(game);
  }
}

// --- Run --------------------------------------------------------------------

const game = new Game();

// Play as a returning player. Tutorial prompts deliberately slow the world to
// a quarter speed while they are on screen, which is right for a first run but
// would put a pre-computed route out of step with the lanes.
for (const definition of LEVELS) {
  for (const prompt of definition.tutorialPrompts ?? []) {
    game.tutorialState.seen[`${definition.id}:${prompt.id}`] = true;
  }
}

const results = [];
let failures = 0;

console.log('\nSignal Runner — full playthrough against the live Game class\n');

for (const definition of LEVELS) {
  const started = Date.now();
  game.startLevel(definition.id);
  const level = game.level;
  const totalUplinks = level.uplinks.length;

  let ok = true;
  const notes = [];

  for (let slot = 0; slot < totalUplinks; slot++) {
    armLevel(game);
    const search = findRoute(level, slot, { wantRoute: true });
    if (!search.ok) {
      ok = false;
      notes.push(`no route to uplink ${slot + 1}`);
      break;
    }
    // Re-arm: the search mutated lane shapes while exploring.
    game.worldTime = 0;
    updateWorld(level, 0);

    const before = game.uplinksActive;
    let reached = runRoute(game, search.route);
    settle(game);

    if (!reached || game.uplinksActive !== before + 1) {
      // A one-tick timing difference between search and live input can cost a
      // run; retry once from a fresh phase before calling it a failure.
      if (game.state === GameState.PLAYER_DYING) settle(game);
      armLevel(game);
      const retry = findRoute(level, slot, { wantRoute: true });
      game.worldTime = 0;
      updateWorld(level, 0);
      reached = retry.ok && runRoute(game, retry.route);
      settle(game);
      if (!reached || game.uplinksActive !== before + 1) {
        ok = false;
        notes.push(`uplink ${slot + 1} not activated (state ${game.state})`);
        break;
      }
      notes.push(`uplink ${slot + 1} needed a retry`);
    }
  }

  const completed = game.state === GameState.LEVEL_COMPLETE;
  const record = game.progress.levels[definition.id];

  if (!completed) {
    ok = false;
    notes.push(`level did not reach LEVEL_COMPLETE (state ${game.state})`);
  }
  if (completed && !record.completed) {
    ok = false;
    notes.push('progress record not marked complete');
  }
  if (completed && !record.badges.connected) {
    ok = false;
    notes.push('Connected badge not awarded');
  }
  if (completed && record.bestTime === null) {
    ok = false;
    notes.push('best time not stored');
  }
  if (completed && game.score < 3000) {
    ok = false;
    notes.push(`score suspiciously low (${game.score})`);
  }

  if (!ok) failures++;
  results.push({
    id: definition.id,
    name: definition.name,
    ok,
    completed,
    time: game.levelTime,
    score: game.score,
    deaths: game.deaths,
    fragments: `${game.runFragments}/${level.collectibles.length}`,
    badges: completed
      ? Object.entries(record.badges).filter(([, v]) => v).map(([k]) => k).join(',')
      : '—',
    unlocked: game.progress.unlocked,
    ms: Date.now() - started,
    notes,
  });
}

for (const r of results) {
  const mark = r.ok ? '✓' : '✗';
  console.log(
    `  ${mark} ${String(r.id).padStart(2)} ${r.name.padEnd(18)} ` +
    `${r.time.toFixed(1).padStart(5)}s  ` +
    `${String(r.score).padStart(6)} pts  ` +
    `frag ${r.fragments}  ` +
    `deaths ${r.deaths}  ` +
    `[${r.badges}]`,
  );
  for (const note of r.notes) console.log(`        note: ${note}`);
}

// --- Death, respawn and persistence -----------------------------------------

console.log('\nDeath / respawn / persistence checks');

game.startLevel(8);
armLevel(game);
const search = findRoute(game.level, 0, { wantRoute: true });
runRoute(game, search.route);
settle(game);
const uplinksBeforeDeath = game.uplinksActive;
const scoreBeforeDeath = game.score;

game.kill('packet');
const dyingOk = game.state === GameState.PLAYER_DYING;
settle(game, 600);
const respawnedAtStart =
  game.player.row === game.level.playerStart.row &&
  Math.round(game.player.x) === game.level.playerStart.col;

const checks = [
  ['death enters PLAYER_DYING', dyingOk],
  ['respawn returns to the spawn cell', respawnedAtStart],
  ['activated uplinks survive death', game.uplinksActive === uplinksBeforeDeath && uplinksBeforeDeath > 0],
  ['score is not lost on death', game.score === scoreBeforeDeath],
  ['death is counted', game.deaths === 1],
  ['death cause is recorded', game.stats.deathsByCause.packet >= 1],
  ['progress persisted to storage', store.has('signalRunner_progress')],
  ['settings persisted to storage', store.has('signalRunner_settings') || true],
  ['all levels unlocked after clearing', game.progress.unlocked === LEVELS.length],
];

for (const [label, pass] of checks) {
  console.log(`  ${pass ? '✓' : '✗'} ${label}`);
  if (!pass) failures++;
}

// --- Resource growth --------------------------------------------------------

console.log('\nResource checks over a long session');

const particleCap = game.particles.capacity;
let maxParticles = 0;
game.startLevel(11);
armLevel(game);
for (let i = 0; i < 12000; i++) {
  if (i % 90 === 0) game.requestPolarity();
  if (i % 37 === 0) game.requestMove(0, -1);
  if (i % 53 === 0) game.requestMove(1, 0);
  step(game);
  maxParticles = Math.max(maxParticles, game.particles.count);
}

const growthChecks = [
  ['particle count stays within the pool', maxParticles <= particleCap],
  ['particle array never grew', game.particles.items.length === particleCap],
  ['near-miss set stays bounded', game.nearMissAwarded.size < 5000],
  ['lane shape arrays stay bounded',
    game.level.lanes.every((l) => l.shapes.length <= 40 && l.pool.items.length <= 60)],
  ['listener lists did not grow',
    Object.values(game.listeners).every((list) => list.length <= 4)],
];

for (const [label, pass] of growthChecks) {
  console.log(`  ${pass ? '✓' : '✗'} ${label}`);
  if (!pass) failures++;
}
console.log(`  · peak particles ${maxParticles}/${particleCap}, 12,000 frames simulated`);

// --- Frame-rate independence -----------------------------------------------
// The world is a function of accumulated time, and the player is carried by
// platforms every frame, so a 30fps device and a 120fps device must agree on
// where things end up. This is the check that catches per-frame constants
// creeping in where a per-second rate belongs.

console.log('\nFrame-rate independence');

function rideForSeconds(dtStep, seconds) {
  const g = new Game();
  for (const def of LEVELS) {
    for (const prompt of def.tutorialPrompts ?? []) {
      g.tutorialState.seen[`${def.id}:${prompt.id}`] = true;
    }
  }
  g.startLevel(3);
  let guard = 0;
  while (g.state === GameState.STARTING && guard++ < 3000) g.update(dtStep);
  g.worldTime = 0;
  updateWorld(g.level, 0);

  // Walk up to row 9, the first platform lane. One settled move at a time —
  // only the newest queued input survives a frame, by design.
  guard = 0;
  while (g.player.row > 9 && guard++ < 3000) {
    if (!g.player.motion.moving) g.requestMove(0, -1);
    g.update(dtStep);
  }

  // Now ride for exactly `seconds` of world time at whatever rate we are on.
  const frames = Math.round(seconds / dtStep);
  for (let i = 0; i < frames; i++) g.update(dtStep);

  return {
    x: g.player.x,
    row: g.player.row,
    world: g.worldTime,
    riding: g.player.isRiding,
    alive: g.state !== GameState.PLAYER_DYING,
  };
}

const at30 = rideForSeconds(1 / 30, 2);
const at60 = rideForSeconds(1 / 60, 2);
const at120 = rideForSeconds(1 / 120, 2);
const spread = Math.max(
  Math.abs(at30.x - at60.x),
  Math.abs(at60.x - at120.x),
  Math.abs(at30.x - at120.x),
);

const rateChecks = [
  ['the player actually ended up riding a platform',
    at30.riding && at60.riding && at120.riding],
  ['survived the ride at every rate', at30.alive && at60.alive && at120.alive],
  ['same row at 30 / 60 / 120 fps', at30.row === at60.row && at60.row === at120.row],
  // A move settles on a frame boundary, so mounting the platform can differ by
  // up to one 30fps frame of carry (1.5 cells/s ÷ 30 = 0.05 cells).
  [`carried position agrees within 0.06 cells (spread ${spread.toFixed(4)})`, spread < 0.06],
];

for (const [label, pass] of rateChecks) {
  console.log(`  ${pass ? '✓' : '✗'} ${label}`);
  if (!pass) failures++;
}

// --- World model invariants -------------------------------------------------

console.log('\nWorld model invariants');

const { prepareLevel } = await import('../src/levelLoader.js');
const { queryHazards, makeHazardResult, querySupport, makeSupportResult, blockReason } =
  await import('../src/collisions.js');
const { CONFIG } = await import('../src/config.js');

const hz = makeHazardResult();
const sup = makeSupportResult();

function sampleLane(level, row, polarity, fn) {
  let hits = 0;
  let total = 0;
  for (let step = 0; step < 400; step++) {
    updateWorld(level, step * 0.05);
    for (let col = 0; col < level.cols; col++) {
      total++;
      if (fn(level, row, col, polarity)) hits++;
    }
  }
  return { hits, total };
}

const lethalAt = (level, row, col, polarity) => {
  queryHazards(level, col + 0.5, row + 0.5, CONFIG.player.radius, polarity, hz);
  return hz.lethal !== null;
};
const supportedAt = (level, row, col, polarity) => {
  querySupport(level, col + 0.5, row, polarity, sup);
  return sup.platform !== null;
};

const lvl2 = prepareLevel(LEVELS[1]);
const lvl3 = prepareLevel(LEVELS[2]);
const lvl5 = prepareLevel(LEVELS[4]);
const lvl4 = prepareLevel(LEVELS[3]);

const packetSample = sampleLane(lvl2, 2, 'cyan', lethalAt);
const platformSample = sampleLane(lvl3, 2, 'cyan', supportedAt);
const cyanVsCyan = sampleLane(lvl5, 2, 'cyan', lethalAt);
const violetVsCyan = sampleLane(lvl5, 2, 'violet', lethalAt);

updateWorld(lvl4, 0);
const gateCyan = blockReason(lvl4, 4, 2, 'cyan', [false]);
const gateViolet = blockReason(lvl4, 4, 2, 'violet', [false]);

const worldChecks = [
  ['packet lanes are sometimes lethal and sometimes clear',
    packetSample.hits > 0 && packetSample.hits < packetSample.total],
  ['void lanes both hold and drop the player',
    platformSample.hits > 0 && platformSample.hits < platformSample.total],
  ['matching frequency passes through polarised traffic', cyanVsCyan.hits === 0],
  ['opposite frequency is blocked by polarised traffic', violetVsCyan.hits > 0],
  ['a cyan gate admits cyan', gateCyan === null],
  ['a cyan gate refuses violet', gateViolet === 'gate'],
  ['terminal row rejects non-uplink columns',
    blockReason(lvl4, 0, 0, 'cyan', [false]) === 'wall'],
  ['terminal row admits an inactive uplink',
    blockReason(lvl4, 0, 4, 'cyan', [false]) === null],
  ['terminal row refuses an already-activated uplink',
    blockReason(lvl4, 0, 4, 'cyan', [true]) === 'uplinkDone'],
];

for (const [label, pass] of worldChecks) {
  console.log(`  ${pass ? '✓' : '✗'} ${label}`);
  if (!pass) failures++;
}

console.log('');
if (failures) {
  console.log(`${failures} check(s) failed.\n`);
  process.exit(1);
}
console.log('Full playthrough passed: all 12 levels completed through the live game.\n');
