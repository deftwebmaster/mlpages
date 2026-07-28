import { Camera } from './camera.js';
import { InputController } from './input.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';
import { SaveManager } from './save.js';
import { Grid } from '../entities/tile.js';
import { PlacedObject, PLACEABLE_TYPES, ROTATIONS } from '../entities/placedObject.js';
import { Conveyor } from '../entities/conveyor.js';
import { Machine } from '../entities/machine.js';
import { tick as simulationTick } from './simulation.js';
import { getSessionStats } from './statistics.js';
import * as Blueprint from './blueprint.js';
import { SIM_TICK_MS } from './constants.js';

// Boot -> Sandbox state machine. Real campaign states (MAIN_MENU, CAMPAIGN,
// FACTORY_LOADING, PLANNING, SIMULATING, ...) arrive with later milestones;
// this establishes the loop they'll plug into.
const STATE = { BOOT: 'BOOT', SANDBOX: 'SANDBOX' };

class HistoryStack {
  constructor() {
    this.past = [];
    this.future = [];
  }
  push(action) {
    this.past.push(action);
    this.future = [];
  }
  canUndo() { return this.past.length > 0; }
  canRedo() { return this.future.length > 0; }
  popUndo() {
    const action = this.past.pop();
    if (action) this.future.push(action);
    return action;
  }
  popRedo() {
    const action = this.future.pop();
    if (action) this.past.push(action);
    return action;
  }
}

class Game {
  constructor() {
    this.state = STATE.BOOT;
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new Renderer(this.canvas);
    this.camera = new Camera();
    this.save = new SaveManager();
    this.history = new HistoryStack();

    this.objects = new Map(); // id -> PlacedObject (Sink)
    this.conveyors = new Map(); // id -> Conveyor
    this.machines = new Map(); // id -> Machine
    this.items = new Map(); // id -> Item
    this.machineDefs = {}; // loaded from data/machines.json in boot()
    this.recipes = {}; // loaded from data/recipes.json in boot()
    this.catalog = { ...PLACEABLE_TYPES }; // merged with machine defs in boot()
    this.contract = null; // production objective, loaded from the factory file in boot()
    this.powerStats = { supply: 0, demand: 0, poweredIds: new Set() };
    this.currentTick = 0;
    this.paused = false;
    this.analysisMode = false;
    this.beltsPlacedTotal = 0; // lifetime counters (Milestone 5 statistics) — never decremented on removal
    this.machinesPlacedTotal = 0;
    this.blueprints = []; // loaded from LocalStorage in boot()
    this.activeTool = 'none';
    this.previewRotation = 0;
    this.preview = null;
    this.dragMode = null; // 'pan' | 'paint'
    this.lastPaintTile = null;

    this.lastTime = 0;
    this.tickAccumulator = 0;

    this.frame = this.frame.bind(this);
  }

