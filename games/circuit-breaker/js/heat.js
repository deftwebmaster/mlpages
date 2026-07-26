/** System heat: the game's pressure mechanic. Always clamped to 0..100. */

import { CONFIG } from './config.js';
import { clamp } from './utils.js';

export class Heat {
  constructor() {
    this.reset();
  }

  reset() {
    this.value = clamp(CONFIG.STARTING_HEAT, 0, CONFIG.MAX_HEAT);
    this.peak = this.value;
    this.totalCooled = 0;
  }

  /** Returns the amount actually applied after clamping. */
  add(amount) {
    const before = this.value;
    this.value = clamp(this.value + amount, 0, CONFIG.MAX_HEAT);
    if (this.value > this.peak) this.peak = this.value;
    return this.value - before;
  }

  cool(amount) {
    if (amount <= 0) return 0;
    const applied = -this.add(-amount);
    this.totalCooled += applied;
    return applied;
  }

  get overloaded() {
    return this.value >= CONFIG.MAX_HEAT;
  }

  get stage() {
    const stage = CONFIG.HEAT_STAGES.find((s) => this.value <= s.max);
    return stage || CONFIG.HEAT_STAGES[CONFIG.HEAT_STAGES.length - 1];
  }
}
