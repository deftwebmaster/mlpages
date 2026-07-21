import { deterministicCreatedAt, hashString, slug } from "../../shared/random.js";
import { RELATIONSHIP_TYPES, relationshipTypeFor } from "./relationshipTypes.js";

const STATUS = ["active", "inactive", "former", "suspended", "disputed", "secret", "rumored", "proposed", "emerging", "broken", "severed", "historical", "unknown", "alternate-history only"];
const VISIBILITY = ["public", "widely known", "privately known", "confidential", "classified", "secret", "known only to participants", "rumored", "hidden from one participant", "known to user only"];
const CONFIDENCE = ["confirmed", "strongly supported", "probable", "possible", "disputed", "rumor", "false", "fabricated", "unknown"];

export { RELATIONSHIP_TYPES };

export function buildRelationshipGraph(universe = {}, options = {}) {
  const entities = collectEntities(universe);
  const relationshipRecords = [
    ...normalizeSharedRelationships(universe.relationships || [], entities),
    ...extractRelationships(universe, entities)
  ];
  const relationships = dedupeRelationships(relationshipRecords);
  const suggestions = relationshipSuggestions(universe, entities, relationships);
  const visibleRelationships = filterRelationships(relationships, options);
  const nodes = makeNodes(entities, visibleRelationships);
  const edges = visibleRelationships.map(rel => relationshipToEdge(rel, entities));
  const warnings = validateRelationshipData({ entities, relationships, suggestions }).warnings;
  const duplicateRelationships = findDuplicates(relationships);
  const hubs = [...nodes].sort((a, b) => b.degree - a.degree).slice(0, 8);
  const isolated = nodes.filter(node => node.degree === 0);

  return {
    id: `relationship_view_${hashString(JSON.stringify(options || {})).toString(36)}`,
    entityType: "relationshipView",
    schemaVersion: 1,
    createdAt: deterministicCreatedAt(`relationships:${JSON.stringify(options || {})}`),
    updatedAt: deterministicCreatedAt(`relationships:${JSON.stringify(options || {})}:updated`),
    filters: options,
    focusEntityId: options.focus || "",
    nodes,
    edges,
    relationships: visibleRelationships,
    allRelationships: relationships,
    suggestions,
    warnings,
    duplicateRelationships,
    isolatedEntities: isolated,
    hubs,
    metrics: {
      totalRelationships: relationships.length,
      activeRelationships: relationships.filter(item => item.status === "active").length,
      historicalRelationships: relationships.filter(item => item.status === "historical" || item.chronology.endDate).length,
      hiddenRelationships: relationships.filter(item => ["secret", "classified", "hidden from one participant", "known only to participants"].includes(item.visibility)).length,
      disputedRelationships: relationships.filter(item => item.status === "disputed" || item.confidence === "disputed").length,
      unsupportedRelationships: relationships.filter(item => !evidenceCount(item)).length,
      unresolvedReferences: warnings.filter(item => item.warningType === "unresolved reference").length,
      duplicateRelationships: duplicateRelationships.length,
      isolatedEntities: isolated.length,
      majorNetworkHubs: hubs.length,
      alternateBranchRelationships: relationships.filter(item => item.canonStatus === "alternate").length
    }
  };
}

export function findRelationshipPath(graph, fromId, toId) {
  if (!fromId || !toId || fromId === toId) return [];
  const adjacency = new Map();
  graph.relationships.forEach(rel => {
    addAdjacency(adjacency, rel.sourceEntityId, rel.targetEntityId, rel);
    const registry = relationshipTypeFor(rel.relationshipType);
    if (registry.directionality !== "directed") addAdjacency(adjacency, rel.targetEntityId, rel.sourceEntityId, rel);
  });
  const queue = [{ id: fromId, path: [] }];
  const seen = new Set([fromId]);
  while (queue.length) {
    const current = queue.shift();
    for (const edge of adjacency.get(current.id) || []) {
      if (seen.has(edge.to)) continue;
      const nextPath = current.path.concat(edge.relationship);
      if (edge.to === toId) return nextPath;
      seen.add(edge.to);
      queue.push({ id: edge.to, path: nextPath });
    }
  }
  return [];
}

