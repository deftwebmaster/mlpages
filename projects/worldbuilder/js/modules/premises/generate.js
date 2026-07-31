import { createSeededRandom, deterministicCreatedAt, deriveSeed, hashString, slug } from "../../shared/random.js";
import { buildRelationshipGraph } from "../relationships/generate.js";

export const STORY_STATUSES = ["idea", "generated", "reviewing", "developing", "shortlisted", "selected", "outlining", "drafting", "completed", "paused", "archived", "rejected"];
export const CANON_STATUSES = ["non-canon-concept", "provisional", "alternate-possibility", "planned-canon", "canon", "rejected-canon", "branch-specific", "historical-fiction-within-universe"];
export const STORY_SCALES = ["flash-fiction", "short-story", "novelette", "novella", "novel", "series", "episodic", "anthology-episode", "vignette", "game-scenario", "campaign-arc"];
export const NARRATIVE_MODES = ["single-protagonist", "dual-protagonist", "ensemble", "rotating-viewpoints", "antagonist-centered", "investigator-centered", "institution-centered", "faction-centered", "settlement-centered", "documentary-narrative", "epistolary", "nonlinear-historical-reconstruction"];
export const PREMISE_GENRES = [
  "science-fiction-mystery", "political-thriller", "institutional-thriller", "military-science-fiction", "espionage", "survival", "disaster", "exploration", "first-contact", "heist",
  "crime", "noir", "legal-drama", "medical-science-fiction", "technological-thriller", "corporate-intrigue", "rebellion", "resistance", "revolution", "diplomatic-drama",
  "war-story", "romance", "family-drama", "tragedy", "adventure", "horror", "psychological-drama", "coming-of-age", "philosophical-science-fiction", "archaeological-mystery",
  "historical-science-fiction", "social-science-fiction"
];
export const PREMISE_TONES = ["tense", "cerebral", "intimate", "bleak", "hopeful", "restrained", "operatic", "paranoid", "adventurous", "melancholic", "tragic", "morally-complex", "satirical", "suspenseful", "procedural", "contemplative", "claustrophobic", "sweeping", "urgent", "quiet", "romantic", "austere", "defiant", "elegiac", "gritty"];

const SIGNAL_TYPES = {
  conflict: ["unresolved-grievance", "escalation-trigger", "peace-spoiler", "hidden-sponsor", "unfinished-settlement"],
  relationship: ["incompatible-loyalties", "secret-alliance", "one-sided-loyalty", "coercive-dependency", "political-rivalry"],
  faction: ["impending-schism", "unstable-coalition", "ideological-contradiction", "loss-of-legitimacy", "leadership-succession"],
  organization: ["hidden-liability", "institutional-mission-conflict", "regulatory-exposure", "dangerous-contract", "succession-struggle"],
  settlement: ["infrastructure-failure", "resource-shortage", "class-division", "political-deadlock", "dependence-on-outside-power"],
  document: ["suppressed-report", "contradictory-testimony", "leaked-memorandum", "incriminating-evidence", "dangerous-scientific-finding"],
  historical: ["buried-crime", "false-founding-myth", "old-treaty-obligation", "historical-precedent-returning", "unresolved-betrayal"],
  character: ["incompatible-loyalties", "dangerous-knowledge", "impossible-obligation", "threatened-status", "professional-failure"]
};

const PROTAGONIST_ROLES = ["systems auditor", "forensic archivist", "settlement medic", "maintenance technician", "union organizer", "junior diplomat", "cargo pilot", "security investigator", "political aide", "former soldier", "court clerk", "route negotiator", "district engineer", "document authenticator"];
const INCIDENTS = {
  mystery: ["a missing record reappears with impossible metadata", "an audit contradicts the official cause of a crisis", "a witness recants after receiving a classified warning"],
  thriller: ["a deadline is moved forward without explanation", "a trusted institution orders a quiet shutdown", "a leak exposes enough truth to make everyone dangerous"],
  political: ["a fragile vote is scheduled before the facts can be checked", "a coalition partner demands a private concession", "a public hearing turns into a loyalty test"],
  survival: ["a critical system fails in one district first", "a resource reserve drops below the public safety threshold", "an evacuation plan excludes the people who know how the system works"],
  heist: ["the only proof is locked inside a protected archive", "a treaty file must be stolen before it is erased", "a transport manifest reveals a hidden transfer window"],
  romance: ["an old loyalty becomes a public conflict", "two allies learn their institutions need opposite outcomes", "a private bond becomes the only route to the truth"],
  tragedy: ["the protagonist can preserve order only by repeating the original harm", "a compromise solves the crisis while destroying the person who made it possible", "the safest answer requires betraying the truth"],
  exploration: ["a route anomaly points back to a forgotten political decision", "a survey team finds evidence that changes who owns the destination", "the unknown zone contains proof of an old promise"]
};

