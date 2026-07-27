import { createWreck } from './wrecks.js';
import { createSalvage } from './tractor.js';

// Deterministic PRNG (mulberry32) so each contract's debris layout is fixed and
// replayable — "handcrafted" at the design level (composition/counts/hazards/quota
// are authored per mission below) while placement is seeded rather than hand-plotted
// pixel-by-pixel.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MISSIONS = [
  {
    id: 1, name: 'First Salvage', background: 'earth_orbit',
    brief: 'Basic recovery run. Break the small hull sections, collect metal, reach the gate.',
    world: { w: 1900, h: 1400 }, quota: 8, timer: null,
    wrecks: [{ kind: 'hull_section', count: 6 }],
    optional: [
      { id: 'no_damage', label: 'Complete with no hull damage' },
      { id: 'fast', label: 'Finish in under 90 seconds', time: 90 },
    ],
    rank: { 'S+': 3200, S: 2400, A: 1600, B: 900 },
  },
  {
    id: 2, name: 'Wider Field', background: 'earth_orbit',
    brief: 'More wreckage, more ground to cover. Watch your fuel — er, momentum.',
    world: { w: 2200, h: 1600 }, quota: 14, timer: null,
    wrecks: [{ kind: 'hull_section', count: 10 }],
    optional: [
      { id: 'no_damage', label: 'Complete with no hull damage' },
      { id: 'all_wrecks', label: 'Destroy every wreck' },
    ],
    rank: { 'S+': 5200, S: 3900, A: 2600, B: 1500 },
  },
  {
    id: 3, name: 'Cargo Run', background: 'dead_station',
    brief: 'Cargo Modules carry the good stuff, but they take a beating to crack open.',
    world: { w: 2300, h: 1700 }, quota: 18, timer: null,
    wrecks: [{ kind: 'hull_section', count: 6 }, { kind: 'cargo_module', count: 4 }],
    optional: [
      { id: 'no_damage', label: 'Complete with no hull damage' },
      { id: 'rare_all', label: 'Collect every rare component' },
    ],
    rank: { 'S+': 6800, S: 5200, A: 3600, B: 2000 },
  },
  {
    id: 4, name: 'Beam Discipline', background: 'dead_station',
    brief: 'Most of this haul is Technology and Energy — none of it comes to you for free. Use the beam.',
    world: { w: 2200, h: 1700 }, quota: 20, timer: null,
    wrecks: [{ kind: 'cargo_module', count: 5 }, { kind: 'satellite_array', count: 2 }],
    optional: [
      { id: 'no_damage', label: 'Complete with no hull damage' },
      { id: 'fast', label: 'Finish in under 150 seconds', time: 150 },
    ],
    rank: { 'S+': 7600, S: 5800, A: 4000, B: 2200 },
  },
  {
    id: 5, name: 'Flashpoint', background: 'asteroid_graveyard',
    brief: 'Fuel Tanks are unstable. Pop them from a distance or don’t pop them at all.',
    world: { w: 2400, h: 1800 }, quota: 16, timer: null,
    wrecks: [{ kind: 'hull_section', count: 6 }, { kind: 'fuel_tank', count: 5 }],
    optional: [
      { id: 'no_damage', label: 'Complete with no hull damage' },
      { id: 'all_wrecks', label: 'Destroy every wreck' },
    ],
    rank: { 'S+': 6400, S: 4800, A: 3200, B: 1800 },
  },
  {
    id: 6, name: 'Heavy Haul', background: 'asteroid_graveyard',
    brief: 'Company wants a big number this time. Big field, big quota.',
    world: { w: 2800, h: 2000 }, quota: 30, timer: null,
    wrecks: [{ kind: 'hull_section', count: 12 }, { kind: 'cargo_module', count: 6 }, { kind: 'fuel_tank', count: 3 }],
    optional: [
      { id: 'no_damage', label: 'Complete with no hull damage' },
      { id: 'fast', label: 'Finish in under 210 seconds', time: 210 },
    ],
    rank: { 'S+': 11000, S: 8500, A: 6000, B: 3400 },
  },
  {
    id: 7, name: 'Live Reactor', background: 'shipyard',
    brief: 'First reactor core on site. Damage arms it — once it’s counting down, clear the area.',
    world: { w: 2600, h: 1900 }, quota: 22, timer: null,
    wrecks: [{ kind: 'hull_section', count: 8 }, { kind: 'cargo_module', count: 4 }, { kind: 'reactor_core', count: 1 }],
    optional: [
      { id: 'no_damage', label: 'Complete with no hull damage' },
      { id: 'no_reactor', label: 'Complete with no reactor explosions' },
    ],
    rank: { 'S+': 9000, S: 7000, A: 4800, B: 2800 },
  },
  {
    id: 8, name: 'Array Sweep', background: 'shipyard',
    brief: 'Satellite Arrays tumble unpredictably. Lead your shots.',
    world: { w: 2600, h: 2000 }, quota: 24, timer: null,
    wrecks: [{ kind: 'satellite_array', count: 5 }, { kind: 'hull_section', count: 6 }, { kind: 'reactor_core', count: 1 }],
    optional: [
      { id: 'no_damage', label: 'Complete with no hull damage' },
      { id: 'rare_all', label: 'Collect every rare component' },
    ],
    rank: { 'S+': 9600, S: 7400, A: 5200, B: 3000 },
  },
  {
    id: 9, name: 'Crowded Sky', background: 'jovian_orbit',
    brief: 'Dense field, fast Crystal Debris, sharp edges everywhere. Stay sharp yourself.',
    world: { w: 2900, h: 2200 }, quota: 28, timer: null,
    wrecks: [{ kind: 'hull_section', count: 10 }, { kind: 'crystal_debris', count: 8 }, { kind: 'fuel_tank', count: 3 }, { kind: 'reactor_core', count: 1 }],
    optional: [
      { id: 'no_damage', label: 'Complete with no hull damage' },
      { id: 'all_wrecks', label: 'Destroy every wreck' },
    ],
    rank: { 'S+': 10800, S: 8200, A: 5600, B: 3200 },
  },
  {
    id: 10, name: 'Hard Extraction', background: 'jovian_orbit',
    brief: 'Reactor instability is accelerating in this sector. Quota then gate, on the clock.',
    world: { w: 2600, h: 2000 }, quota: 26, timer: 210,
    wrecks: [{ kind: 'cargo_module', count: 6 }, { kind: 'satellite_array', count: 3 }, { kind: 'fuel_tank', count: 4 }, { kind: 'reactor_core', count: 1 }],
    optional: [
      { id: 'no_damage', label: 'Complete with no hull damage' },
      { id: 'fast', label: 'Finish with over 60 seconds remaining', time: 60 },
    ],
    rank: { 'S+': 10400, S: 8000, A: 5600, B: 3200 },
  },
  {
    id: 11, name: 'Twin Cores', background: 'nebula_edge',
    brief: 'Two live reactors on site. One goes off, the other likely follows. Plan your exit.',
    world: { w: 3000, h: 2300 }, quota: 30, timer: 240,
    wrecks: [{ kind: 'hull_section', count: 8 }, { kind: 'cargo_module', count: 5 }, { kind: 'crystal_debris', count: 6 }, { kind: 'reactor_core', count: 2 }],
    optional: [
      { id: 'no_damage', label: 'Complete with no hull damage' },
      { id: 'no_reactor', label: 'Complete with no reactor explosions' },
    ],
    rank: { 'S+': 12000, S: 9200, A: 6400, B: 3800 },
  },
  {
    id: 12, name: 'Final Operation', background: 'nebula_edge',
    brief: 'Everything the field has, all at once. Full quota, hard clock, three live reactors. Get the black boxes and get out.',
    world: { w: 3400, h: 2600 }, quota: 40, timer: 300,
    wrecks: [
      { kind: 'hull_section', count: 10 }, { kind: 'cargo_module', count: 7 }, { kind: 'fuel_tank', count: 5 },
      { kind: 'satellite_array', count: 4 }, { kind: 'crystal_debris', count: 7 }, { kind: 'reactor_core', count: 3 },
    ],
    optional: [
      { id: 'no_damage', label: 'Complete with no hull damage' },
      { id: 'rare_all', label: 'Collect every rare component' },
      { id: 'no_reactor', label: 'Complete with no reactor explosions' },
    ],
    rank: { 'S+': 18000, S: 14000, A: 9600, B: 5400 },
  },
];

