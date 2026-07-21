import { createSeededRandom, deriveSeed, deterministicCreatedAt, hashString, slug } from "../../shared/random.js";

const GIVEN_NAMES = "Ada Arden Mina Cassian Juno Selene Omar Nia Talia Soren Vale Ilya Mara Ren Toshiko Leona Darius Nyla Aran Sima Idris Kira Sol Marcus Edda Pilar Tomas Hana Lucien Vera Amal Rowan Elena Mira Keon Noor Imani Tarek Ysolde".split(" ");
const FAMILY_NAMES = "Voss Bellamy Chen Okoye Idris Kwan Sato Moreau Rios Kepler Serrano Armitage Banerjee El-Masri Dumas Havel Renaud Singh Mbeki Orlov Yarrow Vale Noakes Toma Farrow Quade Lorca Ames Ware Voric Nadir Calder".split(" ");
const SPECIES = ["human", "modified human", "synthetic person", "uplift-line descendant", "low-gravity adapted human", "posthuman"];
const GENDERS = ["woman", "man", "nonbinary person", "agender person"];
const PRONOUNS = ["she/her", "he/him", "they/them", "ze/zir"];
const ROLES = ["supporting-protagonist", "antagonist", "ally", "rival", "witness", "patron", "foil", "instigator", "protector", "double-agent"];
const OCCUPATIONS = ["dockmaster", "systems auditor", "pressure engineer", "customs inspector", "labor organizer", "archive clerk", "security liaison", "transit medic", "habitat planner", "shipyard foreman", "water-rights advocate", "research technician", "port advocate", "communications analyst"];
const SOCIAL_STATUS = ["precarious working class", "professional working class", "credentialed specialist", "local elite", "contract-dependent migrant", "disgraced official", "respected civic worker"];
const DISTRICT_FALLBACKS = ["Old Landing", "Freight Basin", "Civic Core", "Lower Works", "Transit Spine", "Pressure Gardens"];
const COLORS = ["#c99e63", "#76d5d7", "#9ecf8f", "#d88972", "#a6b7ff", "#e0d1a6", "#f0a1b2", "#78c99c"];

