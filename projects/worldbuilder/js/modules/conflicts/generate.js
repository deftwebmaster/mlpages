import { createSeededRandom, deterministicCreatedAt, hashString, slug } from "../../shared/random.js";

const COLORS = ["#d86a5d", "#d8b45c", "#78c99c", "#76d5d7", "#c99e63", "#f0a1b2"];
const STATUS_OPTIONS = ["emerging", "active", "escalating", "stalemated"];
const INTERVENTIONS = ["public inquiry", "back-channel negotiation", "evidence leak", "resource audit", "strike mediation", "emergency engineering", "legal injunction", "targeted evacuation"];

export function generateConflict(seed, constraints = {}) {
  const root = createSeededRandom(seed || "conflict");
  const context = normalizeContext(root, constraints.context || {});
  const source = context.source || constraints.source || { type: context.usesExistingWorld ? "existing-world-context" : "standalone" };
  const category = categoryFor(context.tension, root);
  const scope = scopeFor(context, root);
  const status = statusFor(context.tension, root);
  const districtNames = context.districts.map(district => district.name);
  const locationName = context.settlement?.name || context.system?.name || context.embedded.location.name;
  const primaryOrg = context.organizations[0] || context.embedded.organizations[0];
  const secondaryOrg = context.organizations[1] || context.embedded.organizations[1];
  const character = context.characters[0] || context.embedded.characters[0];
  const resource = resourceFor(context, category, root);
  const publicCause = context.tension.publicNarrative || context.tension.publicFace || context.tension.currentProblem || root.pick(["fairness", "security", "survival", "public order"]);
  const hiddenCause = context.tension.hiddenPressure || context.tension.privateCause || context.tension.linkedHazard || root.pick(["sealed audit", "off-ledger contract", "failing machinery", "buried testimony"]);
  const incitingMove = incitingMoveFor(context, primaryOrg, root);
  const name = constraints.name || conflictName(root, context, resource, category);
  const id = `conflict_${hashString(seed).toString(36)}`;
  const parties = makeParties(root, context, primaryOrg, secondaryOrg, character, resource);
  const summary = makeSummary({ name, locationName, primaryOrg, secondaryOrg, character, resource, incitingMove, publicCause, hiddenCause, status });
  const chronology = makeChronology(root, context, incitingMove, hiddenCause);
  const metrics = makeMetrics(root, context, status);

  return {
    id,
    entityType: "conflict",
    schemaVersion: 1,
    seed,
    name,
    subtitle: `${titleCase(category.primary)} pressure in ${locationName}`,
    createdAt: deterministicCreatedAt(seed),
    updatedAt: deterministicCreatedAt(`${seed}:updated`),
    source,
    classification: {
      scope,
      category: category.primary,
      secondaryCategories: category.secondary,
      status,
      visibility: root.pick(["public", "public", "restricted", "leaking"]),
      intensity: intensityLabel(metrics.intensity),
      durationType: root.pick(["flashpoint", "developing-crisis", "slow-burn", "open-crisis"]),
      narrativeScale: root.pick(["supporting", "major", "major", "central"])
    },
    location: {
      systemId: context.system?.id || context.settlement?.location?.systemId || "",
      systemName: context.system?.name || context.settlement?.location?.systemName || context.embedded.location.systemName,
      settlementId: context.settlement?.id || "",
      settlementName: context.settlement?.name || "",
      districtIds: context.districts.map(district => district.id).filter(Boolean),
      districtNames,
      organizationLocationIds: context.organizations.map(org => org.id).filter(Boolean)
    },
    summary,
    parties,
    causes: {
      rootCause: context.tension.rootCause || context.tension.economicTie || root.pick(["maintenance debt", "charter ambiguity", "migration pressure", "corporate leverage", "scarcity politics"]),
      precipitatingIncident: incitingMove,
      publicCause,
      hiddenCause,
      whyNow: whyNowFor(context, root)
    },
    stakes: makeStakes(root, context, resource),
    resources: makeResources(root, context, resource),
    powerBalance: makePowerBalance(root, parties),
    chronology,
    escalation: makeEscalation(root, context, resource),
    pressurePoints: makePressurePoints(root, context, resource),
    publicNarrative: {
      headline: `${titleCase(publicCause)} crisis at ${locationName}`,
      dominantBelief: `Most residents believe the conflict is about ${publicCause}.`,
      rumor: root.pick(["inspection records were altered", "a council member was bought", "a route closure was staged", "a union witness disappeared"]),
      controlledBy: primaryOrg.name
    },
    hiddenTruth: {
      truth: `The conflict is being driven by ${hiddenCause}.`,
      evidence: root.pick(["maintenance telemetry", "suppressed inspection records", "private message logs", "cargo manifests", "sealed witness statements"]),
      whoKnows: [character.name, primaryOrg.name].filter(Boolean),
      exposureRisk: root.pick(["would collapse a contract", "would trigger arrests", "would force emergency rationing", "would delegitimize the government"])
    },
    affectedEntities: affectedEntitiesFor(context, parties),
    civilianImpact: {
      vulnerableGroups: root.shuffle(["shift workers", "dependent families", "migrants", "clinic patients", "outer district residents", "maintenance crews"]).slice(0, 3),
      immediateHarm: root.pick(["ration delays", "lost work shifts", "unsafe transit", "permit denials", "evacuation queues", "policing pressure"]),
      longTermHarm: root.pick(["district displacement", "institutional mistrust", "resource dependency", "normalized emergency law", "family separations"]),
      everydayTexture: `${locationName} residents now plan ordinary errands around alerts, queues, and rumor.`
    },
    possibleInterventions: makeInterventions(root, parties),
    outcomes: makeOutcomes(root, parties, resource),
    storyHooks: makeStoryHooks(root, context, character, resource),
    relationships: relationshipsFor(id, context, parties),
    metrics,
    presentation: {
      accentColor: root.pick(COLORS),
      dossierStyle: "crisis-brief",
      mapStyle: "pressure-network"
    },
    favorite: false,
    tags: [scope, category.primary, status, context.usesExistingWorld ? "world-linked" : "standalone"],
    notes: ""
  };
}

