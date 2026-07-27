import { CONFIG } from './config.js';
import { clamp, approach } from './utils.js';

export class Deflector {
  constructor(chamberWidth, chamberHeight) {
    this.chamberWidth = chamberWidth;
    this.chamberHeight = chamberHeight;
    this.width = CONFIG.deflector.baseWidth;
    this.baseWidth = CONFIG.deflector.baseWidth;
    this.height = CONFIG.deflector.height;
    this.x = chamberWidth / 2;
    this.y = chamberHeight - CONFIG.deflector.yOffset;
    this.vx = 0;
    this.speedMult = 1;
    this.catchCharges = CONFIG.deflector.catchChargesDefault;
    this.holding = false;
    this.holdTimer = 0;
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.expansionTimer = 0;
    this.precisionTimer = 0;
    this.durability = CONFIG.deflector.durabilityMax;
    this.durabilityEnabled = false;
    this.impactFlash = 0;
    this.contactBounceAnim = 0;
    this.catchFieldAnim = 0;
  }

  get left() {
    return this.x - this.width / 2;
  }
  get right() {
    return this.x + this.width / 2;
  }
  get top() {
    return this.y - this.height / 2;
  }

  setChamberSize(w, h) {
    this.chamberWidth = w;
    this.chamberHeight = h;
    this.y = h - CONFIG.deflector.yOffset;
    this.x = clamp(this.x, this.width / 2, w - this.width / 2);
  }

  applyExpansion(duration) {
    this.expansionTimer = Math.max(this.expansionTimer, duration);
  }

  applyPrecision(duration) {
    this.precisionTimer = Math.max(this.precisionTimer, duration);
  }

  applyShield(duration) {
    this.shieldActive = true;
    this.shieldTimer = Math.max(this.shieldTimer, duration);
  }

  addCatchCharge(n = 1) {
    this.catchCharges += n;
  }

  update(dt, moveAxis, pointerX, pointerActive) {
    // Temporary modifiers
    this.width = this.expansionTimer > 0 ? this.baseWidth + CONFIG.deflector.widthTierBonus : this.baseWidth;
    this.width = clamp(this.width, CONFIG.deflector.minWidth, CONFIG.deflector.maxWidth);
    this.speedMult = this.precisionTimer > 0 ? CONFIG.deflector.precisionSpeedMult : 1;
    this.expansionTimer = Math.max(0, this.expansionTimer - dt);
    this.precisionTimer = Math.max(0, this.precisionTimer - dt);
    this.shieldTimer = Math.max(0, this.shieldTimer - dt);
    if (this.shieldTimer <= 0) this.shieldActive = false;
    this.impactFlash = Math.max(0, this.impactFlash - dt * 4);
    this.contactBounceAnim = Math.max(0, this.contactBounceAnim - dt * 5);
    this.catchFieldAnim = Math.max(0, this.catchFieldAnim - dt * 3);

    const maxSpeed = CONFIG.deflector.baseSpeed * this.speedMult;

    if (pointerActive && pointerX !== null && pointerX !== undefined) {
      // Direct positional follow (mouse / touch drag), still speed-limited for feel.
      const targetX = clamp(pointerX, this.width / 2, this.chamberWidth - this.width / 2);
      const delta = targetX - this.x;
      const maxStep = maxSpeed * dt * 1.6;
      const step = clamp(delta, -maxStep, maxStep);
      this.x += step;
      this.vx = step / Math.max(dt, 1e-4);
    } else {
      const targetVx = moveAxis * maxSpeed;
      const accel = moveAxis !== 0 ? CONFIG.deflector.acceleration : CONFIG.deflector.friction;
      this.vx = approach(this.vx, targetVx, accel * dt);
      this.x += this.vx * dt;
    }

    this.x = clamp(this.x, this.width / 2, this.chamberWidth - this.width / 2);
    if (this.x <= this.width / 2 || this.x >= this.chamberWidth - this.width / 2) {
      this.vx = 0;
    }

    if (this.holding) {
      this.holdTimer += dt;
      if (this.holdTimer >= CONFIG.deflector.catchHoldMax) {
        this.holding = false;
      }
    }
  }

  tryStartCatch() {
    if (this.catchCharges <= 0) return false;
    this.catchCharges -= 1;
    this.holding = true;
    this.holdTimer = 0;
    this.catchFieldAnim = 1;
    return true;
  }

  releaseCatch() {
    this.holding = false;
    this.holdTimer = 0;
  }

  onOrbContact() {
    this.impactFlash = 1;
    this.contactBounceAnim = 1;
  }

  damage(amount) {
    if (!this.durabilityEnabled) return false;
    this.durability = Math.max(0, this.durability - amount);
    if (this.durability <= 0) {
      this.durability = CONFIG.deflector.durabilityMax;
      return true; // signals charge loss
    }
    return false;
  }

  contactRatio(hitX) {
    return clamp((hitX - this.x) / (this.width / 2), -1, 1);
  }
}
