import { createSeededRandom, deriveSeed, deterministicCreatedAt, hashString, slug } from "../../shared/random.js";

export const TECHNOLOGY_ENTITY_TYPES = ["technology", "infrastructureSystem", "technicalStandard", "researchProgram", "technicalFacility", "technologyVariant"];

export const TECHNOLOGY_DOMAINS = [
  "energy", "computing", "artificial-intelligence", "robotics", "cybernetics", "communications", "sensing", "navigation", "transportation", "propulsion", "spacecraft", "weapons", "defense", "medicine", "biotechnology", "agriculture", "environmental-systems", "terraforming", "life-support", "materials-science", "manufacturing", "construction", "mining", "logistics", "information-security", "surveillance", "education", "entertainment", "domestic-technology", "legal-administrative", "scientific-instrumentation", "infrastructure-control", "emergency-response"
];

export const TECHNOLOGY_CATEGORIES = {
  energy: ["generation", "storage", "transmission", "conversion", "distribution", "containment", "emergency-power", "waste-heat-management"],
  computing: ["processors", "data-storage", "operating-systems", "distributed-computing", "quantum-computing", "control-systems", "simulation", "decision-support"],
  "artificial-intelligence": ["expert-system", "general-cognition", "autonomous-agent", "navigation-intelligence", "administrative-intelligence", "medical-intelligence", "synthetic-person", "collective-intelligence"],
  communications: ["radio", "laser-communications", "quantum-communications", "relay-network", "emergency-beacon", "encrypted-messaging", "public-network", "interstellar-communications"],
  propulsion: ["chemical", "electric", "nuclear", "fusion", "antimatter", "gravitic", "sail", "ftl"],
  medicine: ["diagnostics", "surgery", "pharmaceuticals", "implants", "prosthetics", "regeneration", "gene-therapy", "cryonics", "telemedicine", "synthetic-organs"],
  "environmental-systems": ["atmosphere", "water", "waste", "climate", "radiation-shielding", "ecological-control", "contamination-removal", "habitat-stabilization"],
  manufacturing: ["additive-fabrication", "subtractive-manufacturing", "molecular-assembly", "biological-fabrication", "shipbuilding", "semiconductor-fabrication", "field-construction", "automated-assembly"],
  "life-support": ["atmosphere-control", "pressure-management", "water-recycling", "thermal-control", "radiation-protection", "nutrient-cycling"],
  transportation: ["maglev", "orbital-transfer", "surface-rover", "cargo-handling", "traffic-control", "docking"],
  spacecraft: ["hull", "navigation", "life-support", "thermal-control", "sensors", "docking", "cargo", "crew-systems"],
  defense: ["shielding", "armor", "targeting", "countermeasures", "perimeter-control", "fleet-support"],
  weapons: ["directed-energy", "kinetic", "drone", "boarding", "munitions", "nonlethal"],
  logistics: ["routing", "warehousing", "cold-chain", "containerization", "customs", "repair-distribution"],
  "information-security": ["encryption", "identity", "intrusion-detection", "audit-ledger", "access-control", "airgap"],
  "infrastructure-control": ["supervisory-control", "sensor-grid", "automation", "emergency-shutdown", "allocation", "diagnostics"]
};

export const TECHNOLOGY_TYPES = ["scientific-principle", "process", "method", "material", "component", "subsystem", "device", "machine", "software", "algorithm", "platform", "vehicle", "weapon", "medical-procedure", "biological-organism", "artificial-intelligence", "control-system", "network", "protocol", "standard", "industrial-system", "utility-system"];
export const TECHNOLOGY_SCALES = ["microscopic", "personal", "wearable", "handheld", "room", "building", "facility", "vehicle", "spacecraft", "district", "settlement", "planetary", "system-wide", "interstellar"];
export const TECHNOLOGY_MATURITY = ["theoretical", "conceptual", "laboratory", "prototype", "field-trial", "early-adoption", "emerging", "mature", "ubiquitous", "declining", "obsolete", "lost", "rediscovered"];
export const TECHNOLOGY_AVAILABILITY = ["public", "consumer", "commercial", "industrial", "specialist", "military", "government", "restricted", "licensed", "classified", "illegal", "black-market", "unique", "unavailable", "lost"];
export const INFRASTRUCTURE_TYPES = ["power-grid", "water-network", "atmosphere-network", "waste-system", "transportation-network", "communications-network", "data-network", "medical-network", "food-production-network", "climate-control-system", "defense-grid", "navigation-network", "logistics-network", "emergency-response-network", "industrial-network", "orbital-traffic-network"];
export const INFRASTRUCTURE_TOPOLOGIES = ["centralized", "decentralized", "distributed", "hub-and-spoke", "mesh", "ring", "hierarchical", "cellular", "modular", "redundant", "improvised", "hybrid"];
export const STANDARD_TYPES = ["interface", "safety", "data-format", "power", "communications", "docking", "medical", "manufacturing", "navigation", "containment", "security", "maintenance", "certification"];
export const RESEARCH_TYPES = ["basic", "applied", "prototype", "field-trial", "military", "medical", "industrial", "infrastructure", "speculative", "reverse-engineering"];
export const FACILITY_TYPES = ["research", "manufacturing", "testing", "maintenance", "storage", "distribution", "control", "training", "certification", "recycling", "disposal"];

const STRATEGIC_IMPORTANCE = ["trivial", "routine", "useful", "important", "major", "critical", "civilization-sustaining", "existential"];
const REALISM = ["contemporary-extrapolation", "hard-science-fiction", "moderately-speculative", "space-opera", "science-fantasy"];
const AUTOMATION = ["manual", "assisted", "semi-automated", "highly-automated", "autonomous", "self-maintaining", "human-supervised-autonomy"];
const RELIABILITY = ["experimental", "unreliable", "fragile", "serviceable", "reliable", "highly-reliable", "redundant", "fail-safe", "overengineered"];
const MATERIALS = ["pressure alloy", "ceramic matrix", "bioactive polymer", "superconductive lattice", "radiation glass", "diamondoid composite", "sealed lubricant", "catalyst foam", "rare-earth dopant", "programmable matter", "quarantine gel", "cryogenic coolant", "metamaterial mesh", "semiconductor wafer", "recycled hullstock"];
const COMPONENT_TYPES = ["power unit", "processor", "sensor", "actuator", "containment shell", "cooling loop", "communications node", "structural frame", "software module", "biological cartridge", "safety interlock", "user interface"];
const FAILURE_PATTERNS = ["power loss", "sensor drift", "structural fatigue", "software corruption", "cyber intrusion", "contamination", "overheating", "loss of containment", "calibration error", "human error", "supply interruption", "material degradation", "cascading network failure", "incompatible component", "deliberate sabotage"];
const POWER_SOURCES = ["fusion grid", "capacitor bank", "radioisotope cell", "solar field", "thermal plant", "chemical reserve", "settlement utility feed", "ship reactor", "microfusion stack", "emergency flywheel"];
const OPERATOR_MODELS = ["trained technician", "specialist engineer", "licensed operator", "military crew", "AI-controlled", "remote operator", "team-operated", "infrastructure authority"];
const OWNERSHIP_MODELS = ["corporate", "cooperative", "municipal", "military", "faction-controlled", "leased", "licensed", "concession", "public utility", "commons", "distributed ownership", "unknown"];
const REGULATION_MODELS = ["unregulated", "self-regulated", "licensed", "inspected", "heavily-regulated", "restricted", "military-controlled", "banned", "classified", "treaty-controlled", "locally-prohibited"];
const IP_MODELS = ["public-domain", "patented", "trade-secret", "open-standard", "licensed", "state-owned", "military-secret", "stolen", "reverse-engineered", "disputed", "ancient-ownerless"];
const CONSEQUENCE_TYPES = ["economic", "labor", "political", "military", "environmental", "cultural", "legal", "medical", "ethical", "security", "inequality", "settlement-design", "migration", "education"];

export function generateTechnology(seed = "technology-seed", options = {}) {
  const context = normalizeContext(options.context || options.universe || {}, options);
  const rand = createSeededRandom(seed);
  const domain = pickConstraint(rand, options.domain, domainFromContext(context));
  const category = pickConstraint(rand, options.category, categoriesFor(domain));
  const type = pickConstraint(rand, options.technologyType || options.type, typeForDomain(domain));
  const scale = pickConstraint(rand, options.scale, scaleFromContext(context));
  const maturity = pickConstraint(rand, options.maturity, maturityFromContext(context));
  const availability = pickConstraint(rand, options.availability, availabilityFromContext(context));
  const importance = pickConstraint(rand, options.strategicImportance, importanceFromContext(context, scale));
  const shortName = acronym(seed, domain, category);
  const name = options.name || technologyName(rand, context, domain, category, type);
  const id = `technology_${slug(name)}_${hashString(seed).toString(36).slice(0, 4)}`;
  const entityIds = contextEntityIds(context);
  const manufacturer = context.organization;
  const operator = context.organization || context.faction;
  const regulator = context.settlement?.government ? context.settlement : context.organization;
  const components = makeComponents(seed, domain, category, type, importance);
  const materials = makeMaterials(seed, domain, importance);
  const standards = makeEmbeddedStandards(seed, domain, category, context);
  const failureModes = makeFailureModes(seed, domain, category, importance, materials);
  const dependencies = makeDependencies(context, components, materials, standards, options);
  return {
    id,
    entityType: "technology",
    schemaVersion: 1,
    seed,
    generatorVersion: "technology-mvp-1",
    datasetVersion: "technology-patterns-1",
    sourceContextHash: hashString(entityIds.join("|")).toString(36),
    name,
    shortName,
    aliases: [shortName],
    designation: `${shortName}-${rand.int(2, 9)}${rand.pick(["", "A", "R", "M"])}`,
    summary: summaryForTechnology(name, context, domain, category, scale),
    classification: {
      domain,
      category,
      technologyType: type,
      scale,
      maturity,
      availability,
      complexity: options.complexity || rand.pick(["low", "moderate", "high", "extreme"]),
      cost: options.cost || rand.pick(["low", "moderate", "high", "strategic"]),
      reliability: options.reliability || reliabilityFor(maturity, importance),
      energyIntensity: options.energyIntensity || energyFor(domain, scale),
      maintenanceBurden: options.maintenanceBurden || maintenanceFor(scale, maturity, importance),
      strategicImportance: importance,
      scientificRealism: options.scientificRealism || context.realism || rand.pick(REALISM)
    },
    function: makeFunction(rand, context, domain, category, scale),
    scientificBasis: makeScientificBasis(rand, domain, category, options.scientificRealism || context.realism),
    design: makeDesign(rand, domain, category, type, scale, components),
    components,
    materials,
    software: makeSoftware(rand, domain, context),
    power: makePower(rand, domain, scale),
    performance: makePerformance(rand, domain, scale),
    operation: makeOperation(rand, scale, importance),
    operatingConditions: makeOperatingConditions(rand, context, domain),
    maintenance: makeMaintenance(rand, scale, maturity, components),
    maintenanceProcedures: makeMaintenanceProcedures(seed, components),
    failureModes,
    failureCascade: makeCascade(name, context, failureModes),
    safety: makeSafety(rand, domain, failureModes),
    security: makeSecurity(rand, availability, domain),
    manufacturing: makeManufacturing(rand, domain, context),
    productionProcess: makeProductionProcess(materials, components),
    supplyChain: makeSupplyChain(rand, context, materials, components),
    economics: makeEconomics(rand, importance, scale),
    ownership: makeOwnership(rand, context),
    intellectualProperty: makeIp(rand, availability),
    regulation: makeRegulation(rand, context, availability, importance),
    standards,
    compatibility: makeCompatibility(rand, standards, components),
    adoption: makeAdoption(rand, context, maturity),
    lifecycle: makeLifecycle(rand, maturity),
    variants: makeVariants(seed, name, id, rand),
    deployment: makeDeployment(rand, context, id),
    consequences: makeConsequences(rand, context, domain),
    historicalDevelopment: makeHistory(rand, context, name, "technology"),
    vulnerabilities: makeVulnerabilities(rand, failureModes, materials),
    futureDevelopment: makeFuture(rand, maturity),
    dependencies,
    inventorCharacterIds: ids(context.character),
    inventorOrganizationIds: ids(context.organization),
    manufacturerOrganizationIds: ids(manufacturer),
    operatorOrganizationIds: ids(operator),
    regulatorOrganizationIds: regulator?.entityType === "organization" ? ids(regulator) : [],
    factionIds: ids(context.faction),
    settlementIds: ids(context.settlement),
    systemIds: ids(context.system),
    infrastructureIds: [],
    standardIds: standards.map(item => item.id),
    facilityIds: [],
    conflictIds: ids(context.conflict),
    documentIds: ids(context.document),
    historicalEventIds: ids(context.event),
    relationshipIds: [],
    premiseIds: ids(context.premise),
    sourceEntityIds: entityIds,
    tags: unique([domain, category, type, maturity, availability, importance, ...(context.tags || [])]),
    notes: "",
    favorite: false,
    createdAt: deterministicCreatedAt(seed),
    updatedAt: deterministicCreatedAt(`${seed}:updated`)
  };
}