export function conflictMarkdown(conflict) {
  return [
    `# ${conflict.name}`,
    "",
    `Seed: ${conflict.seed}`,
    `Status: ${conflict.classification.status}`,
    `Scope: ${conflict.classification.scope}`,
    `Category: ${conflict.classification.category}`,
    "",
    conflict.summary,
    "",
    "## Parties",
    ...conflict.parties.map(party => `- ${party.name}: wants ${party.publicGoal}; privately wants ${party.privateGoal}. Leverage: ${party.leverage}. Vulnerability: ${party.vulnerability}.`),
    "",
    "## Causes",
    `- Public cause: ${conflict.causes.publicCause}`,
    `- Hidden cause: ${conflict.causes.hiddenCause}`,
    `- Why now: ${conflict.causes.whyNow}`,
    "",
    "## Stakes",
    ...conflict.stakes.map(stake => `- ${stake.name}: ${stake.description}`),
    "",
    "## Escalation",
    ...conflict.escalation.ladder.map(step => `- ${step.stage}: ${step.event}`),
    "",
    "## Interventions",
    ...conflict.possibleInterventions.map(item => `- ${item.choice}: ${item.effect} Risk: ${item.risk}`),
    "",
    "## Affected Existing Entities",
    ...conflict.affectedEntities.map(item => `- ${item.name} (${item.entityType}): ${item.effect}`)
  ].join("\n");
}