export function generateCharacter(seed, constraints = {}) {
  const root = createSeededRandom(seed || "character");
  const summary = constraints.summary || {};
  const context = constraints.context || {};
  const settlement = context.settlement || null;
  const organization = context.organization || null;
  const district = context.district || pickDistrict(root, settlement, constraints.districtId);
  const fullName = summary.name || constraints.name || makeName(root);
  const nameParts = splitName(fullName);
  const occupation = occupationFor(root, summary, constraints, organization, settlement);
  const characterRole = normalizeChoice(constraints.characterRole) || root.pick(ROLES);
  const socialStatus = normalizeChoice(constraints.socialStatus) || root.pick(SOCIAL_STATUS);
  const age = Number(summary.age || constraints.age) || ageFor(root, summary.role || occupation);
  const id = summary.promotedEntityId || `character_${hashString(seed).toString(36)}`;
  const employer = organization
    ? { id: organization.id, name: organization.identity?.name || organization.name, type: "organization" }
    : embeddedEmployer(root, settlement);
  const location = currentLocationFor(root, settlement, district);
  const origin = originFor(root, summary, context, location);
  const identity = makeIdentity(root, age, constraints);
  const metrics = makeMetrics(root, characterRole, socialStatus);
  const pressure = pressureFor(root, settlement, organization);
  const relationships = makeRelationships(root.derive("relationships"), id, fullName, seed, { settlement, organization, district, employer, pressure, density: constraints.relationshipDensity });
  const entityRelationships = relationshipsFor(id, { settlement, organization, district }, employer);
  const history = makeHistory(root.derive("history"), fullName, origin, location, occupation, relationships, pressure);
  const goals = makeGoals(root.derive("goals"), occupation, pressure, relationships);
  const secrets = makeSecrets(root.derive("secrets"), relationships, organization, settlement);
  const conflicts = makeConflicts(root.derive("conflicts"), relationships, pressure, goals, secrets);

  return {
    id,
    entityType: "character",
    schemaVersion: 1,
    seed,
    name: {
      full: fullName,
      given: nameParts.given,
      family: nameParts.family,
      aliases: aliasesFor(root, fullName, occupation),
      pronouns: normalizeChoice(constraints.pronouns) || summary.pronouns || root.pick(PRONOUNS),
      demonym: settlement?.demonym || location.demonym || root.pick(["Meridian", "Vesper", "Alectan", "Canto"])
    },
    createdAt: deterministicCreatedAt(seed),
    updatedAt: deterministicCreatedAt(`${seed}:updated`),
    source: context.source || { type: "standalone" },
    classification: {
      characterRole,
      occupationCategory: slug(occupation),
      socialStatus,
      legalStatus: root.pick(["citizen", "provisional resident", "contract resident", "restricted worker", "stateless claimant"]),
      publicVisibility: visibilityFor(root, summary, occupation),
      lifeStage: age < 30 ? "early-career" : age < 55 ? "mid-career" : "late-career"
    },
    identity,
    origin,
    currentLocation: location,
    occupation: {
      title: titleCase(summary.role || constraints.occupation || occupation),
      category: occupation,
      employerId: employer.id,
      employerName: employer.name,
      employerType: employer.type,
      rank: rankFor(root, summary.role || occupation),
      worksite: district?.name || root.pick(DISTRICT_FALLBACKS),
      dailyWork: dailyWorkFor(root, occupation, employer.name),
      leverageAtWork: root.pick(["controls permits", "knows old maintenance maps", "owns critical passwords", "keeps people calm", "can delay shipments", "understands who owes whom"]),
      occupationalHazard: root.pick(["radiation exposure", "political retaliation", "bad pressure seals", "identity audits", "route violence", "quiet blacklisting"])
    },
    affiliations: makeAffiliations(root.derive("affiliations"), employer, settlement),
    appearance: makeAppearance(root.derive("appearance"), identity, occupation),
    personality: makePersonality(root.derive("personality")),
    competencies: makeCompetencies(root.derive("competencies"), occupation),
    limitations: makeLimitations(root.derive("limitations"), relationships),
    beliefs: makeBeliefs(root.derive("beliefs"), settlement, organization),
    habits: root.shuffle(["checks exits before sitting", "keeps paper notes", "uses old dock slang", "eats at the same shift counter", "never misses civic hearings", "records promises in a pocket ledger"]).slice(0, 4),
    possessions: makePossessions(root.derive("possessions"), occupation, relationships),
    relationships,
    entityRelationships,
    history,
    goals,
    fears: root.shuffle(["being publicly exposed", "failing dependents", "losing local standing", "sealed records opening", "another preventable disaster", "becoming useful to the wrong people"]).slice(0, 4),
    secrets,
    conflicts,
    routines: makeRoutines(root.derive("routines"), location, occupation, relationships),
    storyFunction: makeStoryFunction(root.derive("story"), characterRole, relationships, pressure),
    storyHooks: makeStoryHooks(root.derive("hooks"), relationships, goals, secrets, conflicts),
    metrics,
    network: networkMetrics(relationships),
    presentation: {
      accentColor: root.pick(COLORS),
      portraitStyle: "archive-silhouette",
      dossierStyle: root.pick(["personnel-record", "civic-casefile", "witness-brief", "restricted-biography"])
    },
    summary: summaryText(fullName, occupation, location, employer, relationships, pressure),
    favorite: false,
    tags: [slug(characterRole), slug(occupation), slug(socialStatus), "relationships-core"],
    notes: ""
  };
}

