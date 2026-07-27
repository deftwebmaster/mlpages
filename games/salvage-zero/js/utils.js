export function wrapValue(v, size) {
  v = v % size;
  if (v < 0) v += size;
  return v;
}

// Shortest signed delta between a and b on a torus of given size (a - b wrapped to [-size/2, size/2])
export function wrapDelta(a, b, size) {
  let d = (a - b) % size;
  if (d > size / 2) d -= size;
  if (d < -size / 2) d += size;
  return d;
}

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function angleDiff(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function randRange(min, max) {
  return min + Math.random() * (max - min);
}

export function randInt(min, max) {
  return Math.floor(randRange(min, max + 1));
}

export function choice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function dist2(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  return dx * dx + dy * dy;
}

let uidCounter = 1;
export function nextId() {
  return uidCounter++;
}

// Simple object pool: avoids per-frame allocation for projectiles/particles.
export class Pool {
  constructor(factory, reset, initialSize = 64) {
    this.factory = factory;
    this.reset = reset;
    this.free = [];
    this.active = [];
    for (let i = 0; i < initialSize; i++) this.free.push(factory());
  }

  spawn(...args) {
    const obj = this.free.pop() || this.factory();
    this.reset(obj, ...args);
    obj.__alive = true;
    this.active.push(obj);
    return obj;
  }

  update(updateFn) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const obj = this.active[i];
      const keep = updateFn(obj);
      if (!keep) {
        obj.__alive = false;
        this.active.splice(i, 1);
        this.free.push(obj);
      }
    }
  }

  clear() {
    for (const o of this.active) { o.__alive = false; this.free.push(o); }
    this.active.length = 0;
  }
}

export function formatTime(sec) {
  sec = Math.max(0, sec);
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
