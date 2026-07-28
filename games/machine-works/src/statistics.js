import { SIM_TICK_MS } from './constants.js';
import { MACHINE_STATES } from '../entities/machine.js';

// Incremental statistics tracking (Milestone 5). Per the spec's Statistics
// Engine guidance ("update incrementally, never recount entire factory"),
// this only ever adds to existing counters each tick — it never re-derives
// totals by walking the whole factory.
export function recordTick(state) {
  const { conveyors, machines } = state;

  for (const conveyor of conveyors.values()) {
    conveyor.ticksTotal++;
    if (conveyor.itemIds.length > 0) conveyor.ticksActive++;
  }

  for (const machine of machines.values()) {
    machine.ticksTotal++;
    if (machine.state === MACHINE_STATES.PROCESSING) machine.ticksActive++;
  }
}

// Pure read of session-level counters already tracked on `game` and its
// entities — no separate bookkeeping structure to keep in sync.
export function getSessionStats(game) {
  const sink = Array.from(game.objects.values()).find((o) => o.type === 'sink');
  const itemsExported = sink?.exportedCounts
    ? Object.values(sink.exportedCounts).reduce((sum, n) => sum + n, 0)
    : 0;
  const itemsProduced = Array.from(game.machines.values()).reduce((sum, m) => sum + m.totalProduced, 0);

  return {
    itemsExported,
    itemsProduced,
    beltsPlaced: game.beltsPlacedTotal,
    machinesPlaced: game.machinesPlacedTotal,
    uptimeSeconds: Math.floor((game.currentTick * SIM_TICK_MS) / 1000),
  };
}
