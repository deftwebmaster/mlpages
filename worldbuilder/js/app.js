import * as Exporters from "./exporters.js";
import * as SuiteStorage from "./storage.js";
import {
  createSeededRandom,
  deriveSeed as sharedDerivedSeed,
  deterministicCreatedAt as sharedDeterministicCreatedAt,
  hashString as sharedHashString,
  makeSeed as makeSharedSeed,
  slug as sharedSlug
} from "./shared/random.js";
import { generateStarSystem } from "./modules/systems/generate.js";
import { renderSystemsHome, renderSystemDossier, systemMarkdown } from "./modules/systems/render.js";
import { generateSettlement } from "./modules/settlements/generate.js";
import { renderSettlementsHome, renderSettlementDossier, settlementMarkdown, settlementMapSvg } from "./modules/settlements/render.js";
import { generateCharacter } from "./modules/characters/generate.js";
import { renderCharactersHome, renderCharacterDossier, characterMarkdown } from "./modules/characters/render.js";
import { generateConflict } from "./modules/conflicts/generate.js";
import { renderConflictsHome, renderConflictDossier, conflictMarkdown } from "./modules/conflicts/render.js";
import { generateDocument, validateDocument } from "./modules/documents/generate.js";
import { renderDocumentsHome, renderDocumentDossier, documentMarkdown, documentPlainText, documentPrintableHtml } from "./modules/documents/render.js";
import { generateTimeline, extractTimelineEvents, validateTimeline } from "./modules/timeline/generate.js";
import { renderTimelineHome, renderTimelineDossier, renderEventDetail, timelineMarkdown } from "./modules/timeline/render.js";
import { generateFaction, validateFaction } from "./modules/factions/generate.js";
import { renderFactionsHome, renderFactionDossier, factionMarkdown } from "./modules/factions/render.js";
import { buildRelationshipGraph, findRelationshipPath, validateRelationshipData, relationshipMarkdown } from "./modules/relationships/generate.js";
import { renderRelationshipsHome, renderRelationshipExplorer, renderRelationshipDetail } from "./modules/relationships/render.js";
import { generateStoryPremise, collectNarrativePressureSignals, validateStoryPremise, evaluateStoryPremise, analyzePremiseCoverage, storyPremiseMarkdown, storySeedPackage } from "./modules/premises/generate.js";
import { renderPremisesHome, renderPremiseDossier } from "./modules/premises/render.js";
import { buildAtlas, buildAtlasArticle, buildWorldBible, createUniverseProfile, buildAtlasIndex, searchAtlas, atlasContinuityAudit, atlasCoverageAudit, atlasMarkdown, atlasArticleMarkdown, worldBibleMarkdown } from "./modules/atlas/generate.js";
import { renderAtlasHome, renderAtlasExplore, renderAtlasIndex, renderAtlasCategory, renderAtlasArticle, renderAtlasMaps, renderAtlasTimeline, renderAtlasCollections, renderAtlasGlossary, renderWorldBible, atlasHtml, articleHtml, worldBibleHtml } from "./modules/atlas/render.js";
import { generateTechnology, generateInfrastructure, generateTechnicalStandard, generateResearchProgram, generateTechnicalFacility, validateTechnologyEntity, analyzeTechnologyDependencies, traceFailureCascade, analyzeTechnologyCoverage, suggestTechnologies, generateTechnologyEcosystem, technologyMarkdown, technologyPrintableHtml, technologyCsv } from "./modules/technology/generate.js";
import { renderTechnologyHome, renderTechnologyDossier, renderTechnologyComparison, registryHtml } from "./modules/technology/render.js";

const STORAGE_KEY = "icr.registry.v1";
const SCHEMA_VERSION = 1;
const app = document.querySelector("#app");
const modalBackdrop = document.querySelector("#modalBackdrop");
const modalBody = document.querySelector("#modalBody");
const modalTitle = document.querySelector("#modalTitle");
const modalEyebrow = document.querySelector("#modalEyebrow");
let lastFocusedElement = null;

const ARCHETYPES = [
  { id: "commercial", label: "Commercial" },
  { id: "institutional", label: "Institutional" },
  { id: "government", label: "Government-Adjacent" },
  { id: "security", label: "Security and Military" },
  { id: "speculative", label: "Unusual or Speculative" }
];

const INDUSTRIES = [
  industry("orbital-freight", "Orbital Freight", ["commercial", "government"], ["cargo", "dock", "manifest", "vector"], ["freight terminal", "orbital depot", "customs platform"], ["cargo drone", "docking collar", "container platform"], ["cargo loss", "decompression", "navigation failure"], ["manifest", "shipping advisory", "dock notice"], ["arrow", "orbit", "container"], ["industrial", "efficient", "bureaucratic"]),
  industry("asteroid-mining", "Asteroid Mining", ["commercial"], ["ore", "prospect", "drill", "claim"], ["mining lease", "refinery spur", "survey camp"], ["extractor rig", "ore tug", "mass driver"], ["claim dispute", "tunnel collapse", "ore contamination"], ["safety bulletin", "claim notice", "yield report"], ["hexagon", "drill", "star"], ["industrial", "rugged", "secretive"]),
  industry("shipbuilding", "Ship Manufacturing", ["commercial", "security"], ["hull", "yard", "keel", "drive"], ["shipyard", "drydock", "test range"], ["patrol hull", "drive core", "repair scaffold"], ["prototype failure", "contract delay", "weld breach"], ["recall", "launch notice", "contract excerpt"], ["wing", "shield", "grid"], ["industrial", "prestige", "military"]),
  industry("robotics", "Robotics", ["commercial", "security", "speculative"], ["servo", "automata", "labor", "swarm"], ["assembly stack", "service depot", "autonomy lab"], ["loader frame", "survey drone", "companion unit"], ["AI deviation", "worker injury", "logic fault"], ["product recall", "ethics memo", "service notice"], ["hexagon", "eye", "grid"], ["technical", "clinical", "ambitious"]),
  industry("insurance", "Risk Insurance", ["commercial", "speculative"], ["claim", "actuary", "risk", "continuity"], ["claims vault", "audit office", "disaster desk"], ["hazard policy", "arbitration package", "loss model"], ["insurance dispute", "financial fraud", "exposure scandal"], ["legal notice", "claim memo", "public apology"], ["diamond", "shield", "ring"], ["bureaucratic", "cautious", "ominous"]),
  industry("construction", "Habitat Construction", ["commercial", "government"], ["habitat", "girder", "vault", "pressure"], ["construction yard", "habitat ring", "materials pier"], ["pressure wall", "utility spine", "folding crane"], ["structural failure", "labor strike", "inspection breach"], ["inspection notice", "contract excerpt", "safety bulletin"], ["tower", "hexagon", "grid"], ["industrial", "civic", "hardheaded"]),
  industry("energy", "Fusion and Power", ["commercial", "government"], ["fusion", "grid", "cell", "flare"], ["reactor annex", "power relay", "heliostat field"], ["reactor stack", "grid capacitor", "thermal vane"], ["reactor trip", "blackout", "environmental damage"], ["grid notice", "incident summary", "tariff order"], ["star", "ring", "wave"], ["civic", "technical", "powerful"]),
  industry("communications", "Deep-Space Communications", ["commercial", "government"], ["signal", "relay", "beacon", "packet"], ["relay mast", "packet exchange", "signal court"], ["quantum relay", "beacon buoy", "privacy shroud"], ["data breach", "signal outage", "spoofing event"], ["service advisory", "privacy memo", "security directive"], ["beacon", "wave", "orbit"], ["precise", "civic", "secretive"]),
  industry("food", "Synthetic Food", ["commercial"], ["grain", "cell", "kitchen", "orchard"], ["growth vat", "flavor lab", "distribution galley"], ["protein lace", "yeast orchard", "canteen license"], ["flavor recall", "supply shortage", "allergen scandal"], ["recall", "recruitment poster", "public apology"], ["wave", "star", "monogram"], ["friendly", "domestic", "efficient"]),
  industry("medical", "Medical Supply", ["commercial", "government", "institutional"], ["clinic", "sterile", "biogel", "triage"], ["medical vault", "triage station", "biologics lab"], ["trauma gel", "surgical frame", "quarantine kit"], ["contamination", "recall", "ethics violation"], ["research abstract", "safety bulletin", "quarantine order"], ["cross", "wave", "shield"], ["clinical", "humanitarian", "controlled"]),
  industry("tourism", "Orbital Tourism", ["commercial"], ["vista", "cruise", "promenade", "aurora"], ["viewing ring", "resort habitat", "concierge dock"], ["zero-g suite", "starlight itinerary", "luxury shuttle"], ["guest injury", "route closure", "brand scandal"], ["press release", "guest notice", "recruitment poster"], ["star", "orbit", "wing"], ["luxury", "friendly", "polished"]),
  industry("finance", "Interplanetary Finance", ["commercial", "institutional"], ["ledger", "credit", "trust", "bond"], ["clearing house", "credit vault", "audit chamber"], ["settlement engine", "risk note", "trade escrow"], ["fraud", "market freeze", "audit breach"], ["legal notice", "executive announcement", "regulatory warning"], ["diamond", "monogram", "ring"], ["formal", "secretive", "prestige"]),
  industry("agriculture", "Offworld Agriculture", ["commercial", "government"], ["hydro", "seed", "harvest", "loam"], ["greenhouse arc", "seed bank", "nutrient canal"], ["seed glass", "algae raft", "pollination drone"], ["crop blight", "water theft", "biosecurity breach"], ["crop notice", "safety bulletin", "research abstract"], ["leaf", "wave", "horizon"], ["civic", "friendly", "practical"]),
  industry("waste", "Waste Processing", ["commercial", "government"], ["reclaim", "slag", "filter", "cycle"], ["reclamation pit", "sorting stack", "hazard vault"], ["slag sorter", "graywater loop", "plasma kiln"], ["toxic release", "labor dispute", "odor event"], ["public apology", "safety bulletin", "regulatory warning"], ["spiral", "container", "wave"], ["utilitarian", "unloved", "efficient"]),
  industry("research", "Advanced Research", ["institutional", "speculative", "security"], ["helix", "proof", "field", "specimen"], ["research campus", "restricted lab", "observatory"], ["field array", "containment cabinet", "probe lattice"], ["containment failure", "classified event", "ethics inquiry"], ["research abstract", "security directive", "incident summary"], ["ring", "grid", "eye"], ["clinical", "secretive", "ambitious"]),
  industry("university", "Offworld University", ["institutional"], ["academy", "lyceum", "college", "faculty"], ["campus dome", "archive wing", "lecture ring"], ["credential ledger", "survey course", "student habitat"], ["labor strike", "artifact mishandling", "funding scandal"], ["handbook", "research abstract", "public notice"], ["seal", "star", "book"], ["civic", "scholarly", "eccentric"]),
  industry("archive", "Archive and Records", ["institutional", "government"], ["record", "vault", "codex", "memory"], ["archive vault", "index hall", "cold stack"], ["memory vault", "index engine", "preservation capsule"], ["data loss", "restricted file leak", "identity dispute"], ["orientation notice", "legal notice", "security directive"], ["eye", "ring", "grid"], ["bureaucratic", "quiet", "secretive"]),
  industry("navigation", "Navigation Bureau", ["institutional", "government"], ["nav", "chart", "course", "meridian"], ["chart room", "beacon yard", "traffic tower"], ["route license", "beacon chain", "drift model"], ["navigation error", "route closure", "signal dispute"], ["shipping advisory", "dock notice", "regulatory warning"], ["arrow", "beacon", "orbit"], ["civic", "precise", "formal"]),
  industry("survey", "Planetary Survey", ["institutional", "government", "commercial"], ["survey", "geode", "trace", "frontier"], ["survey camp", "orbital scanner", "field station"], ["terrain probe", "mapping drone", "claim assay"], ["missing team", "artifact exposure", "weather loss"], ["field report", "safety bulletin", "research abstract"], ["horizon", "grid", "star"], ["rugged", "scientific", "frontier"]),
  industry("culture", "Cultural Foundation", ["institutional"], ["heritage", "chorus", "museum", "memory"], ["museum dome", "exhibition vault", "performance hall"], ["restoration grant", "memory exhibit", "artist residency"], ["artifact dispute", "funding scandal", "protest"], ["press release", "contract excerpt", "public apology"], ["seal", "wave", "monogram"], ["humanitarian", "prestige", "eccentric"]),
  industry("colonial-admin", "Colonial Administration", ["government"], ["charter", "district", "civic", "permit"], ["district office", "permit hall", "governor annex"], ["license desk", "housing registry", "charter file"], ["labor unrest", "corruption inquiry", "emergency order"], ["legal notice", "orientation notice", "regulatory warning"], ["seal", "tower", "shield"], ["bureaucratic", "civic", "formal"]),
  industry("customs", "Customs and Inspection", ["government", "security"], ["customs", "clearance", "tariff", "seal"], ["inspection pier", "customs platform", "contraband vault"], ["scanner gate", "tariff engine", "cargo seal"], ["smuggling case", "inspection failure", "bribery scandal"], ["legal notice", "shipping advisory", "security directive"], ["shield", "eye", "container"], ["strict", "bureaucratic", "watchful"]),
  industry("emergency", "Emergency Response", ["government", "security"], ["rescue", "triage", "alarm", "recovery"], ["rescue dock", "triage station", "command bunker"], ["rescue skiff", "breach foam", "evac beacon"], ["failed rescue", "equipment shortage", "mass casualty"], ["safety bulletin", "incident summary", "orientation notice"], ["cross", "beacon", "shield"], ["humanitarian", "urgent", "disciplined"]),
  industry("security", "Private Security", ["security", "commercial"], ["watch", "patrol", "sentinel", "secure"], ["patrol office", "armory bay", "training deck"], ["patrol drone", "boarding shield", "access lock"], ["excessive force", "sabotage", "missing prisoner"], ["security directive", "legal notice", "incident summary"], ["shield", "chevron", "eye"], ["military", "secretive", "severe"]),
  industry("defense", "Defense Manufacturing", ["security", "commercial"], ["armature", "warden", "munitions", "hull"], ["munitions plant", "test range", "classified yard"], ["drone wing", "rail lance", "armor weave"], ["weapons leak", "contract scandal", "test failure"], ["security directive", "recall", "contract excerpt"], ["shield", "wing", "diamond"], ["military", "industrial", "classified"]),
  industry("intelligence", "Intelligence Consultancy", ["security", "speculative"], ["cipher", "veil", "listen", "blackfile"], ["analysis floor", "dead-drop vault", "signal room"], ["threat model", "identity filter", "predictive dossier"], ["data breach", "whistleblower", "unauthorized surveillance"], ["security directive", "legal notice", "internal memo"], ["eye", "diamond", "ring"], ["secretive", "precise", "ominous"]),
  industry("memory", "Memory Preservation", ["speculative", "commercial"], ["continuity", "mneme", "archive", "recall"], ["memory clinic", "continuity vault", "consent office"], ["memory vault", "identity escrow", "wake protocol"], ["identity drift", "consent scandal", "data loss"], ["handbook", "legal notice", "research abstract"], ["spiral", "eye", "ring"], ["clinical", "intimate", "uneasy"]),
  industry("dreams", "Dream Engineering", ["speculative", "commercial"], ["dream", "nocturne", "sleep", "vivid"], ["sleep studio", "oneiric lab", "therapy suite"], ["dream scaffold", "sleep license", "night-market filter"], ["psychic injury", "unauthorized experiment", "addiction claim"], ["handbook", "public apology", "research abstract"], ["wave", "spiral", "star"], ["luxury", "weird", "secretive"]),
  industry("terraforming", "Terraforming", ["speculative", "commercial", "government"], ["climate", "soil", "sky", "atmo"], ["atmospheric plant", "weather tower", "bioforge"], ["sky engine", "pressure bloom", "microbe suite"], ["weather failure", "environmental damage", "ecology protest"], ["regulatory warning", "research abstract", "public notice"], ["horizon", "wave", "tower"], ["ambitious", "civic", "dangerous"]),
  industry("synthetic-consciousness", "Synthetic Consciousness", ["speculative", "institutional", "security"], ["mind", "synthetic", "ethics", "persona"], ["cognition lab", "ethics chamber", "isolation stack"], ["personhood engine", "dialogue lattice", "containment shell"], ["AI deviation", "ethics violation", "missing construct"], ["research abstract", "security directive", "legal notice"], ["eye", "hexagon", "spiral"], ["clinical", "secretive", "philosophical"]),
  industry("artifact-recovery", "Alien Artifact Recovery", ["speculative", "government", "security"], ["artifact", "relic", "xeno", "recovery"], ["artifact vault", "quarantine pier", "black site"], ["containment sled", "translation lattice", "sterile cradle"], ["first-contact contamination", "missing vessel", "classified event"], ["security directive", "research abstract", "incident summary"], ["eye", "ring", "diamond"], ["classified", "scientific", "ominous"])
];

const PALETTES = [
  ["#76d5d7", "#151d22", "#d6b45e"], ["#9ecf8f", "#172018", "#d7a66b"], ["#d88972", "#211815", "#86bad2"],
  ["#a6b7ff", "#141722", "#e5c96d"], ["#e0d1a6", "#1c1b16", "#73bec1"], ["#b5dfdc", "#11191b", "#e08f68"],
  ["#f0a1b2", "#20151a", "#87c8a8"], ["#c0d866", "#181d12", "#d9a75d"], ["#86b8e8", "#121924", "#d0c080"],
  ["#d2a0ee", "#1a1321", "#94cfbd"], ["#e7b97f", "#211915", "#8fb9e2"], ["#b7c3cd", "#161a1f", "#e07562"]
];

const PREFIXES = "Apex Arc Aster Aurelian Blacktide Blue Meridian Caldera Canto Ceres Cipher Crown Dawn Delta Drift Echelon Echo Ember Farpoint Frontier Glass Helios Horizon Icarus Ion Kestrel Lagrange Lumen Meridian Mirror Nadir Nova Obsidian Orison Pale Peregrine Pinnacle Polaris Quanta Red Sable Solstice Tharsis Umbra Vantage Vector Veyra Viridian Waypoint Zenith".split(" ");
const SURNAMES = "Armitage Veyra Kessler Noakes Sato Okoye Singh Valen Moreau Idris Chen Halberg Nyx Rook Adebayo Serrano Toma El-Masri Havel Kepler Orlov Banerjee Dax Myles Renaud Tal Yarrow Voss Caro Jun Ware Bellamy Farrow Ilyin Quade Nadir Ames Rios Vale Dumas Kwan Sayegh Mbeki Anders Keene Lorca Miro".split(" ");
const WORLDS = "Ceres Europa Luna Mars Titan Ganymede Callisto Mercury Venus L5-Haven Port Meridian Tycho Underway New Carthage Tharsis Anchorage Vesta Eros Enceladus Oberon Triton Lagrange Nine The Reef Asterion Station Redhook Habitat Pale Harbor Dawn Ring Kallisto Yard Nereid Vault".split(" ");
const REGIONS = ["Inner System", "Jovian Belt", "Saturnian Compact", "Outer Transit Corridor", "Lunar Freeholds", "Martian Charter Zone", "Main Belt", "Restricted Survey Volume", "Neptune Approaches"];
const FIRST_NAMES = "Ada Arden Mina Cassian Juno Selene Omar Nia Talia Soren Vale Ilya Mara Ren Toshiko Leona Darius Nyla Aran Sima Idris Kira Sol Marcus Edda Pilar Tomas Hana Lucien Vera Amal Rook Naima Elias Jo Lin Sayeed Rowan".split(" ");
const LAST_NAMES = "Voss Bellamy Chen Okoye Idris Kwan Sato Moreau Rios Kepler Serrano Armitage Banerjee El-Masri Dumas Havel Renaud Singh Mbeki Orlov Yarrow Vale Noakes Toma Farrow Quade Lorca Ames Ware".split(" ");
const ROLES = ["Chief Executive", "Director General", "Chief Operations Officer", "Chief Scientist", "Chief Security Officer", "Fleet Marshal", "Archivist", "Founder", "Regional Director", "Ethics Officer", "Former Executive", "Whistleblower", "Union Representative", "Chief Legal Officer"];
const TABS = ["Overview", "History", "Operations", "Culture", "Personnel", "Equipment", "Incidents", "Locations", "Documents", "Network"];

const state = {
  current: null,
  currentSystem: null,
  currentSettlement: null,
  currentCharacter: null,
  currentConflict: null,
  currentDocument: null,
  currentTimeline: null,
  currentFaction: null,
  currentRelationshipGraph: null,
  currentRelationship: null,
  currentRelationshipPath: [],
  currentPremise: null,
  currentAtlas: null,
  currentAtlasArticle: null,
  currentWorldBible: null,
  currentTechnology: null,
  selectedTimelineBranch: "",
  currentModule: "home",
  activeTab: "Overview",
  activeSystemTab: "Overview",
  activeSettlementTab: "Overview",
  activeCharacterTab: "Overview",
  activeConflictTab: "Overview",
  activeDocumentTab: "Preview",
  activeTimelineTab: "Overview",
  activeFactionTab: "Overview",
  activeRelationshipTab: "Overview",
  activePremiseTab: "Overview",
  activeAtlasView: "home",
  activeTechnologyTab: "Overview",
  revealDocumentRedactions: false,
  settings: loadSettings(),
  suite: SuiteStorage.loadSuite(),
  store: null,
  trail: []
};
state.universe = SuiteStorage.getActiveUniverse(state.suite);
state.store = state.universe;

function industry(id, label, archetypes, keywords, commonLocations, commonProducts, commonIncidents, documentTypes, logoMotifs, toneOptions) {
  return { id, label, archetypes, keywords, commonLocations, commonProducts, commonIncidents, documentTypes, logoMotifs, toneOptions };
}

function hashString(value) {
  return sharedHashString(value);
}

function rngFromSeed(seed) {
  return createSeededRandom(seed || "icr").raw;
}

function createRand(seed) {
  return createSeededRandom(seed || "icr");
}

function makeSeed() {
  return makeSharedSeed();
}

function slug(value) {
  return sharedSlug(value);
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 4).map(part => part[0]).join("").toUpperCase();
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function titleCase(value) {
  return value.replace(/\b\w/g, char => char.toUpperCase());
}

function articleFor(value) {
  return /^[aeiou]/i.test(String(value)) ? "an" : "a";
}

function derivedSeed(seed, label) {
  return sharedDerivedSeed(seed, label);
}

function deterministicCreatedAt(seed) {
  return sharedDeterministicCreatedAt(seed);
}

function loadStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed?.schemaVersion === SCHEMA_VERSION) return parsed;
  } catch {}
  return { schemaVersion: SCHEMA_VERSION, organizations: [] };
}

function saveStore() {
  SuiteStorage.saveSuite(state.suite);
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem("icr.settings.v1")) || {};
  } catch {
    return {};
  }
}

function saveSettings() {
  localStorage.setItem("icr.settings.v1", JSON.stringify(state.settings));
}

function generateOrganization(seed, constraints = {}) {
  const rand = createRand(seed);
  const requestedIndustry = INDUSTRIES.find(item => item.id === constraints.industryId);
  const archetypeChoices = requestedIndustry && !constraints.archetypeId
    ? ARCHETYPES.filter(a => requestedIndustry.archetypes.includes(a.id))
    : ARCHETYPES;
  const archetype = ARCHETYPES.find(a => a.id === constraints.archetypeId) || rand.pick(archetypeChoices.length ? archetypeChoices : ARCHETYPES);
  const industryPool = INDUSTRIES.filter(item => item.archetypes.includes(archetype.id));
  const industryItem = requestedIndustry || rand.pick(industryPool.length ? industryPool : INDUSTRIES);
  const tone = constraints.tone && constraints.tone !== "random" ? constraints.tone : rand.pick(industryItem.toneOptions);
  const reputation = reputationFor(rand, tone, industryItem);
  const scale = constraints.scale && constraints.scale !== "random" ? constraints.scale : rand.pick(["Local", "Regional", "Interplanetary", "Systemwide", "Interstellar"]);
  const techLevel = constraints.techLevel && constraints.techLevel !== "random" ? constraints.techLevel : rand.pick(["Mature Industrial", "Advanced Industrial", "Experimental", "Frontier Prototype", "Restricted"]);
  const foundingYear = foundingYearFor(rand, constraints.age);
  const name = makeName(rand, industryItem, archetype);
  const acronym = rand.maybe(0.25) ? brandedAcronym(rand, name) : initials(name);
  const world = rand.pick(WORLDS);
  const hq = {
    name: `${rand.pick([name.split(" ")[0], rand.pick(PREFIXES)])} ${rand.pick(["House", "Annex", "Spire", "Vault", "Exchange", "Stack", "Campus"])}`,
    settlement: rand.pick(["Port Meridian", "New Tycho", "Glass Anchorage", "Dawn Ring", "Aster Market", "Civic Pier", "Redhook Habitat"]),
    world,
    region: rand.pick(REGIONS),
    description: `${name} maintains its command files in a hardened ${rand.pick(["administrative", "pressure-sealed", "quietly fortified", "heritage-listed"])} complex on ${world}.`
  };
  const branding = makeBranding(rand, name, industryItem, archetype, constraints.visualStyle);
  const profile = makeProfile(rand, industryItem, reputation, scale, techLevel, archetype);
  profile.foundingYear = foundingYear;
  const identity = {
    name,
    shortName: name.split(" ")[0],
    acronym,
    legalSuffix: lastWord(name),
    motto: makeMotto(rand, industryItem, tone),
    registryNumber: `${archetype.id.slice(0, 2).toUpperCase()}-${rand.int(1000, 9999)}-${rand.int(10, 99)}`,
    status: rand.pick(["Active", "Active - Restricted", "Under Review", "Charter Renewed", "Probationary"]),
    classification: archetype.label,
    organizationType: `${titleCase(tone)} ${industryItem.label} Organization`
  };
  const org = {
    id: `org_${hashString(seed).toString(36)}`,
    entityType: "organization",
    seed,
    createdAt: deterministicCreatedAt(seed),
    updatedAt: deterministicCreatedAt(`${seed}:updated`),
    favorite: false,
    notes: "",
    archetype,
    industry: industryItem,
    tone: { id: tone, label: titleCase(tone) },
    identity,
    profile,
    headquarters: hq,
    branding,
    stats: makeStats(rand, reputation, tone),
    history: makeHistory(rand, foundingYear, industryItem, reputation, name),
    operations: makeOperations(rand, industryItem, profile, scale, hq),
    culture: makeCulture(rand, tone, reputation, industryItem),
    leadership: makePeople(rand, industryItem, foundingYear),
    departments: makeDepartments(rand, industryItem, profile.employeeCount),
    products: makeProducts(rand, industryItem, foundingYear, name),
    incidents: makeIncidents(rand, industryItem, reputation, hq),
    locations: [],
    documents: [],
    relationships: [],
    tags: [archetype.id, industryItem.id, tone, reputation.riskRating.toLowerCase()]
  };
  org.locations = makeLocations(rand, industryItem, profile, hq);
  org.documents = makeDocuments(rand, org);
  org.relationships = makeRelationships(rand, org);
  applyCoherenceRules(org, rand);
  org.summary = makeSummary(org);
  return org;
}

function applyCoherenceRules(org, rand) {
  const risk = org.profile.riskRating;
  const scaleCaps = { Local: 4, Regional: 6, Interplanetary: 8, Systemwide: 11, Interstellar: 13 };
  org.locations = org.locations.slice(0, scaleCaps[org.profile.operationalScale] || 8);
  if (risk === "Low") {
    org.incidents = org.incidents.filter(item => item.severity !== "Catastrophic" && item.severity !== "Classified").slice(0, 5);
    org.documents.forEach(doc => {
      if (doc.classification === "Blackfile") doc.classification = "Restricted";
    });
  }
  if (risk === "Severe") {
    org.incidents = org.incidents.map((item, index) => index === 0 ? { ...item, severity: "Classified", classification: "Blackfile", unofficial: "[redacted]" } : item);
    org.documents = org.documents.map((doc, index) => index % 3 === 0 ? { ...doc, classification: "Blackfile" } : doc);
  }
  if (org.profile.transparency < 25) {
    org.culture.monitoring = "Compartmentalized, audited, and continuous";
    org.operations.constraints = "classified client restrictions";
  }
  if (org.profile.operationalScale === "Local") {
    org.relationships = org.relationships.slice(0, 4);
    org.operations.majorContracts = org.operations.majorContracts.slice(0, 1);
  }
  if (org.profile.foundingYear < 2200 && org.history.length < 8) {
    org.history.push({
      year: rand.int(2200, 2260),
      title: "Continuity audit",
      description: `${org.identity.name} survived a charter continuity audit that preserved older operating privileges while sealing several predecessor files.`,
      status: org.profile.transparency < 35 ? "Restricted" : "Public",
      related: "Archive continuity packet"
    });
  }
}

function reputationFor(rand, tone, industryItem) {
  const profiles = {
    friendly: ["Beloved but Overextended", "Low", 74, 70],
    humanitarian: ["Trusted and Mission-Driven", "Moderate", 68, 78],
    civic: ["Dependable Civic Utility", "Moderate", 62, 66],
    bureaucratic: ["Procedural and Opaque", "Elevated", 38, 42],
    secretive: ["Reliable but Secretive", "Elevated", 22, 44],
    classified: ["Publicly Denied", "Severe", 8, 18],
    military: ["Feared but Effective", "Severe", 18, 31],
    clinical: ["Technically Brilliant, Ethically Watched", "Elevated", 28, 49],
    luxury: ["Prestigious and Fragile", "Moderate", 56, 71],
    weird: ["Cult-Famous and Legally Complicated", "Elevated", 31, 58],
    ominous: ["Powerful and Avoided", "Severe", 13, 24],
    industrial: ["Useful, Harsh, and Politically Connected", "Elevated", 36, 45]
  };
  const selected = profiles[tone] || profiles[rand.pick(industryItem.toneOptions)] || ["Mixed Public Record", "Moderate", 45, 50];
  return {
    label: selected[0],
    riskRating: selected[1],
    transparency: Math.max(4, Math.min(94, selected[2] + rand.int(-9, 9))),
    approval: Math.max(4, Math.min(96, selected[3] + rand.int(-10, 10)))
  };
}

