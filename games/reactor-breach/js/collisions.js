import { circleRectClosestPoint, clamp } from './utils.js';

// Narrow-phase collision tests. All return null or a hit descriptor:
// { nx, ny, px, py, penetration }

export function circleVsAabb(cx, cy, radius, rx, ry, rw, rh) {
  const [px, py] = circleRectClosestPoint(cx, cy, rx, ry, rw, rh);
  const dx = cx - px;
  const dy = cy - py;
  const distSq = dx * dx + dy * dy;
  if (distSq > radius * radius) return null;
  const dist = Math.sqrt(distSq);
  let nx, ny;
  if (dist === 0) {
    // Center inside rect: push out along smallest axis.
    const left = cx - rx;
    const right = rx + rw - cx;
    const top = cy - ry;
    const bottom = ry + rh - cy;
    const min = Math.min(left, right, top, bottom);
    if (min === left) { nx = -1; ny = 0; }
    else if (min === right) { nx = 1; ny = 0; }
    else if (min === top) { nx = 0; ny = -1; }
    else { nx = 0; ny = 1; }
  } else {
    nx = dx / dist;
    ny = dy / dist;
  }
  return { nx, ny, px, py, penetration: radius - dist };
}

export function circleVsCircle(x1, y1, r1, x2, y2, r2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > r1 + r2) return null;
  const nx = dist === 0 ? 0 : dx / dist;
  const ny = dist === 0 ? -1 : dy / dist;
  return { nx, ny, penetration: r1 + r2 - dist };
}

// Capsule = line segment (x1,y1)-(x2,y2) with radius rr.
export function circleVsCapsule(cx, cy, radius, x1, y1, x2, y2, rr) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy || 1;
  let t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
  t = clamp(t, 0, 1);
  const px = x1 + dx * t;
  const py = y1 + dy * t;
  const ddx = cx - px;
  const ddy = cy - py;
  const dist = Math.sqrt(ddx * ddx + ddy * ddy);
  const combined = radius + rr;
  if (dist > combined) return null;
  const nx = dist === 0 ? 0 : ddx / dist;
  const ny = dist === 0 ? -1 : ddy / dist;
  return { nx, ny, px, py, penetration: combined - dist };
}

export function pointInRotatedRect(px, py, cx, cy, w, h, rotation) {
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const dx = px - cx;
  const dy = py - cy;
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  return Math.abs(localX) <= w / 2 && Math.abs(localY) <= h / 2;
}

// Circle vs rotated rect: transform circle into rect local space, test vs AABB, transform normal back.
export function circleVsRotatedRect(cx, cy, radius, rectCx, rectCy, w, h, rotation) {
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const dx = cx - rectCx;
  const dy = cy - rectCy;
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  const hit = circleVsAabb(localX, localY, radius, -w / 2, -h / 2, w, h);
  if (!hit) return null;
  const cosF = Math.cos(rotation);
  const sinF = Math.sin(rotation);
  const nx = hit.nx * cosF - hit.ny * sinF;
  const ny = hit.nx * sinF + hit.ny * cosF;
  return { nx, ny, penetration: hit.penetration };
}
