import { CONFIG } from './config.js';
import { countByTag } from './objectives.js';

// Reusable boss phase behaviors, referenced by id from stage bossConfiguration
// data rather than hardcoded per-stage. Each phase declares a completion tag
// (all components with that objectiveTag must be destroyed) plus optional
// activation of hazards / core-shield duty cycling.

export const BOSS_DEFS = {
  defenseMatrix: {
    label: 'Defense Matrix',
    phases: [
      { id: 'outerShields', label: 'Destroy the outer shield nodes', tag: 'outerShield', telegraph: 'FOUR SHIELD NODES DETECTED' },
      { id: 'rotatingArmor', label: 'Break the rotating armor weak points', tag: 'rotatingWeak', telegraph: 'ARMOR RING ROTATING — TIME YOUR SHOT', enableMovement: true },
      { id: 'turrets', label: 'Disable the defense turrets', tag: 'turretMount', telegraph: 'TURRETS ONLINE — SUPPRESS OR DODGE', enableTurrets: true },
      { id: 'core', label: 'Breach the central core', tag: 'bossCore', telegraph: 'CORE EXPOSED — STRIKE DURING THE WINDOW', coreDutyCycle: { open: 3.5, closed: 3.5 } }
    ]
  },
  finalReactor: {
    label: 'Final Reactor',
    phases: [
      { id: 'outerContainment', label: 'Destroy reinforced armor and conduits', tag: 'outerArmor', telegraph: 'OUTER CONTAINMENT ACTIVE' },
      { id: 'phaseShield', label: 'Predict the alternating phase shield', tag: 'phaseWeak', telegraph: 'PHASE SHIELD CYCLING', enableMovement: true },
      { id: 'corruption', label: 'Destroy corruption nodes before they rebuild defenses', tag: 'corruptionNode', telegraph: 'CORRUPTION SPREADING' },
      { id: 'overload', label: 'Destroy the core before overload', tag: 'bossCore', telegraph: 'CORE OVERLOAD IMMINENT', overloadMeter: { duration: 45 }, speedBoost: 1.15, exposeCore: true }
    ]
  }
};

export class BossController {
  constructor(bossKey, components) {
    this.bossKey = bossKey;
    this.def = BOSS_DEFS[bossKey];
    this.components = components;
    this.phaseIndex = 0;
    this.phaseElapsed = 0;
    this.defeated = false;
    this.coreOpen = false;
    this.overloadTimer = this.def.phases.find((p) => p.overloadMeter)?.overloadMeter.duration || 0;
    this.overloadActive = false;
    this.telegraphTimer = 2.5;
  }

  currentPhase() {
    return this.def.phases[this.phaseIndex];
  }

  progress() {
    return (this.phaseIndex + this._phaseFraction()) / this.def.phases.length;
  }

  _phaseFraction() {
    const phase = this.currentPhase();
    if (!phase) return 1;
    const tagged = countByTag(this.components, phase.tag);
    if (tagged.length === 0) return 0;
    const destroyed = tagged.filter((c) => c.destroyed).length;
    return destroyed / tagged.length;
  }

  update(dt, world) {
    if (this.defeated) return;
    const phase = this.currentPhase();
    if (!phase) return;
    this.phaseElapsed += dt;
    this.telegraphTimer = Math.max(0, this.telegraphTimer - dt);

    if (phase.enableTurrets) {
      world.hazards?.turrets.forEach((t) => (t.active = true));
    }

    if (phase.exposeCore) {
      const coreBarrier = world.shields?.barriers.find((b) => b.id === 'bossCoreShield');
      if (coreBarrier) coreBarrier.suppressedTimer = 999;
    }

    if (phase.coreDutyCycle) {
      const cycle = phase.coreDutyCycle.open + phase.coreDutyCycle.closed;
      const t = this.phaseElapsed % cycle;
      const shouldOpen = t < phase.coreDutyCycle.open;
      if (shouldOpen !== this.coreOpen) {
        this.coreOpen = shouldOpen;
        world.onBossCoreToggle?.(this.coreOpen);
      }
      const coreBarrier = world.shields?.barriers.find((b) => b.id === 'bossCoreShield');
      if (coreBarrier) coreBarrier.suppressedTimer = this.coreOpen ? 999 : 0;
    }

    if (phase.overloadMeter) {
      this.overloadActive = true;
      this.overloadTimer -= dt;
      if (this.overloadTimer <= 0) {
        world.onBossOverloadFailed?.();
      }
    }

    const tagged = countByTag(this.components, phase.tag);
    const complete = tagged.length > 0 && tagged.every((c) => c.destroyed);
    if (complete) {
      this._advancePhase(world);
    }
  }

  _advancePhase(world) {
    world.onScore?.(CONFIG.score.bossPhase);
    world.audio?.play('bossPhase');
    world.onBossPhaseComplete?.(this.phaseIndex);
    this.phaseIndex += 1;
    this.phaseElapsed = 0;
    this.telegraphTimer = 2.5;
    if (this.phaseIndex >= this.def.phases.length) {
      this.defeated = true;
      world.onBossDefeated?.();
    }
  }

  isOverloadFailing() {
    return this.overloadActive && this.overloadTimer <= 0;
  }
}
