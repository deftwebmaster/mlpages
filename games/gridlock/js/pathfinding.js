/**
 * pathfinding.js — Grid navigation for the drones.
 *
 * The mazes are tiny (21×21 = 441 cells) and change shape at runtime, so a
 * full breadth-first *distance field* is both simpler and faster than A* with
 * a live-updating heap: one BFS costs a few hundred integer operations and
 * yields the exact distance from a goal to every reachable tile at once.
 *
 * Drones then steer by simple gradient descent on that field, which keeps
 * movement stable when the maze shifts underneath them — a stale field only
 * ever causes one slightly-wrong step, never a crash or an invalid move.
 *
 * All scratch buffers are pooled and reused; a running game allocates nothing
 * per frame here.
 */

import { DIR_VEC, isWalkable } from './config.js';

export const UNREACHABLE = 0x7fff;

/**
 * A reusable BFS workspace bound to one maze size.
 */
export class FlowField {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.dist = new Int16Array(width * height);
    this.queue = new Int32Array(width * height);
    /** Bumped whenever the field is recomputed; lets callers detect staleness. */
    this.stamp = 0;
    /** Maze version this field was built against. */
    this.mazeVersion = -1;
    this.goal = -1;
  }

  /**
   * Floods outward from `goalIndex` across walkable tiles.
   * @param {Uint8Array} grid tile ids
   * @param {number} goalIndex y * width + x
   * @param {number} mazeVersion maze mutation counter, stored for staleness checks
   */
  compute(grid, goalIndex, mazeVersion) {
    const { dist, queue, width, height } = this;
    dist.fill(UNREACHABLE);
    this.goal = goalIndex;
    this.mazeVersion = mazeVersion;
    this.stamp++;

    if (goalIndex < 0 || goalIndex >= grid.length || !isWalkable(grid[goalIndex])) {
      // A goal inside a wall (possible right after a shift): flood from nothing.
      return this;
    }

    let head = 0;
    let tail = 0;
    queue[tail++] = goalIndex;
    dist[goalIndex] = 0;

    while (head < tail) {
      const cur = queue[head++];
      const cd = dist[cur] + 1;
      const cx = cur % width;
      const cy = (cur / width) | 0;

      for (let d = 0; d < 4; d++) {
        const nx = cx + DIR_VEC[d].x;
        const ny = cy + DIR_VEC[d].y;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const ni = ny * width + nx;
        if (dist[ni] !== UNREACHABLE) continue;
        if (!isWalkable(grid[ni])) continue;
        dist[ni] = cd;
        queue[tail++] = ni;
      }
    }
    return this;
  }

  at(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return UNREACHABLE;
    return this.dist[y * this.width + x];
  }

  reachable(x, y) {
    return this.at(x, y) !== UNREACHABLE;
  }
}

/**
 * Chooses the best of the legal directions out of a tile.
 *
 * @param {Uint8Array} grid
 * @param {number} width
 * @param {number} height
 * @param {number} x tile x
 * @param {number} y tile y
 * @param {number} banned a direction to avoid (usually the reverse), or -1
 * @param {(nx:number, ny:number, dir:number) => number} score lower is better
 * @param {number[]} order direction indices, shuffled by the caller for ties
 * @returns {number} chosen direction, or -1 when boxed in
 */
export function chooseDirection(grid, width, height, x, y, banned, score, order) {
  let best = -1;
  let bestScore = Infinity;
  let fallback = -1;
  let fallbackScore = Infinity;

  for (let i = 0; i < order.length; i++) {
    const d = order[i];
    const nx = x + DIR_VEC[d].x;
    const ny = y + DIR_VEC[d].y;
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    if (!isWalkable(grid[ny * width + nx])) continue;
    const s = score(nx, ny, d);
    if (d === banned) {
      // Reversing is a last resort — kept only in case it is the sole exit.
      if (s < fallbackScore) {
        fallbackScore = s;
        fallback = d;
      }
      continue;
    }
    if (s < bestScore) {
      bestScore = s;
      best = d;
    }
  }
  return best !== -1 ? best : fallback;
}

/**
 * Counts walkable neighbours — used to detect junctions and dead ends.
 */
export function exitCount(grid, width, height, x, y) {
  let n = 0;
  for (let d = 0; d < 4; d++) {
    const nx = x + DIR_VEC[d].x;
    const ny = y + DIR_VEC[d].y;
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    if (isWalkable(grid[ny * width + nx])) n++;
  }
  return n;
}

/**
 * Flood fill returning the set of tiles reachable from `startIndex`.
 * Used by the Grid Shift validator (and the offline level linter) to prove a
 * maze is still completable.
 *
 * @returns {Uint8Array} 1 for reachable tiles
 */
export function reachableSet(grid, width, height, startIndex, out) {
  const visited = out && out.length === grid.length ? out : new Uint8Array(grid.length);
  visited.fill(0);
  if (startIndex < 0 || !isWalkable(grid[startIndex])) return visited;

  const queue = new Int32Array(grid.length);
  let head = 0;
  let tail = 0;
  queue[tail++] = startIndex;
  visited[startIndex] = 1;

  while (head < tail) {
    const cur = queue[head++];
    const cx = cur % width;
    const cy = (cur / width) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = cx + DIR_VEC[d].x;
      const ny = cy + DIR_VEC[d].y;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const ni = ny * width + nx;
      if (visited[ni] || !isWalkable(grid[ni])) continue;
      visited[ni] = 1;
      queue[tail++] = ni;
    }
  }
  return visited;
}

/**
 * Nearest walkable tile to (x, y), searched in rings. Used to rescue entities
 * that a maze rotation would otherwise leave embedded in a wall.
 * @returns {{x:number,y:number}|null}
 */
export function nearestWalkable(grid, width, height, x, y, maxRadius = 6) {
  if (x >= 0 && y >= 0 && x < width && y < height && isWalkable(grid[y * width + x])) {
    return { x, y };
  }
  for (let r = 1; r <= maxRadius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        if (isWalkable(grid[ny * width + nx])) return { x: nx, y: ny };
      }
    }
  }
  return null;
}