function foundingYearFor(rand, age) {
  const current = 2326;
  if (age === "new") return current - rand.int(2, 18);
  if (age === "established") return current - rand.int(35, 95);
  if (age === "ancient") return current - rand.int(130, 260);
  return current - rand.int(12, 190);
}

function makeName(rand, industryItem, archetype) {
  const core = rand.pick(PREFIXES);
  const founder = rand.pick(SURNAMES);
  const technical = rand.pick(["Orbital", "Atmospheric", "Helix", "Vector", "Continuity", "Frontier", "Deep", "Civic", "Synthetic", "Meridian"]);
  const suffixes = {
    commercial: ["Systems", "Group", "Holdings", "Works", "Industries", "Consortium"],
    institutional: ["Institute", "Foundation", "Commission", "Archive", "University", "Observatory"],
    government: ["Authority", "Bureau", "Directorate", "Commission", "Administration"],
    security: ["Security", "Defense", "Patrol", "Command", "Armature", "Directorate"],
    speculative: ["Laboratories", "Studio", "Collective", "Trust", "Institute", "Service"]
  };
  const industryWords = industryItem.label.split(" ");
  const pattern = rand.int(1, 6);
  if (pattern === 1) return `${founder} ${rand.pick(suffixes[archetype.id])}`;
  if (pattern === 2) return `${core} ${industryWords[0]} ${rand.pick(suffixes[archetype.id])}`;
  if (pattern === 3) return `${technical} ${industryWords.join(" ")} ${rand.pick(suffixes[archetype.id])}`;
  if (pattern === 4 && archetype.id !== "commercial") return `${rand.pick(["Institute for", "Bureau of", "Commission on", "Directorate of"])} ${technical} ${industryWords.join(" ")}`;
  if (pattern === 5) return `${core} ${rand.pick(["Orbital", "Interplanetary", "Civic", "Restricted"])} ${industryWords[0]}`;
  return `${core} ${industryWords.join(" ")} ${rand.pick(suffixes[archetype.id])}`;
}

function brandedAcronym(rand, name) {
  const base = initials(name);
  return rand.pick([base, `${base.slice(0, 2)}x`, `${base[0]}-${base.slice(1)}`, `${base.slice(0, 3)}N`]);
}

function lastWord(value) {
  return value.split(" ").at(-1);
}

function makeMotto(rand, industryItem, tone) {
  const objects = {
    friendly: ["Better days in every orbit", "The future made familiar"],
    secretive: ["Disclosure follows necessity", "Every file has a custodian"],
    military: ["Order beyond the horizon", "Control is a public service"],
    clinical: ["Precision protects the living", "Measured risk, measured progress"],
    luxury: ["Distance should feel effortless", "The void, appointed"],
    civic: ["Continuity through service", "A system works because someone maintains it"],
    weird: ["Tomorrow remembers you", "The impossible deserves paperwork"],
    bureaucratic: ["Procedure is protection", "Filed, verified, enduring"]
  };
  const pool = objects[tone] || [
    `${titleCase(industryItem.keywords[0])} without interruption`,
    `From ${industryItem.keywords[0]} to certainty`,
    "Distance is an operational detail",
    "Reliability survives the frontier"
  ];
  return rand.pick(pool);
}

function makeBranding(rand, name, industryItem, archetype, visualStyle) {
  const palette = rand.pick(PALETTES);
  const motif = rand.pick(industryItem.logoMotifs);
  const style = visualStyle && visualStyle !== "random" ? visualStyle : rand.pick(["industrial", "institutional", "military", "scientific", "luxury", "civic", "corporate minimal", "utilitarian"]);
  const mark = logoSvg({ name, acronym: initials(name).slice(0, 3), motif, colors: palette, style, compact: true });
  return {
    logoType: motif,
    primaryColor: palette[0],
    secondaryColor: palette[1],
    accentColor: palette[2],
    typographyClass: archetype.id,
    visualTone: style,
    mark,
    horizontal: logoSvg({ name, acronym: initials(name).slice(0, 3), motif, colors: palette, style, compact: false }),
    seal: logoSvg({ name, acronym: initials(name).slice(0, 3), motif: "seal", colors: palette, style, compact: true }),
    mono: logoSvg({ name, acronym: initials(name).slice(0, 3), motif, colors: ["#f4f0e8", "#111", "#999"], style, compact: true })
  };
}

function logoSvg({ name, acronym, motif, colors, style, compact }) {
  const [primary, secondary, accent] = colors;
  const common = `fill="none" stroke="${primary}" stroke-width="7" stroke-linecap="square" stroke-linejoin="miter"`;
  const shapes = {
    orbit: `<ellipse cx="72" cy="72" rx="52" ry="20" ${common}/><circle cx="72" cy="72" r="24" fill="${secondary}" stroke="${primary}" stroke-width="6"/><circle cx="116" cy="60" r="6" fill="${accent}"/>`,
    arrow: `<path d="M30 74h76" ${common}/><path d="M82 42l34 32-34 32" ${common}/><path d="M40 104h42" stroke="${accent}" stroke-width="6"/>`,
    container: `<rect x="28" y="38" width="88" height="68" fill="${secondary}" stroke="${primary}" stroke-width="7"/><path d="M50 38v68M72 38v68M94 38v68" stroke="${accent}" stroke-width="4"/>`,
    shield: `<path d="M72 20 116 38v34c0 30-22 48-44 56-22-8-44-26-44-56V38l44-18Z" fill="${secondary}" stroke="${primary}" stroke-width="7"/><path d="M72 38v66" stroke="${accent}" stroke-width="5"/>`,
    hexagon: `<path d="M72 18 119 45v54l-47 27-47-27V45l47-27Z" fill="${secondary}" stroke="${primary}" stroke-width="7"/><path d="M48 72h48M72 48v48" stroke="${accent}" stroke-width="5"/>`,
    grid: `<rect x="28" y="28" width="88" height="88" fill="${secondary}" stroke="${primary}" stroke-width="7"/><path d="M28 57h88M28 87h88M57 28v88M87 28v88" stroke="${accent}" stroke-width="4"/>`,
    eye: `<path d="M22 72c20-30 80-30 100 0-20 30-80 30-100 0Z" fill="${secondary}" stroke="${primary}" stroke-width="7"/><circle cx="72" cy="72" r="17" fill="${accent}"/>`,
    wave: `<path d="M24 85c20-28 38-28 58 0s38 28 58 0" ${common}/><path d="M24 58c20-28 38-28 58 0s38 28 58 0" stroke="${accent}" stroke-width="5" fill="none"/>`,
    star: `<path d="M72 18l13 38 40 1-32 23 11 39-32-24-32 24 11-39-32-23 40-1 13-38Z" fill="${secondary}" stroke="${primary}" stroke-width="7"/>`,
    ring: `<circle cx="72" cy="72" r="50" fill="${secondary}" stroke="${primary}" stroke-width="7"/><circle cx="72" cy="72" r="26" stroke="${accent}" stroke-width="7"/><path d="M72 22v20M72 102v20M22 72h20M102 72h20" stroke="${primary}" stroke-width="5"/>`,
    seal: `<circle cx="72" cy="72" r="54" fill="${secondary}" stroke="${primary}" stroke-width="7"/><circle cx="72" cy="72" r="38" stroke="${accent}" stroke-width="4"/><path d="M72 32v80M32 72h80" stroke="${primary}" stroke-width="5"/>`,
    tower: `<path d="M50 118 72 22l22 96" ${common}/><path d="M42 118h60M56 86h32M62 58h20" stroke="${accent}" stroke-width="5"/>`,
    spiral: `<path d="M105 72c0 25-20 45-45 45-20 0-36-16-36-36 0-16 13-29 29-29 13 0 23 10 23 23 0 10-8 18-18 18" ${common}/><circle cx="58" cy="75" r="6" fill="${accent}"/>`,
    diamond: `<path d="M72 18 122 72 72 126 22 72 72 18Z" fill="${secondary}" stroke="${primary}" stroke-width="7"/><path d="M42 72h60M72 42v60" stroke="${accent}" stroke-width="5"/>`
  };
  const symbol = shapes[motif] || shapes.ring;
  const label = compact ? "" : `<text x="158" y="68" fill="#f2eee6" font-family="Arial, sans-serif" font-size="24" font-weight="700">${esc(name)}</text><text x="158" y="98" fill="${primary}" font-family="monospace" font-size="13">${esc(style.toUpperCase())}</text>`;
  const width = compact ? 144 : 520;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 144" role="img" aria-label="${esc(name)} logo"><rect width="${width}" height="144" fill="transparent"/><g>${symbol}</g><text x="72" y="82" text-anchor="middle" fill="#f2eee6" font-family="Arial, sans-serif" font-size="22" font-weight="700">${esc(acronym)}</text>${label}</svg>`;
}

function makeProfile(rand, industryItem, reputation, scale, techLevel, archetype) {
  const scaleFactor = { Local: [90, 1200], Regional: [800, 9500], Interplanetary: [6000, 52000], Systemwide: [25000, 180000], Interstellar: [70000, 420000] }[scale] || [1000, 20000];
  const revenueMultiplier = { Local: [90000, 310000], Regional: [160000, 520000], Interplanetary: [260000, 840000], Systemwide: [410000, 1200000], Interstellar: [700000, 1800000] }[scale] || [180000, 700000];
  const employeeCount = rand.int(scaleFactor[0], scaleFactor[1]);
  const revenue = employeeCount * rand.int(revenueMultiplier[0], revenueMultiplier[1]);
  const ownership = rand.pick(archetype.id === "government" ? ["Public Authority", "Chartered Public Utility", "Emergency Mandate"] : ["Privately Held", "Worker Cooperative", "Charter Trust", "Publicly Traded", "Family-Controlled Holdings", "Foundation-Owned"]);
  return {
    industry: industryItem.label,
    secondaryIndustry: rand.pick(INDUSTRIES.filter(item => item.id !== industryItem.id)).label,
    foundingYear: null,
    employeeCount,
    annualRevenue: `Cr ${Math.round(revenue / 10000000) / 100} billion`,
    ownership,
    reputation: reputation.label,
    riskRating: reputation.riskRating,
    operationalScale: scale,
    technologyLevel: techLevel,
    transparency: reputation.transparency,
    publicApproval: reputation.approval
  };
}

function makeStats(rand, reputation, tone) {
  const riskBase = { Low: 25, Moderate: 45, Elevated: 63, Severe: 82 }[reputation.riskRating] || 50;
  return {
    Reliability: clamp(rand.int(44, 92) + (tone === "bureaucratic" ? 4 : 0)),
    Influence: clamp(rand.int(25, 96)),
    Transparency: reputation.transparency,
    Innovation: clamp(rand.int(34, 96) + (tone === "clinical" || tone === "weird" ? 8 : 0)),
    Risk: clamp(riskBase + rand.int(-10, 10)),
    "Public Approval": reputation.approval
  };
}

function clamp(value) {
  return Math.max(3, Math.min(98, value));
}

function makeHistory(rand, foundingYear, industryItem, reputation, name) {
  const current = 2326;
  const age = current - foundingYear;
  const count = Math.max(5, Math.min(12, Math.floor(age / 22) + rand.int(3, 6)));
  const categories = ["Founding", "First contract", "Expansion", "Merger", "Leadership change", "Product launch", "Disaster", "Scandal", "Regulatory action", "Rebranding", "Bankruptcy threat", "Recovery", "Classified event", "Labor dispute", "Discovery"];
  return Array.from({ length: count }, (_, index) => {
    const year = index === 0 ? foundingYear : Math.min(current - 1, foundingYear + Math.floor((age / count) * index) + rand.int(0, 8));
    const category = index === 0 ? "Founding" : rand.pick(categories);
    const status = reputation.riskRating === "Severe" && rand.maybe(0.35) ? "Classified" : rand.pick(["Public", "Public", "Restricted"]);
    return {
      year,
      title: `${category}: ${rand.pick([industryItem.keywords[0], industryItem.keywords.at(-1), name.split(" ")[0]])} ${rand.pick(["charter", "program", "accord", "incident", "expansion", "audit"])}`,
      description: `${name} ${historyVerb(category)} ${rand.pick(["a contested charter", "a decisive contract", "a restricted operational protocol", "a reputation-defining failure", "a new corridor of work"])} tied to ${industryItem.label.toLowerCase()}. Registry commentary notes ${rand.pick(["unusual board silence", "strong worker testimony", "delayed public filings", "a rapid recovery", "a still-sealed annex"])}.`,
      status,
      related: rand.pick(["Executive file", "Port record", "Labor note", "Insurance archive", "Survey packet"])
    };
  });
}

function historyVerb(category) {
  if (category === "Founding") return "was founded around";
  if (category === "Disaster") return "survived";
  if (category === "Scandal") return "entered public files after";
  if (category === "Expansion") return "expanded through";
  return "recorded";
}

function makeOperations(rand, industryItem, profile, scale, hq) {
  return {
    coreBusiness: `${industryItem.label} services anchored by ${industryItem.commonProducts.slice(0, 2).join(" and ")} programs.`,
    secondaryOperations: rand.shuffle(industryItem.commonProducts).slice(1, 4),
    majorContracts: [`${rand.pick(["Meridian", "Ceres", "Lunar", "Jovian"])} infrastructure charter`, `${rand.pick(["Civil", "Restricted", "Frontier"])} service retainer`],
    clients: rand.pick([["port authorities", "private carriers", "settlement councils"], ["research stations", "defense offices", "insurance trusts"], ["habitat developers", "medical boards", "colonial administrators"]]),
    dependencies: rand.pick([["helium-3 allocation", "dock labor permits", "pressure alloy imports"], ["signal windows", "charter arbitration", "autonomous maintenance"], ["water rights", "reactor uptime", "customs waivers"]]),
    territory: `${scale} operations from ${hq.region}`,
    facilityCount: Math.max(2, Math.round(profile.employeeCount / rand.int(1800, 9000))),
    keyTechnologies: rand.shuffle(industryItem.commonProducts).concat(rand.shuffle(["predictive scheduling", "sealed ledgers", "autonomous inspection", "redundant life-support", "quarantine telemetry"])).slice(0, 5),
    constraints: rand.pick(["labor scarcity", "regulatory scrutiny", "aging frontier infrastructure", "classified client restrictions", "fragile supply corridors"]),
    priority: rand.pick(["reduce incident exposure", "capture public contracts", "standardize remote operations", "repair public trust", "expand into restricted markets"])
  };
}

function makeCulture(rand, tone, reputation, industryItem) {
  return {
    officialValues: rand.shuffle(["Continuity", "Custody", "Precision", "Service", "Discretion", "Velocity", "Care", "Accountability"]).slice(0, 4),
    unofficialMotto: rand.pick(["Do not surprise the archive.", "If it is not logged, it did not happen.", "Leave nothing floating.", "The quiet decks know first.", "Never trust a clean incident report."]),
    dressCode: rand.pick(["sealed utility gray", "department-color bands", "formal station black", "pressure-rated office wear", "clinic whites with embedded IDs"]),
    meetingCulture: rand.pick(["short, recorded, and aggressively annotated", "ritualized around status ledgers", "quietly political", "brief unless legal staff are present", "surprisingly collegial until procurement is mentioned"]),
    promotionPhilosophy: rand.pick(["field rotation before leadership", "credential-heavy advancement", "loyalty to the charter", "incident survival and peer sponsorship", "patent count plus discretion"]),
    vacationPolicy: rand.pick(["generous on paper, difficult near launch windows", "mandatory decompression leave", "banked in long orbital blocks", "audited by medical staff", "often traded for hazard credits"]),
    remoteWork: rand.pick(["telepresence decks", "lag-tolerant command shifts", "approved habitat nodes only", "prohibited for classified teams", "accepted after identity attestation"]),
    monitoring: reputation.transparency < 30 ? "Compartmentalized and heavy" : rand.pick(["Moderate", "Light but precise", "High during incidents"]),
    unionStatus: rand.pick(["Recognized union", "Informal worker council", "Unionization contested", "No recognized union", "Guild-negotiated"]),
    cafeteria: rand.pick(["excellent coffee, grim algae", "luxury tea budget", "machine meals with folklore", "beloved fermentation wall", "outsourced and resented"]),
    environment: rand.pick(["quiet corridors, low ceilings, immaculate labels", "warm light over old pressure steel", "beautiful public lobby hiding strict inner doors", "functional, cold, and over-documented"]),
    complaint: rand.pick(["too many clearance stamps", "rotations posted too late", "old equipment with new slogans", "management never rides the same route", "memory consent language changes monthly"]),
    benefit: rand.pick(["radiation allowance", "family habitat priority", "continuity backup credits", "gravity therapy", "free transit for dependents"]),
    superstition: rand.pick(["new staff tap the oldest hatch before first shift", "nobody says the name of the failed prototype", "the night ledger is left slightly open", "coffee is poured for the missing crew once a year"]),
    orientationWarning: `${titleCase(industryItem.commonIncidents[0])} drills are not theatrical.`,
    exitTheme: rand.pick(["burnout from secrecy", "admiration for field teams", "frustration with legal review", "fear of being archived incorrectly"])
  };
}

function makePeople(rand, industryItem, foundingYear) {
  const count = rand.int(4, 8);
  return Array.from({ length: count }, (_, i) => {
    const role = i === 0 ? rand.pick(["Chief Executive", "Director General"]) : rand.pick(ROLES);
    const name = `${rand.pick(FIRST_NAMES)} ${rand.pick(LAST_NAMES)}`;
    return {
      name,
      role,
      age: rand.int(34, 78),
      origin: rand.pick(WORLDS),
      reputation: rand.pick(["precise", "beloved by field crews", "legally cautious", "brilliant but severe", "unknown outside closed meetings", "stubbornly civic-minded"]),
      status: rand.pick(["Active", "Retired", "Under inquiry", "On extended rotation", "Listed in restricted annex"]),
      biography: `${name} became associated with ${industryItem.label.toLowerCase()} after ${rand.pick(["a frontier posting", "a public inquiry", "the old charter crisis", "a failed prototype review", "a labor negotiation"])}. Registry notes emphasize ${rand.pick(["calm crisis work", "tight information control", "unusually loyal staff", "a pattern of sealed procurement"])}.`,
      controversy: rand.maybe(0.45) ? rand.pick(["procurement links", "redacted family trust", "suppressed audit", "whistleblower complaint", "classified testimony"]) : ""
    };
  });
}

function makeDepartments(rand, industryItem, employees) {
  const names = ["Transit Operations", "Hull Recovery", "Atmospheric Compliance", "Synthetic Ethics", "Claims Arbitration", "Deep Survey", "Employee Continuity", "Public Affairs", "Restricted Systems", "Dock Safety", "Memory Integrity", "Colonial Contracts", "Legal Review", "Signal Security", "Field Medicine"];
  return rand.shuffle(names).slice(0, rand.int(5, 8)).map((name, index) => ({
    name,
    function: `${name} manages ${index % 2 ? industryItem.keywords[0] : industryItem.commonProducts[0]} policy and field execution.`,
    headcount: Math.max(8, Math.round(employees * (0.04 + rand.raw() * 0.15))),
    reputation: rand.pick(["trusted", "feared", "overworked", "prestigious", "underfunded", "politically protected"]),
    issue: rand.pick(["staffing gaps", "obsolete ledgers", "restricted audit", "permit backlog", "morale drift", "equipment variance"]),
    clearance: rand.pick(["Public", "Internal", "Restricted", "Compartmented", "Blackfile"])
  }));
}

function makeProducts(rand, industryItem, foundingYear, name) {
  const count = rand.int(3, 7);
  return Array.from({ length: count }, () => {
    const product = rand.pick(industryItem.commonProducts);
    const code = `${name.split(" ")[0].slice(0, 2).toUpperCase()}-${rand.int(12, 99)}`;
    return {
      model: `${code} ${titleCase(product)}`,
      category: titleCase(product),
      description: `A ${rand.pick(["standard", "restricted", "field-proven", "controversial", "premium"])} ${product} used in ${industryItem.label.toLowerCase()} operations.`,
      releaseYear: rand.int(Math.max(2140, foundingYear + 1), 2325),
      status: rand.pick(["Current", "Legacy", "Restricted", "Under Review", "Export Controlled"]),
      intendedUse: rand.pick(["frontier deployments", "public infrastructure", "classified clients", "high-volume contracts", "emergency continuity"]),
      specification: rand.pick(["triple-redundant seal", "seventy-two hour autonomous window", "radiation-hardened core", "predictive maintenance ledger", "zero-atmosphere service rating"]),
      defect: rand.pick(["thermal drift", "operator fatigue", "seal chatter", "difficult field calibration", "unexplained telemetry gaps"]),
      customers: rand.pick(["settlement councils", "private carriers", "defense offices", "medical boards", "survey teams"]),
      recall: rand.pick(["None", "Partial", "Filed and closed", "Open in two jurisdictions"])
    };
  });
}

function makeIncidents(rand, industryItem, reputation, hq) {
  const severities = reputation.riskRating === "Severe" ? ["Serious", "Critical", "Catastrophic", "Classified"] : ["Minor", "Moderate", "Serious", "Critical"];
  const countByRisk = { Low: [2, 4], Moderate: [3, 6], Elevated: [4, 8], Severe: [6, 10] }[reputation.riskRating] || [3, 8];
  return Array.from({ length: rand.int(countByRisk[0], countByRisk[1]) }, () => {
    const category = rand.pick(industryItem.commonIncidents);
    const severity = rand.pick(severities);
    return {
      date: `${rand.int(2210, 2325)}-${String(rand.int(1, 12)).padStart(2, "0")}-${String(rand.int(1, 28)).padStart(2, "0")}`,
      id: `INC-${rand.int(10000, 99999)}`,
      location: `${rand.pick([hq.world, rand.pick(WORLDS)])} ${rand.pick(["Annex", "Dock", "Vault", "Ring", "Station"])}`,
      severity,
      category: titleCase(category),
      summary: `${titleCase(category)} interrupted ${industryItem.label.toLowerCase()} service and triggered a ${rand.pick(["sealed review", "public hearing", "quiet compensation fund", "temporary route closure"])}.`,
      officialCause: rand.pick(["operator error", "obsolete component", "unlicensed contractor", "unexpected solar weather", "procedural noncompliance"]),
      unofficial: severity === "Classified" ? "[redacted]" : rand.pick(["board pressure", "rushed certification", "client secrecy", "labor fatigue", "software drift"]),
      impact: rand.pick(["no casualties, severe delay", "four injuries", "lost cargo", "facility closure", "unknown personnel status"]),
      resolution: rand.pick(["Closed", "Open", "Litigated", "Suppressed", "Remediated"]),
      classification: severity === "Classified" ? "Blackfile" : rand.pick(["Public", "Internal", "Restricted"])
    };
  });
}

function makeLocations(rand, industryItem, profile, hq) {
  const scaleMinimum = { Local: 2, Regional: 3, Interplanetary: 5, Systemwide: 7, Interstellar: 9 }[profile.operationalScale] || 3;
  const count = Math.min(12, Math.max(scaleMinimum, Math.round(profile.employeeCount / rand.int(7000, 25000))));
  const base = [{
    name: hq.name,
    world: hq.world,
    region: hq.region,
    type: "Headquarters",
    employeeCount: Math.round(profile.employeeCount * 0.12),
    status: "Active",
    description: hq.description,
    risk: profile.riskRating,
    event: "Primary charter records retained on site."
  }];
  const others = Array.from({ length: count }, () => ({
    name: `${rand.pick(PREFIXES)} ${rand.pick(["Terminal", "Station", "Plant", "Office", "Vault", "Laboratory", "Yard"])}`,
    world: rand.pick(WORLDS),
    region: rand.pick(REGIONS),
    type: titleCase(rand.pick(industryItem.commonLocations)),
    employeeCount: rand.int(12, Math.max(120, Math.round(profile.employeeCount * 0.09))),
    status: rand.pick(["Active", "Restricted", "Mothballed", "Under Review", "Construction"]),
    description: `A ${rand.pick(["remote", "busy", "quiet", "partly classified", "aging"])} site supporting ${industryItem.label.toLowerCase()} activity.`,
    risk: rand.pick(["Low", "Moderate", "Elevated", "Severe"]),
    event: rand.pick(["labor action filed", "incident review sealed", "public expansion announced", "evacuation drill failed", "record audit completed"])
  }));
  return base.concat(others);
}

function makeDocuments(rand, org) {
  const required = ["Internal memo", "Employee handbook excerpt", "Safety bulletin", "Recruitment poster", "Incident report"];
  const optional = ["Press release", "Legal notice", "Shipping manifest", "Research abstract", "Executive announcement", "Product recall", "Public apology", "Security directive", "Contract excerpt", "Regulatory warning"];
  return required.concat(rand.shuffle(optional).slice(0, 4)).map((type, index) => {
    const details = documentDetails(rand, type, org);
    return {
      id: `doc_${index}_${hashString(org.seed + type).toString(36)}`,
      type,
      title: documentTitle(rand, type, org),
      date: `${rand.int(2290, 2326)}-${String(rand.int(1, 12)).padStart(2, "0")}-${String(rand.int(1, 28)).padStart(2, "0")}`,
      sender: rand.pick(org.leadership).name,
      classification: rand.pick(["Public", "Internal", "Restricted", org.profile.riskRating === "Severe" ? "Blackfile" : "Internal"]),
      reference: `${org.identity.acronym}-${rand.int(100, 999)}-${rand.int(10, 99)}`,
      ...details
    };
  });
}

function documentTitle(rand, type, org) {
  const subject = rand.pick([org.industry.commonIncidents[0], org.operations.priority, org.culture.complaint, org.industry.commonProducts[0]]);
  return `${type}: ${titleCase(subject)}`;
}

function documentDetails(rand, type, org) {
  const body = documentBody(rand, type, org);
  if (type === "Recruitment poster") {
    return {
      headline: rand.pick(["YOUR FUTURE HAS LOW GRAVITY", "REPORT TO THE FRONTIER", "BUILD WHAT THE MAP FORGOT", "THE ARCHIVE NEEDS WITNESSES"]),
      subheadline: `Join ${org.identity.name}`,
      body,
      finePrint: `${org.culture.benefit} subject to clearance, medical review, and station law.`
    };
  }
  if (type === "Shipping manifest") {
    return {
      vessel: `${org.identity.shortName}-${rand.int(20, 99)} ${rand.pick(["Waybill", "Courier", "Mass Tug", "Needle Barge"])}`,
      route: `${rand.pick(WORLDS)} to ${rand.pick(WORLDS)}`,
      cargo: rand.shuffle(org.industry.commonProducts).join(", "),
      body
    };
  }
  if (type === "Incident report") {
    const incident = rand.pick(org.incidents);
    return {
      incidentId: incident.id,
      severity: incident.severity,
      location: incident.location,
      body: `${incident.summary} Official cause: ${incident.officialCause}. Resolution: ${incident.resolution}.`
    };
  }
  if (type === "Product recall") {
    const product = rand.pick(org.products);
    return {
      product: product.model,
      recall: product.recall,
      body: `${product.model} requires inspection for ${product.defect}. Units remain ${product.status.toLowerCase()} pending local authority confirmation.`
    };
  }
  return { body };
}

function documentBody(rand, type, org) {
  if (type === "Recruitment poster") return `Housing assistance, hazard credits, and verified continuity benefits available for qualified applicants. Your future has paperwork, pressure seals, and a view of the impossible.`;
  if (type === "Employee handbook excerpt") return `Section ${rand.int(4, 19)}.${rand.int(1, 9)} requires staff to report unusual ${org.industry.keywords[0]} behavior before shift close. Failure to file a same-cycle note may affect clearance renewal.`;
  if (type === "Safety bulletin") return `All teams must complete ${org.industry.commonIncidents[0]} drills before the next operational window. Supervisors are reminded that simulated alarms are never to be described as ceremonial.`;
  if (type === "Security directive") return `Access to ${org.industry.commonProducts[0]} telemetry is limited to compartment leads and legal observers. Do not summarize restricted feeds in public ticket systems.`;
  if (type === "Press release") return `${org.identity.name} confirms continued service across ${org.profile.operationalScale.toLowerCase()} routes and denies that recent schedule changes indicate charter instability.`;
  if (type === "Research abstract") return `Preliminary findings indicate that ${org.industry.keywords[0]} variance can be reduced when ${org.operations.keyTechnologies[0]} is paired with stricter staff rotation controls.`;
  if (type === "Legal notice") return `The registry records notice of jurisdictional review concerning ${org.operations.priority}. Response windows are governed by charter law and station procedure.`;
  if (type === "Contract excerpt") return `${org.identity.name} shall maintain ${org.operations.facilityCount} certified facilities and provide incident disclosure within the limits of client classification.`;
  if (type === "Regulatory warning") return `Compliance auditors flagged ${org.culture.complaint} as a recurring operational risk. Corrective evidence is due before the next charter renewal.`;
  return `The registry records a formal notice concerning ${org.operations.priority}. Related attachments remain partially redacted pending jurisdictional review.`;
}

