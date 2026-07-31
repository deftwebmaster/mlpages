import { createSeededRandom, deterministicCreatedAt, deriveSeed, hashString, slug } from "../../shared/random.js";

const CURRENT_YEAR = 2326;
const COLORS = ["#76d5d7", "#d8b45c", "#d88972", "#9ecf8f", "#a6b7ff", "#c99e63"];
const CERTAINTY = ["precisely documented", "well documented", "partially documented", "reconstructed", "disputed", "fragmentary"];

export function generateTimeline(seed = "timeline", constraints = {}) {
  const root = createSeededRandom(seed || "timeline");
  const universe = constraints.universe || {};
  const scope = normalizeScope(constraints);
  const knownEvents = extractTimelineEvents(universe, { scope });
  const sourceEvents = knownEvents.length ? knownEvents : makeStandaloneEvents(root, seed, scope);
  const gaps = detectGaps(sourceEvents, root);
  const contradictions = detectContradictions(sourceEvents, universe);
  const connectiveEvents = makeConnectiveEvents(root, seed, sourceEvents, gaps, scope);
  const eventIds = sourceEvents.map(event => event.id);
  const eras = makeEras(root, seed, sourceEvents);
  const branches = makeBranches(root, seed, sourceEvents, scope);
  const health = chronologyHealth(sourceEvents, gaps, contradictions, branches);
  const id = `timeline_${hashString(seed).toString(36)}`;
  const name = constraints.name || timelineName(scope, sourceEvents, root);

  return {
    id,
    entityType: "timeline",
    schemaVersion: 1,
    seed,
    name,
    description: timelineDescription(scope, sourceEvents, gaps),
    timelineType: scope.timelineType,
    createdAt: deterministicCreatedAt(seed),
    updatedAt: deterministicCreatedAt(`${seed}:updated`),
    scope,
    chronology: {
      calendarId: "calendar_shared_interstellar",
      startDate: health.earliestYear ? String(health.earliestYear) : "",
      endDate: health.latestYear ? String(health.latestYear) : "",
      displayMode: "absolute"
    },
    eventIds,
    eraIds: eras.map(era => era.id),
    branchId: constraints.branchId || null,
    sourceEvents,
    connectiveEvents,
    events: sortEvents([...sourceEvents, ...connectiveEvents]),
    eras,
    gaps,
    contradictions,
    orphanedEvents: sourceEvents.filter(event => !event.relatedEventIds.length && event.historicalAssessment.laterImportance >= 70),
    undatedEvents: sourceEvents.filter(event => event.chronology.precision === "unknown"),
    branches,
    causalLinks: makeCausalLinks(sourceEvents),
    filters: constraints.filters || {},
    displaySettings: {
      showGeneratedSuggestions: true,
      truthView: "canon",
      density: "dossier"
    },
    sourceSettings: {
      extractionMode: "existing-world-first",
      connectiveEvents: "suggested-not-canon",
      preservesOriginalDates: true
    },
    health,
    presentation: {
      accentColor: root.pick(COLORS),
      mapStyle: "chronology-ribbon"
    },
    favorite: false,
    tags: ["timeline", scope.timelineType, sourceEvents.length ? "world-linked" : "standalone"],
    notes: ""
  };
}

export function extractTimelineEvents(universe = {}, options = {}) {
  const scope = normalizeScope(options);
  const events = [];
  const push = event => {
    if (!event || !matchesScope(event, scope)) return;
    events.push(event);
  };

  records(universe.systems).forEach(system => extractSystemEvents(system).forEach(push));
  records(universe.settlements).forEach(settlement => extractSettlementEvents(settlement).forEach(push));
  records(universe.organizations).forEach(org => extractOrganizationEvents(org).forEach(push));
  records(universe.characters).forEach(character => extractCharacterEvents(character).forEach(push));
  records(universe.conflicts).forEach(conflict => extractConflictEvents(conflict).forEach(push));
  records(universe.documents).forEach(document => extractDocumentEvents(document).forEach(push));
  records(universe.historicalEvents || universe.events).forEach(event => push(normalizeStoredEvent(event)));

  return sortEvents(dedupeEvents(events)).map((event, index) => ({
    ...event,
    chronology: { ...event.chronology, sequenceIndex: index + 1 }
  }));
}

export function validateTimeline(timeline) {
  const errors = [];
  const warnings = [];
  if (!timeline?.id || timeline.entityType !== "timeline") errors.push("Timeline identity is missing.");
  if (!Array.isArray(timeline?.events)) errors.push("Timeline events are missing.");
  if (!timeline?.sourceSettings?.preservesOriginalDates) warnings.push("Original date preservation is not declared.");
  if (timeline?.events?.some(event => event.source?.type === "generated-connective-history" && event.status !== "suggested")) {
    warnings.push("Generated connective events should remain visibly suggested until saved.");
  }
  if (timeline?.contradictions?.length) warnings.push(`${timeline.contradictions.length} chronology warning(s) need review.`);
  return { valid: !errors.length, errors, warnings };
}

export function timelineMarkdown(timeline) {
  return [
    `# ${timeline.name}`,
    "",
    timeline.description,
    "",
    `Seed: ${timeline.seed}`,
    `Type: ${timeline.timelineType}`,
    `Scope: ${timeline.scope.label || "Universe"}`,
    "",
    "## Chronology Health",
    `- Known events: ${timeline.health.totalEvents}`,
    `- Earliest: ${timeline.health.earliestYear || "unknown"}`,
    `- Latest: ${timeline.health.latestYear || "unknown"}`,
    `- Gaps: ${timeline.health.gaps}`,
    `- Warnings: ${timeline.health.contradictions}`,
    "",
    "## Events",
    ...timeline.events.map(event => `- ${event.chronology.displayDate}: ${event.title} (${event.historicalAssessment.certainty}). ${event.summary}`),
    "",
    "## Eras",
    ...timeline.eras.map(era => `- ${era.name}: ${era.startDate} to ${era.endDate}. ${era.interpretation}`),
    "",
    "## Alternate Branches",
    ...timeline.branches.map(branch => `- ${branch.name}: diverges at ${branch.divergenceEventId}. ${branch.summary}`)
  ].join("\n");
}