export function generateInfrastructure(seed = "infrastructure-seed", options = {}) {
  const context = normalizeContext(options.context || options.universe || {}, options);
  const rand = createSeededRandom(seed);
  const type = pickConstraint(rand, options.infrastructureType || options.type, infrastructureTypeFromContext(context));
  const domain = infrastructureDomain(type);
  const topology = pickConstraint(rand, options.topology, INFRASTRUCTURE_TOPOLOGIES);
  const name = options.name || `${context.settlement?.name || context.system?.name || rand.pick(["Meridian", "Civic", "Frontier", "Lagrange"])} ${title(type)}`;
  const id = `infrastructure_${slug(name)}_${hashString(seed).toString(36).slice(0, 4)}`;
  const operators = ids(context.organization);
  const technologies = makeInfrastructureTechnologies(seed, type, context);
  const failureModes = makeFailureModes(seed, domain, type, options.criticality || "essential", []);
  return {
    id,
    entityType: "infrastructureSystem",
    schemaVersion: 1,
    seed,
    generatorVersion: "technology-mvp-1",
    name,
    summary: `${name} provides ${title(type).toLowerCase()} service for ${context.settlement?.name || context.system?.name || "the local archive"} through a ${topology.replace(/-/g, " ")} operating model.`,
    classification: {
      infrastructureType: type,
      serviceDomain: domain,
      scale: options.scale || (context.settlement ? "settlement" : "system-wide"),
      topology,
      operationalStatus: options.status || rand.pick(["active", "active-degraded", "under-review", "expanding"]),
      criticality: options.criticality || rand.pick(["essential", "life-sustaining", "economically-important", "security-critical"]),
      ownershipModel: options.ownershipModel || rand.pick(["private-concession", "public-utility", "municipal", "cooperative", "military"])
    },
    service: {
      provided: title(type),
      users: [context.settlement?.name || "settlement residents", "maintenance crews", "emergency planners"],
      coverage: rand.pick(["core districts", "settlement-wide", "priority zones", "industrial corridors", "orbital approaches"]),
      access: rand.pick(["universal", "metered", "priority-based", "rationed", "subscription", "restricted"])
    },
    topology: { model: topology, controlPoint: rand.pick(["central control room", "distributed node council", "licensed operator desk", "AI scheduling core"]), politicalEffect: rand.pick(["centralized pricing power", "local maintenance autonomy", "unequal district service", "strong emergency coordination"]) },
    zones: makeZones(seed, context),
    nodes: makeNodes(seed, type),
    technologies,
    controlSystems: technologies.filter(item => /control|sensor|automation|network/.test(item.category || item.name)),
    powerDependencies: [rand.pick(POWER_SOURCES)],
    materialInputs: rand.shuffle(MATERIALS).slice(0, 3),
    outputs: [title(type), "diagnostic telemetry", "maintenance alerts"],
    capacity: { design: rand.pick(["ample", "tight", "overbuilt", "seasonal"]), current: rand.pick(["stable", "near peak", "degraded", "rationed"]), overloadThreshold: rand.pick(["brief surges only", "20 percent reserve", "already exceeded in peak periods"]) },
    demand: { current: rand.pick(["rising", "stable", "volatile", "politically contested"]), drivers: contextPressureLabels(context) },
    redundancy: { level: rand.pick(["minimal", "component redundancy", "network redundancy", "emergency-only redundancy", "nominal redundancy not functional"]), failoverTime: rand.pick(["seconds", "minutes", "hours", "manual dispatch required"]) },
    maintenance: makeMaintenance(rand, "settlement", "mature", technologies),
    staffing: { operatorModel: rand.pick(OPERATOR_MODELS), crew: rand.int(8, 180), shortageRisk: rand.pick(["low", "moderate", "high"]) },
    emergencySystems: { procedures: ["load shedding", "manual isolation", "public alert", "repair convoy"], exercises: rand.pick(["quarterly", "annual", "after incidents only"]) },
    failureModes,
    failureCascade: makeCascade(name, context, failureModes),
    serviceLevels: { guaranteed: rand.pick(["basic continuity", "priority district uptime", "industrial contract level", "emergency access"]), exclusions: rand.pick(["informal settlements", "unlicensed habitats", "restricted zones", "none recorded"]) },
    economics: makeEconomics(rand, "critical", "settlement"),
    ownership: makeOwnership(rand, context),
    regulation: makeRegulation(rand, context, "licensed", "critical"),
    security: makeSecurity(rand, "restricted", domain),
    dependencies: makeDependencies(context, technologies, [], [], options),
    historicalDevelopment: makeHistory(rand, context, name, "infrastructure"),
    vulnerabilities: makeVulnerabilities(rand, failureModes, []),
    futureProjects: makeFuture(rand, "mature"),
    settlementIds: ids(context.settlement),
    systemIds: ids(context.system),
    operatorOrganizationIds: operators,
    ownerOrganizationIds: operators,
    regulatorOrganizationIds: [],
    factionIds: ids(context.faction),
    technologyIds: technologies.map(item => item.id),
    standardIds: [],
    facilityIds: [],
    conflictIds: ids(context.conflict),
    documentIds: ids(context.document),
    historicalEventIds: ids(context.event),
    relationshipIds: [],
    premiseIds: ids(context.premise),
    sourceEntityIds: contextEntityIds(context),
    tags: unique([domain, type, topology, ...(context.tags || [])]),
    notes: "",
    favorite: false,
    createdAt: deterministicCreatedAt(seed),
    updatedAt: deterministicCreatedAt(`${seed}:updated`)
  };
}

export function generateTechnicalStandard(seed = "standard-seed", options = {}) {
  const context = normalizeContext(options.context || {}, options);
  const rand = createSeededRandom(seed);
  const domain = pickConstraint(rand, options.domain, domainFromContext(context));
  const type = pickConstraint(rand, options.standardType || options.type, STANDARD_TYPES);
  const name = options.name || `${context.settlement?.name || context.organization?.identity?.name?.split(" ")[0] || rand.pick(["Meridian", "Kestrel", "Civic"])} ${title(type)} Standard ${rand.int(2, 9)}`;
  return {
    id: `standard_${slug(name)}_${hashString(seed).toString(36).slice(0, 4)}`,
    entityType: "technicalStandard",
    schemaVersion: 1,
    seed,
    name,
    shortName: acronym(seed, domain, type),
    version: `${rand.int(1, 5)}.${rand.int(0, 9)}`,
    summary: `${name} defines interoperability, certification, and safety expectations for ${title(domain).toLowerCase()} systems.`,
    classification: { standardType: type, domain, adoptionStatus: rand.pick(["limited", "widely-adopted", "mandatory", "contested", "legacy"]), authorityLevel: rand.pick(["local-authority", "settlement-charter", "system-consortium", "interstellar-consortium", "military"]), compatibilityRole: rand.pick(["mandatory", "recommended", "legacy-adapter", "proprietary"]) },
    scope: { appliesTo: [title(domain), title(type)], exclusions: rand.pick(["prototype systems", "military annexes", "black-market repairs", "legacy stations"]) },
    requirements: ["documented interface", "certified operator", "traceable maintenance record", "incident reporting"],
    interfaces: [title(type), `${acronym(seed, domain, type)} bus`],
    tolerances: ["verified under ordinary operating stress", "requires local calibration"],
    safetyRules: ["fail closed where life support is exposed", "operator override must be logged"],
    certification: { body: context.organization?.identity?.name || "Local Standards Board", renewal: rand.pick(["annual", "every three years", "after modification"]) },
    governance: { changeControl: rand.pick(["public review", "licensed committee", "closed board", "emergency authority"]), dispute: rand.pick(["arbitration", "regulatory hearing", "technical appeal"]) },
    adoption: { drivers: contextPressureLabels(context), barriers: ["adapter cost", "legacy incompatibility"] },
    compatibility: { supported: [domain], incompatible: rand.pick([["legacy proprietary ports"], ["uncertified field repairs"], ["military-only revisions"]]) },
    predecessors: [],
    successors: [],
    exceptions: ["emergency waiver"],
    knownIssues: ["regional interpretation differs under crisis conditions"],
    historicalDevelopment: makeHistory(rand, context, name, "standard"),
    issuingOrganizationIds: ids(context.organization),
    regulatorOrganizationIds: [],
    technologyIds: ids(context.technology),
    infrastructureIds: ids(context.infrastructure),
    facilityIds: ids(context.facility),
    documentIds: ids(context.document),
    historicalEventIds: ids(context.event),
    relationshipIds: [],
    sourceEntityIds: contextEntityIds(context),
    tags: [domain, type, "standard"],
    notes: "",
    createdAt: deterministicCreatedAt(seed),
    updatedAt: deterministicCreatedAt(`${seed}:updated`)
  };
}