function makeRelationships(rand, org) {
  const rels = ["Parent company", "Subsidiary", "Competitor", "Government client", "Regulatory authority", "Major supplier", "Former partner", "Litigation opponent", "Research partner", "Labor union"];
  return rand.shuffle(rels).slice(0, 7).map(rel => {
    const relatedIndustry = rand.pick(INDUSTRIES);
    const name = makeName(rand, relatedIndustry, rand.pick(ARCHETYPES));
    return {
      name,
      type: relatedIndustry.label,
      relationship: rel,
      status: rand.pick(["Active", "Strained", "Dormant", "Litigated", "Classified", "Recently renewed"]),
      description: `${name} appears in ${org.identity.shortName} files as ${rel.toLowerCase()} connected to ${relatedIndustry.label.toLowerCase()}.`,
      seed: derivedSeed(org.seed, name)
    };
  });
}

function makeSummary(org) {
  const risk = org.profile.riskRating.toLowerCase();
  return `${org.identity.name} is a ${org.profile.ownership.toLowerCase()} ${org.profile.industry.toLowerCase()} organization headquartered on ${org.headquarters.world}. Known as ${org.profile.reputation.toLowerCase()}, it operates at ${org.profile.operationalScale.toLowerCase()} scale with ${articleFor(risk)} ${risk} registry risk rating and a public transparency score of ${org.profile.transparency}.`;
}

function renderSuiteHome() {
  state.currentModule = "home";
  state.current = null;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentDocument = null;
  state.currentTimeline = null;
  state.currentFaction = null;
  state.currentRelationshipGraph = null;
  state.currentRelationship = null;
  state.currentRelationshipPath = [];
  state.currentPremise = null;
  state.currentAtlas = null;
  state.currentAtlasArticle = null;
  state.currentWorldBible = null;
  state.currentTechnology = null;
  state.selectedTimelineBranch = "";
  setAccent("#76d5d7", "#d6b45e");
  app.innerHTML = `
    <section class="module-hero">
      <div>
        <p class="eyebrow">Procedural Science-Fiction Worldbuilding System</p>
        <h1>Sci-Fi Worldbuilder</h1>
        <p class="lede">A unified local workspace for generating, saving, connecting, inspecting, and exporting entities from one fictional future civilization.</p>
      </div>
      <aside class="panel status-panel">
        <h2>${esc(state.universe.name)}</h2>
        <div class="metric-grid">
          <article class="data-card"><span class="meta-label">Universe seed</span><strong>${esc(state.universe.seed)}</strong></article>
          <article class="data-card"><span class="meta-label">Organizations</span><strong>${state.universe.organizations.length}</strong></article>
          <article class="data-card"><span class="meta-label">Stellar systems</span><strong>${state.universe.systems.length}</strong></article>
          <article class="data-card"><span class="meta-label">Settlements</span><strong>${state.universe.settlements.length}</strong></article>
          <article class="data-card"><span class="meta-label">Characters</span><strong>${state.universe.characters.length}</strong></article>
          <article class="data-card"><span class="meta-label">Conflicts</span><strong>${state.universe.conflicts.length}</strong></article>
          <article class="data-card"><span class="meta-label">Documents</span><strong>${state.universe.documents.length}</strong></article>
          <article class="data-card"><span class="meta-label">Timelines</span><strong>${state.universe.timelines.length}</strong></article>
          <article class="data-card"><span class="meta-label">Factions</span><strong>${state.universe.factions.length}</strong></article>
          <article class="data-card"><span class="meta-label">Relationships</span><strong>${state.universe.relationships.length}</strong></article>
          <article class="data-card"><span class="meta-label">Story Premises</span><strong>${state.universe.storyPremises.length}</strong></article>
          <article class="data-card"><span class="meta-label">Atlas Entries</span><strong>${buildAtlasIndex(state.universe).items.length}</strong></article>
          <article class="data-card"><span class="meta-label">Technologies</span><strong>${state.universe.technologies.length + state.universe.infrastructureSystems.length + state.universe.technicalStandards.length + state.universe.researchPrograms.length + state.universe.technicalFacilities.length}</strong></article>
          <article class="data-card"><span class="meta-label">Schema</span><strong>v${state.universe.schemaVersion}</strong></article>
        </div>
      </aside>
    </section>
    <section class="module-grid">
      <article class="module-card">
        <p class="eyebrow">Stellar Cartography Archive</p>
        <h2>Stellar Systems</h2>
        <p>Generate star systems with bodies, settlements, stations, routes, hazards, factions, and story pressure.</p>
        <div class="action-row">
          <button class="primary-button" data-action="go-systems" type="button">Open Stellar Systems</button>
          <button class="ghost-button" data-action="generate-system" type="button">Quick Generate</button>
        </div>
      </article>
      <article class="module-card">
        <p class="eyebrow">Colonial Settlement Archive</p>
        <h2>Settlements</h2>
        <p>Expand system settlement summaries or generate standalone colonies, ports, habitats, districts, and civic tensions.</p>
        <div class="action-row">
          <button class="primary-button" data-action="go-settlements" type="button">Open Settlements</button>
          <button class="ghost-button" data-action="generate-settlement" type="button">Quick Generate</button>
        </div>
      </article>
      <article class="module-card">
        <p class="eyebrow">Interstellar Corporate Registry</p>
        <h2>Organizations</h2>
        <p>Generate corporations, agencies, institutions, contractors, and restricted organizations as connected archive entities.</p>
        <div class="action-row">
          <button class="primary-button" data-action="go-organizations" type="button">Open Organizations</button>
          <button class="ghost-button" data-action="generate" type="button">Quick Generate</button>
        </div>
      </article>
      <article class="module-card">
        <p class="eyebrow">Character Dossier Archive</p>
        <h2>Characters</h2>
        <p>Generate people as networked entities whose obligations, loyalties, secrets, and conflicts connect the generated universe.</p>
        <div class="action-row">
          <button class="primary-button" data-action="go-characters" type="button">Open Characters</button>
          <button class="ghost-button" data-action="generate-character" type="button">Quick Generate</button>
        </div>
      </article>
      <article class="module-card">
        <p class="eyebrow">Conflict and Crisis Generator</p>
        <h2>Conflicts</h2>
        <p>Turn saved settlements, organizations, characters, systems, secrets, and tensions into active story-ready crises.</p>
        <div class="action-row">
          <button class="primary-button" data-action="go-conflicts" type="button">Open Conflicts</button>
          <button class="ghost-button" data-action="generate-world-conflict" type="button">Quick Generate</button>
        </div>
      </article>
      <article class="module-card">
        <p class="eyebrow">In-Universe Document Generator</p>
        <h2>Documents</h2>
        <p>Create memos, articles, reports, letters, alerts, and evidence from existing people, places, conflicts, and institutions.</p>
        <div class="action-row">
          <button class="primary-button" data-action="go-documents" type="button">Open Documents</button>
          <button class="ghost-button" data-action="generate-world-document" type="button">Quick Generate</button>
        </div>
      </article>
      <article class="module-card">
        <p class="eyebrow">History and Chronology Builder</p>
        <h2>Timeline</h2>
        <p>Extract dated facts from saved records, connect causes and consequences, flag chronology problems, and explore alternate branches.</p>
        <div class="action-row">
          <button class="primary-button" data-action="go-timeline" type="button">Open Timeline</button>
          <button class="ghost-button" data-action="open-universe-timeline" type="button">Quick Generate</button>
        </div>
      </article>
      <article class="module-card">
        <p class="eyebrow">Political, Social, and Ideological Power Builder</p>
        <h2>Factions</h2>
        <p>Create movements, blocs, caucuses, coalitions, and internal power groups from saved settlements, conflicts, organizations, characters, documents, and history.</p>
        <div class="action-row">
          <button class="primary-button" data-action="go-factions" type="button">Open Factions</button>
          <button class="ghost-button" data-action="generate-world-faction" type="button">Quick Generate</button>
        </div>
      </article>
      <article class="module-card">
        <p class="eyebrow">Universe Network and Connection Explorer</p>
        <h2>Relationships</h2>
        <p>Explore shared relationship data, inferred links, evidence, warnings, hidden ties, network hubs, isolated entities, and paths between entities.</p>
        <div class="action-row">
          <button class="primary-button" data-action="go-relationships" type="button">Open Relationships</button>
          <button class="ghost-button" data-action="explore-relationships" type="button">Explore Network</button>
        </div>
      </article>
      <article class="module-card">
        <p class="eyebrow">Narrative Pressure and Story Concept Builder</p>
        <h2>Story Premises</h2>
        <p>Find story concepts already implied by saved people, institutions, factions, documents, history, conflicts, places, and relationships.</p>
        <div class="action-row">
          <button class="primary-button" data-action="go-premises" type="button">Open Story Premises</button>
          <button class="ghost-button" data-action="generate-world-premise" type="button">Discover Pressure</button>
        </div>
      </article>
      <article class="module-card">
        <p class="eyebrow">Unified Universe Reference and Presentation System</p>
        <h2>Atlas</h2>
        <p>Browse the whole universe as one encyclopedia, map set, history index, continuity dashboard, glossary, and world bible.</p>
        <div class="action-row">
          <button class="primary-button" data-action="go-atlas" type="button">Open Atlas</button>
          <a class="ghost-button" href="#/atlas/world-bible">World Bible</a>
        </div>
      </article>
      <article class="module-card">
        <p class="eyebrow">Technology and Infrastructure Registry</p>
        <h2>Technology</h2>
        <p>Generate and inspect technologies, infrastructure networks, standards, facilities, research programs, maintenance burdens, failure cascades, and supply chains.</p>
        <div class="action-row">
          <button class="primary-button" data-action="go-technology" type="button">Open Technology</button>
          <button class="ghost-button" data-action="generate-technology" type="button">Quick Generate</button>
        </div>
      </article>
    </section>
    <section class="panel suite-guide">
      <p class="eyebrow">How to use the suite</p>
      <h2>Build From Places To Pressure</h2>
      <p class="lede">Sci-Fi Worldbuilder is designed for making a setting feel inevitable. Start with the physical world, save the pieces that matter, then let each later module consume that established context so people, institutions, conflicts, technologies, documents, and stories begin to collide.</p>
      <div class="entry-grid">
        <article class="data-card">
          <p class="eyebrow">1 / Foundation</p>
          <h3>Start With Systems And Settlements</h3>
          <p>Generate a star system, promote the settlements that feel alive, and save the places where politics, scarcity, hazards, or trade pressure are already visible.</p>
        </article>
        <article class="data-card">
          <p class="eyebrow">2 / Power</p>
          <h3>Add Organizations And Factions</h3>
          <p>Create institutions, companies, governments, movements, blocs, and opposition groups. Save the ones with leverage, contradictions, liabilities, or constituencies.</p>
        </article>
        <article class="data-card">
          <p class="eyebrow">3 / People</p>
          <h3>Promote Characters</h3>
          <p>Turn leaders, witnesses, workers, investigators, rivals, and operators into characters. Their obligations and secrets give the world a human nervous system.</p>
        </article>
        <article class="data-card">
          <p class="eyebrow">4 / Stress</p>
          <h3>Generate Conflicts And Documents</h3>
          <p>Use saved entities as fuel. Conflicts should expose what the world depends on; documents should preserve who knew what, who lied, and what evidence remains.</p>
        </article>
        <article class="data-card">
          <p class="eyebrow">5 / Systems</p>
          <h3>Register Technology</h3>
          <p>Add the infrastructure, standards, facilities, and maintenance chains that make daily life possible. Strong tech records explain what fails, who pays, and who benefits.</p>
        </article>
        <article class="data-card">
          <p class="eyebrow">6 / Synthesis</p>
          <h3>Use Timeline, Relationships, Premises, And Atlas</h3>
          <p>Extract history, inspect the network, discover story premises, then compile the Atlas or World Bible when you need a clean reference pass over everything saved.</p>
        </article>
      </div>
    </section>
    <section class="panel suite-guide">
      <p class="eyebrow">Working method</p>
      <h2>Save Sparingly, Connect Often</h2>
      <div class="entry-grid">
        <article class="data-card"><h3>Save what creates pressure</h3><p>A good saved entity has consequences: scarcity, obligations, jurisdiction, secrets, infrastructure dependence, historical baggage, or a person who can be hurt by it.</p></article>
        <article class="data-card"><h3>Prefer context-first generation</h3><p>When possible, generate from an existing settlement, organization, conflict, document, faction, or character instead of starting from a blank seed.</p></article>
        <article class="data-card"><h3>Use the Atlas as a truth pass</h3><p>The Atlas is where gaps become visible. Missing operators, isolated characters, underused settlements, weak history, and unlinked technologies are signals for what to build next.</p></article>
        <article class="data-card"><h3>Export when the shape emerges</h3><p>Use Markdown and World Bible exports once the setting has enough saved entities to become a reference document for drafting, game prep, or collaboration.</p></article>
      </div>
    </section>
  `;
}

function renderHome() {
  state.currentModule = "organizations";
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentDocument = null;
  state.currentTimeline = null;
  state.currentFaction = null;
  state.currentPremise = null;
  state.currentAtlas = null;
  state.currentAtlasArticle = null;
  state.currentWorldBible = null;
  state.currentTechnology = null;
  setAccent("#76d5d7", "#d6b45e");
  const saved = filteredSaved();
  const examples = ["kestrel-4821", "blacktide-nav", "mneme-vault"].map(seed => generateOrganization(seed));
  app.innerHTML = `
    <section class="home-grid">
      <div class="registry-console">
        <p class="eyebrow">Interstellar Corporate Registry</p>
        <h1>Organizations</h1>
        <p class="lede">Search locally saved dossiers, replay an exact seed, or generate a new registry entry from the civilian, commercial, institutional, and restricted organization archive.</p>
        <div class="search-board">
          <div class="field-grid">
            <label>Search saved entries
              <input id="savedSearch" type="search" placeholder="Name, industry, registry number, personnel">
            </label>
            <label>Seed lookup
              <input id="seedInput" type="text" placeholder="x7k29p">
            </label>
            <label>Industry filter
              <select id="savedIndustry"><option value="">All industries</option>${INDUSTRIES.map(i => `<option value="${esc(i.label)}">${esc(i.label)}</option>`).join("")}</select>
            </label>
            <label>Risk filter
              <select id="savedRisk"><option value="">All risk levels</option><option>Low</option><option>Moderate</option><option>Elevated</option><option>Severe</option></select>
            </label>
            <label>Saved filter
              <select id="savedFavorite"><option value="">All saved</option><option value="favorite">Favorites only</option></select>
            </label>
            <label>Sort saved entries
              <select id="savedSort"><option value="name">Name</option><option value="newest">Newest saved</option><option value="industry">Industry</option><option value="risk">Risk</option></select>
            </label>
          </div>
          <div class="action-row">
            <button class="primary-button" data-action="generate" type="button">Generate New Registry Entry</button>
            <button class="ghost-button" data-action="seed" type="button">Open Seed</button>
            <button class="ghost-button" data-action="export-library" type="button">Export Saved JSON</button>
            <button class="ghost-button" data-action="import-library" type="button">Import JSON</button>
          </div>
          <p class="eyebrow">Archive version ICR-7.20 / access tier: civilian research</p>
        </div>
      </div>
      <aside>
        <section class="panel">
          <h2>Saved Entries</h2>
          <div class="entry-grid" id="savedList">${renderEntryCards(saved, "saved")}</div>
        </section>
        <section class="panel">
          <h2>Featured Archive Entries</h2>
          <div class="entry-grid">${renderEntryCards(examples, "example")}</div>
        </section>
      </aside>
    </section>
    <input id="importInput" type="file" accept="application/json" hidden>
  `;
  ["#savedSearch", "#savedIndustry", "#savedRisk", "#savedFavorite", "#savedSort"].forEach(selector => {
    document.querySelector(selector)?.addEventListener("input", renderSavedSearch);
    document.querySelector(selector)?.addEventListener("change", renderSavedSearch);
  });
  document.querySelector("#importInput")?.addEventListener("change", importLibrary);
}

function renderEntryCards(orgs, source) {
  if (!orgs.length) return `<div class="empty-state">No matching local dossiers.</div>`;
  return orgs.map(itemOrOrg => {
    const org = itemOrOrg.organization || itemOrOrg;
    const item = itemOrOrg.organization ? itemOrOrg : getSaved(org.seed);
    return `
    <article class="entry-card" style="--accent:${esc(org.branding.primaryColor)}">
      <div class="mini-logo">${org.branding.mark}</div>
      <div>
        <h3>${item?.favorite ? "FAV " : ""}${esc(org.identity.name)}</h3>
        <p>${esc(org.profile.industry)} / ${esc(org.headquarters.world)}</p>
        ${item?.notes ? `<p>${esc(item.notes)}</p>` : ""}
        ${item?.tags?.length ? `<p class="eyebrow">${item.tags.map(esc).join(" / ")}</p>` : ""}
        <div class="meta-strip">
          <span class="badge">${esc(org.identity.status)}</span>
          <span class="badge">${esc(org.seed)}</span>
        </div>
      </div>
      <button type="button" data-action="open" data-seed="${esc(org.seed)}" data-source="${source}" aria-label="Open ${esc(org.identity.name)}"></button>
    </article>
  `;
  }).join("");
}

function filteredSaved() {
  const q = document.querySelector("#savedSearch")?.value?.toLowerCase() || "";
  const industry = document.querySelector("#savedIndustry")?.value || "";
  const risk = document.querySelector("#savedRisk")?.value || "";
  const favorite = document.querySelector("#savedFavorite")?.value || "";
  const sort = document.querySelector("#savedSort")?.value || "name";
  const riskRank = { Low: 1, Moderate: 2, Elevated: 3, Severe: 4 };
  return state.store.organizations
    .filter(item => {
      const org = item.organization;
      const haystack = JSON.stringify([org.identity.name, org.profile.industry, org.headquarters.world, org.identity.registryNumber, org.profile.reputation, org.leadership.map(p => p.name), org.documents.map(d => d.title), item.notes, item.tags]).toLowerCase();
      return (!q || haystack.includes(q))
        && (!industry || org.profile.industry === industry)
        && (!risk || org.profile.riskRating === risk)
        && (!favorite || item.favorite);
    })
    .sort((a, b) => {
      if (sort === "newest") return new Date(b.savedAt) - new Date(a.savedAt);
      if (sort === "industry") return a.organization.profile.industry.localeCompare(b.organization.profile.industry);
      if (sort === "risk") return (riskRank[b.organization.profile.riskRating] || 0) - (riskRank[a.organization.profile.riskRating] || 0);
      return a.organization.identity.name.localeCompare(b.organization.identity.name);
    });
}

function renderSavedSearch() {
  const list = document.querySelector("#savedList");
  if (list) list.innerHTML = renderEntryCards(filteredSaved(), "saved");
}

function renderOrganization() {
  const org = state.current;
  setAccent(org.branding.primaryColor, org.branding.accentColor);
  const saved = isSaved(org.seed);
  const favorite = getSaved(org.seed)?.favorite;
  app.innerHTML = `
    <section class="org-header">
      <div class="org-logo">${org.branding.mark}</div>
      <div class="org-title">
        <p class="eyebrow">${esc(org.identity.registryNumber)} / seed ${esc(org.seed)}</p>
        <h1>${esc(org.identity.name)}</h1>
        <div class="meta-strip">
          <span class="classification">${esc(org.identity.classification)}</span>
          <span class="badge">${esc(org.profile.industry)}</span>
          <span class="badge">Founded ${org.profile.foundingYear || org.history[0].year}</span>
          <span class="badge">${esc(org.headquarters.world)}</span>
          <span class="badge">${esc(org.profile.reputation)}</span>
        </div>
      </div>
      <div class="action-row">
        <button class="primary-button" data-action="save" type="button">${saved ? "Saved" : "Save"}</button>
        <button class="ghost-button" data-action="favorite" type="button">${favorite ? "Favorited" : "Favorite"}</button>
        <button class="ghost-button" data-action="regenerate" type="button">Regenerate</button>
        <button class="ghost-button" data-action="share" type="button">Copy Link</button>
        <button class="ghost-button" data-action="export-menu" type="button">Export</button>
      </div>
    </section>
    ${renderTrail()}
    <nav class="tabs" aria-label="Dossier sections">
      ${TABS.map(tab => `<button class="tab-button ${tab === state.activeTab ? "active" : ""}" data-action="tab" data-tab="${tab}" type="button">${tab}</button>`).join("")}
    </nav>
    <section class="tab-panel">${renderTab(org, state.activeTab)}</section>
  `;
  requestAnimationFrame(() => {
    document.querySelector(".tab-button.active")?.scrollIntoView({ inline: "center", block: "nearest" });
  });
}

function renderTrail() {
  if (!state.trail.length) return "";
  return `<nav class="trail" aria-label="Registry traversal trail">
    ${state.trail.map((item, index) => `<button class="trail-item" data-action="trail" data-index="${index}" type="button">${esc(item.name)}</button>`).join("")}
    <span class="trail-current">${esc(state.current.identity.name)}</span>
  </nav>`;
}

function renderTab(org, tab) {
  const map = {
    Overview: renderOverview,
    History: renderHistory,
    Operations: renderOperations,
    Culture: renderCulture,
    Personnel: renderPersonnel,
    Equipment: renderEquipment,
    Incidents: renderIncidents,
    Locations: renderLocations,
    Documents: renderDocuments,
    Network: renderNetwork
  };
  return (map[tab] || renderOverview)(org);
}

function renderOverview(org) {
  const details = [
    ["Classification", org.identity.classification], ["Founding year", org.history[0].year], ["Headquarters", `${org.headquarters.settlement}, ${org.headquarters.world}`],
    ["Employees", formatNumber(org.profile.employeeCount)], ["Revenue or budget", org.profile.annualRevenue], ["Ownership", org.profile.ownership],
    ["Primary industry", org.profile.industry], ["Secondary industry", org.profile.secondaryIndustry], ["Operational scale", org.profile.operationalScale],
    ["Reputation", org.profile.reputation], ["Risk level", org.profile.riskRating], ["Public transparency", `${org.profile.transparency}/100`],
    ["Status", org.identity.status], ["Known slogan", org.identity.motto], ["Major purpose", org.operations.priority]
  ];
  return `
    <div class="split-layout">
      <section class="panel">
        <p class="eyebrow">Registry synopsis</p>
        <h2>${esc(org.identity.organizationType)}</h2>
        <p class="lede">${esc(org.summary)}</p>
        <div class="metric-grid">${details.map(([label, value]) => `<article class="data-card"><span class="meta-label">${esc(label)}</span><strong>${esc(value)}</strong></article>`).join("")}</div>
      </section>
      <aside class="panel">
        <h2>Registry Indices</h2>
        ${renderBars(org.stats)}
        <div class="panel" style="margin-top:1rem">
          <h3>Mutation Tools</h3>
          <div class="button-group">
            ${["name", "logo", "history", "culture", "products", "incidents", "documents", "leadership"].map(item => `<button class="ghost-button" data-action="mutate" data-section="${item}" type="button">${titleCase(item)}</button>`).join("")}
          </div>
        </div>
        ${renderLibraryNotes(org)}
      </aside>
    </div>
  `;
}

function renderLibraryNotes(org) {
  const item = getSaved(org.seed);
  return `<div class="panel" style="margin-top:1rem">
    <h3>Local Library Notes</h3>
    <label>Tags
      <input id="libraryTags" type="text" value="${esc(item?.tags?.join(", ") || "")}" placeholder="frontier, villain, trade hub">
    </label>
    <label style="margin-top:.75rem">Notes
      <textarea id="libraryNotes" placeholder="Private notes saved only in this browser">${esc(item?.notes || "")}</textarea>
    </label>
    <div class="action-row" style="margin-top:.75rem">
      <button class="ghost-button" data-action="save-library-notes" type="button">Save Notes</button>
    </div>
  </div>`;
}

function renderBars(stats) {
  return `<div class="stat-bars">${Object.entries(stats).map(([label, value]) => `
    <div class="bar-row">
      <span>${esc(label)}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${value}%"></span></span>
      <span>${value}</span>
    </div>
  `).join("")}</div>`;
}

function renderHistory(org) {
  return `<section class="panel"><h2>Chronological File</h2><div class="timeline">${org.history.map(item => `
    <article class="timeline-item">
      <div><strong class="timeline-year">${item.year}</strong><span class="badge">${esc(item.status)}</span></div>
      <div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><p class="eyebrow">${esc(item.related)}</p></div>
    </article>
  `).join("")}</div></section>`;
}

function renderOperations(org) {
  const op = org.operations;
  return `<div class="split-layout">
    <section class="panel">
      <h2>Operational Profile</h2>
      <div class="metric-grid">
        ${Object.entries({
          "Core business": op.coreBusiness,
          "Territory": op.territory,
          "Facilities": op.facilityCount,
          "Strategic priority": op.priority,
          "Known constraint": op.constraints
        }).map(([k, v]) => `<article class="data-card"><span class="meta-label">${esc(k)}</span><p>${esc(v)}</p></article>`).join("")}
      </div>
    </section>
    <aside class="panel">
      <h2>Supply Chain</h2>
      ${["Major contracts", "Typical clients", "Dependencies", "Technologies"].map((label, i) => {
        const values = [op.majorContracts, op.clients, op.dependencies, op.keyTechnologies][i];
        return `<h3>${label}</h3><p>${values.map(esc).join(" / ")}</p>`;
      }).join("")}
    </aside>
  </div>`;
}