export function characterMarkdown(character) {
  return [
    `# ${character.name.full}`,
    "",
    `Seed: ${character.seed}`,
    `Role: ${character.classification.characterRole}`,
    `Occupation: ${character.occupation.title}`,
    `Location: ${character.currentLocation.settlementName}, ${character.currentLocation.districtName}`,
    "",
    character.summary,
    "",
    "## Relationship Network",
    ...character.relationships.map(rel => `- ${rel.relatedName} (${rel.relationshipType}): loyalty ${rel.loyalty}/100, trust ${rel.trust}/100, debt ${rel.debt}/100. Obligation: ${rel.obligation}. Secret: ${rel.secret}`),
    "",
    "## Goals",
    ...character.goals.map(goal => `- ${goal.want}. Obstacle: ${goal.obstacle}`),
    "",
    "## Secrets",
    ...character.secrets.map(secret => `- ${secret.title}: ${secret.risk}`),
    "",
    "## Story Hooks",
    ...character.storyHooks.map(hook => `- ${hook.premise} ${hook.complication}`)
  ].join("\n");
}

function normalizeChoice(value) {
  return value && value !== "random" ? value : "";
}

function makeName(rand) {
  return `${rand.pick(GIVEN_NAMES)} ${rand.pick(FAMILY_NAMES)}`;
}

function splitName(fullName) {
  const parts = String(fullName).trim().split(/\s+/);
  return { given: parts[0] || "", family: parts.slice(1).join(" ") || "" };
}

function pickDistrict(rand, settlement, districtId) {
  if (!settlement?.districts?.length) return null;
  return settlement.districts.find(item => item.id === districtId || item.name === districtId) || rand.pick(settlement.districts);
}

function occupationFor(rand, summary, constraints, organization, settlement) {
  if (summary.role) return summary.role.toLowerCase();
  if (normalizeChoice(constraints.occupation)) return constraints.occupation;
  const industry = organization?.industry?.label || organization?.profile?.industry || settlement?.economy?.primaryIndustries?.[0] || "";
  if (/freight|shipping|orbital/i.test(industry)) return rand.pick(["dockmaster", "cargo adjudicator", "route dispatcher"]);
  if (/security|defense|customs/i.test(industry)) return rand.pick(["security liaison", "customs inspector", "incident investigator"]);
  if (/archive|records|finance|insurance/i.test(industry)) return rand.pick(["records advocate", "systems auditor", "claims examiner"]);
  if (/medical|research|university/i.test(industry)) return rand.pick(["transit medic", "research technician", "ethics monitor"]);
  return rand.pick(OCCUPATIONS);
}

function ageFor(rand, role) {
  if (/chief|director|mayor|founder|executive/i.test(role)) return rand.int(42, 76);
  return rand.int(22, 68);
}

function embeddedEmployer(rand, settlement) {
  const org = settlement?.organizations?.length ? rand.pick(settlement.organizations) : null;
  return org
    ? { id: org.id, name: org.name, type: "organization-summary" }
    : { id: `embedded_employer_${rand.int(1000, 9999)}`, name: `${rand.pick(["Meridian", "Civic", "Kestrel", "Aster"])} ${rand.pick(["Authority", "Works", "Registry", "Compact"])}`, type: "embedded-summary" };
}

function currentLocationFor(rand, settlement, district) {
  return {
    systemId: settlement?.location?.systemId || "",
    settlementId: settlement?.id || "",
    districtId: district?.id || "",
    settlementName: settlement?.name || rand.pick(["Port Meridian", "Civic Vesper", "Glass Anchorage", "Dawn Ring"]),
    districtName: district?.name || rand.pick(DISTRICT_FALLBACKS),
    demonym: settlement?.demonym || "",
    residenceType: rand.pick(["cooperative apartment", "shift-share room", "family pressure block", "employer housing", "converted storage loft", "clinic dormitory"]),
    livingConditions: rand.pick(["stable but crowded", "secure and watched", "cheap and unreliable", "comfortable by local standards", "dependent on employer favor", "one missed payment from collapse"])
  };
}

