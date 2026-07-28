// Real item entity (Milestone 2). Shape follows the spec's Item Object
// (Part 6): id, type, position (derived from conveyorId+progress), creation
// time. originMachine/destinationMachine stay null until Milestone 3 wires
// up real machines.
let nextId = 1;

export class Item {
  constructor({ type, conveyorId, progress = 0, creationTick = 0 }) {
    this.id = `item_${String(nextId++).padStart(6, '0')}`;
    this.type = type;
    this.conveyorId = conveyorId;
    this.progress = progress;
    this.originMachine = null;
    this.destinationMachine = null;
    this.creationTick = creationTick;
  }
}
