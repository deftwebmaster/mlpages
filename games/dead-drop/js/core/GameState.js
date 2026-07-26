import { GAME_STATUS } from '../utils/constants.js';

export function createInitialState(level) {
  const guards = level.guards.map((g) => {
    const [sx, sy] = g.start;
    const foundIndex = g.route.findIndex(([rx, ry]) => rx === sx && ry === sy);
    return {
      id: g.id,
      x: sx,
      y: sy,
      facing: g.facing,
      routeIndex: foundIndex === -1 ? 0 : foundIndex,
      routeDirection: 1,
      pauseTimer: 0,
    };
  });

  const cameras = level.cameras.map((c) => ({
    id: c.id,
    x: c.pos[0],
    y: c.pos[1],
    sequenceIndex: c.startIndex % c.sequence.length,
    pauseTimer: 0,
    sweepDirection: 1,
  }));

  const doors = {};
  for (const d of level.doors) {
    doors[d.id] = { open: !!d.startOpen, locked: !!d.locked, pos: d.pos };
  }

  const keycardsCollected = {};
  for (const k of level.keycards) keycardsCollected[k.id] = false;

  return {
    levelId: level.id,
    width: level.width,
    height: level.height,
    player: { x: level.spawn.x, y: level.spawn.y, facing: 'S' },
    guards,
    cameras,
    doors,
    keycardsCollected,
    packageCollected: !level.package,
    exitActive: !level.package,
    moveCount: 0,
    status: GAME_STATUS.PLAYING,
    detectionReason: null,
  };
}
