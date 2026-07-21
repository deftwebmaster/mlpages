import { createSeededRandom, deriveSeed, deterministicCreatedAt, hashString, slug } from "../../shared/random.js";

const SCALE_RANGES = {
  "remote-site": [10, 200],
  outpost: [200, 5000],
  "small-colony": [5000, 50000],
  "regional-settlement": [50000, 500000],
  "major-city": [500000, 10000000],
  megacity: [10000000, 500000000]
};

const SETTLEMENT_TYPES = [
  { value: "planetary capital", weight: 5 },
  { value: "colonial city", weight: 12 },
  { value: "port city", weight: 12 },
  { value: "mining settlement", weight: 11 },
  { value: "agricultural settlement", weight: 7 },
  { value: "research colony", weight: 8 },
  { value: "industrial city", weight: 7 },
  { value: "military city", weight: 5 },
  { value: "terraforming settlement", weight: 6 },
  { value: "company town", weight: 7 },
  { value: "refugee settlement", weight: 4 },
  { value: "lunar colony", weight: 5 },
  { value: "asteroid habitat", weight: 5 },
  { value: "orbital habitat", weight: 7 },
  { value: "trade station", weight: 6 },
  { value: "shipyard settlement", weight: 5 },
  { value: "gate city", weight: 3 },
  { value: "archive habitat", weight: 3 },
  { value: "subglacial settlement", weight: 1 },
  { value: "living biological habitat", weight: 1 },
  { value: "shared human-alien settlement", weight: 1 }
];

const NAME_CORES = "Meridian Vesper Kestrel Sato Orison Bellamy Alecto Harlow Unity Low Harbor Prosperity Redhook Canto Glassfall Waypoint Nereid Tharsis Amina Rena Caligo".split(" ");
const PURPOSES = ["resource extraction", "scientific research", "military control", "trade and transit", "religious refuge", "penal colony", "agricultural production", "terraforming", "corporate expansion", "refugee resettlement", "gate maintenance", "shipbuilding", "medical quarantine", "data storage", "cultural preservation"];
const ENVIRONMENTS = ["Earthlike temperate", "desert", "oceanic", "polar", "subglacial", "volcanic", "high-gravity", "low-gravity", "tidally locked", "toxic atmosphere", "airless", "radiation-exposed", "artificial habitat interior", "rotating habitat", "subterranean", "vacuum-industrial", "engineered biosphere"];
const GOVERNMENTS = ["municipal democracy", "appointed colonial administration", "corporate government", "cooperative council", "military authority", "technocratic board", "labor syndicate", "AI-assisted government", "emergency authority", "autonomous habitat charter", "divided jurisdiction"];
const INDUSTRIES = ["shipping", "mining", "agriculture", "manufacturing", "shipbuilding", "research", "tourism", "medicine", "data processing", "finance", "terraforming", "recycling", "energy", "security", "government administration", "education", "biotechnology", "habitat maintenance", "salvage"];
const DISTRICT_TYPES = ["historic core", "government district", "corporate district", "industrial zone", "freight district", "port district", "residential district", "worker housing", "wealthy enclave", "informal settlement", "entertainment district", "academic district", "medical district", "agricultural district", "religious quarter", "security zone", "military district", "transit hub", "market district", "refugee district", "environmental systems district", "utility district", "exterior works", "subsurface district", "orbital dock district", "abandoned district", "restricted district"];
const COLORS = ["#c99e63", "#76d5d7", "#9ecf8f", "#d88972", "#a6b7ff", "#e0d1a6", "#f0a1b2"];