function extractSystemEvents(system) {
  const events = [];
  system.history?.forEach((item, index) => {
    events.push(makeEvent({
      seed: deriveSeed(system.seed, `system-history-${index}-${item.title}`),
      title: item.title,
      summary: item.description || item.event || `${system.name} records ${item.title}.`,
      date: item.year || item.date,
      eventType: classifyEvent(item.title || item.description, "system-history"),
      eventCategory: "political",
      scale: "system",
      sourceEntity: system,
      sourceObject: item,
      sourceType: "embedded-system-history",
      location: { systemIds: [system.id], locationEntityIds: [system.id] },
      participants: { settlementIds: [], organizationIds: ids(system.importantOrganizations), characterIds: [] },
      consequences: [item.lastingConsequence || "This event shaped later system politics."],
      status: item.status
    }));
  });
  system.settlements?.forEach((settlement, index) => {
    events.push(makeEvent({
      seed: settlement.seed || deriveSeed(system.seed, `settlement-summary-${index}-${settlement.name}`),
      title: `Founding of ${settlement.name}`,
      summary: `${settlement.name} emerges as ${settlement.type || "a settlement"} in ${system.name}.`,
      date: settlement.foundedYear,
      eventType: "settlement-founding",
      eventCategory: "founding",
      scale: "settlement",
      sourceEntity: system,
      sourceObject: settlement,
      sourceType: "embedded-system-settlement",
      location: { systemIds: [system.id], settlementIds: [settlement.promotedEntityId || settlement.id].filter(Boolean), locationEntityIds: [settlement.promotedEntityId || settlement.id].filter(Boolean) },
      participants: { settlementIds: [settlement.promotedEntityId || settlement.id].filter(Boolean), organizationIds: [], characterIds: [] },
      consequences: [settlement.currentProblem || "The settlement becomes a durable historical actor."]
    }));
  });
  system.stations?.forEach((station, index) => {
    events.push(makeEvent({
      seed: deriveSeed(system.seed, `station-${index}-${station.name}`),
      title: `${station.name} comes online`,
      summary: `${station.name} begins serving ${station.function || station.type || "system traffic"}; records note ${station.knownIssue || "routine launch risks"}.`,
      date: station.constructionYear,
      eventType: "infrastructure-opening",
      eventCategory: "infrastructure",
      scale: "system",
      sourceEntity: system,
      sourceObject: station,
      sourceType: "embedded-system-station",
      location: { systemIds: [system.id], locationEntityIds: [station.id].filter(Boolean) },
      participants: { settlementIds: [], organizationIds: [], characterIds: [] },
      consequences: [station.knownIssue || "System logistics become more interdependent."]
    }));
  });
  return events;
}

function extractSettlementEvents(settlement) {
  const events = [];
  if (settlement.founding?.year) {
    events.push(makeEvent({
      seed: deriveSeed(settlement.seed, "founding-event"),
      title: `Founding of ${settlement.name}`,
      summary: settlement.founding.foundingEvent,
      date: settlement.founding.year,
      eventType: "settlement-founding",
      eventCategory: "founding",
      scale: "settlement",
      sourceEntity: settlement,
      sourceObject: settlement.founding,
      sourceType: "settlement-founding",
      location: settlementLocation(settlement),
      participants: { settlementIds: [settlement.id], organizationIds: [], characterIds: [] },
      consequences: [`${settlement.name} gains a founding purpose: ${settlement.founding.originalPurpose}.`]
    }));
  }
  settlement.history?.forEach((item, index) => {
    events.push(makeEvent({
      seed: deriveSeed(settlement.seed, `settlement-history-${index}-${item.title}`),
      title: item.title,
      summary: item.description || `${settlement.name} records ${item.title}.`,
      date: item.year || item.date,
      eventType: classifyEvent(item.title || item.description, "settlement-history"),
      eventCategory: classifyCategory(item.title || item.description, "political"),
      scale: "settlement",
      sourceEntity: settlement,
      sourceObject: item,
      sourceType: "embedded-settlement-history",
      location: settlementLocation(settlement, item.affectedDistricts),
      participants: { settlementIds: [settlement.id], organizationIds: ids(item.involvedOrganizations || settlement.organizations), characterIds: [] },
      consequences: [item.lastingConsequence || "Local institutions adapt around the event."],
      status: item.status
    }));
  });
  settlement.government?.notableLaws?.forEach((law, index) => {
    events.push(makeEvent({
      seed: law.seed || deriveSeed(settlement.seed, `law-${index}-${law.name}`),
      title: law.name,
      summary: `${law.effect || "A local law changes civic life."} Public reaction: ${law.publicReaction || "mixed"}.`,
      date: law.year || law.date,
      eventType: "law-enacted",
      eventCategory: "political",
      scale: "settlement",
      sourceEntity: settlement,
      sourceObject: law,
      sourceType: "embedded-settlement-law",
      location: settlementLocation(settlement),
      participants: { settlementIds: [settlement.id], organizationIds: [], characterIds: [] },
      consequences: [law.effect || "Legal obligations shift."]
    }));
  });
  return events;
}