function originFor(rand, summary, context, location) {
  const homeSettlement = summary.origin || context.organization?.headquarters?.settlement || rand.pick(["Alecto Refuge", "Low Harbor", "Nereid Vault", "Kallisto Yard", location.settlementName]);
  return {
    systemId: "",
    settlementId: "",
    districtId: null,
    birthplaceSummary: `${homeSettlement}, where ${rand.pick(["route work", "scarcity politics", "old disaster memory", "contract law", "maintenance culture"])} shaped childhood expectations.`,
    familyBackground: rand.pick(["third-generation habitat workers", "mobile contract family", "minor civic officials", "debt-burdened technicians", "evacuees with unfinished claims", "well-connected but declining professionals"]),
    migrationHistory: [
      `${rand.int(2290, 2318)}: relocated for ${rand.pick(["work", "training", "family safety", "a sealed legal settlement", "medical treatment"])}`,
      `${rand.int(2319, 2325)}: became entangled in ${location.settlementName} local obligations`
    ]
  };
}

function makeIdentity(rand, age, constraints) {
  const gender = normalizeChoice(constraints.gender) || rand.pick(GENDERS);
  return {
    age,
    species: normalizeChoice(constraints.species) || rand.pick(SPECIES),
    gender,
    culturalIdentity: rand.shuffle(["dock-born", "charter loyalist", "route diaspora", "pressure-culture local", "guild educated", "post-Earth secular"]).slice(0, 2),
    citizenships: rand.shuffle(["local charter", "system compact", "corporate resident", "provisional habitat"]).slice(0, 2),
    languages: rand.shuffle(["Standard", "Dock Cant", "Charter Creole", "Survey Sign", "Company Legal"]).slice(0, 3),
    augmentations: rand.shuffle(["retinal overlay", "radiation repair grafts", "memory indexing implant", "none declared", "bone-density therapy", "sleep-cycle mod"]).slice(0, 2),
    adaptations: rand.shuffle(["low-gravity balance", "sealed-habitat lungs", "stress microtremor training", "long-shift tolerance", "vacuum alarm conditioning"]).slice(0, 2)
  };
}

function aliasesFor(rand, name, occupation) {
  return rand.shuffle([`${titleCase(occupation)} ${name.split(" ").at(-1)}`, name.split(" ")[0], `${name.split(" ")[0]} from ${rand.pick(["Old Landing", "the Basin", "the Board", "the Docks"])}`]).slice(0, rand.int(1, 2));
}

function visibilityFor(rand, summary, occupation) {
  if (summary.role || /chief|director|mayor|dockmaster/i.test(occupation)) return rand.pick(["locally prominent", "institutionally visible", "controversial public figure"]);
  return rand.pick(["mostly private", "known in one district", "visible to officials", "well-known among workers"]);
}

function rankFor(rand, occupation) {
  if (/chief|director|mayor|executive/i.test(occupation)) return "senior authority";
  return rand.pick(["junior staff", "trusted specialist", "shift lead", "independent operator", "middle authority", "informal fixer"]);
}

function dailyWorkFor(rand, occupation, employerName) {
  return `${titleCase(occupation)} work for ${employerName} means ${rand.pick(["settling disputes before they become official", "signing off on hazardous exceptions", "keeping crews moving through tired systems", "translating policy into survivable routine", "deciding whose emergency becomes visible"])}.`;
}

function pressureFor(rand, settlement, organization) {
  const tension = settlement?.tensions?.length ? rand.pick(settlement.tensions) : null;
  const incident = organization?.incidents?.length ? rand.pick(organization.incidents) : null;
  return {
    public: tension?.name || incident?.category || rand.pick(["permit corruption", "housing pressure", "route delays", "labor unrest", "surveillance expansion"]),
    hidden: tension?.hiddenPressure || incident?.unofficial || rand.pick(["sealed audit", "family debt", "identity mismatch", "missing witness", "quiet bribe ledger"]),
    institution: organization?.identity?.name || settlement?.government?.officialName || rand.pick(["the Civic Authority", "the Transit Board", "a private contractor"])
  };
}

