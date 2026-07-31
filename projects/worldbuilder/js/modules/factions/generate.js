import { createSeededRandom, deterministicCreatedAt, deriveSeed, hashString, slug } from "../../shared/random.js";

const CURRENT_YEAR = 2326;
const COLORS = ["#9ecf8f", "#76d5d7", "#d8b45c", "#d88972", "#a6b7ff", "#f0a1b2"];
const TYPES = ["political movement", "opposition bloc", "labor faction", "reform caucus", "traditionalist bloc", "neighborhood coalition", "separatist movement", "environmental movement", "corporate faction", "military faction", "religious faction", "identity movement", "scientific school", "economic elite", "resistance movement", "temporary alliance"];
const FORMALITY = ["informal", "loosely organized", "networked", "semi-formal", "formally organized", "institutionalized"];
const VISIBILITY = ["public", "discreet", "hidden", "underground", "clandestine", "widely suspected"];
const LEGAL_STATUS = ["legal", "recognized", "tolerated", "restricted", "monitored", "banned", "legally ambiguous"];
const ROLES = ["ruling", "coalition partner", "parliamentary opposition", "extra-institutional opposition", "neutral broker", "insurgent", "client faction", "kingmaker", "marginalized", "separatist authority"];
const METHODS = ["elections", "public persuasion", "elite negotiation", "institutional infiltration", "labor action", "legal challenge", "mutual aid", "civil disobedience", "mass protest", "leaks", "economic pressure", "religious conversion", "cultural production"];

export function generateFaction(seed = "faction", constraints = {}) {
  const root = createSeededRandom(seed || "faction");
  const context = normalizeContext(root, constraints);
  const type = normalizeChoice(constraints.factionType) || inferFactionType(root, context);
  const ideology = ideologyFor(root, context, type, constraints);
  const constituency = constituencyFor(root, context, type, constraints);
  const name = constraints.name || nameFor(root, context, type, ideology, constituency);
  const id = `faction_${hashString(seed).toString(36)}`;
  const classification = classificationFor(root, context, type, constraints);
  const origin = originFor(root, seed, context, name, ideology, constraints);
  const goals = goalsFor(root, context, ideology, constituency);
  const strategy = strategyFor(root, classification, ideology, goals);
  const leadership = leadershipFor(root, context, classification, constituency);
  const membership = membershipFor(root, classification, constituency);
  const resources = resourcesFor(root, context, classification);
  const influence = influenceFor(root, context, classification, resources);
  const territory = territoryFor(root, context, constituency);
  const legitimacy = legitimacyFor(root, classification, constituency, resources);
  const internalDynamics = internalDynamicsFor(root, seed, name, ideology, strategy, membership);
  const externalRelations = externalRelationsFor(root, id, context, ideology);
  const futurePressures = futurePressuresFor(root, context, internalDynamics, externalRelations);
  const identity = identityFor(root, name, type, ideology, classification);
  const summary = summaryFor(name, classification, ideology, constituency, goals, context);
  const relationships = relationshipsFor(id, context, leadership, externalRelations);

  return {
    id,
    entityType: "faction",
    schemaVersion: 1,
    seed,
    name,
    shortName: shortNameFor(name, root),
    aliases: identity.historicalNames.concat(identity.hostileNicknames),
    slogan: identity.slogan,
    summary,
    classification,
    origin,
    identity,
    ideology,
    constituency,
    goals,
    strategy,
    leadership,
    membership,
    organization: organizationLinksFor(context),
    resources,
    influence,
    territory,
    legitimacy,
    communications: communicationsFor(root, classification, identity),
    recruitment: recruitmentFor(root, constituency, ideology, classification),
    culture: cultureFor(root, identity, classification),
    internalDynamics,
    externalRelations,
    historicalDevelopment: historicalDevelopmentFor(root, seed, name, origin, internalDynamics, context),
    vulnerabilities: vulnerabilitiesFor(root, classification, ideology, resources, internalDynamics),
    futurePressures,
    relationshipIds: relationships.map(rel => rel.id),
    relationships,
    characterIds: unique([...(context.characters || []).map(item => item.id), ...leadership.officialLeaderIds, ...leadership.actualPowerHolderIds]),
    organizationIds: unique([...(context.organizations || []).map(item => item.id), context.organization?.id].filter(Boolean)),
    conflictIds: unique([context.conflict?.id].filter(Boolean)),
    documentIds: unique([context.document?.id].filter(Boolean)),
    historicalEventIds: unique([context.event?.id].filter(Boolean)),
    settlementIds: unique([context.settlement?.id, context.conflict?.location?.settlementId].filter(Boolean)),
    systemIds: unique([context.system?.id, context.settlement?.location?.systemId, context.conflict?.location?.systemId].filter(Boolean)),
    source: context.source,
    tags: [slug(type), classification.alignmentRole, classification.visibility, classification.scale, context.usesExistingWorld ? "world-linked" : "standalone"],
    notes: "",
    favorite: false,
    createdAt: deterministicCreatedAt(seed),
    updatedAt: deterministicCreatedAt(`${seed}:updated`),
    presentation: {
      accentColor: root.pick(COLORS),
      symbolStyle: classification.formality === "informal" ? "painted-mark" : "political-standard",
      dossierStyle: "power-brief"
    }
  };
}

export function factionMarkdown(faction) {
  return [
    `# ${faction.name}`,
    "",
    faction.summary,
    "",
    `Seed: ${faction.seed}`,
    `Type: ${faction.classification.factionType}`,
    `Role: ${faction.classification.alignmentRole}`,
    `Visibility: ${faction.classification.visibility}`,
    "",
    "## Ideology",
    `- Core belief: ${faction.ideology.coreDoctrine}`,
    `- Diagnosis: ${faction.ideology.diagnosis}`,
    `- Preferred future: ${faction.ideology.preferredFuture}`,
    `- Red line: ${faction.ideology.redLine}`,
    "",
    "## Constituency",
    `- Claims to represent: ${faction.constituency.claimed.join(", ")}`,
    `- Actual base: ${faction.constituency.actualBase.join(", ")}`,
    "",
    "## Goals",
    ...Object.entries(faction.goals).flatMap(([layer, goals]) => goals.map(goal => `- ${layer}: ${goal.description} (${goal.priority})`)),
    "",
    "## Internal Blocs",
    ...faction.internalDynamics.blocs.map(bloc => `- ${bloc.name}: ${bloc.summary} Split risk: ${bloc.splitRisk}.`),
    "",
    "## Relations",
    ...faction.externalRelations.factions.map(rel => `- ${rel.name}: ${rel.publicRelationship}; privately ${rel.privateRelationship}.`)
  ].join("\n");
}

