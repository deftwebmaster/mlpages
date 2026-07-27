import { CONFIG } from './config.js';

// Material/type definitions driving hitpoints, score, energy and visuals.
export const COMPONENT_TYPES = {
  structural: { hp: 1, score: CONFIG.score.structuralPlate, energy: 'small', color: '#7d8b99', armored: false },
  reinforced: { hp: 3, score: CONFIG.score.reinforcedPlate, energy: 'medium', color: '#9aa7b3', armored: true },
  heavyArmor: { hp: 5, score: CONFIG.score.reinforcedPlate * 1.6, energy: 'large', color: '#5b6b78', armored: true, requiresPierceOrExplosive: true },
  conduit: { hp: 2, score: CONFIG.score.conduit, energy: 'medium', color: '#3fd0ff', armored: false, isConduit: true },
  shieldNode: { hp: 3, score: CONFIG.score.shieldNode, energy: 'medium', color: '#b98bff', armored: true, isShieldNode: true },
  reflector: { hp: Infinity, score: 0, energy: null, color: '#c7d3dc', armored: true, isReflector: true },
  phase: { hp: 2, score: CONFIG.score.reinforcedPlate, energy: 'medium', color: '#4fe3c1', armored: false, isPhase: true },
  volatile: { hp: 1, score: CONFIG.score.volatileCell, energy: 'large', color: '#ff9d3f', armored: false, isVolatile: true },
  corruption: { hp: 2, score: CONFIG.score.corruptionNode, energy: 'large', color: '#ff4d6d', armored: false, isCorruption: true },
  coreSegment: { hp: 4, score: CONFIG.score.coreSegment, energy: 'coreFragment', color: '#fff2b8', armored: true, isCore: true }
};

let compSerial = 1;

export class Component {
  constructor(def) {
    this.id = def.id || `comp_${compSerial++}`;
    this.type = def.type;
    const typeDef = COMPONENT_TYPES[def.type];
    this.x = def.x; // center
    this.y = def.y;
    this.width = def.width || 40;
    this.height = def.height || 18;
    this.rotation = def.rotation || 0;
    this.maxHp = def.hitPoints ?? typeDef.hp;
    this.hp = this.maxHp;
    this.destroyed = false;
    this.movementPattern = def.movementPattern || null;
    this.movementT = Math.random() * Math.PI * 2;
    this.originX = def.x;
    this.originY = def.y;
    this.connectionIds = def.connectionIds || [];
    this.shieldedBy = def.shieldedBy || null;
    this.objectiveTag = def.objectiveTag || null;
    this.behaviorConfig = def.behaviorConfig || {};
    this.energyDropOverride = def.energyDrop;
    this.scoreOverride = def.scoreValue;
    this.disabledByConduit = false;
    this.phaseState = 'solid'; // solid | intangible | vulnerable
    this.phaseTimer = def.behaviorConfig?.phaseOffset || 0;
    this.corruptionSpreadTimer = def.behaviorConfig?.spreadInterval || 4;
    this.flashTimer = 0;
    this.damageFlash = 0;
    this.gridRow = def.row;
    this.gridCol = def.column;
  }

  get typeDef() {
    return COMPONENT_TYPES[this.type];
  }

  isCollidable() {
    if (this.destroyed) return false;
    if (this.typeDef.isPhase && this.phaseState === 'intangible') return false;
    return true;
  }

  damage(amount, { pierceOrExplosive = false } = {}) {
    if (this.destroyed) return false;
    if (this.typeDef.requiresPierceOrExplosive && !pierceOrExplosive) {
      this.damageFlash = 1;
      return false;
    }
    this.hp -= amount;
    this.damageFlash = 1;
    if (this.hp <= 0) {
      this.destroyed = true;
      return true;
    }
    return false;
  }

  energyValue() {
    if (this.energyDropOverride !== undefined) return this.energyDropOverride;
    const key = this.typeDef.energy;
    if (!key) return 0;
    return CONFIG.energy[key];
  }

  scoreValue() {
    return this.scoreOverride ?? this.typeDef.score;
  }

  damageStage() {
    // 0 = undamaged, up to 1 = about to break, used for visual state.
    if (this.maxHp === Infinity) return 0;
    return 1 - this.hp / this.maxHp;
  }

  update(dt, timeScale = 1) {
    this.damageFlash = Math.max(0, this.damageFlash - dt * 4);
    this.flashTimer = Math.max(0, this.flashTimer - dt);
    const scaledDt = dt * timeScale;

    if (this.movementPattern) {
      this.movementT += scaledDt;
      const cfg = this.behaviorConfig;
      if (this.movementPattern === 'oscillateX') {
        this.x = this.originX + Math.sin(this.movementT * (cfg.speed || 1)) * (cfg.range || 40);
      } else if (this.movementPattern === 'oscillateY') {
        this.y = this.originY + Math.sin(this.movementT * (cfg.speed || 1)) * (cfg.range || 30);
      } else if (this.movementPattern === 'orbit') {
        const r = cfg.radius || 60;
        this.x = this.originX + Math.cos(this.movementT * (cfg.speed || 1)) * r;
        this.y = this.originY + Math.sin(this.movementT * (cfg.speed || 1)) * r;
      } else if (this.movementPattern === 'rotate') {
        this.rotation = this.movementT * (cfg.speed || 1);
      } else if (this.movementPattern === 'slide') {
        const span = cfg.range || 60;
        const t = (Math.sin(this.movementT * (cfg.speed || 1)) + 1) / 2;
        this.x = this.originX + t * span;
      }
    }

    if (this.typeDef.isPhase && !this.destroyed) {
      this.phaseTimer -= scaledDt;
      const cycle = this.behaviorConfig.cycleDuration || 3;
      const warn = this.behaviorConfig.warnDuration || 0.6;
      if (this.phaseTimer <= 0) {
        this.phaseTimer = cycle;
        this.phaseState = this.phaseState === 'solid' ? 'intangible' : 'solid';
      }
      this.isWarning = this.phaseTimer <= warn;
    }
  }
}

export function createComponentsFromLayout(layout) {
  return layout.map((def) => new Component(def));
}