export function generateStoryPremise(seed = "story-premise", constraints = {}) {
  const root = createSeededRandom(seed || "story-premise");
  const context = normalizePremiseContext(constraints.universe || {}, constraints);
  const signals = collectNarrativePressureSignals(constraints.universe || {}, constraints).sort((a, b) => b.storyPotential - a.storyPotential || a.id.localeCompare(b.id));
  const filteredSignals = filterSignals(signals, constraints);
  const primarySignal = filteredSignals[0] || fallbackSignal(context, seed);
  const secondarySignals = filteredSignals.filter(item => item.id !== primarySignal.id).slice(0, 3);
  const protagonist = selectProtagonist(root.derive("protagonist"), context, primarySignal, constraints);
  const opposition = selectOpposition(root.derive("opposition"), context, primarySignal, protagonist, constraints);
  const classification = classificationFor(root, constraints, primarySignal);
  const narrativeCore = narrativeCoreFor(root, classification, context, primarySignal, secondarySignals, protagonist, opposition);
  const stakes = stakesFor(root.derive("stakes"), classification, context, primarySignal, protagonist, opposition);
  const choiceArchitecture = choiceFor(root.derive("central-choice"), primarySignal, protagonist, opposition, stakes);
  const escalation = escalationFor(root.derive("escalation"), classification, primarySignal, opposition);
  const twistPotential = twistFor(root.derive("twist-potential"), classification, primarySignal, context);
  const endingPossibilities = endingsFor(root.derive("ending-possibilities"), classification, choiceArchitecture);
  const title = titleFor(root.derive("title"), context, primarySignal, classification);
  const entityIds = unique([primarySignal.sourceEntityIds, ...secondarySignals.map(item => item.sourceEntityIds)].flat());
  const generatedAdditions = generatedAdditionsFor(narrativeCore, protagonist, opposition, primarySignal);
  const premise = {
    id: `premise_${hashString(`${seed}:${context.sourceContextHash}`).toString(36)}`,
    entityType: "storyPremise",
    schemaVersion: 1,
    seed,
    title,
    workingTitle: workingTitleFor(root, primarySignal, context),
    logline: loglineFor(protagonist, narrativeCore, opposition, stakes, choiceArchitecture),
    shortPremise: shortPremiseFor(context, protagonist, narrativeCore, opposition, stakes, choiceArchitecture),
    extendedPremise: extendedPremiseFor(context, protagonist, narrativeCore, opposition, stakes, choiceArchitecture, escalation, twistPotential, endingPossibilities),
    status: normalizeStatus(constraints.status || "generated"),
    canonStatus: normalizeCanonStatus(constraints.canonStatus || "non-canon-concept"),
    classification,
    sourceContext: {
      ...context,
      primarySignalIds: [primarySignal.id],
      secondarySignalIds: secondarySignals.map(item => item.id),
      entityIds,
      generatedAdditions
    },
    narrativeCore,
    protagonistModel: protagonist,
    oppositionModel: opposition,
    stakes,
    conflictStructure: {
      primaryConflictLayer: primarySignal.signalType.split("-")[0],
      conflictLayers: unique([primarySignal.category, ...secondarySignals.map(item => item.category), "interpersonal", "informational"]).slice(0, 5),
      existingConflictIds: context.conflicts.map(item => item.id),
      proposedConflict: generatedAdditions.find(item => item.field === "proposedConflict") || null
    },
    escalation,
    choiceArchitecture,
    twistPotential,
    endingPossibilities,
    thematicLayer: themeFor(classification, primarySignal, choiceArchitecture),
    continuity: validateStoryPremiseDraft(context, entityIds, classification),
    developmentNotes: developmentNotesFor(classification, context, generatedAdditions),
    evaluation: null,
    novelty: null,
    variants: [],
    fieldLocks: {},
    collections: [],
    characterIds: idsFor(context.characters, entityIds),
    organizationIds: idsFor(context.organizations, entityIds),
    factionIds: idsFor(context.factions, entityIds),
    settlementIds: idsFor(context.settlements, entityIds),
    systemIds: idsFor(context.systems, entityIds),
    conflictIds: idsFor(context.conflicts, entityIds),
    documentIds: idsFor(context.documents, entityIds),
    historicalEventIds: idsFor(context.events, entityIds),
    relationshipIds: idsFor(context.relationships, entityIds),
    inspirationSignalIds: [primarySignal.id, ...secondarySignals.map(item => item.id)],
    tags: unique([classification.primaryGenre, classification.storyScale, primarySignal.category, primarySignal.signalType, ...classification.tone]),
    notes: "",
    favorite: false,
    createdAt: deterministicCreatedAt(seed),
    updatedAt: deterministicCreatedAt(`${seed}:updated`),
    presentation: {
      accentColor: colorFor(classification.primaryGenre),
      dossierStyle: "narrative-pressure-brief"
    }
  };
  premise.evaluation = evaluateStoryPremise(premise);
  premise.novelty = noveltyFor(premise, context.savedPremises);
  return premise;
}

export function collectNarrativePressureSignals(universe = {}, constraints = {}) {
  const context = normalizePremiseContext(universe, constraints);
  const signals = [];
  const add = signal => signals.push(scoreSignal(signal, context));
  context.conflicts.forEach(conflict => add(signal("conflict", pickType("conflict", conflict.id), [conflict.id, ...idsFrom(conflict.affectedEntities), ...idsFrom(conflict.parties)], `${nameOf(conflict)} has not reached its most dangerous form.`, textOf(conflict.causes?.publicCause || conflict.classification?.category || conflict.summary), conflict)));
  context.relationships.forEach(rel => {
    if (rel.visibility !== "public" || rel.confidence === "disputed" || rel.status !== "active" || rel.strength?.value >= 55) add(signal("relationship", relationshipSignalType(rel), [rel.id, rel.sourceEntityId, rel.targetEntityId], `${labelOf(rel.sourceLabel || rel.sourceEntityId)} and ${labelOf(rel.targetLabel || rel.targetEntityId)} contain story pressure.`, rel.label || rel.summary, rel));
  });
  context.factions.forEach(faction => {
    const detail = faction.internalDynamics?.disputes?.[0] || faction.ideology?.contradictions?.[0] || faction.futurePressures?.fragmentIf || faction.summary;
    add(signal("faction", faction.internalDynamics?.schismRisk === "high" ? "impending-schism" : pickType("faction", faction.id), [faction.id, ...faction.characterIds || [], ...faction.organizationIds || [], ...faction.conflictIds || []], `${nameOf(faction)} is politically useful and internally unstable.`, detail, faction));
  });
  context.characters.forEach(character => {
    const rel = character.relationships?.find(item => item.secret || item.obligation) || character.relationships?.[0];
    add(signal("character", rel?.secret ? "dangerous-knowledge" : pickType("character", character.id), [character.id, ...idsFrom(character.entityRelationships, "toEntityId")], `${nameOf(character)} has agency, vulnerability, and divided attachments.`, rel?.secret || rel?.obligation || character.summary || character.biography?.coreMemory, character));
  });
  context.organizations.forEach(org => {
    const incident = org.incidents?.[0] || org.history?.turningPoints?.[0];
    add(signal("organization", pickType("organization", org.id), [org.id, ...idsFrom(org.relationships, "toEntityId")], `${nameOf(org)} depends on a compromise that can fail in public.`, textOf(incident?.summary || incident?.description || org.profile?.publicDescription || org.summary), org));
  });
  context.settlements.forEach(settlement => {
    const tension = settlement.tensions?.[0] || settlement.infrastructure?.utilities?.[0];
    add(signal("settlement", pickType("settlement", settlement.id), [settlement.id, settlement.location?.systemId], `${nameOf(settlement)} is one failure away from a story-scale crisis.`, textOf(tension?.description || tension?.name || settlement.summary), settlement));
  });
  context.documents.forEach(document => {
    const truthProblem = document.redactions?.length ? "suppressed-report" : document.authenticity?.status === "disputed" ? "contradictory-testimony" : pickType("document", document.id);
    add(signal("document", truthProblem, [document.id, document.subject?.id, document.authorship?.issuingOrganizationId, ...idsFrom(document.relationships, "toEntityId")], `${document.title || "A document"} could trigger a crisis if interpreted differently.`, textOf(document.purpose?.actualPurpose || document.claims?.[0]?.summary || document.summary), document));
  });
  context.events.forEach(event => add(signal("historical", pickType("historical", event.id), [event.id, ...event.sourceEntityIds || [], ...event.sourceDocumentIds || []], `${event.title || "A historical event"} still shapes the present.`, textOf(event.summary || event.eventType), event)));
  context.systems.forEach(system => {
    if (system.routes?.length || system.importantOrganizations?.length) add(signal("settlement", "dependence-on-outside-power", [system.id], `${nameOf(system)} contains route and institutional dependencies that can localize into a story.`, textOf(system.summary || system.region || "System-scale dependency"), system));
  });
  return dedupeSignals(signals).sort((a, b) => b.storyPotential - a.storyPotential);
}