export function validateFaction(faction) {
  const errors = [];
  const warnings = [];
  if (!faction?.id || faction.entityType !== "faction") errors.push("Faction identity is missing.");
  if (!faction?.ideology?.coreDoctrine) errors.push("Faction ideology is missing.");
  if (!faction?.constituency?.claimed?.length) errors.push("Faction constituency is missing.");
  if (!faction?.goals?.publicGoals?.length) errors.push("Faction public goals are missing.");
  if (faction?.classification?.visibility === "public" && faction?.classification?.legalStatus === "banned") {
    warnings.push("Public banned factions may need a tolerated-front explanation.");
  }
  if (!faction?.ideology?.contradictions?.length) warnings.push("Faction has no ideological contradiction recorded.");
  return { valid: !errors.length, errors, warnings };
}

function normalizeContext(root, constraints = {}) {
  const raw = constraints.context || {};
  const systems = records(raw.universe?.systems);
  const settlements = records(raw.universe?.settlements);
  const organizations = records(raw.universe?.organizations);
  const characters = records(raw.universe?.characters);
  const conflicts = records(raw.universe?.conflicts);
  const documents = records(raw.universe?.documents);
  const events = records(raw.universe?.historicalEvents);
  const settlement = raw.settlement || constraints.settlement || pickOrNull(root, settlements);
  const organization = raw.organization || constraints.organization || pickOrNull(root, organizations);
  const conflict = raw.conflict || constraints.conflict || pickOrNull(root, conflicts);
  const character = raw.character || constraints.character || pickOrNull(root, characters);
  const document = raw.document || constraints.document || pickOrNull(root, documents);
  const event = raw.event || constraints.event || pickOrNull(root, events);
  const system = raw.system || constraints.system || systems.find(item => item.id === settlement?.location?.systemId || item.id === conflict?.location?.systemId) || pickOrNull(root, systems);
  const locationName = settlement?.name || conflict?.location?.settlementName || system?.name || organization?.headquarters?.settlement || "the local archive";
  const pressureTags = unique([
    ...(raw.pressureTags || []),
    settlement?.tensions?.[0]?.name,
    settlement?.government?.notableLaws?.[0]?.name,
    conflict?.classification?.category,
    conflict?.causes?.publicCause,
    document?.subject?.name,
    event?.eventCategory
  ].filter(Boolean).map(slug));
  const contextOrganizations = uniqueById([organization, ...(raw.organizations || []), ...(settlement?.organizations || []), ...organizations.filter(org => conflict?.parties?.some(party => party.id === org.id)).slice(0, 3)].filter(Boolean).map(normalizeOrganization));
  const contextCharacters = uniqueById([character, ...(raw.characters || []), ...characters.filter(person => conflict?.parties?.some(party => party.id === person.id)).slice(0, 3)].filter(Boolean).map(normalizeCharacter));
  return {
    ...raw,
    universe: raw.universe || {},
    system,
    settlement,
    organization,
    organizations: contextOrganizations,
    character,
    characters: contextCharacters,
    conflict,
    document,
    event,
    locationName,
    pressureTags,
    source: raw.source || { type: settlement || organization || conflict || character || document || event ? "existing-world-context" : "standalone" },
    usesExistingWorld: Boolean(settlement || organization || conflict || character || document || event)
  };
}

function inferFactionType(root, context) {
  if (context.conflict) return root.pick(["opposition bloc", "labor faction", "peace movement", "hardline faction", "reform caucus", "resistance movement"]);
  if (context.organization) return root.pick(["corporate faction", "reform caucus", "professional faction", "internal organization faction"]);
  if (context.settlement?.tensions?.length) return root.pick(["political movement", "labor faction", "neighborhood coalition", "civil-rights movement", "environmental movement"]);
  if (context.character) return root.pick(["personality circle", "political caucus", "advocacy network"]);
  return root.pick(TYPES);
}

function classificationFor(root, context, type, constraints) {
  const visibility = normalizeChoice(constraints.visibility) || (context.conflict?.classification?.visibility === "hidden" ? root.pick(["hidden", "underground", "widely suspected"]) : root.pick(VISIBILITY));
  const legalStatus = normalizeChoice(constraints.legalStatus) || (visibility === "underground" || visibility === "clandestine" ? root.pick(["banned", "criminalized", "designated hostile", "restricted"]) : root.pick(LEGAL_STATUS));
  const scale = normalizeChoice(constraints.scale) || (context.organization ? root.pick(["organization-wide", "departmental"]) : context.settlement ? root.pick(["settlement", "district", "regional"]) : context.system ? "system-wide" : root.pick(["settlement", "regional", "system-wide"]));
  return {
    factionType: type,
    formality: normalizeChoice(constraints.formality) || root.pick(FORMALITY),
    visibility,
    legalStatus,
    operationalStatus: normalizeChoice(constraints.operationalStatus) || root.pick(["emerging", "active", "dominant", "declining", "fragmented", "suppressed", "reconstituted"]),
    alignmentRole: normalizeChoice(constraints.alignmentRole) || roleFor(type, context, root),
    scale,
    claimedScope: scopeClaimFor(scale, root),
    effectiveScope: scale,
    hybridEntity: /party|union|army|registered|government/i.test(type)
  };
}

function identityFor(root, name, type, ideology, classification) {
  const colors = root.shuffle(["green", "white", "gold", "red", "black", "blue", "silver"]).slice(0, classification.formality === "informal" ? 1 : 2);
  return {
    officialName: name,
    commonName: shortNameFor(name, root),
    abbreviation: acronym(name),
    internalName: root.pick([`the ${ideology.values[0]} circle`, "the working table", "the continuity group", "the local line"]),
    hostileNicknames: [root.pick(["wreckers", "air thieves", "soft governors", "dock priests", "board pets", "paper loyalists"])],
    historicalNames: root.maybe(0.45) ? [root.pick(["First Committee", "Emergency League", "Commons Circle", "Charter Caucus"])] : [],
    slogan: sloganFor(root, ideology),
    symbols: classification.formality === "informal" ? [root.pick(["painted hatch mark", "shared ribbon", "chalked transit glyph"])] : [root.pick(["split circle", "open gate", "raised lamp", "broken seal"])],
    colors,
    gestures: [root.pick(["two fingers over the air valve", "open palm at throat height", "touching the oldest hatch before meetings"])],
    uniformsOrMarkers: classification.formality === "informal" ? "none beyond small local signs" : `${colors.join(" and ")} bands at meetings`,
    commemorativeDates: [root.pick(["Founding Week", "Leak Day", "First Walkout", "Charter Night"])],
    foundingMyth: ideology.moralJustification,
    publicImage: root.pick(["necessary reformers", "dangerous radicals", "serious governing alternative", "elite conspiracy", "protectors", "opportunists"]),
    selfImage: root.pick(["the only honest adults in the room", "guardians of ordinary residents", "the future government in rehearsal", "custodians of a betrayed promise"])
  };
}

