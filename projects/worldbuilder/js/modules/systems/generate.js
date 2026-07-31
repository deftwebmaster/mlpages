import { createSeededRandom, deriveSeed, deterministicCreatedAt, hashString, slug } from "../../shared/random.js";

const SYSTEM_TYPES = [
  { value: "single-star", weight: 38 },
  { value: "binary", weight: 18 },
  { value: "red-dwarf", weight: 18 },
  { value: "sunlike", weight: 12 },
  { value: "young-stellar", weight: 4 },
  { value: "old-metal-poor", weight: 3 },
  { value: "white-dwarf-remnant", weight: 2 },
  { value: "trinary", weight: 2 },
  { value: "artificially-stabilized", weight: 1 },
  { value: "pulsar", weight: 1 },
  { value: "anomalous", weight: 1 }
];

const SYSTEM_CORES = "Meridian Orison Vesper Caligo Harlow Ilyra Blackglass Kepler Sato Asterion Kestrel Nadir Redhook Canto Viridian Tharsis Bellamy Cygni Farpoint Aurelian".split(" ");
const BODY_NAMES = "Orison Vesper Caligo Aster Lumen Tolland Rena Amina Sato Veyra Prosperity Endeavor Continuance Yield Mneme Pale Harbor Glassfall Icarus Nereid".split(" ");
const REGIONS = ["Inner Perseus Corridor", "Meridian Reach", "Crown Drift", "Farpoint Margin", "Helios Spur", "Outer Transit Veil"];
const INDUSTRIES = ["Mining", "Fuel production", "Shipbuilding", "Agriculture", "Biotechnology", "Research", "Military logistics", "Transit services", "Data storage", "Habitat construction", "Finance", "Terraforming"];
const AUTHORITIES = ["System Assembly", "Colonial Administration", "Habitat Compact", "Transit Authority", "Defense Protectorate", "Charter Council", "Corporate Jurisdiction"];

