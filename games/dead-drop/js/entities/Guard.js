import { deltaToDirection } from '../utils/constants.js';

// Advances one guard by exactly one route step, in place, per the turn engine.
// Deterministic: no randomness, purely a function of current route position/direction/pause state.
export function advanceGuard(guard, guardDef) {
  const route = guardDef.route;

  if (guard.pauseTimer > 0) {
    guard.pauseTimer -= 1;
    return guard;
  }

  if (route.length <= 1) return guard; // stationary guard, nothing to step

  let nextIndex = guard.routeIndex + guard.routeDirection;

  if (guardDef.patrolMode === 'loop') {
    nextIndex = ((nextIndex % route.length) + route.length) % route.length;
  } else {
    // pingpong: bounce direction at either end of the route
    if (nextIndex < 0 || nextIndex >= route.length) {
      guard.routeDirection *= -1;
      nextIndex = guard.routeIndex + guard.routeDirection;
    }
  }

  const [fromX, fromY] = route[guard.routeIndex];
  const [toX, toY] = route[nextIndex];
  const dir = deltaToDirection(toX - fromX, toY - fromY);
  if (dir) guard.facing = dir;

  guard.x = toX;
  guard.y = toY;
  guard.routeIndex = nextIndex;

  const pause = guardDef.waypointPauses[String(nextIndex)];
  if (pause) guard.pauseTimer = pause;

  return guard;
}
