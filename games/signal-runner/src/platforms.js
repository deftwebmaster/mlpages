/**
 * platforms.js — Data platform and relay lanes.
 *
 * Platform lanes are *void* rows: there is no ground, only moving bars. The
 * player survives a void row only while a compatible platform is beneath them,
 * and support is a continuous relationship re-evaluated every frame rather
 * than a one-off collision event.
 *
 * A relay lane is a platform lane whose bars flip frequency on a timer, so the
 * player has to switch polarity mid-ride to keep their footing.
 */

import { mod } from './utils.js';
import { OPPOSITE_POLARITY } from './config.js';
import {
  slotCount,
  slotX,
  objectSizeAt,
  objectPolarityAt,
  supportForFor,
} from './laneObjects.js';

/** True for lanes with no floor — falling is possible here. */
export function isVoidLane(lane) {
  return lane.type === 'platform' || lane.type === 'relay';
}

/**
 * A void lane only swallows the player inside its declared span. Half-width
 * platform lanes therefore read as "the floor stops here", with solid ground
 * either side.
 */
export function isOverVoid(lane, cols, centerX) {
  const from = lane.from ?? 0;
  const to = lane.to ?? cols;
  return centerX >= from && centerX <= to;
}

export function buildPlatformShapes(lane, t, cols, push) {
  const n = slotCount(lane, cols);
  for (let i = 0; i < n; i++) {
    const shape = push();
    const polarity = objectPolarityAt(lane, i);
    shape.kind = 'platform';
    shape.index = i;
    shape.x = slotX(lane, i, t, cols);
    shape.w = objectSizeAt(lane, i);
    shape.polarity = polarity;
    shape.hostileTo = 'none';
    shape.supportFor = supportForFor(polarity);
    shape.blocksFor = 'none';
    shape.state = 'active';
    shape.intensity = 1;
    shape.direction = lane.direction ?? 1;
  }
}

/**
 * Relay platforms alternate between the two frequencies. Each bar is offset by
 * one step in the cycle so the lane always presents both colours somewhere —
 * that keeps a mis-timed switch survivable instead of instantly fatal.
 */
export function buildRelayShapes(lane, t, cols, push) {
  const n = slotCount(lane, cols);
  const cycle = lane.cycle ?? 2.4;
  const base = lane.polarity ?? 'cyan';
  const stagger = lane.stagger ?? 1;
  for (let i = 0; i < n; i++) {
    const step = Math.floor(t / cycle + (lane.phase ?? 0));
    const flipped = mod(step + i * stagger, 2) === 1;
    const polarity = flipped ? OPPOSITE_POLARITY[base] : base;
    // How far through the current cycle this bar is — the renderer uses it to
    // flash a warning shortly before the bar changes frequency.
    const progress = mod(t / cycle + (lane.phase ?? 0), 1);

    const shape = push();
    shape.kind = 'relay';
    shape.index = i;
    shape.x = slotX(lane, i, t, cols);
    shape.w = objectSizeAt(lane, i);
    shape.polarity = polarity;
    shape.hostileTo = 'none';
    shape.supportFor = polarity;
    shape.blocksFor = 'none';
    shape.state = progress > 0.78 ? 'charging' : 'active';
    shape.intensity = progress;
    shape.direction = lane.direction ?? 1;
  }
}

/**
 * Resolve which platform (if any) is holding the player up.
 *
 * Uses the player's centre point with a small grace margin rather than a full
 * circle overlap: standing with a toe on the edge should hold, but the rule
 * still has to read as "am I over this bar or not".
 */
export function findSupport(shapes, centerX, polarity, grace) {
  let best = null;
  let bestDepth = -Infinity;
  for (let i = 0; i < shapes.length; i++) {
    const s = shapes[i];
    if (s.supportFor === 'none') continue;
    const left = s.x - grace;
    const right = s.x + s.w + grace;
    if (centerX < left || centerX > right) continue;
    const compatible = s.supportFor === 'both' || s.supportFor === polarity;
    if (!compatible) continue;
    // Prefer the bar the player is most solidly over, so overlapping bars in
    // adjacent slots hand off cleanly instead of flickering.
    const depth = Math.min(centerX - left, right - centerX);
    if (depth > bestDepth) {
      bestDepth = depth;
      best = s;
    }
  }
  return best;
}

/**
 * A platform the player is standing on but which no longer matches their
 * frequency — used purely for feedback ("that bar just phased out from under
 * you") before the fall is resolved.
 */
export function findIncompatibleSupport(shapes, centerX, polarity, grace) {
  for (let i = 0; i < shapes.length; i++) {
    const s = shapes[i];
    if (s.supportFor === 'none' || s.supportFor === 'both') continue;
    if (s.supportFor === polarity) continue;
    if (centerX >= s.x - grace && centerX <= s.x + s.w + grace) return s;
  }
  return null;
}