function normalizeContext(root, raw) {
  const system = raw.system || null;
  const settlement = raw.settlement || null;
  const selectedDistrict = raw.district || null;
  const settlementDistricts = selectedDistrict ? [selectedDistrict] : root.shuffle(settlement?.districts || []).slice(0, 2);
  const organizations = uniqueById([
    raw.organization,
    ...(raw.organizations || []),
    ...(settlement?.organizations || []).slice(0, 3)
  ].filter(Boolean).map(normalizeOrganization));
  const characters = uniqueById([raw.character, ...(raw.characters || [])].filter(Boolean).map(normalizeCharacter));
  const embedded = standaloneContext(root);
  const tension = normalizeTension(raw.tension || raw.summary || {}, root);
  return {
    ...raw,
    system,
    settlement,
    districts: settlementDistricts.length ? settlementDistricts : embedded.districts,
    organizations: organizations.length ? organizations : embedded.organizations,
    characters: characters.length ? characters : embedded.characters,
    tension,
    embedded,
    usesExistingWorld: Boolean(system || settlement || raw.organization || raw.character || raw.tension || raw.summary)
  };
}

function normalizeOrganization(org) {
  if (!org) return null;
  return {
    id: org.id,
    seed: org.seed,
    name: org.identity?.name || org.name,
    entityType: "organization",
    industry: org.profile?.industry || org.industry || org.role || "civic services",
    publicReputation: org.profile?.reputation || org.publicReputation || org.influence || "locally important"
  };
}

function normalizeCharacter(character) {
  if (!character) return null;
  return {
    id: character.id,
    seed: character.seed,
    name: character.name?.full || character.name,
    entityType: "character",
    role: character.occupation?.title || character.role || character.classification?.characterRole || "local witness"
  };
}

function normalizeTension(tension, root) {
  return {
    id: tension.id || "",
    name: tension.name || tension.title || tension.category || tension.publicFace || root.pick(["Resource access dispute", "Emergency authority crisis", "Labor and safety dispute"]),
    parties: tension.parties || [],
    rootCause: tension.rootCause || tension.privateCause || "",
    publicNarrative: tension.publicNarrative || tension.publicFace || "",
    hiddenPressure: tension.hiddenPressure || tension.privateCause || tension.linkedHazard || "",
    affectedDistricts: tension.affectedDistricts || [],
    escalationRisk: tension.escalationRisk || tension.pressure || "",
    currentStatus: tension.currentStatus || tension.currentState || "",
    possibleOutcomes: tension.possibleOutcomes || [],
    relatedHistory: tension.relatedHistory || tension.escalationTrigger || "",
    currentProblem: tension.currentProblem || ""
  };
}

function standaloneContext(root) {
  const location = {
    name: `${root.pick(["Port", "Civic", "Dawn", "Glass", "Low"])} ${root.pick(["Meridian", "Vesper", "Alecto", "Nereid", "Kestrel"])}`,
    systemName: `${root.pick(["Meridian", "Orison", "Bellamy", "Canto"])} System`
  };
  return {
    location,
    districts: [
      { id: "embedded_district_1", name: root.pick(["Freight Basin", "Civic Core", "Lower Works"]), districtType: "embedded district" },
      { id: "embedded_district_2", name: root.pick(["Executive Ring", "Pressure Gardens", "Transit Spine"]), districtType: "embedded district" }
    ],
    organizations: [
      { id: "embedded_org_1", name: `${root.pick(["Kestrel", "Meridian", "Aster"])} ${root.pick(["Transit", "Atmospherics", "Works"])}`, entityType: "embedded-organization", industry: "infrastructure" },
      { id: "embedded_org_2", name: `${root.pick(["Civic", "Dockworkers", "Resident"])} ${root.pick(["Council", "Union", "Compact"])}`, entityType: "embedded-organization", industry: "public authority" }
    ],
    characters: [
      { id: "embedded_character_1", name: `${root.pick(["Elena", "Mira", "Noor", "Tarek"])} ${root.pick(["Voric", "Chen", "Okoye", "Rios"])}`, entityType: "embedded-character", role: "local investigator" }
    ]
  };
}

