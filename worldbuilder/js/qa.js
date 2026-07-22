const seeds = ["repeat-seed", "kestrel-4821", "blacktide-nav", "mneme-vault", "severe-risk-check"];
const results = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runQa() {
  assert(window.ICR, "ICR API missing");
  assert(window.SciFiWorldbuilder, "Sci-Fi Worldbuilder API missing");
  assert(window.ICR.INDUSTRIES.length >= 30, "Expected at least 30 industries");
  for (const seed of seeds) {
    const first = window.ICR.generateOrganization(seed);
    const second = window.ICR.generateOrganization(seed);
    assert(JSON.stringify(first) === JSON.stringify(second), `Seed ${seed} is not deterministic`);
    assert(first.documents.length >= 5, `Seed ${seed} generated too few documents`);
    assert(first.relationships.length >= 4, `Seed ${seed} generated too few relationships`);
    const ids = new Set(first.documents.map(doc => doc.id));
    assert(ids.size === first.documents.length, `Seed ${seed} has duplicate document ids`);
    for (const tab of window.ICR.TABS) {
      const html = window.ICR.renderTab(first, tab);
      assert(html && html.length > 100, `Seed ${seed} rendered an empty ${tab} tab`);
    }
    results.push({ seed, name: first.identity.name, documents: first.documents.length, incidents: first.incidents.length, locations: first.locations.length });
  }
  const firstSystem = window.SciFiWorldbuilder.generateStarSystem("meridian-7k2m91");
  const secondSystem = window.SciFiWorldbuilder.generateStarSystem("meridian-7k2m91");
  assert(JSON.stringify(firstSystem) === JSON.stringify(secondSystem), "Star system generation is not deterministic");
  assert(firstSystem.entityType === "star-system", "System entity type missing");
  assert(firstSystem.orbitalBodies.length >= 3, "System generated too few bodies");
  assert(firstSystem.settlements.length >= 1, "System generated no settlement summaries");
  assert(firstSystem.stations.length >= 1, "System generated no stations");
  assert(firstSystem.routes.length >= 1, "System generated no routes");
  assert(firstSystem.importantOrganizations.length >= 3, "System generated too few organization hooks");
  const firstSettlement = window.SciFiWorldbuilder.generateSettlement("port-meridian-4821");
  const secondSettlement = window.SciFiWorldbuilder.generateSettlement("port-meridian-4821");
  assert(JSON.stringify(firstSettlement) === JSON.stringify(secondSettlement), "Settlement generation is not deterministic");
  assert(firstSettlement.entityType === "settlement", "Settlement entity type missing");
  assert(firstSettlement.districts.length >= 2, "Settlement generated too few districts");
  assert(firstSettlement.government.notableLaws.length >= 3, "Settlement generated too few local laws");
  assert(firstSettlement.infrastructure.utilities.length >= 5, "Settlement generated too few utilities");
  assert(firstSettlement.storyHooks.length >= 3, "Settlement generated too few story hooks");
  const summarySettlement = window.SciFiWorldbuilder.generateSettlement(firstSystem.settlements[0].seed, {
    summary: firstSystem.settlements[0],
    context: {
      system: firstSystem,
      body: firstSystem.orbitalBodies.find(body => body.id === firstSystem.settlements[0].bodyId),
      source: {
        type: "promoted-summary",
        parentEntityId: firstSystem.id,
        parentObjectId: firstSystem.settlements[0].id
      }
    }
  });
  assert(summarySettlement.source.type === "promoted-summary", "Promoted settlement source missing");
  assert(summarySettlement.source.parentEntityId === firstSystem.id, "Promoted settlement parent system missing");
  assert(summarySettlement.relationships.some(rel => rel.toEntityType === "star-system"), "Promoted settlement relationship missing");
  const savedOrgContext = window.ICR.generateOrganization("character-employer-context");
  const firstCharacter = window.SciFiWorldbuilder.generateCharacter("elena-voric-4821", {
    context: {
      settlement: firstSettlement,
      organization: savedOrgContext
    }
  });
  const secondCharacter = window.SciFiWorldbuilder.generateCharacter("elena-voric-4821", {
    context: {
      settlement: firstSettlement,
      organization: savedOrgContext
    }
  });
  assert(JSON.stringify(firstCharacter) === JSON.stringify(secondCharacter), "Character generation is not deterministic");
  assert(firstCharacter.entityType === "character", "Character entity type missing");
  assert(firstCharacter.relationships.length >= 4, "Character generated too few people relationships");
  assert(firstCharacter.relationships.every(rel => rel.obligation && rel.secret && typeof rel.trust === "number"), "Character relationships are not structured core data");
  assert(firstCharacter.entityRelationships.some(rel => rel.toEntityType === "settlement"), "Character settlement relationship missing");
  assert(firstCharacter.entityRelationships.some(rel => rel.toEntityType === "organization"), "Character organization relationship missing");
  assert(firstCharacter.network.relationshipDensity === firstCharacter.relationships.length, "Character network metrics mismatch");
  const firstConflict = window.SciFiWorldbuilder.generateConflict("meridian-air-crisis-2291", {
    context: {
      system: firstSystem,
      settlement: firstSettlement,
      organization: savedOrgContext,
      character: firstCharacter,
      tension: firstSettlement.tensions[0]
    }
  });
  const secondConflict = window.SciFiWorldbuilder.generateConflict("meridian-air-crisis-2291", {
    context: {
      system: firstSystem,
      settlement: firstSettlement,
      organization: savedOrgContext,
      character: firstCharacter,
      tension: firstSettlement.tensions[0]
    }
  });
  assert(JSON.stringify(firstConflict) === JSON.stringify(secondConflict), "Conflict generation is not deterministic");
  assert(firstConflict.entityType === "conflict", "Conflict entity type missing");
  assert(firstConflict.affectedEntities.some(entity => entity.id === firstSettlement.id), "Conflict did not consume existing settlement");
  assert(firstConflict.affectedEntities.some(entity => entity.id === savedOrgContext.id), "Conflict did not consume existing organization");
  assert(firstConflict.affectedEntities.some(entity => entity.id === firstCharacter.id), "Conflict did not consume existing character");
  assert(firstConflict.source || firstConflict.classification.scope, "Conflict source or classification missing");
  assert(firstConflict.parties.length >= 3, "Conflict generated too few parties");
  assert(firstConflict.escalation.ladder.length >= 4, "Conflict escalation ladder missing");
  const firstDocument = window.SciFiWorldbuilder.generateDocument("kestrel-memo-4821", {
    documentType: "internal-memorandum",
    context: {
      system: firstSystem,
      settlement: firstSettlement,
      organization: savedOrgContext,
      character: firstCharacter,
      conflict: firstConflict
    }
  });
  const secondDocument = window.SciFiWorldbuilder.generateDocument("kestrel-memo-4821", {
    documentType: "internal-memorandum",
    context: {
      system: firstSystem,
      settlement: firstSettlement,
      organization: savedOrgContext,
      character: firstCharacter,
      conflict: firstConflict
    }
  });
  assert(JSON.stringify(firstDocument) === JSON.stringify(secondDocument), "Document generation is not deterministic");
  assert(firstDocument.entityType === "document", "Document entity type missing");
  assert(firstDocument.content.sections.length >= 4, "Document generated too few sections");
  assert(firstDocument.purpose.statedPurpose && firstDocument.purpose.actualPurpose, "Document purpose model missing");
  assert(firstDocument.knowledgeContext.publicFacts.length >= 1, "Document knowledge model missing public facts");
  assert(firstDocument.perspective.biases.length >= 1, "Document perspective model missing bias");
  assert(firstDocument.claims.length >= 1, "Document claims missing");
  assert(firstDocument.relationships.some(rel => rel.toEntityType === "conflict"), "Document conflict relationship missing");
  const validation = window.SciFiWorldbuilder.validateDocument(firstDocument);
  assert(validation.valid, `Document coherence validation failed: ${validation.errors.join(", ")}`);
  const qaUniverse = {
    systems: [firstSystem],
    settlements: [firstSettlement],
    organizations: [savedOrgContext],
    characters: [firstCharacter],
    conflicts: [firstConflict],
    documents: [firstDocument],
    timelines: [],
    historicalEvents: [],
    timelineBranches: [],
    relationships: []
  };
  const firstTimeline = window.SciFiWorldbuilder.generateTimeline("meridian-history-4821", { universe: qaUniverse });
  const secondTimeline = window.SciFiWorldbuilder.generateTimeline("meridian-history-4821", { universe: qaUniverse });
  assert(JSON.stringify(firstTimeline) === JSON.stringify(secondTimeline), "Timeline generation is not deterministic");
  assert(firstTimeline.entityType === "timeline", "Timeline entity type missing");
  assert(firstTimeline.sourceSettings.extractionMode === "existing-world-first", "Timeline does not declare existing-world-first extraction");
  assert(firstTimeline.sourceEvents.length >= 12, "Timeline extracted too few known events from existing world data");
  assert(firstTimeline.sourceEvents.some(event => event.source.parentEntityId === firstSettlement.id), "Timeline did not consume saved settlement history");
  assert(firstTimeline.sourceEvents.some(event => event.source.parentEntityId === savedOrgContext.id), "Timeline did not consume saved organization history");
  assert(firstTimeline.sourceEvents.some(event => event.source.parentEntityId === firstConflict.id), "Timeline did not consume saved conflict chronology");
  assert(firstTimeline.sourceEvents.some(event => event.sourceDocumentIds.includes(firstDocument.id)), "Timeline did not consume saved document chronology");
  assert(firstTimeline.events.every(event => event.chronology && event.chronology.displayDate), "Timeline event chronology missing display dates");
  assert(firstTimeline.eras.length >= 1, "Timeline eras missing");
  assert(Array.isArray(firstTimeline.gaps), "Timeline gaps missing");
  assert(Array.isArray(firstTimeline.contradictions), "Timeline contradiction warnings missing");
  assert(firstTimeline.connectiveEvents.every(event => event.status === "suggested"), "Timeline connective events are not marked as suggestions");
  const timelineValidation = window.SciFiWorldbuilder.validateTimeline(firstTimeline);
  assert(timelineValidation.valid, `Timeline validation failed: ${timelineValidation.errors.join(", ")}`);
  const firstFaction = window.SciFiWorldbuilder.generateFaction("meridian-reform-coalition-4281", {
    factionType: "labor faction",
    context: {
      universe: qaUniverse,
      settlement: firstSettlement,
      organization: savedOrgContext,
      character: firstCharacter,
      conflict: firstConflict,
      document: firstDocument,
      event: firstTimeline.sourceEvents[0]
    }
  });
  const secondFaction = window.SciFiWorldbuilder.generateFaction("meridian-reform-coalition-4281", {
    factionType: "labor faction",
    context: {
      universe: qaUniverse,
      settlement: firstSettlement,
      organization: savedOrgContext,
      character: firstCharacter,
      conflict: firstConflict,
      document: firstDocument,
      event: firstTimeline.sourceEvents[0]
    }
  });
  assert(JSON.stringify(firstFaction) === JSON.stringify(secondFaction), "Faction generation is not deterministic");
  assert(firstFaction.entityType === "faction", "Faction entity type missing");
  assert(firstFaction.classification.factionType === "labor faction", "Faction constraints did not affect faction type");
  assert(firstFaction.source.type === "existing-world-context", "Faction did not declare existing-world context");
  assert(firstFaction.settlementIds.includes(firstSettlement.id), "Faction did not consume saved settlement context");
  assert(firstFaction.organizationIds.includes(savedOrgContext.id), "Faction did not consume saved organization context");
  assert(firstFaction.conflictIds.includes(firstConflict.id), "Faction did not consume saved conflict context");
  assert(firstFaction.documentIds.includes(firstDocument.id), "Faction did not consume saved document context");
  assert(firstFaction.historicalEventIds.includes(firstTimeline.sourceEvents[0].id), "Faction did not consume historical event context");
  assert(firstFaction.organization.avoidsDuplicateOrganizationFields, "Faction duplicates organization model instead of linking");
  assert(firstFaction.ideology.contradictions.length >= 1, "Faction ideological contradiction missing");
  assert(firstFaction.internalDynamics.blocs.length >= 2, "Faction internal blocs missing");
  assert(firstFaction.relationships.some(rel => rel.toEntityType === "settlement"), "Faction settlement relationship missing");
  assert(firstFaction.relationships.some(rel => rel.toEntityType === "conflict"), "Faction conflict relationship missing");
  const factionValidation = window.SciFiWorldbuilder.validateFaction(firstFaction);
  assert(factionValidation.valid, `Faction validation failed: ${factionValidation.errors.join(", ")}`);
  const relationshipUniverse = {
    ...qaUniverse,
    historicalEvents: firstTimeline.sourceEvents,
    factions: [firstFaction],
    relationships: [
      ...summarySettlement.relationships,
      ...firstCharacter.entityRelationships,
      ...firstConflict.relationships,
      ...firstDocument.relationships,
      ...firstFaction.relationships
    ]
  };
  const relationshipGraph = window.SciFiWorldbuilder.buildRelationshipGraph(relationshipUniverse);
  assert(relationshipGraph.metrics.totalRelationships >= 20, "Relationship Explorer extracted too few relationships");
  assert(relationshipGraph.nodes.some(node => node.id === firstFaction.id), "Relationship graph missing faction node");
  assert(relationshipGraph.nodes.some(node => node.id === firstDocument.id), "Relationship graph missing document node");
  assert(relationshipGraph.relationships.some(rel => rel.relationshipFamily === "factional" || rel.sourceEntityId === firstFaction.id), "Relationship graph missing faction-aware relationships");
  assert(relationshipGraph.relationships.some(rel => rel.relationshipFamily === "documentary"), "Relationship graph missing document-aware relationships");
  assert(relationshipGraph.relationships.every(rel => rel.evidence && rel.strength && rel.chronology), "Relationship records are not normalized");
  assert(Array.isArray(relationshipGraph.suggestions), "Relationship suggestions missing");
  const relationshipValidation = window.SciFiWorldbuilder.validateRelationshipData({
    entities: new Map(relationshipGraph.nodes.map(node => [node.id, node])),
    relationships: relationshipGraph.relationships
  });
  assert(typeof relationshipValidation.valid === "boolean", "Relationship validation result missing");
  const relationshipPath = window.SciFiWorldbuilder.findRelationshipPath(relationshipGraph, firstCharacter.id, firstConflict.id);
  assert(relationshipPath.length >= 1, "Relationship pathfinding did not connect character to conflict");
  const firstPremise = window.SciFiWorldbuilder.generateStoryPremise("air-crisis-whistleblower-4281", {
    universe: relationshipUniverse,
    focus: firstConflict.id,
    genre: "political-thriller",
    scale: "novella"
  });
  const secondPremise = window.SciFiWorldbuilder.generateStoryPremise("air-crisis-whistleblower-4281", {
    universe: relationshipUniverse,
    focus: firstConflict.id,
    genre: "political-thriller",
    scale: "novella"
  });
  assert(JSON.stringify(firstPremise) === JSON.stringify(secondPremise), "Story premise generation is not deterministic");
  assert(firstPremise.entityType === "storyPremise", "Story premise entity type missing");
  assert(firstPremise.canonStatus === "non-canon-concept", "Story premise should default to non-canon concept");
  assert(firstPremise.classification.primaryGenre === "political-thriller", "Premise genre constraint missing");
  assert(firstPremise.classification.storyScale === "novella", "Premise scale constraint missing");
  assert(firstPremise.sourceContext.usesExistingWorld, "Premise did not declare existing-world context");
  assert(firstPremise.sourceContext.entityIds.includes(firstConflict.id), "Premise did not consume focused conflict");
  assert(firstPremise.sourceContext.entityIds.some(id => id === firstCharacter.id || id === firstSettlement.id || id === savedOrgContext.id), "Premise did not connect neighboring world context");
  assert(firstPremise.inspirationSignalIds.length >= 1, "Premise pressure signals missing");
  assert(firstPremise.sourceContext.generatedAdditions.every(item => item.status === "suggestion"), "Generated premise additions are not labeled as suggestions");
  assert(firstPremise.narrativeCore.protagonistGoal && firstPremise.narrativeCore.urgency && firstPremise.choiceArchitecture.moralPressure, "Premise narrative core incomplete");
  assert(firstPremise.protagonistModel.focalCharacterId || firstPremise.protagonistModel.suggestedRole, "Premise protagonist model missing");
  assert(firstPremise.oppositionModel.goal && firstPremise.oppositionModel.sympatheticPoint, "Premise opposition model incomplete");
  assert(firstPremise.stakes.personal && firstPremise.stakes.local, "Premise stakes missing");
  assert(firstPremise.escalation.steps.length >= 5, "Premise escalation path missing");
  assert(firstPremise.endingPossibilities.options.length >= 2, "Premise ending possibilities missing");
  assert(firstPremise.evaluation.overall > 40, "Premise evaluation missing or too low");
  const premiseValidation = window.SciFiWorldbuilder.validateStoryPremise(firstPremise, relationshipUniverse);
  assert(premiseValidation.valid, `Story premise validation failed: ${premiseValidation.errors.join(", ")}`);
  const premiseSignals = window.SciFiWorldbuilder.collectNarrativePressureSignals(relationshipUniverse);
  assert(premiseSignals.length >= 8, "Story premise pressure extraction found too few signals");
  const premiseCoverage = window.SciFiWorldbuilder.analyzePremiseCoverage({ ...relationshipUniverse, storyPremises: [firstPremise] });
  assert(Array.isArray(premiseCoverage.unusedMajorEntities), "Premise coverage analysis missing");
  const atlasUniverse = {
    ...relationshipUniverse,
    storyPremises: [firstPremise],
    encyclopediaEntries: [{
      id: "entry_atmospheric_right",
      entityType: "encyclopediaEntry",
      schemaVersion: 1,
      title: "Atmospheric Right",
      entryType: "legal-doctrine",
      summary: "The disputed legal claim that breathable infrastructure is a civic right rather than a commodity.",
      relatedEntityIds: [firstSettlement.id, firstFaction.id],
      tags: ["law", "atmosphere"]
    }],
    atlasCollections: [{
      id: "atlasCollection_air_crisis",
      entityType: "atlasCollection",
      schemaVersion: 1,
      name: "The Meridian Air Crisis",
      summary: "Core entities for the air crisis reference set.",
      itemIds: [firstSettlement.id, firstConflict.id, firstFaction.id, firstDocument.id, firstPremise.id],
      tags: ["air-crisis"]
    }]
  };
  const atlas = window.SciFiWorldbuilder.buildAtlas(atlasUniverse);
  assert(atlas.profile.entityType === "universeProfile", "Atlas universe profile missing");
  assert(atlas.index.items.length >= 30, "Atlas index extracted too few entities");
  assert(atlas.index.items.some(item => item.entityId === firstSettlement.id && item.route.includes("/atlas/settlement/")), "Atlas missing settlement route");
  assert(atlas.index.items.some(item => item.entityId === firstPremise.id && item.entityType === "storyPremise"), "Atlas missing story premise article");
  assert(atlas.index.items.some(item => item.entityId === "entry_atmospheric_right"), "Atlas missing custom encyclopedia entry");
  assert(atlas.maps.some(map => map.mapType === "settlement" && map.parentEntityId === firstSettlement.id), "Atlas missing settlement map");
  assert(atlas.timeline.events.length >= firstTimeline.sourceEvents.length, "Atlas timeline did not consume historical events");
  assert(atlas.glossary.some(entry => entry.term === "Atmospheric Right"), "Atlas glossary missing custom entry");
  assert(Array.isArray(atlas.continuity.findings), "Atlas continuity findings missing");
  assert(Array.isArray(atlas.coverage.findings), "Atlas coverage findings missing");
  const atlasArticle = window.SciFiWorldbuilder.buildAtlasArticle(atlasUniverse, firstSettlement.id);
  assert(atlasArticle.item.entityId === firstSettlement.id, "Atlas article routing failed");
  assert(atlasArticle.keyFacts.length >= 6, "Atlas article key facts missing");
  assert(atlasArticle.seeAlso.length >= 1, "Atlas article cross references missing");
  const atlasSearch = window.SciFiWorldbuilder.searchAtlas(atlas.index, "Atmospheric");
  assert(atlasSearch.some(item => item.entityId === "entry_atmospheric_right" || item.entityId === firstPremise.id || item.entityId === firstConflict.id), "Atlas search failed");
  const worldBible = window.SciFiWorldbuilder.buildWorldBible(atlasUniverse, { profile: "reader-primer" });
  assert(worldBible.sections.some(section => section.id === "overview"), "World Bible overview missing");
  assert(worldBible.sections.some(section => section.id === "story-premises" && section.items.length >= 1), "World Bible did not include story premises");
  const firstTechnology = window.SciFiWorldbuilder.generateTechnology("meridian-atmosphere-regulator-4281", {
    domain: "environmental-systems",
    category: "atmosphere",
    context: {
      system: firstSystem,
      settlement: firstSettlement,
      organization: savedOrgContext,
      character: firstCharacter,
      conflict: firstConflict,
      document: firstDocument,
      event: firstTimeline.sourceEvents[0],
      faction: firstFaction,
      premise: firstPremise
    }
  });
  const secondTechnology = window.SciFiWorldbuilder.generateTechnology("meridian-atmosphere-regulator-4281", {
    domain: "environmental-systems",
    category: "atmosphere",
    context: {
      system: firstSystem,
      settlement: firstSettlement,
      organization: savedOrgContext,
      character: firstCharacter,
      conflict: firstConflict,
      document: firstDocument,
      event: firstTimeline.sourceEvents[0],
      faction: firstFaction,
      premise: firstPremise
    }
  });
  assert(JSON.stringify(firstTechnology) === JSON.stringify(secondTechnology), "Technology generation is not deterministic");
  assert(firstTechnology.entityType === "technology", "Technology entity type missing");
  assert(firstTechnology.sourceEntityIds.includes(firstSettlement.id), "Technology did not consume settlement context");
  assert(firstTechnology.sourceEntityIds.includes(firstConflict.id), "Technology did not consume conflict context");
  assert(firstTechnology.components.length >= 3, "Technology components missing");
  assert(firstTechnology.materials.length >= 3, "Technology materials missing");
  assert(firstTechnology.failureModes.length >= 3, "Technology failure modes missing");
  assert(firstTechnology.maintenance.burden, "Technology maintenance profile missing");
  assert(firstTechnology.supplyChain.risks.length >= 2, "Technology supply-chain risks missing");
  assert(firstTechnology.consequences.unintendedHarms.length >= 2, "Technology social consequences missing");
  const technologyValidation = window.SciFiWorldbuilder.validateTechnologyEntity(firstTechnology, atlasUniverse);
  assert(technologyValidation.valid, `Technology validation failed: ${technologyValidation.errors.join(", ")}`);
  const infrastructure = window.SciFiWorldbuilder.generateInfrastructure("port-meridian-atmosphere-grid-4281", {
    type: "atmosphere-network",
    context: {
      system: firstSystem,
      settlement: firstSettlement,
      organization: savedOrgContext,
      conflict: firstConflict,
      technology: firstTechnology
    }
  });
  assert(infrastructure.entityType === "infrastructureSystem", "Infrastructure entity type missing");
  assert(infrastructure.settlementIds.includes(firstSettlement.id), "Infrastructure did not consume settlement context");
  assert(infrastructure.failureModes.length >= 3, "Infrastructure failure modes missing");
  assert(infrastructure.failureCascade.steps.length >= 4, "Infrastructure cascade missing");
  const standard = window.SciFiWorldbuilder.generateTechnicalStandard("meridian-docking-interface-4", {
    domain: "transportation",
    context: { organization: savedOrgContext, settlement: firstSettlement, technology: firstTechnology }
  });
  assert(standard.entityType === "technicalStandard", "Technical standard entity type missing");
  assert(standard.requirements.length >= 3, "Technical standard requirements missing");
  const research = window.SciFiWorldbuilder.generateResearchProgram("compact-fusion-initiative", {
    domain: "energy",
    context: { organization: savedOrgContext, character: firstCharacter, conflict: firstConflict, technology: firstTechnology }
  });
  assert(research.entityType === "researchProgram", "Research program entity type missing");
  assert(research.milestones.length >= 4, "Research milestones missing");
  const facility = window.SciFiWorldbuilder.generateTechnicalFacility("kestrel-orbital-fabrication-yard", {
    domain: "manufacturing",
    context: { system: firstSystem, settlement: firstSettlement, organization: savedOrgContext, technology: firstTechnology }
  });
  assert(facility.entityType === "technicalFacility", "Technical facility entity type missing");
  assert(facility.infrastructureDependencies.length >= 3, "Facility dependencies missing");
  const technologyUniverse = {
    ...atlasUniverse,
    technologies: [firstTechnology],
    infrastructureSystems: [infrastructure],
    technicalStandards: [standard],
    researchPrograms: [research],
    technicalFacilities: [facility]
  };
  const dependencyAnalysis = window.SciFiWorldbuilder.analyzeTechnologyDependencies(firstTechnology, technologyUniverse);
  assert(dependencyAnalysis.direct.length >= 8, "Technology dependency analysis too thin");
  assert(dependencyAnalysis.critical.length >= 2, "Technology critical dependencies missing");
  const cascade = window.SciFiWorldbuilder.traceFailureCascade(firstTechnology, technologyUniverse);
  assert(cascade.steps.length >= 4, "Technology cascade trace missing");
  const technologyCoverage = window.SciFiWorldbuilder.analyzeTechnologyCoverage(technologyUniverse);
  assert(Array.isArray(technologyCoverage.findings), "Technology coverage analysis missing");
  const technologySuggestions = window.SciFiWorldbuilder.suggestTechnologies(technologyUniverse);
  assert(technologySuggestions.length >= 1, "Technology suggestion engine missing contextual suggestions");
  const ecosystem = window.SciFiWorldbuilder.generateTechnologyEcosystem("port-meridian-stack-4281", {
    mode: "settlement-infrastructure-stack",
    context: { system: firstSystem, settlement: firstSettlement, organization: savedOrgContext, conflict: firstConflict }
  });
  assert(ecosystem.technologies.length >= 4, "Technology ecosystem generation missing technologies");
  assert(ecosystem.infrastructure.length === 1, "Technology ecosystem missing infrastructure");
  const technologyAtlas = window.SciFiWorldbuilder.buildAtlas(technologyUniverse);
  assert(technologyAtlas.index.items.some(item => item.entityId === firstTechnology.id && item.category === "technologies"), "Atlas missing technology index entry");
  assert(technologyAtlas.index.items.some(item => item.entityId === infrastructure.id && item.category === "infrastructure"), "Atlas missing infrastructure index entry");
  assert(technologyAtlas.timeline.events.some(event => event.entityIds.includes(firstTechnology.id)), "Atlas timeline missing technology milestone");
  assert(technologyAtlas.glossary.some(entry => entry.relatedEntityIds.includes(firstTechnology.id)), "Atlas glossary missing technology entry");
  const technologyArticle = window.SciFiWorldbuilder.buildAtlasArticle(technologyUniverse, firstTechnology.id);
  assert(technologyArticle.keyFacts.some(fact => fact.label === "Domain"), "Atlas technology article missing domain facts");
  return results;
}

try {
  // Modules load on demand now; the harness needs all of them resolved first.
  await window.SciFiWorldbuilder.ready();
  const passed = runQa();
  document.querySelector("#app").innerHTML = `
    <section class="panel">
      <p class="eyebrow">Validation passed</p>
      <h1>QA Green</h1>
      <div class="entry-grid">
        ${passed.map(item => `<article class="data-card"><h3>${item.name}</h3><p>${item.seed}</p><p>${item.documents} docs / ${item.incidents} incidents / ${item.locations} locations</p></article>`).join("")}
      </div>
    </section>
  `;
} catch (error) {
  document.querySelector("#app").innerHTML = `<section class="panel"><p class="eyebrow">Validation failed</p><h1>QA Red</h1><p>${error.message}</p></section>`;
  throw error;
}