export function generateSettlement(seed, constraints = {}) {
  const root = createSeededRandom(seed);
  const context = constraints.context || {};
  const summary = constraints.summary || {};
  const scale = scaleFrom(summary, constraints, root);
  const type = normalizeChoice(constraints.settlementType) || summary.type || root.weighted(SETTLEMENT_TYPES);
  const tone = normalizeChoice(constraints.tone) || root.pick(["frontier", "civic", "strained", "prosperous", "austere", "cosmopolitan", "controlled"]);
  const environmentType = context.environmentType || environmentFor(type, context.body, root);
  const purpose = normalizeChoice(constraints.foundingPurpose) || purposeFor(type, summary, root);
  const population = populationFor(root.derive("population"), scale, summary.population, constraints.population);
  const officialName = summary.name || makeName(root.derive("name"), type, context.body?.name);
  const originalName = root.maybe(0.45) ? `${officialName.split(" ")[0]} ${root.pick(["Landing Complex", "Depot", "Charter Site", "Survey Camp", "Works"])}` : officialName;
  const governmentType = normalizeChoice(constraints.governmentType) || summary.governingAuthority?.toLowerCase() || root.pick(GOVERNMENTS);
  const primaryIndustry = normalizeChoice(constraints.economicRole) || summary.economicRole?.toLowerCase() || industryFor(type, purpose, root);
  const districtCount = districtCountFor(scale, root);
  const districts = makeDistricts(root.derive("districts"), seed, officialName, districtCount, type, environmentType, purpose, population, primaryIndustry);
  const organizations = makeOrganizations(root.derive("organizations"), seed, officialName, primaryIndustry, summary.governingAuthority);
  const landmarks = makeLandmarks(root.derive("landmarks"), districts, organizations, scale);
  const laws = makeLaws(root.derive("laws"), environmentType, governmentType);
  const infrastructure = makeInfrastructure(root.derive("infrastructure"), environmentType, organizations, scale, tone);
  const history = makeHistory(root.derive("history"), officialName, districts, organizations, purpose, population, summary.foundedYear);
  const tensions = makeTensions(root.derive("tensions"), districts, organizations, infrastructure, tone);
  const hazards = makeHazards(root.derive("hazards"), districts, environmentType, infrastructure);
  const storyHooks = makeStoryHooks(root.derive("hooks"), tensions, hazards, landmarks, organizations, districts);
  const metrics = metricsFor(root.derive("metrics"), environmentType, tone, scale, governmentType);
  const id = summary.promotedEntityId || `settlement_${hashString(seed).toString(36)}`;
  const systemName = context.system?.name || context.systemName || "Uncharted Local System";
  const bodyName = context.body?.name || context.bodyName || context.station?.name || summary.location || root.pick(["Orison", "Vesper", "Kestrel Basin", "Meridian Habitat"]);

  return {
    id,
    entityType: "settlement",
    schemaVersion: 1,
    seed,
    name: officialName,
    designation: `${slug(systemName).slice(0, 3).toUpperCase()}-${slug(officialName).slice(0, 3).toUpperCase()}-${root.int(1, 99).toString().padStart(2, "0")}`,
    localNickname: makeNickname(root, officialName, environmentType),
    demonym: makeDemonym(officialName),
    createdAt: deterministicCreatedAt(seed),
    updatedAt: deterministicCreatedAt(`${seed}:updated`),
    source: context.source || { type: "standalone" },
    classification: {
      settlementType: type,
      developmentLevel: scale,
      legalStatus: root.pick(["chartered-city", "company-charter", "provisional-colony", "autonomous-habitat", "restricted-zone", "recognized-municipality"]),
      settlementStatus: tone === "strained" ? root.pick(["active", "under emergency measures", "unstable"]) : root.pick(["active", "expanding", "stable", "under review"]),
      strategicImportance: root.pick(["low", "moderate", "high", "critical"]),
      accessLevel: root.pick(["open", "open-with-controlled-zones", "permit-required", "restricted"])
    },
    location: {
      systemId: context.system?.id || context.systemId || "",
      systemName,
      bodyId: context.body?.id || context.bodyId || context.station?.id || "",
      bodyName,
      region: summary.region || root.pick(["Western Littoral", "North Pressure Shelf", "Old Landing Basin", "Equatorial Rail Arc", "Dockward Ring", "Lower Works"]),
      coordinates: {
        latitude: root.float(-72, 72, 1),
        longitude: root.float(-170, 170, 1)
      },
      environmentType
    },
    founding: {
      year: summary.foundedYear || foundingYearFor(root, scale),
      originalPurpose: purpose,
      founderType: root.pick(["corporate-consortium", "colonial-authority", "labor-cooperative", "military-command", "religious-charter", "survey-mission"]),
      founders: organizations.slice(0, 2).map(org => org.name),
      foundingEvent: `${officialName} began as ${articleFor(purpose)} ${purpose} project shaped by ${environmentType.toLowerCase()} constraints.`,
      originalName
    },
    population: makePopulation(root.derive("population-profile"), population, scale, purpose, tone),
    government: makeGovernment(root.derive("government"), officialName, governmentType, laws, organizations),
    economy: makeEconomy(root.derive("economy"), primaryIndustry, type, purpose, environmentType, organizations),
    infrastructure,
    environment: makeEnvironment(root.derive("environment"), environmentType, hazards),
    culture: makeCulture(root.derive("culture"), officialName, environmentType, purpose, tone),
    districts,
    landmarks,
    transit: makeTransit(root.derive("transit"), districts, type, environmentType),
    housing: makeHousing(root.derive("housing"), scale, environmentType, tone),
    security: makeSecurity(root.derive("security"), governmentType, tone),
    services: makeServices(root.derive("services"), organizations, tone),
    organizations,
    history,
    tensions,
    storyHooks,
    relationships: relationshipsFor(id, context, organizations),
    metrics,
    presentation: {
      accentColor: root.pick(COLORS),
      mapStyle: mapStyleFor(type, environmentType),
      emblemStyle: "civic-industrial"
    },
    favorite: false,
    tags: [slug(type), scale, slug(environmentType), slug(primaryIndustry)],
    notes: ""
  };
}

export function settlementMarkdown(settlement) {
  return [
    `# ${settlement.name}`,
    "",
    `Designation: ${settlement.designation}`,
    `Seed: ${settlement.seed}`,
    `Location: ${settlement.location.bodyName}, ${settlement.location.systemName}`,
    `Population: ${settlement.population.display}`,
    "",
    "## Overview",
    overviewText(settlement),
    "",
    "## Districts",
    ...settlement.districts.map(district => `- ${district.name}: ${district.districtType}; ${district.localProblem}`),
    "",
    "## Government",
    `- ${settlement.government.officialName}: ${settlement.government.structure}`,
    ...settlement.government.notableLaws.map(law => `- ${law.name}: ${law.effect}`),
    "",
    "## Economy",
    `- Primary industry: ${settlement.economy.primaryIndustries.join(", ")}`,
    `- Vulnerability: ${settlement.economy.economicVulnerability}`,
    "",
    "## Tensions",
    ...settlement.tensions.map(tension => `- ${tension.name}: ${tension.currentStatus}`),
    "",
    "## Story Hooks",
    ...settlement.storyHooks.map(hook => `- ${hook.premise} ${hook.complication}`)
  ].join("\n");
}

export function overviewText(settlement) {
  return `${settlement.name}, locally known as ${settlement.localNickname}, is ${articleFor(settlement.classification.settlementType)} ${settlement.classification.settlementType} on ${settlement.location.bodyName} in ${settlement.location.systemName}. Founded for ${settlement.founding.originalPurpose}, it now supports ${settlement.population.display} permanent residents through ${settlement.economy.primaryIndustries.slice(0, 2).join(" and ")} while ${settlement.tensions[0]?.name.toLowerCase() || "local pressure"} shapes daily politics.`;
}

