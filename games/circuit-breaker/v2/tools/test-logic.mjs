/**
 * Headless checks for the game model.
 *
 * These run the real board / matching / scoring modules — no DOM involved — and
 * simulate full games so the board invariants are proven independently of the
 * renderer. Run with: npm test
 */

import assert from 'node:assert/strict';

import { CONFIG, SPECIAL } from '../js/config.js';
import { Board } from '../js/board.js';
import {
  findMatchGroups,
  groupCells,
  planSpecials,
  expandActivations,
  hasAnyMatch,
} from '../js/matches.js';
import { evaluateStep, cascadeLabel } from '../js/scoring.js';
import { Heat } from '../js/heat.js';

let passed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    process.stdout.write(`  ok  ${name}\n`);
  } catch (err) {
    failures.push({ name, err });
    process.stdout.write(`  FAIL  ${name}\n        ${err.message}\n`);
  }
}

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

/** Builds a board from a compact letter grid; '.' means empty. */
function fromRows(rows) {
  const board = new Board(rows.length, rows[0].replace(/\s/g, '').length);
  rows.forEach((line, r) => {
    line.replace(/\s/g, '').split('').forEach((ch, c) => {
      board.set(r, c, ch === '.' ? null : board.createNode(ch));
    });
  });
  return board;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/**
 * A diagonal five-period grid: type = L[(row + col) % 5]. Any three cells in a
 * line are three different types, so the base pattern is guaranteed match-free
 * and fixtures can plant a shape without accidentally creating a second one.
 */
function basePattern(rows = 7, cols = 7) {
  const board = new Board(rows, cols);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      board.set(r, c, board.createNode(LETTERS[(r + c) % LETTERS.length]));
    }
  }
  return board;
}

/** Overwrites the type of the given [row, col] cells. */
function plant(board, cells, type) {
  cells.forEach(([r, c]) => { board.grid[r][c].type = type; });
  return board;
}

const hRun = (row, from, to) => Array.from({ length: to - from + 1 }, (_, i) => [row, from + i]);
const vRun = (col, from, to) => Array.from({ length: to - from + 1 }, (_, i) => [from + i, col]);

/** Sorted "row,col" list, for order-independent comparisons. */
const cellKeys = (cells) => cells.map((c) => `${c.row},${c.col}`).sort();

test('the fixture base pattern contains no matches', () => {
  assert.equal(hasAnyMatch(basePattern().grid), false);
});

function assertBoardFull(board, context) {
  const ids = new Set();
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const node = board.grid[r][c];
      assert.ok(node, `${context}: empty cell at ${r},${c}`);
      assert.equal(node.row, r, `${context}: stale row index at ${r},${c}`);
      assert.equal(node.col, c, `${context}: stale col index at ${r},${c}`);
      assert.ok(!ids.has(node.id), `${context}: duplicated node id ${node.id}`);
      ids.add(node.id);
    }
  }
  assert.equal(ids.size, board.rows * board.cols, `${context}: wrong node count`);
}

/* --------------------------------------------------------------------------
   Board generation
   -------------------------------------------------------------------------- */

test('generated boards never start with a match and always have a legal move', () => {
  for (let i = 0; i < 300; i++) {
    const board = new Board();
    board.generate();
    assertBoardFull(board, 'generate');
    assert.equal(hasAnyMatch(board.grid), false, 'fresh board contained a match');
    assert.ok(board.findPossibleMove(), 'fresh board had no legal move');
  }
});

/* --------------------------------------------------------------------------
   Match detection
   -------------------------------------------------------------------------- */

test('detects a horizontal run', () => {
  const board = plant(basePattern(), hRun(0, 0, 2), 'A');
  const groups = findMatchGroups(board.grid);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].orientation, 'h');
  assert.equal(groups[0].length, 3);
  assert.equal(groups[0].type, 'A');
  assert.deepEqual(cellKeys(groups[0].cells), ['0,0', '0,1', '0,2']);
});

