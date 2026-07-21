import { deterministicCreatedAt, hashString, slug } from "../../shared/random.js";
import { buildRelationshipGraph } from "../relationships/generate.js";

export const ATLAS_ENTITY_TYPES = [
  "universeProfile", "star-system", "celestial-body", "station", "settlement", "district", "government", "organization", "character", "faction", "factionCoalition", "conflict", "document", "historicalEvent", "timeline", "timelineBranch", "relationship", "storyPremise", "encyclopediaEntry", "atlasCollection", "atlasMap", "atlasView", "technology", "infrastructureSystem", "technicalStandard", "researchProgram", "technicalFacility", "technologyVariant"
];

export const ATLAS_CATEGORIES = [
  category("systems", "Star Systems", "Spatial and orbital anchors for the setting."),
  category("celestial-bodies", "Celestial Bodies", "Stars, planets, moons, and major orbital bodies embedded in systems."),
  category("stations", "Stations", "Orbital and deep-space installations."),
  category("settlements", "Settlements", "Colonies, habitats, ports, cities, districts, and local governments."),
  category("districts", "Districts and Sites", "Embedded neighborhoods, facilities, ports, sites, and landmarks."),
  category("organizations", "Organizations", "Corporations, agencies, institutions, contractors, and bureaus."),
  category("characters", "Characters", "People, promoted personnel, witnesses, leaders, and viewpoint candidates."),
  category("factions", "Factions", "Movements, blocs, caucuses, coalitions, and ideological forces."),
  category("conflicts", "Conflicts", "Crises, disputes, campaigns, incidents, and escalation structures."),
  category("documents", "Documents", "In-universe records, evidence, propaganda, reports, letters, and testimony."),
  category("events", "Historical Events", "Chronology records, founding moments, turning points, and historical sources."),
  category("timelines", "Timelines and Branches", "Historical timelines, eras, branches, and alternate possibilities."),
  category("relationships", "Relationships", "Shared graph links, influence, location, authorship, conflict, and evidence ties."),
  category("premises", "Story Premises", "Narrative pressure concepts and story-development entities."),
  category("entries", "Encyclopedia Entries", "Custom concepts, terms, cultures, laws, slang, rituals, and glossary material."),
  category("collections", "Atlas Collections", "Curated reference sets, exhibits, reader guides, and research folders."),
  category("maps", "Atlas Maps", "Spatial presentations, markers, routes, regions, and map layers."),
  category("views", "Saved Views", "Saved search, branch, reader mode, pins, and presentation states."),
  category("glossary", "Glossary", "Names, titles, abbreviations, terms, pronunciations, and naming notes."),
  category("technologies", "Technologies", "Scientific principles, devices, software, materials, components, vehicles, procedures, and technical systems."),
  category("infrastructure", "Infrastructure", "Persistent service networks, utility systems, topology, deployment, maintenance, and failure cascades."),
  category("standards", "Technical Standards", "Interoperability, certification, safety, protocols, interfaces, and compatibility requirements."),
  category("research", "Research Programs", "Scientific initiatives, prototypes, field trials, milestones, failures, ethics, and future outcomes."),
  category("facilities", "Technical Facilities", "Manufacturing, research, testing, maintenance, control, distribution, recycling, and certification sites.")
];

export const KNOWLEDGE_VIEWS = ["author", "public", "reader-safe", "spoiler-light", "full-canon", "classified", "historian", "faction-archive", "government-record", "character-viewpoint", "branch-specific", "custom"];
export const SPOILER_LEVELS = ["public", "spoiler-light", "full-canon", "author-only", "secret", "classified", "branch-specific", "hidden"];
export const WORLD_BIBLE_PROFILES = ["full-author-bible", "concise-project-bible", "reader-primer", "setting-bible", "character-bible", "political-bible", "historical-bible", "novel-specific-bible", "custom"];
export const ENCYCLOPEDIA_ENTRY_TYPES = ["concept", "culture", "species", "religion", "language", "law", "legal-doctrine", "custom", "ritual", "holiday", "philosophy", "ideology", "title", "rank", "currency", "economic-term", "scientific-term", "medical-condition", "historical-term", "slang", "artifact", "food", "clothing", "artistic-work", "symbol", "unit", "location", "custom-category"];
export const MAP_TYPES = ["universe-region", "star-system", "orbital", "planetary", "settlement", "district", "trade-route", "faction-influence", "conflict", "historical", "migration", "organization-operations", "custom-annotation", "story-location", "reader-primer"];
export const MAP_LAYERS = ["geography", "celestial-bodies", "settlements", "districts", "infrastructure", "transit", "trade", "political-control", "faction-influence", "organization-presence", "conflict-zones", "historical-boundaries", "migration", "environment", "story-locations", "annotations", "documents", "relationships", "reader-safe", "author-notes"];

export function createUniverseProfile(universe = {}) {
  const entityCount = countEntities(universe);
  const systems = records(universe.systems);
  const settlements = records(universe.settlements);
  return {
    id: universe.id || `universe_${hashString(universe.seed || "local-archive").toString(36)}`,
    entityType: "universeProfile",
    schemaVersion: 1,
    name: universe.name || "Local Archive",
    shortName: universe.name || "Archive",
    subtitle: "Unified universe reference",
    summary: universe.notes || `${universe.name || "This universe"} currently contains ${entityCount} indexed entities across ${systems.length} system(s), ${settlements.length} settlement(s), and connected story records.`,
    extendedDescription: "This profile stores Atlas presentation defaults and references source entities without replacing the underlying module data.",
    canonBranchId: universe.canonBranchId || null,
    defaultCalendarId: universe.defaultCalendarId || "calendar_shared_interstellar",
    defaultEraId: universe.defaultEraId || null,
    defaultDate: universe.defaultDate || null,
    scope: {
      systemCount: systems.length,
      knownRegion: universe.settings?.civilizationScale || "local archive",
      civilizationScale: universe.settings?.civilizationScale || "multi-system",
      travelModel: universe.settings?.travelModel || "module-defined",
      communicationModel: universe.settings?.communicationModel || "module-defined"
    },
    themes: universe.themes || [],
    tone: [universe.settings?.tone || "grounded"],
    featuredEntityIds: universe.featuredEntityIds || featuredEntityIds(universe),
    collectionIds: records(universe.atlasCollections).map(item => item.id),
    atlasSettings: universe.atlasSettings || { defaultKnowledgeView: "author", spoilerLevel: "full-canon", presentationPreset: "author-reference" },
    publicationSettings: universe.publicationSettings || { readerMode: false, hideDrafts: true, hideAuthorNotes: true },
    notes: universe.notes || "",
    createdAt: universe.createdAt || deterministicCreatedAt(universe.seed || "local-archive"),
    updatedAt: universe.updatedAt || universe.createdAt || deterministicCreatedAt(`${universe.seed || "local-archive"}:updated`)
  };
}