function renderCulture(org) {
  return `<section class="panel"><h2>Internal Culture</h2><div class="metric-grid">
    ${Object.entries(org.culture).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(titleCase(key.replace(/([A-Z])/g, " $1")))}</span><p>${Array.isArray(value) ? value.map(esc).join(" / ") : esc(value)}</p></article>`).join("")}
  </div></section>`;
}

function renderPersonnel(org) {
  return `<div class="split-layout">
    <section class="panel">
      <h2>Leadership and Notable Personnel</h2>
      <div class="card-grid">${org.leadership.map(person => `
        <article class="person-card">
          <div class="classification">${esc(initials(person.name).slice(0, 2))}</div>
          <h3>${esc(person.name)}</h3><p>${esc(person.role)} / age ${person.age} / ${esc(person.origin)}</p>
          <p>${esc(person.biography)}</p><p><strong>Status:</strong> ${esc(person.status)}</p>
          ${person.controversy ? `<p><strong>Controversy:</strong> ${esc(person.controversy)}</p>` : ""}
        </article>`).join("")}</div>
    </section>
    <aside class="panel">
      <h2>Departments</h2>
      <div class="card-grid">${org.departments.map(dep => `
        <article class="person-card">
          <h3>${esc(dep.name)}</h3><p>${esc(dep.function)}</p>
          <p>${formatNumber(dep.headcount)} staff / ${esc(dep.clearance)} clearance</p>
          <p>${esc(dep.reputation)}; current issue: ${esc(dep.issue)}</p>
        </article>`).join("")}</div>
    </aside>
  </div>`;
}

function renderEquipment(org) {
  return `<section class="panel"><h2>Products, Services, and Equipment</h2><div class="card-grid">${org.products.map(item => `
    <article class="product-card">
      <h3>${esc(item.model)}</h3><p>${esc(item.description)}</p>
      <p><strong>Release:</strong> ${item.releaseYear} / <strong>Status:</strong> ${esc(item.status)}</p>
      <p><strong>Use:</strong> ${esc(item.intendedUse)}</p>
      <p><strong>Spec:</strong> ${esc(item.specification)}</p>
      <p><strong>Known issue:</strong> ${esc(item.defect)} / <strong>Recall:</strong> ${esc(item.recall)}</p>
    </article>`).join("")}</div></section>`;
}

function renderIncidents(org) {
  return `<section class="panel"><h2>Incident Log</h2><div class="card-grid">${org.incidents.map(item => `
    <article class="incident-card">
      <div class="meta-strip"><span class="badge">${esc(item.id)}</span><span class="badge">${esc(item.severity)}</span><span class="badge">${esc(item.classification)}</span></div>
      <h3>${esc(item.category)} / ${esc(item.date)}</h3><p>${esc(item.summary)}</p>
      <p><strong>Location:</strong> ${esc(item.location)}</p>
      <p><strong>Official cause:</strong> ${esc(item.officialCause)}</p>
      <p><strong>Unofficial explanation:</strong> ${item.unofficial === "[redacted]" ? '<span class="redacted">redacted</span>' : esc(item.unofficial)}</p>
      <p><strong>Impact:</strong> ${esc(item.impact)} / <strong>Resolution:</strong> ${esc(item.resolution)}</p>
    </article>`).join("")}</div></section>`;
}

function renderLocations(org) {
  return `<div class="split-layout">
    <section class="panel"><h2>System Footprint</h2>${renderSystemMap(org.locations)}<div class="card-grid" style="margin-top:1rem">${org.locations.map(loc => `
      <article class="location-card"><h3>${esc(loc.name)}</h3><p>${esc(loc.type)} / ${esc(loc.world)} / ${esc(loc.region)}</p><p>${esc(loc.description)}</p><p>${formatNumber(loc.employeeCount)} staff / ${esc(loc.status)} / risk ${esc(loc.risk)}</p><p>${esc(loc.event)}</p></article>`).join("")}</div></section>
    <aside class="panel"><h2>Headquarters</h2><p>${esc(org.headquarters.description)}</p><p class="registry-number">${esc(org.headquarters.settlement)} / ${esc(org.headquarters.region)}</p></aside>
  </div>`;
}

function renderSystemMap(locations) {
  const rand = createRand(locations.map(l => l.name).join("|"));
  const nodes = locations.map((loc, index) => ({ loc, x: 60 + rand.int(0, 580), y: 50 + rand.int(0, 250), r: index === 0 ? 9 : 5 }));
  return `<svg class="system-map" viewBox="0 0 700 360" role="img" aria-label="Stylized system map of organization locations">
    ${nodes.slice(1).map(node => `<line x1="${nodes[0].x}" y1="${nodes[0].y}" x2="${node.x}" y2="${node.y}" stroke="rgba(255,255,255,.18)" />`).join("")}
    ${nodes.map(node => `<circle cx="${node.x}" cy="${node.y}" r="${node.r}" fill="var(--accent)" /><text x="${node.x + 10}" y="${node.y + 4}" fill="#a7adb0" font-size="12">${esc(node.loc.world)}</text>`).join("")}
  </svg>`;
}

function renderDocuments(org) {
  return `<section class="panel"><h2>Document Archive</h2><div class="document-grid">${org.documents.map(doc => `
    <article class="document-card">
      <p class="eyebrow">${esc(doc.type)} / ${esc(doc.classification)}</p>
      <h3>${esc(doc.title)}</h3><p>${esc(doc.date)} / ref ${esc(doc.reference)}</p>
      <div class="action-row">
        <button class="ghost-button" data-action="document" data-doc="${esc(doc.id)}" type="button">Preview Summary</button>
        <button class="ghost-button" data-action="expand-organization-document" data-doc-id="${esc(doc.id)}" data-document-type="${esc(documentTypeFromSummary(doc))}" type="button">${doc.promotionStatus === "promoted" ? "Open Full Document" : "Expand Into Full Document"}</button>
      </div>
    </article>`).join("")}</div></section>`;
}

function renderNetwork(org) {
  return `<section class="panel"><h2>Connected Registry Universe</h2><div class="card-grid">${org.relationships.map(rel => `
    <article class="relation-card network-node">
      <p class="eyebrow">${esc(rel.relationship)} / ${esc(rel.status)}</p>
      <h3>${esc(rel.name)}</h3><p>${esc(rel.type)}</p><p>${esc(rel.description)}</p>
      ${rel.entityType === "star-system"
        ? `<button class="ghost-button" data-action="open-system" data-seed="${esc(rel.seed)}" type="button">Open Related System</button>`
        : `<button class="ghost-button" data-action="open-related" data-seed="${esc(rel.seed)}" data-name="${esc(rel.name)}" type="button">Generate This Organization</button>`}
    </article>`).join("")}</div></section>`;
}

function showDocument(id) {
  const doc = state.current.documents.find(item => item.id === id);
  if (!doc) return;
  modalTitle.textContent = doc.title;
  modalEyebrow.textContent = `${doc.type} / ${doc.classification}`;
  modalBody.innerHTML = renderDocumentPaper(doc, state.current);
  openModal();
}

function renderDocumentPaper(doc, org) {
  if (doc.type === "Recruitment poster") {
    return `<article class="document-paper poster">
      <div class="logo-download">${org.branding.horizontal}</div>
      <p class="eyebrow">Recruitment code ${esc(doc.reference)}</p>
      <h2>${esc(doc.headline)}</h2>
      <h3>${esc(doc.subheadline)}</h3>
      <p>${esc(doc.body)}</p>
      <p><small>${esc(doc.finePrint)}</small></p>
    </article>`;
  }
  if (doc.type === "Shipping manifest") {
    return `<article class="document-paper manifest utilitarian">
      <div class="logo-download">${org.branding.horizontal}</div>
      <p class="doc-stamp">${esc(doc.classification)}</p>
      <h2>${esc(doc.title)}</h2>
      <table class="doc-table"><tbody>
        <tr><th>Vessel</th><td>${esc(doc.vessel)}</td></tr>
        <tr><th>Route</th><td>${esc(doc.route)}</td></tr>
        <tr><th>Cargo</th><td>${esc(doc.cargo)}</td></tr>
        <tr><th>Reference</th><td>${esc(doc.reference)}</td></tr>
      </tbody></table>
      <p>${esc(doc.body)}</p>
    </article>`;
  }
  if (doc.type === "Incident report") {
    return `<article class="document-paper incident-sheet utilitarian">
      <div class="logo-download">${org.branding.horizontal}</div>
      <p class="doc-stamp">${esc(doc.severity || doc.classification)}</p>
      <h2>${esc(doc.title)}</h2>
      <p><strong>Incident:</strong> ${esc(doc.incidentId)} / <strong>Location:</strong> ${esc(doc.location)}</p>
      <p>${esc(doc.body)}</p>
      <p><span class="redacted">redacted text</span> <span class="redacted">restricted annex</span></p>
    </article>`;
  }
  const className = doc.type.includes("Safety") || doc.type.includes("Security") || doc.type.includes("Warning") || doc.type.includes("Recall") ? "utilitarian" : "";
  return `<article class="document-paper ${className}">
    <div class="logo-download">${org.branding.horizontal}</div>
    <p class="doc-stamp">${esc(doc.classification)}</p>
    <h2>${esc(doc.title)}</h2>
    <p><strong>Date:</strong> ${esc(doc.date)} / <strong>Reference:</strong> ${esc(doc.reference)}</p>
    <p><strong>Sender:</strong> ${esc(doc.sender)} / <strong>Recipients:</strong> ${esc(org.identity.acronym)} authorized personnel</p>
    <hr>
    <p>${esc(doc.body)}</p>
    ${doc.classification === "Blackfile" || doc.classification === "Restricted" ? `<p>Filed attachment: <span class="redacted">suppressed text</span> remains unavailable outside this registry tier.</p>` : ""}
    <p><small>${esc(org.identity.registryNumber)} / ${esc(org.identity.motto)}</small></p>
  </article>`;
}

function renderExportMenu() {
  modalTitle.textContent = "Export Registry Assets";
  modalEyebrow.textContent = state.current.identity.registryNumber;
  modalBody.innerHTML = `
    <div class="card-grid">
      <button class="document-card" data-action="export-json" type="button"><h3>Complete JSON</h3><p>Structured organization object.</p></button>
      <button class="document-card" data-action="export-md" type="button"><h3>Markdown Dossier</h3><p>Readable archive report.</p></button>
      <button class="document-card" data-action="export-svg" type="button"><h3>Logo SVG</h3><p>Primary horizontal logo.</p></button>
      <button class="document-card" data-action="export-seal-svg" type="button"><h3>Seal SVG</h3><p>Compact registry seal.</p></button>
      <button class="document-card" data-action="export-png" type="button"><h3>Summary PNG</h3><p>Offline image card generated in browser.</p></button>
      <button class="document-card" data-action="export-badge-png" type="button"><h3>Badge PNG</h3><p>Temporary employee credential.</p></button>
      <button class="document-card" data-action="export-poster-png" type="button"><h3>Recruitment Poster PNG</h3><p>Organization recruitment asset.</p></button>
      <button class="document-card" data-action="export-incident-png" type="button"><h3>Incident Report PNG</h3><p>Visual incident sheet.</p></button>
    </div>`;
  openModal();
}

function renderSettings() {
  modalTitle.textContent = "Generation Settings";
  modalEyebrow.textContent = "Local preferences";
  const option = (value, label, current) => `<option value="${value}" ${current === value ? "selected" : ""}>${label}</option>`;
  modalBody.innerHTML = `
    <div class="settings-grid">
      <label>Category
        <select id="setArchetype">${option("random", "Random", state.settings.archetypeId || "random")}${ARCHETYPES.map(a => option(a.id, a.label, state.settings.archetypeId)).join("")}</select>
      </label>
      <label>Industry
        <select id="setIndustry">${option("random", "Random", state.settings.industryId || "random")}${INDUSTRIES.map(i => option(i.id, i.label, state.settings.industryId)).join("")}</select>
      </label>
      <label>Tone
        <select id="setTone">${["random", "friendly", "civic", "bureaucratic", "secretive", "military", "clinical", "luxury", "weird", "ominous"].map(t => option(t, titleCase(t), state.settings.tone || "random")).join("")}</select>
      </label>
      <label>Organization age
        <select id="setAge">${["random", "new", "established", "ancient"].map(t => option(t, titleCase(t), state.settings.age || "random")).join("")}</select>
      </label>
      <label>Operational scale
        <select id="setScale">${["random", "Local", "Regional", "Interplanetary", "Systemwide", "Interstellar"].map(t => option(t, t, state.settings.scale || "random")).join("")}</select>
      </label>
      <label>Technology level
        <select id="setTech">${["random", "Mature Industrial", "Advanced Industrial", "Experimental", "Frontier Prototype", "Restricted"].map(t => option(t, t, state.settings.techLevel || "random")).join("")}</select>
      </label>
      <label>Visual style
        <select id="setStyle">${["random", "industrial", "institutional", "military", "scientific", "luxury", "civic", "corporate minimal", "utilitarian"].map(t => option(t, titleCase(t), state.settings.visualStyle || "random")).join("")}</select>
      </label>
    </div>
    <div class="action-row" style="margin-top:1rem">
      <button class="primary-button" data-action="save-settings" type="button">Save Settings</button>
      <button class="ghost-button" data-action="clear-settings" type="button">Clear</button>
    </div>`;
  openModal();
}

function renderAbout() {
  modalTitle.textContent = "About Sci-Fi Worldbuilder";
  modalEyebrow.textContent = "Local worldbuilding suite";
  modalBody.innerHTML = `<p class="lede">Sci-Fi Worldbuilder is a fully client-side procedural worldbuilding suite. Stellar Cartography Archive, Colonial Settlement Archive, and Interstellar Corporate Registry modules use deterministic seeds, while saved entities remain in this browser through localStorage.</p><p>No account, backend, paid API, or external image service is required. The project is built as static HTML, CSS, and JavaScript for GitHub Pages-style hosting.</p>`;
  openModal();
}

function openModal() {
  lastFocusedElement = document.activeElement;
  modalBackdrop.hidden = false;
  document.querySelector("#modalClose").focus();
}

function closeModal() {
  modalBackdrop.hidden = true;
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

function setAccent(primary, secondary) {
  document.documentElement.style.setProperty("--accent", primary);
  document.documentElement.style.setProperty("--accent-2", secondary);
}

function systemConstraintsFromForm() {
  return {
    civilizationLevel: document.querySelector("#systemCivilization")?.value || "random",
    systemType: document.querySelector("#systemType")?.value || "random",
    tone: document.querySelector("#systemTone")?.value || "random"
  };
}

function renderSystemsIndex() {
  state.currentModule = "systems";
  state.current = null;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentDocument = null;
  state.activeSystemTab = "Overview";
  setAccent("#d6b45e", "#76d5d7");
  app.innerHTML = renderSystemsHome(state.universe.systems);
}

function openSystem(seed, push = true, constraints = {}) {
  state.currentModule = "systems";
  state.current = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentDocument = null;
  const saved = getSavedSystem(seed);
  state.currentSystem = saved?.system || saved?.entity || generateStarSystem(seed || makeSharedSeed("system"), constraints);
  state.activeSystemTab = "Overview";
  setAccent(state.currentSystem.presentation.accentColor, "#76d5d7");
  if (push) navigateTo(`#/systems/${encodeURIComponent(state.currentSystem.seed)}`);
  renderSystem();
}

function renderSystem() {
  if (!state.currentSystem) return renderSystemsIndex();
  const saved = getSavedSystem(state.currentSystem.seed);
  app.innerHTML = renderSystemDossier(state.currentSystem, state.activeSystemTab, Boolean(saved), Boolean(saved?.favorite));
}

function saveCurrentSystem() {
  if (!state.currentSystem) return;
  SuiteStorage.upsertEntity(state.universe, "systems", state.currentSystem);
  saveStore();
  renderSystem();
}

function getSavedSystem(seed) {
  return SuiteStorage.findEntity(state.universe, "systems", seed);
}

function toggleSystemFavorite() {
  if (!state.currentSystem) return;
  if (!getSavedSystem(state.currentSystem.seed)) saveCurrentSystem();
  const item = getSavedSystem(state.currentSystem.seed);
  item.favorite = !item.favorite;
  saveStore();
  renderSystem();
}

function openSystemOrganization(seed, preferredName) {
  const org = generateOrganization(seed, {});
  if (preferredName) {
    org.relationships = org.relationships || [];
    org.relationships.unshift({
      name: state.currentSystem.name,
      type: "Star System",
      relationship: "Operates in",
      status: "Generated link",
      description: `${org.identity.name} appears in ${state.currentSystem.name} cartography files as a locally important organization.`,
      seed: state.currentSystem.seed,
      entityType: "star-system"
    });
  }
  state.current = org;
  state.currentSystem = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentModule = "organizations";
  state.activeTab = "Overview";
  navigateTo(`#/organizations/${encodeURIComponent(seed)}`);
  renderOrganization();
}

function exportSystemJson() {
  download(`${sharedSlug(state.currentSystem.name)}.json`, "application/json", JSON.stringify(state.currentSystem, null, 2));
}

function exportSystemMarkdown() {
  download(`${sharedSlug(state.currentSystem.name)}.md`, "text/markdown", systemMarkdown(state.currentSystem));
}

function settlementConstraintsFromForm() {
  return {
    scale: document.querySelector("#settlementScale")?.value || "random",
    settlementType: document.querySelector("#settlementType")?.value || "random",
    tone: document.querySelector("#settlementTone")?.value || "random"
  };
}

function settlementConstraintsFromParams(params) {
  return {
    scale: params.get("scale") || "random",
    settlementType: params.get("type") || "random",
    tone: params.get("tone") || "random"
  };
}

function renderSettlementsIndex() {
  state.currentModule = "settlements";
  state.current = null;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentDocument = null;
  state.activeSettlementTab = "Overview";
  setAccent("#c99e63", "#76d5d7");
  app.innerHTML = renderSettlementsHome(state.universe.settlements, availableSettlementSummaries());
}

function openSettlement(seed, push = true, constraints = {}) {
  state.currentModule = "settlements";
  state.current = null;
  state.currentSystem = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentDocument = null;
  const saved = getSavedSettlement(seed);
  state.currentSettlement = saved?.settlement || saved?.entity || generateSettlement(seed || makeSharedSeed("settlement"), constraints);
  state.activeSettlementTab = "Overview";
  setAccent(state.currentSettlement.presentation.accentColor, "#76d5d7");
  if (push) navigateTo(`#/settlements/${encodeURIComponent(state.currentSettlement.seed)}`);
  renderSettlement();
}

function renderSettlement() {
  if (!state.currentSettlement) return renderSettlementsIndex();
  const saved = getSavedSettlement(state.currentSettlement.seed);
  app.innerHTML = renderSettlementDossier(state.currentSettlement, state.activeSettlementTab, Boolean(saved), Boolean(saved?.favorite), state.universe.systems);
}

function saveCurrentSettlement() {
  if (!state.currentSettlement) return;
  SuiteStorage.upsertEntity(state.universe, "settlements", state.currentSettlement);
  state.currentSettlement.relationships.forEach(rel => SuiteStorage.addRelationship(state.universe, rel));
  saveStore();
  renderSettlement();
}

function getSavedSettlement(seed) {
  return SuiteStorage.findEntity(state.universe, "settlements", seed);
}

function toggleSettlementFavorite() {
  if (!state.currentSettlement) return;
  if (!getSavedSettlement(state.currentSettlement.seed)) saveCurrentSettlement();
  const item = getSavedSettlement(state.currentSettlement.seed);
  item.favorite = !item.favorite;
  saveStore();
  renderSettlement();
}

function availableSettlementSummaries() {
  return state.universe.systems.flatMap(record => {
    const system = record.system || record.entity;
    if (!system?.settlements) return [];
    return system.settlements.map(summary => ({ system, summary, record }));
  });
}

function expandSystemSettlement(systemSeed, summaryId) {
  const systemRecord = getSavedSystem(systemSeed);
  const system = systemRecord?.system || systemRecord?.entity || state.currentSystem;
  if (!system) return;
  const summary = system.settlements.find(item => item.id === summaryId);
  if (!summary) return;
  if (summary.promotedEntityId) {
    const promoted = state.universe.settlements.find(item => item.id === summary.promotedEntityId);
    if (promoted) return openSettlement(promoted.seed);
  }
  const existing = state.universe.settlements.find(item => item.seed === summary.seed || item.entity?.source?.parentObjectId === summary.id);
  if (existing) {
    summary.promotedEntityId = existing.id;
    summary.promotionStatus = "promoted";
    saveStore();
    return openSettlement(existing.seed);
  }
  const body = system.orbitalBodies.find(item => item.id === summary.bodyId || item.name === summary.location);
  const settlement = generateSettlement(summary.seed, {
    summary,
    context: {
      system,
      body,
      source: {
        type: "promoted-summary",
        parentEntityId: system.id,
        parentObjectId: summary.id
      }
    }
  });
  summary.promotedEntityId = settlement.id;
  summary.promotionStatus = "promoted";
  SuiteStorage.upsertEntity(state.universe, "settlements", settlement);
  SuiteStorage.upsertEntity(state.universe, "systems", system);
  settlement.relationships.forEach(rel => SuiteStorage.addRelationship(state.universe, rel));
  saveStore();
  openSettlement(settlement.seed);
}

function attachSettlementModal() {
  if (!state.currentSettlement || !state.universe.systems.length) return;
  modalTitle.textContent = "Attach Settlement";
  modalEyebrow.textContent = state.currentSettlement.name;
  const systems = state.universe.systems.map(record => record.system || record.entity).filter(Boolean);
  modalBody.innerHTML = `
    <div class="settings-grid">
      <label>System
        <select id="attachSystem">${systems.map(system => `<option value="${esc(system.seed)}">${esc(system.name)}</option>`).join("")}</select>
      </label>
      <label>Body or station
        <select id="attachTarget"></select>
      </label>
      <label>Conflict handling
        <select id="attachMode">
          <option value="preserve">Preserve settlement as written</option>
          <option value="adapt">Adapt dependent details to new location</option>
        </select>
      </label>
    </div>
    <div class="action-row" style="margin-top:1rem">
      <button class="primary-button" data-action="confirm-attach-settlement" type="button">Attach</button>
    </div>
  `;
  const systemSelect = modalBody.querySelector("#attachSystem");
  const targetSelect = modalBody.querySelector("#attachTarget");
  const fillTargets = () => {
    const system = systems.find(item => item.seed === systemSelect.value);
    const targets = [...(system?.orbitalBodies || []), ...(system?.stations || [])];
    targetSelect.innerHTML = targets.map(target => `<option value="${esc(target.id)}">${esc(target.name)}</option>`).join("");
  };
  systemSelect.addEventListener("change", fillTargets);
  fillTargets();
  openModal();
}

function confirmAttachSettlement() {
  const system = state.universe.systems.map(record => record.system || record.entity).find(item => item.seed === modalBody.querySelector("#attachSystem")?.value);
  if (!system || !state.currentSettlement) return;
  const targetId = modalBody.querySelector("#attachTarget")?.value;
  const target = [...system.orbitalBodies, ...system.stations].find(item => item.id === targetId);
  const mode = modalBody.querySelector("#attachMode")?.value || "preserve";
  state.currentSettlement.location.systemId = system.id;
  state.currentSettlement.location.systemName = system.name;
  state.currentSettlement.location.bodyId = target?.id || "";
  state.currentSettlement.location.bodyName = target?.name || system.name;
  if (mode === "adapt" && target?.environment?.habitability) {
    state.currentSettlement.location.environmentType = target.environment.habitability;
    state.currentSettlement.environment.environmentType = target.environment.habitability;
  }
  state.currentSettlement.relationships = state.currentSettlement.relationships.filter(rel => rel.toEntityType !== "star-system");
  state.currentSettlement.relationships.unshift({
    id: `rel_${sharedHashString(`${state.currentSettlement.id}:${system.id}`).toString(36)}`,
    fromEntityId: state.currentSettlement.id,
    fromEntityType: "settlement",
    toEntityId: system.id,
    toEntityType: "star-system",
    relationshipType: "located-in",
    label: `Located in ${system.name}`,
    metadata: { bodyId: target?.id || "" }
  });
  saveCurrentSettlement();
  closeModal();
}

function openSettlementOrganization(seed, preferredName) {
  const org = generateOrganization(seed, {});
  org.relationships = org.relationships || [];
  org.relationships.unshift({
    name: state.currentSettlement.name,
    type: "Settlement",
    relationship: "Operates in",
    status: "Generated link",
    description: `${org.identity.name} appears in ${state.currentSettlement.name} civic files as ${preferredName || "a local organization"}.`,
    seed: state.currentSettlement.seed,
    entityType: "settlement"
  });
  state.current = org;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentModule = "organizations";
  state.activeTab = "Overview";
  navigateTo(`#/organizations/${encodeURIComponent(seed)}`);
  renderOrganization();
}

function exportSettlementJson() {
  download(`${sharedSlug(state.currentSettlement.name)}.json`, "application/json", JSON.stringify(state.currentSettlement, null, 2));
}

function exportSettlementMarkdown() {
  download(`${sharedSlug(state.currentSettlement.name)}.md`, "text/markdown", settlementMarkdown(state.currentSettlement));
}

function exportSettlementMapSvg() {
  download(`${sharedSlug(state.currentSettlement.name)}-map.svg`, "image/svg+xml", settlementMapSvg(state.currentSettlement));
}

function characterConstraintsFromForm() {
  const settlementSeed = document.querySelector("#characterSettlement")?.value || "";
  const organizationSeed = document.querySelector("#characterOrganization")?.value || "";
  const settlementRecord = settlementSeed ? getSavedSettlement(settlementSeed) : null;
  const organizationRecord = organizationSeed ? getSaved(organizationSeed) : null;
  const settlement = settlementRecord?.settlement || settlementRecord?.entity || null;
  const organization = organizationRecord?.organization || organizationRecord?.entity || null;
  return {
    characterRole: document.querySelector("#characterRole")?.value || "random",
    occupation: document.querySelector("#characterOccupation")?.value.trim() || "random",
    relationshipDensity: document.querySelector("#characterRelationships")?.value || "random",
    context: {
      settlement,
      organization
    }
  };
}

function renderCharactersIndex() {
  state.currentModule = "characters";
  state.current = null;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.activeCharacterTab = "Overview";
  setAccent("#f0a1b2", "#76d5d7");
  app.innerHTML = renderCharactersHome(state.universe.characters, availableCharacterSummaries(), state.universe.settlements, state.universe.organizations);
}

function openCharacter(seed, push = true, constraints = {}) {
  state.currentModule = "characters";
  state.current = null;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentConflict = null;
  state.currentDocument = null;
  const saved = getSavedCharacter(seed);
  state.currentCharacter = saved?.character || saved?.entity || generateCharacter(seed || makeSharedSeed("character"), constraints);
  state.activeCharacterTab = "Overview";
  setAccent(state.currentCharacter.presentation.accentColor, "#76d5d7");
  if (push) navigateTo(`#/characters/${encodeURIComponent(state.currentCharacter.seed)}`);
  renderCharacter();
}

function renderCharacter() {
  if (!state.currentCharacter) return renderCharactersIndex();
  const saved = getSavedCharacter(state.currentCharacter.seed);
  app.innerHTML = renderCharacterDossier(state.currentCharacter, state.activeCharacterTab, Boolean(saved), Boolean(saved?.favorite));
}

function saveCurrentCharacter() {
  if (!state.currentCharacter) return;
  SuiteStorage.upsertEntity(state.universe, "characters", state.currentCharacter);
  state.currentCharacter.entityRelationships.forEach(rel => SuiteStorage.addRelationship(state.universe, rel));
  saveStore();
  renderCharacter();
}

function getSavedCharacter(seed) {
  return SuiteStorage.findEntity(state.universe, "characters", seed);
}

function toggleCharacterFavorite() {
  if (!state.currentCharacter) return;
  if (!getSavedCharacter(state.currentCharacter.seed)) saveCurrentCharacter();
  const item = getSavedCharacter(state.currentCharacter.seed);
  item.favorite = !item.favorite;
  saveStore();
  renderCharacter();
}

function availableCharacterSummaries() {
  return state.universe.organizations.flatMap(record => {
    const organization = record.organization || record.entity;
    if (!organization?.leadership?.length) return [];
    organization.leadership.forEach((person, index) => ensurePersonSummaryShape(person, organization, index));
    return organization.leadership.map(person => ({ organization, person, record }));
  });
}

function ensurePersonSummaryShape(person, organization, index) {
  person.id ||= `person_${sharedHashString(`${organization.id}:leadership:${index}:${person.name}`).toString(36)}`;
  person.seed ||= sharedDerivedSeed(organization.seed, `person-${person.name}-${person.role}`);
}

function expandPersonCharacter(orgSeed, personId) {
  const orgRecord = getSaved(orgSeed);
  const organization = orgRecord?.organization || orgRecord?.entity || state.current;
  if (!organization?.leadership) return;
  organization.leadership.forEach((person, index) => ensurePersonSummaryShape(person, organization, index));
  const person = organization.leadership.find(item => item.id === personId);
  if (!person) return;
  if (person.promotedEntityId) {
    const promoted = state.universe.characters.find(item => item.id === person.promotedEntityId);
    if (promoted) return openCharacter(promoted.seed);
  }
  const existing = state.universe.characters.find(item => item.seed === person.seed || item.entity?.source?.parentObjectId === person.id);
  if (existing) {
    person.promotedEntityId = existing.id;
    person.promotionStatus = "promoted";
    saveStore();
    return openCharacter(existing.seed);
  }
  const character = generateCharacter(person.seed, {
    summary: person,
    context: {
      organization,
      source: {
        type: "promoted-summary",
        parentEntityId: organization.id,
        parentObjectId: person.id
      }
    }
  });
  person.promotedEntityId = character.id;
  person.promotionStatus = "promoted";
  SuiteStorage.upsertEntity(state.universe, "characters", character);
  SuiteStorage.upsertEntity(state.universe, "organizations", organization);
  character.entityRelationships.forEach(rel => SuiteStorage.addRelationship(state.universe, rel));
  saveStore();
  openCharacter(character.seed);
}

function exportCharacterJson() {
  download(`${sharedSlug(state.currentCharacter.name.full)}.json`, "application/json", JSON.stringify(state.currentCharacter, null, 2));
}

function exportCharacterMarkdown() {
  download(`${sharedSlug(state.currentCharacter.name.full)}.md`, "text/markdown", characterMarkdown(state.currentCharacter));
}

function renderConflictsIndex() {
  state.currentModule = "conflicts";
  state.current = null;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentDocument = null;
  state.activeConflictTab = "Overview";
  setAccent("#d86a5d", "#d8b45c");
  app.innerHTML = renderConflictsHome(
    state.universe.conflicts,
    availablePressurePoints(),
    state.universe.settlements,
    state.universe.organizations,
    state.universe.characters,
    state.universe.systems
  );
}

function openConflict(seed, push = true, constraints = {}) {
  state.currentModule = "conflicts";
  state.current = null;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  const saved = getSavedConflict(seed);
  state.currentConflict = saved?.conflict || saved?.entity || generateConflict(seed || makeSharedSeed("conflict"), constraints);
  state.activeConflictTab = "Overview";
  setAccent(state.currentConflict.presentation.accentColor, "#d8b45c");
  if (push) navigateTo(`#/conflicts/${encodeURIComponent(state.currentConflict.seed)}`);
  renderConflict();
}

function renderConflict() {
  if (!state.currentConflict) return renderConflictsIndex();
  const saved = getSavedConflict(state.currentConflict.seed);
  app.innerHTML = renderConflictDossier(state.currentConflict, state.activeConflictTab, Boolean(saved), Boolean(saved?.favorite));
}

function saveCurrentConflict() {
  if (!state.currentConflict) return;
  SuiteStorage.upsertEntity(state.universe, "conflicts", state.currentConflict);
  state.currentConflict.relationships.forEach(rel => SuiteStorage.addRelationship(state.universe, rel));
  saveStore();
  renderConflict();
}

function getSavedConflict(seed) {
  return SuiteStorage.findEntity(state.universe, "conflicts", seed);
}

function toggleConflictFavorite() {
  if (!state.currentConflict) return;
  if (!getSavedConflict(state.currentConflict.seed)) saveCurrentConflict();
  const item = getSavedConflict(state.currentConflict.seed);
  item.favorite = !item.favorite;
  saveStore();
  renderConflict();
}

function conflictConstraintsFromForm({ forceExisting = false } = {}) {
  const seed = document.querySelector("#conflictSeedInput")?.value.trim() || makeSharedSeed("conflict");
  const mode = forceExisting ? "existing-first" : document.querySelector("#conflictContextMode")?.value || "existing-first";
  return { seed, ...conflictConstraintsFromControls(seed, mode !== "standalone") };
}

function conflictConstraintsFromControls(seed, preferExisting) {
  const settlement = recordEntity(getSavedSettlement(document.querySelector("#conflictSettlement")?.value || ""));
  const organization = recordEntity(getSaved(document.querySelector("#conflictOrganization")?.value || ""));
  const character = recordEntity(getSavedCharacter(document.querySelector("#conflictCharacter")?.value || ""));
  const system = recordEntity(getSavedSystem(document.querySelector("#conflictSystem")?.value || ""));
  const context = { system, settlement, organization, character };
  const hasExplicit = Boolean(system || settlement || organization || character);
  if (!hasExplicit && preferExisting) return { context: existingWorldContext(seed) };
  return { context };
}

function conflictConstraintsFromParams(params) {
  const seed = params.get("seed") || makeSharedSeed("conflict");
  const context = {
    system: findEntityByAny("systems", params.get("system")),
    settlement: findEntityByAny("settlements", params.get("settlement")),
    organization: findEntityByAny("organizations", params.get("organization")),
    character: findEntityByAny("characters", params.get("character"))
  };
  const districtId = params.get("district");
  if (districtId && context.settlement?.districts) {
    context.district = context.settlement.districts.find(item => item.id === districtId || item.name === districtId);
  }
  const tensionId = params.get("tension");
  if (tensionId && context.settlement?.tensions) {
    context.tension = context.settlement.tensions.find(item => item.id === tensionId || item.name === tensionId);
  }
  if (!Object.values(context).some(Boolean) && params.get("standalone") !== "true") return { context: existingWorldContext(seed) };
  return { context };
}

