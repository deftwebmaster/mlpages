import { CONFIG } from './config.js';

export class ScoreTracker {
  constructor() {
    this.score = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboMultiplier = 1;
    this.maxCombo = 0;
  }

  add(base) {
    const points = Math.round(base * this.comboMultiplier);
    this.score += points;
    return points;
  }

  registerHit(extendWindow = 0) {
    this.comboCount += 1;
    this.comboTimer = CONFIG.combo.window + extendWindow;
    this._updateMultiplier();
    this.maxCombo = Math.max(this.maxCombo, this.comboCount);
  }

  _updateMultiplier() {
    const thresholds = CONFIG.combo.thresholds;
    let mult = CONFIG.combo.multipliers[0];
    for (let i = 0; i < thresholds.length; i++) {
      if (this.comboCount >= thresholds[i]) mult = CONFIG.combo.multipliers[i];
    }
    this.comboMultiplier = mult;
  }

  resetCombo() {
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.comboTimer = 0;
  }

  update(dt) {
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.resetCombo();
    }
  }
}

export function computeRank(stage, runStats, completed) {
  if (!completed) return null;
  let weighted = 0;
  weighted += Math.min(1, runStats.score / (stage.rankThresholds?.scoreTarget || 10000)) * 40;
  weighted += (runStats.chargesRemaining / (stage.containmentCharges ?? CONFIG.containmentChargesDefault)) * 25;
  const timeTarget = stage.rankThresholds?.timeTarget || 180;
  weighted += Math.max(0, 1 - Math.max(0, runStats.elapsedTime - timeTarget) / timeTarget) * 15;
  const energyRatio = runStats.energyTotalAvailable > 0
    ? runStats.energyCollected / runStats.energyTotalAvailable
    : 1;
  weighted += Math.min(1, energyRatio) * 10;
  const secDone = Object.values(runStats.secondaryResults || {}).filter(Boolean).length;
  const secTotal = Math.max(1, (stage.secondaryObjectives || []).length);
  weighted += (secDone / secTotal) * 10;

  const t = CONFIG.rank.thresholds;
  if (weighted >= t.splus) return 'S+';
  if (weighted >= t.s) return 'S';
  if (weighted >= t.a) return 'A';
  if (weighted >= t.b) return 'B';
  return 'C';
}

export function computeMedals(stage, runStats, completed) {
  const secResults = runStats.secondaryResults || {};
  const secTotal = (stage.secondaryObjectives || []).length;
  const secDone = Object.values(secResults).filter(Boolean).length;
  return {
    breach: completed,
    stable: completed && runStats.orbsLostThisStage === 0,
    control: completed && (secTotal === 0 ? runStats.score >= (stage.rankThresholds?.scoreTarget || 0) : secDone === secTotal)
  };
}