export function buildAtlas(universe = {}, options = {}) {
  const profile = universe.universeProfile || createUniverseProfile(universe);
  const index = buildAtlasIndex(universe, options);
  const relationshipGraph = buildRelationshipGraph(universe, { view: options.view || "" });
  const continuity = atlasContinuityAudit(universe, index, relationshipGraph, options);
  const coverage = atlasCoverageAudit(universe, index, relationshipGraph);
  const maps = buildAtlasMaps(universe, index, relationshipGraph, options);
  const timeline = buildAtlasTimeline(universe, index, options);
  const glossary = buildGlossary(universe, index);
  const recentChanges = index.items.slice().sort((a, b) => new Date(b.sourceUpdatedAt || 0) - new Date(a.sourceUpdatedAt || 0)).slice(0, 12);
  return {
    id: `atlas_${hashString(`${profile.id}:${options.branch || ""}:${options.view || "author"}`).toString(36)}`,
    entityType: "atlasView",
    schemaVersion: 1,
    profile,
    index,
    relationshipGraph,
    maps,
    timeline,
    glossary,
    continuity,
    coverage,
    recentChanges,
    filters: options,
    metrics: atlasMetrics(universe, index, relationshipGraph, continuity, coverage),
    generatedAt: deterministicCreatedAt(`atlas:${profile.id}:${index.indexHash}`)
  };
}

export function buildAtlasIndex(universe = {}, options = {}) {
  const relationshipGraph = buildRelationshipGraph(universe, { view: options.view || "" });
  const relationshipsByEntity = new Map();
  relationshipGraph.allRelationships.forEach(rel => {
    [rel.sourceEntityId, rel.targetEntityId].forEach(id => {
      if (!relationshipsByEntity.has(id)) relationshipsByEntity.set(id, []);
      relationshipsByEntity.get(id).push(rel.id);
    });
  });
  const items = [];
  const add = (entity, extras = {}) => {
    if (!entity?.id) return;
    const item = indexItem(entity, universe, relationshipsByEntity, extras);
    if (passesKnowledgeView(item, options)) items.push(item);
  };
  add(createUniverseProfile(universe), { category: "universe", route: "#/atlas" });
  records(universe.systems).forEach(system => {
    add(system, { category: "systems", route: `#/atlas/system/${encodeURIComponent(system.id)}` });
    system.orbitalBodies?.forEach(body => add({ ...body, id: body.id, entityType: "celestial-body", parentEntityId: system.id, systemId: system.id, seed: `${system.seed}:${body.id}` }, { category: "celestial-bodies", route: `#/atlas/entity/${encodeURIComponent(body.id)}` }));
    system.stations?.forEach(station => add({ ...station, id: station.id, entityType: "station", parentEntityId: system.id, systemId: system.id, seed: `${system.seed}:${station.id}` }, { category: "stations", route: `#/atlas/entity/${encodeURIComponent(station.id)}` }));
  });
  records(universe.settlements).forEach(settlement => {
    add(settlement, { category: "settlements", route: `#/atlas/settlement/${encodeURIComponent(settlement.id)}` });
    settlement.districts?.forEach(district => add({ ...district, id: district.id, entityType: "district", parentEntityId: settlement.id, settlementId: settlement.id, seed: `${settlement.seed}:${district.id}` }, { category: "districts", route: `#/atlas/entity/${encodeURIComponent(district.id)}` }));
    if (settlement.government) add({ ...settlement.government, id: `government_${slug(settlement.name || settlement.id)}`, entityType: "government", parentEntityId: settlement.id, settlementId: settlement.id, name: settlement.government.type || `${settlement.name} Government`, seed: `${settlement.seed}:government` }, { category: "settlements", route: `#/atlas/entity/government_${encodeURIComponent(slug(settlement.name || settlement.id))}` });
  });
  addRecords(universe.organizations, add, "organizations", "organizations");
  addRecords(universe.characters, add, "characters", "characters");
  addRecords(universe.factions, add, "factions", "factions");
  addRecords(universe.factionCoalitions, add, "factions", "factions");
  addRecords(universe.conflicts, add, "conflicts", "conflicts");
  addRecords(universe.documents, add, "documents", "documents");
  addRecords(universe.historicalEvents, add, "events", "events");
  addRecords(universe.timelines, add, "timelines", "timeline");
  addRecords(universe.timelineBranches, add, "timelines", "timeline");
  relationshipGraph.allRelationships.forEach(rel => add(rel, { category: "relationships", route: `#/atlas/entity/${encodeURIComponent(rel.id)}` }));
  addRecords(universe.storyPremises, add, "premises", "premises");
  addRecords(universe.encyclopediaEntries, add, "entries", "entries");
  addRecords(universe.atlasCollections, add, "collections", "collections");
  addRecords(universe.atlasMaps, add, "maps", "maps");
  addRecords(universe.atlasViews, add, "views", "views");
  addRecords(universe.technologies, add, "technologies", "technology");
  addRecords(universe.infrastructureSystems, add, "infrastructure", "infrastructure");
  addRecords(universe.technicalStandards, add, "standards", "standards");
  addRecords(universe.researchPrograms, add, "research", "research");
  addRecords(universe.technicalFacilities, add, "facilities", "facilities");

  const deduped = [...new Map(items.map(item => [item.entityId, item])).values()];
  const byType = groupCount(deduped, item => item.entityType);
  const byCategory = groupCount(deduped, item => item.category);
  const byLetter = groupCount(deduped, item => item.title.slice(0, 1).toUpperCase() || "#");
  return {
    entityType: "atlasIndex",
    schemaVersion: 1,
    items: deduped.sort((a, b) => a.title.localeCompare(b.title)),
    byType,
    byCategory,
    byLetter,
    categoryDefinitions: ATLAS_CATEGORIES,
    indexHash: hashString(deduped.map(item => `${item.entityId}:${item.sourceUpdatedAt}`).join("|")).toString(36),
    stale: false,
    refreshedAt: deterministicCreatedAt(`atlas-index:${deduped.length}`)
  };
}