test('detects a vertical run', () => {
  const board = plant(basePattern(), vRun(0, 0, 2), 'A');
  const groups = findMatchGroups(board.grid);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].orientation, 'v');
  assert.equal(groups[0].length, 3);
  assert.deepEqual(cellKeys(groups[0].cells), ['0,0', '1,0', '2,0']);
});

test('an intersecting T match scores both runs but clears each cell once', () => {
  const board = basePattern();
  plant(board, hRun(0, 1, 3), 'B');   // horizontal arm
  plant(board, vRun(2, 0, 2), 'B');   // vertical arm through (0,2)
  const groups = findMatchGroups(board.grid);
  assert.equal(groups.length, 2, 'expected one horizontal and one vertical run');
  assert.deepEqual(groups.map((g) => g.orientation).sort(), ['h', 'v']);
  assert.deepEqual(groups.map((g) => g.length), [3, 3]);
  const cells = groupCells(groups);
  assert.equal(cells.length, 5, 'T shape must dedupe to five cells');
  assert.deepEqual(cellKeys(cells), ['0,1', '0,2', '0,3', '1,2', '2,2']);
});

test('runs shorter than three, and runs broken by a gap, are ignored', () => {
  const board = basePattern();
  plant(board, [[0, 0], [0, 1], [0, 3], [0, 4]], 'B'); // B B _ B B
  assert.equal(findMatchGroups(board.grid).length, 0);
  assert.equal(hasAnyMatch(board.grid), false);

  const withHole = plant(basePattern(), hRun(0, 0, 2), 'B');
  withHole.grid[0][1] = null; // an empty cell must break the run
  assert.equal(findMatchGroups(withHole.grid).length, 0);
});

test('a run of five is reported as a single group of five', () => {
  const board = plant(basePattern(), hRun(0, 0, 4), 'B');
  const groups = findMatchGroups(board.grid);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].length, 5);
});

/* --------------------------------------------------------------------------
   Special nodes
   -------------------------------------------------------------------------- */

test('a four-run forges an orientation-matched Line Breaker on the moved cell', () => {
  const horizontal = plant(basePattern(), hRun(0, 0, 3), 'B');
  const hGroups = findMatchGroups(horizontal.grid);
  assert.equal(hGroups.length, 1);
  assert.equal(hGroups[0].length, 4);
  const hPlans = planSpecials(hGroups, [{ row: 0, col: 2 }]);
  assert.equal(hPlans.length, 1);
  assert.equal(hPlans[0].special, SPECIAL.LINE_H);
  assert.deepEqual({ row: hPlans[0].row, col: hPlans[0].col }, { row: 0, col: 2 });
  assert.equal(hPlans[0].type, 'B');

  const vertical = plant(basePattern(), vRun(0, 0, 3), 'B');
  const vGroups = findMatchGroups(vertical.grid);
  assert.equal(vGroups.length, 1);
  assert.equal(vGroups[0].orientation, 'v');
  assert.equal(vGroups[0].length, 4);
  const vPlans = planSpecials(vGroups, []);
  assert.equal(vPlans[0].special, SPECIAL.LINE_V);
  // No moved cell in the run → deterministic centre-most cell.
  assert.deepEqual({ row: vPlans[0].row, col: vPlans[0].col }, { row: 1, col: 0 });
});

test('a three-run and a five-run forge nothing', () => {
  const three = plant(basePattern(), hRun(0, 0, 2), 'B');
  assert.equal(planSpecials(findMatchGroups(three.grid), []).length, 0);
  const five = plant(basePattern(), hRun(0, 0, 4), 'B');
  assert.equal(planSpecials(findMatchGroups(five.grid), []).length, 0);
});