  async boot() {
    this.renderer.resize();
    window.addEventListener('resize', () => this.renderer.resize());

    const [factoryData, resources, recipes, machineDefs] = await Promise.all([
      fetch('data/factories/factory_00_sandbox.json').then((r) => r.json()),
      fetch('data/resources.json').then((r) => r.json()),
      fetch('data/recipes.json').then((r) => r.json()),
      fetch('data/machines.json').then((r) => r.json()),
    ]);
    this.resources = resources;
    this.recipes = recipes;
    this.machineDefs = machineDefs;
    for (const [id, def] of Object.entries(machineDefs)) {
      this.catalog[id] = { label: def.name, kind: 'machine', footprint: def.footprint, color: def.color, directional: true };
    }

    this.grid = Grid.fromFactoryData(factoryData);
    this.camera.loadState(factoryData.camera);
    this.contract = factoryData.contract || null;

    const saved = this.save.load();
    if (saved) {
      this.camera.loadState(saved.camera);
      for (const objData of saved.placedObjects) this.applyPlace(PlacedObject.fromJSON(objData));
      for (const beltData of saved.conveyors || []) this.applyPlaceConveyor(Conveyor.fromJSON(beltData));
      for (const machineData of saved.machines || []) this.applyPlaceMachine(Machine.fromJSON(machineData));
    } else {
      for (const objData of factoryData.placedObjects || []) this.applyPlace(new PlacedObject(objData));
      for (const beltData of factoryData.conveyors || []) this.applyPlaceConveyor(new Conveyor(beltData));
      for (const machineData of factoryData.machines || []) this.applyPlaceMachine(new Machine(machineData));
    }
    // Seed the lifetime placement counters from whatever's already on the
    // grid (factory seed or a previous save) — placeAt() only increments
    // for placements the player makes *after* this point.
    this.beltsPlacedTotal = this.conveyors.size;
    this.machinesPlacedTotal = this.machines.size;

    this.blueprints = Blueprint.loadBlueprintList();

    this.ui = new UI({
      onSelectTool: (id) => this.selectTool(id),
      onRotate: () => this.rotateActive(),
      onUndo: () => this.undo(),
      onRedo: () => this.redo(),
      onTogglePause: () => this.togglePause(),
      onToggleAnalysis: () => this.toggleAnalysisMode(),
      onSaveBlueprint: (name) => this.saveBlueprint(name),
      onLoadBlueprint: (id) => this.loadBlueprint(id),
      onDeleteBlueprint: (id) => this.deleteBlueprintById(id),
    });
    this.ui.setFactoryName(factoryData.metadata.name);
    this.ui.setPaused(this.paused);
    this.ui.setPowerStats(this.powerStats);
    this.ui.setBlueprintList(this.blueprints);
    this.refreshObjectiveUI();
    this.refreshHistoryUI();

    this.input = new InputController(this.canvas, {
      onTap: (pt) => this.handleTap(pt),
      onDoubleTap: (pt) => this.handleDoubleTap(pt),
      onDragStart: (pt) => this.handleDragStart(pt),
      onDragMove: (info) => this.handleDragMove(info),
      onDragEnd: () => this.handleDragEnd(),
      onPinch: ({ scaleDelta, cx, cy }) => this.camera.zoomAt(scaleDelta, cx, cy, this.renderer.viewW, this.renderer.viewH),
      onWheelZoom: ({ factor, x, y }) => this.camera.zoomAt(factor, x, y, this.renderer.viewW, this.renderer.viewH),
      onLongPress: (pt) => this.handleLongPress(pt),
    });
    this.canvas.addEventListener('pointermove', (e) => this.handleHover(e));

    this.save.startAutosave(() => this.serializeState());
    window.addEventListener('beforeunload', () => this.save.save(this.serializeState()));

    if ('serviceWorker' in navigator && !window.__MW_DISABLE_SW__) {
      navigator.serviceWorker.register('sw.js').catch((err) => console.warn('[SW] registration failed', err));
    }

    this.state = STATE.SANDBOX;
    this.lastTime = performance.now();
    requestAnimationFrame(this.frame);
  }

  serializeState() {
    return {
      camera: this.camera.serialize(),
      placedObjects: Array.from(this.objects.values()),
      conveyors: Array.from(this.conveyors.values()),
      machines: Array.from(this.machines.values()),
    };
  }

  // --- placement pipeline -------------------------------------------------

  tileFromScreen(pt) {
    return this.camera.screenToTile(pt.x, pt.y, this.renderer.viewW, this.renderer.viewH);
  }

  rotatedFootprintFor(footprint, rotation) {
    const [w, h] = footprint;
    return (rotation === 90 || rotation === 270) ? [h, w] : [w, h];
  }

  // A tile can host at most one of {occupant, conveyor, machine} — belts
  // can't run under buildings and buildings can't sit on top of a belt
  // (Part 6 Collision Rules).
  footprintIsFree(tx, ty, rotatedFootprint) {
    if (!this.grid.isFootprintFree(tx, ty, rotatedFootprint)) return false;
    const [fw, fh] = rotatedFootprint;
    for (let dy = 0; dy < fh; dy++) {
      for (let dx = 0; dx < fw; dx++) {
        const tile = this.grid.getTile(tx + dx, ty + dy);
        if (!tile || tile.conveyor || tile.machine) return false;
      }
    }
    return true;
  }