export function buildAtlasArticle(universe = {}, entityId, options = {}) {
  const atlas = buildAtlas(universe, options);
  const item = atlas.index.items.find(entry => entry.entityId === entityId || entry.seed === entityId || entry.title === entityId);
  if (!item) return null;
  const entity = item.entity || {};
  const related = relatedForItem(item, atlas.index, atlas.relationshipGraph, universe);
  const events = relatedByIds(atlas.index, item.historicalEventIds).concat(atlas.timeline.events.filter(event => event.entityIds.includes(item.entityId))).slice(0, 12);
  const documents = relatedByIds(atlas.index, item.documentIds).slice(0, 12);
  const premises = atlas.index.items.filter(entry => entry.entityType === "storyPremise" && entry.sourceEntityIds.includes(item.entityId)).slice(0, 8);
  const maps = atlas.maps.filter(map => map.parentEntityId === item.entityId || map.markerIds.includes(item.entityId)).slice(0, 4);
  return {
    id: `atlasArticle_${item.entityId}`,
    entityType: "atlasArticle",
    item,
    entity,
    breadcrumbs: breadcrumbsFor(item, atlas.index),
    summary: summaryForItem(item, entity, related),
    keyFacts: keyFactsFor(item, entity),
    relationships: relationshipSummaries(item, atlas.relationshipGraph, atlas.index),
    related,
    seeAlso: seeAlsoFor(item, atlas.index, atlas.relationshipGraph, premises).slice(0, 12),
    events,
    documents,
    premises,
    maps,
    continuity: atlas.continuity.findings.filter(finding => finding.entityId === item.entityId),
    coverage: atlas.coverage.findings.filter(finding => finding.entityId === item.entityId),
    summarySource: {
      sourceEntityId: item.entityId,
      sourceUpdatedAt: item.sourceUpdatedAt,
      generatorVersion: "atlas-mvp-1",
      branchId: options.branch || null,
      knowledgeView: options.view || "author",
      stale: false
    },
    articleTemplate: templateFor(item.entityType),
    authorMode: (options.view || "author") !== "reader-safe"
  };
}

export function searchAtlas(index, query = "", filters = {}) {
  const q = String(query || "").trim().toLowerCase();
  return index.items.filter(item => {
    if (filters.category && item.category !== filters.category) return false;
    if (filters.entityType && item.entityType !== filters.entityType) return false;
    if (filters.canonStatus && item.canonStatus !== filters.canonStatus) return false;
    if (filters.location && !item.locationIds.includes(filters.location)) return false;
    if (!q) return true;
    if (q.startsWith("\"") && q.endsWith("\"")) return item.searchText.includes(q.slice(1, -1));
    return q.split(/\s+/).every(part => item.searchText.includes(part));
  }).sort((a, b) => scoreSearch(b, q) - scoreSearch(a, q) || a.title.localeCompare(b.title));
}

export function atlasContinuityAudit(universe = {}, index = buildAtlasIndex(universe), relationshipGraph = buildRelationshipGraph(universe), options = {}) {
  const ids = new Set(index.items.map(item => item.entityId));
  const findings = [];
  const add = (severity, entityId, findingType, message, action = "Review source") => findings.push({ id: `atlasFinding_${hashString(`${severity}:${entityId}:${message}`).toString(36)}`, severity, entityId, findingType, message, action });
  relationshipGraph.allRelationships.forEach(rel => {
    if (!ids.has(rel.sourceEntityId)) add("moderate", rel.sourceEntityId, "unresolved-reference", `Relationship source ${rel.sourceEntityId} is not indexed.`);
    if (!ids.has(rel.targetEntityId)) add("moderate", rel.targetEntityId, "unresolved-reference", `Relationship target ${rel.targetEntityId} is not indexed.`);
  });
  records(universe.settlements).forEach(settlement => {
    if (!settlement.location?.systemId && !settlement.systemId) add("low", settlement.id, "missing-parent-location", `${nameOf(settlement)} has no linked system.`);
    if (!settlement.districts?.length) add("informational", settlement.id, "missing-districts", `${nameOf(settlement)} has no district/site records.`);
  });
  records(universe.documents).forEach(document => {
    if (!document.authorship?.authorName && !document.authorship?.issuingOrganizationName) add("low", document.id, "document-without-author", `${document.title || document.id} has no clear author or issuer.`);
  });
  records(universe.conflicts).forEach(conflict => {
    if (!conflict.parties?.length) add("high", conflict.id, "conflict-without-participants", `${nameOf(conflict)} has no participants.`);
  });
  records(universe.technologies).forEach(technology => {
    if (!technology.failureModes?.length) add("high", technology.id, "technology-without-failure-modes", `${nameOf(technology)} has no failure modes.`);
    if (!technology.maintenance?.burden) add("moderate", technology.id, "technology-without-maintenance", `${nameOf(technology)} has no maintenance model.`);
  });
  records(universe.infrastructureSystems).forEach(infra => {
    if (!infra.operatorOrganizationIds?.length) add("high", infra.id, "infrastructure-without-operator", `${nameOf(infra)} has no linked operator.`);
    if (!infra.powerDependencies?.length) add("high", infra.id, "infrastructure-without-power", `${nameOf(infra)} has no power dependency.`);
  });
  records(universe.historicalEvents).forEach(event => {
    if (!event.chronology?.displayDate && !event.chronology?.startDate && !event.year) add("low", event.id, "event-without-date", `${event.title || event.id} has no display date.`);
  });
  records(universe.storyPremises).forEach(premise => {
    if (options.view === "reader-safe" && premise.canonStatus === "non-canon-concept") add("moderate", premise.id, "reader-mode-draft", `${premise.title} is non-canon and should be hidden from reader-safe exports.`);
  });
  return { findings, unresolvedReferences: findings.filter(item => item.findingType === "unresolved-reference"), severityCounts: groupCount(findings, item => item.severity) };
}

