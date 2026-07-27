import { CHAMBER, buildGrid, colX, rowY, tutorialPrompt } from './stageHelpers.js';

// ---------------------------------------------------------------------------
// 18 handcrafted stages: 12 standard chambers, 4 challenge chambers, 2 bosses.
// Each stage is a fully declarative data object consumed by stageLoader.js.
// Reusable mechanics (conduits, shields, phase, volatile, corruption, moving
// groups) are engine-level systems — nothing here hardcodes engine behavior.
// ---------------------------------------------------------------------------

const STAGES = [];

// ---- Stage 1: Containment Test --------------------------------------------
STAGES.push({
  id: 1,
  name: 'Containment Test',
  subtitle: 'Learn the deflector',
  backgroundVariant: 'graphite',
  containmentCharges: 3,
  powerRoutingRules: { enabled: false },
  componentLayout: buildGrid(4, 6, (r, c) => ({ type: 'structural' })),
  shieldSystems: [],
  hazards: [],
  primaryObjective: { type: 'destroyAll', label: 'Clear all structural plates' },
  secondaryObjectives: [
    { id: 'noOrbLoss', type: 'noOrbLoss', label: 'Lose no containment charges' }
  ],
  rankThresholds: { scoreTarget: 2400, timeTarget: 90 },
  tutorialPrompts: [
    tutorialPrompt('move', 'MOVE THE DEFLECTOR'),
    tutorialPrompt('launch', 'LAUNCH THE ENERGY ORB'),
    tutorialPrompt('angle', 'CONTACT POSITION CHANGES THE REBOUND ANGLE')
  ],
  musicVariant: 'calm'
});

// ---- Stage 2: Controlled Demolition ----------------------------------------
STAGES.push({
  id: 2,
  name: 'Controlled Demolition',
  subtitle: 'Aim with intent',
  backgroundVariant: 'graphite',
  containmentCharges: 3,
  powerRoutingRules: { enabled: true },
  componentLayout: buildGrid(5, 7, (r, c) => ({
    type: (r + c) % 3 === 0 ? 'reinforced' : 'structural'
  })),
  shieldSystems: [],
  hazards: [],
  primaryObjective: { type: 'destroyAll', label: 'Clear the demolition grid' },
  secondaryObjectives: [
    { id: 'underTime', type: 'underTime', seconds: 100, label: 'Finish under 100 seconds' }
  ],
  rankThresholds: { scoreTarget: 3600, timeTarget: 100 },
  tutorialPrompts: [tutorialPrompt('reinforced', 'REINFORCED PLATES NEED MULTIPLE HITS')],
  musicVariant: 'calm'
});

// ---- Stage 3: Power Recovery ------------------------------------------------
STAGES.push({
  id: 3,
  name: 'Power Recovery',
  subtitle: 'Route your first energy',
  backgroundVariant: 'blue',
  containmentCharges: 3,
  powerRoutingRules: { enabled: true },
  componentLayout: buildGrid(5, 7, (r, c) => ({
    type: r === 0 ? 'reinforced' : 'structural'
  })),
  shieldSystems: [],
  hazards: [],
  primaryObjective: { type: 'destroyAll', label: 'Clear the chamber' },
  secondaryObjectives: [
    { id: 'noOrbLoss', type: 'noOrbLoss', label: 'Lose no containment charges' }
  ],
  rankThresholds: { scoreTarget: 3800, timeTarget: 110 },
  tutorialPrompts: [
    tutorialPrompt('energy', 'COLLECT RELEASED ENERGY'),
    tutorialPrompt('route', 'ROUTE POWER TO THE DEFLECTOR')
  ],
  musicVariant: 'active'
});

// ---- Stage 4: Orb Dynamics --------------------------------------------------
STAGES.push({
  id: 4,
  name: 'Orb Dynamics',
  subtitle: 'Piercing and multi-hit armor',
  backgroundVariant: 'blue',
  containmentCharges: 3,
  powerRoutingRules: { enabled: true },
  componentLayout: buildGrid(6, 7, (r, c) => {
    if (r === 2 && c >= 2 && c <= 4) return { type: 'heavyArmor' };
    return { type: (r + c) % 2 === 0 ? 'reinforced' : 'structural' };
  }),
  shieldSystems: [],
  hazards: [],
  primaryObjective: { type: 'destroyAll', label: 'Break through the heavy armor line' },
  secondaryObjectives: [
    { id: 'underTime', type: 'underTime', seconds: 130, label: 'Finish under 130 seconds' }
  ],
  rankThresholds: { scoreTarget: 4600, timeTarget: 130 },
  tutorialPrompts: [tutorialPrompt('orbRoute', 'ROUTE POWER TO THE ORB'), tutorialPrompt('armor', 'HEAVY ARMOR REQUIRES PIERCING OR OVERCHARGE')],
  musicVariant: 'active'
});