test('a Line Breaker inside a match discharges its whole line', () => {
  const board = plant(basePattern(), hRun(3, 0, 2), 'C');
  board.grid[3][1].special = SPECIAL.LINE_H;
  const groups = findMatchGroups(board.grid);
  assert.equal(groups.length, 1, 'fixture should contain exactly one match');
  const matched = groupCells(groups);
  const { cells, activations, keys } = expandActivations(board, matched);
  assert.equal(activations.length, 1);
  assert.equal(activations[0].special, SPECIAL.LINE_H);
  assert.equal(cells.length, board.cols, 'the whole row should be cleared');
  assert.equal(board.countFullLines(keys), 1);
});

test('a vertical Line Breaker discharges its column', () => {
  const board = plant(basePattern(), hRun(3, 0, 2), 'C');
  board.grid[3][1].special = SPECIAL.LINE_V;
  const { cells, activations, keys } = expandActivations(board, groupCells(findMatchGroups(board.grid)));
  assert.equal(activations.length, 1);
  // Three matched cells plus column 1, sharing (3,1) → 3 + 7 - 1 = 9.
  assert.equal(cells.length, 9);
  assert.equal(board.countFullLines(keys), 1, 'column 1 is fully cleared');
});

test('Line Breakers chain into one another without corrupting the board', () => {
  const board = plant(basePattern(), hRun(3, 0, 2), 'C');
  board.grid[3][1].special = SPECIAL.LINE_H;  // matched → clears row 3
  board.grid[3][5].special = SPECIAL.LINE_V;  // caught by row 3 → clears column 5
  const matched = groupCells(findMatchGroups(board.grid));
  const { cells, activations } = expandActivations(board, matched);
  assert.equal(activations.length, 2);
  assert.deepEqual(activations.map((a) => a.special), [SPECIAL.LINE_H, SPECIAL.LINE_V]);
  const unique = new Set(cells.map((c) => `${c.row},${c.col}`));
  assert.equal(unique.size, cells.length, 'cleared cells must be unique');
  // Row 3 (7 cells) plus column 5 (7 cells) sharing one cell → 13.
  assert.equal(cells.length, 13);
  board.clearCells(cells);
  board.collapse();
  assertBoardFull(board, 'chained breakers');
});

test('a breaker chain cannot loop forever', () => {
  // Every cell in row 3 is a breaker; the chain must still terminate.
  const board = plant(basePattern(), hRun(3, 0, 2), 'C');
  for (let c = 0; c < board.cols; c++) {
    board.grid[3][c].special = c % 2 === 0 ? SPECIAL.LINE_H : SPECIAL.LINE_V;
  }
  const { cells, activations } = expandActivations(board, groupCells(findMatchGroups(board.grid)));
  assert.equal(activations.length, board.cols, 'each breaker fires exactly once');
  const unique = new Set(cells.map((c) => `${c.row},${c.col}`));
  assert.equal(unique.size, cells.length);
});

/* --------------------------------------------------------------------------
   Gravity and refill
   -------------------------------------------------------------------------- */

test('gravity preserves column order and refills from above the board', () => {
  const board = fromRows([
    'ABC',
    'DEF',
    'GHI',
  ]);
  const keepG = board.grid[2][0];
  const keepD = board.grid[1][0];
  board.clearCells([{ row: 0, col: 0 }]);          // remove A
  board.clearCells([{ row: 1, col: 1 }]);          // remove E
  const { falls, spawns } = board.collapse();

  assertBoardFull(board, 'collapse');
  assert.equal(board.grid[2][0], keepG, 'bottom node should not move');
  assert.equal(board.grid[1][0], keepD, 'D should stay above G');
  assert.ok(falls.length > 0);
  assert.equal(spawns.length, 2, 'one new node per cleared cell');
  spawns.forEach((s) => assert.ok(s.spawnRow < 0, 'spawns must start above the board'));
});

test('clearing a full column refills it entirely', () => {
  const board = new Board();
  board.generate();
  const column = [];
  for (let r = 0; r < board.rows; r++) column.push({ row: r, col: 3 });
  board.clearCells(column);
  const { spawns } = board.collapse();
  assert.equal(spawns.length, board.rows);
  assertBoardFull(board, 'full column refill');
});