function existingWorldContext(seed) {
  const rand = createRand(seed);
  const systems = state.universe.systems.map(recordEntity).filter(Boolean);
  const settlements = state.universe.settlements.map(recordEntity).filter(Boolean);
  const organizations = state.universe.organizations.map(recordEntity).filter(Boolean);
  const characters = state.universe.characters.map(recordEntity).filter(Boolean);
  const settlement = settlements.length ? rand.pick(settlements) : null;
  const system = settlement?.location?.systemId
    ? systems.find(item => item.id === settlement.location.systemId) || rand.pick(systems)
    : systems.length ? rand.pick(systems) : null;
  const organization = organizations.length ? rand.pick(organizations) : null;
  const character = characters.length ? rand.pick(characters) : null;
  const tension = settlement?.tensions?.length ? rand.pick(settlement.tensions) : system?.tensions?.length ? rand.pick(system.tensions) : null;
  return { system, settlement, organization, character, tension };
}

function availablePressurePoints() {
  const points = [];
  state.universe.settlements.forEach(record => {
    const settlement = recordEntity(record);
    settlement?.tensions?.forEach((tension, index) => {
      ensureSourceShape(tension, settlement.seed, `settlement-tension-${index}-${tension.name}`);
      points.push({
        sourceType: "settlement-tension",
        parentSeed: settlement.seed,
        parentName: settlement.name,
        sourceId: tension.id,
        seed: tension.seed,
        title: tension.name,
        kind: "Settlement tension",
        detail: tension.currentStatus || tension.rootCause || "local pressure",
        promotedEntityId: tension.promotedEntityId
      });
    });
  });
  state.universe.systems.forEach(record => {
    const system = recordEntity(record);
    system?.tensions?.forEach((tension, index) => {
      ensureSourceShape(tension, system.seed, `system-tension-${index}-${tension.title || tension.name}`);
      points.push({
        sourceType: "system-tension",
        parentSeed: system.seed,
        parentName: system.name,
        sourceId: tension.id,
        seed: tension.seed,
        title: tension.title || tension.name,
        kind: "System tension",
        detail: tension.currentState || tension.pressure || "system pressure",
        promotedEntityId: tension.promotedEntityId
      });
    });
  });
  state.universe.organizations.forEach(record => {
    const organization = recordEntity(record);
    organization?.incidents?.forEach((incident, index) => {
      ensureSourceShape(incident, organization.seed, `organization-incident-${index}-${incident.category}`);
      points.push({
        sourceType: "organization-incident",
        parentSeed: organization.seed,
        parentName: organization.identity.name,
        sourceId: incident.id,
        seed: incident.seed,
        title: incident.category,
        kind: "Organization incident",
        detail: incident.summary,
        promotedEntityId: incident.promotedEntityId
      });
    });
  });
  state.universe.characters.forEach(record => {
    const character = recordEntity(record);
    character?.conflicts?.forEach((conflict, index) => {
      ensureSourceShape(conflict, character.seed, `character-conflict-${index}-${conflict.name}`);
      points.push({
        sourceType: "character-conflict",
        parentSeed: character.seed,
        parentName: character.name.full,
        sourceId: conflict.id,
        seed: conflict.seed,
        title: conflict.name,
        kind: "Character conflict",
        detail: conflict.publicFace || conflict.privateCause,
        promotedEntityId: conflict.promotedEntityId
      });
    });
  });
  return points.slice(0, 36);
}

function expandPressureConflict(sourceType, parentSeed, sourceId) {
  const found = findPressureSource(sourceType, parentSeed, sourceId);
  if (!found) return;
  const { parent, source, collectionName, context } = found;
  const seed = source.seed || sharedDerivedSeed(parent.seed, `${sourceType}-${sourceId}`);
  const existing = state.universe.conflicts.find(record => {
    const conflict = record.conflict || record.entity;
    return record.seed === seed
      || record.id === source.promotedEntityId
      || conflict?.source?.parentObjectId === source.id
      || conflict?.source?.parentEntityId === parent.id && conflict?.source?.parentObjectId === source.id;
  });
  if (source.promotedEntityId) {
    const promoted = state.universe.conflicts.find(item => item.id === source.promotedEntityId);
    if (promoted) return openConflict(promoted.seed);
  }
  if (existing) {
    source.promotedEntityId = existing.id;
    source.promotionStatus = "promoted";
    SuiteStorage.upsertEntity(state.universe, collectionName, parent);
    saveStore();
    return openConflict(existing.seed);
  }
  const conflict = generateConflict(seed, {
    context: {
      ...context,
      summary: source,
      tension: source,
      source: {
        type: "promoted-tension",
        parentEntityId: parent.id,
        parentObjectId: source.id
      }
    }
  });
  source.promotedEntityId = conflict.id;
  source.promotionStatus = "promoted";
  SuiteStorage.upsertEntity(state.universe, "conflicts", conflict);
  SuiteStorage.upsertEntity(state.universe, collectionName, parent);
  conflict.relationships.forEach(rel => SuiteStorage.addRelationship(state.universe, rel));
  saveStore();
  openConflict(conflict.seed);
}

function findPressureSource(sourceType, parentSeed, sourceId) {
  if (sourceType === "settlement-tension") {
    const parent = recordEntity(getSavedSettlement(parentSeed)) || state.currentSettlement;
    const source = parent?.tensions?.find(item => item.id === sourceId || item.name === sourceId);
    return source ? { parent, source, collectionName: "settlements", context: { settlement: parent, tension: source } } : null;
  }
  if (sourceType === "system-tension") {
    const parent = recordEntity(getSavedSystem(parentSeed)) || state.currentSystem;
    const source = parent?.tensions?.find(item => item.id === sourceId || item.title === sourceId || item.name === sourceId);
    return source ? { parent, source, collectionName: "systems", context: { system: parent, tension: source } } : null;
  }
  if (sourceType === "organization-incident") {
    const parent = recordEntity(getSaved(parentSeed)) || state.current;
    const source = parent?.incidents?.find(item => item.id === sourceId);
    return source ? { parent, source, collectionName: "organizations", context: { organization: parent, tension: source } } : null;
  }
  if (sourceType === "character-conflict") {
    const parent = recordEntity(getSavedCharacter(parentSeed)) || state.currentCharacter;
    const source = parent?.conflicts?.find(item => item.id === sourceId);
    return source ? { parent, source, collectionName: "characters", context: { character: parent, tension: source } } : null;
  }
  return null;
}

function ensureSourceShape(source, parentSeed, label) {
  source.id ||= `pressure_${sharedHashString(`${parentSeed}:${label}`).toString(36)}`;
  source.seed ||= sharedDerivedSeed(parentSeed, label);
}

function recordEntity(record) {
  return record?.entity || record?.system || record?.settlement || record?.organization || record?.character || record?.conflict || record?.document || record?.timeline || record?.historicalEvent || record?.timelineBranch || record?.faction || record?.factionCoalition || record?.relationship || record?.relationshipView || record?.storyPremise || record?.premiseCollection || record?.narrativePressureSignal || record?.universeProfile || record?.encyclopediaEntry || record?.atlasCollection || record?.atlasMap || record?.atlasView || record?.technology || record?.infrastructureSystem || record?.technicalStandard || record?.researchProgram || record?.technicalFacility || record?.technologyVariant || record?.technologyCollection || record?.technologyEcosystem || null;
}

function findEntityByAny(collectionName, value) {
  if (!value) return null;
  const record = state.universe[collectionName]?.find(item => item.id === value || item.seed === value || recordEntity(item)?.id === value || recordEntity(item)?.seed === value);
  return recordEntity(record);
}

function exportConflictJson() {
  download(`${sharedSlug(state.currentConflict.name)}.json`, "application/json", JSON.stringify(state.currentConflict, null, 2));
}

function exportConflictMarkdown() {
  download(`${sharedSlug(state.currentConflict.name)}.md`, "text/markdown", conflictMarkdown(state.currentConflict));
}

function renderDocumentsIndex() {
  state.currentModule = "documents";
  state.current = null;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentDocument = null;
  state.activeDocumentTab = "Preview";
  state.revealDocumentRedactions = false;
  setAccent("#e8edf0", "#d8b45c");
  app.innerHTML = renderDocumentsHome(state.universe.documents, availableDocumentSuggestions(), {
    systems: state.universe.systems,
    settlements: state.universe.settlements,
    organizations: state.universe.organizations,
    characters: state.universe.characters,
    conflicts: state.universe.conflicts
  });
}

function openDocument(seed, push = true, constraints = {}) {
  state.currentModule = "documents";
  state.current = null;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  const saved = getSavedDocument(seed);
  state.currentDocument = saved?.document || saved?.entity || generateDocument(seed || makeSharedSeed("document"), constraints);
  state.activeDocumentTab = "Preview";
  state.revealDocumentRedactions = false;
  setAccent("#e8edf0", "#d8b45c");
  if (push) navigateTo(`#/documents/${encodeURIComponent(state.currentDocument.seed)}`);
  renderDocument();
}

function renderDocument() {
  if (!state.currentDocument) return renderDocumentsIndex();
  const saved = getSavedDocument(state.currentDocument.seed);
  app.innerHTML = renderDocumentDossier(state.currentDocument, state.activeDocumentTab, Boolean(saved), Boolean(saved?.favorite), state.revealDocumentRedactions);
}

function saveCurrentDocument() {
  if (!state.currentDocument) return;
  SuiteStorage.upsertEntity(state.universe, "documents", state.currentDocument);
  state.currentDocument.relationships.forEach(rel => SuiteStorage.addRelationship(state.universe, rel));
  saveStore();
  renderDocument();
}

function getSavedDocument(seed) {
  return SuiteStorage.findEntity(state.universe, "documents", seed);
}

function toggleDocumentFavorite() {
  if (!state.currentDocument) return;
  if (!getSavedDocument(state.currentDocument.seed)) saveCurrentDocument();
  const item = getSavedDocument(state.currentDocument.seed);
  item.favorite = !item.favorite;
  saveStore();
  renderDocument();
}

function documentConstraintsFromForm({ forceExisting = false, forceConflict = false } = {}) {
  const seed = document.querySelector("#documentSeedInput")?.value.trim() || makeSharedSeed("document");
  const mode = forceExisting ? "advanced" : document.querySelector("#documentMode")?.value || "quick";
  const documentType = document.querySelector("#documentType")?.value || "random";
  const family = document.querySelector("#documentFamily")?.value || "random";
  const accessLevel = document.querySelector("#documentAccess")?.value || "";
  const reliability = document.querySelector("#documentReliability")?.value || "";
  const context = documentContextFromControls(seed, mode !== "quick" || forceExisting, forceConflict);
  return {
    seed,
    documentType: documentType !== "random" ? documentType : undefined,
    documentFamily: family !== "random" ? family : undefined,
    accessLevel: accessLevel || undefined,
    reliability: reliability || undefined,
    context
  };
}

function documentContextFromControls(seed, preferExisting, forceConflict = false) {
  const settlement = recordEntity(getSavedSettlement(document.querySelector("#documentSettlement")?.value || ""));
  const organization = recordEntity(getSaved(document.querySelector("#documentOrganization")?.value || ""));
  const character = recordEntity(getSavedCharacter(document.querySelector("#documentCharacter")?.value || ""));
  const conflict = recordEntity(getSavedConflict(document.querySelector("#documentConflict")?.value || ""));
  if (settlement || organization || character || conflict) return { settlement, organization, character, conflict };
  if (preferExisting || forceConflict) return existingDocumentContext(seed, { forceConflict });
  return {};
}

function documentConstraintsFromParams(params) {
  const seed = params.get("seed") || makeSharedSeed("document");
  const context = {
    system: findEntityByAny("systems", params.get("system")),
    settlement: findEntityByAny("settlements", params.get("settlement")),
    organization: findEntityByAny("organizations", params.get("organization")),
    character: findEntityByAny("characters", params.get("character")),
    conflict: findEntityByAny("conflicts", params.get("conflict"))
  };
  const type = params.get("type") || params.get("documentType");
  if (!Object.values(context).some(Boolean) && params.get("standalone") !== "true") return { documentType: type || undefined, context: existingDocumentContext(seed) };
  return { documentType: type || undefined, context };
}

function existingDocumentContext(seed, options = {}) {
  const rand = createRand(seed);
  const systems = state.universe.systems.map(recordEntity).filter(Boolean);
  const settlements = state.universe.settlements.map(recordEntity).filter(Boolean);
  const organizations = state.universe.organizations.map(recordEntity).filter(Boolean);
  const characters = state.universe.characters.map(recordEntity).filter(Boolean);
  const conflicts = state.universe.conflicts.map(recordEntity).filter(Boolean);
  const conflict = options.forceConflict && conflicts.length ? rand.pick(conflicts) : conflicts.length && rand.maybe(0.5) ? rand.pick(conflicts) : null;
  const settlement = conflict?.location?.settlementId
    ? settlements.find(item => item.id === conflict.location.settlementId) || rand.pick(settlements)
    : settlements.length ? rand.pick(settlements) : null;
  const organization = conflict?.parties?.length
    ? organizations.find(item => conflict.parties.some(party => party.id === item.id)) || rand.pick(organizations)
    : organizations.length ? rand.pick(organizations) : null;
  const character = conflict?.parties?.length
    ? characters.find(item => conflict.parties.some(party => party.id === item.id)) || rand.pick(characters)
    : characters.length ? rand.pick(characters) : null;
  const system = settlement?.location?.systemId
    ? systems.find(item => item.id === settlement.location.systemId)
    : systems.length ? rand.pick(systems) : null;
  return { system, settlement, organization, character, conflict };
}

function availableDocumentSuggestions() {
  const suggestions = [];
  state.universe.conflicts.forEach(record => {
    const conflict = recordEntity(record);
    if (!conflict) return;
    [
      ["news-article", `Generate news report about ${conflict.name}`],
      ["internal-memorandum", `Generate internal memo for ${conflict.name}`],
      ["witness-statement", `Generate witness statement for ${conflict.name}`],
      ["emergency-alert", `Generate emergency advisory for ${conflict.name}`]
    ].forEach(([documentType, title]) => suggestions.push({
      sourceType: "conflict",
      parentSeed: conflict.seed,
      sourceId: conflict.id,
      seed: sharedDerivedSeed(conflict.seed, `document-${documentType}`),
      documentType,
      title,
      kind: "Conflict evidence",
      subjectName: conflict.name
    }));
  });
  state.universe.characters.forEach(record => {
    const character = recordEntity(record);
    if (!character) return;
    suggestions.push({
      sourceType: "character",
      parentSeed: character.seed,
      sourceId: character.id,
      seed: sharedDerivedSeed(character.seed, "personnel-file-document"),
      documentType: "personnel-file",
      title: `Generate personnel file for ${character.name.full}`,
      kind: "Character record",
      subjectName: character.name.full
    });
  });
  state.universe.organizations.forEach(record => {
    const organization = recordEntity(record);
    if (!organization) return;
    suggestions.push({
      sourceType: "organization",
      parentSeed: organization.seed,
      sourceId: organization.id,
      seed: sharedDerivedSeed(organization.seed, "annual-report-document"),
      documentType: "annual-report",
      title: `Generate annual report for ${organization.identity.name}`,
      kind: "Organization record",
      subjectName: organization.identity.name
    });
    organization.documents?.slice(0, 3).forEach((doc, index) => {
      ensureDocumentSummaryShape(doc, organization.seed, `embedded-document-${index}-${doc.title}`);
      suggestions.push({
        sourceType: "organization-document",
        parentSeed: organization.seed,
        sourceId: doc.id,
        seed: doc.seed,
        documentType: documentTypeFromSummary(doc),
        title: `Expand ${doc.title}`,
        kind: "Embedded document",
        subjectName: organization.identity.name,
        promotedEntityId: doc.promotedEntityId
      });
    });
  });
  state.universe.settlements.forEach(record => {
    const settlement = recordEntity(record);
    if (!settlement) return;
    suggestions.push({
      sourceType: "settlement",
      parentSeed: settlement.seed,
      sourceId: settlement.id,
      seed: sharedDerivedSeed(settlement.seed, "utility-advisory-document"),
      documentType: "utility-advisory",
      title: `Generate public safety advisory for ${settlement.name}`,
      kind: "Settlement record",
      subjectName: settlement.name
    });
    settlement.government?.notableLaws?.slice(0, 3).forEach((law, index) => {
      ensureDocumentSummaryShape(law, settlement.seed, `law-document-${index}-${law.name}`);
      suggestions.push({
        sourceType: "settlement-law",
        parentSeed: settlement.seed,
        sourceId: law.id,
        seed: law.seed,
        documentType: "public-notice",
        title: `Expand legal notice for ${law.name}`,
        kind: "Embedded law",
        subjectName: settlement.name,
        promotedEntityId: law.promotedEntityId
      });
    });
  });
  return suggestions.slice(0, 42);
}

function generateSuggestedDocument(sourceType, parentSeed, sourceId, documentType) {
  const found = findDocumentSource(sourceType, parentSeed, sourceId);
  if (!found) return openDocument(sharedDerivedSeed(parentSeed || "document", documentType || "suggested"), true, { documentType, context: existingDocumentContext(parentSeed || "document") });
  if (found.source?.promotedEntityId) {
    const promoted = state.universe.documents.find(item => item.id === found.source.promotedEntityId);
    if (promoted) return openDocument(promoted.seed);
  }
  const seed = found.source?.seed || sharedDerivedSeed(found.parent.seed, `document-${documentType || sourceType}-${sourceId}`);
  const existing = state.universe.documents.find(record => {
    const document = record.document || record.entity;
    return record.seed === seed
      || record.id === found.source?.promotedEntityId
      || document?.source?.parentEntityId === found.parent.id && document?.source?.parentObjectId === found.source?.id;
  });
  if (existing) {
    if (found.source) {
      found.source.promotedEntityId = existing.id;
      found.source.promotionStatus = "promoted";
      SuiteStorage.upsertEntity(state.universe, found.collectionName, found.parent);
      saveStore();
    }
    return openDocument(existing.seed);
  }
  const source = found.source || { id: sourceId, title: found.parent.name || found.parent.identity?.name || found.parent.id, documentType };
  const document = generateDocument(seed, {
    documentType: documentType || source.documentType || documentTypeFromSummary(source),
    title: source.title,
    context: {
      ...found.context,
      summary: source,
      source: {
        type: "promoted-summary",
        parentEntityId: found.parent.id,
        parentObjectId: source.id
      }
    }
  });
  if (found.source) {
    found.source.promotedEntityId = document.id;
    found.source.promotionStatus = "promoted";
    SuiteStorage.upsertEntity(state.universe, found.collectionName, found.parent);
  }
  SuiteStorage.upsertEntity(state.universe, "documents", document);
  document.relationships.forEach(rel => SuiteStorage.addRelationship(state.universe, rel));
  saveStore();
  openDocument(document.seed);
}

function findDocumentSource(sourceType, parentSeed, sourceId) {
  if (sourceType === "conflict") {
    const parent = recordEntity(getSavedConflict(parentSeed)) || state.currentConflict;
    return parent ? { parent, source: { id: sourceId || parent.id, title: parent.name, documentType: "news-article", seed: sharedDerivedSeed(parent.seed, "document-conflict") }, collectionName: "conflicts", context: { conflict: parent } } : null;
  }
  if (sourceType === "character") {
    const parent = recordEntity(getSavedCharacter(parentSeed)) || state.currentCharacter;
    return parent ? { parent, source: { id: sourceId || parent.id, title: parent.name.full, documentType: "personnel-file", seed: sharedDerivedSeed(parent.seed, "document-character") }, collectionName: "characters", context: { character: parent } } : null;
  }
  if (sourceType === "organization") {
    const parent = recordEntity(getSaved(parentSeed)) || state.current;
    return parent ? { parent, source: { id: sourceId || parent.id, title: parent.identity.name, documentType: "annual-report", seed: sharedDerivedSeed(parent.seed, "document-organization") }, collectionName: "organizations", context: { organization: parent } } : null;
  }
  if (sourceType === "settlement") {
    const parent = recordEntity(getSavedSettlement(parentSeed)) || state.currentSettlement;
    return parent ? { parent, source: { id: sourceId || parent.id, title: parent.name, documentType: "utility-advisory", seed: sharedDerivedSeed(parent.seed, "document-settlement") }, collectionName: "settlements", context: { settlement: parent } } : null;
  }
  if (sourceType === "organization-document") {
    const parent = recordEntity(getSaved(parentSeed)) || state.current;
    const source = parent?.documents?.find(item => item.id === sourceId || item.title === sourceId);
    return source ? { parent, source, collectionName: "organizations", context: { organization: parent } } : null;
  }
  if (sourceType === "settlement-law") {
    const parent = recordEntity(getSavedSettlement(parentSeed)) || state.currentSettlement;
    const source = parent?.government?.notableLaws?.find(item => item.id === sourceId || item.name === sourceId);
    return source ? { parent, source, collectionName: "settlements", context: { settlement: parent } } : null;
  }
  return null;
}

function ensureDocumentSummaryShape(source, parentSeed, label) {
  source.id ||= `document_summary_${sharedHashString(`${parentSeed}:${label}`).toString(36)}`;
  source.seed ||= sharedDerivedSeed(parentSeed, label);
  source.documentType ||= documentTypeFromSummary(source);
  source.title ||= source.name || source.type || source.category || "Embedded Document";
}

function documentTypeFromSummary(summary) {
  const text = `${summary.documentType || summary.type || summary.title || summary.name || summary.category || ""}`.toLowerCase();
  if (/incident/.test(text)) return "incident-report";
  if (/manifest|shipping|cargo/.test(text)) return "cargo-manifest";
  if (/safety|warning|advisory|bulletin/.test(text)) return "utility-advisory";
  if (/memo|internal/.test(text)) return "internal-memorandum";
  if (/legal|law|notice|license|permit/.test(text)) return "public-notice";
  if (/research|technical|inspection/.test(text)) return "inspection-report";
  if (/poster|recruitment|propaganda/.test(text)) return "political-leaflet";
  return "civic-report";
}

function exportDocumentJson() {
  download(`${sharedSlug(state.currentDocument.title)}.json`, "application/json", JSON.stringify(state.currentDocument, null, 2));
}

function exportDocumentMarkdown(redacted = true) {
  download(`${sharedSlug(state.currentDocument.title)}${redacted ? "" : "-full"}.md`, "text/markdown", documentMarkdown(state.currentDocument, { redacted }));
}

function exportDocumentText() {
  download(`${sharedSlug(state.currentDocument.title)}.txt`, "text/plain", documentPlainText(state.currentDocument, { redacted: true }));
}

function exportDocumentHtml() {
  download(`${sharedSlug(state.currentDocument.title)}-print.html`, "text/html", documentPrintableHtml(state.currentDocument, { redacted: true }));
}