function extractOrganizationEvents(org) {
  const events = [];
  if (org.profile?.foundingYear) {
    events.push(makeEvent({
      seed: deriveSeed(org.seed, "organization-founding"),
      title: `Founding of ${org.identity?.name || org.name}`,
      summary: `${org.identity?.name || org.name} enters the record as ${org.profile.industry || "an organization"}.`,
      date: org.profile.foundingYear,
      eventType: "organization-founding",
      eventCategory: "founding",
      scale: "organization",
      sourceEntity: org,
      sourceObject: org.profile,
      sourceType: "organization-founding",
      location: { systemIds: [], settlementIds: [], locationEntityIds: [org.id] },
      participants: { settlementIds: [], organizationIds: [org.id], characterIds: [] },
      consequences: [`${org.identity?.name || org.name} becomes available for later contracts, incidents, and influence.`]
    }));
  }
  org.history?.forEach((item, index) => {
    events.push(makeEvent({
      seed: deriveSeed(org.seed, `org-history-${index}-${item.title}`),
      title: item.title,
      summary: item.description,
      date: item.year || item.date,
      eventType: classifyEvent(item.title || item.description, "organization-history"),
      eventCategory: classifyCategory(item.title || item.description, "economic"),
      scale: "organization",
      sourceEntity: org,
      sourceObject: item,
      sourceType: "embedded-organization-history",
      location: { systemIds: [], settlementIds: [], locationEntityIds: [org.id] },
      participants: { settlementIds: [], organizationIds: [org.id], characterIds: [] },
      consequences: [item.related || "Institutional reputation changes."],
      status: item.status
    }));
  });
  org.incidents?.forEach((incident, index) => {
    events.push(makeEvent({
      seed: deriveSeed(org.seed, `incident-${index}-${incident.id || incident.category}`),
      title: incident.category || incident.id,
      summary: incident.summary || incident.impact || "An organizational incident enters the record.",
      date: incident.date,
      eventType: classifyEvent(incident.category || incident.summary, "incident"),
      eventCategory: "conflict",
      scale: "organization",
      sourceEntity: org,
      sourceObject: incident,
      sourceType: "embedded-organization-incident",
      location: { systemIds: [], settlementIds: [], locationEntityIds: [org.id] },
      participants: { settlementIds: [], organizationIds: [org.id], characterIds: [] },
      consequences: [incident.resolution || incident.impact || "Incident review changes operations."],
      status: incident.classification || incident.severity
    }));
  });
  org.products?.forEach((product, index) => {
    events.push(makeEvent({
      seed: deriveSeed(org.seed, `product-${index}-${product.model}`),
      title: `${product.model} released`,
      summary: product.description,
      date: product.releaseYear,
      eventType: "technology-deployment",
      eventCategory: "scientific-technological",
      scale: "organization",
      sourceEntity: org,
      sourceObject: product,
      sourceType: "embedded-product-release",
      location: { systemIds: [], settlementIds: [], locationEntityIds: [org.id] },
      participants: { settlementIds: [], organizationIds: [org.id], characterIds: [] },
      consequences: [product.defect ? `Known defect: ${product.defect}.` : "The release changes local capability."]
    }));
  });
  return events;
}

function extractCharacterEvents(character) {
  const events = [];
  const birthYear = character.biography?.birthYear || character.demographics?.birthYear;
  if (birthYear) {
    events.push(makeEvent({
      seed: deriveSeed(character.seed, "birth"),
      title: `Birth of ${character.name?.full || character.name}`,
      summary: `${character.name?.full || character.name} enters the timeline.`,
      date: birthYear,
      eventType: "birth",
      eventCategory: "personal",
      scale: "personal",
      sourceEntity: character,
      sourceObject: character.biography || character.demographics,
      sourceType: "character-birth",
      location: { systemIds: [], settlementIds: [], locationEntityIds: [character.id] },
      participants: { settlementIds: [], organizationIds: [], characterIds: [character.id] },
      consequences: ["A future personal actor enters the record."]
    }));
  }
  character.history?.forEach((item, index) => {
    events.push(makeEvent({
      seed: deriveSeed(character.seed, `character-history-${index}-${item.title}`),
      title: item.title,
      summary: item.description || item.consequence || `${character.name?.full || character.name} records a life event.`,
      date: item.year || item.date,
      eventType: classifyEvent(item.title || item.description, "personal-history"),
      eventCategory: "personal",
      scale: "personal",
      sourceEntity: character,
      sourceObject: item,
      sourceType: "embedded-character-history",
      location: { systemIds: [], settlementIds: [], locationEntityIds: [character.id] },
      participants: { settlementIds: [], organizationIds: ids([character.organization]), characterIds: [character.id] },
      consequences: [item.consequence || "The character's obligations and reputation shift."],
      status: item.status
    }));
  });
  return events;
}

function extractConflictEvents(conflict) {
  return (conflict.chronology || []).map((item, index) => makeEvent({
    seed: deriveSeed(conflict.seed, `conflict-chronology-${index}-${item.title}`),
    title: `${conflict.name}: ${item.title}`,
    summary: item.event || item.description || conflict.summary,
    date: item.year || item.date,
    eventType: classifyEvent(item.title || item.event, "conflict-stage"),
    eventCategory: "conflict",
    scale: conflict.classification?.scope || "conflict",
    sourceEntity: conflict,
    sourceObject: item,
    sourceType: "embedded-conflict-chronology",
    location: {
      systemIds: [conflict.location?.systemId].filter(Boolean),
      settlementIds: [conflict.location?.settlementId].filter(Boolean),
      districtIds: conflict.location?.districtIds || [],
      locationEntityIds: [conflict.id]
    },
    participants: {
      settlementIds: [conflict.location?.settlementId].filter(Boolean),
      organizationIds: conflict.parties?.filter(party => party.entityType === "organization").map(party => party.id).filter(Boolean) || [],
      characterIds: conflict.parties?.filter(party => party.entityType === "character").map(party => party.id).filter(Boolean) || []
    },
    consequences: [conflict.escalation?.noInterventionOutcome || "The conflict changes public leverage."],
    status: item.visibility
  }));
}

