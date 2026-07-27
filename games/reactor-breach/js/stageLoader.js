import { CONFIG } from './config.js';
import { Deflector } from './deflector.js';
import { OrbManager } from './orbManager.js';
import { createComponentsFromLayout } from './components.js';
import { ConnectionGraph } from './connections.js';
import { ShieldSystem } from './shields.js';
import { HazardManager } from './hazards.js';
import { PowerUpManager } from './powerUps.js';
import { EnergyPacketManager } from './energyPackets.js';
import { PowerRouting } from './powerRouting.js';
import { AbilityController } from './abilities.js';
import { BossController } from './bosses.js';
import { ParticleSystem } from './particles.js';

const DEV_MODE = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';

export function validateStage(stage) {
  if (!DEV_MODE) return;
  const warn = (msg) => console.warn(`[stageLoader] Stage ${stage.id} (${stage.name}): ${msg}`);
  const ids = new Set();
  for (const c of stage.componentLayout || []) {
    if (ids.has(c.id)) warn(`Duplicate component id "${c.id}"`);
    ids.add(c.id);
    if (c.x == null || c.y == null) warn(`Component "${c.id}" missing position`);
  }
  for (const c of stage.componentLayout || []) {
    for (const targetId of c.connectionIds || []) {
      if (!ids.has(targetId)) warn(`Component "${c.id}" connects to missing id "${targetId}"`);
    }
  }
  for (const s of stage.shieldSystems || []) {
    if (s.nodeId && !ids.has(s.nodeId)) warn(`Shield "${s.id}" references missing node "${s.nodeId}"`);
  }
  if (!stage.primaryObjective) warn('Missing primaryObjective');
  if (stage.bossConfiguration) {
    for (const p of stage.bossConfiguration.def?.phases || []) {
      if (!p.tag) warn(`Boss phase "${p.id}" missing completion tag`);
    }
  }
  if (!stage.rankThresholds) warn('Missing rankThresholds (rank will use defaults)');
}

export class LoadedStage {
  constructor(stage, chamberWidth, chamberHeight) {
    validateStage(stage);
    this.stage = stage;
    this.chamberWidth = chamberWidth;
    this.chamberHeight = chamberHeight;

    this.deflector = new Deflector(chamberWidth, chamberHeight);
    if (stage.deflectorSettings?.width) this.deflector.baseWidth = stage.deflectorSettings.width;
    if (stage.deflectorSettings?.catchCharges != null) this.deflector.catchCharges = stage.deflectorSettings.catchCharges;
    if (stage.deflectorSettings?.durabilityEnabled) this.deflector.durabilityEnabled = true;
    this.deflector.width = this.deflector.baseWidth;

    this.orbManager = new OrbManager(chamberWidth, chamberHeight);
    this.components = createComponentsFromLayout(stage.componentLayout || []);
    this.connectionGraph = new ConnectionGraph(this.components);
    this.shields = new ShieldSystem(stage.shieldSystems || [], this.connectionGraph);
    this.hazards = new HazardManager(stage.hazards || [], chamberWidth, chamberHeight);
    this.powerUps = new PowerUpManager(chamberWidth, chamberHeight, stage.powerUpDropChance ?? 0.06);
    this.energyPackets = new EnergyPacketManager(chamberWidth, chamberHeight);
    this.routing = new PowerRouting(stage.powerRoutingRules || {});
    this.abilities = new AbilityController();
    this.particles = new ParticleSystem();
    this.boss = stage.bossConfiguration
      ? new BossController(stage.bossConfiguration.bossKey, this.components)
      : null;

    this.orbManager.spawnHeldOrb(this.deflector);
  }

  reset() {
    // Full stage restart (used by Restart Stage): rebuild everything fresh.
    return new LoadedStage(this.stage, this.chamberWidth, this.chamberHeight);
  }
}