export function generateStarSystem(seed, constraints = {}) {
  const root = createSeededRandom(seed);
  const starRng = root.derive("star");
  const bodiesRng = root.derive("bodies");
  const civRng = root.derive("civilization");
  const politicsRng = root.derive("politics");
  const economyRng = root.derive("economy");
  const hazardRng = root.derive("hazards");

  const systemType = constraints.systemType && constraints.systemType !== "random"
    ? constraints.systemType
    : starRng.weighted(SYSTEM_TYPES);
  const civilizationLevel = constraints.civilizationLevel && constraints.civilizationLevel !== "random"
    ? constraints.civilizationLevel
    : civRng.pick(["frontier", "developing", "mature interplanetary", "dense system civilization", "declining or ruined"]);
  const tone = constraints.tone && constraints.tone !== "random"
    ? constraints.tone
    : root.pick(["grounded", "frontier", "tense", "prosperous", "austere", "strange"]);
  const name = makeSystemName(root, systemType);
  const stars = makeStars(starRng, name, systemType);
  const orbitalBodies = makeBodies(bodiesRng, seed, name, stars[0], civilizationLevel);
  const settlements = makeSettlements(civRng, seed, orbitalBodies, civilizationLevel);
  const stations = makeStations(civRng.derive("stations"), seed, orbitalBodies, civilizationLevel);
  const factions = makeFactions(politicsRng, name, settlements, civilizationLevel);
  const economy = makeEconomy(economyRng, orbitalBodies, civilizationLevel, tone);
  const infrastructure = makeInfrastructure(civRng.derive("infrastructure"), orbitalBodies, stations, economy);
  const routes = makeRoutes(civRng.derive("routes"), settlements, stations, economy);
  const hazards = makeHazards(hazardRng, orbitalBodies, stations, systemType, civilizationLevel);
  const importantOrganizations = makeImportantOrganizations(economyRng.derive("organizations"), seed, name, economy, settlements);
  const history = makeHistory(root.derive("history"), name, settlements, factions, civilizationLevel);
  const tensions = makeTensions(root.derive("tensions"), orbitalBodies, factions, hazards, economy);
  const storyHooks = makeStoryHooks(root.derive("hooks"), name, tensions, hazards, importantOrganizations);
  const population = settlements.reduce((sum, item) => sum + item.population, 0) + stations.reduce((sum, item) => sum + item.population, 0);
  const accentColor = root.pick(["#76d5d7", "#d6b45e", "#9ecf8f", "#d88972", "#a6b7ff", "#e0d1a6"]);

  return {
    id: `system_${hashString(seed).toString(36)}`,
    entityType: "star-system",
    seed,
    name,
    catalogNumber: `FA-SYS-${root.int(1000, 9999)}`,
    createdAt: deterministicCreatedAt(seed),
    updatedAt: deterministicCreatedAt(`${seed}:updated`),
    classification: {
      systemType,
      settlementStatus: settlementStatus(civilizationLevel),
      strategicValue: root.pick(["low", "moderate", "high", "critical"]),
      explorationStatus: root.pick(["partially charted", "fully charted", "restricted survey", "recently reopened"]),
      jurisdictionType: politicsRng.pick(["unified", "contested", "corporate", "federal", "fragmented"]),
      technologicalEra: constraints.technologyLevel || "mature interplanetary",
      tone
    },
    position: {
      region: root.pick(REGIONS),
      sector: `${root.pick(SYSTEM_CORES)} Sector`,
      coordinates: {
        x: root.float(-60, 60, 1),
        y: root.float(-60, 60, 1),
        z: root.float(-60, 60, 1)
      },
      distanceFromReference: root.float(4, 82, 1)
    },
    stars,
    orbitalBodies,
    settlements,
    stations,
    routes,
    factions,
    economy,
    infrastructure,
    hazards,
    importantOrganizations,
    history,
    tensions,
    storyHooks,
    relationships: [],
    metrics: {
      population,
      inhabitedBodies: orbitalBodies.filter(body => body.civilization.population > 0).length,
      tradeVolume: scoreFor(civilizationLevel, economyRng),
      instability: scoreFor(tone === "tense" ? "dense system civilization" : civilizationLevel, hazardRng),
      habitability: Math.round(orbitalBodies.reduce((sum, body) => sum + body.environment.habitabilityScore, 0) / orbitalBodies.length),
      strategicImportance: root.int(28, 96)
    },
    presentation: {
      accentColor,
      mapStyle: "technical-cartographic",
      emblemStyle: "stellar-seal"
    },
    favorite: false,
    tags: [systemType, slug(civilizationLevel), tone],
    notes: ""
  };
}

function makeSystemName(rand, type) {
  if (type === "red-dwarf" && rand.maybe(0.45)) return `${rand.pick(["CN", "TR", "LHS"])}-${rand.int(100, 9999)}`;
  const core = rand.pick(SYSTEM_CORES);
  return rand.pick([`${core} System`, `${core}'s Star`, `Saint ${core}`, `Tau ${core}`, `The ${core} Archive`]);
}

function makeStars(rand, systemName, type) {
  const count = type === "binary" ? 2 : type === "trinary" ? 3 : 1;
  return Array.from({ length: count }, (_, index) => {
    const profile = starProfile(rand, type, index);
    return {
      id: `star_${index + 1}`,
      name: count === 1 ? systemName.replace(/ System$/, "") : `${systemName.replace(/ System$/, "")} ${String.fromCharCode(65 + index)}`,
      ...profile,
      habitableZoneAU: [Number(Math.sqrt(profile.luminosity) * 0.75).toFixed(2), Number(Math.sqrt(profile.luminosity) * 1.55).toFixed(2)],
      operationalSignificance: rand.pick(["stable navigation reference", "flare monitoring priority", "power collection target", "survey calibration standard"])
    };
  });
}