  updatePreview(tx, ty, rotation = this.previewRotation) {
    const def = this.catalog[this.activeTool];
    if (!def) { this.preview = null; return; }
    const rotatedFootprint = this.rotatedFootprintFor(def.footprint, rotation);
    const valid = this.grid.inBounds(tx, ty) && this.footprintIsFree(tx, ty, rotatedFootprint);
    this.preview = { x: tx, y: ty, rotation, footprint: def.footprint, rotatedFootprint, valid };
  }

  placeAt(tx, ty, type, rotation) {
    const def = this.catalog[type];
    let result;
    if (def.kind === 'conveyor') {
      const conveyor = new Conveyor({ x: tx, y: ty, rotation, tier: def.tier });
      this.applyPlaceConveyor(conveyor);
      this.history.push({ kind: 'conveyor', type: 'place', obj: conveyor.toJSON() });
      this.beltsPlacedTotal++;
      result = conveyor;
    } else if (def.kind === 'machine') {
      const machine = new Machine({ type, x: tx, y: ty, rotation });
      this.applyPlaceMachine(machine);
      this.history.push({ kind: 'machine', type: 'place', obj: machine.toJSON() });
      this.machinesPlacedTotal++;
      result = machine;
    } else {
      const obj = new PlacedObject({ type, x: tx, y: ty, rotation, footprint: def.footprint });
      this.applyPlace(obj);
      this.history.push({ kind: 'object', type: 'place', obj: obj.toJSON() });
      result = obj;
    }
    this.refreshHistoryUI();
    this.updatePreview(tx, ty, rotation); // tile is now occupied — refresh the ghost so it doesn't render stale-valid over the new object
    return result;
  }

  removeObject(id) {
    const obj = this.objects.get(id);
    if (!obj) return;
    this.applyRemove(obj);
    this.history.push({ kind: 'object', type: 'remove', obj: obj.toJSON() });
    this.refreshHistoryUI();
  }

  removeConveyor(id) {
    const conveyor = this.conveyors.get(id);
    if (!conveyor) return;
    this.applyRemoveConveyor(conveyor);
    this.history.push({ kind: 'conveyor', type: 'remove', obj: conveyor.toJSON() });
    this.refreshHistoryUI();
  }

  removeMachine(id) {
    const machine = this.machines.get(id);
    if (!machine) return;
    this.applyRemoveMachine(machine);
    this.history.push({ kind: 'machine', type: 'remove', obj: machine.toJSON() });
    this.refreshHistoryUI();
  }

  applyPlace(obj) {
    this.objects.set(obj.id, obj);
    this.grid.setOccupant(obj.x, obj.y, obj.rotatedFootprint, obj.id);
  }

  applyRemove(obj) {
    this.grid.clearOccupant(obj.x, obj.y, obj.rotatedFootprint);
    this.objects.delete(obj.id);
  }

  applyPlaceConveyor(conveyor) {
    this.conveyors.set(conveyor.id, conveyor);
    this.grid.setConveyor(conveyor.x, conveyor.y, conveyor.id);
  }

  applyRemoveConveyor(conveyor) {
    // Drop any in-flight items riding this segment rather than leaving them stranded.
    for (const itemId of conveyor.itemIds) this.items.delete(itemId);
    this.grid.clearConveyor(conveyor.x, conveyor.y);
    this.conveyors.delete(conveyor.id);
  }

  applyPlaceMachine(machine) {
    this.machines.set(machine.id, machine);
    this.grid.setMachine(machine.x, machine.y, machine.id);
  }

  applyRemoveMachine(machine) {
    this.grid.clearMachine(machine.x, machine.y);
    this.machines.delete(machine.id);
  }