function normalizeChoice(value) {
  return value && value !== "random" ? value : "";
}

function scaleFrom(summary, constraints, rand) {
  if (normalizeChoice(constraints.scale)) return constraints.scale;
  const pop = summary.population || Number(constraints.population);
  if (pop) {
    if (pop < 200) return "remote-site";
    if (pop < 5000) return "outpost";
    if (pop < 50000) return "small-colony";
    if (pop < 500000) return "regional-settlement";
    if (pop < 10000000) return "major-city";
    return "megacity";
  }
  return rand.weighted([
    { value: "remote-site", weight: 8 },
    { value: "outpost", weight: 18 },
    { value: "small-colony", weight: 22 },
    { value: "regional-settlement", weight: 22 },
    { value: "major-city", weight: 20 },
    { value: "megacity", weight: 4 }
  ]);
}

function populationFor(rand, scale, summaryPopulation, constrainedPopulation) {
  if (summaryPopulation) return summaryPopulation;
  if (constrainedPopulation && constrainedPopulation !== "random") return Number(constrainedPopulation);
  const range = SCALE_RANGES[scale] || SCALE_RANGES["small-colony"];
  return rand.int(range[0], range[1]);
}

function environmentFor(type, body, rand) {
  if (body?.environment?.habitability?.includes("sealed")) return "vacuum-industrial";
  if (body?.bodyType?.includes("ice")) return rand.pick(["polar", "subglacial", "radiation-exposed"]);
  if (body?.bodyType?.includes("ocean")) return "oceanic";
  if (type.includes("orbital") || type.includes("station") || type.includes("habitat")) return rand.pick(["artificial habitat interior", "rotating habitat", "vacuum-industrial"]);
  if (type.includes("lunar") || type.includes("asteroid")) return rand.pick(["airless", "low-gravity", "subterranean"]);
  return rand.pick(ENVIRONMENTS);
}

function purposeFor(type, summary, rand) {
  if (summary.economicRole) return summary.economicRole.toLowerCase();
  if (type.includes("port") || type.includes("trade")) return "trade and transit";
  if (type.includes("mining") || type.includes("asteroid")) return "resource extraction";
  if (type.includes("research")) return "scientific research";
  if (type.includes("military")) return "military control";
  if (type.includes("terraforming")) return "terraforming";
  return rand.pick(PURPOSES);
}

function industryFor(type, purpose, rand) {
  if (purpose.includes("resource")) return "mining";
  if (purpose.includes("trade")) return "shipping";
  if (purpose.includes("military")) return "security";
  if (purpose.includes("agricultural")) return "agriculture";
  if (type.includes("shipyard")) return "shipbuilding";
  return rand.pick(INDUSTRIES);
}

function makeName(rand, type, bodyName) {
  if (type.includes("port")) return `${rand.pick(["Port", "Low Harbor", "Dock"])} ${bodyName || rand.pick(NAME_CORES)}`;
  if (type.includes("station") || type.includes("habitat")) return `${rand.pick(NAME_CORES)} ${rand.pick(["Station", "Cylinder", "Habitat", "Complex"])}`;
  if (type.includes("mining")) return `${rand.pick(NAME_CORES)} ${rand.pick(["Basin", "Works", "Extraction"])}`;
  return rand.pick([`New ${rand.pick(NAME_CORES)}`, `${rand.pick(NAME_CORES)} Landing`, `${rand.pick(NAME_CORES)} Freeport`, `${rand.pick(NAME_CORES)} City`]);
}

function makeNickname(rand, name, environmentType) {
  return rand.pick([`The ${rand.pick(["Basin", "Ring", "Stacks", "Lower City", "Old Dome"])}`, name.split(" ")[0], environmentType.includes("airless") ? "The Sealed Mile" : "The Civic Deck"]);
}

function makeDemonym(name) {
  const base = name.replace(/^(New|Port|Saint|Low)\s+/i, "").split(" ")[0].replace(/[^A-Za-z]/g, "");
  if (!base) return "";
  return `${base.replace(/[aeiou]$/i, "")}ians`;
}

function districtCountFor(scale, rand) {
  return {
    "remote-site": rand.int(2, 4),
    outpost: rand.int(3, 5),
    "small-colony": rand.int(4, 7),
    "regional-settlement": rand.int(6, 10),
    "major-city": rand.int(9, 14),
    megacity: rand.int(12, 18)
  }[scale] || rand.int(4, 8);
}

function makeDistricts(rand, seed, settlementName, count, type, environmentType, purpose, population, primaryIndustry) {
  const required = districtArchetypes(type, purpose, environmentType);
  const pool = rand.shuffle(DISTRICT_TYPES.filter(item => !required.includes(item)));
  return required.concat(pool).slice(0, count).map((districtType, index) => {
    const districtName = index === 0 ? "Old Landing" : `${rand.pick(["North", "Lower", "Civic", "Glass", "Red", "Dock", "Green", "Outer"])} ${titleish(districtType.split(" ")[0])}`;
    return {
      id: `district_${slug(districtName)}_${index}`,
      seed: deriveSeed(seed, `district-${index}`),
      name: districtName,
      districtType,
      originalPurpose: index === 0 ? purpose : rand.pick(PURPOSES),
      currentPurpose: currentPurposeFor(districtType, primaryIndustry),
      population: Math.max(0, Math.round(population * rand.float(0.02, 0.18))),
      density: rand.pick(["low", "moderate", "high", "very-high"]),
      wealthLevel: rand.pick(["poor", "working", "mixed", "comfortable", "elite"]),
      architecturalStyle: architectureFor(environmentType, districtType, rand),
      atmosphere: rand.pick(["crowded and political", "quiet but watched", "industrial and loud", "orderly and overlit", "improvised but resilient"]),
      dominantCommunities: rand.shuffle(["founding families", "contract workers", "migrant labor", "technical specialists", "habitat-born residents", "transient crews"]).slice(0, 2),
      controllingAuthority: rand.pick(["municipal offices", "corporate security", "district council", "port authority", "labor cooperative"]),
      majorOrganizations: [],
      landmarks: [],
      transitConnections: [],
      localProblem: rand.pick(["housing pressure", "utility rationing", "over-policing", "aging seals", "pollution complaints", "transit bottlenecks", "permit corruption"]),
      sensoryDetails: rand.shuffle(["ozone after seal checks", "warm metal underfoot", "algae kitchens", "warning chimes", "condensation on old glass", "dust in airlocks"]).slice(0, 3),
      storyHooks: []
    };
  });
}

