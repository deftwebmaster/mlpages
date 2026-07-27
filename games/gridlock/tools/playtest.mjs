/**
 * tools/playtest.mjs — headless soak test.
 *
 * Runs the real `Game` (real maze, real drones, real Grid Shift executor) with
 * a scripted bot at the controls, for every level. It answers the questions a
 * screenshot cannot:
 *
 *   • can each sector actually be cleared?
 *   • does any drone stall permanently after a maze change?
 *   • does any Grid Shift get rejected in a way that soft-locks the run?
 *   • does anything throw over tens of thousands of simulated frames?
 *
 * Rendering and audio are stubbed; everything else is the shipping code.
 *
 * Run: node tools/playtest.mjs [levelNumber]
 */

import { DIR_VEC } from '../js/config.js';

// ── Minimal browser stubs, installed before the game modules load ───────────
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};
globalThis.window = globalThis.window || {};

const { Game, RUN } = await import('../js/game.js');
const { LEVELS } = await import('../js/levels.js');
const { DRONE_STATE } = await import('../js/config.js');

/** A renderer that records nothing and draws nothing. */
const stubRenderer = {
  setMaze() {},
  showToast() {},
  addShake() {},
  addFlash() {},
  shakeEnabled: false,
};

const STEP = 1 / 120;
const MAX_SECONDS = 600;

/**
 * Breadth-first search from the player to the nearest interesting tile,
 * optionally treating the area around hostile drones as impassable.
 * @returns {number} first direction to take, or -1
 */
function planStep(maze, from, wants, danger) {
  const W = maze.width;
  const H = maze.height;
  const size = W * H;
  const prev = new Int32Array(size).fill(-1);
  const seen = new Uint8Array(size);
  const queue = new Int32Array(size);
  let head = 0;
  let tail = 0;

  const start = from.y * W + from.x;
  queue[tail++] = start;
  seen[start] = 1;

  let goal = -1;
  while (head < tail) {
    const cur = queue[head++];
    if (cur !== start && wants[cur]) {
      goal = cur;
      break;
    }
    const cx = cur % W;
    const cy = (cur / W) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = cx + DIR_VEC[d].x;
      const ny = cy + DIR_VEC[d].y;
      if (!maze.walkable(nx, ny)) continue;
      const ni = ny * W + nx;
      if (seen[ni] || (danger && danger[ni])) continue;
      seen[ni] = 1;
      prev[ni] = cur;
      queue[tail++] = ni;
    }
  }
  if (goal < 0) return -1;

  let node = goal;
  while (prev[node] !== start && prev[node] !== -1) node = prev[node];
  const nx = node % W;
  const ny = (node / W) | 0;
  for (let d = 0; d < 4; d++) {
    if (from.x + DIR_VEC[d].x === nx && from.y + DIR_VEC[d].y === ny) return d;
  }
  return -1;
}

/**
 * Nearest tile flagged in `wants`, by corridor distance.
 * @returns {number} tile index, or -1 when nothing is reachable
 */
function pickGoal(maze, from, wants, danger) {
  const W = maze.width;
  const seen = new Uint8Array(W * maze.height);
  const queue = [[from.x, from.y]];
  seen[from.y * W + from.x] = 1;

  for (let head = 0; head < queue.length; head++) {
    const [x, y] = queue[head];
    const i = y * W + x;
    if (i !== from.y * W + from.x && wants[i]) return i;
    for (let d = 0; d < 4; d++) {
      const nx = x + DIR_VEC[d].x;
      const ny = y + DIR_VEC[d].y;
      if (!maze.walkable(nx, ny)) continue;
      const ni = ny * W + nx;
      if (seen[ni] || (danger && danger[ni])) continue;
      seen[ni] = 1;
      queue.push([nx, ny]);
    }
  }
  return -1;
}

/**
 * Tiles within `radius` corridor-steps of a hostile drone.
 *
 * Measured by flood fill rather than straight-line distance: a drone one tile
 * away through a wall is not a threat, and treating it as one makes the bot
 * refuse perfectly safe routes.
 */