export function normalizePremiseContext(universe = {}, constraints = {}) {
  const all = {
    systems: records(universe.systems),
    settlements: records(universe.settlements),
    organizations: records(universe.organizations),
    characters: records(universe.characters),
    conflicts: records(universe.conflicts),
    documents: records(universe.documents),
    events: records(universe.historicalEvents),
    factions: records(universe.factions),
    savedPremises: records(universe.storyPremises)
  };
  const relationshipGraph = buildRelationshipGraph(universe);
  const relationships = relationshipGraph.allRelationships || relationshipGraph.relationships || [];
  const focusEntityIds = unique([
    constraints.focus,
    constraints.character,
    constraints.organization,
    constraints.settlement,
    constraints.system,
    constraints.conflict,
    constraints.document,
    constraints.event,
    constraints.faction,
    constraints.relationship,
    ...(constraints.requiredEntities || [])
  ].filter(Boolean));
  const connectedIds = new Set(focusEntityIds);
  relationships.forEach(rel => {
    if (connectedIds.has(rel.sourceEntityId)) connectedIds.add(rel.targetEntityId);
    if (connectedIds.has(rel.targetEntityId)) connectedIds.add(rel.sourceEntityId);
  });
  const scoped = {};
  Object.entries(all).forEach(([key, items]) => {
    scoped[key] = focusEntityIds.length ? items.filter(item => connectedIds.has(item.id) || focusEntityIds.includes(item.seed)) : items;
    if (focusEntityIds.length && !scoped[key].length) scoped[key] = items.filter(item => focusEntityIds.includes(item.id) || focusEntityIds.includes(item.seed));
  });
  const sourceEntityIds = unique(Object.entries(scoped).filter(([key]) => key !== "savedPremises").flatMap(([, items]) => items.map(item => item.id)).concat(focusEntityIds));
  const availableLocations = scoped.settlements.map(item => ({ id: item.id, label: nameOf(item), entityType: "settlement" })).concat(scoped.systems.map(item => ({ id: item.id, label: nameOf(item), entityType: "star-system" })));
  const context = {
    focusEntityIds,
    characters: scoped.characters,
    organizations: scoped.organizations,
    factions: scoped.factions,
    settlements: scoped.settlements,
    systems: scoped.systems,
    conflicts: scoped.conflicts,
    documents: scoped.documents,
    events: scoped.events,
    relationships: focusEntityIds.length ? relationships.filter(rel => connectedIds.has(rel.id) || connectedIds.has(rel.sourceEntityId) || connectedIds.has(rel.targetEntityId)) : relationships,
    savedPremises: all.savedPremises,
    activePressures: [],
    hiddenInformation: [],
    unresolvedGoals: [],
    vulnerableDependencies: [],
    relationshipContradictions: [],
    historicalEchoes: [],
    availableLocations,
    chronologyBounds: chronologyBounds(scoped.events, scoped.conflicts),
    branchId: constraints.branch || null,
    source: { type: focusEntityIds.length ? "focused-existing-world-context" : "universe-pressure-discovery" },
    usesExistingWorld: sourceEntityIds.length > 0,
    sourceEntityIds,
    sourceContextHash: hashString(JSON.stringify({ focusEntityIds, sourceEntityIds, branch: constraints.branch || "" })).toString(36)
  };
  context.hiddenInformation = context.documents.filter(item => item.redactions?.length || item.authenticity?.status === "disputed").map(item => item.id);
  context.relationshipContradictions = context.relationships.filter(item => item.confidence === "disputed" || item.visibility !== "public").map(item => item.id);
  context.historicalEchoes = context.events.map(item => item.id);
  context.activePressures = collectContextPressureSummaries(context);
  return context;
}

export function validateStoryPremise(premise, universe = {}) {
  const errors = [];
  const warnings = [];
  if (!premise?.id || premise.entityType !== "storyPremise") errors.push("Premise identity is missing.");
  if (!premise?.seed) errors.push("Premise seed is missing.");
  if (!premise?.title) errors.push("Premise title is missing.");
  if (!premise?.logline) errors.push("Premise logline is missing.");
  if (!premise?.narrativeCore?.protagonistGoal) errors.push("Premise protagonist goal is missing.");
  if (!premise?.narrativeCore?.irreversibleChoice) errors.push("Premise central choice is missing.");
  if (!CANON_STATUSES.includes(premise?.canonStatus)) warnings.push("Canon status is not in the supported registry.");
  if (!STORY_STATUSES.includes(premise?.status)) warnings.push("Premise status is not in the supported registry.");
  if (premise?.canonStatus === "canon" && premise.generatedAdditions?.some(item => item.status === "suggestion")) warnings.push("Canon premise still contains unreviewed generated additions.");
  if (!premise?.sourceContext?.entityIds?.length) warnings.push("Premise has no linked source entities.");
  if (!premise?.protagonistModel?.focalCharacterId && !premise?.protagonistModel?.suggestedRole) warnings.push("No clear protagonist is attached.");
  if (!premise?.stakes?.personal) warnings.push("Personal stakes are weak or missing.");
  const knownIds = new Set(Object.values({
    systems: records(universe.systems),
    settlements: records(universe.settlements),
    organizations: records(universe.organizations),
    characters: records(universe.characters),
    conflicts: records(universe.conflicts),
    documents: records(universe.documents),
    historicalEvents: records(universe.historicalEvents),
    factions: records(universe.factions)
  }).flat().map(item => item.id));
  (premise?.sourceContext?.entityIds || []).forEach(id => {
    if (universe && knownIds.size && !knownIds.has(id) && !String(id).startsWith("relationship_")) warnings.push(`Linked entity ${id} is unresolved in this universe.`);
  });
  return { valid: !errors.length, errors, warnings };
}

export function evaluateStoryPremise(premise) {
  const scores = {
    specificity: scoreText(premise.logline, 8),
    protagonistAgency: premise.narrativeCore?.protagonistGoal ? 82 : 35,
    personalStakes: premise.stakes?.personal ? 78 : 30,
    externalStakes: premise.stakes?.local || premise.stakes?.systemic ? 76 : 35,
    urgency: premise.narrativeCore?.urgency ? 80 : 30,
    moralComplexity: premise.choiceArchitecture?.costOfA && premise.choiceArchitecture?.costOfB ? 84 : 40,
    conflictClarity: premise.oppositionModel?.goal ? 80 : 42,
    worldIntegration: Math.min(96, 40 + (premise.sourceContext?.entityIds?.length || 0) * 8),
    relationshipIntegration: Math.min(95, 35 + (premise.relationshipIds?.length || premise.sourceContext?.secondarySignalIds?.length || 0) * 14),
    novelty: premise.novelty?.score || 72,
    scaleDiscipline: scaleRisk(premise).severity === "warning" ? 55 : 82,
    escalationPotential: premise.escalation?.steps?.length >= 5 ? 84 : 48,
    endingPotential: premise.endingPossibilities?.options?.length >= 3 ? 80 : 42,
    continuityFit: (premise.continuity?.warnings?.length || 0) ? 58 : 86
  };
  return {
    scores,
    overall: Math.round(Object.values(scores).reduce((sum, value) => sum + value, 0) / Object.keys(scores).length),
    warnings: evaluationWarnings(premise, scores),
    strongestFeature: Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || "worldIntegration",
    weakestArea: Object.entries(scores).sort((a, b) => a[1] - b[1])[0]?.[0] || "specificity"
  };
}