function makeRelationships(rand, characterId, characterName, seed, context) {
  const density = normalizeChoice(context.density);
  const count = density === "sparse" ? 4 : density === "dense" ? 8 : rand.int(5, 7);
  const types = ["family", "mentor", "rival", "dependent", "debtor", "protector", "handler", "old friend", "political opponent", "secret ally"];
  return rand.shuffle(types).slice(0, count).map((relationshipType, index) => {
    const relatedName = makeName(rand);
    const loyalty = scoreByType(rand, relationshipType, "loyalty");
    const trust = scoreByType(rand, relationshipType, "trust");
    const debt = scoreByType(rand, relationshipType, "debt");
    return {
      id: `rel_${hashString(`${characterId}:person:${index}:${relatedName}`).toString(36)}`,
      relatedPersonId: `person_${hashString(`${seed}:${relatedName}`).toString(36)}`,
      relatedName,
      relationshipType,
      relatedRole: relatedRoleFor(rand, context, relationshipType),
      status: rand.pick(["active", "strained", "hidden", "estranged", "publicly cordial", "dangerously dependent"]),
      loyalty,
      trust,
      debt,
      powerBalance: rand.pick(["character holds leverage", "other party holds leverage", "mutual dependence", "officially unequal", "emotionally unequal"]),
      obligation: obligationFor(rand, characterName, relatedName, relationshipType, context.pressure),
      secret: secretFor(rand, relatedName, relationshipType, context.pressure),
      leverage: rand.pick(["access records", "old testimony", "medical dependency", "family reputation", "permit authority", "blackmail file", "shared guilt"]),
      conflict: rand.pick(["wants protection but resents control", "needs help but cannot admit why", "public loyalty masks private anger", "their goals compete for the same scarce resource", "one truth would ruin both of them"]),
      storyUse: rand.pick(["pressure point", "moral test", "betrayal vector", "rescue obligation", "information route", "emotional anchor"])
    };
  });
}

function scoreByType(rand, type, metric) {
  const base = {
    family: { loyalty: 74, trust: 58, debt: 62 },
    mentor: { loyalty: 63, trust: 71, debt: 68 },
    rival: { loyalty: 22, trust: 34, debt: 45 },
    dependent: { loyalty: 78, trust: 64, debt: 82 },
    debtor: { loyalty: 42, trust: 38, debt: 88 },
    protector: { loyalty: 70, trust: 55, debt: 73 },
    handler: { loyalty: 31, trust: 26, debt: 64 },
    "old friend": { loyalty: 69, trust: 67, debt: 37 },
    "political opponent": { loyalty: 14, trust: 24, debt: 28 },
    "secret ally": { loyalty: 64, trust: 46, debt: 52 }
  }[type] || { loyalty: 50, trust: 50, debt: 50 };
  return clamp(base[metric] + rand.int(-18, 18));
}

function relatedRoleFor(rand, context, type) {
  if (type === "political opponent") return rand.pick(["council aide", "union challenger", "security captain", "district organizer"]);
  if (type === "handler") return rand.pick(["case officer", "corporate compliance lead", "civic intelligence liaison"]);
  if (type === "dependent") return rand.pick(["younger sibling", "injured crewmate", "undocumented resident", "former apprentice"]);
  return rand.pick(["maintenance lead", "records clerk", "dock worker", "medic", "permit broker", context.employer?.name || "local official"]);
}

function obligationFor(rand, characterName, relatedName, type, pressure) {
  if (type === "family") return `${characterName} keeps ${relatedName} away from ${pressure.public.toLowerCase()} proceedings.`;
  if (type === "debtor") return `${relatedName} can call in a favor that would expose ${pressure.hidden}.`;
  if (type === "dependent") return `${characterName} must protect ${relatedName}'s housing, papers, or medical access.`;
  return rand.pick([
    `${characterName} owes ${relatedName} truthful warning before the next official action.`,
    `${relatedName} expects quiet access to information before it reaches ${pressure.institution}.`,
    `${characterName} promised not to turn private harm into public evidence.`
  ]);
}

function secretFor(rand, relatedName, type, pressure) {
  if (type === "secret ally") return `${relatedName} is feeding evidence about ${pressure.hidden}.`;
  if (type === "rival") return `${relatedName} knows which record was altered.`;
  return rand.pick([
    `${relatedName} appears in a sealed file tied to ${pressure.hidden}.`,
    `The relationship began during a suppressed ${pressure.public.toLowerCase()} incident.`,
    `${relatedName} is the reason one public decision went the wrong way.`
  ]);
}