export function generateResearchProgram(seed = "research-seed", options = {}) {
  const context = normalizeContext(options.context || {}, options);
  const rand = createSeededRandom(seed);
  const domain = pickConstraint(rand, options.domain, domainFromContext(context));
  const name = options.name || `${rand.pick(["Compact", "Frontier", "Closed-Loop", "Meridian", "Adaptive"])} ${title(domain)} Initiative`;
  return {
    id: `research_${slug(name)}_${hashString(seed).toString(36).slice(0, 4)}`,
    entityType: "researchProgram",
    schemaVersion: 1,
    seed,
    name,
    summary: `${name} is a ${title(domain).toLowerCase()} program shaped by ${contextPressureLabels(context).join(", ") || "local capability gaps"}.`,
    classification: { researchType: pickConstraint(rand, options.researchType, RESEARCH_TYPES), domain, status: options.status || rand.pick(["proposed", "awaiting-funding", "active", "delayed", "partially-successful", "classified"]), secrecy: rand.pick(["public", "restricted", "classified", "quietly-funded"]), riskLevel: rand.pick(["low", "moderate", "high", "severe"]) },
    objectives: ["reduce dependency risk", "prove field reliability", "lower maintenance burden", "prepare certification evidence"],
    hypotheses: [`${title(domain)} performance can improve without increasing settlement risk.`],
    methods: ["bench testing", "field trial", "simulation", "incident review"],
    milestones: ["funding approved", "laboratory created", "first prototype", "regulatory review", "field trial"],
    facilities: [],
    personnel: context.character ? [{ characterId: context.character.id, role: "principal investigator" }] : [],
    funding: { sponsor: context.organization?.identity?.name || "mixed public grant", stability: rand.pick(["stable", "fragile", "politically exposed"]) },
    sponsors: ids(context.organization),
    competitors: [],
    outputs: ids(context.technology),
    failures: ["overheated prototype", "delayed materials certification"],
    ethicalIssues: rand.shuffle(["consent", "privacy", "labor displacement", "environmental damage", "monopoly", "forced adoption"]).slice(0, 2),
    regulation: makeRegulation(rand, context, "restricted", "major"),
    historicalDevelopment: makeHistory(rand, context, name, "research"),
    futureOutcomes: makeFuture(rand, "prototype"),
    organizationIds: ids(context.organization),
    characterIds: ids(context.character),
    factionIds: ids(context.faction),
    facilityIds: ids(context.facility),
    technologyIds: ids(context.technology),
    documentIds: ids(context.document),
    conflictIds: ids(context.conflict),
    historicalEventIds: ids(context.event),
    relationshipIds: [],
    sourceEntityIds: contextEntityIds(context),
    tags: [domain, "research"],
    notes: "",
    createdAt: deterministicCreatedAt(seed),
    updatedAt: deterministicCreatedAt(`${seed}:updated`)
  };
}

export function generateTechnicalFacility(seed = "facility-seed", options = {}) {
  const context = normalizeContext(options.context || {}, options);
  const rand = createSeededRandom(seed);
  const domain = pickConstraint(rand, options.domain, domainFromContext(context));
  const type = pickConstraint(rand, options.facilityType || options.type, FACILITY_TYPES);
  const name = options.name || `${context.organization?.identity?.name?.split(" ")[0] || context.settlement?.name || rand.pick(["Kestrel", "Meridian", "Frontier"])} ${title(type)} Yard`;
  return {
    id: `facility_${slug(name)}_${hashString(seed).toString(36).slice(0, 4)}`,
    entityType: "technicalFacility",
    schemaVersion: 1,
    seed,
    name,
    summary: `${name} ${type === "research" ? "tests" : "supports"} ${title(domain).toLowerCase()} systems with known dependencies on skilled labor, utilities, and certification.`,
    classification: { facilityType: type, domain, scale: context.settlement ? "settlement" : "orbital", status: rand.pick(["active", "restricted", "under-expansion", "degraded", "mothballed"]), securityLevel: rand.pick(["open", "controlled", "restricted", "classified"]), strategicImportance: rand.pick(["routine", "major", "critical"]) },
    location: { settlementId: context.settlement?.id || "", settlementName: context.settlement?.name || "", systemId: context.system?.id || "", systemName: context.system?.name || "" },
    functions: ["fabrication", "testing", "maintenance", "certification"].filter(() => rand.maybe(0.8)),
    productionLines: [`${title(domain)} component line`, "certified repair bench"],
    researchCapabilities: ["simulation lab", "failure analysis bay", "materials clean room"],
    equipment: rand.shuffle(COMPONENT_TYPES).slice(0, 5),
    technologies: ids(context.technology),
    infrastructureDependencies: ["power", "cooling", "transport", "communications", "waste disposal"],
    staffing: { requiredRoles: ["engineer", "technician", "safety officer"], shortageRisk: rand.pick(["low", "moderate", "high"]) },
    capacity: { current: rand.pick(["underused", "balanced", "overloaded"]), bottleneck: rand.pick(["inspection slots", "imported materials", "skilled labor", "power allocation"]) },
    safety: makeSafety(rand, domain, []),
    maintenance: makeMaintenance(rand, "facility", "mature", []),
    logistics: { inputs: rand.shuffle(MATERIALS).slice(0, 3), outbound: rand.pick(["local deployment", "system distribution", "restricted contract delivery"]) },
    ownership: makeOwnership(rand, context),
    security: makeSecurity(rand, "restricted", domain),
    environmentalImpact: { risk: rand.pick(["low", "managed", "significant", "politically contested"]), mitigation: rand.pick(["closed-loop waste", "inspection reporting", "quarantine handling"]) },
    historicalDevelopment: makeHistory(rand, context, name, "facility"),
    vulnerabilities: { primary: rand.pick(["single power connection", "labor concentration", "cyber dependence", "obsolete tooling", "transport bottleneck"]), mitigations: ["manual shutdown", "spare inventory", "security patrol"] },
    settlementIds: ids(context.settlement),
    systemIds: ids(context.system),
    organizationIds: ids(context.organization),
    characterIds: ids(context.character),
    factionIds: ids(context.faction),
    technologyIds: ids(context.technology),
    infrastructureIds: ids(context.infrastructure),
    standardIds: ids(context.standard),
    documentIds: ids(context.document),
    conflictIds: ids(context.conflict),
    historicalEventIds: ids(context.event),
    relationshipIds: [],
    sourceEntityIds: contextEntityIds(context),
    tags: [domain, type, "facility"],
    notes: "",
    createdAt: deterministicCreatedAt(seed),
    updatedAt: deterministicCreatedAt(`${seed}:updated`)
  };
}

export function analyzeTechnologyDependencies(entity = {}, universe = {}) {
  const direct = unique([
    ...(entity.dependencies?.scientificPrinciples || []),
    ...(entity.dependencies?.precursorTechnologies || []),
    ...(entity.components || []).map(item => item.name),
    ...(entity.materials || []).map(item => item.name),
    ...(entity.power?.source ? [entity.power.source] : []),
    ...(entity.standardIds || []),
    ...(entity.facilityIds || []),
    ...(entity.operatorOrganizationIds || [])
  ]);
  const critical = direct.filter(item => /power|control|sensor|containment|rare|certified|operator|grid|standard/i.test(item));
  const downstream = records(universe.infrastructureSystems).concat(records(universe.technologies)).filter(item =>
    item.id !== entity.id && unique([...(item.technologyIds || []), ...(item.infrastructureIds || []), ...(item.dependencies?.precursorTechnologies || [])]).includes(entity.id)
  );
  return {
    entityId: entity.id,
    direct,
    critical,
    optional: direct.filter(item => !critical.includes(item)).slice(0, 8),
    singlePointsOfFailure: critical.filter((item, index) => index % 2 === 0),
    substitutes: (entity.materials || []).flatMap(item => item.substitutes || []).slice(0, 8),
    downstream: downstream.map(item => ({ id: item.id, name: item.name, entityType: item.entityType })),
    unresolved: direct.filter(item => String(item).startsWith("missing:"))
  };
}

export function traceFailureCascade(entity = {}, universe = {}) {
  const base = entity.failureCascade?.steps || [];
  const affected = analyzeTechnologyDependencies(entity, universe).downstream;
  return {
    entityId: entity.id,
    trigger: entity.failureModes?.[0]?.name || "Availability loss",
    steps: base.length ? base : ["dependency loss", "manual workarounds", "capacity reduction", "public complaint", "political dispute"],
    affected,
    emergencyAlternatives: ["manual operation", "rationing", "substitute component", "restricted service mode"].slice(0, 3),
    storyPressure: `${entity.name || "This system"} can turn a maintenance problem into a civic dispute when backups are late or unevenly allocated.`
  };
}

export function analyzeTechnologyCoverage(universe = {}) {
  const technologies = records(universe.technologies);
  const infrastructure = records(universe.infrastructureSystems);
  const standards = records(universe.technicalStandards);
  const facilities = records(universe.technicalFacilities);
  const findings = [];
  const add = (severity, entityId, coverageType, message) => findings.push({ id: `techCoverage_${hashString(`${entityId}:${coverageType}`).toString(36)}`, severity, entityId, coverageType, message });
  technologies.forEach(item => {
    if (!item.manufacturerOrganizationIds?.length) add("moderate", item.id, "technology-without-manufacturer", `${item.name} has no linked manufacturer.`);
    if (!item.failureModes?.length) add("high", item.id, "technology-without-failure-modes", `${item.name} has no failure model.`);
    if (!item.maintenance?.burden) add("moderate", item.id, "technology-without-maintenance", `${item.name} has no maintenance profile.`);
  });
  infrastructure.forEach(item => {
    if (!item.operatorOrganizationIds?.length) add("high", item.id, "infrastructure-without-operator", `${item.name} has no operator.`);
    if (!item.powerDependencies?.length) add("high", item.id, "infrastructure-without-power", `${item.name} has no power dependency.`);
    if (!item.failureModes?.length) add("high", item.id, "infrastructure-without-failures", `${item.name} has no failure modes.`);
  });
  standards.forEach(item => {
    if (!item.issuingOrganizationIds?.length) add("low", item.id, "standard-without-issuer", `${item.name} has no issuing authority.`);
  });
  records(universe.settlements).forEach(settlement => {
    if (!infrastructure.some(item => item.settlementIds?.includes(settlement.id))) add("moderate", settlement.id, "settlement-without-infrastructure-registry", `${settlement.name} has no registered infrastructure system.`);
  });
  return {
    findings,
    domains: groupCount(technologies, item => item.classification?.domain || "unknown"),
    missingDomains: TECHNOLOGY_DOMAINS.filter(domain => !technologies.some(item => item.classification?.domain === domain)).slice(0, 12),
    settlementGaps: findings.filter(item => item.coverageType === "settlement-without-infrastructure-registry"),
    unresolvedDependencies: findings.filter(item => item.severity === "high")
  };
}