export function atlasCoverageAudit(universe = {}, index = buildAtlasIndex(universe), relationshipGraph = buildRelationshipGraph(universe)) {
  const findings = [];
  const add = (entityId, coverageType, message, moduleRoute = "#/atlas") => findings.push({ id: `atlasCoverage_${hashString(`${entityId}:${coverageType}`).toString(36)}`, entityId, coverageType, message, moduleRoute });
  records(universe.systems).forEach(system => {
    if (!system.settlements?.length) add(system.id, "system-without-settlements", `${nameOf(system)} has no settlement hooks.`, "#/systems");
  });
  records(universe.settlements).forEach(settlement => {
    if (!records(universe.factions).some(faction => faction.settlementIds?.includes(settlement.id))) add(settlement.id, "settlement-without-factions", `${nameOf(settlement)} has no linked faction data.`, "#/factions");
    if (!records(universe.conflicts).some(conflict => conflict.location?.settlementId === settlement.id || conflict.affectedEntities?.some(entity => entity.id === settlement.id))) add(settlement.id, "settlement-without-conflicts", `${nameOf(settlement)} has no linked conflict pressure.`, "#/conflicts");
    if (!records(universe.infrastructureSystems).some(system => system.settlementIds?.includes(settlement.id))) add(settlement.id, "settlement-without-registered-infrastructure", `${nameOf(settlement)} has no registered infrastructure system.`, "#/technology");
  });
  records(universe.organizations).forEach(org => {
    if (!records(universe.documents).some(document => document.authorship?.issuingOrganizationId === org.id || document.references?.some(ref => ref.entityId === org.id))) add(org.id, "organization-without-documents", `${nameOf(org)} has no linked documents.`, "#/documents");
  });
  records(universe.characters).forEach(character => {
    if (!relationshipGraph.allRelationships.some(rel => rel.sourceEntityId === character.id || rel.targetEntityId === character.id)) add(character.id, "character-without-relationships", `${nameOf(character)} has no indexed relationships.`, "#/relationships");
  });
  records(universe.factions).forEach(faction => {
    if (!faction.historicalEventIds?.length) add(faction.id, "faction-without-history", `${nameOf(faction)} has no linked historical events.`, "#/timeline");
  });
  return { findings, byType: groupCount(findings, item => item.coverageType), underdeveloped: findings.slice(0, 24) };
}

export function buildAtlasMaps(universe = {}, index = buildAtlasIndex(universe), relationshipGraph = buildRelationshipGraph(universe), options = {}) {
  const maps = [];
  records(universe.systems).forEach(system => {
    const markers = [
      system.id,
      ...(system.orbitalBodies || []).map(item => item.id),
      ...(system.stations || []).map(item => item.id),
      ...(system.settlements || []).map(item => item.promotedEntityId || item.id)
    ].filter(Boolean);
    maps.push(mapRecord("star-system", `${nameOf(system)} System Map`, system.id, markers, system.routes?.map(route => route.id || route.name) || [], ["celestial-bodies", "settlements", "transit", "trade", "organization-presence"]));
  });
  records(universe.settlements).forEach(settlement => {
    const markers = [settlement.id, ...(settlement.districts || []).map(item => item.id), ...(settlement.organizations || []).map(item => item.promotedEntityId || item.id)].filter(Boolean);
    maps.push(mapRecord("settlement", `${nameOf(settlement)} Settlement Map`, settlement.id, markers, [], ["districts", "infrastructure", "political-control", "faction-influence", "story-locations"]));
  });
  records(universe.infrastructureSystems).forEach(infra => {
    const markers = [infra.id, ...(infra.settlementIds || []), ...(infra.nodes || []).map(item => item.id), ...(infra.technologyIds || [])].filter(Boolean);
    maps.push(mapRecord("infrastructure", `${nameOf(infra)} Infrastructure Map`, infra.id, markers, [], ["infrastructure", "settlements", "organization-presence", "annotations"]));
  });
  if (!maps.length) maps.push(mapRecord("universe-region", "Universe Reference Map", index.items[0]?.entityId || "universe", index.items.slice(0, 12).map(item => item.entityId), [], ["geography", "annotations"]));
  return maps.map((map, indexNumber) => ({ ...map, viewState: { zoom: 1, center: { x: 50 + indexNumber * 3, y: 50 } }, branchId: options.branch || null, date: options.date || null }));
}

export function buildAtlasTimeline(universe = {}, index = buildAtlasIndex(universe), options = {}) {
  const events = records(universe.historicalEvents).map(event => ({
    id: event.id,
    title: event.title || nameOf(event),
    displayDate: event.chronology?.displayDate || event.chronology?.startDate || String(event.year || "Undated"),
    sortYear: Number(event.chronology?.sortYear || event.chronology?.startDate || event.year || 999999),
    entityIds: unique([event.id, ...(event.sourceEntityIds || []), ...(event.sourceDocumentIds || [])]),
    summary: event.summary || event.eventType || ""
  })).concat(records(universe.technologies).flatMap(technology => technologyMilestoneEvents(technology)))
    .concat(records(universe.infrastructureSystems).flatMap(system => technologyMilestoneEvents(system)))
    .concat(records(universe.researchPrograms).flatMap(program => technologyMilestoneEvents(program)))
    .concat(records(universe.technicalFacilities).flatMap(facility => technologyMilestoneEvents(facility)))
    .sort((a, b) => a.sortYear - b.sortYear);
  const eras = records(universe.timelines).flatMap(timeline => timeline.eras || []).map(era => ({ ...era, entityType: "era", sourceTimelineId: era.sourceTimelineId || era.timelineId }));
  const years = groupCount(events, event => Number.isFinite(event.sortYear) ? String(event.sortYear) : "undated");
  return { events, eras, years, selectedDate: options.date || null, branchId: options.branch || null };
}

export function buildGlossary(universe = {}, index = buildAtlasIndex(universe)) {
  const entries = records(universe.encyclopediaEntries).map(entry => ({
    id: entry.id,
    term: entry.title,
    entryType: entry.entryType || "custom",
    summary: entry.summary || entry.body || "",
    relatedEntityIds: entry.relatedEntityIds || []
  }));
  const auto = index.items.filter(item => ["organization", "faction", "settlement", "star-system", "document", "technology", "infrastructureSystem", "technicalStandard", "researchProgram", "technicalFacility"].includes(item.entityType)).slice(0, 100).map(item => ({
    id: `glossary_${item.entityId}`,
    term: item.title,
    entryType: item.entityType,
    summary: item.oneLine,
    relatedEntityIds: [item.entityId],
    pronunciation: "",
    automatic: true
  }));
  return entries.concat(auto).sort((a, b) => a.term.localeCompare(b.term));
}