function categoryFor(tension, root) {
  const text = `${tension.name} ${tension.rootCause} ${tension.publicNarrative}`.toLowerCase();
  const primary = /labor|strike|union/.test(text) ? "labor"
    : /water|oxygen|air|resource|utility|ration/.test(text) ? "resource"
    : /surveillance|data|record|information/.test(text) ? "information"
    : /corporate|privatization|contract/.test(text) ? "corporate"
    : /environment|terraform|hazard/.test(text) ? "environmental"
    : /family|personal|relationship/.test(text) ? "personal"
    : root.pick(["political", "economic", "infrastructure", "legal"]);
  const secondary = root.shuffle(["political", "corporate", "legal", "social", "infrastructure", "economic", "surveillance"]).filter(item => item !== primary).slice(0, 3);
  return { primary, secondary };
}

function scopeFor(context, root) {
  if (context.system && !context.settlement) return "system";
  if (context.settlement) return "settlement";
  if (context.organization) return "organizational";
  if (context.character) return "personal";
  return root.pick(["district", "settlement", "organizational"]);
}

function statusFor(tension, root) {
  const text = `${tension.currentStatus} ${tension.escalationRisk}`.toLowerCase();
  if (/severe|high|worsening|near open|near strike/.test(text)) return "escalating";
  if (/negotiated|contained|court/.test(text)) return root.pick(["active", "stalemated"]);
  return root.pick(STATUS_OPTIONS);
}

function resourceFor(context, category, root) {
  if (category.primary === "resource") return root.pick(["oxygen reserves", "water rights", "reactor priority", "docking capacity", "medical supply"]);
  if (category.primary === "labor") return root.pick(["shift authority", "strike legitimacy", "hazard pay", "inspection access"]);
  if (category.primary === "information") return root.pick(["inspection records", "identity files", "route telemetry", "private message logs"]);
  const utility = context.settlement?.infrastructure?.utilities?.[0]?.name;
  return utility || root.pick(["charter authority", "public trust", "contract control", "transit access"]);
}

function incitingMoveFor(context, primaryOrg, root) {
  if (context.tension.relatedHistory) return context.tension.relatedHistory;
  return root.pick([
    `${primaryOrg.name} changes access rules without publishing the audit trail`,
    `${primaryOrg.name} redirects a critical allocation to a protected district`,
    `a public hearing exposes contradictory maintenance records`,
    `a missing shipment makes quiet scarcity impossible to hide`
  ]);
}

function conflictName(root, context, resource, category) {
  const place = context.settlement?.name || context.system?.name || context.embedded.location.name;
  const issue = context.tension.name || titleCase(category.primary);
  return root.pick([
    `The ${place} ${titleCase(resource)} Crisis`,
    `${issue} in ${place}`,
    `The ${place} Pressure Case`,
    `${place}: ${titleCase(category.primary)} Flashpoint`
  ]);
}

function makeParties(root, context, primaryOrg, secondaryOrg, character, resource) {
  return [
    party(root, primaryOrg, "institution", `retain control over ${resource}`, "avoid exposing old liability"),
    party(root, secondaryOrg, "challenger", `force public access to ${resource}`, "gain leverage before negotiations close"),
    party(root, character, "individual", "protect people who will be blamed first", "choose which record becomes public")
  ];
}

function party(root, entity, role, publicGoal, privateGoal) {
  return {
    id: entity.id || `embedded_party_${slug(entity.name)}`,
    entityType: entity.entityType || "embedded-summary",
    name: entity.name,
    role,
    publicGoal,
    privateGoal,
    leverage: root.pick(["contract authority", "public sympathy", "technical access", "legal standing", "control of records", "credible witnesses"]),
    vulnerability: root.pick(["depends on fragile legitimacy", "has hidden exposure", "cannot survive delays", "is internally divided", "needs public order"]),
    currentMove: root.pick(["withholding documents", "organizing testimony", "rerouting supplies", "calling emergency meetings", "threatening a walkout"])
  };
}

function makeSummary({ locationName, primaryOrg, secondaryOrg, character, resource, incitingMove, publicCause, hiddenCause, status }) {
  return `In ${locationName}, ${primaryOrg.name} and ${secondaryOrg.name} are locked in ${articleFor(status)} ${status} conflict over ${resource}. After ${incitingMove}, ${character.name} discovers that the public story about ${publicCause} conceals ${hiddenCause}, forcing existing institutions and vulnerable residents into a crisis that is already moving.`;
}