function buildDangerMap(game, radius) {
  const maze = game.maze;
  const W = maze.width;
  const map = new Uint8Array(W * maze.height);
  const queue = [];

  for (const drone of game.drones) {
    if (!drone.dangerous) continue;
    const i = maze.idx(drone.tx, drone.ty);
    if (!map[i]) {
      map[i] = 1;
      queue.push([drone.tx, drone.ty, 0]);
    }
  }

  for (let head = 0; head < queue.length; head++) {
    const [x, y, d] = queue[head];
    if (d >= radius) continue;
    for (let k = 0; k < 4; k++) {
      const nx = x + DIR_VEC[k].x;
      const ny = y + DIR_VEC[k].y;
      if (!maze.walkable(nx, ny)) continue;
      const ni = ny * W + nx;
      if (map[ni]) continue;
      map[ni] = 1;
      queue.push([nx, ny, d + 1]);
    }
  }
  return map;
}

/**
 * The reachable tile furthest from every hostile drone.
 *
 * Real players do not walk into a guarded corridor the moment the last node is
 * in it — they circle, wait for the patrol phase, and take it when the lane
 * clears. Without somewhere to retreat to, a bot just feeds itself to the
 * drones forever and reports a level as unclearable when it is merely guarded.
 *
 * @returns {number} tile index, or -1
 */
