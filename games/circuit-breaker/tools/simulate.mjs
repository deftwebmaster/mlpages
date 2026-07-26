/**
 * Headless game simulation, shared by the tests and the pacing tuner.
 *
 * It drives the real board, matching, scoring and heat modules through the same
 * turn pipeline the game uses, so anything measured here reflects actual play.
 */

import { CONFIG, heatForMove } from '../js/config.js';
import { Board } from '../js/board.js';
import {
  findMatchGroups, groupCells, planSpecials, expandActivations, hasAnyMatch, planWildcardSwap,
} from '../js/matches.js';
import { key } from '../js/utils.js';
import { evaluateStep } from '../js/scoring.js';
import { Heat } from '../js/heat.js';

/**
 * Every legal swap currently on the board, including Wildcard Core swaps, which
 * are legal even when they line nothing up.
 */
export function allMoves(board) {
  const moves = [];
  const consider = (a, b) => {
    const wildcard = planWildcardSwap(board, a, b);
    if (wildcard || board.swapCreatesMatch(a, b)) moves.push({ a, b, wildcard });
  };
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (c + 1 < board.cols) consider({ row: r, col: c }, { row: r, col: c + 1 });
      if (r + 1 < board.rows) consider({ row: r, col: c }, { row: r + 1, col: c });
    }
  }
  return moves;
}

/** Picks the move whose immediate resolution cools most, then scores most. */
export function greedyMove(board) {
  const moves = allMoves(board);
  if (!moves.length) return null;
  let best = null;
  for (const move of moves) {
    board.swap(move.a, move.b);
    const groups = findMatchGroups(board.grid);
    const { matched, overrides } = seedMatched(board, groups, move.wildcard);
    const { cells, activations, keys } = expandActivations(board, matched, overrides);
    const evaluation = evaluateStep({
      groups,
      activations: activations.length,
      fullLines: board.countFullLines(keys),
      clearedCount: cells.length,
      specialCleared: Math.max(0, cells.length - matched.length),
      step: 1,
    });
    board.swap(move.a, move.b);
    const rank = evaluation.cooling * 1000 + evaluation.points;
    if (!best || rank > best.rank) best = { move, rank };
  }
  return best.move;
}

/**
 * Folds a Wildcard swap seed into the matched cells for a resolution step,
 * mirroring what Game.resolve() does.
 */
function seedMatched(board, groups, seed) {
  const matched = groupCells(groups);
  if (!seed) return { matched, overrides: null };
  const seedKey = key(seed.row, seed.col);
  const withSeed = matched.some((c) => key(c.row, c.col) === seedKey)
    ? matched
    : [...matched, { row: seed.row, col: seed.col }];
  return { matched: withSeed, overrides: new Map([[seedKey, seed.targetType]]) };
}

/**
 * Plays one complete game.
 *
 * @param {object}   options
 * @param {string}   options.strategy  'first' (careless) or 'greedy' (skilled)
 * @param {number}   options.maxTurns  safety cap
 * @param {function} options.validate  optional per-step invariant checker
 */