export function suggestTechnologies(universe = {}, options = {}) {
  const suggestions = [];
  records(universe.settlements).forEach(settlement => {
    const env = `${settlement.environment?.environmentType || settlement.location?.environmentType || ""} ${settlement.infrastructure?.utilities?.join(" ") || ""}`.toLowerCase();
    if (/vacuum|hostile|thin|pressure|atmosphere/.test(env)) suggestions.push(suggestion("environmental-systems", "atmosphere-control", "infrastructureSystem", settlement, `${settlement.name} implies atmosphere pressure and distribution systems.`));
    if (/water|recycling|ice/.test(env)) suggestions.push(suggestion("environmental-systems", "water", "infrastructureSystem", settlement, `${settlement.name} needs reliable water reclamation records.`));
    if (settlement.population?.total || settlement.population) suggestions.push(suggestion("communications", "public-network", "technology", settlement, `${settlement.name} population implies communications and emergency broadcast dependencies.`));
  });
  records(universe.conflicts).forEach(conflict => {
    suggestions.push(suggestion("logistics", "repair-distribution", "technology", conflict, `${conflict.name} implies supply-chain or repair bottlenecks.`));
  });
  records(universe.organizations).forEach(org => {
    const industry = org.profile?.industry || org.industry?.label || "";
    if (/power|fusion|energy/i.test(industry)) suggestions.push(suggestion("energy", "generation", "technology", org, `${org.identity?.name || org.name} implies energy products and standards.`));
    if (/ship|freight|navigation|transit/i.test(industry)) suggestions.push(suggestion("navigation", "traffic-control", "technicalStandard", org, `${org.identity?.name || org.name} implies route, docking, or traffic standards.`));
  });
  return suggestions.slice(0, options.limit || 12);
}

export function generateTechnologyEcosystem(seed = "technology-ecosystem", options = {}) {
  const context = normalizeContext(options.context || {}, options);
  const mode = options.mode || "settlement-infrastructure-stack";
  const domains = mode === "spacecraft-technology-stack"
    ? ["spacecraft", "propulsion", "energy", "navigation", "communications", "life-support", "sensing"]
    : mode === "medical-system"
      ? ["medicine", "biotechnology", "logistics", "information-security", "emergency-response"]
      : ["energy", "environmental-systems", "life-support", "communications", "transportation", "waste", "emergency-response"].filter(domain => domain !== "waste" || TECHNOLOGY_DOMAINS.includes(domain));
  const technologies = domains.slice(0, 5).map((domain, index) => generateTechnology(deriveSeed(seed, `${mode}-${domain}-${index}`), { ...options, domain, context }));
  const infrastructure = generateInfrastructure(deriveSeed(seed, `${mode}-infrastructure`), { ...options, context });
  const standards = [generateTechnicalStandard(deriveSeed(seed, `${mode}-standard`), { ...options, domain: domains[0], context })];
  return {
    id: `technologyEcosystem_${hashString(seed).toString(36)}`,
    entityType: "technologyEcosystem",
    seed,
    mode,
    contextEntityIds: contextEntityIds(context),
    technologies,
    infrastructure: [infrastructure],
    standards,
    operators: ids(context.organization),
    maintenanceRisks: technologies.flatMap(item => item.maintenance.criticalSpares).slice(0, 8),
    supplyChainRisks: technologies.flatMap(item => item.supplyChain.risks).slice(0, 8),
    politicalConsequences: technologies.flatMap(item => item.consequences.unintendedHarms).slice(0, 6),
    generatedAt: deterministicCreatedAt(seed)
  };
}

export function validateTechnologyEntity(entity = {}, universe = {}) {
  const errors = [];
  const warnings = [];
  const allowedCategories = categoriesFor(entity.classification?.domain);
  if (!entity.name) errors.push("Name is required.");
  if (!TECHNOLOGY_ENTITY_TYPES.includes(entity.entityType)) errors.push("Unknown technology registry entity type.");
  if (entity.entityType === "technology") {
    if (!TECHNOLOGY_DOMAINS.includes(entity.classification?.domain)) errors.push("Technology domain is not registered.");
    if (!allowedCategories.includes(entity.classification?.category)) warnings.push("Category is not a common fit for the selected domain.");
    if (!entity.function?.primary) errors.push("Primary function is required.");
    if (!entity.scientificBasis?.principles?.length) warnings.push("Scientific basis is thin.");
    if (!entity.components?.length) errors.push("Components are required.");
    if (!entity.materials?.length) errors.push("Material inputs are required.");
    if (!entity.power?.source) warnings.push("Power source is missing.");
    if (!entity.maintenance?.burden) errors.push("Maintenance profile is required.");
    if (!entity.failureModes?.length) errors.push("Failure modes are required.");
    if (["critical", "civilization-sustaining", "existential"].includes(entity.classification?.strategicImportance) && !entity.operatorOrganizationIds?.length) warnings.push("Critical technology has no linked operator.");
    if (["obsolete", "lost"].includes(entity.classification?.maturity) && !entity.lifecycle?.replacement) warnings.push("Obsolete or lost technology needs a replacement or preservation note.");
  }
  if (entity.entityType === "infrastructureSystem") {
    if (!entity.service?.provided) errors.push("Infrastructure service is required.");
    if (!entity.operatorOrganizationIds?.length) warnings.push("Infrastructure has no linked operator.");
    if (!entity.powerDependencies?.length) errors.push("Infrastructure power dependency is required.");
    if (!entity.failureModes?.length) errors.push("Infrastructure failure modes are required.");
  }
  if (entity.entityType === "technicalStandard" && !entity.requirements?.length) errors.push("Standard requirements are required.");
  if (entity.entityType === "researchProgram" && !entity.objectives?.length) errors.push("Research objectives are required.");
  if (entity.entityType === "technicalFacility" && !entity.infrastructureDependencies?.length) warnings.push("Facility dependencies are missing.");
  const universeIds = new Set(allTechnologyRelatedEntities(universe).map(item => item.id));
  [...(entity.technologyIds || []), ...(entity.infrastructureIds || []), ...(entity.standardIds || []), ...(entity.facilityIds || [])].forEach(id => {
    if (id && !universeIds.has(id) && !entity.standards?.some(item => item.id === id) && !entity.technologies?.some(item => item.id === id)) warnings.push(`Reference ${id} is unresolved in the current universe.`);
  });
  return { valid: errors.length === 0, errors, warnings };
}

export function technologyMarkdown(entity, analysis = analyzeTechnologyDependencies(entity)) {
  return [
    `# ${entity.name}`,
    "",
    `${title(entity.entityType)} / ${title(entity.classification?.domain || entity.classification?.serviceDomain || "technical registry")} / ${title(entity.classification?.maturity || entity.classification?.operationalStatus || entity.classification?.status || "active")}`,
    "",
    entity.summary || "",
    "",
    "## Function",
    entity.function?.primary || entity.service?.provided || "Not recorded.",
    "",
    "## Dependencies",
    ...analysis.direct.map(item => `- ${item}`),
    "",
    "## Maintenance",
    `- Burden: ${entity.maintenance?.burden || "not recorded"}`,
    `- Inspection: ${entity.maintenance?.inspectionInterval || "not recorded"}`,
    `- Critical spares: ${(entity.maintenance?.criticalSpares || []).join(", ") || "not recorded"}`,
    "",
    "## Failure Modes",
    ...(entity.failureModes || []).map(item => `- ${item.name}: ${item.consequences?.join("; ") || item.cause}`),
    "",
    "## Consequences",
    ...((entity.consequences?.intendedBenefits || []).concat(entity.consequences?.unintendedHarms || [])).map(item => `- ${item}`)
  ].join("\n");
}

export function technologyPrintableHtml(entity) {
  const analysis = analyzeTechnologyDependencies(entity);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(entity.name)}</title><style>body{font:16px Georgia,serif;background:#f4f0e8;color:#111;margin:0;padding:32px}.page{max-width:900px;margin:auto}.meta{font:12px monospace;text-transform:uppercase}.fact{border-top:1px solid #999;padding:10px 0}@media print{body{padding:0}.page{max-width:none;padding:24px}}</style></head><body><article class="page"><p class="meta">${escapeHtml(entity.entityType)} / ${escapeHtml(entity.classification?.domain || entity.classification?.serviceDomain || "")}</p><h1>${escapeHtml(entity.name)}</h1><p>${escapeHtml(entity.summary || "")}</p><h2>Dependencies</h2>${analysis.direct.map(item => `<div class="fact">${escapeHtml(item)}</div>`).join("")}<h2>Failures</h2>${(entity.failureModes || []).map(item => `<div class="fact"><strong>${escapeHtml(item.name)}</strong><br>${escapeHtml((item.consequences || []).join("; "))}</div>`).join("")}</article></body></html>`;
}

export function technologyCsv(records = []) {
  const rows = [["id", "entityType", "name", "domain", "category", "maturity", "availability", "importance", "maintenance", "failureModes"]];
  records.forEach(record => {
    const entity = unwrap(record);
    rows.push([entity.id, entity.entityType, entity.name, entity.classification?.domain || entity.classification?.serviceDomain || "", entity.classification?.category || entity.classification?.infrastructureType || "", entity.classification?.maturity || entity.classification?.operationalStatus || "", entity.classification?.availability || "", entity.classification?.strategicImportance || entity.classification?.criticality || "", entity.maintenance?.burden || "", (entity.failureModes || []).length]);
  });
  return rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
}

function normalizeContext(input = {}, options = {}) {
  const source = input.universe ? pickContextFromUniverse(input.universe, options.seed || options.rootSeed || "technology-context") : input;
  const context = { ...source };
  ["system", "settlement", "organization", "character", "conflict", "document", "event", "faction", "premise", "technology", "infrastructure", "standard", "facility"].forEach(key => {
    context[key] = unwrap(context[key]);
  });
  context.realism ||= options.scientificRealism || source.settings?.scientificRealism || source.settings?.tone;
  context.tags = unique(Object.values(context).flatMap(entity => entity?.tags || []));
  return context;
}

function pickContextFromUniverse(universe = {}, seed = "technology-context") {
  const rand = createSeededRandom(seed);
  const pick = key => {
    const list = records(universe[key]);
    return list.length ? rand.pick(list) : null;
  };
  return {
    system: pick("systems"),
    settlement: pick("settlements"),
    organization: pick("organizations"),
    character: pick("characters"),
    conflict: pick("conflicts"),
    document: pick("documents"),
    event: pick("historicalEvents"),
    faction: pick("factions"),
    premise: pick("storyPremises"),
    technology: pick("technologies"),
    infrastructure: pick("infrastructureSystems"),
    standard: pick("technicalStandards"),
    facility: pick("technicalFacilities"),
    settings: universe.settings || {}
  };
}