function districtArchetypes(type, purpose, environmentType) {
  const list = ["historic core", "residential district", "utility district"];
  if (type.includes("port") || purpose.includes("trade")) list.push("freight district", "transit hub");
  if (purpose.includes("resource") || type.includes("industrial")) list.push("industrial zone", "worker housing");
  if (type.includes("orbital") || environmentType.includes("habitat")) list.push("orbital dock district", "environmental systems district");
  if (environmentType.includes("airless") || environmentType.includes("vacuum")) list.push("exterior works");
  return [...new Set(list)];
}

function currentPurposeFor(districtType, industry) {
  if (districtType.includes("industrial")) return `${industry} production and heavy services`;
  if (districtType.includes("freight") || districtType.includes("port")) return "cargo transfer and route brokerage";
  if (districtType.includes("government")) return "administration and civic records";
  if (districtType.includes("utility")) return "life-support and maintenance";
  return "dense mixed-use civic life";
}

function architectureFor(environmentType, districtType, rand) {
  if (environmentType.includes("airless") || environmentType.includes("vacuum")) return "regolith-shielded pressure architecture";
  if (environmentType.includes("subterranean") || districtType.includes("subsurface")) return "subterranean brutalist";
  if (districtType.includes("wealthy")) return "sealed civic monumental";
  if (districtType.includes("worker")) return "modular colonial";
  return rand.pick(["industrial utilitarian", "retrofitted historic", "dense vertical", "corporate neo-modern", "mixed multigenerational"]);
}

function makeOrganizations(rand, seed, settlementName, primaryIndustry, governingAuthority) {
  return ["Founder", "Largest employer", "Transit operator", "Utility provider", "Security contractor"].map((role, index) => {
    const industry = index === 1 ? primaryIndustry : rand.pick(INDUSTRIES);
    const name = `${rand.pick(NAME_CORES)} ${titleish(industry)} ${rand.pick(["Authority", "Works", "Group", "Cooperative", "Trust"])}`;
    return {
      id: `org_${hashString(`${seed}:settlement-org:${index}`).toString(36)}`,
      name: index === 0 && governingAuthority ? governingAuthority : name,
      industry,
      role,
      influence: rand.pick(["limited", "moderate", "high", "decisive"]),
      publicReputation: rand.pick(["trusted", "resented", "useful but opaque", "beloved by old residents", "under investigation"]),
      localRelationship: `${role.toLowerCase()} connected to ${settlementName}`,
      seed: deriveSeed(seed, `organization-${name}`)
    };
  });
}

function makeLandmarks(rand, districts, organizations, scale) {
  const count = scale === "remote-site" ? 3 : rand.int(4, 9);
  return Array.from({ length: count }, (_, index) => {
    const district = rand.pick(districts);
    return {
      id: `landmark_${index}`,
      name: `${rand.pick(["First", "Civic", "Kestrel", "Pressure", "Memorial", "Transit", "Old"])} ${rand.pick(["Gate", "Spire", "Market", "Core", "Lift", "Dome", "Archive"])}`,
      district: district.name,
      type: rand.pick(["civic building", "historic site", "corporate tower", "transit hub", "monument", "market", "industrial structure", "memorial"]),
      description: `A ${rand.pick(["crowded", "protected", "weathered", "brightly signed", "restricted"])} landmark anchoring ${district.name}.`,
      historicalSignificance: rand.pick(["first pressure seal", "labor march site", "old founding office", "disaster memorial", "route opening marker"]),
      publicAccess: rand.pick(["open", "permit required", "guided access", "restricted"]),
      associatedOrganization: rand.pick(organizations).name,
      currentIssue: rand.pick(["maintenance backlog", "ownership dispute", "security review", "protest site", "tourist overcrowding"]),
      storyRelevance: rand.pick(["meeting place", "hidden records", "political symbol", "hazard shelter", "black-market access"])
    };
  });
}

function makeLaws(rand, environmentType, governmentType) {
  const base = [
    ["Atmosphere Integrity Code", environmentType.includes("airless") || environmentType.includes("vacuum") ? "deliberate pressure damage is prosecuted as attempted mass casualty" : "utility tampering triggers emergency penalties"],
    ["Residency Ledger Rule", "unregistered long-term lodging can block citizenship review"],
    ["Transit Priority Ordinance", "emergency and freight traffic can override passenger schedules"],
    ["Public Assembly Window", governmentType.includes("corporate") ? "protests require corridor permits" : "assemblies must keep evacuation lanes clear"],
    ["Salvage Disclosure Act", "found artifacts and old machinery must be reported before resale"]
  ];
  return rand.shuffle(base).slice(0, rand.int(3, 5)).map(([name, effect], index) => ({
    id: `law_${index}`,
    name,
    effect,
    publicReaction: index === 0 ? "widely respected" : rand.pick(["controversial", "commonly ignored", "surprises outsiders", "quietly useful"])
  }));
}