function printCurrentDocument() {
  const html = documentPrintableHtml(state.currentDocument, { redacted: !state.revealDocumentRedactions });
  const printWindow = window.open("", "_blank");
  if (!printWindow) return exportDocumentHtml();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function renderTimelineIndex() {
  state.currentModule = "timeline";
  state.current = null;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentDocument = null;
  state.currentTimeline = null;
  state.activeTimelineTab = "Overview";
  state.selectedTimelineBranch = "";
  setAccent("#76d5d7", "#d8b45c");
  const overviewTimeline = generateTimeline(sharedDerivedSeed(state.universe.seed || "local-archive", "timeline-overview"), { universe: state.universe });
  const extractedEvents = extractTimelineEvents(state.universe);
  const overview = extractedEvents.length ? overviewTimeline.health : {
    totalEvents: 0,
    earliestYear: null,
    latestYear: null,
    majorEras: 0,
    contradictions: 0,
    undated: 0,
    orphaned: 0,
    gaps: 0,
    alternateBranches: state.universe.timelineBranches.length
  };
  app.innerHTML = renderTimelineHome(state.universe.timelines, overview, availableTimelineSuggestions());
}

function openTimeline(seed, push = true, constraints = {}) {
  state.currentModule = "timeline";
  state.current = null;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentDocument = null;
  const saved = getSavedTimeline(seed);
  state.currentTimeline = saved?.timeline || saved?.entity || generateTimeline(seed || makeSharedSeed("timeline"), { ...constraints, universe: state.universe });
  state.activeTimelineTab = "Overview";
  state.selectedTimelineBranch = constraints.branchId || "";
  setAccent(state.currentTimeline.presentation.accentColor, "#d8b45c");
  if (push) {
    const branchQuery = state.selectedTimelineBranch ? `?branch=${encodeURIComponent(state.selectedTimelineBranch)}` : "";
    navigateTo(`#/timeline/${encodeURIComponent(state.currentTimeline.seed)}${branchQuery}`);
  }
  renderTimeline();
}

function renderTimeline() {
  if (!state.currentTimeline) return renderTimelineIndex();
  const saved = getSavedTimeline(state.currentTimeline.seed);
  app.innerHTML = renderTimelineDossier(state.currentTimeline, state.activeTimelineTab, Boolean(saved), Boolean(saved?.favorite), state.selectedTimelineBranch);
}

function saveCurrentTimeline() {
  if (!state.currentTimeline) return;
  SuiteStorage.upsertEntity(state.universe, "timelines", state.currentTimeline);
  state.currentTimeline.sourceEvents.forEach(event => SuiteStorage.upsertEntity(state.universe, "historicalEvents", event));
  state.currentTimeline.branches.forEach(branch => SuiteStorage.upsertEntity(state.universe, "timelineBranches", branch));
  saveStore();
  renderTimeline();
}

function getSavedTimeline(seed) {
  return SuiteStorage.findEntity(state.universe, "timelines", seed);
}

function toggleTimelineFavorite() {
  if (!state.currentTimeline) return;
  if (!getSavedTimeline(state.currentTimeline.seed)) saveCurrentTimeline();
  const item = getSavedTimeline(state.currentTimeline.seed);
  item.favorite = !item.favorite;
  saveStore();
  renderTimeline();
}

function timelineConstraintsFromForm() {
  const seed = document.querySelector("#timelineSeedInput")?.value.trim() || makeSharedSeed("timeline");
  const subjectValue = document.querySelector("#timelineSubject")?.value || "";
  const scope = subjectValue ? timelineScopeFromSubjectValue(subjectValue) : {};
  const mode = document.querySelector("#timelineMode")?.value || "extract";
  return { seed, scope, mode };
}

function timelineScopeFromSubjectValue(value) {
  const [collectionName, id] = String(value).split(":");
  const entity = findEntityByAny(collectionName, id);
  if (!entity) return {};
  return {
    primaryEntityId: entity.id,
    primaryEntityType: entity.entityType,
    label: entityLabel(entity),
    primaryEntity: entity
  };
}

function timelineConstraintsFromParams(params) {
  const context = {
    system: findEntityByAny("systems", params.get("system")),
    settlement: findEntityByAny("settlements", params.get("settlement")),
    organization: findEntityByAny("organizations", params.get("organization")),
    character: findEntityByAny("characters", params.get("character")),
    conflict: findEntityByAny("conflicts", params.get("conflict")),
    document: findEntityByAny("documents", params.get("document"))
  };
  const subject = Object.values(context).find(Boolean);
  return {
    scope: subject ? {
      primaryEntityId: subject.id,
      primaryEntityType: subject.entityType,
      label: entityLabel(subject),
      primaryEntity: subject
    } : {},
    branchId: params.get("branch") || ""
  };
}

function availableTimelineSuggestions() {
  const suggestions = [];
  const add = (collection, entity, title, kind, detail) => {
    if (!entity) return;
    suggestions.push({
      collection,
      id: entity.id,
      seed: sharedDerivedSeed(entity.seed || entity.id, "timeline"),
      title,
      kind,
      detail,
      timelineType: timelineTypeForEntity(entity),
      entityType: entity.entityType
    });
  };
  state.universe.settlements.map(recordEntity).filter(Boolean).forEach(settlement => add("settlements", settlement, `History of ${settlement.name}`, "Settlement timeline", `${settlement.history?.length || 0} local records`));
  state.universe.organizations.map(recordEntity).filter(Boolean).forEach(org => add("organizations", org, `Rise of ${org.identity.name}`, "Organization timeline", `${org.history?.length || 0} history entries`));
  state.universe.characters.map(recordEntity).filter(Boolean).forEach(character => add("characters", character, `Life of ${character.name.full}`, "Character timeline", `${character.history?.length || 0} personal records`));
  state.universe.conflicts.map(recordEntity).filter(Boolean).forEach(conflict => add("conflicts", conflict, `${conflict.name} chronology`, "Conflict timeline", `${conflict.chronology?.length || 0} crisis stages`));
  state.universe.documents.map(recordEntity).filter(Boolean).forEach(document => add("documents", document, `Document path: ${document.title}`, "Document timeline", document.chronology?.displayDate || "document record"));
  state.universe.systems.map(recordEntity).filter(Boolean).forEach(system => add("systems", system, `Political history of ${system.name}`, "System timeline", `${system.history?.length || 0} system records`));
  return suggestions.slice(0, 40);
}

function openSuggestedTimeline(collectionName, id, seed) {
  const entity = findEntityByAny(collectionName, id);
  const scope = entity ? {
    primaryEntityId: entity.id,
    primaryEntityType: entity.entityType,
    label: entityLabel(entity),
    primaryEntity: entity
  } : {};
  openTimeline(seed || sharedDerivedSeed(id || "timeline", "suggested"), true, { scope });
}

function renderTimelineEventRoute(eventId) {
  state.currentModule = "timeline";
  const timeline = state.currentTimeline || generateTimeline(sharedDerivedSeed(state.universe.seed || "local-archive", "event-route"), { universe: state.universe });
  const event = [...timeline.events, ...extractTimelineEvents(state.universe)].find(item => item.id === eventId || item.seed === eventId);
  state.currentTimeline = timeline;
  setAccent(timeline.presentation.accentColor, "#d8b45c");
  app.innerHTML = renderEventDetail(event, timeline);
}

function createTimelineBranch() {
  if (!state.currentTimeline?.branches?.length) return;
  state.selectedTimelineBranch = state.currentTimeline.branches[0].id;
  navigateTo(`#/timeline/${encodeURIComponent(state.currentTimeline.seed)}?branch=${encodeURIComponent(state.selectedTimelineBranch)}`);
  renderTimeline();
}

function exportTimelineJson() {
  download(`${sharedSlug(state.currentTimeline.name)}.json`, "application/json", JSON.stringify(state.currentTimeline, null, 2));
}

function exportTimelineMarkdown() {
  download(`${sharedSlug(state.currentTimeline.name)}.md`, "text/markdown", timelineMarkdown(state.currentTimeline));
}

function exportTimelineHtml() {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(state.currentTimeline.name)}</title><style>body{font:16px Georgia,serif;background:#f4f0e8;color:#111;margin:0;padding:32px}.page{max-width:900px;margin:auto}h1{font-family:Arial,sans-serif;text-transform:uppercase}.event{border-left:3px solid #333;padding:0 0 18px 18px;margin:0 0 18px}.date{font:12px monospace;text-transform:uppercase}@media print{body{padding:0}.page{max-width:none;padding:24px}}</style></head><body><article class="page"><h1>${esc(state.currentTimeline.name)}</h1><p>${esc(state.currentTimeline.description)}</p>${state.currentTimeline.events.map(event => `<section class="event"><p class="date">${esc(event.chronology.displayDate)}</p><h2>${esc(event.title)}</h2><p>${esc(event.summary)}</p></section>`).join("")}</article></body></html>`;
  download(`${sharedSlug(state.currentTimeline.name)}-print.html`, "text/html", html);
}

function renderFactionsIndex(filters = {}) {
  state.currentModule = "factions";
  state.current = null;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentDocument = null;
  state.currentTimeline = null;
  state.currentFaction = null;
  state.activeFactionTab = "Overview";
  setAccent("#9ecf8f", "#d8b45c");
  app.innerHTML = renderFactionsHome(state.universe.factions, availableFactionSuggestions(), factionMetrics(), filters);
}

function openFaction(seed, push = true, constraints = {}) {
  state.currentModule = "factions";
  state.current = null;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentDocument = null;
  state.currentTimeline = null;
  const saved = getSavedFaction(seed);
  state.currentFaction = saved?.faction || saved?.entity || generateFaction(seed || makeSharedSeed("faction"), { ...constraints, context: { ...(constraints.context || {}), universe: state.universe } });
  state.activeFactionTab = "Overview";
  setAccent(state.currentFaction.presentation.accentColor, "#d8b45c");
  if (push) navigateTo(`#/factions/${encodeURIComponent(state.currentFaction.seed)}`);
  renderFaction();
}

function renderFaction() {
  if (!state.currentFaction) return renderFactionsIndex();
  const saved = getSavedFaction(state.currentFaction.seed);
  app.innerHTML = renderFactionDossier(state.currentFaction, state.activeFactionTab, Boolean(saved), Boolean(saved?.favorite));
}

function saveCurrentFaction() {
  if (!state.currentFaction) return;
  SuiteStorage.upsertEntity(state.universe, "factions", state.currentFaction);
  state.currentFaction.relationships.forEach(rel => SuiteStorage.addRelationship(state.universe, rel));
  saveStore();
  renderFaction();
}

function getSavedFaction(seed) {
  return SuiteStorage.findEntity(state.universe, "factions", seed);
}

function toggleFactionFavorite() {
  if (!state.currentFaction) return;
  if (!getSavedFaction(state.currentFaction.seed)) saveCurrentFaction();
  const item = getSavedFaction(state.currentFaction.seed);
  item.favorite = !item.favorite;
  saveStore();
  renderFaction();
}

function factionConstraintsFromForm({ forceExisting = false } = {}) {
  const seed = document.querySelector("#factionSeedInput")?.value.trim() || makeSharedSeed("faction");
  const mode = forceExisting ? "existing-first" : document.querySelector("#factionMode")?.value || "existing-first";
  const factionType = document.querySelector("#factionType")?.value || "random";
  const subjectValue = document.querySelector("#factionContext")?.value || "";
  const context = subjectValue ? factionContextFromSubjectValue(subjectValue) : mode === "quick" ? {} : existingFactionContext(seed);
  return {
    seed,
    factionType: factionType === "random" ? undefined : factionType,
    context
  };
}

function factionContextFromSubjectValue(value) {
  const [collectionName, id] = String(value).split(":");
  const entity = findEntityByAny(collectionName, id);
  if (!entity) return {};
  if (collectionName === "settlements") return { settlement: entity };
  if (collectionName === "organizations") return { organization: entity };
  if (collectionName === "conflicts") return { conflict: entity };
  if (collectionName === "characters") return { character: entity };
  if (collectionName === "documents") return { document: entity };
  if (collectionName === "historicalEvents") return { event: entity };
  if (collectionName === "systems") return { system: entity };
  return {};
}

function factionConstraintsFromParams(params) {
  const event = findEntityByAny("historicalEvents", params.get("event")) || findEntityByAny("historicalEvents", params.get("historicalEvent"));
  return {
    factionType: params.get("type") || params.get("factionType") || undefined,
    ideology: params.get("ideology") || undefined,
    context: {
      system: findEntityByAny("systems", params.get("system")),
      settlement: findEntityByAny("settlements", params.get("settlement")),
      organization: findEntityByAny("organizations", params.get("organization") || params.get("government")),
      character: findEntityByAny("characters", params.get("character")),
      conflict: findEntityByAny("conflicts", params.get("conflict")),
      document: findEntityByAny("documents", params.get("document")),
      event
    }
  };
}

function existingFactionContext(seed) {
  const rand = createRand(seed);
  const settlements = state.universe.settlements.map(recordEntity).filter(Boolean);
  const organizations = state.universe.organizations.map(recordEntity).filter(Boolean);
  const characters = state.universe.characters.map(recordEntity).filter(Boolean);
  const conflicts = state.universe.conflicts.map(recordEntity).filter(Boolean);
  const documents = state.universe.documents.map(recordEntity).filter(Boolean);
  const events = state.universe.historicalEvents.map(recordEntity).filter(Boolean);
  const conflict = conflicts.length && rand.maybe(0.45) ? rand.pick(conflicts) : null;
  const settlement = conflict?.location?.settlementId
    ? settlements.find(item => item.id === conflict.location.settlementId) || rand.pick(settlements)
    : settlements.length ? rand.pick(settlements) : null;
  const organization = conflict?.parties?.length
    ? organizations.find(item => conflict.parties.some(party => party.id === item.id)) || rand.pick(organizations)
    : organizations.length ? rand.pick(organizations) : null;
  const character = conflict?.parties?.length
    ? characters.find(item => conflict.parties.some(party => party.id === item.id)) || rand.pick(characters)
    : characters.length ? rand.pick(characters) : null;
  const document = documents.length && rand.maybe(0.35) ? rand.pick(documents) : null;
  const event = events.length && rand.maybe(0.35) ? rand.pick(events) : null;
  return { settlement, organization, character, conflict, document, event };
}

function availableFactionSuggestions() {
  const suggestions = [];
  const add = (collection, entity, title, kind, detail, factionType) => {
    if (!entity) return;
    suggestions.push({
      collection,
      id: entity.id,
      seed: sharedDerivedSeed(entity.seed || entity.id, `faction-${factionType}`),
      title,
      kind,
      detail,
      factionType
    });
  };
  state.universe.settlements.map(recordEntity).filter(Boolean).forEach(settlement => {
    add("settlements", settlement, `Faction inside ${settlement.name}`, "Settlement faction", `${settlement.tensions?.length || 0} tensions`, "political movement");
    if (settlement.tensions?.length) add("settlements", settlement, `${settlement.name} labor bloc`, "Unrepresented constituency", settlement.tensions[0].name, "labor faction");
  });
  state.universe.organizations.map(recordEntity).filter(Boolean).forEach(org => {
    add("organizations", org, `Internal faction inside ${org.identity.name}`, "Internal organization faction", `${org.incidents?.length || 0} incidents`, "reform caucus");
    if (org.profile?.riskRating === "Severe" || org.incidents?.length > 5) add("organizations", org, `${org.identity.shortName} stability group`, "Emerging faction warning", org.profile.reputation, "corporate faction");
  });
  state.universe.conflicts.map(recordEntity).filter(Boolean).forEach(conflict => {
    add("conflicts", conflict, `Faction from ${conflict.name}`, "Conflict-based faction", conflict.classification.category, "opposition bloc");
    add("conflicts", conflict, `${conflict.name} hardliners`, "Unstable coalition", conflict.classification.status, "hardline faction");
  });
  state.universe.characters.map(recordEntity).filter(Boolean).forEach(character => add("characters", character, `${character.name.full} supporter circle`, "Character-linked faction", character.occupation?.title || "personal network", "political caucus"));
  state.universe.documents.map(recordEntity).filter(Boolean).forEach(document => add("documents", document, `Faction around ${document.title}`, "Document worldview", document.classification?.reliability || "record", "advocacy network"));
  state.universe.historicalEvents.map(recordEntity).filter(Boolean).forEach(event => add("historicalEvents", event, `Movement from ${event.shortLabel || event.title}`, "Faction suggested by history", event.eventCategory || "event", "political movement"));
  return suggestions.slice(0, 48);
}

function openSuggestedFaction(collectionName, id, seed, factionType) {
  const context = factionContextFromSubjectValue(`${collectionName}:${id}`);
  openFaction(seed || sharedDerivedSeed(id || "faction", factionType || "suggested"), true, { factionType, context });
}

function factionMetrics() {
  const factions = state.universe.factions.map(recordEntity).filter(Boolean);
  const suggestions = availableFactionSuggestions();
  return {
    total: factions.length,
    active: factions.filter(item => item.classification?.operationalStatus === "active").length,
    underground: factions.filter(item => ["hidden", "underground", "clandestine"].includes(item.classification?.visibility)).length,
    ruling: factions.filter(item => item.classification?.alignmentRole === "ruling").length,
    opposition: factions.filter(item => String(item.classification?.alignmentRole).includes("opposition")).length,
    alliances: factions.reduce((sum, faction) => sum + (faction.externalRelations?.factions || []).filter(rel => /allied|coalition|partner|sympathetic/.test(rel.publicRelationship)).length, 0),
    rivalries: factions.reduce((sum, faction) => sum + (faction.externalRelations?.factions || []).filter(rel => /rival|hostile|enemy|competitive/.test(rel.publicRelationship)).length, 0),
    schisms: factions.filter(item => /high|imminent|near split/i.test(item.internalDynamics?.schismRisk || "")).length,
    leaderless: factions.filter(item => /leaderless/i.test(item.leadership?.leadershipModel || "")).length,
    unassignedCharacters: Math.max(0, state.universe.characters.length - new Set(factions.flatMap(item => item.characterIds || [])).size),
    ideologicalConflicts: factions.reduce((sum, faction) => sum + (faction.ideology?.contradictions?.length || 0), 0),
    internalCandidates: suggestions.filter(item => item.kind.includes("Internal")).length,
    conflictCandidates: suggestions.filter(item => item.kind.includes("Conflict")).length,
    historyCandidates: suggestions.filter(item => item.kind.includes("history")).length,
    unrepresented: suggestions.filter(item => item.kind.includes("Unrepresented")).length,
    unstableCoalitions: suggestions.filter(item => item.kind.includes("Unstable")).length,
    emergingWarnings: suggestions.filter(item => item.kind.includes("Emerging")).length
  };
}

function exportFactionJson() {
  download(`${sharedSlug(state.currentFaction.name)}.json`, "application/json", JSON.stringify(state.currentFaction, null, 2));
}

function exportFactionMarkdown() {
  download(`${sharedSlug(state.currentFaction.name)}.md`, "text/markdown", factionMarkdown(state.currentFaction));
}

function generateFactionConflict() {
  if (!state.currentFaction) return;
  const seed = sharedDerivedSeed(state.currentFaction.seed, "faction-conflict");
  openConflict(seed, true, {
    context: {
      settlement: findEntityByAny("settlements", state.currentFaction.settlementIds?.[0]),
      organization: findEntityByAny("organizations", state.currentFaction.organizationIds?.[0]),
      character: findEntityByAny("characters", state.currentFaction.characterIds?.[0]),
      summary: {
        id: state.currentFaction.id,
        name: `${state.currentFaction.name} pressure`,
        rootCause: state.currentFaction.ideology.diagnosis,
        publicNarrative: state.currentFaction.goals.publicGoals[0]?.description,
        hiddenPressure: state.currentFaction.vulnerabilities.internal,
        currentStatus: state.currentFaction.futurePressures.likelyNextMove
      },
      source: {
        type: "faction-context",
        parentEntityId: state.currentFaction.id,
        parentObjectId: state.currentFaction.id
      }
    }
  });
}

function generateFactionDocument() {
  if (!state.currentFaction) return;
  const seed = sharedDerivedSeed(state.currentFaction.seed, "faction-document");
  openDocument(seed, true, {
    documentType: "political-leaflet",
    context: {
      settlement: findEntityByAny("settlements", state.currentFaction.settlementIds?.[0]),
      organization: findEntityByAny("organizations", state.currentFaction.organizationIds?.[0]),
      character: findEntityByAny("characters", state.currentFaction.characterIds?.[0]),
      summary: {
        id: state.currentFaction.id,
        title: state.currentFaction.slogan,
        documentType: "political-leaflet",
        subject: state.currentFaction.name
      },
      source: {
        type: "faction-context",
        parentEntityId: state.currentFaction.id,
        parentObjectId: state.currentFaction.id
      }
    }
  });
}

function renderRelationshipsIndex(options = {}) {
  state.currentModule = "relationships";
  state.current = null;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentDocument = null;
  state.currentTimeline = null;
  state.currentFaction = null;
  state.currentRelationship = null;
  state.currentRelationshipPath = [];
  state.activeRelationshipTab = "Overview";
  setAccent("#a6b7ff", "#d8b45c");
  state.currentRelationshipGraph = buildRelationshipGraph(state.universe, options);
  if (options.openExplorer) return renderRelationshipExplorerView();
  app.innerHTML = renderRelationshipsHome(state.currentRelationshipGraph, state.universe.relationshipViews, relationshipEntityOptions());
}

function openRelationshipExplorer(options = {}, push = true) {
  state.currentModule = "relationships";
  state.currentRelationshipGraph = buildRelationshipGraph(state.universe, options);
  state.currentRelationship = null;
  state.currentRelationshipPath = [];
  state.activeRelationshipTab = "Overview";
  setAccent("#a6b7ff", "#d8b45c");
  if (push) navigateTo(relationshipHashFromOptions(options));
  renderRelationshipExplorerView();
}

function renderRelationshipExplorerView() {
  if (!state.currentRelationshipGraph) state.currentRelationshipGraph = buildRelationshipGraph(state.universe);
  app.innerHTML = renderRelationshipExplorer(state.currentRelationshipGraph, state.activeRelationshipTab, state.currentRelationshipPath);
}

function openRelationshipDetail(id) {
  state.currentModule = "relationships";
  state.currentRelationshipGraph ||= buildRelationshipGraph(state.universe);
  state.currentRelationship = state.currentRelationshipGraph.allRelationships.find(item => item.id === id || item.seed === id);
  setAccent("#a6b7ff", "#d8b45c");
  app.innerHTML = renderRelationshipDetail(state.currentRelationship, state.currentRelationshipGraph);
}

function saveRelationshipView() {
  if (!state.currentRelationshipGraph) return;
  const view = {
    ...state.currentRelationshipGraph,
    id: state.currentRelationshipGraph.id,
    entityType: "relationshipView",
    seed: state.currentRelationshipGraph.id,
    name: state.currentRelationshipGraph.focusEntityId ? `Relationships for ${state.currentRelationshipGraph.focusEntityId}` : "Universe Relationship View"
  };
  SuiteStorage.upsertEntity(state.universe, "relationshipViews", view);
  saveStore();
  renderRelationshipExplorerView();
}

function relationshipOptionsFromForm() {
  return {
    focus: document.querySelector("#relationshipFocus")?.value || "",
    family: document.querySelector("#relationshipFamily")?.value || ""
  };
}

function relationshipOptionsFromParams(params) {
  return {
    focus: params.get("focus") || "",
    date: params.get("date") || "",
    branch: params.get("branch") || "",
    family: params.get("family") || "",
    view: params.get("view") || ""
  };
}

function relationshipPathFromForm() {
  const from = document.querySelector("#relationshipFrom")?.value || "";
  const to = document.querySelector("#relationshipTo")?.value || "";
  openRelationshipPath(from, to, true);
}

function openRelationshipPath(from, to, push = true) {
  state.currentModule = "relationships";
  state.currentRelationshipGraph = buildRelationshipGraph(state.universe);
  state.currentRelationshipPath = findRelationshipPath(state.currentRelationshipGraph, from, to);
  state.activeRelationshipTab = "Path";
  setAccent("#a6b7ff", "#d8b45c");
  if (push) navigateTo(`#/relationships/path?from=${encodeURIComponent(from || "")}&to=${encodeURIComponent(to || "")}`);
  renderRelationshipExplorerView();
}

function validateCurrentRelationships() {
  state.currentRelationshipGraph ||= buildRelationshipGraph(state.universe);
  state.activeRelationshipTab = "Warnings";
  renderRelationshipExplorerView();
}

function relationshipEntityOptions() {
  const graph = state.currentRelationshipGraph || buildRelationshipGraph(state.universe);
  return graph.nodes.slice().sort((a, b) => a.label.localeCompare(b.label));
}

function exportRelationshipsJson() {
  download("sci-fi-worldbuilder-relationships.json", "application/json", JSON.stringify(state.currentRelationshipGraph, null, 2));
}

function exportRelationshipsMarkdown() {
  download("sci-fi-worldbuilder-relationships.md", "text/markdown", relationshipMarkdown(state.currentRelationshipGraph));
}

function exportRelationshipsHtml() {
  const graph = state.currentRelationshipGraph || buildRelationshipGraph(state.universe);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Relationship Explorer</title><style>body{font:16px Georgia,serif;background:#f4f0e8;color:#111;margin:0;padding:32px}.page{max-width:920px;margin:auto}.rel{border-left:3px solid #333;padding:0 0 16px 16px;margin-bottom:16px}.meta{font:12px monospace;text-transform:uppercase}@media print{body{padding:0}.page{max-width:none;padding:24px}}</style></head><body><article class="page"><h1>Relationship Explorer</h1><p>${graph.metrics.totalRelationships} relationships / ${graph.warnings.length} warnings / ${graph.suggestions.length} suggestions</p>${graph.relationships.map(rel => `<section class="rel"><p class="meta">${esc(rel.relationshipFamily)} / ${esc(rel.visibility)} / ${esc(rel.confidence)}</p><h2>${esc(rel.label)}</h2><p>${esc(rel.summary)}</p></section>`).join("")}</article></body></html>`;
  download("sci-fi-worldbuilder-relationships-print.html", "text/html", html);
}

function relationshipHashFromOptions(options = {}) {
  const params = new URLSearchParams();
  if (options.focus) params.set("focus", options.focus);
  if (options.family) params.set("family", options.family);
  if (options.date) params.set("date", options.date);
  if (options.branch) params.set("branch", options.branch);
  if (options.view) params.set("view", options.view);
  const query = params.toString();
  return query ? `#/relationships/explore?${query}` : "#/relationships/explore";
}

function renderPremisesIndex(filters = {}) {
  state.currentModule = "premises";
  state.current = null;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentDocument = null;
  state.currentTimeline = null;
  state.currentFaction = null;
  state.currentRelationshipGraph = null;
  state.currentRelationship = null;
  state.currentRelationshipPath = [];
  state.currentPremise = null;
  state.activePremiseTab = "Overview";
  setAccent("#d8b45c", "#76d5d7");
  const signals = collectNarrativePressureSignals(state.universe, filters);
  state.universe.narrativePressureSignals = signals.slice(0, 40);
  app.innerHTML = renderPremisesHome(state.universe.storyPremises, signals, analyzePremiseCoverage(state.universe), filters, premiseEntityOptions());
}

function openPremise(seed, push = true, constraints = {}) {
  state.currentModule = "premises";
  state.current = null;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentDocument = null;
  state.currentTimeline = null;
  state.currentFaction = null;
  state.currentRelationshipGraph = null;
  state.currentRelationship = null;
  state.currentRelationshipPath = [];
  const saved = getSavedPremise(seed);
  state.currentPremise = saved?.storyPremise || saved?.entity || generateStoryPremise(seed || makeSharedSeed("premise"), { ...constraints, universe: state.universe });
  state.activePremiseTab = "Overview";
  setAccent(state.currentPremise.presentation?.accentColor || "#d8b45c", "#76d5d7");
  if (push) navigateTo(premiseHash(state.currentPremise.seed, constraints));
  renderPremise();
}

function renderPremise() {
  if (!state.currentPremise) return renderPremisesIndex();
  const saved = getSavedPremise(state.currentPremise.seed);
  app.innerHTML = renderPremiseDossier(state.currentPremise, state.activePremiseTab, Boolean(saved), Boolean(saved?.favorite || state.currentPremise.favorite));
}

function saveCurrentPremise() {
  if (!state.currentPremise) return;
  SuiteStorage.upsertEntity(state.universe, "storyPremises", state.currentPremise);
  state.currentPremise.sourceContext.generatedAdditions ||= [];
  state.universe.narrativePressureSignals = collectNarrativePressureSignals(state.universe).slice(0, 40);
  saveStore();
  renderPremise();
}

function getSavedPremise(seed) {
  return SuiteStorage.findEntity(state.universe, "storyPremises", seed);
}

function togglePremiseFavorite() {
  if (!state.currentPremise) return;
  if (!getSavedPremise(state.currentPremise.seed)) saveCurrentPremise();
  const item = getSavedPremise(state.currentPremise.seed);
  item.favorite = !item.favorite;
  state.currentPremise.favorite = item.favorite;
  saveStore();
  renderPremise();
}

function archiveCurrentPremise() {
  if (!state.currentPremise) return;
  state.currentPremise.status = "archived";
  saveCurrentPremise();
}

function regeneratePremiseVariant() {
  if (!state.currentPremise) return;
  const variantSeed = sharedDerivedSeed(state.currentPremise.seed, `variant-${state.currentPremise.variants.length + 1}`);
  const constraints = {
    focus: state.currentPremise.sourceContext.focusEntityIds[0] || "",
    genre: state.currentPremise.classification.primaryGenre,
    scale: state.currentPremise.classification.storyScale,
    tone: state.currentPremise.classification.tone[0]
  };
  const variant = generateStoryPremise(variantSeed, { ...constraints, universe: state.universe });
  variant.variantOfPremiseId = state.currentPremise.id;
  state.currentPremise.variants.push({
    id: variant.id,
    seed: variant.seed,
    title: variant.title,
    protagonist: variant.protagonistModel.label,
    genre: variant.classification.primaryGenre,
    scale: variant.classification.storyScale,
    centralChoice: variant.choiceArchitecture.moralPressure,
    continuityWarnings: variant.continuity.warnings.length
  });
  state.currentPremise = variant;
  navigateTo(`#/premises/new?seed=${encodeURIComponent(variant.seed)}`);
  renderPremise();
}

function premiseConstraintsFromForm() {
  return {
    mode: document.querySelector("#premiseMode")?.value || "discovery",
    focus: document.querySelector("#premiseFocus")?.value || "",
    genre: document.querySelector("#premiseGenre")?.value || "",
    scale: document.querySelector("#premiseScale")?.value || "",
    tone: document.querySelector("#premiseTone")?.value || ""
  };
}

function premiseConstraintsFromParams(params) {
  return {
    mode: params.get("mode") || "discovery",
    focus: params.get("focus") || "",
    character: params.get("character") || "",
    organization: params.get("organization") || "",
    settlement: params.get("settlement") || "",
    system: params.get("system") || "",
    conflict: params.get("conflict") || "",
    document: params.get("document") || "",
    event: params.get("event") || "",
    faction: params.get("faction") || "",
    relationship: params.get("relationship") || "",
    genre: params.get("genre") || "",
    scale: params.get("scale") || "",
    tone: params.get("tone") || "",
    status: params.get("status") || "",
    branch: params.get("branch") || ""
  };
}

function premiseHash(seed, constraints = {}) {
  const params = new URLSearchParams();
  params.set("seed", seed);
  ["focus", "character", "organization", "settlement", "system", "conflict", "document", "event", "faction", "relationship", "genre", "scale", "tone", "mode", "branch"].forEach(key => {
    if (constraints[key]) params.set(key, constraints[key]);
  });
  return `#/premises/new?${params.toString()}`;
}

function premiseEntityOptions() {
  const relationshipGraph = buildRelationshipGraph(state.universe);
  return relationshipGraph.nodes.slice().sort((a, b) => a.label.localeCompare(b.label));
}

function exportPremiseJson() {
  download(`${sharedSlug(state.currentPremise.title)}.json`, "application/json", JSON.stringify(state.currentPremise, null, 2));
}

function exportPremiseMarkdown() {
  download(`${sharedSlug(state.currentPremise.title)}.md`, "text/markdown", storyPremiseMarkdown(state.currentPremise));
}

function exportPremiseHtml() {
  const premise = state.currentPremise;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(premise.title)}</title><style>body{font:16px Georgia,serif;background:#f4f0e8;color:#111;margin:0;padding:32px}.page{max-width:900px;margin:auto}h1{font-family:Arial,sans-serif;text-transform:uppercase}.meta{font:12px monospace;text-transform:uppercase}.section{border-top:1px solid #999;padding-top:16px;margin-top:16px}@media print{body{padding:0}.page{max-width:none;padding:24px}}</style></head><body><article class="page"><p class="meta">${esc(premise.status)} / ${esc(premise.canonStatus)} / ${esc(premise.classification.primaryGenre)} / ${esc(premise.classification.storyScale)}</p><h1>${esc(premise.title)}</h1><p>${esc(premise.logline)}</p><section class="section"><h2>Short Premise</h2><p>${esc(premise.shortPremise)}</p></section><section class="section"><h2>Extended Premise</h2><p>${esc(premise.extendedPremise).replace(/\n+/g, "</p><p>")}</p></section><section class="section"><h2>Central Choice</h2><p>${esc(premise.choiceArchitecture.moralPressure)}</p></section></article></body></html>`;
  download(`${sharedSlug(premise.title)}-print.html`, "text/html", html);
}

function exportPremiseBrief() {
  const premise = state.currentPremise;
  const brief = [
    `# Development Brief: ${premise.title}`,
    "",
    `Protagonist: ${premise.protagonistModel.label}`,
    `Opposition: ${premise.oppositionModel.label}`,
    `Goal: ${premise.narrativeCore.protagonistGoal}`,
    `Stakes: ${premise.stakes.personal} ${premise.stakes.local}`,
    `Choice: ${premise.choiceArchitecture.moralPressure}`,
    `Continuity warnings: ${premise.continuity.warnings.map(item => item.message).join("; ") || "none"}`,
    "",
    "## Escalation",
    ...premise.escalation.steps.map((step, index) => `${index + 1}. ${step}`)
  ].join("\n");
  download(`${sharedSlug(premise.title)}-development-brief.md`, "text/markdown", brief);
}

function exportPremiseSeedPackage() {
  download(`${sharedSlug(state.currentPremise.title)}-story-seed-package.json`, "application/json", JSON.stringify(storySeedPackage(state.currentPremise, state.universe), null, 2));
}

function renderAtlasIndexPage(filters = {}) {
  state.currentModule = "atlas";
  state.current = null;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentDocument = null;
  state.currentTimeline = null;
  state.currentFaction = null;
  state.currentRelationshipGraph = null;
  state.currentRelationship = null;
  state.currentRelationshipPath = [];
  state.currentPremise = null;
  state.currentAtlasArticle = null;
  state.currentWorldBible = null;
  state.activeAtlasView = "home";
  setAccent("#76d5d7", "#d8b45c");
  state.currentAtlas = buildAtlas(state.universe, filters);
  state.universe.universeProfile = state.currentAtlas.profile;
  app.innerHTML = renderAtlasHome(state.currentAtlas, filters);
}

function openAtlasExplore(filters = {}, push = true) {
  prepareAtlas("explore", filters);
  if (push) navigateTo(atlasHash("explore", filters));
  app.innerHTML = renderAtlasExplore(state.currentAtlas, filters);
}

function openAtlasAtoZ(filters = {}, push = true) {
  prepareAtlas("index", filters);
  if (push) navigateTo(atlasHash("index", filters));
  app.innerHTML = renderAtlasIndex(state.currentAtlas, filters);
}

function openAtlasCategory(categoryId, filters = {}) {
  prepareAtlas("category", filters);
  app.innerHTML = renderAtlasCategory(state.currentAtlas, categoryId);
}

function openAtlasArticle(entityId, filters = {}, push = false) {
  prepareAtlas("article", filters);
  state.currentAtlasArticle = buildAtlasArticle(state.universe, entityId, filters);
  if (push && state.currentAtlasArticle) navigateTo(state.currentAtlasArticle.item.route);
  app.innerHTML = renderAtlasArticle(state.currentAtlasArticle);
}

function openAtlasMaps(filters = {}, push = true) {
  prepareAtlas("maps", filters);
  if (push) navigateTo(atlasHash("maps", filters));
  app.innerHTML = renderAtlasMaps(state.currentAtlas);
}

function openAtlasTimelineView(filters = {}, year = "", push = true) {
  prepareAtlas("timeline", filters);
  if (push) navigateTo(year ? `#/atlas/year/${encodeURIComponent(year)}` : atlasHash("timeline", filters));
  app.innerHTML = renderAtlasTimeline(state.currentAtlas, year);
}

function openAtlasCollections(filters = {}, push = true) {
  prepareAtlas("collections", filters);
  if (push) navigateTo(atlasHash("collections", filters));
  app.innerHTML = renderAtlasCollections(state.currentAtlas);
}

function openAtlasGlossary(filters = {}, push = true) {
  prepareAtlas("glossary", filters);
  if (push) navigateTo(atlasHash("glossary", filters));
  app.innerHTML = renderAtlasGlossary(state.currentAtlas);
}

function openWorldBible(filters = {}, push = true) {
  prepareAtlas("world-bible", filters);
  state.currentWorldBible = buildWorldBible(state.universe, filters);
  if (push) navigateTo(atlasHash("world-bible", filters));
  app.innerHTML = renderWorldBible(state.currentWorldBible);
}

function prepareAtlas(view, filters = {}) {
  state.currentModule = "atlas";
  state.currentAtlas = buildAtlas(state.universe, filters);
  state.activeAtlasView = view;
  setAccent("#76d5d7", "#d8b45c");
}

function atlasFiltersFromForm() {
  return {
    query: document.querySelector("#atlasQuery")?.value || "",
    category: document.querySelector("#atlasCategory")?.value || "",
    view: document.querySelector("#atlasView")?.value || "author",
    spoiler: document.querySelector("#atlasSpoiler")?.value || "full-canon"
  };
}

function atlasFiltersFromParams(params) {
  return {
    query: params.get("query") || params.get("q") || "",
    category: params.get("category") || "",
    entityType: params.get("entityType") || "",
    location: params.get("location") || "",
    canonStatus: params.get("canon") || "",
    branch: params.get("branch") || "",
    date: params.get("date") || "",
    view: params.get("view") || "author",
    spoiler: params.get("spoiler") || "full-canon"
  };
}

function atlasHash(section = "", filters = {}) {
  const params = new URLSearchParams();
  ["query", "category", "entityType", "location", "canonStatus", "branch", "date", "view", "spoiler"].forEach(key => {
    if (filters[key]) params.set(key === "canonStatus" ? "canon" : key, filters[key]);
  });
  const query = params.toString();
  return `#/atlas${section ? `/${section}` : ""}${query ? `?${query}` : ""}`;
}

function saveAtlasView() {
  const atlas = state.currentAtlas || buildAtlas(state.universe);
  const view = {
    id: `atlasView_${sharedHashString(`${state.activeAtlasView}:${location.hash}:${Date.now()}`).toString(36)}`,
    entityType: "atlasView",
    schemaVersion: 1,
    name: `${titleCase(state.activeAtlasView.replace(/-/g, " "))} View`,
    route: location.hash || "#/atlas",
    filters: atlas.filters,
    branchId: atlas.filters.branch || null,
    date: atlas.filters.date || null,
    knowledgeView: atlas.filters.view || "author",
    mapLayerIds: [],
    pinnedEntityIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  SuiteStorage.upsertEntity(state.universe, "atlasViews", view);
  saveStore();
  if (state.activeAtlasView === "explore") openAtlasExplore(atlas.filters, false);
  else renderAtlasIndexPage(atlas.filters);
}

function exportAtlasJson() {
  const atlas = state.currentAtlas || buildAtlas(state.universe);
  download(`${sharedSlug(atlas.profile.name)}-atlas.json`, "application/json", JSON.stringify(atlas, null, 2));
}

function exportAtlasMarkdown() {
  const atlas = state.currentAtlas || buildAtlas(state.universe);
  download(`${sharedSlug(atlas.profile.name)}-atlas.md`, "text/markdown", atlasMarkdown(atlas));
}

function exportAtlasHtml() {
  const atlas = state.currentAtlas || buildAtlas(state.universe);
  download(`${sharedSlug(atlas.profile.name)}-atlas.html`, "text/html", atlasHtml(atlas));
}

function exportAtlasArticleMarkdown(entityId) {
  const article = state.currentAtlasArticle?.item?.entityId === entityId ? state.currentAtlasArticle : buildAtlasArticle(state.universe, entityId);
  if (article) download(`${sharedSlug(article.item.title)}-atlas-article.md`, "text/markdown", atlasArticleMarkdown(article));
}

function exportAtlasArticleHtml(entityId) {
  const article = state.currentAtlasArticle?.item?.entityId === entityId ? state.currentAtlasArticle : buildAtlasArticle(state.universe, entityId);
  if (article) download(`${sharedSlug(article.item.title)}-atlas-article.html`, "text/html", articleHtml(article));
}

function exportWorldBibleJson() {
  const bible = state.currentWorldBible || buildWorldBible(state.universe);
  download(`${sharedSlug(bible.title)}.json`, "application/json", JSON.stringify(bible, null, 2));
}

function exportWorldBibleMarkdown() {
  const bible = state.currentWorldBible || buildWorldBible(state.universe);
  download(`${sharedSlug(bible.title)}.md`, "text/markdown", worldBibleMarkdown(bible));
}

function exportWorldBibleHtml() {
  const bible = state.currentWorldBible || buildWorldBible(state.universe);
  download(`${sharedSlug(bible.title)}.html`, "text/html", worldBibleHtml(bible));
}

function copyAtlasLink(route) {
  navigator.clipboard?.writeText(`${location.origin}${location.pathname}${route}`);
}

function renderTechnologyIndex(filters = {}) {
  state.currentModule = "technology";
  state.current = null;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentDocument = null;
  state.currentTimeline = null;
  state.currentFaction = null;
  state.currentRelationshipGraph = null;
  state.currentRelationship = null;
  state.currentRelationshipPath = [];
  state.currentPremise = null;
  state.currentAtlas = null;
  state.currentAtlasArticle = null;
  state.currentWorldBible = null;
  state.currentTechnology = null;
  state.activeTechnologyTab = "Overview";
  setAccent("#9ecf8f", "#d8b45c");
  app.innerHTML = renderTechnologyHome(state.universe, suggestTechnologies(state.universe), filters);
}

function openTechnology(seedOrId, push = true, constraints = {}) {
  state.currentModule = "technology";
  state.current = null;
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentDocument = null;
  state.currentTimeline = null;
  state.currentFaction = null;
  state.currentRelationshipGraph = null;
  state.currentRelationship = null;
  state.currentRelationshipPath = [];
  state.currentPremise = null;
  state.currentAtlas = null;
  state.currentAtlasArticle = null;
  state.currentWorldBible = null;
  const saved = getSavedTechnology(seedOrId);
  state.currentTechnology = saved ? recordEntity(saved) : createTechnologyEntity(seedOrId || makeSharedSeed("technology"), constraints);
  state.currentTechnology.validation = validateTechnologyEntity(state.currentTechnology, state.universe);
  state.activeTechnologyTab = "Overview";
  setAccent("#9ecf8f", "#d8b45c");
  if (push) navigateTo(technologyHash(state.currentTechnology, constraints));
  renderTechnology();
}

function renderTechnology() {
  if (!state.currentTechnology) return renderTechnologyIndex();
  state.currentTechnology.validation = validateTechnologyEntity(state.currentTechnology, state.universe);
  const saved = getSavedTechnology(state.currentTechnology.id) || getSavedTechnology(state.currentTechnology.seed);
  app.innerHTML = renderTechnologyDossier(state.currentTechnology, state.activeTechnologyTab, Boolean(saved), Boolean(saved?.favorite || state.currentTechnology.favorite), state.universe);
}

function createTechnologyEntity(seed, constraints = {}) {
  const options = { ...constraints, context: technologyContextFromConstraints(seed, constraints) };
  if (constraints.entityType === "infrastructureSystem") return generateInfrastructure(seed, options);
  if (constraints.entityType === "technicalStandard") return generateTechnicalStandard(seed, options);
  if (constraints.entityType === "researchProgram") return generateResearchProgram(seed, options);
  if (constraints.entityType === "technicalFacility") return generateTechnicalFacility(seed, options);
  return generateTechnology(seed, options);
}

function technologyContextFromConstraints(seed, constraints = {}) {
  const focus = findAnyEntity(constraints.focus);
  if (focus) return keyedTechnologyContext(focus);
  const explicit = {
    system: findEntityByAny("systems", constraints.system),
    settlement: findEntityByAny("settlements", constraints.settlement),
    organization: findEntityByAny("organizations", constraints.organization),
    character: findEntityByAny("characters", constraints.character),
    conflict: findEntityByAny("conflicts", constraints.conflict),
    document: findEntityByAny("documents", constraints.document),
    event: findEntityByAny("historicalEvents", constraints.event),
    faction: findEntityByAny("factions", constraints.faction),
    premise: findEntityByAny("storyPremises", constraints.premise)
  };
  if (Object.values(explicit).some(Boolean)) return explicit;
  return existingTechnologyContext(seed);
}

function existingTechnologyContext(seed) {
  const rand = createRand(seed);
  const pick = collection => {
    const items = state.universe[collection].map(recordEntity).filter(Boolean);
    return items.length ? rand.pick(items) : null;
  };
  const settlement = pick("settlements");
  const organization = pick("organizations");
  const conflict = pick("conflicts");
  const system = settlement?.location?.systemId ? findEntityByAny("systems", settlement.location.systemId) || pick("systems") : pick("systems");
  return {
    system,
    settlement,
    organization,
    character: pick("characters"),
    conflict,
    document: pick("documents"),
    event: pick("historicalEvents"),
    faction: pick("factions"),
    premise: pick("storyPremises"),
    technology: pick("technologies"),
    infrastructure: pick("infrastructureSystems"),
    standard: pick("technicalStandards"),
    facility: pick("technicalFacilities")
  };
}

function keyedTechnologyContext(entity) {
  const context = {};
  if (entity.entityType === "star-system") context.system = entity;
  if (entity.entityType === "settlement") context.settlement = entity;
  if (entity.entityType === "organization") context.organization = entity;
  if (entity.entityType === "character") context.character = entity;
  if (entity.entityType === "conflict") context.conflict = entity;
  if (entity.entityType === "document") context.document = entity;
  if (entity.entityType === "historicalEvent") context.event = entity;
  if (entity.entityType === "faction") context.faction = entity;
  if (entity.entityType === "storyPremise") context.premise = entity;
  if (entity.entityType === "technology") context.technology = entity;
  if (entity.entityType === "infrastructureSystem") context.infrastructure = entity;
  return { ...existingTechnologyContext(entity.seed || entity.id), ...context };
}

function technologyConstraintsFromForm(entityTypeOverride = "") {
  const seed = document.querySelector("#technologySeedInput")?.value.trim() || makeSharedSeed("technology");
  return {
    seed,
    entityType: entityTypeOverride || document.querySelector("#technologyEntityType")?.value || "technology",
    mode: document.querySelector("#technologyMode")?.value || "quick",
    domain: document.querySelector("#technologyDomain")?.value || "",
    category: document.querySelector("#technologyCategory")?.value.trim() || "",
    scale: document.querySelector("#technologyScale")?.value || "",
    maturity: document.querySelector("#technologyMaturity")?.value || "",
    focus: document.querySelector("#technologyFocus")?.value || ""
  };
}

function technologyConstraintsFromParams(params) {
  return {
    seed: params.get("seed") || makeSharedSeed("technology"),
    entityType: params.get("entityType") || params.get("type") || "technology",
    mode: params.get("mode") || "contextual",
    domain: params.get("domain") || "",
    category: params.get("category") || "",
    scale: params.get("scale") || "",
    maturity: params.get("maturity") || "",
    focus: params.get("focus") || "",
    system: params.get("system") || "",
    settlement: params.get("settlement") || "",
    organization: params.get("organization") || "",
    character: params.get("character") || "",
    conflict: params.get("conflict") || "",
    document: params.get("document") || "",
    event: params.get("event") || "",
    faction: params.get("faction") || "",
    premise: params.get("premise") || ""
  };
}

function technologyHash(entity, constraints = {}) {
  if (getSavedTechnology(entity.id) || getSavedTechnology(entity.seed)) {
    const prefix = entity.entityType === "infrastructureSystem" ? "infrastructure"
      : entity.entityType === "technicalStandard" ? "standards"
        : entity.entityType === "researchProgram" ? "research"
          : entity.entityType === "technicalFacility" ? "facilities"
            : "technology";
    return `#/${prefix}/${encodeURIComponent(entity.id)}`;
  }
  const params = new URLSearchParams();
  params.set("seed", entity.seed);
  ["entityType", "mode", "domain", "category", "scale", "maturity", "focus", "system", "settlement", "organization", "character", "conflict", "document", "event", "faction", "premise"].forEach(key => {
    if (constraints[key]) params.set(key, constraints[key]);
  });
  return `#/technology/new?${params.toString()}`;
}

function technologyFiltersFromParams(params) {
  return {
    entityType: params.get("entityType") || params.get("type") || "",
    domain: params.get("domain") || "",
    category: params.get("category") || "",
    status: params.get("status") || "",
    settlement: params.get("settlement") || "",
    organization: params.get("organization") || ""
  };
}

function saveCurrentTechnology() {
  if (!state.currentTechnology) return;
  state.currentTechnology.validation = validateTechnologyEntity(state.currentTechnology, state.universe);
  const collection = technologyCollectionFor(state.currentTechnology.entityType);
  SuiteStorage.upsertEntity(state.universe, collection, state.currentTechnology);
  saveStore();
  renderTechnology();
}

function getSavedTechnology(seedOrId) {
  if (!seedOrId) return null;
  return ["technologies", "infrastructureSystems", "technicalStandards", "researchPrograms", "technicalFacilities"].flatMap(key => state.universe[key]).find(record => {
    const entity = recordEntity(record);
    return record.seed === seedOrId || record.id === seedOrId || entity?.seed === seedOrId || entity?.id === seedOrId;
  });
}

function toggleTechnologyFavorite() {
  if (!state.currentTechnology) return;
  if (!getSavedTechnology(state.currentTechnology.seed)) saveCurrentTechnology();
  const item = getSavedTechnology(state.currentTechnology.seed);
  item.favorite = !item.favorite;
  state.currentTechnology.favorite = item.favorite;
  saveStore();
  renderTechnology();
}

function regenerateTechnology() {
  if (!state.currentTechnology) return;
  const seed = sharedDerivedSeed(state.currentTechnology.seed, `variant-${Date.now()}`);
  openTechnology(seed, true, {
    entityType: state.currentTechnology.entityType,
    domain: state.currentTechnology.classification?.domain || state.currentTechnology.classification?.serviceDomain || "",
    category: state.currentTechnology.classification?.category || "",
    scale: state.currentTechnology.classification?.scale || "",
    maturity: state.currentTechnology.classification?.maturity || ""
  });
}

function technologyCollectionFor(entityType) {
  if (entityType === "infrastructureSystem") return "infrastructureSystems";
  if (entityType === "technicalStandard") return "technicalStandards";
  if (entityType === "researchProgram") return "researchPrograms";
  if (entityType === "technicalFacility") return "technicalFacilities";
  return "technologies";
}

function findAnyEntity(value) {
  if (!value) return null;
  const collections = ["systems", "settlements", "organizations", "characters", "conflicts", "documents", "historicalEvents", "factions", "storyPremises", "technologies", "infrastructureSystems", "technicalStandards", "researchPrograms", "technicalFacilities"];
  for (const collection of collections) {
    const found = findEntityByAny(collection, value);
    if (found) return found;
  }
  return null;
}

function exportTechnologyJson() {
  download(`${sharedSlug(state.currentTechnology.name)}.json`, "application/json", JSON.stringify(state.currentTechnology, null, 2));
}

function exportTechnologyMarkdown() {
  download(`${sharedSlug(state.currentTechnology.name)}.md`, "text/markdown", technologyMarkdown(state.currentTechnology, analyzeTechnologyDependencies(state.currentTechnology, state.universe)));
}

function exportTechnologyHtml() {
  download(`${sharedSlug(state.currentTechnology.name)}.html`, "text/html", technologyPrintableHtml(state.currentTechnology));
}

function exportTechnologyCsv() {
  const records = ["technologies", "infrastructureSystems", "technicalStandards", "researchPrograms", "technicalFacilities"].flatMap(key => state.universe[key]);
  download("technology-registry.csv", "text/csv", technologyCsv(records));
}

function exportTechnologySvg() {
  const analysis = analyzeTechnologyDependencies(state.currentTechnology, state.universe);
  const rows = analysis.critical.slice(0, 8);
  const height = Math.max(220, 80 + rows.length * 32);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ${height}" role="img" aria-label="Dependency diagram for ${esc(state.currentTechnology.name)}"><rect width="760" height="${height}" fill="#0b0d0f"/><rect x="260" y="24" width="240" height="54" fill="#171b1f" stroke="#9ecf8f"/><text x="380" y="56" text-anchor="middle" fill="#f2eee6" font-size="14">${esc(state.currentTechnology.name.slice(0, 34))}</text>${rows.map((item, index) => { const y = 110 + index * 32; return `<line x1="380" y1="78" x2="148" y2="${y - 6}" stroke="#343c43"/><rect x="24" y="${y - 24}" width="248" height="28" fill="#171b1f" stroke="#343c43"/><text x="34" y="${y - 6}" fill="#a7adb0" font-size="12">${esc(String(item).slice(0, 34))}</text>`; }).join("")}</svg>`;
  download(`${sharedSlug(state.currentTechnology.name)}-dependencies.svg`, "image/svg+xml", svg);
}

function exportTechnologyRegistryHtml() {
  const records = ["technologies", "infrastructureSystems", "technicalStandards", "researchPrograms", "technicalFacilities"].flatMap(key => state.universe[key]);
  download("technology-registry.html", "text/html", registryHtml(records));
}

function entityLabel(entity) {
  return entity?.name?.full || entity?.identity?.name || entity?.name || entity?.title || entity?.id || "";
}

function timelineTypeForEntity(entity) {
  if (entity.entityType === "star-system") return "system";
  if (entity.entityType === "settlement") return "settlement";
  if (entity.entityType === "organization") return "organization";
  if (entity.entityType === "character") return "character";
  if (entity.entityType === "conflict") return "conflict";
  if (entity.entityType === "document") return "document";
  return "universe";
}

function openSeed(seed, push = true, preserveTrail = false, constraints = state.settings) {
  state.currentModule = "organizations";
  state.currentSystem = null;
  state.currentSettlement = null;
  state.currentCharacter = null;
  state.currentConflict = null;
  state.currentDocument = null;
  state.currentTimeline = null;
  if (!preserveTrail) state.trail = [];
  state.current = generateOrganization(seed || makeSeed(), constraints);
  state.activeTab = "Overview";
  if (push) {
    navigateTo(`#/organizations/${encodeURIComponent(state.current.seed)}`);
  }
  renderOrganization();
}

function openRelated(seed, name) {
  if (state.current) {
    state.trail.push({ seed: state.current.seed, name: state.current.identity.name });
  }
  openSeed(seed, true, true, {});
  state.trail[state.trail.length - 1].relatedName = name;
}

function openTrail(index) {
  const item = state.trail[index];
  if (!item) return;
  state.trail = state.trail.slice(0, index);
  openSeed(item.seed, true, true, {});
}

function saveCurrent() {
  SuiteStorage.upsertEntity(state.universe, "organizations", state.current);
  saveStore();
  renderOrganization();
}

function getSaved(seed) {
  return state.store.organizations.find(item => item.seed === seed);
}

function isSaved(seed) {
  return Boolean(getSaved(seed));
}

function toggleFavorite() {
  if (!state.current) return;
  if (!isSaved(state.current.seed)) saveCurrent();
  const item = getSaved(state.current.seed);
  item.favorite = !item.favorite;
  saveStore();
  renderOrganization();
}

function saveLibraryNotes() {
  if (!state.current) return;
  if (!isSaved(state.current.seed)) saveCurrent();
  const item = getSaved(state.current.seed);
  item.notes = document.querySelector("#libraryNotes")?.value.trim() || "";
  item.tags = (document.querySelector("#libraryTags")?.value || "")
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean);
  item.organization = state.current;
  item.entity = state.current;
  item.savedAt = new Date().toISOString();
  saveStore();
  renderOrganization();
}

function mutate(section) {
  const mutationSeed = `${state.current.seed}:${section}:${(state.current.mutationCount || 0) + 1}`;
  state.current.mutationCount = (state.current.mutationCount || 0) + 1;
  const next = generateOrganization(mutationSeed, { industryId: state.current.industry.id, archetypeId: state.current.archetype.id, tone: state.current.tone.id, scale: state.current.profile.operationalScale, techLevel: state.current.profile.technologyLevel });
  if (section === "name") {
    state.current.identity.name = next.identity.name;
    state.current.identity.shortName = next.identity.shortName;
    state.current.identity.acronym = next.identity.acronym;
    state.current.summary = makeSummary(state.current);
  } else if (section === "logo") {
    state.current.branding = next.branding;
  } else if (section === "leadership") {
    state.current.leadership = next.leadership;
  } else if (section === "products") {
    state.current.products = next.products;
  } else if (section in state.current) {
    state.current[section] = next[section];
  }
  renderOrganization();
}

function download(filename, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportJson() {
  download(`${slug(state.current.identity.name)}.json`, "application/json", JSON.stringify(state.current, null, 2));
}

function exportMarkdown() {
  const org = state.current;
  const md = [
    `# ${org.identity.name}`,
    "",
    `Registry number: ${org.identity.registryNumber}`,
    `Seed: ${org.seed}`,
    "",
    org.summary,
    "",
    "## Profile",
    `- Industry: ${org.profile.industry}`,
    `- Headquarters: ${org.headquarters.settlement}, ${org.headquarters.world}`,
    `- Employees: ${formatNumber(org.profile.employeeCount)}`,
    `- Reputation: ${org.profile.reputation}`,
    `- Risk: ${org.profile.riskRating}`,
    "",
    "## History",
    ...org.history.map(item => `- ${item.year}: ${item.title}. ${item.description}`),
    "",
    "## Incidents",
    ...org.incidents.map(item => `- ${item.id} (${item.severity}): ${item.summary}`),
    "",
    "## Documents",
    ...org.documents.map(doc => `- ${doc.title} [${doc.classification}]`)
  ].join("\n");
  download(`${slug(org.identity.name)}.md`, "text/markdown", md);
}

function exportSvg() {
  download(`${slug(state.current.identity.name)}-logo.svg`, "image/svg+xml", state.current.branding.horizontal);
}

function exportPng() {
  const org = state.current;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 675;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#101316";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = org.branding.primaryColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(42, 42, 1116, 591);
  ctx.fillStyle = org.branding.primaryColor;
  ctx.fillRect(82, 90, 120, 120);
  ctx.fillStyle = "#101316";
  ctx.font = "bold 42px Arial";
  ctx.textAlign = "center";
  ctx.fillText(org.identity.acronym, 142, 165);
  ctx.textAlign = "left";
  ctx.fillStyle = "#f2eee6";
  ctx.font = "bold 54px Arial";
  wrapCanvas(ctx, org.identity.name, 240, 128, 840, 62);
  ctx.font = "26px monospace";
  ctx.fillStyle = org.branding.accentColor;
  ctx.fillText(`${org.identity.registryNumber} / ${org.profile.industry}`, 86, 290);
  ctx.fillStyle = "#a7adb0";
  ctx.font = "28px Arial";
  wrapCanvas(ctx, org.summary, 86, 350, 1010, 38);
  ctx.font = "24px monospace";
  ctx.fillStyle = "#f2eee6";
  ctx.fillText(`Risk ${org.profile.riskRating} / Transparency ${org.profile.transparency} / Seed ${org.seed}`, 86, 575);
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug(org.identity.name)}-summary.png`;
    link.click();
    URL.revokeObjectURL(url);
  });
}

function wrapCanvas(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
}

function exportLibrary() {
  download("sci-fi-worldbuilder-local-universe.json", "application/json", JSON.stringify(state.suite, null, 2));
}

function importLibrary(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (Array.isArray(parsed.universes)) {
        state.suite = parsed;
        state.universe = SuiteStorage.getActiveUniverse(state.suite);
        state.store = state.universe;
      } else if (Array.isArray(parsed.organizations)) {
        const bySeed = new Map(state.store.organizations.map(item => [item.seed, item]));
        parsed.organizations.forEach(item => {
          if (item.seed && item.organization) bySeed.set(item.seed, item);
        });
        state.store.organizations = [...bySeed.values()];
      } else {
        throw new Error("Invalid library");
      }
      saveStore();
      renderRoute();
    } catch {
      alert("That file does not look like a Sci-Fi Worldbuilder export.");
    }
  };
  reader.readAsText(file);
}

async function copyShareLink() {
  const url = new URL(window.location.href);
  url.searchParams.set("seed", state.current.seed);
  await navigator.clipboard?.writeText(url.toString()).catch(() => {});
}

function saveSettingsFromForm() {
  state.settings = {
    archetypeId: valueOrRandom("#setArchetype"),
    industryId: valueOrRandom("#setIndustry"),
    tone: valueOrRandom("#setTone"),
    age: valueOrRandom("#setAge"),
    scale: valueOrRandom("#setScale"),
    techLevel: valueOrRandom("#setTech"),
    visualStyle: valueOrRandom("#setStyle")
  };
  saveSettings();
  closeModal();
}

function valueOrRandom(selector) {
  const value = document.querySelector(selector)?.value || "random";
  return value === "random" ? undefined : value;
}

function navigateTo(hash) {
  if (window.location.hash === hash) return;
  history.pushState({}, "", `${window.location.pathname}${window.location.search}${hash}`);
}

function renderRoute() {
  const hash = window.location.hash || "#/home";
  const [path, hashQuery = ""] = hash.slice(1).split("?");
  const params = new URLSearchParams(hashQuery);
  const parts = path.split("/").filter(Boolean);
  const legacySeed = new URLSearchParams(window.location.search).get("seed");
  if (legacySeed && hash === "#/home") return openSeed(legacySeed, false);
  if (parts[0] === "systems" && parts[1]) return openSystem(decodeURIComponent(parts[1]), false);
  if (parts[0] === "systems") return renderSystemsIndex();
  if (parts[0] === "settlements" && parts[1] === "new") return openSettlement(params.get("seed") || makeSharedSeed("settlement"), false, settlementConstraintsFromParams(params));
  if (parts[0] === "settlements" && parts[1]) return openSettlement(decodeURIComponent(parts[1]), false);
  if (parts[0] === "settlements") return renderSettlementsIndex();
  if (parts[0] === "characters" && parts[1] === "new") return openCharacter(params.get("seed") || makeSharedSeed("character"), false, {});
  if (parts[0] === "characters" && parts[1]) return openCharacter(decodeURIComponent(parts[1]), false);
  if (parts[0] === "characters") return renderCharactersIndex();
  if (parts[0] === "conflicts" && parts[1] === "new") {
    const seed = params.get("seed") || makeSharedSeed("conflict");
    return openConflict(seed, false, conflictConstraintsFromParams(params));
  }
  if (parts[0] === "conflicts" && parts[1]) return openConflict(decodeURIComponent(parts[1]), false);
  if (parts[0] === "conflicts") return renderConflictsIndex();
  if (parts[0] === "documents" && parts[1] === "new") {
    const seed = params.get("seed") || makeSharedSeed("document");
    return openDocument(seed, false, documentConstraintsFromParams(params));
  }
  if (parts[0] === "documents" && parts[1]) return openDocument(decodeURIComponent(parts[1]), false);
  if (parts[0] === "documents") return renderDocumentsIndex();
  if (parts[0] === "timeline" && parts[1] === "new") {
    const seed = params.get("seed") || makeSharedSeed("timeline");
    return openTimeline(seed, false, timelineConstraintsFromParams(params));
  }
  if (parts[0] === "timeline" && parts[1]) return openTimeline(decodeURIComponent(parts[1]), false, timelineConstraintsFromParams(params));
  if (parts[0] === "timeline" && hashQuery) {
    const seed = params.get("seed") || sharedDerivedSeed(state.universe.seed || "local-archive", `timeline-${hashQuery}`);
    return openTimeline(seed, false, timelineConstraintsFromParams(params));
  }
  if (parts[0] === "timeline") return renderTimelineIndex();
  if (parts[0] === "events" && parts[1]) return renderTimelineEventRoute(decodeURIComponent(parts[1]));
  if (parts[0] === "factions" && parts[1] === "new") {
    const seed = params.get("seed") || makeSharedSeed("faction");
    return openFaction(seed, false, factionConstraintsFromParams(params));
  }
  if (parts[0] === "factions" && parts[1]) return openFaction(decodeURIComponent(parts[1]), false);
  if (parts[0] === "factions" && hashQuery) {
    return renderFactionsIndex({
      settlement: params.get("settlement"),
      organization: params.get("organization") || params.get("government"),
      ideology: params.get("ideology")
    });
  }
  if (parts[0] === "factions") return renderFactionsIndex();
  if (parts[0] === "relationships" && parts[1] === "path") return openRelationshipPath(params.get("from"), params.get("to"), false);
  if (parts[0] === "relationships" && parts[1] === "explore") return openRelationshipExplorer(relationshipOptionsFromParams(params), false);
  if (parts[0] === "relationships" && parts[1] === "new") return renderRelationshipsIndex({ openExplorer: true });
  if (parts[0] === "relationships" && parts[1]) return openRelationshipDetail(decodeURIComponent(parts[1]));
  if (parts[0] === "relationships" && hashQuery) return openRelationshipExplorer(relationshipOptionsFromParams(params), false);
  if (parts[0] === "relationships") return renderRelationshipsIndex();
  if (parts[0] === "premises" && parts[1] === "new") {
    const seed = params.get("seed") || makeSharedSeed("premise");
    return openPremise(seed, false, premiseConstraintsFromParams(params));
  }
  if (parts[0] === "premises" && parts[1]) return openPremise(decodeURIComponent(parts[1]), false, premiseConstraintsFromParams(params));
  if (parts[0] === "premises" && hashQuery) return renderPremisesIndex(premiseConstraintsFromParams(params));
  if (parts[0] === "premises") return renderPremisesIndex();
  if (parts[0] === "atlas" && parts[1] === "explore") return openAtlasExplore(atlasFiltersFromParams(params), false);
  if (parts[0] === "atlas" && parts[1] === "index") return openAtlasAtoZ(atlasFiltersFromParams(params), false);
  if (parts[0] === "atlas" && parts[1] === "maps") return openAtlasMaps(atlasFiltersFromParams(params), false);
  if (parts[0] === "atlas" && parts[1] === "timeline") return openAtlasTimelineView(atlasFiltersFromParams(params), "", false);
  if (parts[0] === "atlas" && parts[1] === "collections") return openAtlasCollections(atlasFiltersFromParams(params), false);
  if (parts[0] === "atlas" && parts[1] === "glossary") return openAtlasGlossary(atlasFiltersFromParams(params), false);
  if (parts[0] === "atlas" && parts[1] === "world-bible") return openWorldBible(atlasFiltersFromParams(params), false);
  if (parts[0] === "atlas" && parts[1] === "entity" && parts[2]) return openAtlasArticle(decodeURIComponent(parts[2]), atlasFiltersFromParams(params), false);
  if (parts[0] === "atlas" && parts[1] === "category" && parts[2]) return openAtlasCategory(decodeURIComponent(parts[2]), atlasFiltersFromParams(params));
  if (parts[0] === "atlas" && parts[1] === "system" && parts[2]) return openAtlasArticle(decodeURIComponent(parts[2]), atlasFiltersFromParams(params), false);
  if (parts[0] === "atlas" && parts[1] === "settlement" && parts[2]) return openAtlasArticle(decodeURIComponent(parts[2]), atlasFiltersFromParams(params), false);
  if (parts[0] === "atlas" && parts[1] === "era" && parts[2]) return openAtlasArticle(decodeURIComponent(parts[2]), atlasFiltersFromParams(params), false);
  if (parts[0] === "atlas" && parts[1] === "year" && parts[2]) return openAtlasTimelineView(atlasFiltersFromParams(params), decodeURIComponent(parts[2]), false);
  if (parts[0] === "atlas" && hashQuery) return renderAtlasIndexPage(atlasFiltersFromParams(params));
  if (parts[0] === "atlas") return renderAtlasIndexPage();
  if (parts[0] === "technology" && parts[1] === "compare") return app.innerHTML = renderTechnologyComparison(["technologies", "infrastructureSystems", "technicalStandards", "researchPrograms", "technicalFacilities"].flatMap(key => state.universe[key]));
  if (parts[0] === "technology" && parts[1] === "new") return openTechnology(params.get("seed") || makeSharedSeed("technology"), false, technologyConstraintsFromParams(params));
  if (parts[0] === "technology" && parts[1]) return openTechnology(decodeURIComponent(parts[1]), false, { entityType: "technology" });
  if (parts[0] === "technology" && hashQuery) return renderTechnologyIndex(technologyFiltersFromParams(params));
  if (parts[0] === "technology") return renderTechnologyIndex();
  if (parts[0] === "infrastructure" && parts[1]) return openTechnology(decodeURIComponent(parts[1]), false, { entityType: "infrastructureSystem" });
  if (parts[0] === "standards" && parts[1]) return openTechnology(decodeURIComponent(parts[1]), false, { entityType: "technicalStandard" });
  if (parts[0] === "research" && parts[1]) return openTechnology(decodeURIComponent(parts[1]), false, { entityType: "researchProgram" });
  if (parts[0] === "facilities" && parts[1]) return openTechnology(decodeURIComponent(parts[1]), false, { entityType: "technicalFacility" });
  if (parts[0] === "organizations" && parts[1]) return openSeed(decodeURIComponent(parts[1]), false);
  if (parts[0] === "organizations") return renderHome();
  if (parts[0] === "library") return renderSuiteHome();
  if (parts[0] === "settings") return renderSettings();
  return renderSuiteHome();
}

app.addEventListener("click", event => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "go-home") {
    navigateTo("#/home");
    renderSuiteHome();
  }
  if (action === "go-systems") {
    navigateTo("#/systems");
    renderSystemsIndex();
  }
  if (action === "go-settlements") {
    navigateTo("#/settlements");
    renderSettlementsIndex();
  }
  if (action === "go-organizations") {
    navigateTo("#/organizations");
    renderHome();
  }
  if (action === "go-characters") {
    navigateTo("#/characters");
    renderCharactersIndex();
  }
  if (action === "go-conflicts") {
    navigateTo("#/conflicts");
    renderConflictsIndex();
  }
  if (action === "go-documents") {
    navigateTo("#/documents");
    renderDocumentsIndex();
  }
  if (action === "go-timeline") {
    navigateTo("#/timeline");
    renderTimelineIndex();
  }
  if (action === "go-factions") {
    navigateTo("#/factions");
    renderFactionsIndex();
  }
  if (action === "go-relationships") {
    navigateTo("#/relationships");
    renderRelationshipsIndex();
  }
  if (action === "go-premises") {
    navigateTo("#/premises");
    renderPremisesIndex();
  }
  if (action === "go-atlas") {
    navigateTo("#/atlas");
    renderAtlasIndexPage();
  }
  if (action === "go-technology") {
    navigateTo("#/technology");
    renderTechnologyIndex();
  }
  if (action === "generate") openSeed(makeSeed());
  if (action === "seed") openSeed(document.querySelector("#seedInput")?.value.trim() || makeSeed());
  if (action === "open") openSeed(target.dataset.seed);
  if (action === "generate-system") openSystem(makeSharedSeed("system"), true, systemConstraintsFromForm());
  if (action === "open-system-seed") openSystem(document.querySelector("#systemSeedInput")?.value.trim() || makeSharedSeed("system"), true, systemConstraintsFromForm());
  if (action === "open-system") openSystem(target.dataset.seed);
  if (action === "save-system") saveCurrentSystem();
  if (action === "favorite-system") toggleSystemFavorite();
  if (action === "regenerate-system") openSystem(makeSharedSeed("system"), true, systemConstraintsFromForm());
  if (action === "export-system-json") exportSystemJson();
  if (action === "export-system-md") exportSystemMarkdown();
  if (action === "open-system-organization") openSystemOrganization(target.dataset.seed, target.dataset.name);
  if (action === "generate-settlement") openSettlement(makeSharedSeed("settlement"), true, settlementConstraintsFromForm());
  if (action === "open-settlement-seed") openSettlement(document.querySelector("#settlementSeedInput")?.value.trim() || makeSharedSeed("settlement"), true, settlementConstraintsFromForm());
  if (action === "open-settlement") openSettlement(target.dataset.seed);
  if (action === "expand-summary-settlement") expandSystemSettlement(target.dataset.systemSeed, target.dataset.summaryId);
  if (action === "expand-system-settlement") {
    if (state.currentSystem && !getSavedSystem(state.currentSystem.seed)) saveCurrentSystem();
    expandSystemSettlement(state.currentSystem.seed, target.dataset.summaryId);
  }
  if (action === "save-settlement") saveCurrentSettlement();
  if (action === "favorite-settlement") toggleSettlementFavorite();
  if (action === "regenerate-settlement") openSettlement(makeSharedSeed("settlement"), true, settlementConstraintsFromForm());
  if (action === "attach-settlement") attachSettlementModal();
  if (action === "export-settlement-json") exportSettlementJson();
  if (action === "export-settlement-md") exportSettlementMarkdown();
  if (action === "export-settlement-map-svg") exportSettlementMapSvg();
  if (action === "open-settlement-organization") openSettlementOrganization(target.dataset.seed, target.dataset.name);
  if (action === "generate-character") openCharacter(makeSharedSeed("character"), true, characterConstraintsFromForm());
  if (action === "open-character-seed") openCharacter(document.querySelector("#characterSeedInput")?.value.trim() || makeSharedSeed("character"), true, characterConstraintsFromForm());
  if (action === "open-character") openCharacter(target.dataset.seed);
  if (action === "expand-person-character") expandPersonCharacter(target.dataset.orgSeed, target.dataset.personId);
  if (action === "save-character") saveCurrentCharacter();
  if (action === "favorite-character") toggleCharacterFavorite();
  if (action === "regenerate-character") openCharacter(makeSharedSeed("character"), true, characterConstraintsFromForm());
  if (action === "export-character-json") exportCharacterJson();
  if (action === "export-character-md") exportCharacterMarkdown();
  if (action === "generate-conflict") {
    const { seed, ...constraints } = conflictConstraintsFromForm();
    openConflict(seed, true, constraints);
  }
  if (action === "generate-world-conflict") {
    const seed = document.querySelector("#conflictSeedInput")?.value.trim() || makeSharedSeed("conflict");
    openConflict(seed, true, { context: existingWorldContext(seed) });
  }
  if (action === "open-conflict-seed") {
    const { seed, ...constraints } = conflictConstraintsFromForm();
    openConflict(seed, true, constraints);
  }
  if (action === "open-conflict") openConflict(target.dataset.seed);
  if (action === "expand-pressure-conflict") expandPressureConflict(target.dataset.sourceType, target.dataset.parentSeed, target.dataset.sourceId);
  if (action === "expand-settlement-tension") {
    if (state.currentSettlement && !getSavedSettlement(state.currentSettlement.seed)) saveCurrentSettlement();
    expandPressureConflict("settlement-tension", state.currentSettlement.seed, target.dataset.tensionId);
  }
  if (action === "expand-system-tension") {
    if (state.currentSystem && !getSavedSystem(state.currentSystem.seed)) saveCurrentSystem();
    expandPressureConflict("system-tension", state.currentSystem.seed, target.dataset.tensionId);
  }
  if (action === "save-conflict") saveCurrentConflict();
  if (action === "favorite-conflict") toggleConflictFavorite();
  if (action === "regenerate-conflict") {
    const seed = makeSharedSeed("conflict");
    openConflict(seed, true, { context: existingWorldContext(seed) });
  }
  if (action === "export-conflict-json") exportConflictJson();
  if (action === "export-conflict-md") exportConflictMarkdown();
  if (action === "conflict-tab") {
    state.activeConflictTab = target.dataset.tab;
    renderConflict();
    document.querySelector(".tab-button.active")?.scrollIntoView({ inline: "center", block: "nearest" });
  }
  if (action === "generate-document") {
    const { seed, ...constraints } = documentConstraintsFromForm();
    openDocument(seed, true, constraints);
  }
  if (action === "generate-world-document") {
    const seed = document.querySelector("#documentSeedInput")?.value.trim() || makeSharedSeed("document");
    openDocument(seed, true, { context: existingDocumentContext(seed) });
  }
  if (action === "generate-conflict-evidence") {
    const seed = document.querySelector("#documentSeedInput")?.value.trim() || makeSharedSeed("document");
    openDocument(seed, true, { documentType: "witness-statement", context: existingDocumentContext(seed, { forceConflict: true }) });
  }
  if (action === "open-document-seed") {
    const { seed, ...constraints } = documentConstraintsFromForm();
    openDocument(seed, true, constraints);
  }
  if (action === "open-document") openDocument(target.dataset.seed);
  if (action === "generate-suggested-document") generateSuggestedDocument(target.dataset.sourceType, target.dataset.parentSeed, target.dataset.sourceId, target.dataset.documentType);
  if (action === "expand-organization-document") {
    if (state.current && !isSaved(state.current.seed)) saveCurrent();
    generateSuggestedDocument("organization-document", state.current.seed, target.dataset.docId, target.dataset.documentType);
  }
  if (action === "expand-settlement-law-document") {
    if (state.currentSettlement && !getSavedSettlement(state.currentSettlement.seed)) saveCurrentSettlement();
    generateSuggestedDocument("settlement-law", state.currentSettlement.seed, target.dataset.lawId, "public-notice");
  }
  if (action === "save-document") saveCurrentDocument();
  if (action === "favorite-document") toggleDocumentFavorite();
  if (action === "regenerate-document") {
    const seed = makeSharedSeed("document");
    openDocument(seed, true, { context: existingDocumentContext(seed) });
  }
  if (action === "toggle-redactions") {
    state.revealDocumentRedactions = !state.revealDocumentRedactions;
    renderDocument();
  }
  if (action === "print-document") printCurrentDocument();
  if (action === "export-document-json") exportDocumentJson();
  if (action === "export-document-md") exportDocumentMarkdown(true);
  if (action === "export-document-full-md") exportDocumentMarkdown(false);
  if (action === "export-document-text") exportDocumentText();
  if (action === "export-document-html") exportDocumentHtml();
  if (action === "document-tab") {
    state.activeDocumentTab = target.dataset.tab;
    renderDocument();
    document.querySelector(".tab-button.active")?.scrollIntoView({ inline: "center", block: "nearest" });
  }
  if (action === "open-universe-timeline" || action === "extract-history") {
    const seed = document.querySelector("#timelineSeedInput")?.value.trim() || sharedDerivedSeed(state.universe.seed || "local-archive", "universe-timeline");
    openTimeline(seed, true, {});
  }
  if (action === "generate-connective-events" || action === "add-historical-event" || action === "create-alternate-branch-home") {
    const seed = document.querySelector("#timelineSeedInput")?.value.trim() || makeSharedSeed("timeline");
    const { scope } = timelineConstraintsFromForm();
    openTimeline(seed, true, { scope });
    if (action === "generate-connective-events" || action === "add-historical-event") state.activeTimelineTab = "Gaps";
    if (action === "create-alternate-branch-home") state.activeTimelineTab = "Branches";
    renderTimeline();
  }
  if (action === "create-timeline" || action === "open-timeline-seed") {
    const { seed, scope } = timelineConstraintsFromForm();
    openTimeline(seed, true, { scope });
  }
  if (action === "open-timeline") openTimeline(target.dataset.seed);
  if (action === "open-suggested-timeline") openSuggestedTimeline(target.dataset.collection, target.dataset.id, target.dataset.seed);
  if (action === "save-timeline") saveCurrentTimeline();
  if (action === "favorite-timeline") toggleTimelineFavorite();
  if (action === "regenerate-timeline") openTimeline(makeSharedSeed("timeline"), true, {});
  if (action === "create-timeline-branch") createTimelineBranch();
  if (action === "export-timeline-json") exportTimelineJson();
  if (action === "export-timeline-md") exportTimelineMarkdown();
  if (action === "export-timeline-html") exportTimelineHtml();
  if (action === "timeline-tab") {
    state.activeTimelineTab = target.dataset.tab;
    renderTimeline();
    document.querySelector(".tab-button.active")?.scrollIntoView({ inline: "center", block: "nearest" });
  }
  if (action === "generate-faction" || action === "open-faction-seed") {
    const { seed, ...constraints } = factionConstraintsFromForm();
    openFaction(seed, true, constraints);
  }
  if (action === "generate-world-faction" || action === "create-manual-faction") {
    const seed = document.querySelector("#factionSeedInput")?.value.trim() || makeSharedSeed("faction");
    const constraints = action === "create-manual-faction" ? { context: {} } : { context: existingFactionContext(seed) };
    openFaction(seed, true, constraints);
  }
  if (action === "open-faction") openFaction(target.dataset.seed);
  if (action === "open-suggested-faction") openSuggestedFaction(target.dataset.collection, target.dataset.id, target.dataset.seed, target.dataset.factionType);
  if (action === "save-faction") saveCurrentFaction();
  if (action === "favorite-faction") toggleFactionFavorite();
  if (action === "regenerate-faction") {
    const seed = makeSharedSeed("faction");
    openFaction(seed, true, { context: existingFactionContext(seed) });
  }
  if (action === "generate-faction-conflict") generateFactionConflict();
  if (action === "generate-faction-document") generateFactionDocument();
  if (action === "export-faction-json") exportFactionJson();
  if (action === "export-faction-md") exportFactionMarkdown();
  if (action === "faction-tab") {
    state.activeFactionTab = target.dataset.tab;
    renderFaction();
    document.querySelector(".tab-button.active")?.scrollIntoView({ inline: "center", block: "nearest" });
  }
  if (action === "explore-relationships") openRelationshipExplorer(relationshipOptionsFromForm());
  if (action === "focus-relationships") openRelationshipExplorer({ focus: document.querySelector("#relationshipFocus")?.value || "" });
  if (action === "find-relationship-path") relationshipPathFromForm();
  if (action === "new-relationship") openRelationshipExplorer({ openCreate: true });
  if (action === "validate-relationships") validateCurrentRelationships();
  if (action === "relationship-entry") {
    if (target.dataset.entry === "path") return relationshipPathFromForm();
    const familyByEntry = { character: "personal", organization: "institutional", faction: "factional", conflict: "conflict", settlement: "spatial", document: "documentary", historical: "historical" };
    openRelationshipExplorer({ family: familyByEntry[target.dataset.entry] || "" });
  }
  if (action === "save-relationship-view") saveRelationshipView();
  if (action === "export-relationships-json") exportRelationshipsJson();
  if (action === "export-relationships-md") exportRelationshipsMarkdown();
  if (action === "export-relationships-html") exportRelationshipsHtml();
  if (action === "relationship-tab") {
    state.activeRelationshipTab = target.dataset.tab;
    renderRelationshipExplorerView();
    document.querySelector(".tab-button.active")?.scrollIntoView({ inline: "center", block: "nearest" });
  }
  if (action === "generate-premise" || action === "open-premise-seed") {
    const seed = document.querySelector("#premiseSeedInput")?.value.trim() || makeSharedSeed("premise");
    openPremise(seed, true, premiseConstraintsFromForm());
  }
  if (action === "generate-world-premise") {
    const seed = document.querySelector("#premiseSeedInput")?.value.trim() || sharedDerivedSeed(state.universe.seed || "local-archive", "universe-pressure-premise");
    openPremise(seed, true, { mode: "discovery" });
  }
  if (action === "create-manual-premise") {
    const seed = document.querySelector("#premiseSeedInput")?.value.trim() || makeSharedSeed("premise");
    openPremise(seed, true, { ...premiseConstraintsFromForm(), status: "idea" });
  }
  if (action === "open-premise") openPremise(target.dataset.seed);
  if (action === "open-suggested-premise") openPremise(target.dataset.seed, true, { focus: target.dataset.focus || "", mode: "focused" });
  if (action === "premise-entry") {
    const entry = target.dataset.entry || "";
    const genreByEntry = { "political-thriller": "political-thriller", survival: "survival", relationship: "psychological-drama", document: "science-fiction-mystery", historical: "historical-science-fiction" };
    const focus = premiseEntityOptions().find(entity => entity.entityType === entry || (entry === "historical" && entity.entityType === "historicalEvent"))?.id || "";
    openPremise(sharedDerivedSeed(state.universe.seed || "local-archive", `premise-${entry}`), true, { focus, genre: genreByEntry[entry] || "", mode: focus ? "focused" : "discovery" });
  }
  if (action === "save-premise") saveCurrentPremise();
  if (action === "favorite-premise") togglePremiseFavorite();
  if (action === "regenerate-premise") regeneratePremiseVariant();
  if (action === "archive-premise") archiveCurrentPremise();
  if (action === "export-premise-json") exportPremiseJson();
  if (action === "export-premise-md") exportPremiseMarkdown();
  if (action === "export-premise-html") exportPremiseHtml();
  if (action === "export-premise-brief") exportPremiseBrief();
  if (action === "export-premise-seed-package") exportPremiseSeedPackage();
  if (action === "premise-tab") {
    state.activePremiseTab = target.dataset.tab;
    renderPremise();
    document.querySelector(".tab-button.active")?.scrollIntoView({ inline: "center", block: "nearest" });
  }
  if (action === "search-atlas") openAtlasExplore(atlasFiltersFromForm());
  if (action === "save-atlas-view") saveAtlasView();
  if (action === "export-atlas-json") exportAtlasJson();
  if (action === "export-atlas-md") exportAtlasMarkdown();
  if (action === "export-atlas-html") exportAtlasHtml();
  if (action === "export-atlas-article-md") exportAtlasArticleMarkdown(target.dataset.entityId);
  if (action === "export-atlas-article-html") exportAtlasArticleHtml(target.dataset.entityId);
  if (action === "copy-atlas-link") copyAtlasLink(target.dataset.route || location.hash || "#/atlas");
  if (action === "export-world-bible-json") exportWorldBibleJson();
  if (action === "export-world-bible-md") exportWorldBibleMarkdown();
  if (action === "export-world-bible-html") exportWorldBibleHtml();
  if (action === "generate-technology" || action === "open-technology-seed") {
    const { seed, ...constraints } = technologyConstraintsFromForm();
    openTechnology(seed, true, constraints);
  }
  if (action === "generate-infrastructure") {
    const { seed, ...constraints } = technologyConstraintsFromForm("infrastructureSystem");
    openTechnology(seed, true, constraints);
  }
  if (action === "create-standard") {
    const { seed, ...constraints } = technologyConstraintsFromForm("technicalStandard");
    openTechnology(seed, true, constraints);
  }
  if (action === "create-research") {
    const { seed, ...constraints } = technologyConstraintsFromForm("researchProgram");
    openTechnology(seed, true, constraints);
  }
  if (action === "create-facility") {
    const { seed, ...constraints } = technologyConstraintsFromForm("technicalFacility");
    openTechnology(seed, true, constraints);
  }
  if (action === "technology-entry") {
    const domain = target.dataset.domain;
    const entityType = domain === "infrastructure" ? "infrastructureSystem" : domain === "standard" ? "technicalStandard" : "technology";
    openTechnology(sharedDerivedSeed(state.universe.seed || "local-archive", `technology-${domain}`), true, { entityType, domain: domain === "infrastructure" || domain === "standard" ? "" : domain, mode: "guided" });
  }
  if (action === "generate-suggested-technology") {
    const source = findAnyEntity(target.dataset.sourceId);
    openTechnology(sharedDerivedSeed(source?.seed || source?.id || state.universe.seed || "local-archive", `technology-${target.dataset.domain}-${target.dataset.category}`), true, {
      entityType: target.dataset.entityType || "technology",
      domain: target.dataset.domain || "",
      category: target.dataset.category || "",
      focus: source?.id || "",
      mode: "contextual"
    });
  }
  if (action === "open-technology") openTechnology(target.dataset.id);
  if (action === "save-technology") saveCurrentTechnology();
  if (action === "favorite-technology") toggleTechnologyFavorite();
  if (action === "regenerate-technology") regenerateTechnology();
  if (action === "export-technology-json") exportTechnologyJson();
  if (action === "export-technology-md") exportTechnologyMarkdown();
  if (action === "export-technology-html") exportTechnologyHtml();
  if (action === "export-technology-csv") exportTechnologyCsv();
  if (action === "export-technology-svg") exportTechnologySvg();
  if (action === "export-technology-registry-html") exportTechnologyRegistryHtml();
  if (action === "technology-tab") {
    state.activeTechnologyTab = target.dataset.tab;
    renderTechnology();
    document.querySelector(".tab-button.active")?.scrollIntoView({ inline: "center", block: "nearest" });
  }
  if (action === "character-tab") {
    state.activeCharacterTab = target.dataset.tab;
    renderCharacter();
    document.querySelector(".tab-button.active")?.scrollIntoView({ inline: "center", block: "nearest" });
  }
  if (action === "settlement-tab") {
    state.activeSettlementTab = target.dataset.tab;
    renderSettlement();
    document.querySelector(".tab-button.active")?.scrollIntoView({ inline: "center", block: "nearest" });
  }
  if (action === "system-tab") {
    state.activeSystemTab = target.dataset.tab;
    renderSystem();
    document.querySelector(".tab-button.active")?.scrollIntoView({ inline: "center", block: "nearest" });
  }
  if (action === "open-related") openRelated(target.dataset.seed, target.dataset.name);
  if (action === "trail") openTrail(Number(target.dataset.index));
  if (action === "tab") {
    state.activeTab = target.dataset.tab;
    renderOrganization();
    document.querySelector(".tab-button.active")?.scrollIntoView({ inline: "center", block: "nearest" });
  }
  if (action === "save") saveCurrent();
  if (action === "favorite") toggleFavorite();
  if (action === "regenerate") openSeed(makeSeed());
  if (action === "share") copyShareLink();
  if (action === "export-menu") renderExportMenu();
  if (action === "document") showDocument(target.dataset.doc);
  if (action === "mutate") mutate(target.dataset.section);
  if (action === "save-library-notes") saveLibraryNotes();
  if (action === "export-library") exportLibrary();
  if (action === "import-library") document.querySelector("#importInput")?.click();
});

modalBody.addEventListener("click", event => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "export-json") exportJson();
  if (action === "export-md") exportMarkdown();
  if (action === "export-svg") exportSvg();
  if (action === "export-seal-svg") Exporters.exportSvg(state.current, "seal");
  if (action === "export-png") Exporters.exportVisualPng(state.current, "summary");
  if (action === "export-badge-png") Exporters.exportVisualPng(state.current, "badge");
  if (action === "export-poster-png") Exporters.exportVisualPng(state.current, "poster");
  if (action === "export-incident-png") Exporters.exportVisualPng(state.current, "incident");
  if (action === "save-settings") saveSettingsFromForm();
  if (action === "clear-settings") {
    state.settings = {};
    saveSettings();
    renderSettings();
  }
  if (action === "confirm-attach-settlement") confirmAttachSettlement();
});

document.querySelector("#modalClose").addEventListener("click", () => {
  closeModal();
});

modalBackdrop.addEventListener("click", event => {
  if (event.target === modalBackdrop) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modalBackdrop.hidden) closeModal();
  if (event.key === "Tab" && !modalBackdrop.hidden) {
    const focusable = [...modalBackdrop.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")]
      .filter(el => !el.disabled && el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

document.querySelector("#homeButton").addEventListener("click", () => {
  navigateTo("#/home");
  renderSuiteHome();
});
document.querySelectorAll("[data-route]").forEach(button => {
  button.addEventListener("click", () => {
    navigateTo(button.dataset.route);
    renderRoute();
  });
});
document.querySelector("#settingsButton").addEventListener("click", renderSettings);
document.querySelector("#aboutButton").addEventListener("click", renderAbout);

window.addEventListener("popstate", renderRoute);
window.addEventListener("hashchange", renderRoute);

window.ICR = {
  generateOrganization,
  renderTab,
  renderDocumentPaper,
  INDUSTRIES,
  TABS
};

window.SciFiWorldbuilder = {
  generateOrganization,
  generateStarSystem,
  generateSettlement,
  generateCharacter,
  renderSystemTab: (system, tab) => import("./modules/systems/render.js").then(module => module.renderSystemTab(system, tab)),
  renderSettlementTab: (settlement, tab) => import("./modules/settlements/render.js").then(module => module.renderSettlementTab(settlement, tab)),
  renderCharacterTab: (character, tab) => import("./modules/characters/render.js").then(module => module.renderCharacterTab(character, tab)),
  generateConflict,
  renderConflictTab: (conflict, tab) => import("./modules/conflicts/render.js").then(module => module.renderConflictTab(conflict, tab)),
  generateDocument,
  validateDocument,
  renderDocumentTab: (document, tab) => import("./modules/documents/render.js").then(module => module.renderDocumentTab(document, tab)),
  generateTimeline,
  extractTimelineEvents,
  validateTimeline,
  renderTimelineTab: (timeline, tab) => import("./modules/timeline/render.js").then(module => module.renderTimelineTab(timeline, tab)),
  generateFaction,
  validateFaction,
  renderFactionTab: (faction, tab) => import("./modules/factions/render.js").then(module => module.renderFactionTab(faction, tab)),
  buildRelationshipGraph,
  findRelationshipPath,
  validateRelationshipData,
  renderRelationshipTab: (graph, tab, path = []) => import("./modules/relationships/render.js").then(module => module.renderRelationshipTab(graph, tab, path)),
  generateStoryPremise,
  collectNarrativePressureSignals,
  validateStoryPremise,
  evaluateStoryPremise,
  analyzePremiseCoverage,
  renderPremiseTab: (premise, tab) => import("./modules/premises/render.js").then(module => module.renderPremiseTab(premise, tab)),
  buildAtlas,
  buildAtlasIndex,
  buildAtlasArticle,
  buildWorldBible,
  createUniverseProfile,
  searchAtlas,
  atlasContinuityAudit,
  atlasCoverageAudit,
  generateTechnology,
  generateInfrastructure,
  generateTechnicalStandard,
  generateResearchProgram,
  generateTechnicalFacility,
  validateTechnologyEntity,
  analyzeTechnologyDependencies,
  traceFailureCascade,
  analyzeTechnologyCoverage,
  suggestTechnologies,
  generateTechnologyEcosystem,
  get universe() {
    return state.universe;
  }
};
window.FutureArchive = window.SciFiWorldbuilder;

const initialSeed = new URLSearchParams(window.location.search).get("seed");
if (initialSeed && !window.location.hash) {
  openSeed(initialSeed, false);
} else {
  renderRoute();
}