export function buildWorldBible(universe = {}, config = {}) {
  const atlas = buildAtlas(universe, config);
  const sections = config.sections || ["overview", "geography", "settlements", "organizations", "factions", "characters", "conflicts", "technology", "history", "relationships", "documents", "story-premises", "continuity"];
  const sectionItems = {
    overview: [atlas.profile],
    geography: atlas.index.items.filter(item => ["star-system", "celestial-body", "station"].includes(item.entityType)),
    settlements: atlas.index.items.filter(item => ["settlement", "district", "government"].includes(item.entityType)),
    organizations: atlas.index.items.filter(item => item.entityType === "organization"),
    factions: atlas.index.items.filter(item => item.entityType === "faction" || item.entityType === "factionCoalition"),
    characters: atlas.index.items.filter(item => item.entityType === "character"),
    conflicts: atlas.index.items.filter(item => item.entityType === "conflict"),
    technology: atlas.index.items.filter(item => ["technology", "infrastructureSystem", "technicalStandard", "researchProgram", "technicalFacility"].includes(item.entityType)),
    history: atlas.timeline.events,
    relationships: atlas.relationshipGraph.allRelationships.slice(0, 80),
    documents: atlas.index.items.filter(item => item.entityType === "document"),
    "story-premises": atlas.index.items.filter(item => item.entityType === "storyPremise"),
    continuity: atlas.continuity.findings
  };
  return {
    id: `worldBible_${hashString(`${atlas.profile.id}:${sections.join("|")}`).toString(36)}`,
    entityType: "worldBible",
    profile: config.profile || "full-author-bible",
    title: `${atlas.profile.name} World Bible`,
    sections: sections.map(id => ({ id, title: title(id), items: sectionItems[id] || [] })),
    atlas,
    generatedAt: atlas.generatedAt
  };
}

export function atlasMarkdown(atlas) {
  return [
    `# ${atlas.profile.name} Atlas`,
    "",
    atlas.profile.summary,
    "",
    "## Metrics",
    ...Object.entries(atlas.metrics).map(([key, value]) => `- ${title(key)}: ${value}`),
    "",
    "## Featured Entities",
    ...atlas.index.items.filter(item => atlas.profile.featuredEntityIds.includes(item.entityId)).map(item => `- ${item.title} (${item.entityType})`),
    "",
    "## Continuity Findings",
    ...atlas.continuity.findings.slice(0, 30).map(item => `- ${item.severity}: ${item.message}`)
  ].join("\n");
}

export function atlasArticleMarkdown(article) {
  return [
    `# ${article.item.title}`,
    "",
    `${title(article.item.entityType)} / ${title(article.item.status)} / ${title(article.item.canonStatus)}`,
    "",
    article.summary.short,
    "",
    "## Key Facts",
    ...article.keyFacts.map(fact => `- ${fact.label}: ${fact.value}`),
    "",
    "## Relationships",
    ...article.relationships.map(rel => `- ${rel}`),
    "",
    "## See Also",
    ...article.seeAlso.map(item => `- ${item.title} (${item.entityType})`)
  ].join("\n");
}

export function worldBibleMarkdown(worldBible) {
  return [
    `# ${worldBible.title}`,
    "",
    `Profile: ${title(worldBible.profile)}`,
    `Generated: ${worldBible.generatedAt}`,
    "",
    ...worldBible.sections.flatMap(section => [
      `## ${section.title}`,
      ...section.items.slice(0, 60).map(item => `- ${item.title || item.name || item.message || item.summary || item.id}: ${item.oneLine || item.summary || item.displayDate || item.findingType || ""}`)
    ])
  ].join("\n");
}

function indexItem(entity, universe, relationshipsByEntity, extras = {}) {
  const entityType = entity.entityType || inferType(entity);
  const titleText = nameOf(entity);
  const relatedPremises = records(universe.storyPremises).filter(premise => premise.sourceContext?.entityIds?.includes(entity.id)).map(item => item.id);
  const locationIds = locationIdsFor(entity, universe);
  const documentIds = documentIdsFor(entity, universe);
  const eventIds = eventIdsFor(entity, universe);
  const canonStatus = canonStatusFor(entity);
  const status = statusFor(entity);
  const summary = summaryText(entity);
  return {
    entityId: entity.id,
    entityType,
    category: extras.category || categoryForType(entityType),
    title: titleText,
    aliases: aliasesFor(entity),
    oneLine: oneLineFor(entity, summary),
    summary,
    status,
    canonStatus,
    importance: importanceFor(entity, relationshipsByEntity.get(entity.id)?.length || 0),
    locationIds,
    primaryLocation: primaryLocationFor(entity, universe),
    dateRange: dateRangeFor(entity),
    relationshipIds: relationshipsByEntity.get(entity.id) || [],
    documentIds,
    historicalEventIds: eventIds,
    storyPremiseIds: relatedPremises,
    sourceEntityIds: sourceEntityIdsFor(entity),
    collectionIds: collectionIdsFor(entity.id, universe),
    tags: unique([...(entity.tags || []), entityType, extras.category || categoryForType(entityType), status, canonStatus]),
    route: extras.route || `#/atlas/entity/${encodeURIComponent(entity.id)}`,
    sourceRoute: sourceRouteFor(entity),
    sourceUpdatedAt: entity.updatedAt || entity.savedAt || entity.createdAt || deterministicCreatedAt(entity.seed || entity.id),
    seed: entity.seed || "",
    entity,
    searchText: searchTextFor(entity, titleText, summary, extras)
  };
}

function relatedForItem(item, index, relationshipGraph, universe) {
  const relEntityIds = new Set();
  relationshipGraph.allRelationships.forEach(rel => {
    if (rel.sourceEntityId === item.entityId) relEntityIds.add(rel.targetEntityId);
    if (rel.targetEntityId === item.entityId) relEntityIds.add(rel.sourceEntityId);
  });
  item.locationIds.forEach(id => relEntityIds.add(id));
  item.documentIds.forEach(id => relEntityIds.add(id));
  item.historicalEventIds.forEach(id => relEntityIds.add(id));
  item.storyPremiseIds.forEach(id => relEntityIds.add(id));
  return [...relEntityIds].map(id => index.items.find(entry => entry.entityId === id)).filter(Boolean).slice(0, 24);
}