  undo() {
    const action = this.history.popUndo();
    if (!action) return;
    if (action.kind === 'conveyor') {
      if (action.type === 'place') this.applyRemoveConveyor(this.conveyors.get(action.obj.id));
      else this.applyPlaceConveyor(Conveyor.fromJSON(action.obj));
    } else if (action.kind === 'machine') {
      if (action.type === 'place') this.applyRemoveMachine(this.machines.get(action.obj.id));
      else this.applyPlaceMachine(Machine.fromJSON(action.obj));
    } else if (action.type === 'place') {
      this.applyRemove(this.objects.get(action.obj.id));
    } else if (action.type === 'remove') {
      this.applyPlace(PlacedObject.fromJSON(action.obj));
    }
    this.refreshHistoryUI();
  }

  redo() {
    const action = this.history.popRedo();
    if (!action) return;
    if (action.kind === 'conveyor') {
      if (action.type === 'place') this.applyPlaceConveyor(Conveyor.fromJSON(action.obj));
      else this.applyRemoveConveyor(this.conveyors.get(action.obj.id));
    } else if (action.kind === 'machine') {
      if (action.type === 'place') this.applyPlaceMachine(Machine.fromJSON(action.obj));
      else this.applyRemoveMachine(this.machines.get(action.obj.id));
    } else if (action.type === 'place') {
      this.applyPlace(PlacedObject.fromJSON(action.obj));
    } else if (action.type === 'remove') {
      this.applyRemove(this.objects.get(action.obj.id));
    }
    this.refreshHistoryUI();
  }

  refreshHistoryUI() {
    this.ui.setHistoryState({ canUndo: this.history.canUndo(), canRedo: this.history.canRedo() });
  }

  refreshObjectiveUI() {
    if (!this.contract) return;
    const sink = Array.from(this.objects.values()).find((o) => o.type === 'sink');
    const current = sink?.exportedCounts?.[this.contract.resource] || 0;
    this.ui.setObjective({
      label: this.contract.description,
      current,
      target: this.contract.target,
      complete: current >= this.contract.target,
    });
  }

  selectTool(toolId) {
    this.activeTool = toolId;
    this.ui.setActiveTool(toolId);
    this.preview = null;
  }

  togglePause() {
    this.paused = !this.paused;
    this.ui.setPaused(this.paused);
  }

  toggleAnalysisMode() {
    this.analysisMode = !this.analysisMode;
    this.ui.setAnalysisMode(this.analysisMode);
    this.refreshSessionStatsUI();
  }

  refreshSessionStatsUI() {
    if (!this.analysisMode) return;
    this.ui.setSessionStats(getSessionStats(this));
  }

  saveBlueprint(name) {
    this.blueprints = Blueprint.addBlueprint(this, name);
    this.ui.setBlueprintList(this.blueprints);
  }

  loadBlueprint(id) {
    const blueprint = this.blueprints.find((bp) => bp.id === id);
    if (!blueprint) return;
    Blueprint.applyLayout(this, blueprint);
  }

  deleteBlueprintById(id) {
    this.blueprints = Blueprint.deleteBlueprint(id);
    this.ui.setBlueprintList(this.blueprints);
  }

  rotateActive() {
    const idx = ROTATIONS.indexOf(this.previewRotation);
    this.previewRotation = ROTATIONS[(idx + 1) % ROTATIONS.length];
    if (this.preview) this.updatePreview(this.preview.x, this.preview.y, this.previewRotation);
  }

  directionFromDelta(dx, dy) {
    if (dx === 0 && dy === 0) return null;
    if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 90 : 270;
    return dy > 0 ? 180 : 0;
  }

  paintAt(pt) {
    const { x, y } = this.tileFromScreen(pt);
    const tx = Math.floor(x), ty = Math.floor(y);
    if (this.lastPaintTile && this.lastPaintTile.x === tx && this.lastPaintTile.y === ty) return;

    let rotation = this.previewRotation;
    if (this.lastPaintTile) {
      const dir = this.directionFromDelta(tx - this.lastPaintTile.x, ty - this.lastPaintTile.y);
      if (dir !== null) rotation = dir;
    }
    this.updatePreview(tx, ty, rotation);
    if (this.preview.valid) this.placeAt(tx, ty, this.activeTool, rotation);
    this.lastPaintTile = { x: tx, y: ty };
  }