export function analyzePremiseCoverage(universe = {}) {
  const premises = records(universe.storyPremises);
  const entities = ["characters", "settlements", "organizations", "conflicts", "documents", "factions", "historicalEvents"].flatMap(collection => records(universe[collection]).map(entity => ({ ...entity, coverageType: collection })));
  const counts = new Map();
  premises.forEach(premise => (premise.sourceContext?.entityIds || []).forEach(id => counts.set(id, (counts.get(id) || 0) + 1)));
  const overusedConflicts = records(universe.conflicts).filter(item => (counts.get(item.id) || 0) >= Math.max(2, premises.length * 0.6));
  return {
    totalPremises: premises.length,
    unusedMajorEntities: entities.filter(entity => !counts.get(entity.id)).slice(0, 24),
    underusedCharacters: records(universe.characters).filter(item => !counts.get(item.id)).slice(0, 12),
    underusedLocations: records(universe.settlements).filter(item => !counts.get(item.id)).slice(0, 12),
    overusedConflicts,
    duplicateConcepts: duplicatePremises(premises),
    missingProtagonists: premises.filter(item => !item.protagonistModel?.focalCharacterId && !item.protagonistModel?.suggestedRole),
    missingStakes: premises.filter(item => !item.stakes?.personal || !item.stakes?.local),
    byGenre: groupCount(premises, item => item.classification?.primaryGenre || "unknown"),
    byScale: groupCount(premises, item => item.classification?.storyScale || "unknown")
  };
}

export function storyPremiseMarkdown(premise) {
  return [
    `# ${premise.title}`,
    "",
    `Status: ${premise.status}`,
    `Canon: ${premise.canonStatus}`,
    `Genre: ${premise.classification.primaryGenre}`,
    `Scale: ${premise.classification.storyScale}`,
    "",
    "## Logline",
    premise.logline,
    "",
    "## Short Premise",
    premise.shortPremise,
    "",
    "## Narrative Core",
    ...Object.entries(premise.narrativeCore).map(([key, value]) => `- ${title(key)}: ${value}`),
    "",
    "## Stakes",
    `- Personal: ${premise.stakes.personal}`,
    `- Local: ${premise.stakes.local}`,
    `- Systemic: ${premise.stakes.systemic}`,
    "",
    "## Escalation",
    ...premise.escalation.steps.map((step, index) => `${index + 1}. ${step}`),
    "",
    "## Generated Additions",
    ...premise.sourceContext.generatedAdditions.map(item => `- ${item.field}: ${item.value} (${item.status})`)
  ].join("\n");
}

export function storySeedPackage(premise, universe = {}) {
  const ids = new Set(premise.sourceContext?.entityIds || []);
  const collect = collection => records(universe[collection]).filter(item => ids.has(item.id)).map(item => ({ id: item.id, entityType: item.entityType, name: nameOf(item), summary: item.summary || item.profile?.publicDescription || item.classification?.category || "" }));
  return {
    premise,
    protagonist: premise.protagonistModel,
    supportingCharacters: collect("characters").filter(item => item.id !== premise.protagonistModel.focalCharacterId),
    organizations: collect("organizations"),
    factions: collect("factions"),
    settlements: collect("settlements"),
    conflicts: collect("conflicts"),
    relationships: premise.sourceContext?.relationships || [],
    documents: collect("documents"),
    historicalContext: collect("historicalEvents"),
    canonConstraints: premise.continuity?.warnings || [],
    generatedAdditions: premise.sourceContext?.generatedAdditions || []
  };
}

function filterSignals(signals, constraints) {
  let filtered = signals;
  if (constraints.focus || constraints.character || constraints.organization || constraints.settlement || constraints.system || constraints.conflict || constraints.document || constraints.event || constraints.faction || constraints.relationship) {
    const focus = new Set([constraints.focus, constraints.character, constraints.organization, constraints.settlement, constraints.system, constraints.conflict, constraints.document, constraints.event, constraints.faction, constraints.relationship].filter(Boolean));
    filtered = signals.filter(signal => signal.sourceEntityIds.some(id => focus.has(id)) || focus.has(signal.source?.seed));
  }
  return filtered.length ? filtered : signals;
}

function classificationFor(root, constraints, signal) {
  const preferredGenre = normalizeChoice(constraints.genre || constraints.primaryGenre);
  const primaryGenre = PREMISE_GENRES.includes(preferredGenre) ? preferredGenre : genreForSignal(root.derive("genre"), signal);
  const secondaryGenres = unique([secondaryGenreFor(primaryGenre, signal), root.pick(PREMISE_GENRES)]).filter(item => item !== primaryGenre).slice(0, 2);
  const scale = normalizeChoice(constraints.scale);
  const storyScale = STORY_SCALES.includes(scale) ? scale : scaleForSignal(root.derive("scale"), signal);
  const tone = normalizeChoice(constraints.tone);
  return {
    storyScale,
    primaryGenre,
    secondaryGenres,
    tone: unique([PREMISE_TONES.includes(tone) ? tone : toneForGenre(primaryGenre), signal.severity > 78 ? "urgent" : "restrained"]).slice(0, 3),
    narrativeMode: modeForGenre(primaryGenre, constraints.mode),
    timeStructure: primaryGenre.includes("historical") ? "dual-timeline" : "linear"
  };
}

function narrativeCoreFor(root, classification, context, signal, secondarySignals, protagonist, opposition) {
  const incident = incidentFor(root.derive("inciting-incident"), classification.primaryGenre, signal);
  const location = context.availableLocations[0]?.label || "the archive";
  const goal = goalFor(classification.primaryGenre, signal, protagonist);
  return {
    protagonistNeed: protagonist.internalNeed,
    protagonistGoal: goal,
    startingSituation: `${protagonist.label} is already entangled with ${signal.summary}`,
    incitingIncident: incident,
    centralProblem: `${signal.detail || signal.summary} can no longer remain background pressure.`,
    opposingForce: opposition.label,
    primaryObstacle: opposition.leverage,
    urgency: urgencyFor(root.derive("urgency"), classification, signal, context),
    irreversibleChoice: choicePrompt(signal, protagonist, opposition),
    narrativeQuestion: `Can ${protagonist.label} ${goal.toLowerCase()} before ${opposition.label.toLowerCase()} makes the cost irreversible?`,
    narrativePromise: promiseFor(classification.primaryGenre, location, signal, secondarySignals)
  };
}

