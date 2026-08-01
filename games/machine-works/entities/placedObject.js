// Generic placeable used for buildings that don't have a dedicated entity.
// Sink stands in for a real Loading Dock/export building until Logistics
// arrives; Conveyors (Milestone 2) and Machines (Milestone 3) got their own
// entities (see entities/conveyor.js, entities/machine.js).

let nextId = 1;

function syncNextId(id) {
  const match = /^obj_(\d+)$/.exec(id || '');
  if (match) nextId = Math.max(nextId, Number(match[1]) + 1);
}

export const ROTATIONS = [0, 90, 180, 270];

export class PlacedObject {
  constructor({ type, x, y, rotation = 0, footprint = [1, 1] }) {
    this.id = `obj_${String(nextId++).padStart(6, '0')}`;
    this.type = type;
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.footprint = footprint;
  }

  get rotatedFootprint() {
    const [w, h] = this.footprint;
    return (this.rotation === 90 || this.rotation === 270) ? [h, w] : [w, h];
  }

  toJSON() {
    const data = { id: this.id, type: this.type, x: this.x, y: this.y, rotation: this.rotation, footprint: this.footprint };
    if (this.exportedCounts) data.exportedCounts = { ...this.exportedCounts };
    return data;
  }

  static fromJSON(data) {
    const obj = new PlacedObject(data);
    obj.id = data.id;
    if (data.exportedCounts) obj.exportedCounts = { ...data.exportedCounts };
    syncNextId(obj.id);
    return obj;
  }
}

// Base toolbar catalog. `kind` tells game.js's placement pipeline which
// entity type to create: 'object' -> PlacedObject (this file), 'conveyor'
// -> Conveyor. game.js merges in 'machine' entries (loaded from
// data/machines.json) at boot to build the full catalog the UI uses.
export const PLACEABLE_TYPES = {
  conveyor: { label: 'Conveyor', kind: 'conveyor', tier: 'basic', footprint: [1, 1], color: '#3ddbd9', directional: true, draggable: true },
  sink: { label: 'Sink', kind: 'object', footprint: [1, 1], color: '#8b929c', directional: true },
};