function makeComponents(seed, domain, category, type, importance) {
  const rand = createSeededRandom(deriveSeed(seed, "components"));
  const count = ["critical", "civilization-sustaining", "existential"].includes(importance) ? 5 : 4;
  return rand.shuffle(COMPONENT_TYPES).slice(0, count).map((componentType, index) => ({
    id: `component_${hashString(`${seed}:${componentType}:${index}`).toString(36)}`,
    seed: deriveSeed(seed, componentType),
    name: `${title(category)} ${title(componentType)}`,
    componentType,
    role: index === 0 ? "core function" : rand.pick(["control", "support", "safety", "interface", "diagnostics"]),
    criticality: index < 2 ? "high" : rand.pick(["moderate", "low"]),
    replaceability: rand.pick(["field-replaceable", "depot-service", "factory-only", "sealed"]),
    supplierOrganizationIds: [],
    technologyIds: [],
    materialIds: []
  }));
}

function makeMaterials(seed, domain, importance) {
  const rand = createSeededRandom(deriveSeed(seed, "materials"));
  return rand.shuffle(MATERIALS).slice(0, 4).map((name, index) => ({
    id: `material_${hashString(`${seed}:${name}:${index}`).toString(36)}`,
    name,
    function: rand.pick(["structure", "containment", "conductivity", "catalysis", "biocompatibility", "radiation resistance"]),
    quantityClass: rand.pick(["trace", "small batch", "steady industrial", "bulk"]),
    scarcity: index === 0 && ["critical", "civilization-sustaining"].includes(importance) ? rand.pick(["scarce", "controlled", "imported"]) : rand.pick(["abundant", "common", "regionally available", "scarce", "synthetic only"]),
    source: rand.pick(["local recycling", "licensed supplier", "imported refinery", "restricted stockpile", "biosynthetic vat"]),
    substitutes: rand.shuffle(MATERIALS.filter(item => item !== name)).slice(0, 2),
    recyclingPotential: rand.pick(["high", "moderate", "poor", "hazardous"]),
    strategicImportance: index === 0 ? "high" : rand.pick(["low", "moderate"])
  }));
}

function makeEmbeddedStandards(seed, domain, category, context) {
  return [0, 1].map(index => ({
    id: `standard_${slug(domain)}_${hashString(`${seed}:standard:${index}`).toString(36)}`,
    entityType: "technicalStandard",
    name: `${context.settlement?.name || title(domain)} ${title(index ? "maintenance" : category)} Standard`,
    standardType: index ? "maintenance" : "interface",
    domain,
    adoptionStatus: index ? "local" : "widely-adopted",
    compatibilityRole: index ? "recommended" : "mandatory"
  }));
}

function makeFailureModes(seed, domain, category, importance, materials = []) {
  const rand = createSeededRandom(deriveSeed(seed, "failures"));
  const count = ["critical", "civilization-sustaining", "life-sustaining", "essential"].includes(importance) ? 5 : 3;
  return rand.shuffle(FAILURE_PATTERNS).slice(0, count).map((pattern, index) => ({
    id: `failure_${hashString(`${seed}:${pattern}:${index}`).toString(36)}`,
    name: title(pattern),
    cause: `${title(pattern)} can emerge from ${rand.pick(["deferred maintenance", "bad calibration", "software mismatch", "material fatigue", "operator overload", "sabotage"])}.`,
    symptoms: rand.shuffle(["false alarms", "slow response", "heat spikes", "pressure variance", "network dropouts", "unusual vibration", "audit mismatch"]).slice(0, 3),
    severity: index === 0 ? rand.pick(["high", "severe"]) : rand.pick(["low", "moderate", "high"]),
    detectability: rand.pick(["easy", "moderate", "difficult"]),
    probability: rand.pick(["rare", "occasional", "seasonal", "likely under neglect"]),
    consequences: [`${title(category)} service degrades`, `${title(domain)} operators move to emergency procedure`, materials[0]?.name ? `${materials[0].name} supply becomes politically visible` : "public trust drops"],
    mitigations: ["redundant sensing", "manual override", "spare component pool", "audit trail"],
    relatedIncidentIds: []
  }));
}

function makeDependencies(context, components, materials, standards, options) {
  return {
    scientificPrinciples: unique([...(options.requiredPrinciples || []), ...principlesFor(options.domain || components[0]?.name || "")]).slice(0, 4),
    precursorTechnologies: unique([...(options.precursorTechnologies || []), context.technology?.id]),
    components: components.map(item => item.id || item.name),
    materials: materials.map(item => item.id || item.name),
    software: ["diagnostics", "audit logging", "control firmware"],
    powerSources: unique([options.powerSource, context.infrastructure?.id, "settlement utility feed"]),
    skilledLabor: ["technician", "systems engineer", "safety inspector"],
    infrastructure: unique([context.infrastructure?.id, context.settlement?.id]),
    standards: standards.map(item => item.id || item.name),
    supplyChains: materials.map(item => item.source),
    legalPermissions: ["operating license", "maintenance certification"]
  };
}

function makeFunction(rand, context, domain, category, scale) {
  const place = context.settlement?.name || context.system?.name || "the operating area";
  return {
    primary: `Provides ${title(category).toLowerCase()} capability for ${place}.`,
    secondary: rand.shuffle(["detects anomalies", "records compliance", "reduces operator workload", "coordinates emergency isolation", "stabilizes variable demand"]).slice(0, 3),
    problemSolved: problemFromContext(context, domain, category),
    operatingEnvironment: context.settlement?.environment?.environmentType || context.system?.classification?.systemType || `${scale} operations`,
    intendedUsers: [rand.pick(OPERATOR_MODELS), "maintenance planners"],
    unintendedUses: rand.shuffle(["rationing access", "surveillance inference", "political leverage", "black-market repair", "military adaptation"]).slice(0, 2),
    limitations: rand.shuffle(["requires calibrated sensors", "depends on spare parts", "degrades under power instability", "needs trained operators", "does not resolve political access disputes"]).slice(0, 3),
    alternatives: rand.shuffle(["manual operation", "older mechanical system", "imported replacement", "local workaround"]).slice(0, 2),
    whyAdopted: `Adopted because ${contextPressureLabels(context).join(", ") || "older systems could not meet reliability and capacity demands"}.`
  };
}

function makeScientificBasis(rand, domain, category, realism) {
  const hard = ["hard-science-fiction", "contemporary-extrapolation"].includes(realism);
  return {
    principles: principlesFor(domain).concat(principlesFor(category)).slice(0, 4),
    acceptedTheory: hard ? "Documented engineering extrapolation with conservative performance claims." : "Accepted local engineering theory with speculative allowances.",
    speculativeElements: hard ? [] : rand.shuffle(["field coupling", "predictive matter behavior", "weak causality compensation", "synthetic cognition modeling"]).slice(0, 2),
    requiredDiscoveries: hard ? ["materials improvement", "control theory refinement"] : ["field mathematics", "exotic materials handling"],
    knownLimits: rand.shuffle(["cannot ignore thermal load", "scales poorly without infrastructure", "maintenance debt accumulates", "rare materials cap production"]).slice(0, 3),
    competingInterpretation: rand.pick(["conservative engineers treat it as applied control theory", "rivals claim the gains come from software rather than hardware", "regulators dispute published reliability numbers"])
  };
}

function makeDesign(rand, domain, category, type, scale, components) {
  return {
    architecture: `${title(scale)} ${title(type)} built around ${components[0]?.name || title(category)}.`,
    formFactor: rand.pick(["sealed cabinet", "distributed node set", "rack-mounted system", "field kit", "orbital module", "embedded lattice"]),
    majorSubsystems: components.map(item => item.name),
    interfaces: rand.shuffle(["diagnostic port", "power bus", "maintenance rail", "encrypted control channel", "standard docking collar"]).slice(0, 4),
    controls: rand.pick(["manual override plus supervisory software", "licensed console", "autonomous scheduler", "physical interlock panel"]),
    environmentalTolerances: rand.pick(["vacuum-rated", "radiation-hardened", "sterile-room only", "dust-sensitive", "habitat-interior"]),
    modularity: rand.pick(["modular", "partially modular", "sealed", "field-serviceable"]),
    redundancy: rand.pick(["none", "critical path only", "dual-channel", "triple-redundant"]),
    repairability: rand.pick(["good with spares", "requires depot service", "difficult outside certified facilities"]),
    appearance: rand.pick(["plain industrial casing", "labeled ceramic panels", "exposed maintenance ribs", "compact matte module"])
  };
}

function makeSoftware(rand, domain, context) {
  return {
    version: `${rand.int(1, 9)}.${rand.int(0, 9)}.${rand.int(0, 9)}`,
    owner: context.organization?.identity?.name || "licensed maintainer",
    updateProcess: rand.pick(["manual maintenance window", "signed remote update", "physical media only", "operator-approved patch"]),
    securityModel: rand.pick(["role-based access", "hardware key", "cryptographic ledger", "air-gapped"]),
    compatibility: rand.pick(["current standard", "legacy adapters required", "regional fork", "proprietary"]),
    knownVulnerabilities: rand.shuffle(["credential reuse", "stale firmware", "vendor lockout", "spoofed diagnostics"]).slice(0, 2),
    offlineOperation: rand.pick(["full", "degraded", "emergency only", "not supported"]),
    requiredNetworkAccess: domain === "communications" || rand.maybe(0.45)
  };
}

function makePower(rand, domain, scale) {
  return {
    source: rand.pick(POWER_SOURCES),
    operatingDemand: rand.pick(["negligible", "low", "moderate", "high", "grid-scale"]),
    startupDemand: rand.pick(["low", "brief spike", "requires staged startup", "external bootstrap"]),
    peakDemand: scale === "settlement" ? "grid-scale surge" : rand.pick(["moderate", "high", "brief peak"]),
    backupPower: rand.pick(["internal cell", "emergency capacitor", "external generator", "none"]),
    efficiency: rand.pick(["poor under load", "serviceable", "high", "excellent when maintained"]),
    wasteHeat: rand.pick(["minimal", "localized", "requires cooling loop", "major design constraint"]),
    vulnerabilityToPowerLoss: rand.pick(["safe shutdown", "degraded mode", "hard reset", "cascade risk"])
  };
}

