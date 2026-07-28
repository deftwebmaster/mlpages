import { PlacedObject } from '../entities/placedObject.js';
import { Conveyor } from '../entities/conveyor.js';
import { Machine } from '../entities/machine.js';

const BLUEPRINT_KEY = 'machineworks.blueprints.v1';

// Blueprint persistence lives in its own LocalStorage key, separate from
// SaveManager's autosave (src/save.js), so saved layouts survive independently
// of whatever the player is currently doing to the live factory.
export function loadBlueprintList() {
  try {
    const raw = localStorage.getItem(BLUEPRINT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('[Blueprint] Failed to load blueprint list, ignoring corrupt data.', err);
    return [];
  }
}

function saveBlueprintList(list) {
  try {
    localStorage.setItem(BLUEPRINT_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('[Blueprint] Failed to persist blueprint list.', err);
  }
}

// Matches the spec's Blueprint File shape (Part 6) minus power/decorations,
// which don't exist yet, and `notes`, which isn't needed for this milestone.
export function serializeLayout(game, name) {
  return {
    id: `bp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name,
    savedAt: Date.now(),
    machines: Array.from(game.machines.values()).map((m) => m.toJSON()),
    conveyors: Array.from(game.conveyors.values()).map((c) => c.toJSON()),
    placedObjects: Array.from(game.objects.values()).map((o) => o.toJSON()),
  };
}

export function addBlueprint(game, name) {
  const list = loadBlueprintList();
  list.push(serializeLayout(game, name));
  saveBlueprintList(list);
  return list;
}

export function deleteBlueprint(id) {
  const list = loadBlueprintList().filter((bp) => bp.id !== id);
  saveBlueprintList(list);
  return list;
}

// Replaces the current layout wholesale — a deliberate "fresh start" action
// rather than an incremental one, so it clears undo history too rather than
// leaving a confusing pile of now-meaningless undo steps behind.
export function applyLayout(game, blueprint) {
  for (const machine of Array.from(game.machines.values())) game.applyRemoveMachine(machine);
  for (const conveyor of Array.from(game.conveyors.values())) game.applyRemoveConveyor(conveyor);
  for (const obj of Array.from(game.objects.values())) game.applyRemove(obj);
  game.items.clear();
  game.history.past = [];
  game.history.future = [];

  for (const data of blueprint.machines) game.applyPlaceMachine(new Machine(data));
  for (const data of blueprint.conveyors) game.applyPlaceConveyor(new Conveyor(data));
  for (const data of blueprint.placedObjects) game.applyPlace(new PlacedObject(data));

  game.refreshHistoryUI();
}