export function validateRelationshipData(input = {}) {
  const entities = input.entities instanceof Map ? input.entities : new Map((input.entities || []).map(entity => [entity.id, entity]));
  const relationships = input.relationships || [];
  const warnings = [];
  relationships.forEach(rel => {
    const registry = relationshipTypeFor(rel.relationshipType);
    if (!entities.has(rel.sourceEntityId)) warnings.push(warning("unresolved reference", "error", rel.id, `Source entity ${rel.sourceEntityId} does not exist.`));
    if (!entities.has(rel.targetEntityId)) warnings.push(warning("unresolved reference", "error", rel.id, `Target entity ${rel.targetEntityId} does not exist.`));
    if (rel.sourceEntityId === rel.targetEntityId && rel.relationshipType !== "self-reference") warnings.push(warning("self reference", "likely contradiction", rel.id, "Relationship source and target are the same."));
    if (!STATUS.includes(rel.status)) warnings.push(warning("invalid status", "possible contradiction", rel.id, `${rel.status} is not a known relationship status.`));
    if (!VISIBILITY.includes(rel.visibility)) warnings.push(warning("invalid visibility", "possible contradiction", rel.id, `${rel.visibility} is not a known relationship visibility.`));
    if (!CONFIDENCE.includes(rel.confidence)) warnings.push(warning("invalid confidence", "possible contradiction", rel.id, `${rel.confidence} is not a known relationship confidence.`));
    if (rel.chronology.startDate && rel.chronology.endDate && Number(rel.chronology.startDate) > Number(rel.chronology.endDate)) warnings.push(warning("chronology conflict", "error", rel.id, "Relationship starts after it ends."));
    if (registry.allowedSourceTypes.length && !registry.allowedSourceTypes.includes(entityTypeOf(entities.get(rel.sourceEntityId)))) warnings.push(warning("entity type mismatch", "possible contradiction", rel.id, `${rel.relationshipType} is unusual for ${entityTypeOf(entities.get(rel.sourceEntityId))}.`));
    if (registry.allowedTargetTypes.length && !registry.allowedTargetTypes.includes(entityTypeOf(entities.get(rel.targetEntityId)))) warnings.push(warning("entity type mismatch", "possible contradiction", rel.id, `${rel.relationshipType} target is unusual for ${entityTypeOf(entities.get(rel.targetEntityId))}.`));
    if (rel.visibility === "public" && rel.status === "secret") warnings.push(warning("visibility conflict", "likely contradiction", rel.id, "Relationship is both public and secret."));
    if (rel.canonStatus === "alternate" && !rel.branchId) warnings.push(warning("branch membership", "missing information", rel.id, "Alternate relationship lacks a branch ID."));
    rel.phases?.forEach(phase => {
      if (phase.startDate && phase.endDate && Number(phase.startDate) > Number(phase.endDate)) warnings.push(warning("phase chronology conflict", "error", rel.id, `${phase.label || phase.id} starts after it ends.`));
    });
  });
  findDuplicates(relationships).forEach(group => warnings.push(warning("duplicate relationship", "possible contradiction", group[0].id, `Possible duplicate relationships: ${group.map(item => item.id).join(", ")}.`)));
  return { valid: !warnings.some(item => item.severity === "error"), warnings };
}

export function relationshipMarkdown(graph) {
  return [
    "# Relationship Explorer",
    "",
    `Relationships: ${graph.metrics.totalRelationships}`,
    `Hubs: ${graph.hubs.map(node => node.label).join(", ") || "none"}`,
    `Warnings: ${graph.warnings.length}`,
    "",
    "## Relationships",
    ...graph.relationships.map(rel => `- ${labelFor(graph, rel.sourceEntityId)} -> ${labelFor(graph, rel.targetEntityId)}: ${rel.label} (${rel.relationshipType}; ${rel.visibility}; ${rel.confidence})`),
    "",
    "## Suggestions",
    ...graph.suggestions.slice(0, 20).map(item => `- ${item.title}: ${item.summary}`)
  ].join("\n");
}