/* --------------------------------------------------------------------------
   Deadlock recovery
   -------------------------------------------------------------------------- */

test('reshuffle produces a playable board with no immediate matches', () => {
  for (let i = 0; i < 60; i++) {
    const board = new Board();
    board.generate();
    board.reshuffle();
    assertBoardFull(board, 'reshuffle');
    assert.equal(hasAnyMatch(board.grid), false);
    assert.ok(board.findPossibleMove());
  }
});

test('a deadlocked board is detected and recovered', () => {
  // A three-period diagonal grid: no match exists and no swap can create one,
  // because every swap only ever lines up two same-type nodes.
  const board = fromRows([
    'ABCABCA',
    'BCABCAB',
    'CABCABC',
    'ABCABCA',
    'BCABCAB',
    'CABCABC',
    'ABCABCA',
  ]);
  assert.equal(board.findPossibleMove(), null, 'diagonal grid must be a deadlock');
  assert.equal(hasAnyMatch(board.grid), false);
  board.reshuffle();
  assert.ok(board.findPossibleMove(), 'reshuffle must restore a legal move');
  assert.equal(hasAnyMatch(board.grid), false);
});

/* --------------------------------------------------------------------------
   Scoring and heat
   -------------------------------------------------------------------------- */

test('scoring matches the configured table', () => {
  const g = (length) => ({ length });
  assert.equal(evaluateStep({ groups: [g(3)], step: 1 }).points, 100);
  assert.equal(evaluateStep({ groups: [g(4)], step: 1 }).points, 200);
  assert.equal(evaluateStep({ groups: [g(5)], step: 1 }).points, 350);
  assert.equal(evaluateStep({ groups: [g(6)], step: 1 }).points, 500);
  assert.equal(evaluateStep({ groups: [g(3), g(3)], step: 1 }).points, 200);
  // Cascade 2 = 1.5x, and a special activation adds 100 before the multiplier.
  assert.equal(evaluateStep({ groups: [g(3)], activations: 1, step: 2 }).points, 300);
  assert.equal(evaluateStep({ groups: [g(3)], fullLines: 1, step: 1 }).points, 350);
  assert.equal(evaluateStep({ groups: [g(3)], step: 4 }).multiplier, 2.5);
});

test('cooling matches the configured table', () => {
  const g = (length) => ({ length });
  assert.equal(evaluateStep({ groups: [g(3)], step: 1 }).cooling, 0);
  assert.equal(evaluateStep({ groups: [g(4)], step: 1 }).cooling, 2);
  assert.equal(evaluateStep({ groups: [g(5)], step: 1 }).cooling, 5);
  assert.equal(evaluateStep({ groups: [g(3)], step: 2 }).cooling, 2);
  assert.equal(evaluateStep({ groups: [g(3)], step: 3 }).cooling, 3);
  assert.equal(evaluateStep({ groups: [g(3)], activations: 2, step: 1 }).cooling, 4);
  assert.equal(evaluateStep({ groups: [g(3)], clearedCount: 14, step: 1 }).cooling, 3);
});

test('cascade labels read correctly', () => {
  assert.equal(cascadeLabel(1), null);
  assert.equal(cascadeLabel(2), 'CHAIN x2');
  assert.equal(cascadeLabel(3), 'CHAIN x3');
  assert.equal(cascadeLabel(4), 'SYSTEM SURGE x4');
  assert.equal(cascadeLabel(7), 'SYSTEM SURGE x7');
});

test('heat clamps to 0..100 and tracks its peak', () => {
  const heat = new Heat();
  assert.equal(heat.value, CONFIG.STARTING_HEAT);
  heat.cool(999);
  assert.equal(heat.value, 0);
  assert.equal(heat.totalCooled, CONFIG.STARTING_HEAT);
  heat.add(999);
  assert.equal(heat.value, 100);
  assert.equal(heat.peak, 100);
  assert.equal(heat.overloaded, true);
  assert.equal(heat.stage.key, 'overload');
  heat.cool(60);
  assert.equal(heat.value, 40);
  assert.equal(heat.stage.key, 'stable');
  assert.equal(heat.overloaded, false);
});