function selectProtagonist(rng, context, signal, constraints) {
  const requested = context.characters.find(item => item.id === constraints.protagonist || item.seed === constraints.protagonist);
  const ranked = context.characters.map(character => {
    const linked = signal.sourceEntityIds.includes(character.id) ? 36 : 0;
    const relationship = (character.relationships?.length || 0) * 5 + (character.entityRelationships?.length || 0) * 6;
    const roleAccess = /auditor|security|director|officer|representative|archivist|scientist|chief/i.test(nameOf(character) + " " + (character.role || character.profile?.role || "")) ? 12 : 0;
    return { character, score: linked + relationship + roleAccess + Math.abs(hashString(`${signal.id}:${character.id}`)) % 18 };
  }).sort((a, b) => b.score - a.score);
  const character = requested || ranked[0]?.character;
  if (character) {
    return {
      focalCharacterId: character.id,
      label: nameOf(character),
      externalGoal: `act on ${signal.signalType.replaceAll("-", " ")}`,
      internalNeed: character.innerConflict?.need || character.psychology?.need || "decide what loyalty is worth when survival and truth diverge",
      fear: character.psychology?.fear || "becoming useful to the wrong side",
      misbelief: character.psychology?.misbelief || "",
      leverage: character.role || character.profile?.role || "access to people who trust them",
      vulnerability: character.vulnerability || character.psychology?.wound || "their relationships make neutrality impossible",
      relevantSkill: character.skills?.[0] || character.profile?.competence || "procedural knowledge",
      relationshipPressure: character.relationships?.[0]?.secret || character.relationships?.[0]?.obligation || "a private tie complicates public duty",
      reasonToActNow: "they are close enough to the pressure to see the cost before it becomes official history",
      costOfRefusal: "someone else defines the truth and the vulnerable pay for it",
      potentialTransformation: "from careful functionary to accountable actor"
    };
  }
  const role = rng.pick(PROTAGONIST_ROLES);
  return {
    focalCharacterId: null,
    suggestedRole: role,
    label: `A ${role}`,
    externalGoal: `prove what ${signal.signalType.replaceAll("-", " ")} really means`,
    internalNeed: "choose responsibility before permission arrives",
    fear: "losing their place in the only system that can protect them",
    leverage: "low-level access and practical competence",
    vulnerability: "no formal power",
    relevantSkill: role.includes("archivist") ? "source authentication" : role.includes("technician") ? "infrastructure knowledge" : "institutional navigation",
    relationshipPressure: "a new role must be generated and linked before this becomes canon",
    reasonToActNow: "the pressure has reached the person least able to ignore it",
    costOfRefusal: "the crisis becomes policy without a witness",
    potentialTransformation: "from replaceable specialist to moral center",
    promotion: { targetModule: "characters", status: "suggestion", suggestedSeed: deriveSeed(signal.id, role) }
  };
}

function selectOpposition(rng, context, signal, protagonist, constraints) {
  const pools = [context.organizations, context.factions, context.conflicts, context.settlements].flat();
  const linked = pools.filter(item => signal.sourceEntityIds.includes(item.id) && item.id !== protagonist.focalCharacterId);
  const entity = linked[0] || pools[0];
  if (entity) {
    return {
      entityId: entity.id,
      entityType: entity.entityType || inferType(entity),
      label: nameOf(entity),
      goal: oppositionGoal(entity, signal),
      rationale: "it believes stability, legitimacy, or survival depends on controlling the story pressure",
      resources: resourcesForOpposition(entity),
      leverage: leverageForOpposition(entity, signal),
      constraints: "open force would expose the compromise it needs to preserve",
      relationshipToProtagonist: signal.sourceEntityIds.includes(protagonist.focalCharacterId) ? "directly entangled" : "institutionally connected",
      publicPosition: "responsible management of a dangerous situation",
      hiddenPosition: "delay, redirect, or weaponize the revelation",
      sympatheticPoint: "panic could genuinely make the underlying danger worse",
      escalationCapacity: "legal pressure, access denial, reputational harm, and selective disclosure"
    };
  }
  return {
    entityId: null,
    entityType: "condition",
    label: rng.pick(["a failing infrastructure system", "a historical legacy", "a closing deadline"]),
    goal: "continue unchecked",
    rationale: "no one designed it as evil, but everyone adapted around its harm",
    resources: ["scarcity", "bureaucracy", "public fear"],
    leverage: "inaction looks safer than disruption",
    constraints: "it can only escalate through existing institutions",
    relationshipToProtagonist: "environmental and moral pressure",
    publicPosition: "there is no single culprit",
    hiddenPosition: "the system protects itself through habit",
    sympatheticPoint: "many people depend on the same broken arrangement",
    escalationCapacity: "deadline compression and cascading failure"
  };
}

function stakesFor(rng, classification, context, signal, protagonist, opposition) {
  const location = context.availableLocations[0]?.label || "one vulnerable community";
  return {
    personal: `${protagonist.label} risks ${rng.pick(["career", "belonging", "freedom", "moral credibility", "a crucial relationship"])} by acting before certainty is comfortable.`,
    local: `${location} could absorb the cost through ${signal.signalType.replaceAll("-", " ")}.`,
    systemic: scaleIsSmall(classification.storyScale) ? "The larger order remains background pressure, keeping the story focused." : `${opposition.label} could turn the crisis into precedent for every linked institution.`,
    calibration: scaleIsSmall(classification.storyScale) ? "local and personal" : "institutional with wider consequences"
  };
}

function choiceFor(rng, signal, protagonist, opposition, stakes) {
  const choice = rng.pick([
    ["loyalty", "truth"], ["survival", "justice"], ["exposure", "stability"], ["reform", "revolution"], ["personal rescue", "collective survival"], ["autonomy", "protection"]
  ]);
  return {
    optionA: { label: title(choice[0]), promise: `Protect ${stakes.local.toLowerCase()}` },
    optionB: { label: title(choice[1]), promise: `Expose what ${opposition.label} needs hidden.` },
    hiddenOption: "make the source of pressure visible without letting either side own the interpretation",
    costOfA: `${protagonist.label} may preserve order by becoming complicit.`,
    costOfB: `The truth may harm people who cannot survive the shock.`,
    temptation: `Let ${opposition.label} handle it quietly.`,
    moralPressure: choicePrompt(signal, protagonist, opposition),
    irreversiblePoint: "once the evidence, failure, or accusation becomes public, private repair is no longer possible"
  };
}

function escalationFor(rng, classification, signal, opposition) {
  const modes = ["initial disruption", "first obstacle", "deeper implication", "relationship complication", "institutional counteraction", "irreversible exposure", "final choice pressure"];
  return {
    mode: escalationModeFor(classification.primaryGenre),
    steps: modes.map((mode, index) => {
      const detail = [
        `${signal.summary}`,
        `${opposition.label} blocks access, denies standing, or changes the public narrative.`,
        `The pressure traces back to another linked entity rather than one isolated mistake.`,
        `A relationship becomes more costly than the external problem.`,
        `The institution retaliates while still sounding reasonable.`,
        `A secret spreads, a deadline advances, or the safe option disappears.`,
        `The protagonist must choose what kind of damage they can live with.`
      ][index];
      return `${title(mode)}: ${detail}`;
    })
  };
}

function twistFor(rng, classification, signal, context) {
  const options = [
    "The document is authentic but misleading.",
    "The apparent antagonist is protecting a larger necessity.",
    "A trusted relationship is asymmetric.",
    "A public victory strengthens the underlying dependency.",
    "A suppressed historical event changes the legitimacy of every current claim."
  ];
  return {
    intensity: classification.primaryGenre.includes("mystery") || classification.primaryGenre.includes("thriller") ? "high" : "moderate",
    options: rng.shuffle(options).slice(0, 3).map(value => ({ value, groundedIn: signal.sourceEntityIds.slice(0, 3), status: "suggestion" }))
  };
}

function endingsFor(rng, classification, choice) {
  const pool = ["victory with cost", "partial success", "moral compromise", "institutional reform", "exposure without justice", "personal rescue, systemic failure", "systemic victory, personal loss", "negotiated settlement", "tragic failure", "ambiguous survival", "revelation changes future conflict", "apparent victory creates sequel pressure"];
  return {
    openness: classification.storyScale === "series" || classification.storyScale === "campaign-arc" ? "open-ended" : "flexible",
    options: rng.shuffle(pool).slice(0, 4).map(family => ({ family, implication: `${title(family)} shaped by ${choice.optionA.label.toLowerCase()} versus ${choice.optionB.label.toLowerCase()}.` }))
  };
}