function extractDocumentEvents(document) {
  const events = [makeEvent({
    seed: deriveSeed(document.seed, "document-creation"),
    title: `${document.title} created`,
    summary: `${document.documentTypeLabel || "Document"} by ${document.authorship?.authorName || document.authorship?.issuingOrganizationName || "unknown author"} records ${document.subject?.name || "a subject"}.`,
    date: document.inUniverseDate || document.chronology?.displayDate,
    eventType: "document-publication",
    eventCategory: "documentary",
    scale: "document",
    sourceEntity: document,
    sourceObject: document,
    sourceType: "document-record",
    location: { systemIds: [], settlementIds: [], locationEntityIds: [document.id] },
    participants: {
      settlementIds: [],
      organizationIds: [document.authorship?.issuingOrganizationId, ...(document.recipients?.organizationIds || [])].filter(Boolean),
      characterIds: [document.authorship?.signatoryCharacterId, ...(document.recipients?.characterIds || [])].filter(Boolean)
    },
    sourceDocumentIds: [document.id],
    claims: document.claims || [],
    contradictions: document.contradictions || [],
    consequences: [document.purpose?.actualPurpose || document.purpose?.statedPurpose || "The record becomes available for later interpretation."],
    status: document.classification?.reliability || document.classification?.accessLevel
  })];
  if (document.classification?.accessLevel && /classified|restricted|blackfile/i.test(document.classification.accessLevel)) {
    const year = normalizeDate(document.inUniverseDate).year;
    events.push(makeEvent({
      seed: deriveSeed(document.seed, "document-declassification-possibility"),
      title: `${document.title} enters disputed archive circulation`,
      summary: `Later readers may encounter a restricted or partial version of ${document.title}.`,
      date: year ? year + 3 : "",
      eventType: "archive-accession",
      eventCategory: "documentary",
      scale: "document",
      sourceEntity: document,
      sourceObject: document.classification,
      sourceType: "document-archive-state",
      location: { systemIds: [], settlementIds: [], locationEntityIds: [document.id] },
      participants: { settlementIds: [], organizationIds: [document.authorship?.issuingOrganizationId].filter(Boolean), characterIds: [] },
      sourceDocumentIds: [document.id],
      consequences: ["The document can contradict public memory."],
      status: "reconstructed"
    }));
  }
  return events;
}

function makeEvent(input) {
  const chronology = normalizeDate(input.date);
  const parentName = entityName(input.sourceEntity);
  const id = `event_${hashString(input.seed).toString(36)}`;
  const sourceEntityIds = [input.sourceEntity?.id, ...(input.sourceEntity?.relationships || []).map(rel => rel.toEntityId)].filter(Boolean);
  const participants = {
    characterIds: input.participants?.characterIds || [],
    organizationIds: input.participants?.organizationIds || [],
    governmentIds: input.participants?.governmentIds || [],
    settlementIds: input.participants?.settlementIds || [],
    populationGroupIds: input.participants?.populationGroupIds || []
  };
  const certainty = certaintyFor(input.status, chronology);
  return {
    id,
    entityType: "historicalEvent",
    schemaVersion: 1,
    seed: input.seed,
    title: input.title || "Untitled historical event",
    shortLabel: shortLabel(input.title || "Historical event"),
    summary: input.summary || "A dated fact was found in the existing universe archive.",
    eventType: input.eventType || "historical-record",
    eventCategory: input.eventCategory || "custom",
    scale: input.scale || "local",
    status: input.sourceType?.startsWith("generated") ? "suggested" : "historical",
    chronology,
    location: {
      systemIds: input.location?.systemIds || [],
      settlementIds: input.location?.settlementIds || [],
      districtIds: input.location?.districtIds || [],
      locationEntityIds: input.location?.locationEntityIds || []
    },
    participants,
    causes: [],
    triggers: [],
    consequences: (input.consequences || []).filter(Boolean),
    relatedEventIds: [],
    sourceDocumentIds: input.sourceDocumentIds || [],
    sourceConflictIds: input.sourceEntity?.entityType === "conflict" ? [input.sourceEntity.id] : [],
    sourceEntityIds,
    historicalAssessment: {
      contemporaryImportance: importanceFor(input.eventCategory, input.eventType, chronology.year),
      laterImportance: laterImportanceFor(input.eventCategory, input.eventType, input.summary),
      localImportance: input.scale === "settlement" || input.scale === "personal" ? "high" : "moderate",
      systemicImportance: input.scale === "system" || input.eventCategory === "conflict" ? "high" : "moderate",
      certainty,
      interpretation: certainty === "disputed" ? "disputed" : input.status || "recorded",
      turningPoint: /founding|trigger|disaster|collapse|reform|war|crisis|scandal/i.test(`${input.eventType} ${input.title}`),
      eraDefining: /founding|collapse|war|first|charter|treaty/i.test(`${input.eventType} ${input.title}`)
    },
    perspectives: perspectiveFor(input, parentName, certainty),
    claims: input.claims || [],
    contradictions: input.contradictions || [],
    aftermath: input.consequences || [],
    entityChanges: [{
      entityId: input.sourceEntity?.id || "",
      entityType: input.sourceEntity?.entityType || "",
      changeType: input.eventType || "historical-record",
      description: (input.consequences || [input.summary || input.title]).find(Boolean) || "The source entity's historical state changes."
    }].filter(change => change.entityId),
    historicalMemory: {
      publicMemory: memoryFor(input, certainty),
      institutionalMemory: parentName ? `${parentName} preserves this as a ${input.sourceType || "source"} record.` : "The archive preserves this as a source record.",
      contestedBy: certainty === "disputed" || certainty === "deliberately obscured" ? [parentName || "unknown source"] : [],
      forgottenElement: chronology.precision === "unknown" ? "The original date remains unresolved." : "",
      exaggeratedElement: input.eventCategory === "founding" ? "Later accounts may make the founding seem cleaner than the surviving record." : ""
    },
    sourceCoverage: {
      sourceCount: 1 + (input.sourceDocumentIds || []).length + (input.claims || []).length,
      sourceDiversity: unique([input.sourceType, input.sourceDocumentIds?.length ? "document" : "", input.claims?.length ? "claim" : ""]).length,
      agreementLevel: input.contradictions?.length ? "contested" : certainty === "unknown" ? "thin" : "mostly aligned",
      missingPerspectives: missingPerspectivesFor(input)
    },
    tags: [input.eventCategory, input.eventType, input.scale, certainty].filter(Boolean),
    notes: "",
    source: {
      type: input.sourceType || "extracted-record",
      parentEntityId: input.sourceEntity?.id || "",
      parentEntityType: input.sourceEntity?.entityType || "",
      parentObjectId: input.sourceObject?.id || input.sourceObject?.title || input.sourceObject?.name || "",
      parentName
    },
    favorite: false,
    createdAt: deterministicCreatedAt(input.seed),
    updatedAt: deterministicCreatedAt(`${input.seed}:updated`)
  };
}

