import { ITEM_MIN_SPACING, SIM_TICK_MS, DIRECTION_VECTORS } from './constants.js';
import { Item } from '../entities/item.js';
import { MACHINE_STATES } from '../entities/machine.js';
import { recordTick } from './statistics.js';

// Per-tick belt/item/machine simulation. Deterministic: same state + same
// tick count always produces the same result, per the spec's simulation
// model (Part 2).
export function tick(state) {
  const { grid, conveyors, items, objects, machines, machineDefs, recipes } = state;

  // Simplification: conveyors are processed in Map insertion order rather
  // than strict downstream-to-upstream topological order, so an item that
  // transfers onto a conveyor later in this pass can occasionally advance
  // twice in one tick. At belt speeds this is sub-pixel and never breaks
  // spacing/overlap invariants, so it's not worth a graph-ordering pass here.
  for (const conveyor of conveyors.values()) {
    advanceConveyor(conveyor, items, grid, conveyors, objects, machines, machineDefs, recipes);
  }

  const powerStats = computePower(machines, machineDefs);

  for (const machine of machines.values()) {
    const def = machineDefs[machine.type];
    if (!def) continue;
    if (def.behavior === 'recipe') {
      const recipe = recipes[def.recipe];
      advanceMachine(machine, def, recipe, powerStats.poweredIds.has(machine.id));
    }
    pushMachineOutput(machine, def, grid, conveyors, items);
  }

  recordTick(state);

  return powerStats;
}

// Milestone 4 power model: a single global pool rather than a real wire
// graph (see plan notes — Poles/Substations/topology are a bigger, separate
// piece of scope). Every generator's output sums into supply; every
// recipe-behavior machine's draw sums into demand; if demand exceeds supply,
// machines are shed lowest-priority-first (spec: "lowest priority machines
// shut down first") until the remainder fits.
function computePower(machines, machineDefs) {
  let supply = 0;
  const consumers = [];
  for (const machine of machines.values()) {
    const def = machineDefs[machine.type];
    if (!def) continue;
    if (def.behavior === 'generator') supply += def.powerOutput || 0;
    else if (def.behavior === 'recipe' && def.power) consumers.push({ machine, def });
  }

  // Higher priority number = shed first. Equal priorities shed in whatever
  // order they happen to sort in — fine while every machine shares priority 1.
  consumers.sort((a, b) => (a.def.priority ?? 0) - (b.def.priority ?? 0));

  const poweredIds = new Set(consumers.map((c) => c.machine.id));
  let demand = consumers.reduce((sum, c) => sum + c.def.power, 0);
  let i = consumers.length - 1;
  while (demand > supply && i >= 0) {
    poweredIds.delete(consumers[i].machine.id);
    demand -= consumers[i].def.power;
    i--;
  }

  const totalDemand = consumers.reduce((sum, c) => sum + c.def.power, 0);
  return { supply, demand: totalDemand, poweredIds };
}

function advanceConveyor(conveyor, items, grid, conveyors, objects, machines, machineDefs, recipes) {
  const deltaProgress = conveyor.speed * (SIM_TICK_MS / 1000);
  let ceiling = 1.0;

  for (let i = 0; i < conveyor.itemIds.length; i++) {
    const item = items.get(conveyor.itemIds[i]);
    if (!item) continue;

    if (i === 0) {
      const raw = item.progress + deltaProgress;
      if (raw < 1.0) {
        item.progress = raw;
      } else {
        const overflow = raw - 1.0;
        if (!tryTransferLead(conveyor, item, overflow, grid, conveyors, objects, machines, machineDefs, recipes, items)) {
          item.progress = 1.0; // blocked at the end of the belt
        } else {
          continue; // item moved off this conveyor (or was consumed) — removed from the queue below
        }
      }
    } else {
      item.progress = Math.min(item.progress + deltaProgress, ceiling);
    }
    ceiling = item.progress - ITEM_MIN_SPACING;
  }

  // Drop any items that were transferred/consumed this tick from the front of the queue.
  conveyor.itemIds = conveyor.itemIds.filter((id) => items.has(id) && items.get(id).conveyorId === conveyor.id);
}