function whyNowFor(context, root) {
  return context.tension.currentStatus
    ? `The source pressure is currently ${context.tension.currentStatus}, which narrows the window for quiet compromise.`
    : root.pick(["A routine audit crossed a political deadline.", "A supply delay turned old inequity into public danger.", "A witness finally has leverage.", "Emergency powers are about to become permanent."]);
}

function makeStakes(root, context, resource) {
  const place = context.settlement?.name || context.system?.name || context.embedded.location.name;
  return [
    { name: "Civilian safety", description: `${resource} access determines who can keep working, traveling, or breathing safely in ${place}.`, severity: root.pick(["high", "severe"]) },
    { name: "Institutional legitimacy", description: "The authority structure survives only if the public accepts its version of events.", severity: root.pick(["moderate", "high", "severe"]) },
    { name: "Future precedent", description: "Whatever settlement is reached becomes the rule for the next scarcity event.", severity: root.pick(["moderate", "high"]) }
  ];
}

function makeResources(root, context, resource) {
  return [
    { name: resource, controller: context.organizations[0]?.name || context.embedded.organizations[0].name, scarcity: root.pick(["acute", "politically manufactured", "uneven by district", "temporarily hidden"]) },
    { name: "Public records", controller: root.pick(["municipal clerks", "corporate auditors", "security office"]), scarcity: "restricted" },
    { name: "Witness credibility", controller: context.characters[0]?.name || context.embedded.characters[0].name, scarcity: "fragile" }
  ];
}

function makePowerBalance(root, parties) {
  return {
    dominantPartyId: parties[0].id,
    visibleAdvantage: parties[0].leverage,
    hiddenAdvantage: parties[1].leverage,
    weakestPartyId: parties[2].id,
    whyNoOneCanWinCleanly: root.pick(["every option exposes a different lie", "the legal authority and the practical authority are split", "the public needs the service too badly to shut it down", "the evidence is real but politically dangerous"])
  };
}

function makeChronology(root, context, incitingMove, hiddenCause) {
  const base = 2326;
  return [
    { year: base - 4, title: "Old compromise", event: context.tension.rootCause || "A private agreement lets a fragile system keep operating.", visibility: "restricted" },
    { year: base - 1, title: "Warning signs", event: hiddenCause, visibility: "hidden" },
    { year: base, title: "Trigger", event: incitingMove, visibility: "public" },
    { year: base, title: "Current pressure", event: context.tension.currentStatus || "The crisis moves into public institutions.", visibility: "public" }
  ];
}

function makeEscalation(root, context, resource) {
  return {
    currentThreshold: root.pick(["before first casualty", "before emergency law hardens", "before documents leak", "before transit shuts down"]),
    ladder: [
      { stage: "Pressure", event: `${titleCase(resource)} access becomes uneven and documented.` },
      { stage: "Exposure", event: "A partial record reaches people who can act on it." },
      { stage: "Retaliation", event: root.pick(["permits are revoked", "security arrests a witness", "a route is closed", "a district walkout begins"]) },
      { stage: "Break", event: root.pick(["general strike", "public evacuation", "council collapse", "corporate takeover attempt"]) }
    ],
    noInterventionOutcome: root.pick(["emergency rule becomes permanent", "a preventable disaster is blamed on residents", "the vulnerable party accepts a settlement that hides the truth", "violence turns a solvable crisis into a founding grievance"])
  };
}

function makePressurePoints(root, context, resource) {
  return [
    { name: context.tension.name, kind: "source", pressure: context.tension.currentStatus || "active" },
    { name: `${titleCase(resource)} dependency`, kind: "resource", pressure: root.pick(["scarce", "controlled", "misallocated"]) },
    { name: "Suppressed evidence", kind: "information", pressure: root.pick(["hidden", "leaking", "contested"]) }
  ];
}