function relationshipSummaries(item, relationshipGraph, index) {
  return relationshipGraph.allRelationships.filter(rel => rel.sourceEntityId === item.entityId || rel.targetEntityId === item.entityId).slice(0, 10).map(rel => {
    const otherId = rel.sourceEntityId === item.entityId ? rel.targetEntityId : rel.sourceEntityId;
    const other = index.items.find(entry => entry.entityId === otherId);
    return `${item.title} is connected to ${other?.title || otherId} through ${rel.label || rel.relationshipType} (${rel.visibility}, ${rel.confidence}).`;
  });
}

function seeAlsoFor(item, index, relationshipGraph, premises) {
  const scored = new Map();
  const bump = (id, amount) => scored.set(id, (scored.get(id) || 0) + amount);
  relationshipGraph.allRelationships.forEach(rel => {
    if (rel.sourceEntityId === item.entityId) bump(rel.targetEntityId, 6);
    if (rel.targetEntityId === item.entityId) bump(rel.sourceEntityId, 6);
  });
  item.locationIds.forEach(id => bump(id, 4));
  item.documentIds.forEach(id => bump(id, 3));
  item.historicalEventIds.forEach(id => bump(id, 3));
  premises.forEach(premise => bump(premise.entityId, 5));
  index.items.filter(entry => entry.category === item.category && entry.entityId !== item.entityId).slice(0, 12).forEach(entry => bump(entry.entityId, 1));
  return [...scored.entries()].map(([id, score]) => ({ ...index.items.find(entry => entry.entityId === id), score })).filter(item => item.entityId).sort((a, b) => b.score - a.score);
}

function keyFactsFor(item, entity) {
  const facts = [
    fact("Entity Type", title(item.entityType)),
    fact("Status", title(item.status)),
    fact("Canon", title(item.canonStatus)),
    fact("Importance", title(item.importance)),
    fact("Primary Location", item.primaryLocation || "not recorded"),
    fact("Relevant Dates", [item.dateRange.start, item.dateRange.end].filter(Boolean).join(" to ") || "not recorded"),
    fact("Relationships", item.relationshipIds.length),
    fact("Documents", item.documentIds.length),
    fact("Historical Events", item.historicalEventIds.length),
    fact("Story Premises", item.storyPremiseIds.length)
  ];
  if (entity.profile?.industry) facts.push(fact("Industry", entity.profile.industry));
  if (entity.classification?.factionType) facts.push(fact("Faction Type", entity.classification.factionType));
  if (entity.classification?.domain) facts.push(fact("Domain", title(entity.classification.domain)));
  if (entity.classification?.serviceDomain) facts.push(fact("Service Domain", title(entity.classification.serviceDomain)));
  if (entity.classification?.strategicImportance) facts.push(fact("Strategic Importance", title(entity.classification.strategicImportance)));
  if (entity.maintenance?.burden) facts.push(fact("Maintenance", title(entity.maintenance.burden)));
  if (entity.failureModes?.length) facts.push(fact("Failure Modes", entity.failureModes.length));
  if (entity.population?.total) facts.push(fact("Population", entity.population.total));
  if (entity.role) facts.push(fact("Role", entity.role));
  return facts;
}

function summaryForItem(item, entity, related) {
  return {
    oneLine: item.oneLine,
    short: item.summary || item.oneLine,
    extended: `${item.title} is indexed as ${articleFor(item.entityType)} ${title(item.entityType)} in the Atlas. It has ${item.relationshipIds.length} direct relationship link(s), ${item.documentIds.length} document reference(s), ${item.historicalEventIds.length} historical event reference(s), and ${related.length} prioritized cross-reference(s).`,
    public: item.canonStatus === "non-canon-concept" ? "This entry is not reader-safe unless non-canon material is enabled." : item.oneLine,
    historical: item.historicalEventIds.length ? `${item.title} appears in ${item.historicalEventIds.length} historical record(s).` : "No historical records are linked yet."
  };
}

function mapRecord(mapType, titleText, parentEntityId, markerIds, routeIds, layers) {
  return {
    id: `atlasMap_${hashString(`${mapType}:${parentEntityId}:${titleText}`).toString(36)}`,
    entityType: "atlasMap",
    mapType,
    title: titleText,
    parentEntityId,
    background: { style: "schematic" },
    layers: layers.map(id => ({ id, label: title(id), enabled: true })),
    markerIds,
    routeIds,
    regionIds: [],
    annotationIds: [],
    createdAt: deterministicCreatedAt(`${mapType}:${parentEntityId}`),
    updatedAt: deterministicCreatedAt(`${mapType}:${parentEntityId}:updated`)
  };
}

function technologyMilestoneEvents(entity) {
  return (entity.historicalDevelopment?.milestones || []).map((milestone, index) => ({
    id: milestone.id || `event_${hashString(`${entity.id}:${milestone.title}:${index}`).toString(36)}`,
    title: milestone.title || `${nameOf(entity)} milestone`,
    displayDate: milestone.year || milestone.date || "Undated",
    sortYear: Number(milestone.year || milestone.date || 999999),
    entityIds: unique([entity.id, ...(entity.sourceEntityIds || [])]),
    summary: milestone.eventType || `${nameOf(entity)} development milestone.`
  }));
}

function atlasMetrics(universe, index, relationshipGraph, continuity, coverage) {
  return {
    totalEntities: index.items.length,
    systems: records(universe.systems).length,
    settlements: records(universe.settlements).length,
    organizations: records(universe.organizations).length,
    characters: records(universe.characters).length,
    factions: records(universe.factions).length,
    conflicts: records(universe.conflicts).length,
    documents: records(universe.documents).length,
    technologies: records(universe.technologies).length,
    infrastructure: records(universe.infrastructureSystems).length,
    historicalEvents: records(universe.historicalEvents).length,
    relationships: relationshipGraph.allRelationships.length,
    storyPremises: records(universe.storyPremises).length,
    unresolvedReferences: continuity.unresolvedReferences.length,
    disputedCanonFacts: index.items.filter(item => item.canonStatus === "disputed").length,
    alternateBranches: records(universe.timelineBranches).length,
    incompleteMajorEntities: coverage.findings.length
  };
}

