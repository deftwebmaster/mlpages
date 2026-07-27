/**
 * player.js — The player entity: motion rules plus everything visual.
 *
 * The rules themselves live in motion.js so they can be verified offline.
 * This class owns the parts that only matter when there is a screen: the
 * sub-state machine, the input buffer, the landing squash, the polarity ring,
 * and the timers for dying and uploading.
 */

import { CONFIG } from './config.js';
import { clamp } from './utils.js';
import {
  createMotionState,
  resetMotion,
  stepMotion,
  tryMove,
  switchPolarity,
  canSwitchPolarity,
  centerX,
  centerY,
  MOVE_OK,
  MOVE_BUSY,
} from './motion.js';

export const PlayerState = {
  IDLE: 'IDLE',
  MOVING: 'MOVING',
  RIDING: 'RIDING',
  DYING: 'DYING',
  UPLOADING: 'UPLOADING',
  RESPAWNING: 'RESPAWNING',
  COMPLETE: 'COMPLETE',
};

export class Player {
  constructor(level, polarity = 'cyan') {
    this.motion = createMotionState(level, polarity);
    this.state = PlayerState.IDLE;
    this.reset(level, polarity);
  }

  reset(level, polarity) {
    resetMotion(this.motion, level, polarity);
    this.state = PlayerState.IDLE;
    this.bufferedDx = 0;
    this.bufferedDy = 0;
    this.bufferAge = Infinity;
    this.graceTimer = CONFIG.player.spawnGrace;
    this.flashTimer = 0;
    this.squashTimer = 0;
    this.deathTimer = 0;
    this.uploadTimer = 0;
    this.deathCause = null;
    this.highestRow = level.playerStart.row;
    this.pulse = 0;
    this.lastFacing = { dx: 0, dy: -1 };
    this.blockedFlash = 0;
  }

  get x() { return this.motion.x; }
  get y() { return this.motion.y; }
  get row() { return this.motion.row; }
  get polarity() { return this.motion.polarity; }
  get centerX() { return centerX(this.motion); }
  get centerY() { return centerY(this.motion); }
  get isRiding() { return this.motion.carryLane !== null; }
  get switchCooldown() { return this.motion.switchCooldown; }
  get switchReady() { return canSwitchPolarity(this.motion); }

  get busy() {
    return (
      this.state === PlayerState.DYING ||
      this.state === PlayerState.UPLOADING ||
      this.state === PlayerState.RESPAWNING ||
      this.state === PlayerState.COMPLETE
    );
  }

  /**
   * Request a move. Returns MOVE_OK, MOVE_BUSY, or a block reason. A request
   * made mid-move is buffered — exactly one deep, so a panicked flurry of
   * swipes cannot queue up a run of moves the player no longer wants.
   */
  requestMove(level, dx, dy, uplinkStates) {
    if (this.busy) return MOVE_BUSY;
    this.lastFacing = { dx, dy };

    if (this.motion.moving) {
      this.bufferedDx = dx;
      this.bufferedDy = dy;
      this.bufferAge = 0;
      return MOVE_BUSY;
    }

    const result = tryMove(this.motion, level, dx, dy, uplinkStates);
    if (result === MOVE_OK) {
      this.state = PlayerState.MOVING;
    } else {
      this.blockedFlash = 0.18;
    }
    return result;
  }

  requestPolaritySwitch() {
    if (this.busy) return false;
    if (!switchPolarity(this.motion)) return false;
    this.flashTimer = CONFIG.polarity.flashDuration;
    return true;
  }

  beginDeath(cause) {
    if (this.state === PlayerState.DYING) return false;
    this.state = PlayerState.DYING;
    this.deathTimer = CONFIG.player.deathDuration;
    this.deathCause = cause;
    this.motion.moving = false;
    this.bufferAge = Infinity;
    return true;
  }

  beginUpload() {
    this.state = PlayerState.UPLOADING;
    this.uploadTimer = CONFIG.player.uploadDuration;
    this.motion.moving = false;
    this.bufferAge = Infinity;
  }

  /**
   * Advance one frame. `events` is caller-owned and reused.
   * Returns the same events record, extended with `blocked` when a buffered
   * input could not be honoured.
   */
  update(level, dt, uplinkStates, events) {
    this.pulse += dt;
    if (this.graceTimer > 0) this.graceTimer = Math.max(0, this.graceTimer - dt);
    if (this.flashTimer > 0) this.flashTimer = Math.max(0, this.flashTimer - dt);
    if (this.squashTimer > 0) this.squashTimer = Math.max(0, this.squashTimer - dt);
    if (this.blockedFlash > 0) this.blockedFlash = Math.max(0, this.blockedFlash - dt);
    if (this.bufferAge < Infinity) this.bufferAge += dt;

    if (this.state === PlayerState.DYING) {
      this.deathTimer = Math.max(0, this.deathTimer - dt);
      events.settled = false;
      events.fell = false;
      events.carriedOff = false;
      events.attached = false;
      events.detached = false;
      events.phasedOut = false;
      return events;
    }

    if (this.state === PlayerState.UPLOADING) {
      this.uploadTimer = Math.max(0, this.uploadTimer - dt);
      events.settled = false;
      events.fell = false;
      events.carriedOff = false;
      events.attached = false;
      events.detached = false;
      events.phasedOut = false;
      return events;
    }

    stepMotion(this.motion, level, dt, uplinkStates, events);

    if (events.settled) {
      this.squashTimer = CONFIG.player.landSquash;
      this.highestRow = Math.min(this.highestRow, this.motion.row);
      this.consumeBuffer(level, uplinkStates);
    }

    this.state = this.motion.moving
      ? PlayerState.MOVING
      : this.isRiding
        ? PlayerState.RIDING
        : PlayerState.IDLE;

    return events;
  }

  consumeBuffer(level, uplinkStates) {
    if (this.bufferAge > CONFIG.player.inputBufferWindow) {
      this.bufferAge = Infinity;
      return;
    }
    const dx = this.bufferedDx;
    const dy = this.bufferedDy;
    this.bufferAge = Infinity;
    if (dx === 0 && dy === 0) return;
    const result = tryMove(this.motion, level, dx, dy, uplinkStates);
    if (result !== MOVE_OK) this.blockedFlash = 0.18;
  }

  /** 0 → 1 progress through the current death animation. */
  get deathProgress() {
    return 1 - clamp(this.deathTimer / CONFIG.player.deathDuration, 0, 1);
  }

  /** 0 → 1 progress through the current upload. */
  get uploadProgress() {
    return 1 - clamp(this.uploadTimer / CONFIG.player.uploadDuration, 0, 1);
  }

  /** Vertical scale factor for the landing squash, 1 when at rest. */
  get squash() {
    if (this.squashTimer <= 0) return 1;
    const t = this.squashTimer / CONFIG.player.landSquash;
    return 1 - Math.sin(t * Math.PI) * 0.22;
  }

  get polarityFlash() {
    return this.flashTimer <= 0 ? 0 : this.flashTimer / CONFIG.polarity.flashDuration;
  }
}

export { MOVE_OK, MOVE_BUSY };