function starProfile(rand, type, index) {
  if (type === "red-dwarf" || (type === "binary" && index === 1 && rand.maybe(0.5))) {
    return { stellarClass: "red dwarf", spectralType: `M${rand.int(1, 7)}V`, massSolar: rand.float(0.12, 0.55), radiusSolar: rand.float(0.14, 0.62), luminosity: rand.float(0.003, 0.08, 3), ageBillionYears: rand.float(1.5, 9), temperatureK: rand.int(2600, 3900), stability: rand.pick(["flare-active", "moderately stable", "quiet old dwarf"]), flareActivity: rand.pick(["low", "moderate", "high"]), metallicComposition: rand.pick(["metal-rich", "solar-like", "metal-poor"]) };
  }
  if (type === "white-dwarf-remnant") {
    return { stellarClass: "white dwarf", spectralType: `DA${rand.int(1, 5)}`, massSolar: rand.float(0.5, 0.9), radiusSolar: rand.float(0.009, 0.02, 3), luminosity: rand.float(0.001, 0.02, 3), ageBillionYears: rand.float(6, 11), temperatureK: rand.int(5200, 18000), stability: "cooling remnant", flareActivity: "none", metallicComposition: "polluted remnant debris" };
  }
  return { stellarClass: rand.pick(["G-type main sequence", "K-type main sequence", "F-type main sequence"]), spectralType: rand.pick(["G2V", "G8V", "K3V", "F7V"]), massSolar: rand.float(0.72, 1.32), radiusSolar: rand.float(0.75, 1.45), luminosity: rand.float(0.34, 2.4), ageBillionYears: rand.float(0.8, 7.8), temperatureK: rand.int(4300, 6600), stability: rand.pick(["stable", "slightly variable", "old and quiet"]), flareActivity: rand.pick(["low", "low", "moderate"]), metallicComposition: rand.pick(["metal-rich", "solar-like", "slightly metal-poor"]) };
}

