// Small math / helper utilities shared across engine modules.

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function approach(current, target, maxDelta) {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
}

export function degToRad(d) {
  return (d * Math.PI) / 180;
}

export function radToDeg(r) {
  return (r * 180) / Math.PI;
}

export function vecLen(x, y) {
  return Math.sqrt(x * x + y * y);
}

export function vecNormalize(x, y) {
  const len = vecLen(x, y) || 1;
  return [x / len, y / len];
}

export function reflect(vx, vy, nx, ny) {
  const dot = vx * nx + vy * ny;
  return [vx - 2 * dot * nx, vy - 2 * dot * ny];
}

let idCounter = 1;
export function nextId(prefix = 'id') {
  return `${prefix}_${idCounter++}`;
}

export function circleRectClosestPoint(cx, cy, rx, ry, rw, rh) {
  const px = clamp(cx, rx, rx + rw);
  const py = clamp(cy, ry, ry + rh);
  return [px, py];
}

export function circleIntersectsRect(cx, cy, radius, rx, ry, rw, rh) {
  const [px, py] = circleRectClosestPoint(cx, cy, rx, ry, rw, rh);
  const dx = cx - px;
  const dy = cy - py;
  return dx * dx + dy * dy <= radius * radius;
}

export function circleIntersectsCircle(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const rr = r1 + r2;
  return dx * dx + dy * dy <= rr * rr;
}

// Rotate point around origin by angle (radians)
export function rotatePoint(x, y, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [x * c - y * s, x * s + y * c];
}

export function randRangeDeterministic(seedVal, min, max) {
  // Deterministic pseudo-random based on seed, used only for stable cosmetic variation
  const x = Math.sin(seedVal * 12.9898) * 43758.5453;
  const frac = x - Math.floor(x);
  return min + frac * (max - min);
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export class EventBus {
  constructor() {
    this.listeners = new Map();
  }
  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return () => this.off(event, fn);
  }
  off(event, fn) {
    this.listeners.get(event)?.delete(fn);
  }
  emit(event, payload) {
    this.listeners.get(event)?.forEach((fn) => fn(payload));
  }
}

export class ObjectPool {
  constructor(factory, reset, initialSize = 0) {
    this.factory = factory;
    this.reset = reset;
    this.free = [];
    for (let i = 0; i < initialSize; i++) this.free.push(factory());
  }
  acquire() {
    const obj = this.free.pop() || this.factory();
    return obj;
  }
  release(obj) {
    this.reset(obj);
    this.free.push(obj);
  }
}