function ideologyFor(root, context, type, constraints) {
  const pressure = context.pressureTags[0] || "representation";
  const doctrine = normalizeChoice(constraints.ideology) || doctrineFor(root, context, type, pressure);
  const values = root.shuffle(["autonomy", "continuity", "dignity", "security", "fairness", "survival", "truth", "local control", "competence", "shared ownership"]).slice(0, 4);
  const opposition = oppositionFor(context, type, root);
  return {
    coreDoctrine: doctrine,
    values,
    principles: values.map(value => `${title(value)} must be protected from ${opposition}.`),
    diagnosis: diagnosisFor(context, opposition, pressure, root),
    preferredFuture: preferredFutureFor(root, context, type),
    moralJustification: root.pick(["survival cannot be privatized", "authority exists only through consent", "history has already warned them once", "ordinary residents pay for elite mistakes", "stability without justice is another kind of collapse"]),
    primaryOpposition: opposition,
    theoryOfChange: root.pick(["organized public pressure plus institutional leverage", "patient infiltration of decision points", "mass refusal during a visible crisis", "electoral capture followed by charter revision", "building alternative services until the old order bends"]),
    redLine: root.pick(["permanent private control of survival infrastructure", "military government over civilian districts", "unaccountable offworld ownership", "forced displacement of core supporters", "sealed trials for political dissent"]),
    politicalPositions: {
      centralization: root.pick(["local autonomy", "federal settlement powers", "central coordination with district vetoes"]),
      civilLiberty: root.pick(["expanded public oversight", "rights before emergency authority", "security with review"])
    },
    economicPositions: {
      ownership: root.pick(["municipal control of essentials", "worker cooperatives", "regulated private contracts", "strategic public ownership"]),
      redistribution: root.pick(["hazard credits", "district dividend", "priority services for affected workers", "transparent subsidies"])
    },
    institutionalPositions: {
      governance: root.pick(["elected district board", "charter assembly", "professional civil service", "emergency powers rollback"])
    },
    technologicalPositions: {
      oversight: root.pick(["open safety audits", "regulated autonomy", "public algorithm registers", "restricted military deployments"])
    },
    environmentalPositions: {
      priority: root.pick(["habitat resilience", "anti-extraction limits", "terraforming accountability", "life-support commons"])
    },
    culturalPositions: {
      identity: root.pick(["local memory", "frontier pluralism", "founding traditions", "new civic rituals"])
    },
    contradictions: [contradictionFor(root, context, type)],
    sacredBeliefs: [root.pick(["the first settlement promise", "the dignity of risk labor", "public custody of common air", "truth in the archive"])],
    unacceptableOutcomes: [root.pick(["silent privatization", "permanent emergency law", "outsider rule", "unmarked casualties", "sealed displacement"])],
    radicalism: {
      goals: root.pick(["moderate", "reformist", "radical", "revolutionary"]),
      rhetoric: root.pick(["pragmatic", "sharp", "heated", "ceremonial"]),
      methods: root.pick(["institutional", "disruptive but nonviolent", "mixed", "splinter-prone"]),
      compromise: root.pick(["high", "limited", "fragile", "publicly rejected but privately explored"]),
      violenceAcceptance: root.pick(["rejected", "forbidden by leadership", "disputed", "splinter tolerance"])
    }
  };
}

function constituencyFor(root, context, type, constraints) {
  const claimed = normalizeChoice(constraints.constituency)
    ? [constraints.constituency]
    : root.shuffle([
      ...(context.settlement?.population?.groups?.map(group => group.name) || []),
      "dockworkers",
      "contract laborers",
      "district families",
      "maintenance crews",
      "migrants",
      "small merchants",
      "students",
      "veterans",
      "synthetic intelligences",
      "outer district residents",
      context.organization ? `${context.organization.identity?.name || context.organization.name} staff` : ""
    ].filter(Boolean)).slice(0, 3);
  return {
    claimed,
    actualBase: root.shuffle(claimed.concat(["organizers", "professionals", "older residents", "shift workers"])).slice(0, 3),
    strongestSupporters: claimed.slice(0, 2),
    weakSupporters: [root.pick(["comfortable professionals", "recent arrivals", "risk-averse families", "contract managers"])],
    skepticalConstituencyMembers: [root.pick(["workers tied to employer housing", "families dependent on subsidies", "religious elders", "technical staff who fear disruption"])],
    groupsExcluded: [root.pick(["nonresident contractors", "executive households", "unregistered migrants", "security auxiliaries"])],
    groupsUnintentionallyHarmed: [root.pick(["commuters during strikes", "small vendors near blockades", "patients during service slowdowns"])],
    geographicConcentrations: [context.settlement?.name || context.locationName, ...(context.settlement?.districts || []).slice(0, 2).map(district => district.name)].filter(Boolean)
  };
}

function goalsFor(root, context, ideology, constituency) {
  const conflictId = context.conflict?.id || "";
  const beneficiary = constituency.claimed[0] || "supporters";
  const make = (description, priority, visibility = "public") => ({
    id: `goal_${hashString(description).toString(36)}`,
    description,
    priority,
    timeHorizon: root.pick(["immediate", "medium-term", "long-term"]),
    visibility,
    beneficiary,
    opposition: ideology.primaryOpposition,
    successConditions: root.pick(["charter language changes", "control board seats won", "public audit completed", "emergency law repealed", "funding stream secured"]),
    compromisesAccepted: root.pick(["temporary oversight board", "phased transition", "outside arbitration", "limited pilot district"]),
    relatedConflictIds: [conflictId].filter(Boolean),
    status: root.pick(["active", "negotiable", "symbolic", "blocked"])
  });
  return {
    publicGoals: [make(ideology.preferredFuture, "high"), make(`Protect ${beneficiary} from ${ideology.primaryOpposition}.`, "medium")],
    strategicGoals: [make(root.pick(["win seats on the utility board", "force a public inquiry", "capture the next district election", "turn one large institution neutral"]), "high", "internal")],
    ultimateGoals: [make(root.pick(["rewrite the settlement charter", "create a durable civic commons", "replace the current elite bargain", "make the faction the normal governing center"]), "high", "semi-public")],
    hiddenGoals: [make(root.pick(["expose a sealed patron", "split a rival coalition", "protect an informant network", "force leadership succession inside an allied organization"]), "medium", "hidden")],
    symbolicGoals: [make(root.pick(["rename the old transit square", "restore the first landing oath", "publish all casualty names", "hold an annual open-air assembly"]), "low")],
    defensiveGoals: [make(root.pick(["prevent forced relocation", "stop permanent emergency policing", "protect mutual-aid routes", "keep outside sponsors from dictating terms"]), "high")]
  };
}