export function getMissionDefs() {
  return MISSIONS;
}

export function getMissionDef(id) {
  return MISSIONS.find(m => m.id === id);
}

// Builds runtime state for a mission: wreck entities, extraction gate, quota, etc.
export function buildMissionRuntime(def) {
  const rng = mulberry32(def.id * 7919 + 13);
  const worldW = def.world.w, worldH = def.world.h;
  const centerX = worldW / 2, centerY = worldH / 2;
  const safeRadius = 260;

  const wrecks = [];
  for (const group of def.wrecks) {
    for (let i = 0; i < group.count; i++) {
      let x, y;
      let tries = 0;
      do {
        x = rng() * worldW;
        y = rng() * worldH;
        tries++;
      } while (Math.hypot(x - centerX, y - centerY) < safeRadius && tries < 20);
      wrecks.push(createWreck(group.kind, x, y, 0, {
        vx: (rng() - 0.5) * 30,
        vy: (rng() - 0.5) * 30,
        angle: rng() * Math.PI * 2,
      }));
    }
  }

  // Extraction gate placed opposite-ish the field center, far from spawn.
  const gateAngle = rng() * Math.PI * 2;
  const gateDist = Math.min(worldW, worldH) * 0.42;
  const gate = {
    x: (centerX + Math.cos(gateAngle) * gateDist + worldW) % worldW,
    y: (centerY + Math.sin(gateAngle) * gateDist + worldH) % worldH,
    radius: 70,
    active: false,
  };

  return {
    def,
    worldW, worldH,
    startX: centerX, startY: centerY,
    wrecks,
    salvage: [],
    gate,
    quota: def.quota,
    timer: def.timer,
    timeRemaining: def.timer || 0,
    elapsed: 0,
    cargoCollected: 0,
    cargoValue: 0,
    shotsFired: 0,
    shotsHit: 0,
    reactorExplosions: 0,
    hullDamageTaken: 0,
    rareCollected: 0,
    rareTotal: countRare(def),
    wrecksDestroyedTotal: 0,
    wrecksTotal: countTotalWrecks(def),
    blackboxCollected: 0,
    blackboxTotal: countBlackbox(def),
    combo: { mult: 1, timer: 0, killsInWindow: 0 },
    largestCombo: 1,
  };
}

function countTotalWrecks(def) {
  return def.wrecks.reduce((s, g) => s + g.count, 0);
}
function countRare(def) {
  // Estimate: cargo_module, crystal_debris and reactor_core can drop rare components.
  return def.wrecks.filter(g => ['cargo_module', 'crystal_debris', 'reactor_core'].includes(g.kind))
    .reduce((s, g) => s + g.count, 0);
}
function countBlackbox(def) {
  return def.wrecks.filter(g => g.kind === 'reactor_core').reduce((s, g) => s + g.count, 0);
}