function makeGovernment(rand, settlementName, governmentType, laws, organizations) {
  return {
    officialName: `${settlementName} ${rand.pick(["Civic Authority", "Charter Office", "Administrative Council", "Habitat Board"])}`,
    structure: governmentType,
    executiveRole: rand.pick(["mayor", "administrator", "charter director", "station governor", "council chair"]),
    decisionBody: rand.pick(["ward assembly", "appointed board", "labor council", "district senate", "emergency cabinet"]),
    selectionMethod: rand.pick(["local elections", "corporate appointment", "charter lottery", "guild nomination", "mixed vote and review"]),
    administrativeDivisions: rand.int(3, 12),
    legalLegitimacy: rand.pick(["strong", "contested", "procedural", "fragile"]),
    publicApproval: rand.int(18, 82),
    corruptionLevel: rand.pick(["low", "moderate", "entrenched", "under investigation"]),
    transparency: rand.int(15, 88),
    enforcementCapacity: rand.pick(["weak", "adequate", "strong", "overextended"]),
    parentRelationship: rand.pick(["loyal to system authority", "seeking autonomy", "financially dependent", "legally contested"]),
    corporateRelationship: rand.pick(["balanced", "corporate-dominated", "hostile", "contract-bound"]),
    currentPolicyPriority: rand.pick(["housing permits", "life-support debt", "port congestion", "security reform", "food imports"]),
    notableLaws: laws,
    largestSponsor: organizations[0]?.name
  };
}

function makePopulation(rand, permanent, scale, purpose, tone) {
  const transient = Math.max(0, Math.round(permanent * rand.float(0.02, scale === "remote-site" ? 0.35 : 0.12)));
  const communities = rand.shuffle([
    "founding families",
    "contract workers",
    "migrant labor",
    "corporate administrators",
    "scientists",
    "military personnel",
    "refugees",
    "habitat-born residents",
    "temporary ship crews",
    "modified humans",
    "artificial persons"
  ]).slice(0, rand.int(4, 6));
  return {
    permanent,
    display: compactNumber(permanent),
    transient,
    density: scale === "megacity" || scale === "major-city" ? rand.pick(["high", "very-high"]) : rand.pick(["low", "moderate", "high"]),
    growthTrend: tone === "strained" ? rand.pick(["stagnant", "volatile", "declining"]) : rand.pick(["rapid", "steady", "slow", "seasonal"]),
    demographicSummary: `${compactNumber(permanent)} residents shaped by ${purpose} work and ${rand.pick(["new migration", "old charter families", "contract rotation", "system traffic"])}.`,
    ageDistribution: rand.pick(["young workforce-heavy", "balanced", "aging founder cohort", "transient adult-heavy", "family-heavy"]),
    occupationalComposition: rand.pick(["technical labor and services", "dock labor and administration", "research and maintenance", "industrial crews and contractors"]),
    migrationPattern: rand.pick(["steady arrivals", "boom-and-bust cycles", "strict permit inflow", "refugee pressure", "seasonal route crews"]),
    adaptedPopulations: rand.pick(["none notable", "low-gravity adapted residents", "radiation-modified workers", "sealed-habitat children"]),
    majorCommunities: communities.map((name, index) => ({
      name,
      share: index === 0 ? rand.int(24, 42) : rand.int(6, 22),
      origin: rand.pick(["founding charter", "recent labor contracts", "system migration", "old evacuation", "specialist recruitment"]),
      occupations: rand.pick(["maintenance", "administration", "port work", "care work", "research", "security", "food systems"]),
      residentialConcentration: rand.pick(["old core", "worker housing", "dockside blocks", "outer districts", "mixed corridors"]),
      culturalInfluence: rand.pick(["high", "moderate", "quiet but persistent", "growing"]),
      concerns: rand.pick(["citizenship", "housing", "utility prices", "representation", "work hazards", "school access"]),
      relationships: rand.pick(["cooperative", "tense", "politically divided", "interdependent"])
    }))
  };
}

function makeEconomy(rand, primaryIndustry, type, purpose, environmentType, organizations) {
  const secondary = rand.shuffle(INDUSTRIES.filter(item => item !== primaryIndustry)).slice(0, 3);
  return {
    primaryIndustries: [primaryIndustry, ...secondary.slice(0, 2)],
    secondaryIndustries: secondary,
    largestEmployers: organizations.slice(0, 3).map(org => org.name),
    majorExports: [`${primaryIndustry} services`, rand.pick(["trained crews", "processed volatiles", "medical data", "ship components", "heritage media"])],
    majorImports: environmentType.includes("airless") ? ["water", "food biomass", "sealant polymers"] : rand.shuffle(["reactor parts", "luxury food", "specialist labor", "medicine", "legal services"]).slice(0, 3),
    paymentSystem: rand.pick(["standard credit", "charter scrip", "habitat shares", "labor allotments"]),
    employmentConditions: rand.pick(["unionized but tense", "contract-heavy", "stable civic employment", "dangerous shift rotations", "automation-displaced"]),
    informalEconomy: rand.pick(["cargo resale", "permit brokerage", "black-market air filters", "unlicensed repairs", "street kitchens"]),
    costOfLiving: rand.pick(["low", "manageable", "high", "punishing"]),
    wealthDistribution: rand.pick(["broad but uneven", "highly stratified", "compressed by rationing", "elite-heavy"]),
    economicVulnerability: rand.pick(["single employer dependence", "import bottlenecks", "route fee shocks", "old infrastructure debt", "volatile tourism"]),
    recentChange: `${purpose} work has shifted toward ${type.includes("city") ? "civic services" : primaryIndustry}.`
  };
}

