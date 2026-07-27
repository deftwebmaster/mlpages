/**
 * diag.mjs — Step-by-step comparison of a solver route against the live Game.
 * Development aid, not part of the shipped game.
 *
 *   node tools/diag.mjs <levelId> [uplinkSlot]
 */

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  get length() { return store.size; },
};
globalThis.window = globalThis;

const { LEVELS } = await import('../src/levels.js');
const { findRoute, DT } = await import('./solver.mjs');
const { updateWorld } = await import('../src/lanes.js');
const { Game, GameState } = await import('../src/game.js');

const levelId = Number(process.argv[2] || 3);
const slot = Number(process.argv[3] || 0);

const game = new Game();
for (const def of LEVELS) {
  for (const p of def.tutorialPrompts ?? []) game.tutorialState.seen[`${def.id}:${p.id}`] = true;
}

game.startLevel(levelId);
while (game.state === GameState.STARTING) game.update(DT);
game.worldTime = 0;
updateWorld(game.level, 0);

const search = findRoute(game.level, slot, { wantRoute: true });
console.log(`level ${levelId} uplink ${slot + 1}: route found=${search.ok}, ticks=${search.ticks}`);
if (!search.ok) process.exit(1);

// Rebuild the solver's own state chain so we can compare positions tick by tick.
const chain = [];
let cur = search.state;
while (cur) { chain.push(cur); cur = cur._parent; }
chain.reverse();

game.worldTime = 0;
updateWorld(game.level, 0);

const apply = (a) => {
  if (a === 'up') game.requestMove(0, -1);
  else if (a === 'down') game.requestMove(0, 1);
  else if (a === 'left') game.requestMove(-1, 0);
  else if (a === 'right') game.requestMove(1, 0);
  else if (a === 'switch') game.requestPolarity();
};

console.log('\ntick  action   solver(row,x,pol,ride)        live(row,x,pol,ride)          state');
for (let i = 0; i < search.route.length; i++) {
  const action = search.route[i];
  apply(action);
  game.update(DT);

  const expected = chain[i + 1];
  const p = game.player;
  const drift = Math.abs(p.x - expected.x) + Math.abs(p.row - expected.row);
  const flag = drift > 0.02 || p.polarity !== expected.polarity ? '  <== DRIFT' : '';
  if (flag || i < 4 || i > search.route.length - 6) {
    console.log(
      `${String(i + 1).padStart(4)}  ${action.padEnd(7)}  ` +
      `(${expected.row}, ${expected.x.toFixed(3)}, ${expected.polarity}, ${expected.carryLane ? 'ride' : '--'})`.padEnd(30) +
      `(${p.row}, ${p.x.toFixed(3)}, ${p.polarity}, ${p.isRiding ? 'ride' : '--'})`.padEnd(30) +
      game.state + flag,
    );
  }
  if (flag) break;
  if (game.state === GameState.PLAYER_DYING) {
    console.log(
      `  DIED at tick ${i + 1} (${game.lastDeathCause}) ` +
      `worldTime=${game.worldTime.toFixed(4)} solverT=${((i + 1) * DT).toFixed(4)} ` +
      `grace=${game.player.graceTimer.toFixed(3)} ` +
      `pos=(${game.player.row}, ${game.player.centerX.toFixed(3)}, ${game.player.centerY.toFixed(3)})`,
    );
    const lane = game.level.laneByRow[game.player.row];
    console.log(`  lane ${game.player.row} (${lane.type}) shapes:`,
      lane.shapes.map((s) => `${s.kind}[${s.x.toFixed(2)}..${(s.x + s.w).toFixed(2)}]`).join(' '));
    console.log(`  solver expected row=${expected.row} x=${expected.x.toFixed(3)} y=${expected.y.toFixed(3)}`);
    break;
  }
}
console.log(`\nfinal state ${game.state}, uplinks ${game.uplinksActive}/${game.uplinkStates.length}`);