function makePerformance(rand, domain, scale) {
  const metrics = {
    energy: { capacity: rand.pick(["district-scale", "facility-scale", "shipboard"]), efficiency: rand.pick(["62 percent", "78 percent", "high but heat-limited"]) },
    communications: { latency: rand.pick(["low", "windowed", "distance-bound"]), throughput: rand.pick(["high", "moderate", "priority packet only"]) },
    medicine: { recoveryRate: rand.pick(["high for approved cases", "variable", "excellent with fresh inputs"]), safetyMargin: rand.pick(["strict", "moderate", "experimental"]) },
    propulsion: { thrustProfile: rand.pick(["steady low thrust", "high impulse", "burst maneuver"]), range: rand.pick(["local", "interplanetary", "system-wide"]) }
  };
  return metrics[domain] || { capacity: title(scale), reliability: rand.pick(RELIABILITY), serviceLife: rand.pick(["5 years", "12 years", "30 years with overhaul"]), recoveryTime: rand.pick(["minutes", "hours", "days"]) };
}

function makeOperation(rand, scale, importance) {
  return {
    operatorModel: rand.pick(OPERATOR_MODELS),
    requiredSkill: rand.pick(["basic technical", "licensed specialist", "senior engineer", "medical professional", "military qualified"]),
    certification: rand.pick(["local permit", "system license", "manufacturer course", "military clearance"]),
    crewSize: scale === "settlement" ? rand.int(4, 24) : rand.int(1, 6),
    trainingTime: rand.pick(["one week", "six months", "two years", "apprenticeship"]),
    risk: ["critical", "civilization-sustaining"].includes(importance) ? "high under neglect" : rand.pick(["low", "moderate", "high"]),
    humanOversight: rand.pick(["continuous", "shift review", "exception-based", "emergency only"]),
    automationLevel: rand.pick(AUTOMATION)
  };
}

function makeOperatingConditions(rand, context, domain) {
  return {
    temperatureRange: rand.pick(["habitat-normal", "cryogenic-capable", "high-heat tolerant", "narrow calibrated band"]),
    pressureRange: context.settlement ? "settlement pressure envelope" : rand.pick(["vacuum capable", "sealed-atmosphere only", "high-pressure tolerant"]),
    gravityRange: rand.pick(["microgravity capable", "0.2g to 1.4g", "gravity-neutral", "calibration required"]),
    radiationTolerance: rand.pick(["standard", "hardened", "shielded room required"]),
    contaminationSensitivity: rand.pick(["low", "moderate", "high", "sterile-only"]),
    networkRequirements: domain === "communications" ? "continuous network access" : rand.pick(["offline capable", "periodic sync", "continuous telemetry"]),
    operatorRequirements: rand.pick(OPERATOR_MODELS)
  };
}

function makeMaintenance(rand, scale, maturity, components) {
  return {
    burden: maintenanceFor(scale, maturity, "major"),
    inspectionInterval: rand.pick(["daily", "weekly", "30 days", "quarterly", "annual"]),
    overhaulInterval: rand.pick(["18 months", "5 years", "10 years", "after incident"]),
    requiredRoles: rand.shuffle(["technician", "control-systems engineer", "safety inspector", "software maintainer", "materials specialist"]).slice(0, 3),
    requiredTools: rand.shuffle(["diagnostic console", "sealed wrench kit", "calibration phantom", "contamination hood", "firmware key"]).slice(0, 3),
    criticalSpares: components.slice(0, 3).map(item => item.name || item),
    downtime: rand.pick(["none with redundancy", "short service window", "hours", "days"]),
    remoteDiagnostics: rand.pick(["full", "partial", "audit only", "none"]),
    commonNeglect: rand.pick(["deferred calibration", "cheap substitute spares", "missed software update", "unclean filters"]),
    maintenanceOwnership: rand.pick(["operator", "manufacturer", "municipal contractor", "licensed guild"]),
    maintenanceCost: rand.pick(["low", "moderate", "high", "politically contested"]),
    consequencesOfDelay: "Reliability falls, failure modes become harder to detect, and operators shift from prevention to rationed emergency response."
  };
}

function makeMaintenanceProcedures(seed, components) {
  return ["inspection", "calibration", "replacement", "software update", "emergency shutdown"].map((name, index) => ({
    id: `procedure_${hashString(`${seed}:${name}:${index}`).toString(36)}`,
    name: title(name),
    procedureType: name,
    interval: index < 2 ? "routine" : "as needed",
    requiredComponentIds: components.slice(index % Math.max(components.length, 1), index % Math.max(components.length, 1) + 1).map(item => item.id),
    promotableToDocument: ["emergency shutdown", "software update"].includes(name)
  }));
}

function makeSafety(rand, domain, failureModes) {
  return {
    safetyClassification: rand.pick(["routine", "industrial hazard", "life-safety", "restricted", "catastrophic if mishandled"]),
    primaryHazards: failureModes.slice(0, 3).map(item => item.name).concat(rand.shuffle(["thermal exposure", "radiation", "contamination", "civilian misuse"]).slice(0, 1)),
    requiredProtections: ["lockout procedure", "operator certification", "incident logging"],
    shutdownSystems: rand.pick(["manual and automatic", "manual only", "autonomous isolation", "remote command"]),
    environmentalRisk: rand.pick(["low", "managed", "significant", "unknown"]),
    civilianRisk: rand.pick(["low", "moderate", "high if access controls fail"]),
    misuseRisk: rand.pick(["low", "black-market interest", "military adaptation", "political coercion"]),
    emergencyProcedures: ["isolate", "notify", "manual fallback", "audit"]
  };
}

function makeSecurity(rand, availability, domain) {
  return {
    physicalSecurity: rand.pick(["ordinary locks", "controlled access", "armed security", "sealed vault"]),
    cyberSecurity: rand.pick(["signed updates", "network segmentation", "airgap", "continuous monitoring"]),
    authentication: rand.pick(["operator badge", "hardware key", "biometric and token", "charter credential"]),
    exportControls: ["restricted", "classified", "military", "illegal"].includes(availability),
    sabotageResistance: rand.pick(["low", "moderate", "high", "unknown"]),
    theftRisk: rand.pick(["low", "moderate", "high"]),
    blackMarketDemand: ["weapons", "information-security", "medicine", "artificial-intelligence"].includes(domain) ? "high" : rand.pick(["low", "moderate"])
  };
}

function makeManufacturing(rand, domain, context) {
  return {
    productionMethod: rand.pick(["automated assembly", "certified fabrication", "biological fabrication", "precision machining", "molecular deposition", "shipyard integration"]),
    requiredFacilities: [context.facility?.id || rand.pick(["clean room", "orbital yard", "licensed fabrication plant", "quarantine lab"])],
    tooling: rand.shuffle(["calibration rig", "sealed printer", "inspection scanner", "firmware signer", "pressure bench"]).slice(0, 3),
    productionTime: rand.pick(["days", "weeks", "months", "contract cycle"]),
    batchSize: rand.pick(["one-off", "small batch", "industrial batch", "continuous"]),
    qualityControl: rand.pick(["statistical sampling", "full certification", "third-party audit", "military acceptance"]),
    skilledLabor: ["technician", "engineer", "certifier"],
    automation: rand.pick(AUTOMATION),
    waste: rand.pick(["recyclable scrap", "hazardous residue", "heat load", "biohazard"]),
    bottlenecks: rand.shuffle(["rare material", "licensed software", "inspection queue", "skilled labor", "transport window", "power allocation"]).slice(0, 3),
    certification: rand.pick(["local", "systemwide", "interstellar", "classified"]),
    defects: rand.shuffle(["seal flaw", "sensor bias", "firmware mismatch", "material impurity"]).slice(0, 2),
    manufacturers: ids(context.organization)
  };
}

function makeProductionProcess(materials, components) {
  return ["raw-material extraction", "refining", "component fabrication", "assembly", "software installation", "calibration", "testing", "certification", "distribution", "installation"].map((stage, index) => ({
    id: `process_${slug(stage)}`,
    stage,
    dependencies: index < 2 ? materials.slice(0, 2).map(item => item.name) : components.slice(0, 2).map(item => item.name),
    risk: index % 3 === 0 ? "bottleneck-prone" : "routine"
  }));
}

function makeSupplyChain(rand, context, materials, components) {
  return {
    materialSuppliers: materials.map(item => ({ material: item.name, source: item.source })),
    componentSuppliers: components.slice(0, 3).map(item => ({ component: item.name, supplierOrganizationIds: item.supplierOrganizationIds })),
    manufacturingFacilities: [context.facility?.id || "licensed fabrication plant"],
    transportRoutes: [context.system?.name || "regional corridor"],
    warehouses: [context.settlement?.name ? `${context.settlement.name} depot` : "local depot"],
    certificationBodies: [context.organization?.identity?.name || "local technical board"],
    repairDepots: [context.settlement?.name ? `${context.settlement.name} repair annex` : "field depot"],
    recyclingChannels: ["component reclamation", "material recovery"],
    risks: rand.shuffle(["single supplier", "rare material", "hostile territory", "long transport route", "political sanctions", "patent restriction", "labor shortage", "facility concentration", "obsolete tooling"]).slice(0, 4)
  };
}

function makeEconomics(rand, importance, scale) {
  return {
    developmentCost: rand.pick(["minor", "major", "strategic", "state-scale"]),
    unitCost: rand.pick(["low", "moderate", "high", "prohibitive"]),
    installationCost: ["settlement", "planetary", "system-wide"].includes(scale) ? "major civic expense" : rand.pick(["minor", "moderate", "high"]),
    operatingCost: rand.pick(["low", "maintenance-heavy", "energy-heavy", "labor-heavy"]),
    maintenanceCost: rand.pick(["predictable", "volatile", "expensive", "subsidized"]),
    trainingCost: rand.pick(["low", "moderate", "high"]),
    licensingFees: rand.pick(["none", "per unit", "subscription", "charter negotiated"]),
    marketSize: rand.pick(["niche", "regional", "systemwide", "strategic"]),
    economicValue: ["critical", "civilization-sustaining"].includes(importance) ? "keeps core services operating" : "improves capacity and reliability",
    costOfFailure: rand.pick(["service interruption", "civil liability", "mass evacuation", "military exposure", "political crisis"])
  };
}

function makeOwnership(rand, context) {
  return {
    model: rand.pick(OWNERSHIP_MODELS),
    ownerEntityIds: unique([context.organization?.id, context.settlement?.id]),
    rightsHolder: context.organization?.identity?.name || context.faction?.name || "unrecorded rights holder",
    politicalIssue: rand.pick(["pricing", "access", "maintenance neglect", "public utility status", "monopoly", "surveillance"])
  };
}

function makeIp(rand, availability) {
  return {
    model: ["public", "consumer"].includes(availability) ? rand.pick(["public-domain", "open-standard", "licensed"]) : rand.pick(IP_MODELS),
    licensingModel: rand.pick(["open", "per-seat", "per-unit", "maintenance bundled", "restricted charter"]),
    enforcement: rand.pick(["weak", "civil courts", "customs seizure", "security office"]),
    blackMarketCopies: rand.pick(["none known", "suspected", "common but risky"]),
    disputes: rand.pick(["none recorded", "active patent dispute", "standards conflict", "stolen prototype allegation"])
  };
}