function makeBodies(rand, seed, systemName, star, civLevel) {
  const count = rand.int(5, 10);
  let orbit = rand.float(0.18, 0.42);
  const namingSet = rand.pick(["survey", "mythic", "memorial", "corporate"]);
  return Array.from({ length: count }, (_, index) => {
    orbit = Number((orbit + rand.float(0.18, 0.82) * (index < 4 ? 1 : 1.7)).toFixed(2));
    const zoneScore = Math.max(0, 100 - Math.abs(orbit - Number(star.habitableZoneAU[0])) * 42);
    const bodyType = bodyTypeFor(rand, orbit, index);
    const water = bodyType.includes("ocean") ? rand.int(55, 95) : bodyType.includes("ice") ? rand.int(10, 45) : rand.int(0, 70);
    const atmosphere = atmosphereFor(rand, bodyType, zoneScore);
    const habitabilityScore = Math.max(0, Math.min(98, Math.round(zoneScore + water * 0.22 + (atmosphere.includes("oxygen") ? 18 : 0) - (bodyType.includes("gas") ? 60 : 0))));
    const population = populationFor(rand, habitabilityScore, civLevel, bodyType);
    const name = bodyName(rand, systemName, namingSet, index);
    return {
      id: `body_${hashString(`${seed}:body:${index}`).toString(36)}`,
      entityType: "celestial-body",
      parentSystemId: `system_${hashString(seed).toString(36)}`,
      seed: deriveSeed(seed, `body-${index}`),
      name,
      designation: `${systemName.replace(/ System$/, "")} ${toRoman(index + 1)}`,
      bodyType,
      orbit: {
        order: index + 1,
        semiMajorAxisAU: orbit,
        orbitalPeriodDays: Math.round(365 * Math.sqrt(Math.pow(orbit, 3) / Math.max(star.massSolar, 0.1))),
        eccentricity: rand.float(0.01, 0.22)
      },
      physical: {
        radiusEarth: bodyType.includes("giant") ? rand.float(3.2, 10.8) : rand.float(0.34, 1.85),
        massEarth: bodyType.includes("giant") ? rand.float(18, 320, 1) : rand.float(0.08, 5.5),
        gravityEarth: bodyType.includes("giant") ? rand.float(1.8, 3.2) : rand.float(0.22, 1.65),
        dayLengthHours: rand.float(9, 74, 1),
        axialTiltDegrees: rand.int(1, 38),
        averageTemperatureC: Math.round(68 / Math.sqrt(Math.max(orbit, 0.1)) - 62 + rand.int(-35, 35)),
        atmosphere,
        pressureAtm: atmosphere === "trace" ? rand.float(0.01, 0.2) : rand.float(0.35, 3.8),
        magneticField: rand.pick(["none", "weak", "moderate", "strong"])
      },
      environment: {
        biomeProfile: biomeFor(rand, bodyType, habitabilityScore),
        surfaceWaterPercent: water,
        habitability: habitabilityLabel(habitabilityScore, population),
        habitabilityScore,
        biosphere: biosphereFor(rand, habitabilityScore),
        terraformingStatus: population > 5000000 && habitabilityScore < 45 ? rand.pick(["active", "partial", "failed legacy project"]) : "none",
        hazards: []
      },
      civilization: {
        population,
        settlementLevel: population > 200000000 ? "major" : population > 1000000 ? "established" : population > 0 ? "outpost" : "none",
        government: population ? rand.pick(AUTHORITIES).toLowerCase() : "unclaimed",
        primaryEconomy: rand.pick(INDUSTRIES),
        infrastructure: population ? rand.shuffle(["ports", "sealed habitats", "reactor grid", "comm relays", "surface rail", "orbital yards"]).slice(0, rand.int(2, 4)) : [],
        settlements: []
      },
      description: `${name} is a ${bodyType.replace(/-/g, " ")} with ${atmosphere} atmosphere and ${habitabilityLabel(habitabilityScore, population).toLowerCase()} access conditions.`,
      strategicNotes: rand.shuffle(["resource leases", "navigation anchor", "political flashpoint", "scientific reserve", "military staging option"]).slice(0, 2)
    };
  });
}

function bodyTypeFor(rand, orbit, index) {
  if (index > 4 && rand.maybe(0.5)) return rand.pick(["gas-giant", "ice-giant"]);
  if (orbit < 0.45) return rand.pick(["lava-world", "carbon-rich-world", "terrestrial-planet"]);
  if (orbit > 5) return rand.pick(["ice-world", "dwarf-planet", "ice-giant"]);
  return rand.pick(["terrestrial-planet", "super-earth", "ocean-world", "desert-world", "ice-world"]);
}

function makeSettlements(rand, seed, bodies, civLevel) {
  const inhabited = bodies.filter(body => body.civilization.population > 0);
  const multiplier = { frontier: 1, developing: 2, "mature interplanetary": 4, "dense system civilization": 6, "declining or ruined": 3 }[civLevel] || 2;
  return inhabited.flatMap(body => Array.from({ length: Math.min(multiplier, rand.int(1, multiplier + 1)) }, (_, index) => {
    const population = Math.max(120, Math.round(body.civilization.population * rand.float(0.03, 0.28)));
    return {
      id: `settlement_${hashString(`${seed}:${body.id}:${index}`).toString(36)}`,
      entityType: "settlement-summary",
      seed: deriveSeed(seed, `${body.name}-settlement-${index}`),
      name: `${rand.pick(["Port", "New", "Civic", "Glass", "Dawn", "Red"])} ${body.name}`,
      location: body.name,
      bodyId: body.id,
      type: rand.pick(["planetary capital", "mining settlement", "research base", "port city", "terraforming camp", "colonial city"]),
      population,
      foundedYear: rand.int(2140, 2318),
      governingAuthority: rand.pick(AUTHORITIES),
      economicRole: body.civilization.primaryEconomy,
      infrastructureLevel: rand.pick(["fragile", "adequate", "strong", "overbuilt", "decaying"]),
      culturalNote: rand.pick(["route crews dominate public life", "old survey families hold prestige", "air ration politics shape every election", "festival calendars follow orbital windows"]),
      currentProblem: rand.pick(["housing pressure", "labor unrest", "aging pressure seals", "customs delays", "terraforming debt", "water rights dispute"]),
      strategicImportance: rand.pick(["low", "moderate", "high", "critical"])
    };
  }));
}