function makeInfrastructure(rand, environmentType, organizations, scale, tone) {
  const utilityNames = ["Power", "Water", "Atmosphere", "Waste recycling", "Food production", "Heat control", "Communications", "Medical response", "Emergency shelters"];
  return {
    utilities: utilityNames.map((name, index) => ({
      name,
      provider: rand.pick(organizations).name,
      source: sourceFor(name, environmentType, rand),
      capacity: scale === "megacity" ? rand.pick(["strained", "surplus by district", "critical"]) : rand.pick(["adequate", "strained", "redundant"]),
      reliability: tone === "strained" ? rand.pick(["fragile", "uneven", "politically rationed"]) : rand.pick(["stable", "adequate", "aging but reliable"]),
      redundancy: rand.pick(["single backup", "district loops", "minimal", "triple-redundant core"]),
      accessInequality: rand.pick(["low", "moderate", "severe by district"]),
      knownWeakness: rand.pick(["old valves", "vendor lock-in", "radiation damage", "understaffed maintenance", "data spoofing"]),
      recentIncident: rand.pick(["near miss", "brief outage", "audit warning", "public drill", "sealed inquiry"])
    }))
  };
}

function sourceFor(name, environmentType, rand) {
  if (name === "Atmosphere") return environmentType.includes("Earthlike") ? "local atmospheric processors" : "sealed atmospheric plant";
  if (name === "Water") return environmentType.includes("oceanic") ? "desalination" : rand.pick(["ice imports", "recycling loops", "subsurface reservoirs"]);
  if (name === "Power") return rand.pick(["fusion grid", "geothermal taps", "reactor stacks", "solar collectors"]);
  return rand.pick(["municipal network", "corporate plant", "district cooperatives", "imported supply"]);
}

function makeEnvironment(rand, environmentType, hazards) {
  return {
    environmentType,
    architecturePressure: environmentType.includes("airless") || environmentType.includes("vacuum") ? "pressure zoning defines every district boundary" : "weather and life support share authority",
    clothing: environmentType.includes("airless") ? "soft suits near exterior locks" : rand.pick(["breathable utility layers", "dust-filter scarves", "heat-adaptive fabrics", "corporate work colors"]),
    foodConstraints: rand.pick(["fresh produce is expensive", "algae protein is ordinary", "local kitchens depend on imports", "fermentation is civic pride"]),
    healthRisks: hazards.map(hazard => hazard.name).slice(0, 3),
    emergencyProcedures: rand.pick(["monthly seal drills", "district shelter rotations", "storm shutters and sirens", "transit lockdown corridors"]),
    publicSpace: rand.pick(["interior plazas", "covered markets", "dockside concourses", "pressure-safe courtyards", "station atriums"]),
    hazards
  };
}

function makeCulture(rand, settlementName, environmentType, purpose, tone) {
  return {
    publicValues: rand.shuffle(["self-reliance", "repair culture", "hospitality", "privacy", "charter duty", "corridor courtesy"]).slice(0, 3),
    localIdentity: `${settlementName} residents define themselves by ${purpose} history and ${environmentType.toLowerCase()} discipline.`,
    languages: rand.shuffle(["Standard", "Dock Cant", "Charter Creole", "Survey Sign", "Company Legal"]).slice(0, 2),
    etiquette: rand.pick(["never block an airlock", "ask before recording", "yield to maintenance crews", "do not joke during seal alarms"]),
    workRhythms: rand.pick(["shift bells", "port windows", "reactor cycles", "market tides", "station watches"]),
    leisure: rand.pick(["low-gravity sports", "canteen music", "district food walks", "archive dramas", "pressure garden visits"]),
    fashion: rand.pick(["utility bands", "patched formalwear", "bright district colors", "sealed boots", "corporate castoffs"]),
    holidays: [`Founding ${rand.pick(["Day", "Watch", "Seal", "Transit"])}`, `${rand.pick(["First Breath", "Docklight", "Routewake", "Pressure Night"])}`],
    slang: makeSlang(rand, environmentType, tone),
    commonComplaint: rand.pick(["rent eats hazard pay", "the transit board lies", "outsiders get the clean decks", "nothing is repaired before an audit"]),
    civicPride: rand.pick(["surviving bad physics", "feeding the system", "never missing a convoy", "the old district murals", "open records"])
  };
}

function makeSlang(rand, environmentType, tone) {
  const terms = [
    ["going blue", "missing a pressure-seal inspection", "old warning lights used blue strobes"],
    ["dockwise", "practical and route-aware", "freight crews"],
    ["underledger", "work hidden from official records", "charter bureaucracy"],
    ["warm deck", "a safe place to sleep", "habitat heating politics"],
    ["clean air talk", "polite public language", environmentType]
  ];
  return rand.shuffle(terms).slice(0, rand.int(3, 5)).map(([phrase, meaning, origin]) => ({
    phrase,
    meaning,
    origin,
    example: `"That deal is ${tone === "controlled" ? "underledger" : phrase}."`
  }));
}

function makeTransit(rand, districts, type, environmentType) {
  const primaryMode = environmentType.includes("airless") ? "pressure trains" : type.includes("orbital") ? "rotational transfer hubs" : rand.pick(["metro", "tram", "autonomous pods", "walking corridors", "maglev"]);
  return {
    primaryMode,
    secondaryModes: rand.shuffle(["walking corridors", "dock shuttles", "elevators", "surface crawlers", "ferries", "tunnels"]).slice(0, 3),
    fareSystem: rand.pick(["flat civic fare", "employer pass", "district tokens", "free but queued", "security permit"]),
    reliability: rand.pick(["strong", "uneven", "congested", "fragile during alarms"]),
    ownership: rand.pick(["municipal", "corporate", "public-private", "labor cooperative"]),
    congestion: rand.pick(["low", "rush-window heavy", "constant", "route-dependent"]),
    security: rand.pick(["light", "checkpointed", "automated", "heavy in core routes"]),
    accessibility: rand.pick(["good", "uneven by district", "retrofit ongoing", "poor outside the core"]),
    hubs: districts.filter(d => d.districtType.includes("transit") || d.districtType.includes("port")).map(d => d.name).slice(0, 3),
    failureVulnerability: rand.pick(["single spine tunnel", "old switches", "power rationing", "labor strikes", "sensor spoofing"])
  };
}