function collectEntities(universe) {
  const entities = new Map();
  const add = entity => {
    if (!entity?.id) return;
    entities.set(entity.id, {
      id: entity.id,
      entityType: entity.entityType || inferType(entity),
      seed: entity.seed || "",
      label: entityLabel(entity),
      entity
    });
  };
  ["systems", "settlements", "organizations", "characters", "conflicts", "documents", "timelines", "historicalEvents", "factions", "technologies", "infrastructureSystems", "technicalStandards", "researchPrograms", "technicalFacilities"].forEach(collection => records(universe[collection]).forEach(add));
  records(universe.systems).forEach(system => {
    system.orbitalBodies?.forEach(body => add({ ...body, id: body.id, entityType: "celestial-body", name: body.name, seed: `${system.seed}:${body.id}` }));
    system.stations?.forEach(station => add({ ...station, id: station.id, entityType: "station", name: station.name, seed: `${system.seed}:${station.id}` }));
  });
  records(universe.settlements).forEach(settlement => settlement.districts?.forEach(district => add({ ...district, id: district.id, entityType: "district", name: district.name, seed: `${settlement.seed}:${district.id}` })));
  return entities;
}

function normalizeSharedRelationships(items, entities) {
  return (items || []).map(item => normalizeRelationship({
    id: item.id,
    sourceEntityId: item.sourceEntityId || item.fromEntityId,
    targetEntityId: item.targetEntityId || item.toEntityId,
    sourceEntityType: item.sourceEntityType || item.fromEntityType,
    targetEntityType: item.targetEntityType || item.toEntityType,
    relationshipType: item.relationshipType || item.type || "related-to",
    label: item.label || item.relationship || item.relationshipType || "Related",
    summary: item.summary || item.description || item.label || "",
    status: item.status || "active",
    visibility: item.visibility || item.metadata?.visibility || "public",
    confidence: item.confidence || "confirmed",
    strength: item.strength,
    evidence: item.evidence || { sourceEntityIds: [item.fromEntityId, item.toEntityId].filter(Boolean) },
    source: item.source || { type: "shared-universe-relationship", rawId: item.id },
    metadata: item.metadata || {}
  }, entities)).filter(Boolean);
}

