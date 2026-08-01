// Real machine entity (Milestone 3). Buffers/processing state are live
// simulation data recomputed by src/simulation.js each tick — like Conveyor
// and Item, Machine is a plain data holder, not self-updating. Only
// placement fields are persisted (see toJSON); buffers/timers reset on
// load, matching the M2 decision not to persist live item state.
let nextId = 1;

function syncNextId(id) {
  const match = /^machine_(\d+)$/.exec(id || '');
  if (match) nextId = Math.max(nextId, Number(match[1]) + 1);
}

export const MACHINE_STATES = {
  IDLE: 'idle',
  WAITING_FOR_INPUT: 'waiting_for_input',
  PROCESSING: 'processing',
  WAITING_FOR_OUTPUT: 'waiting_for_output',
  POWER_LOSS: 'power_loss', // Milestone 4 — unpowered; frozen mid-cycle, resumes when power returns
};

export class Machine {
  constructor({ type, x, y, rotation = 0 }) {
    this.id = `machine_${String(nextId++).padStart(6, '0')}`;
    this.type = type;
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.inputBuffer = {};
    this.outputBuffer = {};
    this.state = MACHINE_STATES.IDLE;
    this.processTimer = 0;

    // Milestone 5 — lifetime utilization counters for Analysis Mode (a
    // simple running average, see plan notes) and a cumulative output
    // counter for the Statistics session readout.
    this.ticksTotal = 0;
    this.ticksActive = 0;
    this.totalProduced = 0;
  }

  get utilization() {
    return this.ticksTotal > 0 ? this.ticksActive / this.ticksTotal : 0;
  }

  toJSON() {
    return { id: this.id, type: this.type, x: this.x, y: this.y, rotation: this.rotation };
  }

  static fromJSON(data) {
    const machine = new Machine(data);
    machine.id = data.id;
    syncNextId(machine.id);
    return machine;
  }
}