function normalizeStoredEvent(record) {
  const event = record?.event || record?.historicalEvent || record?.entity || record;
  if (!event) return null;
  return {
    ...event,
    entityType: "historicalEvent",
    chronology: event.chronology?.normalizedStart ? event.chronology : normalizeDate(event.chronology?.startDate || event.date || event.year)
  };
}

function makeStandaloneEvents(root, seed, scope) {
  const subject = scope.label || root.pick(["Local Archive", "Frontier Corridor", "Meridian Record"]);
  const base = root.int(2210, 2280);
  return [
    makeEvent({
      seed: deriveSeed(seed, "standalone-first-record"),
      title: `${subject} first appears in surviving records`,
      summary: `The archive has no saved source entities yet, so this placeholder marks where known history should begin once world data is saved.`,
      date: base,
      eventType: "first-record",
      eventCategory: "documentary",
      scale: "universe",
      sourceEntity: { id: "local_archive", entityType: "universe", name: subject },
      sourceObject: {},
      sourceType: "standalone-placeholder",
      location: { systemIds: [], settlementIds: [], locationEntityIds: [] },
      participants: { settlementIds: [], organizationIds: [], characterIds: [] },
      consequences: ["Future saved entities should replace this placeholder chronology."]
    }),
    makeEvent({
      seed: deriveSeed(seed, "standalone-gap"),
      title: `${subject} enters an undocumented transition`,
      summary: "The engine needs saved systems, settlements, organizations, characters, conflicts, or documents to ground detailed history.",
      date: base + root.int(15, 45),
      eventType: "missing-source-marker",
      eventCategory: "documentary",
      scale: "universe",
      sourceEntity: { id: "local_archive", entityType: "universe", name: subject },
      sourceObject: {},
      sourceType: "standalone-placeholder",
      location: { systemIds: [], settlementIds: [], locationEntityIds: [] },
      participants: { settlementIds: [], organizationIds: [], characterIds: [] },
      consequences: ["Save world data, then extract again for a stronger chronology."]
    })
  ];
}

function makeConnectiveEvents(root, seed, events, gaps, scope) {
  return gaps.slice(0, 4).map((gap, index) => {
    const year = gap.fromYear + Math.max(1, Math.floor((gap.toYear - gap.fromYear) / 2));
    const subject = scope.label || gap.fromTitle.split(":")[0] || "the archive";
    return makeEvent({
      seed: deriveSeed(seed, `connective-${index}-${gap.fromEventId}-${gap.toEventId}`),
      title: root.pick([
        `${subject} records a transition settlement`,
        `${subject} undergoes quiet institutional reform`,
        `${subject} absorbs a migration wave`,
        `${subject} begins reconstruction planning`
      ]),
      summary: `Suggested connective history between "${gap.fromTitle}" and "${gap.toTitle}". It explains the ${gap.duration}-year gap without overwriting either source record.`,
      date: year,
      eventType: "connective-history",
      eventCategory: root.pick(["political", "infrastructure", "social-cultural", "economic"]),
      scale: scope.timelineType || "universe",
      sourceEntity: { id: scope.primaryEntityId || "generated_gap", entityType: scope.primaryEntityType || "timeline", name: subject },
      sourceObject: gap,
      sourceType: "generated-connective-history",
      location: { systemIds: [], settlementIds: [], locationEntityIds: [scope.primaryEntityId].filter(Boolean) },
      participants: { settlementIds: scope.primaryEntityType === "settlement" ? [scope.primaryEntityId] : [], organizationIds: scope.primaryEntityType === "organization" ? [scope.primaryEntityId] : [], characterIds: scope.primaryEntityType === "character" ? [scope.primaryEntityId] : [] },
      consequences: ["This suggestion can be accepted, edited, or ignored."],
      status: "suggested"
    });
  });
}

function detectGaps(events, root = createSeededRandom("gaps")) {
  const dated = events.filter(event => event.chronology.year).sort((a, b) => a.chronology.normalizedStart - b.chronology.normalizedStart);
  const gaps = [];
  for (let i = 1; i < dated.length; i += 1) {
    const previous = dated[i - 1];
    const next = dated[i];
    const duration = next.chronology.year - previous.chronology.year;
    if (duration >= 45) {
      gaps.push({
        id: `gap_${hashString(`${previous.id}:${next.id}`).toString(36)}`,
        gapType: root.pick(["missing transitional event", "missing source", "unexplained institutional change", "missing consequence"]),
        fromEventId: previous.id,
        toEventId: next.id,
        fromTitle: previous.title,
        toTitle: next.title,
        fromYear: previous.chronology.year,
        toYear: next.chronology.year,
        duration,
        severity: duration >= 80 ? "likely contradiction" : "missing information",
        suggestion: `Add one bridging event between ${previous.chronology.displayDate} and ${next.chronology.displayDate}.`
      });
    }
  }
  events.filter(event => event.chronology.precision === "unknown").forEach(event => {
    gaps.push({
      id: `gap_${hashString(`${event.id}:undated`).toString(36)}`,
      gapType: "missing date",
      fromEventId: event.id,
      toEventId: "",
      fromTitle: event.title,
      toTitle: "",
      fromYear: null,
      toYear: null,
      duration: null,
      severity: "missing information",
      suggestion: "Preserve the source text, but assign a date precision before using this as a firm cause."
    });
  });
  return gaps;
}

