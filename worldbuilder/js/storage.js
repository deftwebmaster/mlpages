import { deterministicCreatedAt, hashString } from "./shared/random.js";

export const SUITE_STORAGE_KEY = "futureArchive.suite.v1";
export const LEGACY_ORG_STORAGE_KEY = "icr.registry.v1";
export const SCHEMA_VERSION = 1;

export function createDefaultUniverse() {
  const now = new Date().toISOString();
  return {
    id: `universe_${hashString(now).toString(36)}`,
    schemaVersion: SCHEMA_VERSION,
    name: "Local Archive",
    seed: "local-archive",
    createdAt: now,
    updatedAt: now,
    settings: {
      tone: "grounded",
      technologyLevel: "mature-interplanetary",
      civilizationScale: "multi-system",
      weirdness: 35,
      namingStyle: "mixed"
    },
    systems: [],
    settlements: [],
    organizations: [],
    characters: [],
    conflicts: [],
    documents: [],
    documentCollections: [],
    timelines: [],
    historicalEvents: [],
    timelineBranches: [],
    factions: [],
    factionCoalitions: [],
    relationshipViews: [],
    relationships: [],
    storyPremises: [],
    premiseCollections: [],
    narrativePressureSignals: [],
    universeProfile: null,
    encyclopediaEntries: [],
    atlasCollections: [],
    atlasMaps: [],
    atlasViews: [],
    atlasArticleSummaries: [],
    atlasNotes: [],
    technologies: [],
    infrastructureSystems: [],
    technicalStandards: [],
    researchPrograms: [],
    technicalFacilities: [],
    technologyCollections: [],
    technologyEcosystems: [],
    tags: [],
    notes: ""
  };
}

export function loadSuite() {
  const suite = readJson(SUITE_STORAGE_KEY) || {
    schemaVersion: SCHEMA_VERSION,
    activeUniverseId: null,
    universes: []
  };
  if (!suite.universes.length) {
    const universe = createDefaultUniverse();
    suite.activeUniverseId = universe.id;
    suite.universes.push(universe);
  }
  suite.universes.forEach(ensureUniverseShape);
  migrateLegacyOrganizations(suite);
  saveSuite(suite);
  return suite;
}

export function saveSuite(suite) {
  const active = getActiveUniverse(suite);
  if (active) active.updatedAt = new Date().toISOString();
  localStorage.setItem(SUITE_STORAGE_KEY, JSON.stringify(suite));
}

export function getActiveUniverse(suite) {
  return suite.universes.find(universe => universe.id === suite.activeUniverseId) || suite.universes[0];
}

export function upsertEntity(universe, collectionName, entity, metadata = {}) {
  const collection = universe[collectionName];
  const payloadKey = entityPayloadKey(entity.entityType);
  const found = collection.find(item => item.seed === entity.seed || item.id === entity.id);
  const savedAt = new Date().toISOString();
  if (found) {
    found[payloadKey] = entity;
    found.entity = entity;
    found.savedAt = savedAt;
    found.updatedAt = savedAt;
    Object.assign(found, metadata);
    return found;
  }
  const record = {
    id: entity.id,
    entityType: entity.entityType,
    seed: entity.seed,
    savedAt,
    createdAt: entity.createdAt || deterministicCreatedAt(entity.seed),
    updatedAt: savedAt,
    favorite: false,
    tags: entity.tags || [],
    notes: entity.notes || "",
    entity,
    ...metadata
  };
  record[payloadKey] = entity;
  collection.push(record);
  return record;
}

export function findEntity(universe, collectionName, seed) {
  return universe[collectionName].find(item => item.seed === seed || item.id === seed);
}

export function addRelationship(universe, relationship) {
  if (universe.relationships.some(item => item.id === relationship.id)) return;
  universe.relationships.push(relationship);
}