// ---- Stage 5: System Access --------------------------------------------------
STAGES.push({
  id: 5,
  name: 'System Access',
  subtitle: 'Shielded systems',
  backgroundVariant: 'violet',
  containmentCharges: 3,
  powerRoutingRules: { enabled: true },
  componentLayout: [
    ...buildGrid(3, 7, (r, c) => ({ type: 'structural' }), { startY: 96 }),
    { id: 'shieldNodeL', type: 'shieldNode', x: colX(1, 7), y: rowY(4, 96), width: 40, height: 20, objectiveTag: 'shieldNode' },
    { id: 'shieldNodeR', type: 'shieldNode', x: colX(5, 7), y: rowY(4, 96), width: 40, height: 20, objectiveTag: 'shieldNode' },
    ...buildGrid(2, 3, (r, c) => ({ type: 'reinforced', id: `protected_${r}_${c}` }), { startY: rowY(5, 96), width: 44 })
  ],
  shieldSystems: [
    { id: 'shieldWallL', nodeId: 'shieldNodeL', shape: 'wall', x1: colX(2, 7) - 20, y1: rowY(4.6, 96), x2: colX(2, 7) - 20, y2: rowY(6.4, 96), thickness: 6 },
    { id: 'shieldWallR', nodeId: 'shieldNodeR', shape: 'wall', x1: colX(4, 7) + 20, y1: rowY(4.6, 96), x2: colX(4, 7) + 20, y2: rowY(6.4, 96), thickness: 6 }
  ],
  hazards: [],
  primaryObjective: { type: 'destroyAllOfType', componentType: 'shieldNode', label: 'Disable both shield nodes' },
  secondaryObjectives: [
    { id: 'noOrbLoss', type: 'noOrbLoss', label: 'Lose no containment charges' }
  ],
  rankThresholds: { scoreTarget: 4200, timeTarget: 140 },
  tutorialPrompts: [tutorialPrompt('reactorControl', 'REACTOR CONTROL DISABLES DEFENSE SYSTEMS')],
  musicVariant: 'active'
});

// ---- Stage 6: Chain Reaction --------------------------------------------------
STAGES.push({
  id: 6,
  name: 'Chain Reaction',
  subtitle: 'Controlled detonation',
  backgroundVariant: 'orange',
  containmentCharges: 3,
  powerRoutingRules: { enabled: true },
  componentLayout: buildGrid(6, 7, (r, c) => {
    if ((r === 2 || r === 3) && (c === 2 || c === 4)) return { type: 'volatile' };
    return { type: 'structural' };
  }),
  shieldSystems: [],
  hazards: [],
  primaryObjective: { type: 'destroyAll', label: 'Clear the chamber with chain reactions' },
  secondaryObjectives: [
    { id: 'chainCombo', type: 'comboThreshold', count: 10, label: 'Reach a 10x combo' }
  ],
  rankThresholds: { scoreTarget: 5200, timeTarget: 120 },
  tutorialPrompts: [tutorialPrompt('volatile', 'VOLATILE CELLS CHAIN INTO NEARBY COMPONENTS')],
  musicVariant: 'active'
});

