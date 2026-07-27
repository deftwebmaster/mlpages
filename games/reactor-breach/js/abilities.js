import { CONFIG } from './config.js';

const TIER_COST_KEYS = {
  deflector: ['expansionCost', 'magneticChargeCost', 'shieldCost', 'precisionCost'],
  orb: ['accelCost', 'pierceCost', 'multiOrbCost', 'overchargeCost'],
  reactorControl: ['scanCost', 'suppressionCost', 'dilationCost', 'overrideCost']
};

export class AbilityController {
  constructor() {
    this.scanTimer = 0;
    this.suppressionTimer = 0;
    this.dilationTimer = 0;
    this.overrideTimer = 0;
  }

  isScanActive() {
    return this.scanTimer > 0;
  }
  isSuppressed() {
    return this.suppressionTimer > 0;
  }
  isDilated() {
    return this.dilationTimer > 0;
  }
  isOverrideActive() {
    return this.overrideTimer > 0;
  }

  getTimeScale() {
    return this.dilationTimer > 0 ? CONFIG.abilities.reactorControl.dilationFactor : 1;
  }

  update(dt) {
    this.scanTimer = Math.max(0, this.scanTimer - dt);
    this.suppressionTimer = Math.max(0, this.suppressionTimer - dt);
    this.dilationTimer = Math.max(0, this.dilationTimer - dt);
    this.overrideTimer = Math.max(0, this.overrideTimer - dt);
  }

  // Attempts to activate the best available (highest reached) tier ability
  // on the given channel. Returns the tier activated, or 0 if none affordable.
  activate(channel, routing, world) {
    const tier = routing.tierReached[channel];
    if (!tier) return 0;
    const costKey = TIER_COST_KEYS[channel][tier - 1];
    const cost = CONFIG.abilities[channel][costKey];
    if (!routing.spend(channel, cost)) return 0;

    this._applyEffect(channel, tier, world);
    world.audio?.play('abilityActivate');
    world.haptics?.('ability');
    world.onAbilityActivated?.(channel, tier);
    return tier;
  }

  _applyEffect(channel, tier, world) {
    const { deflector, orbManager, shields } = world;
    if (channel === 'deflector') {
      if (tier === 1) deflector.applyExpansion(CONFIG.abilities.deflector.expansionDuration);
      else if (tier === 2) deflector.addCatchCharge(1);
      else if (tier === 3) deflector.applyShield(CONFIG.abilities.deflector.shieldDuration);
      else if (tier === 4) deflector.applyPrecision(CONFIG.abilities.deflector.precisionDuration);
    } else if (channel === 'orb') {
      const orbs = orbManager.orbs;
      if (tier === 1) {
        for (const o of orbs) {
          o.speedTierMult = CONFIG.orb.accelTierMult;
          o.accelTimer = CONFIG.abilities.orb.accelDuration;
        }
      } else if (tier === 2) {
        for (const o of orbs) o.pierceCharges += CONFIG.abilities.orb.pierceCharges;
      } else if (tier === 3) {
        const source = orbs[0];
        if (source) {
          orbManager.spawnExtraOrb(source);
          orbManager.spawnExtraOrb(source);
        }
      } else if (tier === 4) {
        for (const o of orbs) o.explosiveTimer = CONFIG.abilities.orb.overchargeDuration;
      }
    } else if (channel === 'reactorControl') {
      if (tier === 1) this.scanTimer = CONFIG.abilities.reactorControl.scanDuration;
      else if (tier === 2) {
        this.suppressionTimer = CONFIG.abilities.reactorControl.suppressionDuration;
        shields?.suppressAll(CONFIG.abilities.reactorControl.suppressionDuration);
      } else if (tier === 3) this.dilationTimer = CONFIG.abilities.reactorControl.dilationDuration;
      else if (tier === 4) this.overrideTimer = CONFIG.abilities.reactorControl.overrideDuration;
    }
  }
}