function makeHousing(rand, scale, environmentType, tone) {
  return {
    commonTypes: rand.shuffle(["modular rental units", "family compounds", "employer housing", "cooperative blocks", "capsule accommodation", "informal pressure-safe additions", "luxury sealed estates"]).slice(0, 4),
    householdForm: rand.pick(["extended households", "shift-share rooms", "small family units", "guild clusters", "contract dormitories"]),
    ownershipModel: rand.pick(["private ownership", "public allocation", "employer-owned", "habitat shares", "cooperative housing"]),
    spacePerPerson: scale === "megacity" ? "tight" : rand.pick(["cramped", "adequate", "generous for senior staff"]),
    utilityAccess: tone === "strained" ? "rationed by district" : rand.pick(["standard", "uneven", "metered", "bundled with residency"]),
    shortage: rand.pick(["minor", "serious", "politically explosive", "seasonal"]),
    informalHousing: environmentType.includes("airless") ? "unlicensed pressure annexes" : rand.pick(["market lofts", "corridor rooms", "temporary camps", "warehouse dorms"]),
    displacement: rand.pick(["low", "rising near transit", "severe after audits", "hidden by employer contracts"])
  };
}

function makeSecurity(rand, governmentType, tone) {
  return {
    structure: governmentType.includes("corporate") ? "corporate security with civic liaisons" : rand.pick(["civil police", "mixed jurisdiction", "automated enforcement", "community patrols", "military-backed police"]),
    surveillanceLevel: tone === "controlled" ? "high" : rand.pick(["low", "moderate", "high in transit"]),
    commonCrimes: rand.shuffle(["air theft", "cargo theft", "identity fraud", "habitat sabotage", "smuggling", "data theft", "transit fraud", "counterfeit life-support components"]).slice(0, 4),
    organizedCrime: rand.pick(["minor", "route gangs", "permit brokers", "dock syndicates", "quietly captured officials"]),
    corruption: rand.pick(["low", "moderate", "entrenched", "under public inquiry"]),
    publicTrust: rand.pick(["fragile", "mixed", "strong in core districts", "low in worker housing"]),
    weaponsPolicy: rand.pick(["strict", "licensed tools only", "military zones exempt", "frontier permissive"]),
    restrictedZones: rand.pick(["utility core", "old reactor works", "corporate campus", "quarantine deck", "military docks"]),
    currentConcern: rand.pick(["sabotage rumors", "smuggling surge", "surveillance expansion", "strike policing", "missing manifests"])
  };
}

function makeServices(rand, organizations, tone) {
  return ["Education", "Healthcare", "Emergency response", "Public records", "Environmental monitoring", "Childcare", "Immigration services", "Exterior rescue"].map(service => ({
    service,
    provider: rand.pick(organizations).name,
    availability: rand.pick(["broad", "limited", "district-dependent", "overbooked"]),
    quality: tone === "prosperous" ? rand.pick(["good", "excellent", "uneven but improving"]) : rand.pick(["strained", "adequate", "poor in outer districts"]),
    cost: rand.pick(["free at point of use", "subsidized", "employer-billed", "expensive"]),
    inequality: rand.pick(["low", "moderate", "severe"]),
    currentStrain: rand.pick(["staff shortage", "budget audit", "migration surge", "equipment delay", "public mistrust"])
  }));
}

function makeHazards(rand, districts, environmentType, infrastructure) {
  const hazardPool = environmentType.includes("airless") || environmentType.includes("vacuum")
    ? ["decompression", "radiation", "dust", "life-support failure", "orbital debris"]
    : ["flooding", "structural instability", "seismic activity", "chemical contamination", "atmospheric storms", "native organisms"];
  return rand.shuffle(hazardPool).slice(0, rand.int(3, 5)).map((name, index) => ({
    id: `hazard_${index}`,
    name,
    affectedDistricts: rand.shuffle(districts.map(d => d.name)).slice(0, 2),
    severity: rand.pick(["low", "moderate", "high", "severe"]),
    frequency: rand.pick(["rare", "seasonal", "periodic", "persistent"]),
    warningSystem: rand.pick(["public sirens", "wrist alerts", "station lights", "maintenance runners", "transit lockouts"]),
    mitigation: rand.pick(["shelter drills", "pressure zoning", "route closure", "private equipment", "district patrols"]),
    responsibleAuthority: infrastructure.utilities[index % infrastructure.utilities.length].provider,
    publicConfidence: rand.pick(["low", "mixed", "high", "falling"]),
    recentEvent: rand.pick(["near miss", "fatal incident", "false alarm", "quietly suppressed report", "successful drill"])
  }));
}

function makeHistory(rand, settlementName, districts, organizations, purpose, population, foundedYear) {
  const start = foundedYear || rand.int(2140, 2280);
  const count = population > 10000000 ? rand.int(9, 13) : rand.int(5, 10);
  return Array.from({ length: count }, (_, index) => {
    const district = rand.pick(districts);
    return {
      year: index === 0 ? start : start + index * rand.int(4, 19),
      title: index === 0 ? "Founding" : rand.pick(["Population boom", "Corporate takeover", "Labor strike", "Disaster", "Infrastructure expansion", "Migration", "Political reform", "Renaming", "Reconstruction"]),
      description: `${settlementName} recorded ${rand.pick(["a decisive charter change", "a district expansion", "a public crisis", "a route opening", "a contested civic vote"])} tied to ${purpose}.`,
      affectedDistricts: [district.name],
      involvedOrganizations: [rand.pick(organizations).name],
      lastingConsequence: rand.pick(["new utility law", "stronger district identity", "sealed public records", "expanded transit", "anti-corporate politics"]),
      status: rand.pick(["Public", "Public", "Restricted", "Classified"])
    };
  });
}