// ---- Stage 7: Conduit Failure --------------------------------------------------
STAGES.push({
  id: 7,
  name: 'Conduit Failure',
  subtitle: 'Cut the power lines',
  backgroundVariant: 'blue',
  containmentCharges: 3,
  powerRoutingRules: { enabled: true },
  componentLayout: [
    { id: 'conduitL', type: 'conduit', x: colX(1, 7), y: rowY(2, 96), width: 40, height: 16, connectionIds: ['shieldNode1'] },
    { id: 'conduitR', type: 'conduit', x: colX(5, 7), y: rowY(2, 96), width: 40, height: 16, connectionIds: ['shieldNode2'] },
    { id: 'shieldNode1', type: 'shieldNode', x: colX(2, 7), y: rowY(4, 96), width: 40, height: 20, objectiveTag: 'shieldNode' },
    { id: 'shieldNode2', type: 'shieldNode', x: colX(4, 7), y: rowY(4, 96), width: 40, height: 20, objectiveTag: 'shieldNode' },
    ...buildGrid(3, 7, (r, c) => ({ type: 'structural' }), { startY: rowY(5, 96) })
  ],
  shieldSystems: [
    { id: 'shieldWall1', nodeId: 'shieldNode1', shape: 'wall', x1: colX(2, 7) - 24, y1: rowY(4.6, 96), x2: colX(2, 7) + 24, y2: rowY(4.6, 96), thickness: 6 },
    { id: 'shieldWall2', nodeId: 'shieldNode2', shape: 'wall', x1: colX(4, 7) - 24, y1: rowY(4.6, 96), x2: colX(4, 7) + 24, y2: rowY(4.6, 96), thickness: 6 }
  ],
  hazards: [],
  primaryObjective: { type: 'destroyAll', label: 'Sever the conduits and clear the chamber' },
  secondaryObjectives: [
    { id: 'destroyConduits', type: 'destroyTagged', tag: 'conduit', label: 'Destroy both conduits first' }
  ],
  rankThresholds: { scoreTarget: 5400, timeTarget: 140 },
  tutorialPrompts: [tutorialPrompt('conduit', 'DESTROYING A CONDUIT DISABLES ITS CONNECTED SHIELD')],
  musicVariant: 'active'
});
// tag the conduits for the secondary objective above
STAGES[6].componentLayout[0].objectiveTag = 'conduit';
STAGES[6].componentLayout[1].objectiveTag = 'conduit';

// ---- Stage 8: Phase Cycle --------------------------------------------------
STAGES.push({
  id: 8,
  name: 'Phase Cycle',
  subtitle: 'Timed solidity',
  backgroundVariant: 'teal',
  containmentCharges: 3,
  powerRoutingRules: { enabled: true },
  componentLayout: buildGrid(6, 7, (r, c) => {
    if ((r + c) % 4 === 0) {
      return { type: 'phase', behaviorConfig: { cycleDuration: 3, warnDuration: 0.6, phaseOffset: (r + c) * 0.3 } };
    }
    return { type: 'structural' };
  }),
  shieldSystems: [],
  hazards: [],
  primaryObjective: { type: 'destroyAll', label: 'Clear the chamber' },
  secondaryObjectives: [
    { id: 'underTime', type: 'underTime', seconds: 150, label: 'Finish under 150 seconds' }
  ],
  rankThresholds: { scoreTarget: 5600, timeTarget: 150 },
  tutorialPrompts: [tutorialPrompt('phase', 'PHASE PLATES FLASH BEFORE THEY TURN INTANGIBLE')],
  musicVariant: 'active'
});

// ---- Stage 9: Rotating Assembly --------------------------------------------
STAGES.push({
  id: 9,
  name: 'Rotating Assembly',
  subtitle: 'Moving reflectors',
  backgroundVariant: 'violet',
  containmentCharges: 3,
  powerRoutingRules: { enabled: true },
  componentLayout: [
    { id: 'reflectorA', type: 'reflector', x: colX(1.5, 7), y: rowY(3, 96), width: 60, height: 12, movementPattern: 'rotate', behaviorConfig: { speed: 0.8 } },
    { id: 'reflectorB', type: 'reflector', x: colX(5, 7), y: rowY(3, 96), width: 60, height: 12, movementPattern: 'rotate', behaviorConfig: { speed: -0.8 } },
    ...buildGrid(4, 7, (r, c) => ({ type: (r + c) % 3 === 0 ? 'reinforced' : 'structural' }), { startY: rowY(5, 96) })
  ],
  shieldSystems: [],
  hazards: [],
  primaryObjective: { type: 'destroyAll', label: 'Clear the chamber around the rotors' },
  secondaryObjectives: [
    { id: 'noOrbLoss', type: 'noOrbLoss', label: 'Lose no containment charges' }
  ],
  rankThresholds: { scoreTarget: 5000, timeTarget: 150 },
  tutorialPrompts: [tutorialPrompt('rotor', 'ROTATING REFLECTORS REDIRECT THE ORB')],
  musicVariant: 'active'
});

