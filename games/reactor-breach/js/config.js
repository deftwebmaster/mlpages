// Centralized balance configuration. Do not scatter balance numbers elsewhere.
export const CONFIG = {
  version: '1.0.0',
  canvas: {
    width: 480,
    height: 800,
    maxPixelRatio: 2
  },
  deflector: {
    baseWidth: 84,
    height: 16,
    minWidth: 54,
    maxWidth: 150,
    widthTierBonus: 36,
    baseSpeed: 620,          // px/s
    acceleration: 5200,      // px/s^2
    friction: 3600,          // px/s^2 deceleration
    yOffset: 46,             // distance from bottom
    catchChargesDefault: 2,
    catchHoldMax: 3.0,       // seconds
    precisionSpeedMult: 1.35,
    durabilityMax: 100
  },
  orb: {
    radius: 8,
    baseSpeed: 300,
    minSpeed: 220,
    maxSpeed: 780,
    accelTierMult: 1.18,
    overchargeMult: 1.3,
    launchUpBias: -0.9,
    maxBounceAngleDeg: 68,   // clamp from vertical
    minVerticalSpeedRatio: 0.22,
    trailLength: 10,
    maxOrbs: 5,
    substepMaxDist: 6,       // px per substep for swept collision
    wallLoopBounceThreshold: 6, // consecutive near-horizontal bounces before correction
    pierceDefaultCharges: 3,
    explosiveRadius: 46
  },
  energy: {
    small: 1,
    medium: 3,
    large: 5,
    coreFragment: 10,
    packetFallSpeed: 140,
    packetGravity: 220
  },
  routing: {
    channelCapacity: 60,
    tierThresholds: [12, 26, 42, 60],
    overflowEfficiency: 0.5
  },
  abilities: {
    deflector: {
      expansionCost: 12,
      expansionDuration: 14,
      magneticChargeCost: 26,
      shieldCost: 42,
      shieldDuration: 10,
      precisionCost: 60,
      precisionDuration: 16
    },
    orb: {
      accelCost: 12,
      accelDuration: 12,
      pierceCost: 26,
      pierceCharges: 3,
      multiOrbCost: 42,
      overchargeCost: 60,
      overchargeDuration: 10
    },
    reactorControl: {
      scanCost: 12,
      scanDuration: 10,
      suppressionCost: 26,
      suppressionDuration: 8,
      dilationCost: 42,
      dilationDuration: 8,
      dilationFactor: 0.45,
      overrideCost: 60,
      overrideDuration: 6
    }
  },
  combo: {
    window: 2.5,
    thresholds: [0, 3, 6, 10, 15, 22],
    multipliers: [1, 1.5, 2, 3, 4, 5]
  },
  score: {
    structuralPlate: 50,
    reinforcedPlate: 125,
    shieldNode: 300,
    conduit: 250,
    volatileCell: 200,
    corruptionNode: 400,
    reflector: 0,
    coreSegment: 500,
    bossPhase: 2000,
    stageCompletion: 3000,
    energyUnit: 2,
    chargeRemainingBonus: 400
  },
  particles: {
    maxParticles: 220,
    maxParticlesReduced: 80
  },
  audio: {
    masterVolume: 0.8,
    sfxVolume: 0.9,
    musicVolume: 0.4
  },
  haptics: {
    contact: 8,
    catch: 12,
    explosion: 30,
    orbLoss: 40,
    ability: 14,
    complete: [20, 40, 20]
  },
  rank: {
    // weighted score 0-100 -> rank
    thresholds: { splus: 95, s: 85, a: 70, b: 50 }
  },
  hazards: {
    debrisFallSpeed: 160,
    turretProjectileSpeed: 180,
    heatSpeedMult: 1.25,
    gravityWellStrength: 2600
  },
  containmentChargesDefault: 3
};

export const STORAGE_PREFIX = 'reactorBreach_';