function makeStations(rand, seed, bodies, civLevel) {
  const count = { frontier: [1, 3], developing: [2, 5], "mature interplanetary": [4, 8], "dense system civilization": [7, 12], "declining or ruined": [2, 6] }[civLevel] || [2, 5];
  return Array.from({ length: rand.int(count[0], count[1]) }, (_, index) => {
    const body = rand.pick(bodies);
    return {
      id: `station_${hashString(`${seed}:station:${index}`).toString(36)}`,
      entityType: "station-summary",
      seed: deriveSeed(seed, `station-${index}`),
      name: `${rand.pick(["Aster", "Meridian", "Crown", "Waypoint", "Relay", "Pale"])} ${rand.pick(["Station", "Yard", "Gate", "Habitat", "Platform", "Exchange"])}`,
      orbitalLocation: `${body.name} orbit`,
      bodyId: body.id,
      type: rand.pick(["orbital port", "relay station", "fuel depot", "shipyard", "defense platform", "research station", "trade habitat", "customs station", "jump gate", "abandoned station"]),
      function: rand.pick(["traffic control", "fuel refining", "customs processing", "ship repair", "military observation", "data relay"]),
      population: rand.int(80, 180000),
      owner: rand.pick(AUTHORITIES),
      constructionYear: rand.int(2180, 2320),
      condition: rand.pick(["new", "serviceable", "overcrowded", "decaying", "partly abandoned"]),
      dockingCapacity: rand.int(2, 44),
      securityLevel: rand.pick(["civilian", "controlled", "restricted", "military"]),
      knownIssue: rand.pick(["reactor backlog", "dockworker strike", "navigation ghosting", "sealed deck", "corrupt manifests"])
    };
  });
}

function makeFactions(rand, systemName, settlements, civLevel) {
  const count = civLevel === "frontier" ? 2 : rand.int(3, 5);
  return Array.from({ length: count }, (_, index) => {
    const authority = rand.pick(AUTHORITIES);
    return {
      id: `faction_${slug(authority)}_${index}`,
      name: `${systemName.replace(/ System$/, "")} ${authority}`,
      type: authority.toLowerCase(),
      territory: rand.pick(settlements)?.location || "primary transit corridor",
      capital: rand.pick(settlements)?.name || "central station",
      populationRepresented: rand.int(12000, 900000000),
      ideology: rand.pick(["continuity through service", "local autonomy", "charter law", "security first", "trade neutrality"]),
      legitimacy: rand.pick(["popular", "contested", "procedural", "fragile", "externally imposed"]),
      enforcementStrength: rand.pick(["minimal", "moderate", "strong", "overextended"]),
      allies: [],
      rivals: [],
      currentObjective: rand.pick(["secure fuel rights", "stabilize food imports", "renegotiate gate fees", "contain unrest", "win settlement recognition"])
    };
  });
}

