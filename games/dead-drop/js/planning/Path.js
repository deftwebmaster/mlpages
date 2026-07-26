import { DIRECTIONS, deltaToDirection } from '../utils/constants.js';
import { isPassable } from '../board/Board.js';

export function isAdjacent(a, b) {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return dx + dy === 1;
}

export function directionBetween(a, b) {
  return deltaToDirection(b.x - a.x, b.y - a.y);
}

// Breadth-first shortest path (in cardinal moves) from start to target against
// a fixed door-state snapshot. Used for tap-to-move convenience — not planning
// mode, which instead builds its path incrementally against a simulated chain.
export function bfsShortestPath(level, doorStates, start, target) {
  if (start.x === target.x && start.y === target.y) return [];
  const visited = new Set([`${start.x},${start.y}`]);
  const queue = [{ x: start.x, y: start.y, path: [] }];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    for (const dir of Object.keys(DIRECTIONS)) {
      const { x: dx, y: dy } = DIRECTIONS[dir];
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      if (!isPassable(level, level.doorLookup, doorStates, nx, ny)) continue;
      const path = [...cur.path, dir];
      if (nx === target.x && ny === target.y) return path;
      visited.add(key);
      queue.push({ x: nx, y: ny, path });
    }
  }
  return null;
}