function relationshipsFor(characterId, context, employer) {
  const rels = [];
  if (context.settlement?.id) {
    rels.push({
      id: `rel_${hashString(`${characterId}:${context.settlement.id}`).toString(36)}`,
      fromEntityId: characterId,
      fromEntityType: "character",
      toEntityId: context.settlement.id,
      toEntityType: "settlement",
      relationshipType: "lives-in",
      label: `Lives in ${context.settlement.name}`,
      metadata: { districtId: context.district?.id || "" }
    });
  }
  if (context.organization?.id || employer.id) {
    rels.push({
      id: `rel_${hashString(`${characterId}:${context.organization?.id || employer.id}`).toString(36)}`,
      fromEntityId: characterId,
      fromEntityType: "character",
      toEntityId: context.organization?.id || employer.id,
      toEntityType: "organization",
      relationshipType: "works-for",
      label: `Works for ${employer.name}`,
      metadata: { employerType: employer.type }
    });
  }
  return rels;
}

function makeHistory(rand, name, origin, location, occupation, relationships, pressure) {
  const start = 2280 + rand.int(0, 28);
  return [
    { year: start, title: "Early obligation", description: `${name} learned early that family survival depended on ${origin.familyBackground}.`, relatedRelationshipId: relationships[0]?.id || "", consequence: "Private loyalty became stronger than institutional trust." },
    { year: start + rand.int(7, 18), title: "Migration", description: `${name} arrived in ${location.settlementName} with few protections and one useful credential.`, relatedRelationshipId: relationships[1]?.id || "", consequence: "Local debts began to matter more than official status." },
    { year: 2320 + rand.int(0, 5), title: "Pressure event", description: `${pressure.public} forced ${name} to choose between clean procedure and protecting someone specific.`, relatedRelationshipId: relationships[2]?.id || "", consequence: "A private network now shapes every public decision." }
  ];
}

function makeGoals(rand, occupation, pressure, relationships) {
  return [
    { want: `Resolve ${pressure.public.toLowerCase()} without exposing ${pressure.hidden}.`, obstacle: `${relationships[0]?.relatedName || "a dependent"} needs the truth kept partial.`, stakes: "public legitimacy and private safety" },
    { want: `Gain enough authority as ${occupation} to protect vulnerable people.`, obstacle: `${pressure.institution} benefits from slow action.`, stakes: "career, housing, and political standing" },
    { want: `Get free of one old obligation.`, obstacle: `${relationships[1]?.relatedName || "an old ally"} can still call in the debt.`, stakes: "freedom to act honestly" }
  ];
}

function makeSecrets(rand, relationships, organization, settlement) {
  return relationships.slice(0, 4).map((rel, index) => ({
    id: `secret_${index}`,
    title: index === 0 ? "Altered record" : rand.pick(["Hidden kinship", "Off-ledger payment", "Suppressed testimony", "False credential"]),
    holderRelationshipId: rel.id,
    knownBy: rel.relatedName,
    risk: rand.pick(["would end employment", "would trigger arrest", "would destroy trust", "would change an election", "would expose a safety failure"]),
    containment: rand.pick(["sealed archive note", "mutual silence", "bribed clerk", "missing witness", "ambiguous law"]),
    tiedEntity: organization?.identity?.name || settlement?.name || "local authority"
  }));
}

function makeConflicts(rand, relationships, pressure, goals, secrets) {
  return relationships.slice(0, 4).map((rel, index) => ({
    id: `conflict_${index}`,
    name: `${rel.relationshipType} pressure with ${rel.relatedName}`,
    publicFace: pressure.public,
    privateCause: secrets[index]?.title || pressure.hidden,
    opposingGoal: goals[index % goals.length].want,
    escalationTrigger: rand.pick(["a public hearing", "a missing shipment", "a medical emergency", "a security sweep", "an old recording resurfacing"]),
    likelyBetrayal: rel.trust < 45 ? rel.relatedName : rand.pick([rel.relatedName, "the character", "a third party"])
  }));
}