function pickFleeGoal(game) {
  const maze = game.maze;
  const W = maze.width;
  const size = W * maze.height;

  // Multi-source flood from the hostile drones: distance to the nearest threat.
  const threatDist = new Int16Array(size).fill(-1);
  const queue = [];
  for (const drone of game.drones) {
    if (!drone.dangerous) continue;
    const i = maze.idx(drone.tx, drone.ty);
    if (threatDist[i] === -1) {
      threatDist[i] = 0;
      queue.push([drone.tx, drone.ty]);
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const [x, y] = queue[head];
    const d = threatDist[y * W + x];
    for (let k = 0; k < 4; k++) {
      const nx = x + DIR_VEC[k].x;
      const ny = y + DIR_VEC[k].y;
      if (!maze.walkable(nx, ny)) continue;
      const ni = ny * W + nx;
      if (threatDist[ni] !== -1) continue;
      threatDist[ni] = d + 1;
      queue.push([nx, ny]);
    }
  }

  // Of everything we can actually get to, take the safest.
  const p = game.player;
  const seen = new Uint8Array(size);
  const reach = [[p.tx, p.ty]];
  seen[maze.idx(p.tx, p.ty)] = 1;
  let best = -1;
  let bestScore = -1;
  for (let head = 0; head < reach.length; head++) {
    const [x, y] = reach[head];
    const i = y * W + x;
    const score = threatDist[i] === -1 ? 999 : threatDist[i];
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
    for (let k = 0; k < 4; k++) {
      const nx = x + DIR_VEC[k].x;
      const ny = y + DIR_VEC[k].y;
      if (!maze.walkable(nx, ny)) continue;
      const ni = ny * W + nx;
      if (seen[ni]) continue;
      seen[ni] = 1;
      reach.push([nx, ny]);
    }
  }
  return best;
}

/** Corridor distance from the player to the nearest hostile drone. */
function nearestThreat(game) {
  const maze = game.maze;
  let best = Infinity;
  for (const drone of game.drones) {
    if (!drone.dangerous) continue;
    best = Math.min(best, Math.abs(drone.tx - game.player.tx) + Math.abs(drone.ty - game.player.ty));
  }
  return best;
}

function runLevel(number) {
  const events = [];
  const game = new Game(stubRenderer, (name, payload) => events.push({ name, payload }));
  game.loadLevel(number);

  const maze = game.maze;
  const size = maze.width * maze.height;

  const report = {
    level: LEVELS[number - 1],
    cleared: false,
    time: 0,
    simSeconds: 0,
    deaths: 0,
    score: 0,
    shiftsUsed: 0,
    shiftsRefused: 0,
    dronesEaten: 0,
    secrets: 0,
    longestDroneStall: 0,
    error: null,
  };

  const stallSince = new Map();
  const single = new Uint8Array(size);
  let elapsed = 0;
  let lastDecision = -1;
  let goal = -1;
  let goalAge = 0;
  let waiting = 0;

  // `GRIDLOCK_DEBUG=1 node tools/playtest.mjs 14` explains *why* a level fails.
  if (process.env.GRIDLOCK_DEBUG) {
    report.deathLog = [];
    const original = game._killPlayer.bind(game);
    game._killPlayer = () => {
      const killer = game.drones
        .filter((d) => d.dangerous)
        .map((d) => ({
          who: d.personality,
          at: [d.tx, d.ty],
          dist: +Math.hypot(d.px - game.player.px, d.py - game.player.py).toFixed(2),
        }))
        .sort((a, b) => a.dist - b.dist)[0];
      if (report.deathLog.length < 8) {
        report.deathLog.push({ t: +elapsed.toFixed(2), player: [game.player.tx, game.player.ty], killer });
      }
      original();
    };
  }

  try {
    while (elapsed < MAX_SECONDS && game.run !== RUN.COMPLETE) {
      // ── Bot decision, once per simulated tick ────────────────────────────
      if (game.run === RUN.PLAYING && elapsed - lastDecision > 0.02) {
        lastDecision = elapsed;
        const p = game.player;

        // What do we want? Nodes, plus a terminal when the shift is charged
        // (that is what exercises the maze mutation). Under pressure, a power
        // module beats everything — the same call a human makes.
        const threat = nearestThreat(game);
        const wants = new Uint8Array(size);
        let any = false;

        if (threat <= 7 && maze.powersRemaining > 0) {
          for (let i = 0; i < size; i++) {
            if (maze.powers[i]) {
              wants[i] = 1;
              any = true;
            }
          }
        }
        if (!any) {
          for (let i = 0; i < size; i++) {
            if (maze.nodes[i] || maze.secretNodes[i] || maze.powers[i]) {
              wants[i] = 1;
              any = true;
            }
          }
          if (game.shift.ready) {
            for (const t of maze.terminals) {
              if (!t.exhausted) {
                wants[maze.idx(t.x, t.y)] = 1;
                any = true;
              }
            }
          }
        }

        // Frightened drones are points on legs; chase them while the window is
        // open rather than politely avoiding them.
        if (game.player.powered) {
          for (const drone of game.drones) {
            if (drone.edible) {
              wants[maze.idx(drone.tx, drone.ty)] = 1;
              any = true;
            }
          }
        }
        if (any) {
          // Plan from the tile the siphon is *heading into*, not the one it is
          // leaving. Planning from the current tile mid-step makes the bot ask
          // for a U-turn, which the buffered-input rules honour instantly.
          const origin = p.moving ? { x: p.nx, y: p.ny } : { x: p.tx, y: p.ty };

          // Play cautiously while there is plenty left to collect, then commit:
          // at the tail of a level the only nodes remaining are the awkward
          // ones, and refusing every risk means never finishing.
          const caution = maze.nodesRemaining > 12 ? 3 : 1;
          const danger = buildDangerMap(game, caution);

          // Commit to one target until it is taken or becomes unreachable.
          // Re-picking the *nearest* want every tick makes the bot oscillate
          // forever between two equidistant nodes on opposite sides of it —
          // it reverses, the nearest flips, and it reverses straight back.
          goalAge += 0.02;
          if (goal < 0 || !wants[goal] || goalAge > 1.5) {
            goal = pickGoal(maze, origin, wants, danger);
            goalAge = 0;

            if (goal < 0) {
              // Everything left is guarded. Retreat and wait for the lane to
              // clear; only force the issue if the standoff drags on.
              waiting += 1.5;
              goal = waiting > 9 ? pickGoal(maze, origin, wants, null) : pickFleeGoal(game);
              if (waiting > 9) waiting = 0;
            } else {
              waiting = 0;
            }
          }

          if (goal >= 0) {
            single.fill(0);
            single[goal] = 1;
            let dir = planStep(maze, origin, single, danger);
            if (dir < 0) dir = planStep(maze, origin, single, null);
            if (dir < 0) goal = -1; // unreachable even ignoring drones — re-pick
            else game.handleDirection(dir);
          }
        }
      }

      game.update(STEP);
      elapsed += STEP;

      // ── Watch for drones that never move again ───────────────────────────
      for (const drone of game.drones) {
        const idle =
          drone.mover.dir === -1 &&
          drone.state !== DRONE_STATE.RECOVERING &&
          drone.state !== DRONE_STATE.RETURNING;
        if (idle) {
          if (!stallSince.has(drone)) stallSince.set(drone, elapsed);
          report.longestDroneStall = Math.max(report.longestDroneStall, elapsed - stallSince.get(drone));
        } else {
          stallSince.delete(drone);
        }
      }
    }
  } catch (err) {
    report.error = `${err.message} @ ${(err.stack || '').split('\n')[1]?.trim()}`;
  }

  report.cleared = game.run === RUN.COMPLETE;
  report.simSeconds = elapsed;
  report.time = game.time;
  report.deaths = game.deaths;
  report.score = game.score;
  report.shiftsUsed = game.shiftsUsed;
  report.dronesEaten = game.dronesEaten;
  report.secrets = game.secretsFound;
  report.nodesLeft = game.maze.nodesRemaining;

  // When a level does not finish, say *where* the leftovers are and whether the
  // bot could even have got to them — the difference between "too hard" and
  // "impossible" is the whole point of this harness.
  if (!report.cleared) {
    const m = game.maze;
    const seen = m.reachableFrom(game.player.tx, game.player.ty);
    report.leftovers = [];
    for (let i = 0; i < m.grid.length; i++) {
      if (!m.nodes[i]) continue;
      report.leftovers.push({ at: [i % m.width, (i / m.width) | 0], reachable: !!seen[i] });
    }
  }
  return report;
}

// ── Drive ───────────────────────────────────────────────────────────────────
const only = process.argv[2] ? Number(process.argv[2]) : null;
const numbers = only ? [only] : LEVELS.map((l) => l.number);

console.log(`Playtesting ${numbers.length} level(s) with a scripted bot…\n`);

let failures = 0;
const t0 = Date.now();

for (const n of numbers) {
  const r = runLevel(n);
  const ok = r.cleared && !r.error && r.longestDroneStall < 12;
  if (!ok) failures++;

  const mark = ok ? '✓' : '✗';
  console.log(
    `  ${mark} ${r.level.id} ${r.level.name.padEnd(15)} ` +
      `${r.cleared ? `cleared in ${r.time.toFixed(1)}s` : `NOT CLEARED (${r.nodesLeft} nodes left)`} · ` +
      `${r.deaths} deaths · ${r.shiftsUsed} shifts · ${r.dronesEaten} drones · ` +
      `${r.secrets} secrets · stall ${r.longestDroneStall.toFixed(1)}s · ${r.score} pts`
  );
  if (r.error) console.error(`      error: ${r.error}`);
  if (r.leftovers) {
    const stranded = r.leftovers.filter((l) => !l.reachable);
    console.log(
      `      leftovers: ${r.leftovers.slice(0, 8).map((l) => l.at.join(',')).join(' ')}` +
        (stranded.length ? `  UNREACHABLE: ${stranded.map((l) => l.at.join(',')).join(' ')}` : '  (all reachable)')
    );
  }
  if (r.deathLog) for (const d of r.deathLog) console.log(`      death t=${d.t}s at ${d.player} by ${JSON.stringify(d.killer)}`);
}

console.log(`\nSimulated in ${((Date.now() - t0) / 1000).toFixed(1)}s of wall clock.`);
if (failures) {
  console.error(`FAILED — ${failures} level(s) did not survive the soak test.`);
  process.exit(1);
}
console.log('All levels cleared by the bot with no stalls or exceptions.');