function strategyFor(root, classification, ideology, goals) {
  const preferredMethods = root.shuffle(METHODS).slice(0, 4);
  const disputedMethods = root.shuffle(["sabotage", "bribery", "intimidation", "cyber operations", "secret negotiations", "wildcat strikes"]).slice(0, 2);
  return {
    theoryOfChange: ideology.theoryOfChange,
    primaryStrategy: root.pick(preferredMethods),
    preferredMethods,
    toleratedMethods: root.shuffle(["demonstrations", "leaks", "boycotts", "petitioning", "strategic litigation"]).slice(0, 3),
    disputedMethods,
    forbiddenMethods: ideology.radicalism.violenceAcceptance === "rejected" ? ["targeted violence", "terrorism", "assassination"] : ["mass-casualty attacks", "attacks on children"],
    secretlyUsedMethods: classification.visibility === "hidden" || classification.visibility === "underground" ? root.shuffle(["anonymous leaks", "safe houses", "infiltration"]).slice(0, 2) : [],
    splinterMethods: disputedMethods,
    goalCompatibility: [
      { goalId: goals.publicGoals[0].id, compatibility: "shared alliance basis", note: "Several factions could support this demand for different reasons." },
      { goalId: goals.hiddenGoals[0].id, compatibility: "concealed rivalry", note: "This goal may alienate current allies if exposed." }
    ]
  };
}

function leadershipFor(root, context, classification, constituency) {
  const available = context.characters || [];
  const leader = available[0] || null;
  const controller = available[1] || leader || null;
  return {
    leadershipModel: root.pick(["charismatic founder", "central committee", "rotating leadership", "chapter federation", "public leader and hidden controller", "leaderless movement", "executive council"]),
    officialLeaderIds: leader ? [leader.id] : [],
    actualPowerHolderIds: controller ? [controller.id] : [],
    spokespersonIds: leader ? [leader.id] : [],
    founderIds: leader ? [leader.id] : [],
    ideologicalAuthority: root.pick([leader?.name, constituency.claimed[0], "founding committee", "district chapters"].filter(Boolean)),
    financialController: root.pick(["small donor circle", "friendly union treasurer", "anonymous patron", "chapter dues council"]),
    hiddenPatron: classification.visibility === "public" ? root.pick(["none confirmed", "rumored offworld donor", "sympathetic council office"]) : root.pick(["unknown sponsor", "exiled patron", "inside official"]),
    likelySuccessor: available[2]?.id || "",
    internalChallenger: available[1]?.id || "",
    successionModel: root.pick(["internal election", "committee selection", "chapter vote", "informal consensus", "unclear"]),
    successionStability: root.pick(["stable", "fragile", "contested", "near split"])
  };
}

function membershipFor(root, classification, constituency) {
  const base = classification.scale === "interstellar" ? [25000, 240000] : classification.scale === "system-wide" ? [8000, 80000] : [140, 18000];
  const estimated = root.int(base[0], base[1]);
  return {
    structure: root.pick(["chapter-based", "cell-based", "mass-membership", "professional caucus", "informal network", "patronage pyramid", "council democracy"]),
    estimatedMembers: {
      value: estimated,
      confidence: root.pick(["low", "medium", "contested"])
    },
    activeCore: Math.max(12, Math.round(estimated * root.float(0.03, 0.18, 2))),
    sympathizerScale: root.pick(["small but intense", "moderate", "large", "broad but shallow"]),
    entryRequirements: root.shuffle(["local sponsor", "workplace tie", "district residency", "ideological oath", "dues", "secure vetting"]).slice(0, classification.visibility === "public" ? 2 : 4),
    memberObligations: root.shuffle(["meeting attendance", "mutual-aid shifts", "message discipline", "dues", "strike readiness", "secure communication"]).slice(0, 4),
    exitConsequences: [root.pick(["social exclusion", "lost protection", "debt pressure", "public suspicion", "none beyond gossip"])],
    secrecyRequirements: classification.visibility === "public" ? [] : ["cell names hidden", "compartmented membership", "public denial expected"],
    membershipTrends: root.pick(["growing", "stable", "surging after crisis", "aging", "splitting between generations"]),
    ordinaryExperience: root.pick(["long meetings, practical chores, and careful rumors", "mutual aid by day and political education at night", "public rallies backed by private bargaining", "quiet workplace organizing with real personal risk"])
  };
}

function resourcesFor(root, context, classification) {
  const pool = ["money", "volunteers", "professional expertise", "communications access", "media access", "legal standing", "institutional positions", "political offices", "social prestige", "intelligence", "infrastructure control", "transportation access", "safe houses", "public sympathy", "historical legitimacy"];
  return root.shuffle(pool).slice(0, 6).map(type => ({
    type,
    source: resourceSource(type, context, root),
    reliability: root.pick(["fragile", "uneven", "reliable", "seasonal", "dependent on one patron"]),
    visibility: classification.visibility === "public" ? root.pick(["public", "partly public", "quiet"]) : root.pick(["hidden", "laundered", "deniable"]),
    dependency: root.pick(["single sponsor", "member labor", "legal tolerance", "transport access", "public outrage", "safe meeting space"]),
    vulnerability: root.pick(["audit trail", "informant risk", "fatigue", "patron withdrawal", "counter-propaganda", "route closure"])
  }));
}

function influenceFor(root, context, classification, resources) {
  const base = classification.alignmentRole === "ruling" ? 62 : classification.alignmentRole.includes("opposition") ? 42 : 35;
  const hasInfrastructure = resources.some(item => item.type === "infrastructure control");
  return {
    government: clamp(base + root.int(-18, 22)),
    labor: clamp((context.settlement ? 52 : 34) + root.int(-16, 30)),
    media: clamp(38 + root.int(-18, 34)),
    military: clamp((classification.factionType.includes("military") ? 62 : 16) + root.int(-12, 22)),
    publicOpinion: clamp(base + root.int(-14, 32)),
    infrastructure: clamp((hasInfrastructure ? 65 : 32) + root.int(-12, 24)),
    corporations: clamp((context.organization ? 54 : 30) + root.int(-18, 28)),
    courts: clamp(24 + root.int(-12, 28)),
    methods: root.shuffle(["formal office", "membership concentration", "public pressure", "expertise", "control of resources", "ideological sympathy", "electoral support", "control of information"]).slice(0, 4)
  };
}