test('heat stages cover every value from 0 to 100', () => {
  const heat = new Heat();
  for (let v = 0; v <= 100; v++) {
    heat.value = v;
    assert.ok(heat.stage, `no stage for heat ${v}`);
    assert.ok(heat.stage.status.length > 0);
  }
});

/* --------------------------------------------------------------------------
   Full-game simulation — the real turn pipeline, minus rendering
   -------------------------------------------------------------------------- */

/** Every legal swap on the board. */
function allMoves(board) {
  const moves = [];
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (c + 1 < board.cols) {
        const a = { row: r, col: c };
        const b = { row: r, col: c + 1 };
        if (board.swapCreatesMatch(a, b)) moves.push({ a, b });
      }
      if (r + 1 < board.rows) {
        const a = { row: r, col: c };
        const b = { row: r + 1, col: c };
        if (board.swapCreatesMatch(a, b)) moves.push({ a, b });
      }
    }
  }
  return moves;
}

/** Picks the move whose immediate resolution cools the most (then scores most). */
function greedyMove(board) {
  const moves = allMoves(board);
  if (!moves.length) return null;
  let best = null;
  for (const move of moves) {
    board.swap(move.a, move.b);
    const groups = findMatchGroups(board.grid);
    const matched = groupCells(groups);
    const { cells, activations, keys } = expandActivations(board, matched);
    const evaluation = evaluateStep({
      groups,
      activations: activations.length,
      fullLines: board.countFullLines(keys),
      clearedCount: cells.length,
      step: 1,
    });
    board.swap(move.a, move.b);
    const rank = evaluation.cooling * 1000 + evaluation.points;
    if (!best || rank > best.rank) best = { move, rank };
  }
  return best.move;
}

function simulateGame(maxTurns = 400, strategy = 'first') {
  const board = new Board();
  board.generate();
  const heat = new Heat();
  const stats = {
    turns: 0,
    reshuffles: 0,
    specialsCreated: 0,
    specialsActivated: 0,
    deepestCascade: 0,
    longestMatch: 0,
    score: 0,
    fullLines: 0,
  };

  const chooseMove = () => (strategy === 'greedy' ? greedyMove(board) : board.findPossibleMove());

  while (!heat.overloaded && stats.turns < maxTurns) {
    let move = chooseMove();
    let guard = 0;
    while (!move && guard++ < 10) {
      board.reshuffle();
      stats.reshuffles++;
      assert.equal(hasAnyMatch(board.grid), false, 'reshuffle left an immediate match');
      move = chooseMove();
    }
    assert.ok(move, 'board became unrecoverable');

    board.swap(move.a, move.b);
    heat.add(CONFIG.HEAT_PER_VALID_MOVE);
    stats.turns++;

    let step = 0;
    for (;;) {
      const groups = findMatchGroups(board.grid);
      if (!groups.length) break;
      step++;
      assert.ok(step < 60, 'resolution failed to terminate');

      const matched = groupCells(groups);
      const plans = planSpecials(groups, step === 1 ? [move.a, move.b] : []);
      const { cells, activations, keys } = expandActivations(board, matched);

      const uniqueCells = new Set(cells.map((c) => `${c.row},${c.col}`));
      assert.equal(uniqueCells.size, cells.length, 'duplicate cell in the clear set');

      const fullLines = board.countFullLines(keys);
      const evaluation = evaluateStep({
        groups,
        activations: activations.length,
        fullLines,
        clearedCount: cells.length,
        step,
      });
      assert.ok(Number.isInteger(evaluation.points) && evaluation.points > 0, 'bad score');

      stats.score += evaluation.points;
      stats.fullLines += fullLines;
      stats.specialsActivated += activations.length;
      stats.deepestCascade = Math.max(stats.deepestCascade, step);
      stats.longestMatch = Math.max(stats.longestMatch, ...groups.map((g) => g.length));

      const removed = board.clearCells(cells);
      assert.equal(removed.length, cells.length, 'clear set contained an empty cell');

      plans.forEach((plan) => {
        if (board.at(plan.row, plan.col)) return;
        board.placeNode(plan.row, plan.col, plan.type, plan.special);
        stats.specialsCreated++;
      });

      board.collapse();
      assertBoardFull(board, `turn ${stats.turns} step ${step}`);
      heat.cool(evaluation.cooling);
      assert.ok(heat.value >= 0 && heat.value <= 100, 'heat left its bounds');
    }
  }

  return { stats, heat, board };
}