// ---- Stage 10: Corruption Event --------------------------------------------
STAGES.push({
  id: 10,
  name: 'Corruption Event',
  subtitle: 'Priority targeting',
  backgroundVariant: 'red',
  containmentCharges: 3,
  powerRoutingRules: { enabled: true },
  componentLayout: [
    {
      id: 'corruptionSeed',
      type: 'corruption',
      x: colX(3, 7),
      y: rowY(2, 96),
      width: 40,
      height: 18,
      behaviorConfig: {
        spreadInterval: 5,
        spreadTargets: [
          { x: colX(2, 7), y: rowY(2, 96) },
          { x: colX(4, 7), y: rowY(2, 96) },
          { x: colX(3, 7), y: rowY(3, 96) }
        ]
      }
    },
    ...buildGrid(5, 7, (r, c) => (r === 0 && c === 3 ? null : { type: 'structural' }), { startY: rowY(2.9, 96) })
  ],
  shieldSystems: [],
  hazards: [],
  primaryObjective: { type: 'destroyAllOfType', componentType: 'corruption', label: 'Destroy every corruption node' },
  secondaryObjectives: [
    { id: 'underTime', type: 'underTime', seconds: 150, label: 'Contain the spread quickly' }
  ],
  rankThresholds: { scoreTarget: 5400, timeTarget: 150 },
  tutorialPrompts: [tutorialPrompt('corruption', 'CORRUPTION SPREADS ON A TIMER — DESTROY IT FIRST')],
  musicVariant: 'tense'
});

// ---- Stage 11: Split Containment --------------------------------------------
STAGES.push({
  id: 11,
  name: 'Split Containment',
  subtitle: 'Two objective zones',
  backgroundVariant: 'blue',
  containmentCharges: 3,
  powerRoutingRules: { enabled: true },
  componentLayout: [
    { id: 'gateConduit', type: 'conduit', x: colX(3, 7), y: rowY(2, 96), width: 40, height: 16, connectionIds: ['gateShieldNode'], objectiveTag: 'gate' },
    { id: 'gateShieldNode', type: 'shieldNode', x: colX(3, 7), y: rowY(3.4, 96), width: 30, height: 16 },
    ...buildGrid(5, 3, (r, c) => ({ type: 'structural', id: `zoneA_${r}_${c}` }), { startY: rowY(4.2, 96), width: 40 }),
    ...buildGrid(5, 3, (r, c) => ({ type: 'reinforced', id: `zoneB_${r}_${c}`, objectiveTag: 'zoneB' }), { startY: rowY(4.2, 96), width: 40 })
  ],
  shieldSystems: [
    { id: 'gateWall', nodeId: 'gateShieldNode', shape: 'wall', x1: colX(3.5, 7), y1: rowY(3.9, 96), x2: colX(3.5, 7), y2: rowY(8.6, 96), thickness: 6 }
  ],
  hazards: [],
  primaryObjective: { type: 'destroyAll', label: 'Breach both containment zones' },
  secondaryObjectives: [
    { id: 'zoneBFirst', type: 'destroyTagged', tag: 'zoneB', label: 'Clear zone B' }
  ],
  rankThresholds: { scoreTarget: 6200, timeTarget: 170 },
  tutorialPrompts: [tutorialPrompt('gate', 'DESTROY THE CONDUIT TO OPEN THE DIVIDING GATE')],
  musicVariant: 'active'
});
// Shift zoneB grid to the right half of the chamber.
for (const c of STAGES[10].componentLayout) {
  if (c.id?.startsWith('zoneB_')) c.x += 210;
}
for (const c of STAGES[10].componentLayout) {
  if (c.id?.startsWith('zoneA_')) c.x -= 60;
}

