/**
 * The courier craft: lateral movement, phase-shift energy, and the collision
 * capsule. Purely authoritative state — nothing here touches the canvas.
 */

import { PLAYER, PHASE, COLLISION } from './config.js';
import { clamp, damp } from './utils.js';

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.vx = 0;
    this.bank = 0;
    this.phaseEnergy = PHASE.max;
    this.phased = false;
    this.phaseAmount = 0; // 0..1 visual ramp
    this.phaseLockout = 0;
    /** Set when phase drains to empty; cleared only by releasing the control. */
    this.phaseLatched = false;
    this.wasPhased = false;
    this.scraping = 0; // -1 left, 1 right, 0 none
    this.crushed = false;
    this.alive = true;
    this.thrust = 1;
  }

  /** Collision radius, shrunk for fairness. */
  get radius() {
    return PLAYER.radius * COLLISION.playerForgiveness;
  }

  /** Radius used for drawing and for wall clamping. */
  get visualRadius() {
    return PLAYER.radius;
  }

  get halfDepth() {
    return PLAYER.halfDepth;
  }

  /**
   * @param dt        seconds
   * @param input     Input snapshot
   * @param corridor  { l, r } world-x walls at the craft's depth
   * @param events    { onPhaseStart, onPhaseStop, onPhaseEmpty }
   */
  update(dt, input, corridor, events) {
    this._updatePhase(dt, input, events);
    this._updateMovement(dt, input);
    this._applyCorridor(corridor);
    this.bank = damp(this.bank, clamp(this.vx / PLAYER.maxSpeed, -1, 1) * PLAYER.maxBank, 12, dt);
  }

  _updatePhase(dt, input, events) {
    if (this.phaseLockout > 0) this.phaseLockout = Math.max(0, this.phaseLockout - dt);

    const wants = input.phaseHeld;
    // Releasing the control clears the post-depletion latch. Without this a
    // held button would re-engage phase the instant it crossed the activation
    // threshold, strobing the craft in and out of phase.
    if (!wants) this.phaseLatched = false;
    const canStart = this.phaseEnergy >= PHASE.minActivation && this.phaseLockout <= 0 && !this.phaseLatched;

    if (wants && !this.phased && canStart) {
      this.phased = true;
      events?.onPhaseStart?.();
    } else if (!wants && this.phased) {
      this.phased = false;
      events?.onPhaseStop?.();
    }

    if (this.phased) {
      this.phaseEnergy -= PHASE.drain * dt;
      if (this.phaseEnergy <= 0) {
        this.phaseEnergy = 0;
        this.phased = false;
        this.phaseLatched = true;
        this.phaseLockout = PHASE.rechargeDelay;
        events?.onPhaseEmpty?.();
      }
    } else if (this.phaseLockout <= 0) {
      this.phaseEnergy = Math.min(PHASE.max, this.phaseEnergy + PHASE.recharge * dt);
    }

    const target = this.phased ? 1 : 0;
    const rate = 1 / Math.max(0.016, PHASE.rampTime);
    this.phaseAmount = damp(this.phaseAmount, target, rate * 2.2, dt);
    if (Math.abs(this.phaseAmount - target) < 0.002) this.phaseAmount = target;
  }

  _updateMovement(dt, input) {
    let accel = 0;

    if (input.steerTarget !== null && input.steerTarget !== undefined) {
      // Drag steering: chase the pointer with a velocity target, so the craft
      // has weight instead of teleporting under the finger.
      const delta = input.steerTarget - this.x;
      const mag = Math.abs(delta);
      if (mag < PLAYER.followDeadzone) {
        this.vx = damp(this.vx, 0, PLAYER.drag, dt);
      } else {
        const desired = clamp(delta * PLAYER.followGain, -PLAYER.maxSpeed, PLAYER.maxSpeed);
        this.vx = damp(this.vx, desired, PLAYER.accel, dt);
      }
    } else if (input.steerAxis !== 0) {
      accel = input.steerAxis * PLAYER.accel;
      this.vx += accel * dt;
      this.vx = clamp(this.vx, -PLAYER.maxSpeed, PLAYER.maxSpeed);
    } else {
      this.vx = damp(this.vx, 0, PLAYER.drag, dt);
      if (Math.abs(this.vx) < 0.004) this.vx = 0;
    }

    this.x += this.vx * dt;
  }

  /**
   * Clamp inside the corridor. Sets `scraping` when the craft is being held
   * against a wall, and `crushed` when the corridor has closed to less than the
   * craft's width — the only way a wall becomes lethal.
   */
  _applyCorridor(corridor) {
    const r = this.visualRadius;
    const lo = corridor.l + r;
    const hi = corridor.r - r;
    this.scraping = 0;
    this.crushed = false;

    if (hi - lo < -COLLISION.wallCrushDepth) {
      this.crushed = true;
      this.x = (corridor.l + corridor.r) * 0.5;
      return;
    }
    if (hi <= lo) {
      // Corridor is exactly craft-width (or a hair under): ride the centre.
      this.x = (corridor.l + corridor.r) * 0.5;
      this.scraping = this.vx < 0 ? -1 : 1;
      return;
    }
    if (this.x < lo) {
      this.x = lo;
      if (this.vx < 0) this.vx = 0;
      this.scraping = -1;
    } else if (this.x > hi) {
      this.x = hi;
      if (this.vx > 0) this.vx = 0;
      this.scraping = 1;
    }
  }

  /** Extra stability drain caused by the craft's own systems this frame. */
  phaseStabilityCost(dt) {
    return this.phased ? PHASE.stabilityCost * dt : 0;
  }

  addPhaseEnergy(amount) {
    this.phaseEnergy = clamp(this.phaseEnergy + amount, 0, PHASE.max);
  }
}