function makeEconomy(rand, bodies, civLevel, tone) {
  const primaryIndustries = rand.shuffle(INDUSTRIES).slice(0, rand.int(3, 5));
  return {
    primaryIndustries,
    majorExports: primaryIndustries.map(item => `${item.toLowerCase()} contracts`),
    majorImports: rand.shuffle(["water", "specialist labor", "reactor parts", "medical supplies", "luxury biomass", "legal arbitration"]).slice(0, 3),
    energySources: rand.shuffle(["fusion grid", "heliostat swarms", "gas giant fuel scoops", "deep geothermal", "imported antimatter cells"]).slice(0, 2),
    laborStructure: rand.pick(["unionized station labor", "charter families", "contract crews", "automated industrial blocs", "penal labor controversy"]),
    exchangeSystem: rand.pick(["standard credit", "charter scrip", "resource-backed clearing", "mixed barter and credit"]),
    wealthDistribution: tone === "prosperous" ? "broad but uneven" : rand.pick(["highly unequal", "stable middle strata", "frontier patronage", "oligarchic"]),
    tradeDependence: rand.pick(["low", "moderate", "high", "critical"]),
    strategicResources: bodies.slice(0, 3).map(body => `${body.name} ${rand.pick(["volatiles", "rare metals", "biosamples", "deuterium", "data vaults"])}`),
    blackMarketActivity: rand.pick(["minor", "active", "organized", "suppressed but persistent"]),
    economicVulnerability: rand.pick(["single-route dependence", "reactor maintenance bottleneck", "labor shortage", "terraforming debt", "customs corruption"])
  };
}

function makeInfrastructure(rand, bodies, stations, economy) {
  return rand.shuffle(["navigation beacons", "fuel production", "mass drivers", "shipyards", "defense network", "data relays", "emergency shelters", "terraforming systems"]).slice(0, 5).map(asset => ({
    asset,
    location: rand.pick([...bodies.map(body => body.name), ...stations.map(station => station.name)]),
    owner: rand.pick(AUTHORITIES),
    condition: rand.pick(["excellent", "adequate", "strained", "failing", "recently upgraded"]),
    capacity: rand.pick(["local", "systemwide", "regional", "surplus"]),
    importance: economy.tradeDependence === "critical" ? "critical" : rand.pick(["moderate", "high", "critical"]),
    knownWeakness: rand.pick(["single vendor parts", "sabotage exposure", "old software", "radiation damage", "political underfunding"])
  }));
}

function makeRoutes(rand, settlements, stations, economy) {
  const nodes = [...settlements.map(item => item.name), ...stations.map(item => item.name)];
  return Array.from({ length: Math.min(8, Math.max(2, nodes.length - 1)) }, (_, index) => {
    const origin = rand.pick(nodes);
    const destination = rand.pick(nodes.filter(node => node !== origin));
    return {
      id: `route_${index}`,
      name: `${origin.split(" ")[0]}-${destination.split(" ")[0]} Corridor`,
      type: rand.pick(["commercial shipping lane", "passenger corridor", "military route", "smuggling route", "research corridor", "emergency route", "restricted route"]),
      origin,
      destination,
      typicalTravelTime: `${rand.int(8, 190)} hours`,
      trafficVolume: rand.pick(["light", "moderate", "heavy", "surge-prone"]),
      operator: rand.pick(AUTHORITIES),
      riskLevel: rand.pick(["low", "moderate", "elevated", "severe"]),
      primaryCargo: rand.pick(economy.majorExports),
      securityStatus: rand.pick(["open", "checkpointed", "permit required", "restricted"]),
      navigationNotes: rand.pick(["flare windows matter", "debris avoidance required", "beacon drift under review", "piracy advisories remain active"])
    };
  });
}