function detectContradictions(events, universe = {}) {
  const warnings = [];
  const bySourceAndDate = new Map();
  events.forEach(event => {
    if (event.chronology.precision === "unknown") return;
    const key = `${event.source.parentEntityId}:${event.source.parentObjectId}:${event.eventType}`;
    const existing = bySourceAndDate.get(key);
    if (existing && Math.abs(existing.chronology.year - event.chronology.year) > 1) {
      warnings.push({
        id: `warning_${hashString(`${existing.id}:${event.id}`).toString(36)}`,
        warningType: "date conflict",
        severity: "likely contradiction",
        eventIds: [existing.id, event.id],
        message: `${existing.title} and ${event.title} appear to describe the same source with different dates.`,
        resolutionOptions: ["Choose canonical date", "Retain both as disputed", "Merge records", "Create explanatory event"]
      });
    }
    bySourceAndDate.set(key, event);
    if (event.contradictions?.length) {
      warnings.push({
        id: `warning_${hashString(`${event.id}:document-claims`).toString(36)}`,
        warningType: "disputed account",
        severity: "possible contradiction",
        eventIds: [event.id],
        message: `${event.title} carries contradictory document claims.`,
        resolutionOptions: ["Attach supporting document", "Mark as propaganda", "Retain as disputed"]
      });
    }
  });
  records(universe.documents).forEach(document => {
    const documentYear = normalizeDate(document.inUniverseDate).year;
    const subjectIds = document.references?.map(ref => ref.id).filter(Boolean) || [];
    if (!documentYear || !subjectIds.length) return;
    const laterSubjectEvent = events.find(event => event.chronology.year && subjectIds.some(id => event.sourceEntityIds.includes(id)) && event.chronology.year > documentYear);
    if (laterSubjectEvent) {
      warnings.push({
        id: `warning_${hashString(`${document.id}:${laterSubjectEvent.id}:date`).toString(36)}`,
        warningType: "document before subject event",
        severity: "possible contradiction",
        eventIds: [laterSubjectEvent.id],
        message: `${document.title} is dated before a related subject event.`,
        resolutionOptions: ["Mark document as prediction", "Adjust date", "Attach amendment history"]
      });
    }
  });
  return warnings;
}

function makeEras(root, seed, events) {
  const dated = events.filter(event => event.chronology.year).sort((a, b) => a.chronology.year - b.chronology.year);
  if (!dated.length) return [];
  if (dated.length < 4) {
    return [era(seed, 0, root.pick(["Recorded Beginnings", "Sparse Archive Period"]), dated[0], dated.at(-1), dated)];
  }
  const chunkSize = Math.ceil(dated.length / 3);
  return [0, 1, 2].map(index => {
    const chunk = dated.slice(index * chunkSize, (index + 1) * chunkSize);
    if (!chunk.length) return null;
    const names = ["Foundation and First Records", "Expansion and Pressure", "Crisis and Reinterpretation"];
    return era(seed, index, names[index], chunk[0], chunk.at(-1), chunk);
  }).filter(Boolean);
}

function era(seed, index, name, start, end, events) {
  return {
    id: `era_${hashString(`${seed}:era:${index}`).toString(36)}`,
    entityType: "historicalEra",
    name,
    startEventId: start.id,
    endEventId: end.id,
    startDate: start.chronology.displayDate,
    endDate: end.chronology.displayDate,
    scopeEntityIds: unique(events.flatMap(event => event.sourceEntityIds)),
    definingTraits: unique(events.map(event => event.eventCategory)).slice(0, 4),
    majorEventIds: events.filter(event => event.historicalAssessment.turningPoint || event.historicalAssessment.laterImportance > 72).map(event => event.id).slice(0, 5),
    majorCharacterIds: unique(events.flatMap(event => event.participants.characterIds)).slice(0, 5),
    majorOrganizationIds: unique(events.flatMap(event => event.participants.organizationIds)).slice(0, 5),
    interpretation: `${name} is defined by ${unique(events.map(event => event.eventCategory)).slice(0, 3).join(", ") || "fragmentary records"}.`,
    tags: unique(events.flatMap(event => event.tags)).slice(0, 8)
  };
}

function makeBranches(root, seed, events, scope) {
  const pivot = events.find(event => event.eventCategory === "conflict" || event.historicalAssessment.turningPoint) || events.at(Math.floor(events.length / 2));
  if (!pivot) return [];
  return [{
    id: `branch_${slug(pivot.shortLabel) || hashString(seed).toString(36)}_averted`,
    entityType: "timelineBranch",
    name: `${pivot.shortLabel} Averted`,
    divergenceEventId: pivot.id,
    divergenceDate: pivot.chronology.displayDate,
    summary: `An alternate branch where ${pivot.shortLabel.toLowerCase()} is delayed, exposed early, or politically defused.`,
    scopeEntityIds: [scope.primaryEntityId, ...pivot.sourceEntityIds].filter(Boolean),
    consequences: [
      "The immediate crisis loses force.",
      "A different institution gains legitimacy.",
      "Later records become cleaner but less dramatic."
    ],
    status: "available"
  }];
}

function makeCausalLinks(events) {
  const dated = events.filter(event => event.chronology.year).sort((a, b) => a.chronology.year - b.chronology.year);
  return dated.slice(1).map((event, index) => {
    const previous = dated[index];
    const sharedEntity = event.sourceEntityIds.find(id => previous.sourceEntityIds.includes(id));
    const sharedCategory = event.eventCategory === previous.eventCategory;
    if (!sharedEntity && !sharedCategory) return null;
    return {
      sourceEventId: previous.id,
      targetEventId: event.id,
      relationshipType: sharedEntity ? "contributed to" : "historical echo",
      strength: event.chronology.year - previous.chronology.year <= 8 ? "direct" : "indirect",
      certainty: sharedEntity ? "well-supported" : "reconstructed"
    };
  }).filter(Boolean);
}

