import { AUTOSAVE_INTERVAL_MS } from './constants.js';

const SAVE_KEY = 'machineworks.save.v1';
const SAVE_VERSION = 1;

// Minimal SaveManager for Milestone 1: persists camera position and placed
// objects for the sandbox factory. Full multi-slot / factory-progress saves
// arrive with the campaign system later.
export class SaveManager {
  constructor() {
    this.timer = null;
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.version !== SAVE_VERSION) return null;
      return data;
    } catch (err) {
      console.warn('[SaveManager] Failed to load save, ignoring corrupt data.', err);
      return null;
    }
  }

  save({ camera, placedObjects, conveyors, machines }) {
    const data = {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      camera,
      placedObjects: placedObjects.map(o => o.toJSON()),
      conveyors: (conveyors || []).map(c => c.toJSON()),
      machines: (machines || []).map(m => m.toJSON()),
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('[SaveManager] Failed to persist save.', err);
    }
  }

  startAutosave(getStateFn) {
    this.stopAutosave();
    this.timer = setInterval(() => this.save(getStateFn()), AUTOSAVE_INTERVAL_MS);
  }

  stopAutosave() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