function territoryFor(root, context, constituency) {
  const districts = context.settlement?.districts || [];
  return {
    supportPattern: root.pick(["concentrated", "dispersed", "urban", "orbital", "institution-based", "class-based", "network-based"]),
    coreStronghold: districts[0]?.name || context.settlement?.name || context.organization?.headquarters?.settlement || context.locationName,
    secondaryStrongholds: districts.slice(1, 3).map(district => district.name).concat(constituency.geographicConcentrations.slice(0, 1)).filter(Boolean),
    contestedAreas: districts.slice(3, 5).map(district => district.name).concat(["public administration"]).filter(Boolean),
    hostileAreas: [root.pick(["executive district", "security precinct", "old elite ward", "offworld docks"])],
    symbolicTerritories: [root.pick(["first landing plaza", "old union hall", "sealed memorial wall", "central air exchange"])],
    exileBases: root.maybe(0.25) ? [root.pick(["outer station", "diaspora channel", "abandoned service deck"])] : [],
    hiddenBases: root.maybe(0.35) ? [root.pick(["clinic basement", "maintenance tunnel", "private comms room"])] : []
  };
}

function legitimacyFor(root, classification, constituency, resources) {
  const strengths = root.shuffle(["historical continuity", "public service", "protection", "expertise", "cultural identity", "moral authority", "control of territory", "election results"]).slice(0, 3);
  const weaknesses = root.shuffle(["unelected leadership", "foreign support", "elite domination", "internal division", "failed promises", "narrow constituency", "lack of transparency"]).slice(0, 3);
  return {
    sources: strengths,
    weaknesses,
    audiences: {
      members: root.pick(["deeply legitimate", "broadly trusted", "nervous but loyal"]),
      claimedConstituency: root.pick(["hopeful", "split", "supportive but impatient", "skeptical"]),
      generalPublic: root.pick(["necessary reformers", "dangerous radicals", "serious alternative", "opportunists", "harmless protest movement"]),
      government: classification.alignmentRole === "ruling" ? "recognized" : root.pick(["monitored", "dismissed", "feared", "quietly negotiated with"]),
      elites: root.pick(["hostile", "patronizing", "privately divided", "cautiously supportive"]),
      rivals: root.pick(["illegitimate", "useful temporarily", "dangerous competitor"]),
      historians: root.pick(["too early to judge", "a product of unresolved crisis", "likely to be remembered through its documents"])
    },
    publicPerception: root.pick(["necessary reformers", "dangerous radicals", "defenders of tradition", "opportunists", "protectors", "serious governing alternative", "elite conspiracy"])
  };
}

function internalDynamicsFor(root, seed, name, ideology, strategy, membership) {
  const blocNames = root.shuffle(["Municipalists", "Hardliners", "Institutionalists", "Youth Wing", "District Chapters", "Donor Circle", "Underground Wing", "Pragmatists"]).slice(0, 3);
  const blocs = blocNames.map((blocName, index) => ({
    id: `bloc_${hashString(`${seed}:${blocName}`).toString(36)}`,
    name: `${name} ${blocName}`,
    summary: `${blocName} agree with the core cause but dispute ${root.pick(["timing", "alliances", "violence", "funding", "leadership", "compromise"])}.`,
    leaderIds: [],
    coreGoalIds: [],
    preferredMethods: root.shuffle(strategy.preferredMethods.concat(strategy.disputedMethods)).slice(0, 3),
    supportShare: root.pick(["small-minority", "large-minority", "plurality", "dominant wing"]),
    relationshipToLeadership: root.pick(["supportive-but-critical", "loyal", "openly skeptical", "quietly organizing", "dependent on leadership"]),
    splitRisk: index === 1 ? root.pick(["moderate", "high"]) : root.pick(["low", "moderate"])
  }));
  return {
    structure: membership.structure,
    decisionMaking: root.pick(["committee vote", "chapter mandate", "leader consultation", "consensus until crisis", "donor veto behind formal votes"]),
    communicationFlow: root.pick(["public channels with private coordination", "cell-to-cell couriers", "workplace organizers", "encrypted committees"]),
    localAutonomy: root.pick(["low", "moderate", "high", "contested"]),
    disciplinarySystem: root.pick(["informal shaming", "membership review", "cell exclusion", "public censure", "none reliable"]),
    disputeProcess: root.pick(["assembly debate", "closed council", "chapter arbitration", "leadership fiat"]),
    leadershipSelection: root.pick(["elections", "appointment", "rotating chair", "informal acclaim", "unclear succession"]),
    unity: {
      ideological: root.pick(["unified", "broadly aligned", "tense", "factionalized"]),
      leadership: root.pick(["stable", "tense", "near split", "leaderless"]),
      strategic: root.pick(["aligned", "disputed", "openly divided"]),
      constituency: root.pick(["broadly aligned", "tense", "regionalized"]),
      discipline: root.pick(["strong", "uneven", "weak", "fragmented"])
    },
    disputes: root.shuffle(["leadership", "strategy", "violence", "funding", "succession", "alliance policy", "interpretation of history"]).slice(0, 3),
    blocs,
    schismRisk: root.pick(["low", "moderate", "high", "imminent if the next compromise fails"])
  };
}