function chronologyHealth(events, gaps, contradictions, branches) {
  const dated = events.filter(event => event.chronology.year);
  return {
    totalEvents: events.length,
    earliestYear: dated.length ? Math.min(...dated.map(event => event.chronology.year)) : null,
    latestYear: dated.length ? Math.max(...dated.map(event => event.chronology.year)) : null,
    majorEras: Math.max(1, Math.min(3, Math.ceil(dated.length / 4))),
    contradictions: contradictions.length,
    undated: events.filter(event => event.chronology.precision === "unknown").length,
    orphaned: events.filter(event => !event.relatedEventIds.length && event.historicalAssessment.laterImportance >= 70).length,
    gaps: gaps.length,
    alternateBranches: branches.length
  };
}

function normalizeScope(input = {}) {
  const raw = input.scope || input.context || input.filters || {};
  const subject = raw.subject || raw.primaryEntity || raw.entity || raw.system || raw.settlement || raw.organization || raw.character || raw.conflict || raw.document || null;
  const primaryEntityType = raw.primaryEntityType || subject?.entityType || entityTypeFromKeys(raw);
  const primaryEntityId = raw.primaryEntityId || subject?.id || raw.systemId || raw.settlementId || raw.organizationId || raw.characterId || raw.conflictId || raw.documentId || "";
  return {
    primaryEntityId,
    primaryEntityType,
    includedEntityIds: unique([...(raw.includedEntityIds || []), primaryEntityId].filter(Boolean)),
    excludedEntityIds: raw.excludedEntityIds || [],
    tags: raw.tags || [],
    categories: raw.categories || [],
    label: raw.label || entityName(subject) || "Universe Timeline",
    timelineType: timelineTypeFor(primaryEntityType)
  };
}

function matchesScope(event, scope) {
  if (!scope?.primaryEntityId && !scope?.categories?.length) return true;
  if (scope.excludedEntityIds?.some(id => event.sourceEntityIds.includes(id) || event.id === id)) return false;
  if (scope.categories?.length && !scope.categories.includes(event.eventCategory) && !scope.categories.includes(event.eventType)) return false;
  if (!scope.primaryEntityId) return true;
  const refs = [
    event.id,
    event.source.parentEntityId,
    ...event.sourceEntityIds,
    ...event.location.systemIds,
    ...event.location.settlementIds,
    ...event.location.districtIds,
    ...event.location.locationEntityIds,
    ...event.participants.characterIds,
    ...event.participants.organizationIds,
    ...event.participants.settlementIds,
    ...event.sourceDocumentIds,
    ...event.sourceConflictIds
  ].filter(Boolean);
  return refs.includes(scope.primaryEntityId) || scope.includedEntityIds.some(id => refs.includes(id));
}

function normalizeDate(value) {
  if (value == null || value === "") {
    return {
      original: "",
      calendarId: "calendar_unknown",
      normalizedStart: Number.POSITIVE_INFINITY,
      normalizedEnd: Number.POSITIVE_INFINITY,
      precision: "unknown",
      displayDate: "undated",
      approximate: true,
      disputed: false,
      year: null,
      sequenceIndex: null
    };
  }
  if (typeof value === "number") return dateShape(String(value), value, "year", false);
  const original = String(value);
  const iso = original.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    return dateShape(original, year + (month - 1) / 12 + day / 365, "day", /circa|approx|about/i.test(original), year);
  }
  const yearMatch = original.match(/(\d{4})/);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    return dateShape(original, year, /circa|approx|about/i.test(original) ? "approximate" : "year", /circa|approx|about/i.test(original), year);
  }
  const decade = original.match(/(\d{3})0s/);
  if (decade) return dateShape(original, Number(`${decade[1]}0`), "decade", true, Number(`${decade[1]}0`));
  return {
    original,
    calendarId: "calendar_unknown",
    normalizedStart: Number.POSITIVE_INFINITY,
    normalizedEnd: Number.POSITIVE_INFINITY,
    precision: "unknown",
    displayDate: original,
    approximate: true,
    disputed: /disputed|unknown|unclear/i.test(original),
    year: null,
    sequenceIndex: null
  };
}

function dateShape(original, normalized, precision, approximate, explicitYear = normalized) {
  const year = Math.floor(explicitYear);
  return {
    original,
    calendarId: "calendar_shared_interstellar",
    normalizedStart: normalized,
    normalizedEnd: normalized,
    precision,
    displayDate: precision === "approximate" ? `circa ${year}` : original,
    approximate,
    disputed: /disputed|contested/i.test(String(original)),
    year,
    sequenceIndex: null
  };
}

function sortEvents(events) {
  return [...events].sort((a, b) => {
    const dateDelta = a.chronology.normalizedStart - b.chronology.normalizedStart;
    if (Number.isFinite(dateDelta) && dateDelta !== 0) return dateDelta;
    return a.title.localeCompare(b.title);
  });
}

function dedupeEvents(events) {
  const seen = new Map();
  events.forEach(event => {
    const key = [
      event.seed,
      event.source.parentEntityId,
      event.source.parentObjectId,
      event.eventType,
      event.chronology.displayDate
    ].join(":");
    if (!seen.has(key)) seen.set(key, event);
  });
  return [...seen.values()];
}

function settlementLocation(settlement, districtNames = []) {
  const districts = Array.isArray(districtNames)
    ? settlement.districts?.filter(district => districtNames.includes(district.name) || districtNames.includes(district.id)).map(district => district.id) || []
    : [];
  return {
    systemIds: [settlement.location?.systemId].filter(Boolean),
    settlementIds: [settlement.id],
    districtIds: districts,
    locationEntityIds: [settlement.id]
  };
}

function records(collection) {
  return (collection || []).map(record => record?.entity || record?.system || record?.settlement || record?.organization || record?.character || record?.conflict || record?.document || record?.timeline || record?.event || record).filter(Boolean);
}

