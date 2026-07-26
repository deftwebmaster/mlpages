/**
 * Collision resolution.
 *
 * Depth tests are swept: an entity's z range for the frame is the union of
 * where it was and where it is, so nothing can tunnel past the craft at high
 * speed. Lateral tests use the forgiving spans from obstacles.js.
 *
 * The result object is reused every frame, and events are reported in the
 * priority order the design calls for: lethal, then damage, then pickups, then
 * near misses.
 */

import { COLLECTIBLE, NEARMISS, STABILITY } from './config.js';
import { T, DAMAGING } from './obstacles.js';

const spansA = [];
const spansB = [];

export class CollisionResult {
  constructor() {
    this.collected = [];
    this.nearMisses = [];
    this.calibrations = [];
    this.reset();
  }

  reset() {
    this.lethal = null;
    this.lethalType = '';
    this.damage = 0;
    this.damageSource = null;
    this.inCorruption = false;
    this.corruptionCount = 0;
    this.collected.length = 0;
    this.nearMisses.length = 0;
    this.calibrations.length = 0;
    this.phasePasses = 0;
  }
}

/** Overlap between the craft's depth slot and an entity's swept depth range. */
function sweptOverlap(near, far, prevFar, halfDepth) {
  return near <= halfDepth && Math.max(far, prevFar) >= -halfDepth;
}

export class CollisionSystem {
  constructor() {
    this.result = new CollisionResult();
  }

  /**
   * @param world  World
   * @param player Player
   * @param dt     seconds
   * @param invuln remaining damage-immunity time
   */
  resolve(world, player, dt, invuln) {
    const res = this.result;
    res.reset();

    const px = player.x;
    const pr = player.radius;
    const hd = player.halfDepth;
    const phased = player.phased;

    for (const { h, c } of world.allHazards()) {
      const near = h.z;
      const far = h.zFar;
      const prevFar = h.prevZ + h.depth;

      // Corruption is a volume, not a surface.
      if (h.type === T.CORRUPTION) {
        if (near <= hd && far >= -hd && Math.abs(px - h.x) <= h.halfW + pr * 0.5) {
          res.inCorruption = true;
          res.corruptionCount++;
          c.corrupted = true;
        }
        continue;
      }

      const inDepth = sweptOverlap(near, far, prevFar, hd);
      const spans = h.blockedSpans(spansA);

      if (inDepth) {
        if (h.isPhaseable) {
          if (phased) {
            if (!h.passed) {
              h.passed = true;
              res.phasePasses++;
            }
          } else if (!h.hit && this._overlapsSpans(spans, px, pr)) {
            h.hit = true;
            if (invuln <= 0 && DAMAGING.has(h.type)) {
              res.damage += STABILITY.minorCollision;
              res.damageSource = h;
              c.damaged = true;
            }
          }
        } else if (this._overlapsSpans(spans, px, pr)) {
          if (!res.lethal) {
            res.lethal = h;
            res.lethalType = h.type;
          }
        } else if (h.type === T.MINE && !h.hit) {
          // Outside the lethal core but inside the blast ring.
          const graze = h.grazeSpan(spansB);
          if (this._overlapsSpans(graze, px, pr)) {
            h.hit = true;
            if (invuln <= 0) {
              res.damage += STABILITY.mineGraze;
              res.damageSource = h;
              c.damaged = true;
            }
          }
        }
      }

      // Pass events, evaluated as the hazard's midpoint crosses the craft.
      const mid = h.z + h.depth * 0.5;
      const prevMid = h.prevZ + h.depth * 0.5;
      if (prevMid > 0 && mid <= 0 && !h.scored) {
        h.scored = true;
        if (h.type === T.CALIBRATION) {
          if (!res.lethal || res.lethal !== h) {
            const gapClear = Math.abs(px - h.x) <= h.gap - pr * 0.5;
            if (gapClear) res.calibrations.push(h);
          }
        }
        if (h.isLethal && h.type !== T.CALIBRATION && !h.nearMissDone) {
          const clearance = h.clearanceTo(px, h.blockedSpans(spansA));
          if (clearance > 0 && clearance - pr <= NEARMISS.band && clearance - pr > -0.001) {
            h.nearMissDone = true;
            res.nearMisses.push(h);
          }
        }
      }
    }

    this._pickups(world, player, dt, res);
    return res;
  }

  _overlapsSpans(spans, px, pr) {
    for (let i = 0; i < spans.length; i++) {
      if (px + pr > spans[i][0] && px - pr < spans[i][1]) return true;
    }
    return false;
  }

  _pickups(world, player, dt, res) {
    const px = player.x;
    for (const { p, c } of world.allPickups()) {
      // Gentle magnetism makes collection feel generous without being automatic.
      if (p.z > -4 && p.z < 26) {
        const dx = px - p.x;
        if (Math.abs(dx) < COLLECTIBLE.magnet) {
          p.x += dx * Math.min(1, COLLECTIBLE.magnetStrength * dt);
        }
      }
      const inDepth = p.z <= COLLECTIBLE.halfDepth && p.prevZ >= -COLLECTIBLE.halfDepth;
      if (!inDepth) continue;
      if (Math.abs(px - p.x) <= COLLECTIBLE.radius + player.radius) {
        p.collected = true;
        p.active = false;
        res.collected.push(p);
        if (p.type === 'fragment') c.fragTaken++;
      } else if (p.z < -COLLECTIBLE.halfDepth) {
        p.missed = true;
      }
    }
  }
}