test('200 simulated games keep the board consistent and always reach overload', () => {
  const totals = {
    specialsCreated: 0,
    specialsActivated: 0,
    reshuffles: 0,
    deepestCascade: 0,
    fullLines: 0,
    turns: 0,
    score: 0,
    games: 0,
    overloaded: 0,
  };

  for (let i = 0; i < 200; i++) {
    const { stats, heat } = simulateGame();
    totals.games++;
    if (heat.overloaded) totals.overloaded++;
    totals.specialsCreated += stats.specialsCreated;
    totals.specialsActivated += stats.specialsActivated;
    totals.reshuffles += stats.reshuffles;
    totals.fullLines += stats.fullLines;
    totals.turns += stats.turns;
    totals.score += stats.score;
    totals.deepestCascade = Math.max(totals.deepestCascade, stats.deepestCascade);
  }

  assert.equal(totals.overloaded, totals.games, 'every run should end in overload');
  assert.ok(totals.specialsCreated > 0, 'no Line Breakers were ever created');
  assert.ok(totals.specialsActivated > 0, 'no Line Breakers were ever activated');
  assert.ok(totals.deepestCascade >= 2, 'cascades never happened');

  process.stdout.write(
    `        ${totals.games} games · avg ${(totals.turns / totals.games).toFixed(1)} moves`
    + ` · avg score ${Math.round(totals.score / totals.games)}`
    + ` · deepest chain x${totals.deepestCascade}`
    + ` · breakers ${totals.specialsCreated} made / ${totals.specialsActivated} fired`
    + ` · full lines ${totals.fullLines} · reshuffles ${totals.reshuffles}\n`,
  );
});

test('skilled play is rewarded: chasing cooling beats taking the first move', () => {
  const runs = (strategy, count) => {
    const out = { moves: 0, score: 0, chain: 0 };
    for (let i = 0; i < count; i++) {
      const { stats } = simulateGame(400, strategy);
      out.moves += stats.turns;
      out.score += stats.score;
      out.chain = Math.max(out.chain, stats.deepestCascade);
    }
    out.moves /= count;
    out.score /= count;
    return out;
  };

  const naive = runs('first', 60);
  const skilled = runs('greedy', 60);

  process.stdout.write(
    `        naive:   ${naive.moves.toFixed(1)} moves · ${Math.round(naive.score)} score\n`
    + `        skilled: ${skilled.moves.toFixed(1)} moves · ${Math.round(skilled.score)} score\n`,
  );

  assert.ok(skilled.moves > naive.moves * 1.4,
    `skilled play should last meaningfully longer (${skilled.moves.toFixed(1)} vs ${naive.moves.toFixed(1)})`);
  assert.ok(skilled.score > naive.score * 1.5,
    `skilled play should score meaningfully higher (${Math.round(skilled.score)} vs ${Math.round(naive.score)})`);
  assert.ok(naive.moves >= 10, 'even careless play should get a real run, not a couple of moves');
});

/* -------------------------------------------------------------------------- */

process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) {
  failures.forEach(({ name, err }) => {
    process.stdout.write(`\n${name}\n${err.stack}\n`);
  });
  process.exit(1);
}