function makeRegulation(rand, context, availability, importance) {
  return {
    model: ["restricted", "classified", "military"].includes(availability) ? rand.pick(["restricted", "classified", "military-controlled"]) : rand.pick(REGULATION_MODELS),
    regulators: unique([context.settlement?.government?.type, context.organization?.identity?.name]).filter(Boolean),
    certification: ["critical", "major", "civilization-sustaining"].includes(importance) ? "mandatory" : rand.pick(["none", "recommended", "licensed"]),
    requiredPermits: rand.shuffle(["operator license", "installation permit", "export clearance", "safety certificate"]).slice(0, 2),
    inspectionFrequency: rand.pick(["none", "annual", "quarterly", "after incidents"]),
    legalPenalties: rand.pick(["fine", "license suspension", "seizure", "criminal liability"]),
    loopholes: rand.pick(["prototype exemption", "military annex", "local waiver", "legacy exception"]),
    jurisdictionConflicts: rand.pick(["none", "settlement versus operator", "faction claim", "interstellar treaty conflict"])
  };
}

function makeCompatibility(rand, standards, components) {
  return {
    requiredStandards: standards.slice(0, 1).map(item => item.id),
    supportedStandards: standards.map(item => item.id),
    incompatibleStandards: rand.shuffle(["legacy proprietary interface", "military fork", "uncertified repair protocol"]).slice(0, 1),
    adapters: ["mechanical adapter", "software bridge"].filter(() => rand.maybe(0.7)),
    legacySupport: rand.pick(["none", "limited", "good", "adapter-only"]),
    proprietaryInterfaces: rand.pick(["none", "diagnostic port", "control bus", "parts authentication"]),
    matrix: components.slice(0, 4).map(component => ({ item: component.name, compatibleWith: standards[0]?.name || "local standard", limitation: rand.pick(["none", "adapter required", "certified vendor only"]) }))
  };
}

function makeAdoption(rand, context, maturity) {
  return {
    status: maturity === "mature" ? "widespread" : maturity === "obsolete" ? "legacy" : rand.pick(["prototype only", "limited trial", "specialist use", "growing", "mandatory", "declining"]),
    initialAdopters: unique([context.organization?.identity?.name, context.settlement?.name]).filter(Boolean),
    drivers: contextPressureLabels(context),
    barriers: rand.shuffle(["cost", "training burden", "regulation", "public distrust", "standards conflict", "supplier limits"]).slice(0, 3),
    regionalSpread: rand.pick(["local", "regional", "systemwide", "patchy"]),
    publicPerception: rand.pick(["essential", "trusted", "dangerous", "intrusive", "prestigious", "illegal but necessary"]),
    requiredInfrastructure: unique([context.infrastructure?.id, context.settlement?.id]).filter(Boolean)
  };
}

function makeLifecycle(rand, maturity) {
  return {
    currentStage: maturity,
    stages: ["scientific discovery", "concept", "prototype", "testing", "certification", "introduction", "adoption", "standardization", "maturity"].slice(0, rand.int(5, 9)),
    predecessor: rand.maybe(0.5) ? rand.pick(["manual system", "legacy model", "imported predecessor"]) : "",
    successor: ["declining", "obsolete"].includes(maturity) ? rand.pick(["safer replacement", "open-standard version", "low-maintenance successor"]) : "",
    replacement: ["obsolete", "lost"].includes(maturity) ? rand.pick(["distributed substitute", "manual workaround", "newer standard"]) : "",
    obsolescenceReasons: ["obsolete", "declining"].includes(maturity) ? rand.shuffle(["maintenance burden", "regulation", "resource scarcity", "incompatibility"]).slice(0, 2) : []
  };
}

function makeVariants(seed, name, parentId, rand) {
  return ["civilian", "industrial", "emergency"].map((variantType, index) => ({
    id: `variant_${hashString(`${seed}:${variantType}`).toString(36)}`,
    entityType: "technologyVariant",
    name: `${name} ${title(variantType)} Variant`,
    parentTechnologyId: parentId,
    variantType,
    differences: rand.shuffle(["lower cost", "hardened casing", "restricted firmware", "simplified maintenance", "higher capacity"]).slice(0, 2),
    manufacturerOrganizationIds: [],
    deploymentIds: [],
    promotableToTechnology: index === 1
  }));
}

function makeDeployment(rand, context, technologyId) {
  return {
    instances: [{
      id: `deployment_${hashString(`${technologyId}:${context.settlement?.id || "local"}`).toString(36)}`,
      technologyId,
      locationEntityId: context.settlement?.id || context.system?.id || "",
      operatorOrganizationId: context.organization?.id || "",
      installedDate: String(rand.int(2260, 2325)),
      status: rand.pick(["active", "degraded", "restricted", "trial"]),
      maintenanceState: rand.pick(["current", "due", "overdue", "unknown"]),
      criticality: rand.pick(["routine", "major", "critical"])
    }],
    largestDeployment: context.settlement?.name || context.system?.name || "unrecorded deployment",
    deploymentNotes: rand.pick(["centralized deployment", "patchy regional variants", "quiet military annex", "public utility use"])
  };
}

function makeConsequences(rand, context, domain) {
  return {
    intendedBenefits: rand.shuffle(["higher reliability", "lower labor risk", "greater capacity", "safer operations", "lower resource waste"]).slice(0, 3),
    expectedTradeoffs: rand.shuffle(["training burden", "vendor dependence", "higher inspection load", "data visibility"]).slice(0, 2),
    unintendedBenefits: rand.shuffle(["new repair trade", "better public data", "reduced smuggling", "standardized education"]).slice(0, 2),
    unintendedHarms: rand.shuffle(["labor displacement", "unequal access", "surveillance concerns", "monopoly leverage", "environmental externality", "military adaptation"]).slice(0, 3),
    groupsBenefited: unique([context.organization?.identity?.name, context.settlement?.name, "licensed operators"]).filter(Boolean),
    groupsHarmed: rand.shuffle(["unlicensed repair crews", "low-income districts", "legacy operators", "rival manufacturers"]).slice(0, 2),
    institutionsEmpowered: unique([context.organization?.identity?.name, "regulators"]).filter(Boolean),
    institutionsWeakened: rand.shuffle(["informal markets", "older guilds", "local councils"]).slice(0, 1),
    ethicalIssues: rand.shuffle(["privacy", "surveillance", "labor displacement", "monopoly", "forced adoption", "unequal access"]).slice(0, 3),
    publicPerception: `${title(domain)} specialists call it necessary; affected communities argue over access, cost, and oversight.`
  };
}

function makeHistory(rand, context, name, type) {
  const start = rand.int(2210, 2310);
  return {
    inventionDate: String(start),
    developedAt: context.settlement?.name || context.system?.name || "unrecorded laboratory",
    inventor: context.character?.name?.full || context.organization?.identity?.name || "unknown team",
    milestones: ["concept", "prototype", "first test", "certification", type === "research" ? "publication" : "deployment"].map((label, index) => ({
      year: String(start + index * rand.int(1, 6)),
      title: `${title(label)}: ${name}`,
      eventType: `${type}-${label}`,
      promotedEntityId: "",
      promotableToTimeline: index >= 2
    })),
    controversies: rand.shuffle(["safety review", "patent dispute", "labor protest", "classified accident", "standards fight"]).slice(0, 2)
  };
}

function makeVulnerabilities(rand, failureModes, materials) {
  return {
    technical: failureModes.slice(0, 2).map(item => item.name),
    supply: materials.filter(item => ["scarce", "controlled", "imported"].includes(item.scarcity)).map(item => item.name),
    political: rand.shuffle(["ownership dispute", "regulatory loophole", "faction sabotage", "public distrust"]).slice(0, 2),
    mitigations: ["redundancy", "public audit", "stockpiled spares", "operator training"]
  };
}

function makeFuture(rand, maturity) {
  return {
    roadmap: rand.shuffle(["miniaturization", "cost reduction", "improved safety", "automation", "greater capacity", "lower energy use", "new material", "interoperability", "civilian conversion", "open-standard conversion"]).slice(0, 4),
    certainty: ["theoretical", "prototype", "field-trial"].includes(maturity) ? "uncertain" : "plausible",
    risks: rand.shuffle(["funding collapse", "regulatory ban", "supplier loss", "public backlash"]).slice(0, 2)
  };
}

function makeInfrastructureTechnologies(seed, type, context) {
  const domain = infrastructureDomain(type);
  const categories = categoriesFor(domain);
  return categories.slice(0, 3).map((category, index) => ({
    id: `technology_${slug(type)}_${slug(category)}_${hashString(`${seed}:${category}`).toString(36).slice(0, 4)}`,
    name: `${title(type)} ${title(category)} Module`,
    category,
    role: index === 0 ? "primary service technology" : "support technology",
    sourceEntityIds: contextEntityIds(context)
  }));
}

function makeZones(seed, context) {
  const rand = createSeededRandom(deriveSeed(seed, "zones"));
  const districts = context.settlement?.districts || [];
  return (districts.length ? districts.slice(0, 4) : ["core zone", "industrial zone", "outer zone"]).map((item, index) => ({
    id: `zone_${hashString(`${seed}:${item.id || item}:${index}`).toString(36)}`,
    name: item.name || title(item),
    serviceLevel: rand.pick(["normal", "priority", "degraded", "restricted"]),
    risk: rand.pick(["low", "moderate", "high"])
  }));
}

function makeNodes(seed, type) {
  const rand = createSeededRandom(deriveSeed(seed, "nodes"));
  return ["control center", "distribution hub", "storage node", "sensor station", "emergency node"].map((node, index) => ({
    id: `node_${hashString(`${seed}:${node}:${index}`).toString(36)}`,
    name: `${title(type)} ${title(node)}`,
    nodeType: node,
    status: rand.pick(["active", "degraded", "standby", "maintenance"]),
    criticality: index < 2 ? "high" : "moderate"
  }));
}

function makeCascade(name, context, failureModes) {
  const trigger = failureModes[0]?.name || "Primary Failure";
  return {
    trigger,
    steps: [trigger, "control response degrades", `${context.settlement?.name || "local"} service becomes constrained`, "manual allocation begins", "public and political pressure escalates"],
    affectedEntityIds: contextEntityIds(context),
    consequence: `${name} failure can propagate through maintenance, access, and legitimacy before anyone notices the original technical fault.`
  };
}