// ---- Stage 12: Cascade Chamber --------------------------------------------
STAGES.push({
  id: 12,
  name: 'Cascade Chamber',
  subtitle: 'Everything at once',
  backgroundVariant: 'orange',
  containmentCharges: 3,
  powerRoutingRules: { enabled: true },
  componentLayout: [
    { id: 'cascadeConduit', type: 'conduit', x: colX(1, 7), y: rowY(1.5, 90), width: 40, height: 16, connectionIds: ['cascadeShieldNode'], objectiveTag: 'conduit' },
    { id: 'cascadeShieldNode', type: 'shieldNode', x: colX(5, 7), y: rowY(1.5, 90), width: 40, height: 18 },
    { id: 'movingShield', type: 'reflector', x: colX(3, 7), y: rowY(3, 90), width: 70, height: 12, movementPattern: 'slide', behaviorConfig: { speed: 1.1, range: 140 } },
    ...buildGrid(4, 7, (r, c) => {
      if (r === 1 && (c === 1 || c === 5)) return { type: 'volatile' };
      return { type: (r + c) % 3 === 0 ? 'reinforced' : 'structural' };
    }, { startY: rowY(4.3, 90) })
  ],
  shieldSystems: [
    { id: 'cascadeWall', nodeId: 'cascadeShieldNode', shape: 'wall', x1: colX(5.5, 7), y1: rowY(1.9, 90), x2: colX(5.5, 7), y2: rowY(3.6, 90), thickness: 6 }
  ],
  hazards: [{ type: 'debris', x: colX(2, 7), y: 40, interval: 4.5, spread: 200 }],
  primaryObjective: { type: 'destroyAll', label: 'Clear the cascade chamber' },
  secondaryObjectives: [
    { id: 'allVolatile', type: 'allVolatileDestroyed', label: 'Destroy all volatile cells' }
  ],
  rankThresholds: { scoreTarget: 7000, timeTarget: 190 },
  tutorialPrompts: [],
  musicVariant: 'tense'
});

// ---- Stage 13: Precision Test (challenge) -----------------------------------
STAGES.push({
  id: 13,
  name: 'Precision Test',
  subtitle: 'Narrow targets',
  backgroundVariant: 'teal',
  containmentCharges: 3,
  powerRoutingRules: { enabled: true },
  componentLayout: buildGrid(7, 9, (r, c) => (
    (r + c) % 2 === 0 ? { type: 'structural' } : null
  ), { width: 30 }),
  shieldSystems: [],
  hazards: [],
  deflectorSettings: { catchCharges: 3 },
  primaryObjective: { type: 'destroyAll', label: 'Clear the precision lattice' },
  secondaryObjectives: [
    { id: 'noOrbLoss', type: 'noOrbLoss', label: 'Lose no containment charges' },
    { id: 'underTime', type: 'underTime', seconds: 160, label: 'Finish under 160 seconds' }
  ],
  rankThresholds: { scoreTarget: 6800, timeTarget: 160 },
  tutorialPrompts: [],
  musicVariant: 'tense'
});

// ---- Stage 14: Energy Economy (challenge) -----------------------------------
STAGES.push({
  id: 14,
  name: 'Energy Economy',
  subtitle: 'Spend wisely',
  backgroundVariant: 'blue',
  containmentCharges: 3,
  powerRoutingRules: { enabled: true, channelCapacity: 48 },
  powerUpDropChance: 0.02,
  componentLayout: buildGrid(6, 7, (r, c) => ({
    type: 'structural',
    energyDrop: 1
  })),
  shieldSystems: [],
  hazards: [],
  primaryObjective: { type: 'destroyAll', label: 'Clear the chamber on a tight energy budget' },
  secondaryObjectives: [
    { id: 'energyPercent', type: 'energyPercent', percent: 0.8, label: 'Collect 80% of released energy' }
  ],
  rankThresholds: { scoreTarget: 5200, timeTarget: 160 },
  tutorialPrompts: [],
  musicVariant: 'tense'
});

