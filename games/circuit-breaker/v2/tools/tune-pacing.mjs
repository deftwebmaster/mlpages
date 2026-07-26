/**
 * Pacing experiment.
 *
 * Plays hundreds of full games under several heat curves and prints comparable
 * numbers, so balance decisions are made from data rather than feel.
 *
 *   node tools/tune-pacing.mjs [gamesPerCurve]
 *
 * "careless" takes the first legal move it finds; "skilled" picks the move that
 * cools most. The gap between them is how much the game rewards playing well.
 */

import { CONFIG } from '../js/config.js';
import { runBatch } from './simulate.mjs';

const GAMES = Number(process.argv[2] || 250);

/* Each curve is applied to CONFIG before its batch runs. */
const CURVES = [
  { name: 'A  old (flat +7)',          start: 15, base: 7, step: 0, every: 6, max: 7 },
  { name: 'G  ramp 4→8 / 10, start 10', start: 10, base: 4, step: 1, every: 10, max: 8 },
  { name: 'G* SHIPPED: same, start 15', start: 15, base: 4, step: 1, every: 10, max: 8 },
];

function applyCurve(curve) {
  CONFIG.STARTING_HEAT = curve.start;
  CONFIG.HEAT_PER_VALID_MOVE = curve.base;
  CONFIG.HEAT_RAMP_STEP = curve.step;
  CONFIG.HEAT_RAMP_EVERY = curve.every;
  CONFIG.HEAT_PER_MOVE_MAX = curve.max;
}

const pad = (s, n) => String(s).padEnd(n);
const num = (v, n, digits = 1) => String(v === null ? '—' : v.toFixed(digits)).padStart(n);

process.stdout.write(`\nPacing sweep — ${GAMES} games per curve per strategy\n`);
process.stdout.write(`${'='.repeat(104)}\n`);
process.stdout.write(
  `${pad('curve', 24)}${pad('play', 10)}${pad('moves', 8)}${pad('median', 8)}${pad('p10–p90', 11)}`
  + `${pad('score', 9)}${pad('brk mk', 8)}${pad('brk fire', 9)}${pad('casc%', 7)}${pad('75% at', 7)}\n`,
);
process.stdout.write(`${'-'.repeat(104)}\n`);

const results = [];

for (const curve of CURVES) {
  applyCurve(curve);
  const row = { curve };
  for (const strategy of ['first', 'greedy']) {
    const r = runBatch({ strategy, count: GAMES });
    row[strategy] = r;
    process.stdout.write(
      `${pad(strategy === 'first' ? curve.name : '', 24)}`
      + `${pad(strategy === 'first' ? 'careless' : 'skilled', 10)}`
      + `${num(r.movesMean, 8)}${num(r.movesMedian, 8, 0)}`
      + `${pad(`  ${r.movesP10}–${r.movesP90}`, 11)}`
      + `${num(r.scoreMean, 9, 0)}`
      + `${num(r.breakersMade, 8, 2)}${num(r.breakersFired, 9, 2)}`
      + `${num(r.cascadeTurnShare * 100, 7, 0)}`
      + `${num(r.criticalAt, 7)}\n`,
    );
  }
  process.stdout.write(`${'-'.repeat(104)}\n`);
  results.push(row);
}

process.stdout.write('\nSkill reward (skilled ÷ careless)\n');
results.forEach(({ curve, first, greedy }) => {
  process.stdout.write(
    `  ${pad(curve.name, 24)} moves ×${(greedy.movesMean / first.movesMean).toFixed(2)}`
    + `   score ×${(greedy.scoreMean / first.scoreMean).toFixed(2)}\n`,
  );
});

process.stdout.write(
  '\nA session is roughly (moves × ~3.5s of animation + thinking).'
  + '\nTarget: careless ~25 moves (~1.5 min), skilled ~45+ (~2.5 min+),'
  + ' with breakers firing at least once per run.\n\n',
);
