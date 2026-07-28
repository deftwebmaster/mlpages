// Tile schema per design spec Part 2: every tile stores floor type, conveyor,
// machine, power state, decoration, lighting, and occupancy. Only floorType
// and occupancy are populated in Milestone 1 — the rest stay null so later
// milestones (belts, machines, power) can fill them in without a schema change.

export class Tile {
  constructor(x, y, floorType = 'concrete') {
    this.x = x;
    this.y = y;
    this.floorType = floorType;
    this.conveyor = null;
    this.machine = null;
    this.powerState = null;
    this.decoration = null;
    this.lighting = 1.0;
    this.occupant = null; // id of the PlacedObject occupying this tile, if any
  }

  get occupied() {
    return this.occupant !== null;
  }
}

export class Grid {
  constructor(width, height, defaultFloor = 'concrete') {
    this.width = width;
    this.height = height;
    this.tiles = new Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        this.tiles[y * width + x] = new Tile(x, y, defaultFloor);
      }
    }
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  getTile(x, y) {
    if (!this.inBounds(x, y)) return null;
    return this.tiles[y * this.width + x];
  }

  setFloor(x, y, floorType) {
    const tile = this.getTile(x, y);
    if (tile) tile.floorType = floorType;
  }

  setConveyor(x, y, conveyorId) {
    const tile = this.getTile(x, y);
    if (tile) tile.conveyor = conveyorId;
  }

  clearConveyor(x, y) {
    const tile = this.getTile(x, y);
    if (tile) tile.conveyor = null;
  }

  setMachine(x, y, machineId) {
    const tile = this.getTile(x, y);
    if (tile) tile.machine = machineId;
  }

  clearMachine(x, y) {
    const tile = this.getTile(x, y);
    if (tile) tile.machine = null;
  }

  isFootprintFree(x, y, footprint) {
    const [fw, fh] = footprint;
    for (let dy = 0; dy < fh; dy++) {
      for (let dx = 0; dx < fw; dx++) {
        const tile = this.getTile(x + dx, y + dy);
        if (!tile || tile.occupied) return false;
      }
    }
    return true;
  }

  setOccupant(x, y, footprint, occupantId) {
    const [fw, fh] = footprint;
    for (let dy = 0; dy < fh; dy++) {
      for (let dx = 0; dx < fw; dx++) {
        const tile = this.getTile(x + dx, y + dy);
        if (tile) tile.occupant = occupantId;
      }
    }
  }

  clearOccupant(x, y, footprint) {
    const [fw, fh] = footprint;
    for (let dy = 0; dy < fh; dy++) {
      for (let dx = 0; dx < fw; dx++) {
        const tile = this.getTile(x + dx, y + dy);
        if (tile) tile.occupant = null;
      }
    }
  }

  static fromFactoryData(data) {
    const { width, height } = data.metadata.dimensions;
    const grid = new Grid(width, height, data.metadata.defaultFloor || 'concrete');
    if (Array.isArray(data.tiles)) {
      for (const entry of data.tiles) {
        grid.setFloor(entry.x, entry.y, entry.floorType);
      }
    }
    return grid;
  }
}