function extractRelationships(universe, entities) {
  const rels = [];
  records(universe.systems).forEach(system => {
    system.orbitalBodies?.forEach(body => rels.push(rel(body.id, system.id, "located-in", `${body.name} in ${system.name}`, "System contains body", { sourceEntityIds: [system.id] })));
    system.settlements?.forEach(settlement => rels.push(rel(settlement.promotedEntityId || settlement.id, system.id, "located-in", `${settlement.name} located in ${system.name}`, "Settlement summary belongs to system", { sourceEntityIds: [system.id] })));
    system.importantOrganizations?.forEach(org => rels.push(rel(org.promotedEntityId || org.id, system.id, "operates-in", `${org.name} operates in ${system.name}`, org.role || "System organization", { sourceEntityIds: [system.id] })));
    system.routes?.forEach(route => {
      const origin = entityByName(entities, route.origin);
      const destination = entityByName(entities, route.destination);
      if (origin && destination) rels.push(rel(origin.id, destination.id, "connected-by-route", route.name, route.type, { sourceEntityIds: [system.id] }));
    });
  });
  records(universe.settlements).forEach(settlement => {
    if (settlement.location?.systemId) rels.push(rel(settlement.id, settlement.location.systemId, "located-in", `${settlement.name} located in ${settlement.location.systemName}`, "Saved settlement location", { sourceEntityIds: [settlement.id] }));
    settlement.districts?.forEach(district => rels.push(rel(district.id, settlement.id, "located-in", `${district.name} district of ${settlement.name}`, district.districtType || "District", { sourceEntityIds: [settlement.id] })));
    settlement.organizations?.forEach(org => rels.push(rel(org.promotedEntityId || org.id, settlement.id, "operates-in", `${org.name} operates in ${settlement.name}`, org.role || "Local organization", { sourceEntityIds: [settlement.id] })));
    if (settlement.government?.type) rels.push(rel(`government_${slug(settlement.name)}`, settlement.id, "governs", `${settlement.government.type} governs ${settlement.name}`, "Government relationship", { sourceEntityIds: [settlement.id] }, { allowPlaceholder: true, sourceEntityType: "government" }));
  });
  records(universe.organizations).forEach(org => {
    org.leadership?.forEach(person => rels.push(rel(person.promotedEntityId || person.id, org.id, "leads", `${person.name} leads ${org.identity?.name || org.name}`, person.role || "Leadership", { sourceEntityIds: [org.id] })));
    org.locations?.forEach(location => {
      const settlement = entityByName(entities, location.world) || entityByName(entities, location.name);
      if (settlement) rels.push(rel(org.id, settlement.id, "operates-in", `${org.identity?.name || org.name} operates at ${location.name}`, location.type || "Location", { sourceEntityIds: [org.id] }));
    });
  });
  records(universe.characters).forEach(character => {
    character.entityRelationships?.forEach(item => rels.push(rel(character.id, item.toEntityId, item.relationshipType || "related-to", item.label || `${entityLabel(character)} linked to ${item.toEntityId}`, item.relationshipType || "", { sourceEntityIds: [character.id] })));
    character.relationships?.forEach(item => rels.push(rel(item.id || `${character.id}:${item.relatedName}`, character.id, item.relationshipType || "personal-tie", item.relatedName || item.relationshipType, item.obligation || item.secret || "", { sourceEntityIds: [character.id] }, { sourceEntityType: "relationship-proxy" })));
  });
  records(universe.conflicts).forEach(conflict => {
    conflict.parties?.forEach(party => rels.push(rel(party.id, conflict.id, "participant-in", `${party.name} participates in ${conflict.name}`, party.role || party.publicGoal, { conflictIds: [conflict.id], sourceEntityIds: [conflict.id] })));
    conflict.affectedEntities?.forEach(item => rels.push(rel(item.id, conflict.id, "affected-by", `${item.name} affected by ${conflict.name}`, item.effect || "", { conflictIds: [conflict.id], sourceEntityIds: [conflict.id] })));
  });
  records(universe.documents).forEach(document => {
    document.authorship?.authorCharacterIds?.forEach(id => rels.push(rel(id, document.id, "authored", `${id} authored ${document.title}`, document.authorship.authorName, { documentIds: [document.id], sourceEntityIds: [document.id] })));
    if (document.authorship?.issuingOrganizationId) rels.push(rel(document.authorship.issuingOrganizationId, document.id, "authored", `${document.authorship.issuingOrganizationName} issued ${document.title}`, "Issuing organization", { documentIds: [document.id], sourceEntityIds: [document.id] }));
    document.recipients?.characterIds?.forEach(id => rels.push(rel(id, document.id, "received", `${id} received ${document.title}`, "Document recipient", { documentIds: [document.id], sourceEntityIds: [document.id] })));
    document.recipients?.organizationIds?.forEach(id => rels.push(rel(id, document.id, "received", `${id} received ${document.title}`, "Document recipient", { documentIds: [document.id], sourceEntityIds: [document.id] })));
    document.references?.forEach(ref => rels.push(rel(ref.entityId || ref.id, document.id, "mentioned-in", `${ref.name || ref.entityId} mentioned in ${document.title}`, ref.entityType || "Reference", { documentIds: [document.id], sourceEntityIds: [document.id] })));
  });
  records(universe.historicalEvents).forEach(event => {
    event.participants?.characterIds?.forEach(id => rels.push(rel(id, event.id, "participant-in", `${id} participates in ${event.title}`, "Historical participant", { eventIds: [event.id], sourceEntityIds: [event.id] })));
    event.participants?.organizationIds?.forEach(id => rels.push(rel(id, event.id, "participant-in", `${id} participates in ${event.title}`, "Historical participant", { eventIds: [event.id], sourceEntityIds: [event.id] })));
    event.sourceEntityIds?.forEach(id => rels.push(rel(id, event.id, "transformed-by", `${id} shaped by ${event.title}`, event.eventType, { eventIds: [event.id], sourceEntityIds: [event.id] })));
  });
  records(universe.factions).forEach(faction => {
    faction.relationships?.forEach(item => rels.push(rel(item.fromEntityId || faction.id, item.toEntityId, item.relationshipType || "related-to", item.label || `${faction.name} linked relationship`, item.metadata?.privateRelationship || "", { sourceEntityIds: [faction.id] })));
    faction.characterIds?.forEach(id => rels.push(rel(id, faction.id, "member-of", `${id} member or supporter of ${faction.name}`, "Faction role", { sourceEntityIds: [faction.id] })));
    faction.organizationIds?.forEach(id => rels.push(rel(faction.id, id, "influences", `${faction.name} influences ${id}`, "Faction organization relation", { sourceEntityIds: [faction.id] })));
    faction.conflictIds?.forEach(id => rels.push(rel(faction.id, id, "participant-in", `${faction.name} involved in conflict`, "Faction conflict role", { conflictIds: [id], sourceEntityIds: [faction.id] })));
  });
  records(universe.technologies).forEach(technology => {
    technology.manufacturerOrganizationIds?.forEach(id => rels.push(rel(id, technology.id, "manufactures", `${id} manufactures ${technology.name}`, "Technology manufacturer", { sourceEntityIds: [technology.id] })));
    technology.operatorOrganizationIds?.forEach(id => rels.push(rel(id, technology.id, "operates", `${id} operates ${technology.name}`, "Technology operator", { sourceEntityIds: [technology.id] })));
    technology.regulatorOrganizationIds?.forEach(id => rels.push(rel(id, technology.id, "regulates", `${id} regulates ${technology.name}`, "Technology regulator", { sourceEntityIds: [technology.id] })));
    technology.settlementIds?.forEach(id => rels.push(rel(technology.id, id, "deployed-in", `${technology.name} deployed in ${id}`, "Technology deployment", { sourceEntityIds: [technology.id] })));
    technology.conflictIds?.forEach(id => rels.push(rel(technology.id, id, "involved-in", `${technology.name} involved in conflict`, "Technology conflict link", { conflictIds: [id], sourceEntityIds: [technology.id] })));
    technology.standardIds?.forEach(id => rels.push(rel(technology.id, id, "requires-standard", `${technology.name} requires ${id}`, "Standards compatibility", { sourceEntityIds: [technology.id] })));
  });
  records(universe.infrastructureSystems).forEach(infra => {
    infra.operatorOrganizationIds?.forEach(id => rels.push(rel(id, infra.id, "operates", `${id} operates ${infra.name}`, "Infrastructure operator", { sourceEntityIds: [infra.id] })));
    infra.settlementIds?.forEach(id => rels.push(rel(infra.id, id, "serves", `${infra.name} serves ${id}`, "Infrastructure service area", { sourceEntityIds: [infra.id] })));
    infra.technologyIds?.forEach(id => rels.push(rel(infra.id, id, "depends-on", `${infra.name} depends on ${id}`, "Infrastructure technology dependency", { sourceEntityIds: [infra.id] })));
  });
  return rels.map(item => normalizeRelationship(item, entities)).filter(Boolean);
}