function themeFor(classification, signal, choice) {
  const subject = signal.signalType.replaceAll("-", " ");
  return {
    themes: unique(["loyalty", "institutional responsibility", "historical truth", subject].map(slug)).slice(0, 4),
    thematicQuestions: [
      `Who owns the truth when revealing it could harm the people it should protect?`,
      `Can ${choice.optionA.label.toLowerCase()} survive without betraying ${choice.optionB.label.toLowerCase()}?`,
      `When does stability become another form of violence?`
    ]
  };
}

function generatedAdditionsFor(core, protagonist, opposition, signal) {
  const additions = [
    { field: "incitingIncident", value: core.incitingIncident, status: "suggestion", canonStatus: "non-canon-concept" },
    { field: "proposedFuturePressure", value: core.urgency, status: "suggestion", canonStatus: "non-canon-concept" }
  ];
  if (!protagonist.focalCharacterId) additions.push({ field: "protagonist", value: protagonist.label, status: "suggestion", promotionTarget: "characters", seed: protagonist.promotion?.suggestedSeed });
  if (!opposition.entityId) additions.push({ field: "opposingForce", value: opposition.label, status: "suggestion" });
  if (!signal.sourceEntityIds.length) additions.push({ field: "proposedConflict", value: signal.summary, status: "suggestion", promotionTarget: "conflicts" });
  return additions;
}

function validateStoryPremiseDraft(context, entityIds, classification) {
  const warnings = [];
  if (!context.usesExistingWorld) warnings.push({ severity: "warning", message: "Premise is relying on generated connective material because no saved world context was available." });
  if (scaleIsSmall(classification.storyScale) && entityIds.length > 8) warnings.push({ severity: "warning", message: "Premise may be too broad for the selected story scale." });
  if (classification.primaryGenre.includes("mystery") && !context.documents.length && !context.events.length) warnings.push({ severity: "notice", message: "Mystery framing may need a document, testimony, or historical source." });
  if (context.branchId && classification.timeStructure === "linear") warnings.push({ severity: "notice", message: "Branch-specific context should be labeled in the premise notes." });
  return {
    branchId: context.branchId,
    warnings,
    viewpointKnowledge: {
      hiddenRelationshipIds: context.relationshipContradictions,
      accessibleDocumentIds: context.documents.map(item => item.id),
      risk: context.relationshipContradictions.length ? "viewpoint may reveal hidden knowledge" : "low"
    },
    complexity: complexityFor(context, entityIds)
  };
}

function developmentNotesFor(classification, context, additions) {
  return {
    checklist: [
      "Protagonist selected",
      "Goal clear",
      "Stakes defined",
      "Opposition defined",
      "Urgency defined",
      "Central choice defined",
      "Source context linked",
      additions.length ? "Generated additions need review" : "No generated additions beyond premise framing"
    ],
    requiredNewMaterial: additions.filter(item => item.promotionTarget).map(item => ({ label: item.value, targetModule: item.promotionTarget, status: item.status })),
    promotionHooks: ["characters", "conflicts", "documents", "timeline", "relationships", "factions"].map(module => ({ module, status: "available" }))
  };
}

function signal(category, signalType, sourceEntityIds, summary, detail, source) {
  return {
    id: `signal_${hashString(`${category}:${signalType}:${sourceEntityIds.join(":")}:${summary}`).toString(36)}`,
    entityType: "narrativePressureSignal",
    signalType,
    category,
    sourceEntityIds: unique(sourceEntityIds.filter(Boolean)),
    summary,
    detail: detail || summary,
    severity: 50,
    immediacy: 50,
    personalizability: 50,
    storyPotential: 50,
    evidenceIds: source?.documentIds || source?.sourceDocumentIds || [],
    tags: unique([category, signalType, ...String(summary).toLowerCase().match(/[a-z]{4,}/g) || []]).slice(0, 8),
    source
  };
}

function scoreSignal(raw, context) {
  const base = Math.abs(hashString(`${raw.id}:${context.sourceContextHash}`));
  const linkedCharacters = raw.sourceEntityIds.filter(id => context.characters.some(item => item.id === id)).length;
  const linkedInstitutions = raw.sourceEntityIds.filter(id => context.organizations.some(item => item.id === id) || context.factions.some(item => item.id === id)).length;
  const hidden = /hidden|secret|suppressed|disputed|betrayal|liability|contradiction/.test(`${raw.signalType} ${raw.detail}`);
  const severity = clamp(42 + (base % 30) + linkedInstitutions * 7 + (hidden ? 12 : 0), 1, 100);
  const immediacy = clamp(38 + ((base >>> 4) % 35) + (raw.category === "conflict" ? 16 : 0), 1, 100);
  const personalizability = clamp(40 + ((base >>> 9) % 35) + linkedCharacters * 18 + (raw.category === "relationship" ? 15 : 0), 1, 100);
  const storyPotential = Math.round(severity * 0.32 + immediacy * 0.24 + personalizability * 0.28 + (raw.sourceEntityIds.length ? 16 : 4));
  return { ...raw, severity, immediacy, personalizability, storyPotential };
}

function fallbackSignal(context, seed) {
  return scoreSignal(signal("generated", "unresolved-story-pressure", context.sourceEntityIds.slice(0, 3), "The universe contains an implied pressure that needs a focal human choice.", "More saved entities will make this premise more specific.", { id: seed }), context);
}

function genreForSignal(rng, signal) {
  if (signal.category === "document") return rng.pick(["science-fiction-mystery", "legal-drama", "institutional-thriller", "espionage"]);
  if (signal.category === "faction") return rng.pick(["political-thriller", "rebellion", "resistance", "diplomatic-drama"]);
  if (signal.category === "settlement") return rng.pick(["survival", "disaster", "social-science-fiction", "political-thriller"]);
  if (signal.category === "relationship") return rng.pick(["psychological-drama", "romance", "noir", "tragedy"]);
  if (signal.category === "historical") return rng.pick(["historical-science-fiction", "archaeological-mystery", "science-fiction-mystery"]);
  if (signal.category === "organization") return rng.pick(["corporate-intrigue", "institutional-thriller", "technological-thriller"]);
  if (signal.category === "conflict") return rng.pick(["political-thriller", "military-science-fiction", "war-story", "survival"]);
  return rng.pick(PREMISE_GENRES);
}

function secondaryGenreFor(primary, signal) {
  if (primary.includes("mystery")) return "institutional-thriller";
  if (primary.includes("thriller")) return signal.category === "document" ? "science-fiction-mystery" : "political-thriller";
  if (primary === "romance") return "political-thriller";
  if (primary === "survival") return "social-science-fiction";
  return signal.category === "historical" ? "historical-science-fiction" : "psychological-drama";
}

function scaleForSignal(rng, signal) {
  if (signal.sourceEntityIds.length <= 3 || signal.category === "relationship") return rng.pick(["short-story", "novelette", "novella"]);
  if (signal.category === "conflict" || signal.category === "faction") return rng.pick(["novella", "novel", "anthology-episode"]);
  return rng.pick(["short-story", "novella", "novel"]);
}

function toneForGenre(genre) {
  if (genre.includes("mystery")) return "procedural";
  if (genre.includes("thriller")) return "tense";
  if (genre === "romance") return "intimate";
  if (genre === "tragedy") return "tragic";
  if (genre === "survival") return "claustrophobic";
  return "morally-complex";
}

