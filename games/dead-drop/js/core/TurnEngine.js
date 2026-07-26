// The single source of truth for turn resolution. Used identically by real
// gameplay and by Planning Mode's forward simulation — same function, same
// rules, no divergence possible between "what will happen" and "what happens".

import { deepClone } from '../utils/helpers.js';
import { DIRECTIONS, GAME_STATUS, EVENT } from '../utils/constants.js';
import { isPassable } from '../board/Board.js';
import { advanceGuard } from '../entities/Guard.js';
import { advanceCamera } from '../entities/Camera.js';
import { computeGuardCone, computeCameraCone } from './Vision.js';

export function simulateTurn(state, level, moveDir) {
  const delta = DIRECTIONS[moveDir];
  if (!delta) return { valid: false, state, events: [] };

  const targetX = state.player.x + delta.x;
  const targetY = state.player.y + delta.y;

  if (!isPassable(level, level.doorLookup, state.doors, targetX, targetY)) {
    return { valid: false, state, events: [{ type: EVENT.BLOCKED }] };
  }

  const newState = deepClone(state);
  const events = [];

  // 2. Commit player move.
  newState.player.x = targetX;
  newState.player.y = targetY;
  newState.player.facing = moveDir;
  newState.moveCount += 1;
  events.push({ type: EVENT.MOVE, x: targetX, y: targetY });

  // 3. Advance each guard one route step.
  for (const guard of newState.guards) {
    advanceGuard(guard, level.guardDefsById[guard.id]);
  }

  // 4. Advance each camera one rotation step.
  for (const camera of newState.cameras) {
    const beforeIndex = camera.sequenceIndex;
    advanceCamera(camera, level.cameraDefsById[camera.id]);
    if (camera.sequenceIndex !== beforeIndex) {
      events.push({ type: 'cameraRotate', cameraId: camera.id });
    }
  }

  // 5. Resolve switches (player steps onto a switch tile toggles its linked doors).
  for (const sw of level.switches) {
    if (sw.pos[0] === newState.player.x && sw.pos[1] === newState.player.y) {
      for (const doorId of sw.linkedDoorIds) {
        const door = newState.doors[doorId];
        if (!door) continue;
        door.open = !door.open;
        events.push({ type: door.open ? EVENT.DOOR_OPEN : EVENT.DOOR_CLOSE, doorId });
      }
    }
  }

  // Keycards: walking onto one unlocks (and opens) its matching door(s).
  for (const kc of level.keycards) {
    if (newState.keycardsCollected[kc.id]) continue;
    if (kc.pos[0] === newState.player.x && kc.pos[1] === newState.player.y) {
      newState.keycardsCollected[kc.id] = true;
      for (const doorId of kc.matchesDoorIds) {
        const door = newState.doors[doorId];
        if (!door) continue;
        door.locked = false;
        door.open = true;
        events.push({ type: EVENT.DOOR_OPEN, doorId });
      }
      events.push({ type: 'keycard', keycardId: kc.id });
    }
  }

  // 6. Detection check against the final post-toggle board.
  const detection = checkDetection(newState, level);
  if (detection) {
    newState.status = GAME_STATUS.FAILED;
    newState.detectionReason = detection;
    events.push({ type: EVENT.DETECTED, reason: detection });
    return { valid: true, state: newState, events };
  }

  // 7. Package pickup.
  if (level.package && !newState.packageCollected &&
      newState.player.x === level.package.pos[0] && newState.player.y === level.package.pos[1]) {
    newState.packageCollected = true;
    newState.exitActive = true;
    events.push({ type: EVENT.COLLECTED });
  }

  // 8. Exit check.
  if (level.extraction && newState.exitActive &&
      newState.player.x === level.extraction.pos[0] && newState.player.y === level.extraction.pos[1]) {
    newState.status = GAME_STATUS.COMPLETE;
    events.push({ type: EVENT.COMPLETE });
  }

  return { valid: true, state: newState, events };
}

function checkDetection(state, level) {
  const px = state.player.x;
  const py = state.player.y;

  for (const guard of state.guards) {
    if (guard.x === px && guard.y === py) return { type: 'contact', id: guard.id };
  }
  for (const guard of state.guards) {
    const cone = computeGuardCone(guard, level.guardDefsById[guard.id], level, state.doors);
    if (cone.has(`${px},${py}`)) return { type: 'guard', id: guard.id };
  }
  for (const camera of state.cameras) {
    const camDef = level.cameraDefsById[camera.id];
    const cone = computeCameraCone(camera, camDef, level, state.doors);
    if (cone.has(`${px},${py}`)) return { type: 'camera', id: camera.id };
  }
  return null;
}