function makeAffiliations(rand, employer, settlement) {
  return [
    { name: employer.name, role: "employee or office-holder", loyalty: rand.int(28, 82), benefit: "salary, access, protection", cost: "visibility and compliance" },
    { name: settlement?.government?.officialName || "Local civic registry", role: "resident", loyalty: rand.int(22, 76), benefit: "legal standing", cost: "paper trail" },
    { name: rand.pick(["District mutual aid board", "Dock workers' kitchen", "Transit grievance circle", "Pressure seal volunteer crew"]), role: "informal member", loyalty: rand.int(54, 93), benefit: "real help", cost: "dangerous favors" }
  ];
}

function makeAppearance(rand, identity, occupation) {
  return {
    build: rand.pick(["compact and wiry", "tall and tired", "solid from utility labor", "slight but composed", "augmented posture"]),
    distinguishingFeatures: rand.shuffle(["old radiation freckles", "visible wrist interface", "scar across one eyebrow", "formal station haircut", "callused pressure-glove hands", "carefully neutral expression"]).slice(0, 3),
    clothing: `${rand.pick(["patched civic jacket", "pressure-rated work coat", "plain formal uniform", "soft utility layers"])} with ${occupation} insignia`,
    movement: rand.pick(["economical", "restless", "deliberately calm", "always half-turned toward exits", "low-gravity graceful"]),
    firstImpression: `${identity.species} ${identity.gender} who seems ${rand.pick(["hard to surprise", "tired of officials", "kind until cornered", "more observant than friendly"])}`
  };
}

function makePersonality(rand) {
  return {
    publicManner: rand.pick(["dry and procedural", "warm but evasive", "controlled and exact", "bluntly practical", "quietly charismatic"]),
    privateManner: rand.pick(["angrier than expected", "funny in trusted rooms", "exhausted by compromise", "sentimental about old places", "afraid of needing people"]),
    contradiction: rand.pick(["protects rules by breaking them", "hates secrecy but survives by it", "seeks peace through threats", "wants independence while collecting dependents"]),
    underPressure: rand.pick(["triages people before truth", "becomes coldly efficient", "cuts deals too quickly", "refuses to abandon the vulnerable", "asks who benefits"]),
    moralBlindSpot: rand.pick(["family exceptions", "institutional loyalty", "revenge disguised as reform", "overconfidence in paperwork", "mercy for the wrong person"])
  };
}

function makeCompetencies(rand, occupation) {
  return rand.shuffle([
    `expert ${occupation} procedure`,
    "reads power dynamics quickly",
    "knows local infrastructure shortcuts",
    "can calm volatile rooms",
    "finds missing records",
    "builds favors across class lines",
    "works well during alarms"
  ]).slice(0, 5);
}

function makeLimitations(rand, relationships) {
  return [
    `Cannot act freely where ${relationships[0]?.relatedName || "family"} is exposed.`,
    rand.pick(["Slow to trust outsiders.", "Too willing to absorb blame.", "Uses silence as a tool until it becomes a trap.", "Underestimates ideological enemies."]),
    rand.pick(["Dependent on employer access.", "Medical records are vulnerable.", "Housing status can be challenged.", "One old decision limits every new option."])
  ];
}

function makeBeliefs(rand, settlement, organization) {
  return {
    politics: rand.pick(["localist reform", "charter pragmatism", "anti-corporate civic duty", "order-first survivalism", "quiet syndicalism"]),
    faithOrPhilosophy: rand.pick(["secular duty ethic", "ancestor ledger tradition", "machine-ritual agnosticism", "pressure-community reciprocity", "private fatalism"]),
    viewOfPower: `${organization?.identity?.name || settlement?.government?.officialName || "institutions"} are necessary, dangerous, and never as competent as they claim.`,
    taboo: rand.pick(["abandoning dependents", "falsifying casualty records", "wasting air", "selling out district witnesses", "mocking disaster rituals"])
  };
}