function ids(items = []) {
  return items.map(item => item?.id || item?.promotedEntityId).filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function entityName(entity) {
  if (!entity) return "";
  return entity.name?.full || entity.identity?.name || entity.name || entity.title || entity.id || "";
}

function shortLabel(title) {
  return String(title || "Event").replace(/^.*?:\s*/, "").slice(0, 48);
}

function classifyEvent(text = "", fallback = "historical-record") {
  const value = String(text).toLowerCase();
  if (/found|charter|created|began/.test(value)) return "founding";
  if (/law|order|permit|treaty|election|council|government/.test(value)) return "political-change";
  if (/war|strike|riot|conflict|trigger|crisis|scandal|disaster|collapse/.test(value)) return "conflict-incident";
  if (/station|dock|route|transit|reactor|utility|construction|opening/.test(value)) return "infrastructure-change";
  if (/research|survey|discovery|prototype|release/.test(value)) return "discovery-or-deployment";
  if (/birth|education|promotion|marriage|injury|death|exile/.test(value)) return "personal-milestone";
  if (/document|memo|report|archive|publication|leak/.test(value)) return "documentary-record";
  return fallback;
}

function classifyCategory(text = "", fallback = "custom") {
  const value = String(text).toLowerCase();
  if (/found|charter|created|began/.test(value)) return "founding";
  if (/law|order|permit|treaty|election|council|government/.test(value)) return "political";
  if (/war|strike|riot|conflict|trigger|crisis|scandal|disaster|collapse/.test(value)) return "conflict";
  if (/station|dock|route|transit|reactor|utility|construction|opening/.test(value)) return "infrastructure";
  if (/research|survey|discovery|prototype|release/.test(value)) return "scientific-technological";
  if (/birth|education|promotion|marriage|injury|death|exile/.test(value)) return "personal";
  if (/document|memo|report|archive|publication|leak/.test(value)) return "documentary";
  return fallback;
}

function certaintyFor(status, chronology) {
  const value = String(status || "").toLowerCase();
  if (chronology.precision === "unknown") return "unknown";
  if (/blackfile|classified|hidden|restricted|redacted/.test(value)) return "deliberately obscured";
  if (/disputed|contested/.test(value)) return "disputed";
  if (/public|precise|closed|well/.test(value)) return "well documented";
  if (chronology.approximate) return "reconstructed";
  return CERTAINTY[Math.abs(hashString(`${status}:${chronology.displayDate}`)) % 3];
}

function importanceFor(category, type, year) {
  let score = 42;
  if (["founding", "conflict", "infrastructure"].includes(category)) score += 18;
  if (/turning|trigger|collapse|founding|release/.test(type)) score += 14;
  if (year && CURRENT_YEAR - year < 10) score += 6;
  return Math.min(95, score);
}

function laterImportanceFor(category, type, summary = "") {
  let score = importanceFor(category, type, null);
  if (/consequence|lasting|legacy|public|records|archive/i.test(summary)) score += 10;
  return Math.min(96, score);
}

function perspectiveFor(input, parentName, certainty) {
  return [
    {
      authorOrInstitution: parentName || "Local archive",
      claim: input.summary || input.title,
      bias: input.status && /restricted|classified|hidden/i.test(input.status) ? "institutional secrecy" : "source proximity",
      evidence: input.sourceType || "embedded record",
      confidence: certainty
    },
    {
      authorOrInstitution: "Later archive synthesis",
      claim: "This event is placed by normalized chronology and may need supporting records.",
      bias: "retrospective ordering",
      evidence: "cross-module extraction",
      confidence: certainty === "unknown" ? "fragmentary" : "reconstructed"
    }
  ];
}

function memoryFor(input, certainty) {
  if (certainty === "deliberately obscured") return "Remembered through rumor, sealed files, and institutional silence.";
  if (certainty === "disputed") return "Remembered differently by the parties who benefited or lost standing.";
  if (input.eventCategory === "founding") return "Treated as an origin story, even where the archive suggests a messier beginning.";
  if (input.eventCategory === "conflict") return "Remembered as a grievance, warning, or proof of institutional failure.";
  if (input.eventCategory === "documentary") return "Remembered mainly by archivists, investigators, and later interpreters.";
  return "Remembered as part of the ordinary chain of local history.";
}

function missingPerspectivesFor(input) {
  const missing = [];
  if (!input.participants?.characterIds?.length) missing.push("personal witness");
  if (!input.sourceDocumentIds?.length && input.eventCategory !== "documentary") missing.push("source document");
  if (!input.participants?.organizationIds?.length && ["economic", "infrastructure", "political"].includes(input.eventCategory)) missing.push("institutional actor");
  return missing;
}

function timelineTypeFor(entityType) {
  if (entityType === "star-system") return "system";
  if (entityType === "settlement") return "settlement";
  if (entityType === "organization") return "organization";
  if (entityType === "character") return "character";
  if (entityType === "conflict") return "conflict";
  if (entityType === "document") return "document";
  return "universe";
}

function entityTypeFromKeys(raw) {
  if (raw.system || raw.systemId) return "star-system";
  if (raw.settlement || raw.settlementId) return "settlement";
  if (raw.organization || raw.organizationId) return "organization";
  if (raw.character || raw.characterId) return "character";
  if (raw.conflict || raw.conflictId) return "conflict";
  if (raw.document || raw.documentId) return "document";
  return "";
}

function timelineName(scope, events, root) {
  if (scope.label && scope.label !== "Universe Timeline") return `History of ${scope.label}`;
  if (events.length) return root.pick(["Universe Timeline", "Shared Historical Record", "Chronology of the Local Archive"]);
  return "New Historical Timeline";
}

function timelineDescription(scope, events, gaps) {
  const label = scope.label && scope.label !== "Universe Timeline" ? scope.label : "the saved universe";
  return `A chronology for ${label} built from ${events.length} extracted event(s), with ${gaps.length} gap or warning candidate(s) held for review.`;
}