export function simulateGame({ strategy = 'first', maxTurns = 600, validate = null } = {}) {
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
    nodesCleared: 0,
    score: 0,
    fullLines: 0,
    cascadeTurns: 0,
    movesBeforeCritical: null,
    peakHeat: heat.value,
    byType: {},        // activations per special type
    createdByType: {}, // forged per special type
  };

  const chooseMove = () => (strategy === 'greedy' ? greedyMove(board) : allMoves(board)[0] || null);

  while (!heat.overloaded && stats.turns < maxTurns) {
    let move = chooseMove();
    let guard = 0;
    while (!move && guard++ < 10) {
      board.reshuffle();
      stats.reshuffles++;
      if (validate && hasAnyMatch(board.grid)) throw new Error('reshuffle left an immediate match');
      move = chooseMove();
    }
    if (!move) throw new Error('board became unrecoverable');

    board.swap(move.a, move.b);
    stats.turns++;
    heat.add(heatForMove(stats.turns));
    if (stats.movesBeforeCritical === null && heat.value >= 75) {
      stats.movesBeforeCritical = stats.turns;
    }

    let step = 0;
    let pendingSeed = move.wildcard || null;
    for (;;) {
      const groups = findMatchGroups(board.grid);
      const seedNow = pendingSeed;
      pendingSeed = null;
      if (!groups.length && !seedNow) break;
      step++;
      if (step > 60) throw new Error('resolution failed to terminate');

      const plans = planSpecials(groups, step === 1 ? [move.a, move.b] : []);
      const { matched, overrides } = seedMatched(board, groups, seedNow);
      const { cells, activations, keys } = expandActivations(board, matched, overrides);
      const fullLines = board.countFullLines(keys);
      const evaluation = evaluateStep({
        groups,
        activations: activations.length,
        fullLines,
        clearedCount: cells.length,
        specialCleared: Math.max(0, cells.length - matched.length),
        step,
      });

      stats.score += evaluation.points;
      stats.fullLines += fullLines;
      stats.specialsActivated += activations.length;
      activations.forEach((a) => {
        stats.byType[a.special] = (stats.byType[a.special] || 0) + 1;
      });
      stats.nodesCleared += cells.length;
      stats.deepestCascade = Math.max(stats.deepestCascade, step);
      stats.longestMatch = Math.max(stats.longestMatch, 0, ...groups.map((g) => g.length));

      if (validate) validate({ board, cells, step, turn: stats.turns, phase: 'before-clear' });

      board.clearCells(cells);
      plans.forEach((plan) => {
        if (board.at(plan.row, plan.col)) return;
        board.placeNode(plan.row, plan.col, plan.type, plan.special);
        stats.specialsCreated++;
        stats.createdByType[plan.special] = (stats.createdByType[plan.special] || 0) + 1;
      });
      board.collapse();

      if (validate) validate({ board, cells, step, turn: stats.turns, phase: 'after-collapse' });

      heat.cool(evaluation.cooling);
      stats.peakHeat = Math.max(stats.peakHeat, heat.peak);
    }
    if (step >= 2) stats.cascadeTurns++;
  }

  return { stats, heat, board };
}

/** Runs `count` games and reduces them to comparable aggregates. */
export function runBatch({ strategy, count, maxTurns = 600 }) {
  const moves = [];
  const scores = [];
  const totals = {
    specialsCreated: 0,
    specialsActivated: 0,
    reshuffles: 0,
    fullLines: 0,
    cascadeTurns: 0,
    deepestCascade: 0,
    criticalAt: 0,
    criticalRuns: 0,
  };

  for (let i = 0; i < count; i++) {
    const { stats } = simulateGame({ strategy, maxTurns });
    moves.push(stats.turns);
    scores.push(stats.score);
    totals.specialsCreated += stats.specialsCreated;
    totals.specialsActivated += stats.specialsActivated;
    totals.reshuffles += stats.reshuffles;
    totals.fullLines += stats.fullLines;
    totals.cascadeTurns += stats.cascadeTurns;
    totals.deepestCascade = Math.max(totals.deepestCascade, stats.deepestCascade);
    if (stats.movesBeforeCritical !== null) {
      totals.criticalAt += stats.movesBeforeCritical;
      totals.criticalRuns++;
    }
  }

  moves.sort((a, b) => a - b);
  scores.sort((a, b) => a - b);
  const pct = (list, p) => list[Math.min(list.length - 1, Math.floor(list.length * p))];
  const mean = (list) => list.reduce((s, n) => s + n, 0) / list.length;

  return {
    count,
    movesMean: mean(moves),
    movesMedian: pct(moves, 0.5),
    movesP10: pct(moves, 0.1),
    movesP90: pct(moves, 0.9),
    scoreMean: mean(scores),
    scoreMedian: pct(scores, 0.5),
    breakersMade: totals.specialsCreated / count,
    breakersFired: totals.specialsActivated / count,
    cascadeTurnShare: totals.cascadeTurns / moves.reduce((s, n) => s + n, 0),
    deepestCascade: totals.deepestCascade,
    reshuffles: totals.reshuffles / count,
    criticalAt: totals.criticalRuns ? totals.criticalAt / totals.criticalRuns : null,
  };
}

export { CONFIG };