function externalRelationsFor(root, id, context, ideology) {
  const orgRelations = (context.organizations || []).slice(0, 4).map(org => ({
    entityId: org.id,
    entityType: "organization",
    name: org.name,
    publicRelationship: root.pick(["influences", "opposed by", "recruits from", "represents employees of", "funded by", "recognized by"]),
    privateRelationship: root.pick(["dependent on", "quietly negotiating", "infiltrates", "publicly hostile but secretly cooperative", "uses as leverage"]),
    cause: ideology.diagnosis,
    strength: root.int(22, 86),
    disputedIssues: root.shuffle(["funding", "appointments", "security", "resource control", "public blame"]).slice(0, 2)
  }));
  const factions = [
    {
      entityId: "",
      entityType: "faction",
      name: root.pick(["Continuity Bloc", "Free Transit League", "Executive Stability Group", "Outer Ring Mutualists"]),
      publicRelationship: root.pick(["allied", "competitive", "rival", "hostile", "coalition partner", "sympathetic"]),
      privateRelationship: root.pick(["temporary partner", "deeper rival", "negotiating", "infiltrated", "ceasefire"]),
      cause: root.pick(["shared enemy", "incompatible long-term goals", "district rivalry", "coalition bargaining"]),
      strength: root.int(18, 92),
      startDate: String(CURRENT_YEAR - root.int(1, 18)),
      turningPoints: [],
      disputedIssues: root.shuffle(["strategy", "leadership", "territory", "funding", "violence"]).slice(0, 2),
      relatedConflictIds: [context.conflict?.id].filter(Boolean)
    }
  ];
  return {
    factions,
    organizations: orgRelations,
    government: {
      relationship: context.settlement ? root.pick(["legal opposition", "tolerated opposition", "monitored movement", "unofficial adviser", "resistance movement"]) : "unknown",
      notes: context.settlement ? `Relationship shaped by ${context.settlement.name} civic law.` : "No government context saved yet."
    },
    settlements: context.settlement ? [{
      settlementId: context.settlement.id,
      relationship: root.pick(["organizes workers", "opposes settlement leadership", "demands reform", "controls infrastructure politics", "provides mutual aid"]),
      strength: root.int(25, 88)
    }] : [],
    conflicts: context.conflict ? [{
      conflictId: context.conflict.id,
      role: root.pick(["primary party", "public advocate", "peace faction", "hardline faction", "spoiler", "victim constituency", "hidden instigator"]),
      stance: root.pick(["escalate leverage", "force disclosure", "negotiate settlement", "prevent sellout", "protect supporters"])
    }] : []
  };
}

function historicalDevelopmentFor(root, seed, name, origin, internalDynamics, context) {
  const firstYear = origin.foundingDate.year || CURRENT_YEAR - root.int(2, 40);
  return {
    events: [
      {
        id: `faction_history_${hashString(`${seed}:founding`).toString(36)}`,
        title: `${name} founding circle`,
        year: firstYear,
        summary: origin.originalGrievance,
        promotionStatus: "available",
        seed: deriveSeed(seed, "history-founding")
      },
      {
        id: `faction_history_${hashString(`${seed}:first-action`).toString(36)}`,
        title: root.pick(["First public assembly", "First closed congress", "Emergency petition", "Underground reorganization"]),
        year: Math.min(CURRENT_YEAR, firstYear + root.int(1, 8)),
        summary: root.pick(["The faction tests public support.", "A leadership dispute becomes visible.", "The authorities begin monitoring members.", "A document leak validates the grievance."]),
        promotionStatus: "available",
        seed: deriveSeed(seed, "history-first-action")
      },
      {
        id: `faction_history_${hashString(`${seed}:split-risk`).toString(36)}`,
        title: "Bloc dispute hardens",
        year: Math.min(CURRENT_YEAR, firstYear + root.int(4, 16)),
        summary: `${internalDynamics.blocs[0]?.name || "An internal bloc"} challenges the central strategy.`,
        promotionStatus: "available",
        seed: deriveSeed(seed, "history-bloc-dispute")
      }
    ],
    historicalEventRelationships: context.event ? [{
      eventId: context.event.id,
      relationshipType: root.pick(["formed in response to", "claims descent from", "mythologizes", "seeks to reverse", "commemorates"])
    }] : [],
    originEventId: context.event?.id || "",
    documentInfluences: context.document ? [{ documentId: context.document.id, role: "expresses worldview or exposes grievance" }] : []
  };
}

function originFor(root, seed, context, name, ideology, constraints) {
  const year = context.event?.chronology?.year || context.settlement?.founding?.year && context.settlement.founding.year + root.int(5, 90) || CURRENT_YEAR - root.int(2, 60);
  const pattern = context.conflict ? "response to a crisis" : context.organization ? "internal organizational split" : root.pick(["labor dispute", "class grievance", "resource shortage", "legal decision", "leaked document", "generational reaction", "defensive alliance", "cultural revival"]);
  return {
    originPattern: normalizeChoice(constraints.originPattern) || pattern,
    foundingDate: {
      original: String(year),
      year,
      precision: "year",
      displayDate: String(year)
    },
    originEventId: context.event?.id || "",
    founders: context.characters?.slice(0, 2).map(item => item.name) || [],
    predecessorMovements: root.maybe(0.5) ? [root.pick(["First Committee", "Old Charter Circle", "Dock Mutual Aid League", "Emergency Assembly"])] : [],
    originalGrievance: ideology.diagnosis,
    originalGoals: [ideology.preferredFuture],
    firstConstituency: context.settlement?.population?.groups?.[0]?.name || "residents excluded from formal power",
    placeOfOrigin: context.settlement?.name || context.organization?.headquarters?.settlement || context.locationName,
    initialResponseFromAuthorities: root.pick(["dismissed as noise", "quietly monitored", "met with procedural delay", "invited into talks", "publicly denounced"]),
    sourceNote: context.usesExistingWorld ? `Derived from saved context in ${context.locationName}.` : "Generated without saved local context."
  };
}

function organizationLinksFor(context) {
  return {
    hostOrganizationId: context.organization?.id || "",
    linkedOrganizationId: "",
    hybridRelationshipType: context.organization ? "internal-caucus-or-influence-network" : "",
    containingOrganizations: (context.organizations || []).map(org => ({ organizationId: org.id, relationship: "contains supporters or opponents" })),
    avoidsDuplicateOrganizationFields: true
  };
}

function communicationsFor(root, classification, identity) {
  return {
    publicVoice: root.pick(["plainspoken civic language", "legalistic charter rhetoric", "ritualized historical appeals", "angry workplace humor", "professional reform language"]),
    channels: classification.visibility === "public" ? root.shuffle(["public meetings", "pamphlets", "local media", "workplace organizers", "cultural events"]).slice(0, 4) : root.shuffle(["encrypted cells", "rumor networks", "dead drops", "anonymous documents", "coded songs"]).slice(0, 4),
    messageDiscipline: root.pick(["strict", "uneven", "chapter-dependent", "surprisingly loose"]),
    propagandaStyle: identity.symbols[0],
    rumorControlProblem: root.pick(["splinter groups speak for them", "rivals forge statements", "leaders deny leaked goals", "supporters embellish victories"])
  };
}

