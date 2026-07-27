import { wrapDelta } from './utils.js';

// Wrap-aware spatial hash grid. Cell indices wrap modulo cols/rows so objects near
// the world seam still land in adjacent buckets and get checked against each other.
export class SpatialGrid {
  constructor(cellSize, worldW, worldH) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(worldW / cellSize);
    this.rows = Math.ceil(worldH / cellSize);
    this.buckets = new Map();
  }

  _key(cx, cy) {
    cx = ((cx % this.cols) + this.cols) % this.cols;
    cy = ((cy % this.rows) + this.rows) % this.rows;
    return cy * this.cols + cx;
  }

  clear() {
    this.buckets.clear();
  }

  insert(entity) {
    const cx = Math.floor(entity.x / this.cellSize);
    const cy = Math.floor(entity.y / this.cellSize);
    const k = this._key(cx, cy);
    let arr = this.buckets.get(k);
    if (!arr) { arr = []; this.buckets.set(k, arr); }
    arr.push(entity);
  }

  buildFrom(list) {
    this.clear();
    for (const e of list) this.insert(e);
  }

  // Calls cb(other) for every entity in the 3x3 neighborhood around (x,y).
  forNear(x, y, cb) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const k = this._key(cx + dx, cy + dy);
        const arr = this.buckets.get(k);
        if (!arr) continue;
        for (const e of arr) cb(e);
      }
    }
  }
}

export function circleOverlap(a, b, worldW, worldH) {
  const dx = wrapDelta(a.x, b.x, worldW);
  const dy = wrapDelta(a.y, b.y, worldH);
  const rr = (a.radius + b.radius);
  return (dx * dx + dy * dy) < rr * rr;
}

export function wrappedDistance(a, b, worldW, worldH) {
  const dx = wrapDelta(a.x, b.x, worldW);
  const dy = wrapDelta(a.y, b.y, worldH);
  return Math.hypot(dx, dy);
}

export function wrappedNormal(a, b, worldW, worldH) {
  const dx = wrapDelta(b.x, a.x, worldW);
  const dy = wrapDelta(b.y, a.y, worldH);
  const d = Math.hypot(dx, dy) || 1;
  return { nx: dx / d, ny: dy / d, dist: d };
}