function makeHazards(rand, bodies, stations, type, civLevel) {
  const hazardNames = ["flare corridor", "debris shoal", "reactor exclusion zone", "labor blockade", "unstable gate wake", "toxic storm band", "automated defense envelope"];
  return rand.shuffle(hazardNames).slice(0, rand.int(3, 6)).map(name => ({
    id: `hazard_${slug(name)}`,
    name: `${rand.pick(bodies).name} ${name}`,
    type: rand.pick(["natural", "technological", "political"]),
    location: rand.pick([...bodies.map(body => body.name), ...stations.map(station => station.name)]),
    severity: type === "red-dwarf" ? rand.pick(["moderate", "high", "severe"]) : rand.pick(["low", "moderate", "high", "severe"]),
    frequency: rand.pick(["rare", "seasonal", "periodic", "continuous"]),
    warningSigns: rand.pick(["beacon flicker", "insurance alerts", "sensor bloom", "customs silence", "civil notices"]),
    operationalImpact: rand.pick(["route delays", "evacuation drills", "permit surcharges", "lost probes", "military escorts"]),
    responsibleAuthority: rand.pick(AUTHORITIES),
    mitigation: rand.pick(["convoy travel", "shielding upgrades", "route closure windows", "local guides", "legal waivers"]),
    storyRelevance: civLevel === "frontier" ? "can decide whether the colony survives" : rand.pick(["pressure on trade", "cover for sabotage", "political bargaining chip", "source of disappearances"])
  }));
}

function makeImportantOrganizations(rand, seed, systemName, economy, settlements) {
  return economy.primaryIndustries.slice(0, 5).map((industry, index) => {
    const name = `${rand.pick(SYSTEM_CORES)} ${industry} ${rand.pick(["Group", "Authority", "Works", "Consortium", "Institute"])}`;
    return {
      id: `org_${hashString(`${seed}:org:${index}`).toString(36)}`,
      entityType: "organization-summary",
      name,
      industry,
      roleInSystem: rand.pick(["dominant contractor", "essential supplier", "political rival", "public utility", "quiet monopoly"]),
      headquarters: rand.pick(settlements)?.name || systemName,
      influence: rand.pick(["limited", "moderate", "high", "decisive"]),
      governmentRelationship: rand.pick(["licensed by", "subsidized by", "under investigation by", "effectively controls", "contracted to"]),
      seed: deriveSeed(seed, `organization-${name}`)
    };
  });
}

function makeHistory(rand, systemName, settlements, factions, civLevel) {
  const firstYear = civLevel === "frontier" ? rand.int(2280, 2315) : rand.int(2100, 2240);
  return Array.from({ length: rand.int(5, 10) }, (_, index) => {
    const year = index === 0 ? firstYear : firstYear + index * rand.int(7, 24);
    return {
      year,
      title: rand.pick(["Discovery", "First settlement", "Resource boom", "Corporate arrival", "Blockade", "Infrastructure collapse", "Political union", "Major accident"]),
      description: `${systemName} recorded ${rand.pick(["a decisive charter filing", "a wave of migrants", "a contested route ruling", "a pressure-seal disaster", "a strategic survey"])} involving ${rand.pick(factions)?.name || "local authorities"}.`,
      affectedLocations: [rand.pick(settlements)?.name || "primary orbital"],
      status: rand.pick(["Public", "Public", "Restricted", "Classified"]),
      lastingConsequence: rand.pick(["new inspection laws", "expanded settlement rights", "lasting distrust", "military presence", "a profitable corridor"])
    };
  });
}

function makeTensions(rand, bodies, factions, hazards, economy) {
  return Array.from({ length: rand.int(3, 6) }, (_, index) => ({
    id: `tension_${index}`,
    seed: deriveSeed(rand.seed, `tension-${index}`),
    title: rand.pick(["Independence petition", "Oxygen monopoly", "Terraforming ethics case", "Transit fee strike", "Hidden seismic data", "Refugee habitat overflow"]),
    parties: rand.shuffle(factions.map(faction => faction.name)).slice(0, 2),
    location: rand.pick(bodies).name,
    pressure: rand.pick(["political", "economic", "military", "environmental"]),
    currentState: rand.pick(["worsening", "managed through emergency law", "quietly negotiated", "near open conflict"]),
    linkedHazard: rand.pick(hazards).name,
    economicTie: rand.pick(economy.primaryIndustries)
  }));
}