// ---- Stage 15: Thermal Runaway (challenge) ----------------------------------
STAGES.push({
  id: 15,
  name: 'Thermal Runaway',
  subtitle: 'Rising heat, timed exposure',
  backgroundVariant: 'orange',
  containmentCharges: 3,
  powerRoutingRules: { enabled: true },
  componentLayout: [
    { id: 'coreRelay1', type: 'conduit', x: colX(2, 7), y: rowY(2, 96), width: 40, height: 16, objectiveTag: 'relay' },
    { id: 'coreRelay2', type: 'conduit', x: colX(4, 7), y: rowY(2, 96), width: 40, height: 16, objectiveTag: 'relay' },
    ...buildGrid(4, 7, (r, c) => ({ type: (r + c) % 3 === 0 ? 'reinforced' : 'structural' }), { startY: rowY(3.3, 96) })
  ],
  shieldSystems: [],
  hazards: [
    { type: 'heatZone', x: 40, y: 500, width: 400, height: 60 },
    { type: 'turret', x: colX(0.5, 7), y: 60, interval: 3.2 },
    { type: 'turret', x: colX(6.5, 7), y: 60, interval: 3.2 }
  ],
  primaryObjective: { type: 'destroyTagged', tag: 'relay', label: 'Destroy both cooling relays before overload' },
  secondaryObjectives: [
    { id: 'underTime', type: 'underTime', seconds: 150, label: 'Stabilize under 150 seconds' }
  ],
  rankThresholds: { scoreTarget: 5600, timeTarget: 150 },
  tutorialPrompts: [tutorialPrompt('heat', 'HEAT ZONES ACCELERATE THE ORB')],
  musicVariant: 'tense'
});

// ---- Stage 16: Zero Margin (challenge) --------------------------------------
STAGES.push({
  id: 16,
  name: 'Zero Margin',
  subtitle: 'One charge. Pure execution.',
  backgroundVariant: 'red',
  containmentCharges: 1,
  powerRoutingRules: { enabled: true },
  componentLayout: buildGrid(7, 8, (r, c) => ({ type: (r + c) % 4 === 0 ? 'reinforced' : 'structural' }), { width: 34 }),
  shieldSystems: [],
  hazards: [],
  primaryObjective: { type: 'destroyAll', label: 'Clear the chamber without losing containment' },
  secondaryObjectives: [
    { id: 'comboThreshold', type: 'comboThreshold', count: 15, label: 'Reach a 15x combo' }
  ],
  rankThresholds: { scoreTarget: 8000, timeTarget: 170 },
  tutorialPrompts: [tutorialPrompt('zeroMargin', 'ONLY ONE CONTAINMENT CHARGE REMAINS')],
  musicVariant: 'tense'
});

// ---- Stage 17: Defense Matrix (BOSS) ----------------------------------------
STAGES.push({
  id: 17,
  name: 'Defense Matrix',
  subtitle: 'First guardian',
  backgroundVariant: 'violet',
  containmentCharges: 3,
  powerRoutingRules: { enabled: true },
  isBoss: true,
  componentLayout: [
    { id: 'outerShield1', type: 'shieldNode', x: colX(0.8, 7), y: rowY(1.5, 90), width: 40, height: 18, objectiveTag: 'outerShield' },
    { id: 'outerShield2', type: 'shieldNode', x: colX(5.2, 7), y: rowY(1.5, 90), width: 40, height: 18, objectiveTag: 'outerShield' },
    { id: 'outerShield3', type: 'shieldNode', x: colX(0.8, 7), y: rowY(3, 90), width: 40, height: 18, objectiveTag: 'outerShield' },
    { id: 'outerShield4', type: 'shieldNode', x: colX(5.2, 7), y: rowY(3, 90), width: 40, height: 18, objectiveTag: 'outerShield' },
    { id: 'rotWeak1', type: 'reinforced', x: colX(2, 7), y: rowY(4.4, 90), width: 34, height: 18, objectiveTag: 'rotatingWeak', movementPattern: 'orbit', behaviorConfig: { radius: 70, speed: 0.6 } },
    { id: 'rotWeak2', type: 'reinforced', x: colX(4, 7), y: rowY(4.4, 90), width: 34, height: 18, objectiveTag: 'rotatingWeak', movementPattern: 'orbit', behaviorConfig: { radius: 70, speed: -0.6 } },
    { id: 'turretMount1', type: 'reinforced', x: colX(1, 7), y: rowY(6, 90), width: 36, height: 18, objectiveTag: 'turretMount' },
    { id: 'turretMount2', type: 'reinforced', x: colX(5, 7), y: rowY(6, 90), width: 36, height: 18, objectiveTag: 'turretMount' },
    { id: 'bossCore', type: 'coreSegment', x: colX(3, 7), y: rowY(2.2, 90), width: 56, height: 26, objectiveTag: 'bossCore' }
  ],
  shieldSystems: [
    { id: 'bossCoreShield', nodeId: null, shape: 'ring', cx: colX(3, 7), cy: rowY(2.2, 90), radius: 40, thickness: 8 }
  ],
  hazards: [
    { type: 'turret', x: colX(1, 7), y: 40, interval: 3.5 },
    { type: 'turret', x: colX(5, 7), y: 40, interval: 3.5 }
  ],
  bossConfiguration: { bossKey: 'defenseMatrix' },
  primaryObjective: { type: 'defeatBoss', label: 'Destroy the Defense Matrix' },
  secondaryObjectives: [
    { id: 'noOrbLoss', type: 'noOrbLoss', label: 'Lose no containment charges' }
  ],
  rankThresholds: { scoreTarget: 12000, timeTarget: 280 },
  tutorialPrompts: [tutorialPrompt('boss1', 'DEFENSE MATRIX DETECTED — BREACH EACH DEFENSE LAYER')],
  musicVariant: 'boss'
});

