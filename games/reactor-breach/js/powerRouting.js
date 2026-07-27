import { CONFIG } from './config.js';
import { clamp } from './utils.js';

export const CHANNELS = ['deflector', 'orb', 'reactorControl'];

export class PowerRouting {
  constructor(rules = {}) {
    this.capacity = rules.channelCapacity ?? CONFIG.routing.channelCapacity;
    this.thresholds = rules.tierThresholds ?? CONFIG.routing.tierThresholds;
    this.energy = { deflector: 0, orb: 0, reactorControl: 0 };
    this.tierReached = { deflector: 0, orb: 0, reactorControl: 0 };
    this.selected = 'deflector';
    this.enabled = rules.enabled !== false;
    this.storedTier = { deflector: 0, orb: 0, reactorControl: 0 }; // for manually-activated tiers
    this.flashChannel = null;
    this.flashTimer = 0;
  }

  select(channel) {
    if (!this.enabled || !CHANNELS.includes(channel) || channel === this.selected) return;
    this.selected = channel;
    this.flashChannel = channel;
    this.flashTimer = 0.4;
  }

  cycle(direction) {
    const idx = CHANNELS.indexOf(this.selected);
    const next = (idx + (direction === 'left' ? -1 : 1) + CHANNELS.length) % CHANNELS.length;
    this.select(CHANNELS[next]);
  }

  addEnergy(amount) {
    if (!this.enabled || amount <= 0) return;
    const ch = this.selected;
    const room = this.capacity - this.energy[ch];
    if (room >= amount) {
      this.energy[ch] += amount;
    } else {
      this.energy[ch] += room;
      const overflow = (amount - room) * CONFIG.routing.overflowEfficiency;
      let minCh = CHANNELS[0];
      for (const c of CHANNELS) if (this.energy[c] < this.energy[minCh]) minCh = c;
      this.energy[minCh] = Math.min(this.capacity, this.energy[minCh] + overflow);
    }
    this._updateTiers();
  }

  _updateTiers() {
    for (const ch of CHANNELS) {
      let tier = 0;
      for (let i = 0; i < this.thresholds.length; i++) {
        if (this.energy[ch] >= this.thresholds[i]) tier = i + 1;
      }
      this.tierReached[ch] = tier;
    }
  }

  spend(channel, amount) {
    if (this.energy[channel] < amount) return false;
    this.energy[channel] -= amount;
    this._updateTiers();
    return true;
  }

  nextThreshold(channel) {
    for (const t of this.thresholds) {
      if (this.energy[channel] < t) return t;
    }
    return this.capacity;
  }

  update(dt) {
    this.flashTimer = Math.max(0, this.flashTimer - dt);
  }
}