function addRecords(collection, add, categoryName, routePrefix) {
  records(collection).forEach(entity => add(entity, { category: categoryName, route: `#/atlas/entity/${encodeURIComponent(entity.id)}` }));
}

function records(collection) {
  return (collection || []).map(record => {
    if (record?.id && record?.entityType) return record;
    return record?.entity || record?.system || record?.settlement || record?.organization || record?.character || record?.conflict || record?.document || record?.timeline || record?.historicalEvent || record?.timelineBranch || record?.faction || record?.factionCoalition || record?.relationship || record?.relationshipView || record?.storyPremise || record?.premiseCollection || record?.encyclopediaEntry || record?.atlasCollection || record?.atlasMap || record?.atlasView || record?.technology || record?.infrastructureSystem || record?.technicalStandard || record?.researchProgram || record?.technicalFacility || record;
  }).filter(Boolean);
}

function category(id, label, description) {
  return { id, label, description };
}

function fact(label, value) {
  return { label, value };
}

function nameOf(entity) {
  return entity?.name?.full || entity?.identity?.name || entity?.name || entity?.title || entity?.shortName || entity?.label || entity?.id || "";
}

function summaryText(entity) {
  return entity.summary || entity.profile?.publicDescription || entity.description || entity.logline || entity.shortPremise || entity.content?.abstract || entity.purpose?.statedPurpose || entity.classification?.category || entity.eventType || "";
}

function oneLineFor(entity, summary) {
  const text = summary || `${title(entity.entityType || inferType(entity))} record.`;
  return String(text).split(/[.!?]\s/)[0].slice(0, 220);
}

function aliasesFor(entity) {
  return unique([...(entity.aliases || []), entity.shortName, entity.acronym, entity.identity?.abbreviation, entity.identity?.commonName].filter(Boolean));
}

function statusFor(entity) {
  return slug(entity.status || entity.classification?.operationalStatus || entity.profile?.status || entity.identity?.status || entity.canonStatus || "active");
}

function canonStatusFor(entity) {
  if (entity.canonStatus) return slug(entity.canonStatus);
  if (entity.status === "rejected") return "rejected";
  if (entity.entityType === "storyPremise") return "non-canon-concept";
  return "canon";
}

function importanceFor(entity, relationshipCount) {
  if (entity.importance) return entity.importance;
  if (relationshipCount >= 8) return "central";
  if (relationshipCount >= 4) return "major";
  if (["star-system", "settlement", "conflict", "faction"].includes(entity.entityType)) return "supporting";
  return "background";
}

function locationIdsFor(entity, universe) {
  return unique([
    entity.location?.systemId,
    entity.location?.settlementId,
    entity.systemId,
    entity.settlementId,
    entity.parentEntityId,
    ...(entity.settlementIds || []),
    ...(entity.systemIds || []),
    entity.conflict?.location?.settlementId,
    entity.subject?.locationId
  ]);
}

function primaryLocationFor(entity, universe) {
  return entity.location?.settlementName || entity.location?.systemName || entity.headquarters?.settlement || entity.headquarters?.world || entity.placeOfOrigin || entity.origin?.placeOfOrigin || "";
}

function dateRangeFor(entity) {
  return {
    start: entity.chronology?.startDate || entity.origin?.foundingDate?.displayDate || entity.profile?.foundingYear || entity.foundingYear || entity.timeline?.startYear || entity.createdAt || "",
    end: entity.chronology?.endDate || entity.timeline?.endYear || ""
  };
}

function documentIdsFor(entity, universe) {
  const documents = records(universe.documents);
  return unique([
    ...(entity.documentIds || []),
    ...(entity.sourceDocumentIds || []),
    ...documents.filter(document => document.authorship?.issuingOrganizationId === entity.id || document.authorship?.authorCharacterIds?.includes(entity.id) || document.references?.some(ref => ref.entityId === entity.id)).map(document => document.id)
  ]);
}

function eventIdsFor(entity, universe) {
  return unique([
    ...(entity.historicalEventIds || []),
    ...records(universe.historicalEvents).filter(event => event.sourceEntityIds?.includes(entity.id) || event.participants?.characterIds?.includes(entity.id) || event.participants?.organizationIds?.includes(entity.id)).map(event => event.id)
  ]);
}

function sourceEntityIdsFor(entity) {
  return unique([entity.id, ...(entity.sourceEntityIds || []), ...(entity.characterIds || []), ...(entity.organizationIds || []), ...(entity.factionIds || []), ...(entity.settlementIds || []), ...(entity.conflictIds || []), ...(entity.documentIds || []), ...(entity.historicalEventIds || []), ...(entity.sourceContext?.entityIds || [])]);
}

function collectionIdsFor(entityId, universe) {
  return records(universe.atlasCollections).filter(collection => collection.itemIds?.includes(entityId)).map(collection => collection.id);
}

function sourceRouteFor(entity) {
  const type = entity.entityType || inferType(entity);
  const seed = encodeURIComponent(entity.seed || entity.id);
  if (type === "star-system") return `#/systems/${seed}`;
  if (type === "settlement") return `#/settlements/${seed}`;
  if (type === "organization") return `#/organizations/${seed}`;
  if (type === "character") return `#/characters/${seed}`;
  if (type === "conflict") return `#/conflicts/${seed}`;
  if (type === "document") return `#/documents/${seed}`;
  if (type === "timeline") return `#/timeline/${seed}`;
  if (type === "faction") return `#/factions/${seed}`;
  if (type === "storyPremise") return `#/premises/${seed}`;
  if (type === "technology") return `#/technology/${encodeURIComponent(entity.id || entity.seed)}`;
  if (type === "infrastructureSystem") return `#/infrastructure/${encodeURIComponent(entity.id || entity.seed)}`;
  if (type === "technicalStandard") return `#/standards/${encodeURIComponent(entity.id || entity.seed)}`;
  if (type === "researchProgram") return `#/research/${encodeURIComponent(entity.id || entity.seed)}`;
  if (type === "technicalFacility") return `#/facilities/${encodeURIComponent(entity.id || entity.seed)}`;
  if (type === "relationship") return `#/relationships/${encodeURIComponent(entity.id)}`;
  return "#/atlas";
}