function domainFromContext(context) {
  const text = [
    context.settlement?.infrastructure?.utilities?.join(" "),
    context.settlement?.economy?.majorIndustries?.join(" "),
    context.organization?.profile?.industry,
    context.organization?.industry?.label,
    context.conflict?.classification?.conflictType,
    context.conflict?.name,
    context.document?.documentType,
    context.faction?.ideology?.coreBeliefs?.join(" "),
    context.premise?.logline
  ].join(" ").toLowerCase();
  if (/atmosphere|water|waste|climate|terraform/.test(text)) return ["environmental-systems", "life-support"];
  if (/ship|freight|dock|transit|transport|navigation/.test(text)) return ["transportation", "navigation", "spacecraft"];
  if (/power|fusion|energy|reactor/.test(text)) return ["energy"];
  if (/medical|clinic|bio|gene|organ/.test(text)) return ["medicine", "biotechnology"];
  if (/signal|communication|data|archive|cipher/.test(text)) return ["communications", "information-security", "computing"];
  if (/security|defense|weapon|military/.test(text)) return ["defense", "weapons", "surveillance"];
  if (/manufactur|yard|construction|mining/.test(text)) return ["manufacturing", "materials-science", "mining"];
  return TECHNOLOGY_DOMAINS;
}

function typeForDomain(domain) {
  const map = {
    energy: ["device", "industrial-system", "utility-system"],
    communications: ["network", "protocol", "software"],
    "artificial-intelligence": ["artificial-intelligence", "software", "platform"],
    medicine: ["medical-procedure", "device", "biological-organism"],
    "environmental-systems": ["control-system", "utility-system", "network"],
    "life-support": ["control-system", "utility-system", "component"],
    propulsion: ["subsystem", "machine", "vehicle"],
    spacecraft: ["subsystem", "component", "platform"],
    manufacturing: ["process", "machine", "industrial-system"],
    weapons: ["weapon", "device", "platform"]
  };
  return map[domain] || TECHNOLOGY_TYPES;
}

function scaleFromContext(context) {
  if (context.settlement) return ["district", "settlement", "facility"];
  if (context.system) return ["system-wide", "spacecraft", "facility"];
  if (context.character) return ["personal", "wearable", "handheld"];
  return TECHNOLOGY_SCALES;
}

function maturityFromContext(context) {
  if (context.event?.chronology?.sortYear && Number(context.event.chronology.sortYear) < 2250) return ["prototype", "early-adoption", "mature", "obsolete"];
  if (context.conflict) return ["field-trial", "mature", "declining", "obsolete"];
  return TECHNOLOGY_MATURITY;
}

function availabilityFromContext(context) {
  if (context.conflict || context.faction) return ["restricted", "licensed", "black-market", "commercial", "government"];
  if (context.organization?.profile?.riskRating === "Severe") return ["classified", "restricted", "military"];
  return TECHNOLOGY_AVAILABILITY;
}

function importanceFromContext(context, scale) {
  if (context.settlement && ["settlement", "district"].includes(scale)) return ["major", "critical", "civilization-sustaining"];
  if (context.conflict) return ["important", "major", "critical"];
  return STRATEGIC_IMPORTANCE;
}

function infrastructureTypeFromContext(context) {
  const text = `${context.settlement?.infrastructure?.utilities?.join(" ") || ""} ${context.conflict?.name || ""}`.toLowerCase();
  if (/atmosphere|air|pressure/.test(text)) return ["atmosphere-network"];
  if (/water|ice/.test(text)) return ["water-network"];
  if (/power|fusion|reactor/.test(text)) return ["power-grid"];
  if (/signal|comm|data/.test(text)) return ["communications-network", "data-network"];
  return INFRASTRUCTURE_TYPES;
}

function infrastructureDomain(type) {
  if (/power|energy/.test(type)) return "energy";
  if (/water|waste|atmosphere|climate|food/.test(type)) return "environmental-systems";
  if (/communications|data/.test(type)) return "communications";
  if (/medical|emergency/.test(type)) return "medicine";
  if (/traffic|transport|navigation|logistics/.test(type)) return "transportation";
  if (/defense|surveillance/.test(type)) return "defense";
  return "infrastructure-control";
}

function categoriesFor(domain = "") {
  return TECHNOLOGY_CATEGORIES[domain] || ["systems", "equipment", "control", "standard", "support", "field-operations"];
}

function reliabilityFor(maturity, importance) {
  if (["theoretical", "conceptual", "laboratory", "prototype"].includes(maturity)) return "experimental";
  if (["obsolete", "lost"].includes(maturity)) return "fragile";
  if (["critical", "civilization-sustaining"].includes(importance)) return "redundant";
  return "reliable";
}

function energyFor(domain, scale) {
  if (["energy", "propulsion", "terraforming"].includes(domain)) return "high";
  if (["settlement", "planetary", "system-wide"].includes(scale)) return "grid-scale";
  return "moderate";
}

function maintenanceFor(scale, maturity, importance) {
  if (["obsolete", "lost"].includes(maturity)) return "severe";
  if (["settlement", "planetary", "system-wide"].includes(scale) || ["critical", "civilization-sustaining"].includes(importance)) return "high";
  if (["prototype", "field-trial"].includes(maturity)) return "volatile";
  return "moderate";
}

function technologyName(rand, context, domain, category, type) {
  const anchor = context.settlement?.name || context.organization?.identity?.name?.split(" ")[0] || context.system?.name || rand.pick(["Meridian", "Kestrel", "Aster", "Civic", "Frontier", "Helios"]);
  const nouns = {
    energy: ["Reactor", "Power Cell", "Grid Balancer", "Containment Stack"],
    communications: ["Relay", "Packet Engine", "Beacon", "Signal Mesh"],
    medicine: ["Bioforge", "Triage Frame", "Organ Printer", "Diagnostic Loom"],
    "environmental-systems": ["Atmosphere Regulator", "Water Processor", "Climate Governor", "Waste Reclaimer"],
    "life-support": ["Pressure Governor", "Breathing Loop", "Thermal Stabilizer", "Habitat Controller"],
    propulsion: ["Drive", "Thrust Module", "Vector Sail", "Impulse Core"],
    manufacturing: ["Fabricator", "Assembly Stack", "Calibration Mill", "Print Line"],
    defense: ["Shield Grid", "Perimeter Lattice", "Countermeasure Suite"],
    weapons: ["Rail Lance", "Drone Wing", "Pulse Cutter"]
  };
  return `${anchor} ${rand.pick(nouns[domain] || [title(category), title(type), "Technical System"])}`;
}

function summaryForTechnology(name, context, domain, category, scale) {
  const anchor = context.settlement?.name || context.organization?.identity?.name || context.conflict?.name || "the local archive";
  return `${name} is a ${title(scale).toLowerCase()} ${title(domain).toLowerCase()} technology used to solve ${title(category).toLowerCase()} problems around ${anchor}, with explicit dependencies, maintenance burdens, failure modes, regulation, and social consequences.`;
}

function problemFromContext(context, domain, category) {
  if (context.conflict) return `${context.conflict.name} exposed a ${title(category).toLowerCase()} vulnerability.`;
  if (context.settlement?.tensions?.length) return context.settlement.tensions[0].rootCause || context.settlement.tensions[0].currentStatus || `local ${title(category).toLowerCase()} pressure`;
  if (context.organization?.incidents?.length) return context.organization.incidents[0].summary;
  return `Unreliable ${title(category).toLowerCase()} capability in ${title(domain).toLowerCase()} operations.`;
}

function contextPressureLabels(context) {
  return unique([
    context.conflict?.name,
    context.settlement?.tensions?.[0]?.name,
    context.organization?.incidents?.[0]?.category,
    context.document?.title,
    context.faction?.name,
    context.premise?.title,
    context.event?.title
  ]).slice(0, 4);
}

function principlesFor(value) {
  const text = String(value || "");
  if (/energy|fusion|power/.test(text)) return ["thermodynamics", "plasma confinement", "power conversion"];
  if (/communication|signal|data|security|computing/.test(text)) return ["information theory", "cryptography", "distributed systems"];
  if (/medicine|bio|gene|organ/.test(text)) return ["cell biology", "biocompatible materials", "diagnostic modeling"];
  if (/environment|life|atmosphere|water|waste|climate/.test(text)) return ["fluid dynamics", "closed-loop ecology", "distributed control theory"];
  if (/propulsion|spacecraft|navigation|transport/.test(text)) return ["orbital mechanics", "guidance control", "materials fatigue"];
  if (/weapon|defense|surveillance/.test(text)) return ["target discrimination", "energy transfer", "threat modeling"];
  return ["systems engineering", "materials science", "control theory"];
}

function pickConstraint(rand, value, pool) {
  if (value && value !== "random") return value;
  return Array.isArray(pool) ? rand.pick(pool.length ? pool : ["general"]) : pool;
}

function acronym(seed, domain, category) {
  const base = `${domain}-${category}`.split(/[-\s]+/).filter(Boolean).map(part => part[0]).join("").toUpperCase().slice(0, 4);
  return `${base || "TR"}-${hashString(seed).toString(36).slice(0, 2).toUpperCase()}`;
}

function suggestion(domain, category, entityType, source, reason) {
  return {
    id: `techSuggestion_${hashString(`${source.id}:${domain}:${category}:${entityType}`).toString(36)}`,
    domain,
    category,
    entityType,
    sourceEntityId: source.id,
    sourceEntityType: source.entityType,
    title: `${title(domain)} ${title(category)}`,
    reason,
    actions: ["generate", "dismiss", "mark-existing", "save-as-idea", "generate-alternative"]
  };
}

function allTechnologyRelatedEntities(universe = {}) {
  return records(universe.technologies)
    .concat(records(universe.infrastructureSystems))
    .concat(records(universe.technicalStandards))
    .concat(records(universe.researchPrograms))
    .concat(records(universe.technicalFacilities));
}

function contextEntityIds(context) {
  return unique(["system", "settlement", "organization", "character", "conflict", "document", "event", "faction", "premise", "technology", "infrastructure", "standard", "facility"].map(key => context[key]?.id));
}

function ids(entity) {
  const item = unwrap(entity);
  return item?.id ? [item.id] : [];
}

function records(collection) {
  return (collection || []).map(unwrap).filter(Boolean);
}

function unwrap(record) {
  if (!record) return null;
  if (record.id && record.entityType) return record;
  return record.entity || record.technology || record.infrastructureSystem || record.technicalStandard || record.researchProgram || record.technicalFacility || record.system || record.settlement || record.organization || record.character || record.conflict || record.document || record.historicalEvent || record.faction || record.storyPremise || record;
}

function groupCount(items, fn) {
  return items.reduce((acc, item) => {
    const key = fn(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function unique(items) {
  return [...new Set(items.flat().filter(Boolean))];
}

function title(value) {
  return String(value || "").replace(/([A-Z])/g, " $1").replace(/[-_]+/g, " ").replace(/\b\w/g, char => char.toUpperCase()).trim();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
