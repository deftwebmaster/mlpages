import { CONVEYOR_TIERS, DIRECTION_VECTORS } from '../src/constants.js';

// Real conveyor entity (Milestone 2) — replaces the Milestone 1 test_belt
// placeholder. Single-tile footprint, stored in the owning tile's
// `conveyor` field (see entities/tile.js).
let nextId = 1;

function syncNextId(id) {
  const match = /^belt_(\d+)$/.exec(id || '');
  if (match) nextId = Math.max(nextId, Number(match[1]) + 1);
}

export class Conveyor {
  constructor({ x, y, rotation = 0, tier = 'basic' }) {
    this.id = `belt_${String(nextId++).padStart(6, '0')}`;
    this.x = x;
    this.y = y;
    this.rotation = rotation; // 0/90/180/270, same convention as PlacedObject
    this.tier = tier;
    this.itemIds = []; // ordered lead-to-tail (index 0 = closest to exit)

    // Milestone 5 — lifetime utilization counters for Analysis Mode
    // (src/statistics.js increments these; a simple running average
    // rather than separate current/max figures, see plan notes).
    this.ticksTotal = 0;
    this.ticksActive = 0;
  }

  get utilization() {
    return this.ticksTotal > 0 ? this.ticksActive / this.ticksTotal : 0;
  }

  get speed() {
    return CONVEYOR_TIERS[this.tier].speed;
  }

  get direction() {
    return DIRECTION_VECTORS[this.rotation];
  }

  get nextTile() {
    const { dx, dy } = this.direction;
    return { x: this.x + dx, y: this.y + dy };
  }

  toJSON() {
    return { id: this.id, x: this.x, y: this.y, rotation: this.rotation, tier: this.tier };
  }

  static fromJSON(data) {
    const conveyor = new Conveyor(data);
    conveyor.id = data.id;
    syncNextId(conveyor.id);
    return conveyor;
  }
}