function modeForGenre(genre, mode) {
  const normalized = normalizeChoice(mode);
  if (NARRATIVE_MODES.includes(normalized)) return normalized;
  if (genre.includes("mystery")) return "investigator-centered";
  if (genre.includes("historical")) return "nonlinear-historical-reconstruction";
  if (genre === "corporate-intrigue") return "institution-centered";
  if (genre === "romance") return "dual-protagonist";
  return "single-protagonist";
}

function incidentFor(rng, genre, signal) {
  const key = genre.includes("mystery") ? "mystery" : genre.includes("thriller") ? "thriller" : genre.includes("political") || genre.includes("diplomatic") || genre.includes("rebellion") ? "political" : INCIDENTS[genre] ? genre : signal.category === "document" ? "mystery" : "thriller";
  return `${rng.pick(INCIDENTS[key] || INCIDENTS.thriller)} connected to ${signal.signalType.replaceAll("-", " ")}`;
}

function goalFor(genre, signal, protagonist) {
  if (genre.includes("mystery")) return `authenticate the truth behind ${signal.signalType.replaceAll("-", " ")}`;
  if (genre.includes("thriller")) return `stop the pressure from becoming irreversible`;
  if (genre === "survival" || genre === "disaster") return `keep the vulnerable alive without surrendering the truth`;
  if (genre === "heist") return `obtain the proof or resource no official channel will release`;
  if (genre === "romance") return `protect a bond that makes public duty harder`;
  return protagonist.externalGoal || `force a choice around ${signal.signalType.replaceAll("-", " ")}`;
}

function urgencyFor(rng, classification, signal, context) {
  const deadlines = ["election", "trial", "launch", "contract renewal", "document release", "public vote", "infrastructure failure", "historical anniversary", "military deadline", "diplomatic summit"];
  const location = context.availableLocations[0]?.label || "the local archive";
  return `A ${rng.pick(deadlines)} in ${location} turns ${signal.signalType.replaceAll("-", " ")} from background pressure into a closing deadline.`;
}

function promiseFor(genre, location, signal) {
  if (genre.includes("mystery")) return `A procedural investigation through ${location} where evidence changes political meaning.`;
  if (genre.includes("political")) return `A tense negotiation where every ally wants a different version of ${signal.signalType.replaceAll("-", " ")}.`;
  if (genre === "survival") return `A survival story driven by infrastructure knowledge and social trust.`;
  if (genre === "romance") return `An intimate relationship story under institutional pressure.`;
  return `A focused story about a specific choice that could only happen in ${location}.`;
}

function escalationModeFor(genre) {
  if (genre.includes("mystery")) return "investigation deepens";
  if (genre.includes("thriller")) return "institution retaliates";
  if (genre === "survival" || genre === "disaster") return "resource condition worsens";
  if (genre === "romance") return "personal relationship is threatened";
  if (genre === "heist") return "safe option disappears";
  if (genre.includes("political") || genre.includes("rebellion") || genre.includes("diplomatic")) return "alliance fractures";
  if (genre.includes("historical")) return "historical evidence changes interpretation";
  return "conflict becomes public";
}

function loglineFor(protagonist, core, opposition, stakes, choice) {
  return `When ${core.incitingIncident}, ${protagonist.label} must ${core.protagonistGoal.toLowerCase()} against ${opposition.label}, risking ${stakes.personal.toLowerCase()} while choosing between ${choice.optionA.label.toLowerCase()} and ${choice.optionB.label.toLowerCase()}.`;
}

function shortPremiseFor(context, protagonist, core, opposition, stakes, choice) {
  return `${core.startingSituation}. ${title(core.incitingIncident)} forces them to ${core.protagonistGoal.toLowerCase()} while ${opposition.label} frames resistance as danger. The story stays grounded in ${context.availableLocations[0]?.label || "the existing universe"} and turns on a costly decision: ${choice.moralPressure}. The local stakes are ${stakes.local.toLowerCase()}, while the personal cost is ${stakes.personal.toLowerCase()}.`;
}

function extendedPremiseFor(context, protagonist, core, opposition, stakes, choice, escalation, twist, endings) {
  return `${core.startingSituation}. The pressure is not invented from nowhere; it is drawn from linked conflicts, relationships, documents, factions, places, or historical records already present in the archive. ${title(core.incitingIncident)} gives ${protagonist.label} a concrete reason to act now. ${opposition.label} has an understandable goal: ${opposition.goal}. That makes the conflict harder than a simple exposure plot, because ${opposition.sympatheticPoint}.\n\n${protagonist.label} tries to ${core.protagonistGoal.toLowerCase()}, but the first obstacle reveals a deeper implication and a relationship complication. ${escalation.steps.slice(1, 5).join(" ")} The story promise is ${core.narrativePromise.toLowerCase()}.\n\nThe central choice is not cost-free. ${choice.costOfA} ${choice.costOfB} Possible turns include ${twist.options.map(item => item.value.toLowerCase()).join("; ")}. Ending directions remain open: ${endings.options.map(item => item.family).join(", ")}.`;
}

function titleFor(rng, context, signal, classification) {
  const place = context.availableLocations[0]?.label?.split(/\s+/).slice(0, 2).join(" ") || "";
  const noun = signal.signalType.split("-").at(-1);
  const options = [
    `${title(noun)} at ${place || "the Edge"}`,
    `The ${title(noun)} File`,
    `${place ? `${place} ` : ""}${classification.primaryGenre.includes("mystery") ? "Evidence" : "Pressure"}`,
    `What ${place || "the Archive"} Costs`,
    `The ${title(signal.category)} Compromise`
  ];
  return rng.pick(options).replace(/\s+/g, " ").trim();
}

function workingTitleFor(root, signal, context) {
  return `${context.availableLocations[0]?.label || title(signal.category)} ${title(signal.signalType.split("-").slice(-1)[0])}`;
}

function noveltyFor(premise, existing = []) {
  const overlaps = existing.map(other => {
    const shared = intersection(premise.sourceContext?.entityIds || [], other.sourceContext?.entityIds || []);
    const sameFrame = premise.protagonistModel?.focalCharacterId && premise.protagonistModel.focalCharacterId === other.protagonistModel?.focalCharacterId ? 2 : 0;
    return { premiseId: other.id, score: shared.length + sameFrame, sharedEntityIds: shared };
  }).filter(item => item.score > 1).sort((a, b) => b.score - a.score);
  return {
    classification: overlaps[0]?.score >= 5 ? "near-duplicate" : overlaps[0]?.score >= 3 ? "alternate-framing" : "distinct-enough",
    score: overlaps[0] ? Math.max(35, 90 - overlaps[0].score * 12) : 88,
    overlaps
  };
}

function evaluationWarnings(premise, scores) {
  const warnings = [];
  if (scores.specificity < 55) warnings.push("Premise may be too vague.");
  if (scores.personalStakes < 55) warnings.push("Personal stakes need sharpening.");
  if (scores.worldIntegration < 55) warnings.push("Source context is thin.");
  const scale = scaleRisk(premise);
  if (scale.severity === "warning") warnings.push(scale.message);
  if (!premise.relationshipIds.length && !premise.sourceContext?.secondarySignalIds?.length) warnings.push("No personal relationship pressure is visible yet.");
  return warnings;
}