function migrateLegacyOrganizations(suite) {
  if (localStorage.getItem("futureArchive.migrations.legacyOrganizations.v1") === "complete") return;
  const legacy = readJson(LEGACY_ORG_STORAGE_KEY);
  if (!legacy?.organizations?.length) {
    localStorage.setItem("futureArchive.migrations.legacyOrganizations.v1", "complete");
    return;
  }
  const universe = getActiveUniverse(suite);
  const bySeed = new Map(universe.organizations.map(item => [item.seed, item]));
  for (const item of legacy.organizations) {
    if (!item?.seed || !item.organization || bySeed.has(item.seed)) continue;
    const organization = {
      ...item.organization,
      id: item.organization.id || `org_${hashString(item.seed).toString(36)}`,
      entityType: "organization",
      updatedAt: item.savedAt || item.organization.updatedAt || new Date().toISOString(),
      favorite: Boolean(item.favorite),
      tags: item.tags || item.organization.tags || [],
      notes: item.notes || item.organization.notes || "",
      relationships: item.organization.relationships || []
    };
    universe.organizations.push({
      id: organization.id,
      entityType: "organization",
      seed: item.seed,
      savedAt: item.savedAt,
      favorite: Boolean(item.favorite),
      tags: item.tags || [],
      notes: item.notes || "",
      organization,
      entity: organization
    });
  }
  localStorage.setItem("futureArchive.migrations.legacyOrganizations.v1", "complete");
}

function ensureUniverseShape(universe) {
  universe.systems ||= [];
  universe.settlements ||= [];
  universe.organizations ||= [];
  universe.characters ||= [];
  universe.conflicts ||= [];
  universe.documents ||= [];
  universe.documentCollections ||= [];
  universe.timelines ||= [];
  universe.historicalEvents ||= [];
  universe.timelineBranches ||= [];
  universe.factions ||= [];
  universe.factionCoalitions ||= [];
  universe.relationshipViews ||= [];
  universe.relationships ||= [];
  universe.storyPremises ||= [];
  universe.premiseCollections ||= [];
  universe.narrativePressureSignals ||= [];
  universe.universeProfile ||= null;
  universe.encyclopediaEntries ||= [];
  universe.atlasCollections ||= [];
  universe.atlasMaps ||= [];
  universe.atlasViews ||= [];
  universe.atlasArticleSummaries ||= [];
  universe.atlasNotes ||= [];
  universe.technologies ||= [];
  universe.infrastructureSystems ||= [];
  universe.technicalStandards ||= [];
  universe.researchPrograms ||= [];
  universe.technicalFacilities ||= [];
  universe.technologyCollections ||= [];
  universe.technologyEcosystems ||= [];
  universe.tags ||= [];
  universe.notes ||= "";
}

function entityPayloadKey(entityType) {
  if (entityType === "organization") return "organization";
  if (entityType === "star-system") return "system";
  if (entityType === "settlement") return "settlement";
  if (entityType === "character") return "character";
  if (entityType === "conflict") return "conflict";
  if (entityType === "document") return "document";
  if (entityType === "documentCollection") return "documentCollection";
  if (entityType === "timeline") return "timeline";
  if (entityType === "historicalEvent") return "historicalEvent";
  if (entityType === "timelineBranch") return "timelineBranch";
  if (entityType === "faction") return "faction";
  if (entityType === "factionCoalition") return "factionCoalition";
  if (entityType === "relationship") return "relationship";
  if (entityType === "relationshipView") return "relationshipView";
  if (entityType === "storyPremise") return "storyPremise";
  if (entityType === "premiseCollection") return "premiseCollection";
  if (entityType === "narrativePressureSignal") return "narrativePressureSignal";
  if (entityType === "universeProfile") return "universeProfile";
  if (entityType === "encyclopediaEntry") return "encyclopediaEntry";
  if (entityType === "atlasCollection") return "atlasCollection";
  if (entityType === "atlasMap") return "atlasMap";
  if (entityType === "atlasView") return "atlasView";
  if (entityType === "atlasArticleSummary") return "atlasArticleSummary";
  if (entityType === "atlasNote") return "atlasNote";
  if (entityType === "technology") return "technology";
  if (entityType === "infrastructureSystem") return "infrastructureSystem";
  if (entityType === "technicalStandard") return "technicalStandard";
  if (entityType === "researchProgram") return "researchProgram";
  if (entityType === "technicalFacility") return "technicalFacility";
  if (entityType === "technologyVariant") return "technologyVariant";
  if (entityType === "technologyCollection") return "technologyCollection";
  if (entityType === "technologyEcosystem") return "technologyEcosystem";
  return "entity";
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}
