// Shield node protective geometry: straight barrier walls or circular rings
// anchored to a shieldNode component's life/enable state.
let shieldSerial = 1;

export class ShieldBarrier {
  constructor(def, connectionGraph) {
    this.id = def.id || `shield_${shieldSerial++}`;
    this.nodeId = def.nodeId;
    this.shape = def.shape || 'wall'; // 'wall' | 'ring'
    this.x1 = def.x1;
    this.y1 = def.y1;
    this.x2 = def.x2;
    this.y2 = def.y2;
    this.cx = def.cx;
    this.cy = def.cy;
    this.radius = def.radius;
    this.thickness = def.thickness ?? 6;
    this.suppressedTimer = 0;
    this.connectionGraph = connectionGraph;
  }

  node() {
    return this.connectionGraph.get(this.nodeId);
  }

  isActive() {
    const node = this.node();
    if (node && (node.destroyed || node.disabledByConduit)) return false;
    if (this.suppressedTimer > 0) return false;
    return true;
  }

  suppress(duration) {
    this.suppressedTimer = Math.max(this.suppressedTimer, duration);
  }

  update(dt) {
    this.suppressedTimer = Math.max(0, this.suppressedTimer - dt);
  }
}

export class ShieldSystem {
  constructor(defs, connectionGraph) {
    this.barriers = defs.map((d) => new ShieldBarrier(d, connectionGraph));
  }

  update(dt) {
    for (const b of this.barriers) b.update(dt);
  }

  activeBarriers() {
    return this.barriers.filter((b) => b.isActive());
  }

  suppressAll(duration) {
    for (const b of this.barriers) b.suppress(duration);
  }
}
