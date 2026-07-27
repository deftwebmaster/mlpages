/**
 * validate-levels.mjs — Offline proof that every level can actually be beaten.
 *
 * Hand-tuned lane timings are easy to get subtly wrong: a platform lane whose
 * bars never line up with the row above it, a gate cycle that is shut every
 * time you could reach it. Eyeballing does not catch those.
 *
 * For each uplink of each level this reports:
 *   - the fastest route a perfect player could take,
 *   - whether a route still exists when you respawn at an awkward phase,
 *   - whether the level can be walked straight through without ever waiting,
 *     which would mean it teaches nothing.
 *
 * Run with:  npm run validate
 *            npm run validate -- 7          (single level)
 *            npm run validate -- 7 --route  (print the winning input sequence)
 */

import { LEVELS } from '../src/levels.js';
import { prepareLevel, validateLevel } from '../src/levelLoader.js';
import { findRoute, rushSurvives, describeRoute, DT, TIME_CAP } from './solver.mjs';

// Respawn phases: a level must be solvable whenever you happen to restart.
const PHASES = [0, 3.1, 6.7, 11.3, 17.9];

const args = process.argv.slice(2);
const wantRoute = args.includes('--route');
const only = args.find((a) => /^\d+$/.test(a));
const targets = only ? LEVELS.filter((l) => String(l.id) === only) : LEVELS;

let failures = 0;
let structuralIssues = 0;
let triviallyBeatable = 0;

console.log(`\nSignal Runner — level validation (${DT.toFixed(4)}s steps, ${TIME_CAP}s cap)\n`);

for (const definition of targets) {
  const level = prepareLevel(definition);
  const problems = validateLevel(level);
  if (problems.length) {
    structuralIssues += problems.length;
    console.log(`  ! ${level.id} ${level.name}`);
    for (const p of problems) console.log(`      structural: ${p}`);
  }

  const results = [];
  let allOk = true;
  for (let slot = 0; slot < level.uplinks.length; slot++) {
    const perPhase = PHASES.map((t0) =>
      findRoute(level, slot, { t0, wantRoute: wantRoute && t0 === 0 }));
    const ok = perPhase.every((r) => r.ok);
    if (!ok) allOk = false;
    results.push({ slot, perPhase, ok });
  }

  const rush = rushSurvives(level);
  const label = `${String(level.id).padStart(2)} ${level.name}`.padEnd(20);
  const trivial = rush > 0.25;
  if (trivial) triviallyBeatable++;

  if (allOk) {
    const best = results
      .map((r) => Math.min(...r.perPhase.map((p) => p.seconds)).toFixed(1) + 's')
      .join('/');
    const worst = Math.max(...results.flatMap((r) => r.perPhase.map((p) => p.seconds)));
    console.log(
      `  ${trivial ? '!' : '✓'} ${label} optimal ${best.padEnd(16)} ` +
      `worst-phase ${worst.toFixed(1).padStart(4)}s   ` +
      `rush-through ${(rush * 100).toFixed(0).padStart(3)}%${trivial ? '  <-- too easy' : ''}`,
    );
  } else {
    failures++;
    console.log(`  ✗ ${label} UNREACHABLE`);
    for (const r of results) {
      r.perPhase.forEach((p, i) => {
        if (!p.ok) {
          console.log(
            `      uplink ${r.slot + 1} @ phase ${PHASES[i]}s: NO ROUTE within ` +
            `${TIME_CAP}s (${p.expanded.toLocaleString()} states explored)`,
          );
        }
      });
    }
  }

  if (wantRoute) {
    for (const r of results) {
      const first = r.perPhase[0];
      if (first.ok && first.route) {
        console.log(`      u${r.slot + 1}: ${describeRoute(first.route)}`);
      }
    }
  }
}

console.log('');
if (structuralIssues) console.log(`${structuralIssues} structural warning(s).`);
if (triviallyBeatable) {
  console.log(`${triviallyBeatable} level(s) can be walked straight through without waiting.`);
}
if (failures) {
  console.log(`${failures} level(s) have no provable route.\n`);
  process.exit(1);
}
console.log('All levels are completable.\n');