function relationshipSuggestions(universe, entities, existing) {
  const keys = new Set(existing.map(keyForRelationship));
  const suggestions = [];
  const suggest = raw => {
    const normalized = normalizeRelationship(raw, entities);
    if (!normalized || keys.has(keyForRelationship(normalized))) return;
    suggestions.push({
      id: `suggestion_${hashString(normalized.id).toString(36)}`,
      title: normalized.label,
      summary: normalized.summary || "Relationship implied by existing entity data.",
      relationship: normalized,
      action: "Create Relationship"
    });
  };
  records(universe.organizations).forEach(org => org.leadership?.forEach(person => suggest(rel(person.promotedEntityId || person.id, org.id, "leads", `${person.name} leads ${org.identity?.name}`, person.role, { sourceEntityIds: [org.id] }))));
  records(universe.conflicts).forEach(conflict => conflict.parties?.forEach(party => suggest(rel(party.id, conflict.id, "participant-in", `${party.name} participates in ${conflict.name}`, party.publicGoal, { conflictIds: [conflict.id] }))));
  records(universe.documents).forEach(document => document.references?.forEach(ref => suggest(rel(ref.entityId || ref.id, document.id, "mentioned-in", `${ref.name || ref.entityId} mentioned in ${document.title}`, "Document reference", { documentIds: [document.id] }))));
  return suggestions.slice(0, 36);
}