function makeInterventions(root, parties) {
  return root.shuffle(INTERVENTIONS).slice(0, 5).map(choice => ({
    choice: titleCase(choice),
    effect: root.pick(["shifts leverage toward witnesses", "buys time but hardens public positions", "protects civilians while exposing records", "forces one institution to choose openly"]),
    risk: root.pick(["retaliation", "panic", "evidence loss", "legal trap", "violent escalation"]),
    likelyBacker: root.pick(parties).name
  }));
}

function makeOutcomes(root, parties, resource) {
  return [
    { name: "Negotiated disclosure", result: `${parties[0].name} releases partial records and preserves limited control of ${resource}.`, cost: "truth remains incomplete" },
    { name: "Public rupture", result: `${parties[1].name} wins a visible concession.`, cost: "the authority structure retaliates later" },
    { name: "Quiet sacrifice", result: `${parties[2].name} prevents immediate harm by burying decisive proof.`, cost: "the same machinery survives" }
  ];
}

function makeStoryHooks(root, context, character, resource) {
  return [
    { usefulFor: "mystery", premise: `${character.name} can prove ${resource} was misallocated, but the proof incriminates an ally.`, complication: "The first document is genuine and still incomplete." },
    { usefulFor: "political thriller", premise: `A public vote becomes a proxy battle over the crisis.`, complication: root.pick(["the strongest reformer is compromised", "the opposition is right for the wrong reason", "a security office is staging a provocation"]) },
    { usefulFor: "survival drama", premise: `A vulnerable district loses access before the official deadline.`, complication: "Helping them openly changes the power balance for everyone else." }
  ];
}

function relationshipsFor(conflictId, context, parties) {
  return affectedEntitiesFor(context, parties)
    .filter(entity => entity.id && !entity.entityType.startsWith("embedded"))
    .map(entity => ({
      id: `rel_${hashString(`${conflictId}:${entity.id}`).toString(36)}`,
      fromEntityId: conflictId,
      fromEntityType: "conflict",
      toEntityId: entity.id,
      toEntityType: entity.entityType,
      relationshipType: "affects",
      label: `Affects ${entity.name}`,
      metadata: { role: entity.role || entity.effect || "" }
    }));
}

function affectedEntitiesFor(context, parties) {
  const entities = [];
  if (context.system) entities.push({ id: context.system.id, entityType: "star-system", name: context.system.name, effect: "system-level politics are pulled into the crisis" });
  if (context.settlement) entities.push({ id: context.settlement.id, entityType: "settlement", name: context.settlement.name, effect: "daily civic operations are disrupted" });
  context.districts.forEach(district => entities.push({ id: district.id, entityType: "district", name: district.name, effect: "local residents absorb the immediate cost" }));
  parties.forEach(party => entities.push({ id: party.id, entityType: party.entityType, name: party.name, effect: party.role }));
  return uniqueById(entities);
}

function makeMetrics(root, context, status) {
  const tense = status === "escalating";
  const existingBonus = context.usesExistingWorld ? 6 : 0;
  return {
    intensity: clamp(root.int(48, 86) + (tense ? 10 : 0)),
    volatility: clamp(root.int(42, 90) + (tense ? 8 : 0)),
    visibility: clamp(root.int(36, 84) + existingBonus),
    civilianRisk: clamp(root.int(40, 88)),
    institutionalRisk: clamp(root.int(44, 91) + existingBonus),
    escalationRisk: clamp(root.int(45, 92) + (tense ? 6 : 0)),
    tractability: clamp(root.int(18, 58) - (tense ? 6 : 0))
  };
}

function intensityLabel(value) {
  if (value > 78) return "high";
  if (value > 54) return "moderate";
  return "low";
}

function clamp(value) {
  return Math.max(1, Math.min(98, value));
}

function titleCase(value) {
  return String(value).replace(/\b\w/g, char => char.toUpperCase());
}

function articleFor(value) {
  return /^[aeiou]/i.test(String(value)) ? "an" : "a";
}

function uniqueById(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.id || item.name;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