function recruitmentFor(root, constituency, ideology, classification) {
  const target = constituency.claimed[0] || "supporters";
  return {
    targetRecruits: constituency.claimed,
    recruitmentMessage: `${ideology.diagnosis} ${target} can act together because ${ideology.moralJustification}.`,
    entryPath: root.pick(["workplace invitation", "mutual-aid shift", "public meeting", "trusted sponsor", "student circle", "district assembly"]),
    vetting: classification.visibility === "public" ? "light public screening" : "sponsor-based and compartmented",
    initiation: root.pick(["first service shift", "oath at a closed meeting", "public signature", "training session", "no formal initiation"]),
    incentives: root.shuffle(["protection", "belonging", "political voice", "material aid", "status", "revenge disciplined into action"]).slice(0, 3),
    barriers: root.shuffle(["fear of retaliation", "dues", "family pressure", "legal risk", "ideological suspicion"]).slice(0, 3),
    retentionProblems: root.shuffle(["burnout", "security pressure", "slow victories", "leadership distrust", "regional resentment"]).slice(0, 3)
  };
}

function cultureFor(root, identity, classification) {
  return {
    meetingStyle: root.pick(["practical and late-running", "ceremonial", "argumentative but disciplined", "secretive and brief", "professionally chaired"]),
    rituals: [root.pick(["reading names of harmed families", "silent count before votes", "touching the oldest hatch", "passing an empty oxygen mask"])],
    songsOrChants: [identity.slogan],
    visualMarkers: identity.uniformsOrMarkers,
    memberStatusSymbols: root.pick(["old service badges", "color bands", "chapter pins", "work gloves", "no visible status symbols"]),
    disciplineTexture: root.pick(["social shame matters more than formal punishment", "committee review is feared", "local chapters tolerate eccentricity", "security paranoia shapes daily life"])
  };
}

function vulnerabilitiesFor(root, classification, ideology, resources, internalDynamics) {
  return {
    political: root.pick(["depends on one visible grievance", "could be outflanked by moderates", "rivals can frame it as chaos", "success may dissolve the coalition"]),
    operational: root.pick(["too many meetings are predictable", "weak document security", "one transport route carries organizers", "public leaders know little about hidden cells"]),
    ideological: ideology.contradictions[0],
    resource: resources[0]?.vulnerability || "funding uncertainty",
    internal: `${internalDynamics.schismRisk} schism risk around ${internalDynamics.disputes[0]}.`,
    scandal: root.pick(["foreign funding", "leader hypocrisy", "coerced support", "forged membership rolls", "violent splinter"])
  };
}

function futurePressuresFor(root, context, internalDynamics, externalRelations) {
  return {
    radicalizeIf: root.pick(["authorities ban public meetings", "a supporter dies in custody", "leaders are bought off", "documents prove the grievance worse than claimed"]),
    moderateIf: root.pick(["wins a limited charter concession", "enters a coalition government", "gains legal standing", "older supporters fear backlash"]),
    fragmentIf: `${internalDynamics.disputes[0]} becomes impossible to postpone.`,
    collapseIf: root.pick(["the main grievance is resolved without them", "funders leave", "a hidden patron is exposed", "chapters split by district"]),
    likelyNextMove: root.pick(["announce a public assembly", "seek a document leak", "negotiate with a rival", "organize a service slowdown", "found a mutual-aid office"]),
    conflictHooks: externalRelations.conflicts.map(item => item.stance).concat(context.conflict ? [] : ["generate a rival faction or public backlash conflict"])
  };
}

function relationshipsFor(factionId, context, leadership, externalRelations) {
  const relationships = [];
  const add = (toEntityId, toEntityType, relationshipType, label, metadata = {}) => {
    if (!toEntityId) return;
    relationships.push({
      id: `rel_${hashString(`${factionId}:${toEntityId}:${relationshipType}`).toString(36)}`,
      fromEntityId: factionId,
      fromEntityType: "faction",
      toEntityId,
      toEntityType,
      relationshipType,
      label,
      metadata
    });
  };
  add(context.settlement?.id, "settlement", "politically-active-in", `Active in ${context.settlement?.name}`);
  add(context.organization?.id, "organization", "internal-caucus-or-linked-force", `Linked to ${context.organization?.identity?.name || context.organization?.name}`);
  add(context.conflict?.id, "conflict", "party-or-advocate-in", `Involved in ${context.conflict?.name}`);
  add(context.document?.id, "document", "worldview-expressed-by", `Referenced by ${context.document?.title}`);
  add(context.event?.id, "historicalEvent", "formed-in-relation-to", `Formed around ${context.event?.title}`);
  (context.characters || []).forEach((character, index) => {
    add(character.id, "character", index === 0 ? "led-by-or-symbolized-by" : "member-or-sympathizer", `${character.name} has a faction role`, { visibility: index === 0 ? "public" : "private" });
  });
  externalRelations.organizations.forEach(rel => add(rel.entityId, "organization", rel.publicRelationship, rel.name, { privateRelationship: rel.privateRelationship }));
  return relationships;
}

function summaryFor(name, classification, ideology, constituency, goals, context) {
  const place = context.locationName;
  return `${name} is ${articleFor(classification.visibility)} ${classification.visibility} ${classification.factionType} in ${place}, claiming to represent ${constituency.claimed.join(", ")}. It argues that ${trimSentence(ideology.diagnosis).toLowerCase()} and seeks ${trimSentence(goals.publicGoals[0].description).toLowerCase()}. Its power comes less from formal assets than from constituency pressure, institutional access, and the risk that ignored grievances will harden into wider conflict.`;
}

function doctrineFor(root, context, type, pressure) {
  if (/labor|worker/i.test(type)) return `${title(pressure)} must be governed by the people whose work keeps it alive.`;
  if (/corporate|professional|caucus/i.test(type)) return `Competent insiders must reform failing institutions before outsiders break them open.`;
  if (/religious|traditional/i.test(type)) return `The present crisis comes from abandoning the duties encoded in local tradition.`;
  if (/separatist|resistance/i.test(type)) return `${context.locationName} cannot survive while distant powers decide its future.`;
  return `Political legitimacy depends on making survival systems accountable to ordinary residents.`;
}

function diagnosisFor(context, opposition, pressure, root) {
  if (context.conflict) return `${context.conflict.name} proves that ${opposition} can turn ${context.conflict.resources?.[0]?.name || pressure} into leverage.`;
  if (context.organization) return `${context.organization.identity?.name || context.organization.name} has concentrated authority without matching accountability.`;
  if (context.settlement?.tensions?.length) return `${context.settlement.tensions[0].name} reveals a deeper settlement bargain that no longer holds.`;
  return `The present order protects ${opposition} while asking ordinary people to absorb the risk.`;
}