function normalizeRelationship(input, entities) {
  if (!input?.sourceEntityId || !input?.targetEntityId) return null;
  const registry = relationshipTypeFor(input.relationshipType);
  const seed = input.seed || `${input.sourceEntityId}:${input.relationshipType}:${input.targetEntityId}:${input.label || ""}`;
  const sourceType = input.sourceEntityType || entityTypeOf(entities.get(input.sourceEntityId)) || "unknown";
  const targetType = input.targetEntityType || entityTypeOf(entities.get(input.targetEntityId)) || "unknown";
  return {
    id: input.id || `relationship_${hashString(seed).toString(36)}`,
    entityType: "relationship",
    schemaVersion: 1,
    seed,
    sourceEntityId: input.sourceEntityId,
    targetEntityId: input.targetEntityId,
    sourceEntityType: sourceType,
    targetEntityType: targetType,
    relationshipType: registry.id,
    relationshipFamily: registry.family,
    directionality: registry.directionality,
    inverseType: registry.inverseType || "",
    label: input.label || registry.label,
    summary: input.summary || input.label || registry.label,
    status: normalizeStatus(input.status),
    visibility: normalizeVisibility(input.visibility),
    canonStatus: input.canonStatus || "canon",
    branchId: input.branchId || "",
    confidence: normalizeConfidence(input.confidence),
    chronology: normalizeChronology(input.chronology || input),
    strength: normalizeStrength(input.strength, registry.family, input.summary || input.label),
    sentiment: input.sentiment || { sourceTowardTarget: "unknown", targetTowardSource: "unknown" },
    reciprocity: {
      isReciprocal: registry.directionality === "reciprocal" || registry.directionality === "undirected",
      reciprocalRelationshipId: input.reciprocalRelationshipId || null
    },
    evidence: normalizeEvidence(input.evidence || {}, input),
    properties: input.properties || input.metadata || {},
    phases: input.phases || [],
    contradictions: input.contradictions || [],
    tags: input.tags || [registry.family, registry.id, normalizeVisibility(input.visibility)],
    notes: input.notes || "",
    source: input.source || { type: "relationship-extraction" },
    createdAt: input.createdAt || deterministicCreatedAt(seed),
    updatedAt: input.updatedAt || deterministicCreatedAt(`${seed}:updated`)
  };
}

function rel(sourceEntityId, targetEntityId, relationshipType, label, summary, evidence = {}, options = {}) {
  return {
    sourceEntityId,
    targetEntityId,
    relationshipType,
    label,
    summary,
    evidence,
    sourceEntityType: options.sourceEntityType,
    targetEntityType: options.targetEntityType,
    status: options.status || "active",
    visibility: options.visibility || "public",
    confidence: options.confidence || (evidence.documentIds?.length || evidence.eventIds?.length || evidence.conflictIds?.length || evidence.sourceEntityIds?.length ? "strongly supported" : "possible"),
    source: { type: "extracted-relationship", allowPlaceholder: Boolean(options.allowPlaceholder) }
  };
}

