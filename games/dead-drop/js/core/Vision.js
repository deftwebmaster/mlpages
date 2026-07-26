// Deterministic vision-cone computation shared by guards and cameras.
// Produces the set of tiles currently illuminated by an entity, used both for
// detection checks and for rendering the always-visible cone overlay.

import { DIRECTIONS, DEFAULT_VISION_ANGLE, DEFAULT_VISION_RANGE } from '../utils/constants.js';
import { blocksVision } from '../board/Board.js';
import { dirToAngleDeg } from '../utils/helpers.js';

function bresenhamLine(x0, y0, x1, y1) {
  const cells = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;
  while (true) {
    cells.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
  return cells;
}

// Returns a Set of "x,y" keys visible from (originX, originY) facing `facing`.
export function computeCone(originX, originY, facing, angle, range, level, doorStates) {
  const visible = new Set();
  const fVec = DIRECTIONS[facing];
  if (!fVec) return visible;
  const halfAngle = angle / 2;
  const facingDeg = dirToAngleDeg(fVec.x, fVec.y);

  const minX = Math.max(0, originX - range);
  const maxX = Math.min(level.width - 1, originX + range);
  const minY = Math.max(0, originY - range);
  const maxY = Math.min(level.height - 1, originY + range);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (x === originX && y === originY) continue;
      const dx = x - originX;
      const dy = y - originY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > range + 0.001) continue;

      const targetDeg = dirToAngleDeg(dx, dy);
      let diff = Math.abs(targetDeg - facingDeg) % 360;
      if (diff > 180) diff = 360 - diff;
      if (diff > halfAngle + 0.001) continue;

      const line = bresenhamLine(originX, originY, x, y);
      let blocked = false;
      for (let i = 1; i < line.length; i++) {
        const [cx, cy] = line[i];
        if (blocksVision(level, level.doorLookup, doorStates, cx, cy)) {
          blocked = true;
          break;
        }
      }
      if (!blocked) visible.add(`${x},${y}`);
    }
  }
  return visible;
}

export function computeGuardCone(guard, guardDef, level, doorStates) {
  const angle = guardDef.visionAngle ?? DEFAULT_VISION_ANGLE;
  const range = guardDef.visionRange ?? DEFAULT_VISION_RANGE;
  return computeCone(guard.x, guard.y, guard.facing, angle, range, level, doorStates);
}

export function computeCameraCone(camera, cameraLevelDef, level, doorStates) {
  const facing = cameraLevelDef.sequence[camera.sequenceIndex % cameraLevelDef.sequence.length];
  const angle = cameraLevelDef.visionAngle ?? DEFAULT_VISION_ANGLE;
  const range = cameraLevelDef.visionRange ?? DEFAULT_VISION_RANGE;
  return computeCone(camera.x, camera.y, facing, angle, range, level, doorStates);
}