function makeStoryHooks(rand, systemName, tensions, hazards, orgs) {
  return tensions.slice(0, 4).map(tension => ({
    premise: `${tension.title} in ${systemName} becomes urgent when ${rand.pick(orgs).name} loses control of a restricted file.`,
    complication: rand.pick([`The real danger is ${rand.pick(hazards).name}.`, "The public timeline has been altered.", "A settlement leader is missing.", "A route closure is being staged."]),
    usefulFor: rand.pick(["political thriller", "frontier survival", "corporate intrigue", "disaster story", "first-contact mystery"])
  }));
}

function populationFor(rand, habitability, civLevel, bodyType) {
  if (bodyType.includes("giant")) return 0;
  const cap = { frontier: 90000, developing: 8000000, "mature interplanetary": 620000000, "dense system civilization": 2200000000, "declining or ruined": 120000000 }[civLevel] || 1000000;
  if (habitability < 25 && rand.maybe(0.55)) return 0;
  return rand.int(120, Math.max(2000, Math.round(cap * (habitability / 100))));
}

function settlementStatus(civLevel) {
  return {
    frontier: "lightly inhabited",
    developing: "developing settlements",
    "mature interplanetary": "heavily inhabited",
    "dense system civilization": "dense system civilization",
    "declining or ruined": "declining or ruined"
  }[civLevel] || "surveyed";
}

function scoreFor(civLevel, rand) {
  const ranges = { frontier: [12, 44], developing: [35, 65], "mature interplanetary": [55, 86], "dense system civilization": [72, 98], "declining or ruined": [25, 72] };
  const [min, max] = ranges[civLevel] || [20, 70];
  return rand.int(min, max);
}

function atmosphereFor(rand, bodyType, zoneScore) {
  if (bodyType.includes("giant")) return "hydrogen-helium";
  if (bodyType.includes("lava")) return rand.pick(["carbon dioxide", "sulfurous", "trace"]);
  if (zoneScore > 65) return rand.pick(["nitrogen-oxygen", "thin oxygen-nitrogen", "dense nitrogen"]);
  return rand.pick(["trace", "carbon dioxide", "methane-rich", "nitrogen"]);
}

function biomeFor(rand, bodyType, habitability) {
  if (habitability > 70) return rand.shuffle(["temperate ocean", "highland forest", "grassland basins", "warm archipelagos"]).slice(0, 2);
  if (bodyType.includes("ice")) return ["cryogenic plains", "subsurface brine"];
  if (bodyType.includes("desert")) return ["salt desert", "sealed canyon habitats"];
  return rand.shuffle(["basalt plains", "impact basins", "sealed settlements", "industrial zones"]).slice(0, 2);
}

function biosphereFor(rand, habitability) {
  if (habitability > 72) return rand.pick(["microbial life", "simple multicellular life", "complex native biosphere", "ambiguous biosignatures"]);
  if (habitability > 45) return rand.pick(["no detected life", "microbial life", "extinct biosphere"]);
  return rand.pick(["no detected life", "ambiguous biosignatures", "classified presence"]);
}

function habitabilityLabel(score, population) {
  if (score > 82) return "Naturally habitable";
  if (score > 65) return "Marginally habitable";
  if (score > 42) return "Habitable with adaptation";
  if (population > 0) return "Habitable only in sealed settlements";
  if (score > 20) return "Industrially occupied";
  return "Uninhabitable";
}

function bodyName(rand, systemName, namingSet, index) {
  if (namingSet === "survey") return `${systemName.replace(/ System$/, "")} ${toRoman(index + 1)}`;
  if (namingSet === "corporate") return rand.pick(["Prosperity", "Endeavor", "Continuance", "Yield", "Charter", "Dividend"]);
  if (namingSet === "memorial") return rand.pick(["Rena", "Tolland", "Amina", "Sato", "Bellamy", "Okoye"]);
  return rand.pick(BODY_NAMES);
}

function toRoman(number) {
  return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][number - 1] || String(number);
}