function makeTensions(rand, districts, organizations, infrastructure, tone) {
  return rand.shuffle(["Housing shortage", "Utility privatization", "Labor dispute", "Environmental degradation", "Corporate corruption", "Transit failures", "Water rationing", "Surveillance expansion", "Historic reparations"]).slice(0, rand.int(3, 6)).map((name, index) => ({
    id: `tension_${index}`,
    name,
    parties: [rand.pick(organizations).name, rand.pick(["district council", "resident coalition", "port authority", "labor syndicate"])],
    rootCause: rand.pick(["old charter language", "migration pressure", "maintenance debt", "corporate leverage", "unequal access"]),
    publicNarrative: rand.pick(["fairness", "security", "survival", "jobs", "public order"]),
    hiddenPressure: rand.pick(["sealed audit", "outside investor", "failing machinery", "succession fight", "unreported hazard"]),
    affectedDistricts: rand.shuffle(districts.map(d => d.name)).slice(0, 2),
    escalationRisk: tone === "strained" ? rand.pick(["high", "severe"]) : rand.pick(["low", "moderate", "high"]),
    currentStatus: rand.pick(["worsening", "under negotiation", "temporarily contained", "moving into courts", "near strike"]),
    possibleOutcomes: rand.shuffle(["reform", "crackdown", "district autonomy", "evacuation", "corporate concession"]).slice(0, 2),
    relatedOrganizations: [rand.pick(organizations).name],
    relatedHistory: infrastructure.utilities[index % infrastructure.utilities.length].recentIncident
  }));
}

function makeStoryHooks(rand, tensions, hazards, landmarks, organizations, districts) {
  return tensions.slice(0, 5).map(tension => {
    const district = rand.pick(districts);
    const org = rand.pick(organizations);
    return {
      premise: `In ${district.name}, ${tension.name.toLowerCase()} becomes urgent after ${org.name} changes access to ${rand.pick(landmarks).name}.`,
      complication: `The public explanation hides ${tension.hiddenPressure}, while ${rand.pick(hazards).name} limits movement.`,
      usefulFor: rand.pick(["political", "personal", "mystery", "survival", "corporate", "social", "scientific"])
    };
  });
}

function metricsFor(rand, environmentType, tone, scale, governmentType) {
  const harsh = environmentType.includes("airless") || environmentType.includes("vacuum") || environmentType.includes("toxic");
  const strained = tone === "strained" || governmentType.includes("corporate");
  return {
    prosperity: clamp(rand.int(28, 84) + (tone === "prosperous" ? 12 : 0)),
    stability: clamp(rand.int(25, 82) - (strained ? 12 : 0)),
    habitability: clamp(rand.int(45, 88) - (harsh ? 22 : 0)),
    inequality: clamp(rand.int(25, 82) + (scale === "megacity" ? 10 : 0)),
    infrastructure: clamp(rand.int(38, 90) - (tone === "strained" ? 8 : 0)),
    security: clamp(rand.int(30, 86)),
    culturalInfluence: clamp(rand.int(25, 90) + (scale === "major-city" || scale === "megacity" ? 8 : 0)),
    environmentalRisk: clamp(rand.int(18, 70) + (harsh ? 22 : 0))
  };
}

function relationshipsFor(id, context, organizations) {
  const rels = [];
  if (context.system?.id || context.systemId) {
    rels.push({
      id: `rel_${hashString(`${id}:system`).toString(36)}`,
      fromEntityId: id,
      fromEntityType: "settlement",
      toEntityId: context.system?.id || context.systemId,
      toEntityType: "star-system",
      relationshipType: "located-in",
      label: `Located in ${context.system?.name || context.systemName}`,
      metadata: { bodyId: context.body?.id || context.bodyId || "" }
    });
  }
  organizations.slice(0, 3).forEach(org => {
    rels.push({
      id: `rel_${hashString(`${id}:${org.id}`).toString(36)}`,
      fromEntityId: id,
      fromEntityType: "settlement",
      toEntityId: org.id,
      toEntityType: "organization",
      relationshipType: slug(org.role),
      label: `${org.role}: ${org.name}`,
      metadata: { seed: org.seed }
    });
  });
  return rels;
}

function foundingYearFor(rand, scale) {
  if (scale === "remote-site" || scale === "outpost") return rand.int(2260, 2322);
  if (scale === "megacity") return rand.int(2080, 2240);
  return rand.int(2140, 2295);
}

function mapStyleFor(type, environmentType) {
  if (type.includes("orbital") || environmentType.includes("rotating")) return "ring-habitat";
  if (environmentType.includes("subterranean")) return "subsurface-network";
  if (type.includes("port")) return "port-centered";
  if (type.includes("corporate")) return "corporate-planned";
  return "district-schematic";
}

function titleish(value) {
  return String(value).replace(/\b\w/g, char => char.toUpperCase());
}

function articleFor(value) {
  return /^[aeiou]/i.test(String(value)) ? "an" : "a";
}

function clamp(value) {
  return Math.max(3, Math.min(98, value));
}

function compactNumber(value) {
  if (value >= 1000000) return `${Math.round(value / 100000) / 10} million`;
  if (value >= 10000) return `${Math.round(value / 1000)} thousand`;
  return new Intl.NumberFormat("en-US").format(value);
}