function preferredFutureFor(root, context, type) {
  if (/labor/i.test(type)) return root.pick(["worker oversight of critical infrastructure", "a binding labor charter with safety vetoes", "district control over emergency services"]);
  if (/corporate|professional|caucus/i.test(type)) return root.pick(["a reformed institution trusted enough to survive audit", "professional governance insulated from panicked politics", "an internal accountability regime before public rupture"]);
  if (/separatist|resistance/i.test(type)) return root.pick(["local self-rule with control of life-support and transit", "recognized autonomy from offworld authorities", "a defensive alliance of local districts"]);
  return root.pick(["a civic commons for essential services", "a charter assembly with real district authority", "public law strong enough to bind powerful institutions"]);
}

function oppositionFor(context, type, root) {
  if (context.organization) return context.organization.identity?.name || context.organization.name;
  if (context.conflict?.parties?.length) return root.pick(context.conflict.parties).name;
  if (/traditional/i.test(type)) return "rootless reformers";
  if (/corporate/i.test(type)) return "populist disruption";
  return root.pick(["charter elites", "offworld owners", "emergency administrators", "security hardliners", "private utility boards"]);
}

function contradictionFor(root, context, type) {
  return root.pick([
    "It demands wider democracy but depends on a small circle of experienced negotiators.",
    "It opposes corporate control while relying on corporate infrastructure to organize.",
    "It speaks for workers but is often represented by educated professionals.",
    "It rejects surveillance but collects sensitive member information.",
    "It calls for peace while tolerating a wing that believes disruption must hurt.",
    context.organization ? "It wants institutional reform but needs the host organization to remain powerful." : "It promises local autonomy while courting outside support."
  ]);
}

function roleFor(type, context, root) {
  if (/ruling|governing/i.test(type)) return "ruling";
  if (/resistance|revolutionary|separatist/i.test(type)) return root.pick(["insurgent", "resistance", "separatist authority"]);
  if (/opposition|labor|reform|movement/i.test(type)) return root.pick(["extra-institutional opposition", "parliamentary opposition", "kingmaker"]);
  if (context.organization) return "client faction";
  return root.pick(ROLES);
}

function nameFor(root, context, type, ideology, constituency) {
  const place = context.settlement?.name?.split(" ")[0] || context.system?.name?.replace(/ System$/, "") || context.organization?.identity?.shortName || root.pick(["Meridian", "Outer Ring", "Civic", "First Landing", "Free Transit"]);
  const group = constituency.claimed[0]?.split(" ")[0] || root.pick(["Workers", "Residents", "Habitats", "Engineers", "Families"]);
  const concept = root.pick([ideology.values[0], "Commons", "Charter", "Continuity", "Assembly", "Mutualists", "League"]);
  const patterns = [
    `${place} ${concept} ${root.pick(["Coalition", "League", "Front", "Caucus", "Assembly"])}`,
    `${group} ${root.pick(["Civic Front", "Mutual Aid League", "Charter Bloc", "Reform Circle"])}`,
    `${root.pick(["Free", "Common", "Independent", "Restoration"])} ${place} ${root.pick(["Movement", "Bloc", "Alliance"])}`,
    `${place} ${title(type)}`
  ];
  return root.pick(patterns).replace(/\bundefined\b/g, "Civic");
}

function sloganFor(root, ideology) {
  return root.pick([
    "No one survives alone.",
    "The charter belongs to the living.",
    "Common risk, common rule.",
    "Truth before order.",
    "No one owns the air.",
    ideology.redLine.replace(/^permanent /i, "No permanent ")
  ]);
}

function fundingFor(root) {
  return root.pick(["membership dues", "small donations", "wealthy patron", "union funds", "crowdfunding", "diaspora contributions", "legitimate businesses", "covert sponsorship"]);
}

function resourceSource(type, context, root) {
  if (type === "money") return fundingFor(root);
  if (type === "infrastructure control") return context.organization?.identity?.name || context.settlement?.infrastructure?.utilities?.[0]?.operator || "sympathetic technicians";
  if (type === "public sympathy") return context.conflict?.civilianImpact?.vulnerableGroups?.[0] || "ordinary residents";
  if (type === "professional expertise") return context.organizations?.[0]?.industry || "technical workers";
  return root.pick(["members", "allies", "quiet patrons", "local chapters", "historical prestige"]);
}

function scopeClaimFor(scale, root) {
  if (scale === "district") return root.pick(["settlement-wide", "district-first"]);
  if (scale === "organization-wide") return root.pick(["industry-wide", "institutional reform"]);
  if (scale === "system-wide") return root.pick(["all inhabited nodes", "system charter"]);
  return root.pick([scale, "broader than its current reach"]);
}

function normalizeOrganization(org) {
  if (!org) return null;
  return {
    id: org.id,
    seed: org.seed,
    name: org.identity?.name || org.name,
    entityType: "organization",
    industry: org.profile?.industry || org.industry?.label || org.industry || "institutional power",
    role: org.profile?.ownership || org.archetype?.label || "organization"
  };
}

function normalizeCharacter(character) {
  if (!character) return null;
  return {
    id: character.id,
    seed: character.seed,
    name: character.name?.full || character.name,
    entityType: "character",
    role: character.occupation?.title || character.role || "political actor"
  };
}

function records(collection) {
  return (collection || []).map(record => record?.entity || record?.system || record?.settlement || record?.organization || record?.character || record?.conflict || record?.document || record?.timeline || record?.historicalEvent || record).filter(Boolean);
}

function normalizeChoice(value) {
  if (!value || value === "random" || value === "auto") return "";
  return value;
}

function pickOrNull(root, items) {
  return items?.length ? root.pick(items) : null;
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function uniqueById(items) {
  const seen = new Map();
  items.forEach(item => {
    if (item?.id && !seen.has(item.id)) seen.set(item.id, item);
  });
  return [...seen.values()];
}

function shortNameFor(name, root) {
  const clean = String(name || "Faction");
  if (clean.length < 22) return clean;
  return root.pick([clean.split(" ").slice(0, 2).join(" "), `The ${clean.split(" ").at(-1)}`, clean.replace(/^(Free|Common|Independent)\s+/i, "").split(" ").slice(0, 2).join(" ")]);
}

function acronym(name) {
  return String(name || "F").split(/\s+/).filter(word => !/^(of|the|and|for)$/i.test(word)).slice(0, 4).map(word => word[0]).join("").toUpperCase();
}

function title(value) {
  return String(value || "").replace(/-/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function articleFor(value) {
  return /^[aeiou]/i.test(String(value)) ? "an" : "a";
}

function trimSentence(value) {
  return String(value || "").replace(/[.?!]+$/g, "");
}