function scaleRisk(premise) {
  const sourceCount = premise.sourceContext?.entityIds?.length || 0;
  if (scaleIsSmall(premise.classification?.storyScale) && sourceCount > 8) return { severity: "warning", message: "Premise may be too broad for selected scale." };
  if (["novel", "series", "campaign-arc"].includes(premise.classification?.storyScale) && sourceCount < 4) return { severity: "notice", message: "Large scale may need additional linked pressures." };
  return { severity: "ok", message: "Scale fits current complexity." };
}

function duplicatePremises(premises) {
  const groups = [];
  premises.forEach((premise, index) => {
    premises.slice(index + 1).forEach(other => {
      const shared = intersection(premise.sourceContext?.entityIds || [], other.sourceContext?.entityIds || []);
      if (shared.length >= 4 || (premise.protagonistModel?.focalCharacterId && premise.protagonistModel.focalCharacterId === other.protagonistModel?.focalCharacterId && premise.classification?.primaryGenre === other.classification?.primaryGenre)) {
        groups.push({ ids: [premise.id, other.id], sharedEntityIds: shared, warningType: "near-duplicate" });
      }
    });
  });
  return groups;
}

function collectContextPressureSummaries(context) {
  return [
    ...context.conflicts.map(item => `${nameOf(item)} remains unresolved.`),
    ...context.factions.map(item => `${nameOf(item)} has factional pressure.`),
    ...context.relationships.slice(0, 6).map(item => `${item.label || item.relationshipType} links ${item.sourceEntityId} and ${item.targetEntityId}.`)
  ].slice(0, 12);
}

function records(collection) {
  return (collection || []).map(record => {
    if (record?.id && record?.entityType) return record;
    return record?.entity || record?.system || record?.settlement || record?.organization || record?.character || record?.conflict || record?.document || record?.timeline || record?.historicalEvent || record?.faction || record?.storyPremise || record;
  }).filter(Boolean);
}

function chronologyBounds(events, conflicts) {
  const dates = [...events.map(item => item.chronology?.sortYear || item.chronology?.startDate || item.year), ...conflicts.map(item => item.timeline?.startYear)].map(Number).filter(Boolean);
  return dates.length ? { earliest: Math.min(...dates), latest: Math.max(...dates) } : {};
}

function complexityFor(context, entityIds) {
  const count = entityIds.length;
  return {
    majorCharacters: context.characters.length,
    organizations: context.organizations.length,
    factions: context.factions.length,
    conflicts: context.conflicts.length,
    locations: context.settlements.length + context.systems.length,
    secrets: context.hiddenInformation.length + context.relationshipContradictions.length,
    chronologyLayers: context.events.length,
    branchDependencies: context.branchId ? 1 : 0,
    generatedAdditions: 0,
    label: count <= 4 ? "focused" : count <= 8 ? "moderate" : count <= 13 ? "complex" : "sprawling"
  };
}

function idsFor(items, sourceIds) {
  const source = new Set(sourceIds);
  return items.filter(item => source.has(item.id)).map(item => item.id);
}

function resourcesForOpposition(entity) {
  if (entity.entityType === "organization" || entity.identity?.name) return ["contracts", "records", "employment pressure", "infrastructure access"];
  if (entity.entityType === "faction") return ["constituency", "rumor network", "organized pressure", "symbolic legitimacy"];
  if (entity.entityType === "conflict") return ["fear", "urgency", "mobilized parties"];
  return ["legal authority", "scarcity", "public narrative"];
}

function leverageForOpposition(entity, signal) {
  if (entity.entityType === "organization" || entity.identity?.name) return "control of jobs, records, procedures, or necessary systems";
  if (entity.entityType === "faction") return "a believable claim to represent people the protagonist cannot ignore";
  if (signal.category === "settlement") return "the threat that public truth will become panic";
  return "access to the official explanation";
}

function oppositionGoal(entity, signal) {
  if (entity.entityType === "faction") return `turn ${signal.signalType.replaceAll("-", " ")} into legitimacy`;
  if (entity.entityType === "organization" || entity.identity?.name) return `keep ${signal.signalType.replaceAll("-", " ")} manageable and deniable`;
  if (entity.entityType === "conflict") return "force every participant into a more dangerous position";
  return `survive the exposure of ${signal.signalType.replaceAll("-", " ")}`;
}

function relationshipSignalType(rel) {
  if (rel.visibility !== "public") return "secret-alliance";
  if (rel.confidence === "disputed") return "political-rivalry";
  if (rel.strength?.value >= 70) return "coercive-dependency";
  return "incompatible-loyalties";
}

function pickType(category, id = "") {
  const options = SIGNAL_TYPES[category] || ["unresolved-story-pressure"];
  return options[Math.abs(hashString(`${category}:${id}`)) % options.length];
}

function scoreText(text, floor = 0) {
  const words = String(text || "").split(/\s+/).filter(Boolean).length;
  return clamp(floor + words * 3, floor, 92);
}

function colorFor(genre) {
  if (genre.includes("mystery")) return "#76d5d7";
  if (genre.includes("political") || genre.includes("rebellion")) return "#d8b45c";
  if (genre.includes("survival") || genre.includes("disaster")) return "#d88972";
  if (genre.includes("romance") || genre.includes("drama")) return "#f0a1b2";
  return "#a6b7ff";
}

function normalizeStatus(value) {
  const normalized = normalizeChoice(value);
  return STORY_STATUSES.includes(normalized) ? normalized : "generated";
}

function normalizeCanonStatus(value) {
  const normalized = normalizeChoice(value);
  return CANON_STATUSES.includes(normalized) ? normalized : "non-canon-concept";
}

function normalizeChoice(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "-");
}

function title(value) {
  return String(value || "").replace(/([A-Z])/g, " $1").replace(/[-_]+/g, " ").replace(/\b\w/g, char => char.toUpperCase()).trim();
}

function nameOf(entity) {
  if (!entity) return "";
  return entity.name?.full || entity.identity?.name || entity.name || entity.title || entity.shortName || entity.id || "";
}

function labelOf(value) {
  return String(value || "").replace(/^.+?_/, "").replace(/[-_]+/g, " ");
}

function textOf(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.summary || value.description || value.name || value.title || "";
}

function idsFrom(items = [], key = "id") {
  return (items || []).map(item => item?.[key] || item?.id).filter(Boolean);
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

function dedupeSignals(signals) {
  const seen = new Map();
  signals.forEach(item => {
    const key = `${item.category}:${item.signalType}:${item.sourceEntityIds.slice().sort().join("|")}`;
    if (!seen.has(key) || seen.get(key).storyPotential < item.storyPotential) seen.set(key, item);
  });
  return [...seen.values()];
}

function scaleIsSmall(scale) {
  return ["flash-fiction", "short-story", "vignette"].includes(scale);
}

function choicePrompt(signal, protagonist, opposition) {
  return `whether to protect ${opposition.label}'s fragile stability or expose ${signal.signalType.replaceAll("-", " ")} at personal cost`;
}

function intersection(a = [], b = []) {
  const set = new Set(b);
  return unique(a.filter(item => set.has(item)));
}

function unique(items) {
  return [...new Set(items.flat().filter(Boolean))];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