function makePossessions(rand, occupation, relationships) {
  return [
    { item: "old access card", significance: `Still opens one door a ${occupation} should no longer reach.` },
    { item: "creased paper ledger", significance: `Lists favors owed by ${relationships.slice(0, 3).map(rel => rel.relatedName).join(", ")}.` },
    { item: rand.pick(["pressure charm", "medical injector", "sealed photo wafer", "repair knife"]), significance: "Looks sentimental, functions as evidence." }
  ];
}

function makeRoutines(rand, location, occupation, relationships) {
  return [
    `Begins shift in ${location.districtName}, checking messages from ${relationships[0]?.relatedName || "a dependent"} before official dispatch.`,
    `Eats after peak traffic so people can approach without being seen.`,
    `Walks a longer route home to pass one pressure door tied to old ${occupation} work.`,
    `Keeps one evening open for favors, emergencies, or apologies.`
  ];
}

function makeStoryFunction(rand, role, relationships, pressure) {
  return {
    narrativeRole: role,
    primaryUse: rand.pick(["turn public conflict personal", "carry secrets between factions", "force moral choices", "make institutions human", "connect districts through favors"]),
    relationshipEngine: `${relationships.length} active ties create obligations around ${pressure.public.toLowerCase()}.`,
    pressurePoint: relationships.reduce((highest, rel) => rel.debt > highest.debt ? rel : highest, relationships[0]).relatedName,
    likelyArc: rand.pick(["chooses truth over safety", "becomes a reluctant broker", "betrays an institution to save a person", "mistakes loyalty for justice", "turns private guilt into public reform"])
  };
}

function makeStoryHooks(rand, relationships, goals, secrets, conflicts) {
  return conflicts.slice(0, 5).map((conflict, index) => {
    const rel = relationships[index % relationships.length];
    return {
      premise: `${rel.relatedName} asks for help just as ${conflict.publicFace.toLowerCase()} becomes public.`,
      complication: `${secrets[index % secrets.length].title} would make ${goals[index % goals.length].want.toLowerCase()} nearly impossible.`,
      usefulFor: rel.storyUse
    };
  });
}

function makeMetrics(rand, role, socialStatus) {
  return {
    influence: clamp(rand.int(24, 84) + (/elite|senior|prominent|antagonist/.test(`${role} ${socialStatus}`) ? 12 : 0)),
    competence: clamp(rand.int(42, 92)),
    resilience: clamp(rand.int(35, 91)),
    volatility: clamp(rand.int(18, 74)),
    empathy: clamp(rand.int(25, 92)),
    ambition: clamp(rand.int(22, 88)),
    secrecy: clamp(rand.int(30, 94)),
    socialReach: clamp(rand.int(28, 90))
  };
}

function networkMetrics(relationships) {
  const averageTrust = Math.round(relationships.reduce((sum, rel) => sum + rel.trust, 0) / relationships.length);
  const averageDebt = Math.round(relationships.reduce((sum, rel) => sum + rel.debt, 0) / relationships.length);
  return {
    relationshipDensity: relationships.length,
    averageTrust,
    averageDebt,
    unstableTies: relationships.filter(rel => rel.trust < 40 || rel.debt > 75).length,
    hiddenTies: relationships.filter(rel => rel.status === "hidden" || rel.relationshipType.includes("secret")).length
  };
}

function summaryText(name, occupation, location, employer, relationships, pressure) {
  const names = relationships.slice(0, 3).map(rel => rel.relatedName).join(", ");
  return `${name} is a ${occupation} in ${location.districtName}, ${location.settlementName}, tied to ${employer.name}. Their story is driven by a living relationship network: ${names} create obligations, leverage, and divided loyalties around ${pressure.public.toLowerCase()}.`;
}

function titleCase(value) {
  return String(value).replace(/\b\w/g, char => char.toUpperCase());
}

function clamp(value) {
  return Math.max(3, Math.min(98, value));
}