function filterRelationships(relationships, options = {}) {
  return relationships.filter(rel => {
    if (options.focus && rel.sourceEntityId !== options.focus && rel.targetEntityId !== options.focus) return false;
    if (options.family && rel.relationshipFamily !== options.family) return false;
    if (options.visibility === "public" && !["public", "widely known"].includes(rel.visibility)) return false;
    if (options.view === "secret" && !["secret", "classified", "confidential", "hidden from one participant", "known only to participants"].includes(rel.visibility)) return false;
    if (options.branch && rel.branchId && rel.branchId !== options.branch) return false;
    if (options.date && !activeAt(rel, options.date)) return false;
    return true;
  });
}

function makeNodes(entities, relationships) {
  const degree = new Map();
  relationships.forEach(rel => {
    degree.set(rel.sourceEntityId, (degree.get(rel.sourceEntityId) || 0) + 1);
    degree.set(rel.targetEntityId, (degree.get(rel.targetEntityId) || 0) + 1);
  });
  return [...entities.values()].map(item => ({
    id: item.id,
    entityType: item.entityType,
    label: item.label,
    seed: item.seed,
    degree: degree.get(item.id) || 0,
    hubScore: degree.get(item.id) || 0
  }));
}

function relationshipToEdge(rel, entities) {
  return {
    id: rel.id,
    source: rel.sourceEntityId,
    target: rel.targetEntityId,
    sourceLabel: labelFor({ nodes: [...entities.values()] }, rel.sourceEntityId),
    targetLabel: labelFor({ nodes: [...entities.values()] }, rel.targetEntityId),
    label: rel.label,
    family: rel.relationshipFamily,
    type: rel.relationshipType,
    visibility: rel.visibility,
    confidence: rel.confidence,
    strength: rel.strength.value
  };
}

function findDuplicates(relationships) {
  const groups = new Map();
  relationships.forEach(rel => {
    const key = keyForRelationship(rel);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(rel);
  });
  return [...groups.values()].filter(group => group.length > 1);
}

function keyForRelationship(rel) {
  const registry = relationshipTypeFor(rel.relationshipType);
  const inverse = registry.inverseType;
  const type = [rel.relationshipType, inverse].filter(Boolean).sort().join("/");
  const pair = registry.directionality === "reciprocal" || registry.directionality === "undirected"
    ? [rel.sourceEntityId, rel.targetEntityId].sort().join("~")
    : `${rel.sourceEntityId}->${rel.targetEntityId}`;
  return `${pair}:${type}:${rel.chronology.startDate || ""}:${rel.chronology.endDate || ""}`;
}

function dedupeRelationships(relationships) {
  const byKey = new Map();
  relationships.forEach(rel => {
    const key = keyForRelationship(rel);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, rel);
      return;
    }
    existing.evidence.documentIds = unique(existing.evidence.documentIds.concat(rel.evidence.documentIds));
    existing.evidence.eventIds = unique(existing.evidence.eventIds.concat(rel.evidence.eventIds));
    existing.evidence.conflictIds = unique(existing.evidence.conflictIds.concat(rel.evidence.conflictIds));
    existing.evidence.sourceEntityIds = unique(existing.evidence.sourceEntityIds.concat(rel.evidence.sourceEntityIds));
    existing.aliasIds = unique([...(existing.aliasIds || []), rel.id]);
  });
  return [...byKey.values()];
}

function normalizeChronology(input = {}) {
  const startDate = input.startDate || input.start || "";
  const endDate = input.endDate || input.end || null;
  return {
    calendarId: input.calendarId || "calendar_shared_interstellar",
    startDate,
    endDate,
    precision: input.precision || (String(startDate).match(/^\d{4}$/) ? "year" : startDate ? "unknown" : "unknown"),
    approximate: Boolean(input.approximate)
  };
}