// ---- Stage 18: Final Reactor (BOSS) -----------------------------------------
STAGES.push({
  id: 18,
  name: 'Final Breach',
  subtitle: 'The reactor core',
  backgroundVariant: 'red',
  containmentCharges: 3,
  powerRoutingRules: { enabled: true },
  isBoss: true,
  componentLayout: [
    { id: 'armor1', type: 'heavyArmor', x: colX(1, 7), y: rowY(1.5, 90), width: 40, height: 20, objectiveTag: 'outerArmor' },
    { id: 'armor2', type: 'heavyArmor', x: colX(5, 7), y: rowY(1.5, 90), width: 40, height: 20, objectiveTag: 'outerArmor' },
    { id: 'armorConduit1', type: 'conduit', x: colX(3, 7), y: rowY(1.5, 90), width: 36, height: 16, objectiveTag: 'outerArmor' },
    { id: 'phaseWeak1', type: 'phase', x: colX(2, 7), y: rowY(3.2, 90), width: 40, height: 18, objectiveTag: 'phaseWeak', behaviorConfig: { cycleDuration: 2.6, warnDuration: 0.6 } },
    { id: 'phaseWeak2', type: 'phase', x: colX(4, 7), y: rowY(3.2, 90), width: 40, height: 18, objectiveTag: 'phaseWeak', behaviorConfig: { cycleDuration: 2.6, warnDuration: 0.6, phaseOffset: 1.3 } },
    {
      id: 'corruptionCore1',
      type: 'corruption',
      x: colX(3, 7),
      y: rowY(4.6, 90),
      width: 40,
      height: 18,
      objectiveTag: 'corruptionNode',
      behaviorConfig: {
        spreadInterval: 6,
        spreadTargets: [
          { x: colX(2, 7), y: rowY(4.6, 90) },
          { x: colX(4, 7), y: rowY(4.6, 90) }
        ]
      }
    },
    { id: 'bossCore', type: 'coreSegment', x: colX(3, 7), y: rowY(2.4, 90), width: 60, height: 28, objectiveTag: 'bossCore' }
  ],
  shieldSystems: [
    { id: 'bossCoreShield', nodeId: null, shape: 'ring', cx: colX(3, 7), cy: rowY(2.4, 90), radius: 42, thickness: 8 }
  ],
  hazards: [
    { type: 'debris', x: colX(3, 7), y: 30, interval: 3.4, spread: 260 }
  ],
  bossConfiguration: { bossKey: 'finalReactor' },
  primaryObjective: { type: 'defeatBoss', label: 'Destroy the Final Reactor core' },
  secondaryObjectives: [
    { id: 'noOrbLoss', type: 'noOrbLoss', label: 'Lose no containment charges' }
  ],
  rankThresholds: { scoreTarget: 15000, timeTarget: 340 },
  tutorialPrompts: [tutorialPrompt('boss2', 'FINAL REACTOR — SURVIVE THE OVERLOAD SEQUENCE')],
  musicVariant: 'boss'
});

export const STAGE_COUNT = STAGES.length;

export function getStage(id) {
  return STAGES.find((s) => s.id === id) || null;
}

export function getAllStages() {
  return STAGES;
}

export function isBossStage(id) {
  return !!getStage(id)?.isBoss;
}