// Attempts to move the lead item off `conveyor` into whatever is in front of
// it (another belt, a machine's input, a Storage Bin, or a Sink). Returns
// true if the item left this conveyor (transferred or consumed).
function tryTransferLead(conveyor, item, overflow, grid, conveyors, objects, machines, machineDefs, recipes, items) {
  const { x, y } = conveyor.nextTile;
  const nextTile = grid.getTile(x, y);
  if (!nextTile) return false;

  if (nextTile.conveyor) {
    const nextConveyor = conveyors.get(nextTile.conveyor);
    if (!nextConveyor || !hasRoomOnConveyor(nextConveyor, items)) return false;
    item.conveyorId = nextConveyor.id;
    item.progress = Math.min(overflow, ITEM_MIN_SPACING);
    nextConveyor.itemIds.push(item.id);
    return true;
  }

  if (nextTile.machine) {
    const machine = machines.get(nextTile.machine);
    const def = machine && machineDefs[machine.type];
    if (!machine || !def) return false;

    if (def.behavior === 'storage') {
      const total = Object.values(machine.outputBuffer).reduce((sum, n) => sum + n, 0);
      if (total >= def.capacity) return false;
      machine.outputBuffer[item.type] = (machine.outputBuffer[item.type] || 0) + 1;
      items.delete(item.id);
      return true;
    }

    if (def.behavior === 'recipe') {
      const recipe = recipes[def.recipe];
      if (!recipe || !recipe.inputs.some((inp) => inp.resource === item.type)) return false;
      const current = machine.inputBuffer[item.type] || 0;
      if (current >= def.inputCapacity) return false;
      machine.inputBuffer[item.type] = current + 1;
      items.delete(item.id);
      return true;
    }

    return false;
  }

  if (nextTile.occupant) {
    const obj = objects.get(nextTile.occupant);
    if (obj && obj.type === 'sink') {
      items.delete(item.id);
      obj.exportedCounts = obj.exportedCounts || {};
      obj.exportedCounts[item.type] = (obj.exportedCounts[item.type] || 0) + 1;
      return true;
    }
  }

  return false;
}

function hasRoomOnConveyor(conveyor, items) {
  if (!conveyor.itemIds.length) return true;
  const tail = items.get(conveyor.itemIds[conveyor.itemIds.length - 1]);
  return !tail || tail.progress > ITEM_MIN_SPACING;
}

// Machine Update Order (spec Part 6): check power -> check inputs -> check
// output space -> process recipe -> advance timer -> spawn output -> idle.
// Heat/maintenance checks are still out of scope.
function advanceMachine(machine, def, recipe, powered) {
  if (!def || !recipe) return;

  if (!powered) {
    // Frozen exactly where it was — processTimer untouched, so a mid-cycle
    // machine resumes rather than restarting once power returns.
    machine.state = MACHINE_STATES.POWER_LOSS;
    return;
  }

  if (machine.state === MACHINE_STATES.PROCESSING) {
    machine.processTimer += SIM_TICK_MS / 1000;
    if (machine.processTimer < recipe.time) return;

    for (const out of recipe.outputs) {
      machine.outputBuffer[out.resource] = (machine.outputBuffer[out.resource] || 0) + out.count;
      machine.totalProduced += out.count;
    }
    machine.processTimer = 0;
    machine.state = MACHINE_STATES.IDLE;
    // Fall through to immediately try starting the next cycle — a healthy
    // production line shouldn't idle for a tick between cycles for no reason.
  }

  const inputsReady = recipe.inputs.every((inp) => (machine.inputBuffer[inp.resource] || 0) >= inp.count);
  if (!inputsReady) {
    machine.state = MACHINE_STATES.WAITING_FOR_INPUT;
    return;
  }

  const outputHasRoom = recipe.outputs.every((out) => (machine.outputBuffer[out.resource] || 0) < def.outputCapacity);
  if (!outputHasRoom) {
    machine.state = MACHINE_STATES.WAITING_FOR_OUTPUT;
    return;
  }

  for (const inp of recipe.inputs) {
    machine.inputBuffer[inp.resource] -= inp.count;
  }
  machine.state = MACHINE_STATES.PROCESSING;
  machine.processTimer = 0;
}

function pushMachineOutput(machine, def, grid, conveyors, items) {
  if (!def) return;
  const resourceType = Object.keys(machine.outputBuffer).find((k) => machine.outputBuffer[k] > 0);
  if (!resourceType) return;

  const { dx, dy } = DIRECTION_VECTORS[machine.rotation] ?? DIRECTION_VECTORS[0];
  const targetTile = grid.getTile(machine.x + dx, machine.y + dy);
  const targetConveyor = targetTile?.conveyor ? conveyors.get(targetTile.conveyor) : null;
  if (!targetConveyor || !hasRoomOnConveyor(targetConveyor, items)) return;

  machine.outputBuffer[resourceType]--;
  const item = new Item({ type: resourceType, conveyorId: targetConveyor.id, progress: 0 });
  items.set(item.id, item);
  targetConveyor.itemIds.push(item.id);
}