function normalizeStrength(value, family, basisText = "") {
  if (typeof value === "object" && value) return { value: Number(value.value || 45), label: value.label || strengthLabel(value.value || 45), basis: value.basis || `${family}-tie` };
  const numeric = typeof value === "number" ? value : Math.max(18, Math.min(88, 35 + Math.abs(hashString(`${family}:${basisText}`)) % 50));
  return { value: numeric, label: strengthLabel(numeric), basis: `${family}-relationship` };
}

function normalizeEvidence(evidence, input) {
  return {
    documentIds: evidence.documentIds || [],
    eventIds: evidence.eventIds || [],
    conflictIds: evidence.conflictIds || [],
    sourceEntityIds: evidence.sourceEntityIds || [input.sourceEntityId, input.targetEntityId].filter(Boolean),
    items: evidence.items || [],
    notes: evidence.notes || ""
  };
}

function normalizeStatus(value) {
  const normalized = String(value || "active").toLowerCase();
  return STATUS.includes(normalized) ? normalized : "active";
}

function normalizeVisibility(value) {
  const normalized = String(value || "public").toLowerCase();
  if (normalized === "hidden") return "secret";
  if (normalized === "restricted") return "confidential";
  return VISIBILITY.includes(normalized) ? normalized : "public";
}

function normalizeConfidence(value) {
  const normalized = String(value || "confirmed").toLowerCase();
  if (normalized === "supported") return "strongly supported";
  return CONFIDENCE.includes(normalized) ? normalized : "confirmed";
}

function activeAt(rel, date) {
  const year = Number(String(date).match(/\d{4}/)?.[0]);
  if (!year) return true;
  const start = Number(String(rel.chronology.startDate || "0").match(/\d{4}/)?.[0] || 0);
  const end = Number(String(rel.chronology.endDate || "9999").match(/\d{4}/)?.[0] || 9999);
  return year >= start && year <= end;
}

function addAdjacency(adjacency, from, to, relationship) {
  if (!adjacency.has(from)) adjacency.set(from, []);
  adjacency.get(from).push({ to, relationship });
}

function entityByName(entities, name) {
  if (!name) return null;
  return [...entities.values()].find(item => item.label === name || item.id === name);
}

function records(collection) {
  return (collection || []).map(record => {
    if (record?.id && record?.entityType) return record;
    return record?.entity || record?.system || record?.settlement || record?.organization || record?.character || record?.conflict || record?.document || record?.timeline || record?.historicalEvent || record?.faction || record?.technology || record?.infrastructureSystem || record?.technicalStandard || record?.researchProgram || record?.technicalFacility || record;
  }).filter(Boolean);
}

function entityTypeOf(item) {
  return item?.entityType || item?.entity?.entityType || "unknown";
}

function entityLabel(entity) {
  return entity.name?.full || entity.identity?.name || entity.name || entity.title || entity.shortLabel || entity.id || "";
}

function inferType(entity) {
  if (entity.identity?.name) return "organization";
  if (entity.name?.full) return "character";
  return "entity";
}

function labelFor(graph, id) {
  return graph.nodes?.find(node => node.id === id)?.label || id;
}

function strengthLabel(value) {
  if (value >= 86) return "total dependency";
  if (value >= 70) return "strong";
  if (value >= 48) return "moderate";
  if (value >= 25) return "weak";
  return "minimal";
}

function evidenceCount(rel) {
  return (rel.evidence.documentIds?.length || 0) + (rel.evidence.eventIds?.length || 0) + (rel.evidence.conflictIds?.length || 0) + (rel.evidence.sourceEntityIds?.length || 0) + (rel.evidence.items?.length || 0);
}

function warning(warningType, severity, relationshipId, message) {
  return {
    id: `relationship_warning_${hashString(`${relationshipId}:${warningType}:${message}`).toString(36)}`,
    warningType,
    severity,
    relationshipId,
    message,
    resolutionOptions: ["Review source", "Merge", "Split into phases", "Mark disputed", "Ignore warning"]
  };
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}
