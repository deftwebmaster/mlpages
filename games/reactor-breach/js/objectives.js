// Evaluates primary and secondary objectives for the active stage against
// live component/run state. Stage data declares intent; this module is generic.

export function countByTag(components, tag) {
  return components.filter((c) => c.objectiveTag === tag);
}

export function isPrimaryObjectiveComplete(stage, components, runStats, bossState) {
  const obj = stage.primaryObjective;
  if (!obj) return components.every((c) => c.destroyed || c.typeDef.isReflector);
  switch (obj.type) {
    case 'destroyAll':
      return components.every((c) => c.destroyed || c.typeDef.isReflector);
    case 'destroyTagged': {
      const tagged = countByTag(components, obj.tag);
      return tagged.length > 0 && tagged.every((c) => c.destroyed);
    }
    case 'destroyAllOfType': {
      const matched = components.filter((c) => c.type === obj.componentType);
      return matched.length > 0 && matched.every((c) => c.destroyed);
    }
    case 'surviveTime':
      return runStats.elapsedTime >= obj.seconds;
    case 'chainReactionCount':
      return runStats.volatileChainCount >= obj.count;
    case 'defeatBoss':
      return !!bossState?.defeated;
    case 'stabilizeCore':
      return !!runStats.coreStabilized;
    default:
      return false;
  }
}

export function evaluateSecondaryObjectives(stage, components, runStats, result = {}) {
  for (const sec of stage.secondaryObjectives || []) {
    let done = false;
    switch (sec.type) {
      case 'noOrbLoss':
        done = runStats.orbsLostThisStage === 0;
        break;
      case 'underTime':
        done = runStats.elapsedTime <= sec.seconds;
        break;
      case 'energyPercent':
        done = runStats.energyTotalAvailable > 0
          ? runStats.energyCollected / runStats.energyTotalAvailable >= sec.percent
          : true;
        break;
      case 'comboThreshold':
        done = runStats.maxCombo >= sec.count;
        break;
      case 'noShieldUsed':
        done = !runStats.shieldUsed;
        break;
      case 'noMultiOrb':
        done = !runStats.multiOrbUsed;
        break;
      case 'allVolatileDestroyed': {
        const volatiles = components.filter((c) => c.typeDef.isVolatile);
        done = volatiles.length > 0 && volatiles.every((c) => c.destroyed);
        break;
      }
      case 'destroyTagged': {
        const tagged = countByTag(components, sec.tag);
        done = tagged.length > 0 && tagged.every((c) => c.destroyed);
        break;
      }
      default:
        done = false;
    }
    result[sec.id] = done;
  }
  return result;
}

export function primaryObjectiveLabel(stage) {
  return stage.primaryObjective?.label || 'Breach the reactor chamber';
}