  // --- input handlers -------------------------------------------------

  handleTap(pt) {
    if (this.activeTool === 'none') return;
    const { x, y } = this.tileFromScreen(pt);
    const tx = Math.floor(x), ty = Math.floor(y);
    this.updatePreview(tx, ty, this.previewRotation);
    if (this.preview.valid) this.placeAt(tx, ty, this.activeTool, this.previewRotation);
  }

  handleDoubleTap(pt) {
    const { x, y } = this.tileFromScreen(pt);
    this.camera.centerOnTile(x, y);
  }

  handleLongPress(pt) {
    const { x, y } = this.tileFromScreen(pt);
    const tile = this.grid.getTile(Math.floor(x), Math.floor(y));
    if (!tile) return;
    if (tile.occupied) this.removeObject(tile.occupant);
    else if (tile.machine) this.removeMachine(tile.machine);
    else if (tile.conveyor) this.removeConveyor(tile.conveyor);
  }

  handleDragStart(pt) {
    const def = this.catalog[this.activeTool];
    if (def?.draggable) {
      this.dragMode = 'paint';
      this.lastPaintTile = null;
      this.paintAt(pt);
    } else {
      this.dragMode = 'pan';
    }
  }

  handleDragMove(info) {
    if (this.dragMode === 'pan') {
      this.camera.panByScreenDelta(info.dx, info.dy);
      this.camera.setVelocityFromScreenDelta(info.dx, info.dy, info.dtMs);
    } else if (this.dragMode === 'paint') {
      this.paintAt({ x: info.x, y: info.y });
    }
  }

  handleDragEnd() {
    if (this.dragMode === 'pan') this.camera.startCoast();
    this.dragMode = null;
    this.lastPaintTile = null;
  }

  handleHover(e) {
    if (e.buttons !== 0) return;
    if (this.activeTool === 'none') { this.preview = null; return; }
    const rect = this.canvas.getBoundingClientRect();
    const { x, y } = this.tileFromScreen({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    this.updatePreview(Math.floor(x), Math.floor(y), this.previewRotation);
  }

  // --- main loop -------------------------------------------------

  tick() {
    this.powerStats = simulationTick({
      grid: this.grid,
      conveyors: this.conveyors,
      items: this.items,
      objects: this.objects,
      machines: this.machines,
      machineDefs: this.machineDefs,
      recipes: this.recipes,
      currentTick: this.currentTick,
    });
    this.currentTick++;
  }

  frame(now) {
    // Clamp dt so a backgrounded/suspended tab (PWA switched away and back,
    // or rAF throttling) can't cause a huge catch-up jump in camera easing
    // or a tick-accumulator spiral when the app resumes. Floor at 0 too —
    // rAF timestamps are monotonic in practice, but a negative dt must never
    // be allowed to drag the accumulator net-negative and stall ticks.
    const dt = Math.max(0, Math.min(now - this.lastTime, 100));
    this.lastTime = now;

    this.camera.update(dt);
    if (!this.paused) {
      this.tickAccumulator += dt;
      while (this.tickAccumulator >= SIM_TICK_MS) {
        this.tick();
        this.tickAccumulator -= SIM_TICK_MS;
      }
      this.ui.setPowerStats(this.powerStats);
      this.refreshObjectiveUI();
      this.refreshSessionStatsUI();
    }

    this.renderer.render({
      grid: this.grid,
      camera: this.camera,
      placedObjects: Array.from(this.objects.values()),
      conveyors: this.conveyors,
      machines: this.machines,
      machineDefs: this.machineDefs,
      recipes: this.recipes,
      items: this.items,
      preview: this.preview,
      analysisMode: this.analysisMode,
    });

    requestAnimationFrame(this.frame);
  }
}

const game = new Game();
game.boot();
window.__MW_GAME__ = game; // debug hook