function searchTextFor(entity, titleText, summary, extras) {
  return unique([
    titleText,
    summary,
    extras.category,
    entity.entityType,
    ...(entity.aliases || []),
    ...(entity.tags || []),
    entity.notes,
    entity.role,
    entity.classification?.factionType,
    entity.classification?.category,
    entity.classification?.domain,
    entity.classification?.serviceDomain,
    entity.classification?.infrastructureType,
    entity.classification?.standardType,
    entity.function?.primary,
    entity.scientificBasis?.principles?.join(" "),
    entity.components?.map(item => item.name).join(" "),
    entity.materials?.map(item => item.name).join(" "),
    entity.failureModes?.map(item => item.name).join(" "),
    entity.identity?.motto,
    entity.logline,
    entity.shortPremise
  ].filter(Boolean)).join(" ").toLowerCase();
}

function categoryForType(entityType) {
  if (entityType === "star-system") return "systems";
  if (entityType === "celestial-body") return "celestial-bodies";
  if (entityType === "station") return "stations";
  if (["settlement", "government"].includes(entityType)) return "settlements";
  if (entityType === "district") return "districts";
  if (entityType === "organization") return "organizations";
  if (entityType === "character") return "characters";
  if (["faction", "factionCoalition"].includes(entityType)) return "factions";
  if (entityType === "conflict") return "conflicts";
  if (entityType === "document") return "documents";
  if (entityType === "historicalEvent") return "events";
  if (["timeline", "timelineBranch"].includes(entityType)) return "timelines";
  if (entityType === "relationship") return "relationships";
  if (entityType === "storyPremise") return "premises";
  if (entityType === "atlasCollection") return "collections";
  if (entityType === "atlasMap") return "maps";
  if (entityType === "atlasView") return "views";
  if (entityType === "encyclopediaEntry") return "entries";
  if (entityType === "technology") return "technologies";
  if (entityType === "infrastructureSystem") return "infrastructure";
  if (entityType === "technicalStandard") return "standards";
  if (entityType === "researchProgram") return "research";
  if (entityType === "technicalFacility") return "facilities";
  if (entityType === "technologyVariant") return "technologies";
  return "entries";
}

function templateFor(entityType) {
  const common = ["overview", "key-facts", "history", "relationships", "documents", "premises", "see-also", "notes"];
  const specific = {
    "star-system": ["system-map", "bodies", "settlements", "routes", "strategic-importance"],
    settlement: ["settlement-map", "districts", "government", "infrastructure", "local-factions"],
    organization: ["leadership", "operations", "locations", "documents", "conflicts"],
    character: ["biography", "affiliations", "relationships", "viewpoint-knowledge"],
    faction: ["identity", "ideology", "constituency", "leadership", "conflicts"],
    conflict: ["parties", "causes", "escalation", "consequences"],
    document: ["authorship", "claims", "reliability", "redactions"],
    historicalEvent: ["chronology", "participants", "consequences"],
    storyPremise: ["logline", "source-context", "stakes", "generated-additions"],
    technology: ["function", "scientific-basis", "components", "materials", "maintenance", "failure-modes", "manufacturing", "supply-chain", "standards", "deployment"],
    infrastructureSystem: ["service", "topology", "nodes", "zones", "capacity", "maintenance", "failure-cascade", "access", "politics"],
    technicalStandard: ["scope", "requirements", "interfaces", "compatibility", "certification", "governance"],
    researchProgram: ["objectives", "methods", "milestones", "facilities", "ethics", "outputs"],
    technicalFacility: ["location", "functions", "production-lines", "dependencies", "safety", "logistics"]
  };
  return { entityType, sections: unique([...(specific[entityType] || []), ...common]) };
}

function breadcrumbsFor(item, index) {
  const crumbs = [{ label: "Atlas", route: "#/atlas" }];
  if (item.primaryLocation) crumbs.push({ label: item.primaryLocation, route: "#/atlas/maps" });
  crumbs.push({ label: ATLAS_CATEGORIES.find(cat => cat.id === item.category)?.label || title(item.category), route: `#/atlas/category/${item.category}` });
  crumbs.push({ label: item.title, route: item.route });
  return crumbs;
}

function relatedByIds(index, ids = []) {
  const set = new Set(ids);
  return index.items.filter(item => set.has(item.entityId));
}

function featuredEntityIds(universe) {
  return [
    ...records(universe.settlements).slice(0, 2).map(item => item.id),
    ...records(universe.factions).slice(0, 2).map(item => item.id),
    ...records(universe.conflicts).slice(0, 2).map(item => item.id),
    ...records(universe.characters).slice(0, 2).map(item => item.id)
  ];
}

function countEntities(universe) {
  return ["systems", "settlements", "organizations", "characters", "conflicts", "documents", "historicalEvents", "factions", "relationships", "storyPremises", "encyclopediaEntries", "technologies", "infrastructureSystems", "technicalStandards", "researchPrograms", "technicalFacilities"].reduce((sum, key) => sum + records(universe[key]).length, 0);
}

function passesKnowledgeView(item, options) {
  if (options.view === "reader-safe" || options.view === "public") {
    if (["secret", "classified", "author-only", "hidden"].includes(item.canonStatus)) return false;
    if (item.entityType === "storyPremise" && item.canonStatus === "non-canon-concept") return false;
  }
  if (options.canon && item.canonStatus !== options.canon) return false;
  return true;
}

function scoreSearch(item, query) {
  if (!query) return item.relationshipIds.length;
  if (item.title.toLowerCase() === query) return 100;
  if (item.title.toLowerCase().includes(query)) return 70;
  return query.split(/\s+/).filter(part => item.searchText.includes(part)).length * 10 + item.relationshipIds.length;
}

function articleFor(value) {
  return /^[aeiou]/i.test(String(value)) ? "an" : "a";
}

function title(value) {
  return String(value || "").replace(/([A-Z])/g, " $1").replace(/[-_]+/g, " ").replace(/\b\w/g, char => char.toUpperCase()).trim();
}

function inferType(entity) {
  if (entity.identity?.name) return "organization";
  if (entity.name?.full) return "character";
  return entity.entityType || "entity";
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
