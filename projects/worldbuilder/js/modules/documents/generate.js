import { createSeededRandom, deriveSeed, deterministicCreatedAt, hashString, slug } from "../../shared/random.js";

export const DOCUMENT_FAMILIES = [
  family("news-media", "News and Media", ["news-article", "breaking-news-bulletin", "investigative-report", "interview-transcript", "press-briefing"]),
  family("corporate", "Corporate and Workplace", ["internal-memorandum", "employee-notice", "personnel-file", "performance-review", "internal-email", "press-release", "incident-report", "annual-report"]),
  family("government-civic", "Government and Civic", ["public-notice", "executive-order", "council-minutes", "emergency-declaration", "utility-advisory", "civic-report"]),
  family("legal-security", "Legal and Security", ["police-report", "witness-statement", "arrest-warrant", "court-ruling", "contract", "legal-complaint"]),
  family("military-intelligence", "Military and Intelligence", ["mission-briefing", "intelligence-assessment", "situation-report", "after-action-report"]),
  family("scientific-technical", "Scientific and Technical", ["research-report", "inspection-report", "technical-specification", "maintenance-log", "anomaly-report"]),
  family("medical-health", "Medical and Public Health", ["medical-record", "public-health-bulletin", "quarantine-notice"]),
  family("personal", "Personal Correspondence and Records", ["personal-letter", "email", "diary-entry", "recorded-message-transcript", "will"]),
  family("logistics", "Transportation and Logistics", ["cargo-manifest", "passenger-manifest", "docking-authorization", "navigation-log"]),
  family("propaganda-emergency", "Propaganda and Emergency", ["political-leaflet", "strike-leaflet", "emergency-alert", "evacuation-notice"])
];

export const DOCUMENT_TYPES = DOCUMENT_FAMILIES.flatMap(item => item.types.map(type => ({
  id: type,
  label: titleCase(type.replace(/-/g, " ")),
  familyId: item.id,
  familyLabel: item.label
})));

const PURPOSES = ["inform", "command", "persuade", "record", "accuse", "request", "authorize", "deny", "warn", "conceal", "document-compliance", "justify-action", "influence-opinion", "preserve-memory", "establish-identity", "create-obligation", "gather-intelligence", "seek-help", "confess", "threaten", "recruit", "commemorate"];
const ACCESS_LEVELS = ["public", "internal", "confidential", "restricted", "secret", "medical-private", "command-only", "executive-only", "declassified", "illegally-obtained"];
const RELIABILITY = ["highly-reliable", "reliable", "mostly-reliable", "incomplete", "biased-but-factual", "uncertain", "mistaken", "deceptive", "forged", "propaganda", "disputed", "authenticity-unknown"];
const AUTHENTICITY = ["genuine-original", "genuine-copy", "authenticated-transcript", "unverified-copy", "forgery", "altered-document", "reconstructed-fragment", "leaked-document", "stolen-record", "intercepted-transmission", "declassified-record", "anonymous-submission"];
const STATUSES = ["draft", "submitted", "issued", "approved", "rejected", "superseded", "amended", "archived", "classified", "declassified", "leaked", "intercepted", "partially-recovered", "disputed"];
const VOICES = ["professional", "bureaucratic", "technical", "legalistic", "journalistic", "emergency", "personal", "military", "propagandistic", "academic", "fragmented"];
const COLORS = ["#f2eee6", "#d8d2c8", "#e8edf0", "#eee4cf", "#dbe7df", "#f1d7ca"];

export function generateDocument(seed, constraints = {}) {
  const root = createSeededRandom(seed || "document");
  const context = normalizeContext(root, constraints.context || {});
  const type = pickDocumentType(root.derive("type"), constraints.documentType || context.summary?.documentType || context.summary?.type || constraints.type, context, constraints.documentFamily);
  const family = DOCUMENT_FAMILIES.find(item => item.id === type.familyId) || DOCUMENT_FAMILIES[0];
  const author = chooseAuthor(root.derive("authorship"), context, type);
  const issuer = chooseIssuer(root.derive("issuer"), context, type, author);
  const recipient = chooseRecipient(root.derive("recipient"), context, type);
  const subject = chooseSubject(context, type);
  const purpose = makePurpose(root.derive("purpose"), type, subject, recipient);
  const knowledge = makeKnowledge(root.derive("knowledge"), context, author, type);
  const perspective = makePerspective(root.derive("perspective"), context, author, issuer, type);
  const classification = makeClassification(root.derive("classification"), type, context, constraints);
  const title = constraints.title || context.summary?.title || titleFor(root.derive("title"), type, subject, context);
  const inUniverseDate = documentDate(root.derive("date"), context);
  const sections = makeSections(root.derive("sections"), { title, type, family, author, issuer, recipient, subject, purpose, knowledge, perspective, classification, context });
  const claims = makeClaims(root.derive("claims"), sections, subject, knowledge, classification);
  const quotations = makeQuotations(root.derive("quotes"), context, type, knowledge);
  const redactions = makeRedactions(root.derive("redactions"), sections, classification, knowledge);
  const annotations = makeAnnotations(root.derive("annotations"), sections, classification, perspective);
  const attachments = makeAttachments(root.derive("attachments"), type, subject, context);
  const signatures = makeSignatures(root.derive("signatures"), author, issuer, type);
  const stamps = makeStamps(root.derive("stamps"), classification);
  const id = `document_${hashString(seed).toString(36)}`;
  const plainText = sectionsToPlainText(sections);

  return {
    id,
    entityType: "document",
    schemaVersion: 1,
    seed,
    title,
    subtitle: subtitleFor(type, subject, classification),
    documentType: type.id,
    documentTypeLabel: type.label,
    documentFamily: family.id,
    documentFamilyLabel: family.label,
    createdAt: deterministicCreatedAt(seed),
    updatedAt: deterministicCreatedAt(`${seed}:updated`),
    inUniverseDate,
    chronology: {
      calendarId: context.settlement ? `calendar_${slug(context.settlement.name)}` : "calendar_local",
      displayDate: displayDate(inUniverseDate, context),
      sequenceIndex: null
    },
    authorship: {
      authorCharacterIds: author.entityType === "character" ? [author.id] : [],
      issuingOrganizationId: issuer.entityType === "organization" ? issuer.id : "",
      issuingOffice: issuer.office,
      signatoryCharacterId: author.entityType === "character" ? author.id : "",
      ghostwriterCharacterId: null,
      authorName: author.name,
      issuingOrganizationName: issuer.name
    },
    recipients: {
      characterIds: recipient.entityType === "character" ? [recipient.id] : [],
      organizationIds: recipient.entityType === "organization" ? [recipient.id] : [],
      audienceGroups: [recipient.audience],
      distribution: classification.accessLevel
    },
    subject,
    classification,
    purpose,
    content: {
      sections,
      plainText,
      structuredFields: structuredFieldsFor(type, context, subject, issuer, recipient)
    },
    knowledgeContext: knowledge,
    perspective,
    claims,
    contradictions: makeContradictions(root.derive("contradictions"), claims, classification),
    quotations,
    annotations,
    attachments,
    signatures,
    stamps,
    redactions,
    references: referencesFor(context, subject),
    relationships: relationshipsFor(id, context, subject, author, issuer, recipient),
    presentation: {
      templateId: templateFor(type),
      paperTone: root.pick(COLORS),
      typography: typographyFor(type),
      sealId: issuer.id || "",
      wearLevel: root.pick(["clean", "folded", "annotated", "scanned-copy", "digital-original", "partial-fragment"]),
      scanStyle: root.pick(["digital-original", "print-ready", "archive-copy", "secure-terminal"])
    },
    source: context.source || { type: context.usesExistingWorld ? "existing-world-context" : "standalone" },
    historicalMetadata: {
      significance: context.conflict ? "major" : root.pick(["minor", "moderate", "major"]),
      eventEntityIds: [context.conflict?.id, context.summary?.id].filter(Boolean),
      evidentiaryValue: root.pick(["primary-source", "secondary-account", "institutional-record", "personal-record"]),
      laterInterpretations: []
    },
    documentChain: [],
    collectionIds: [],
    favorite: false,
    tags: [family.id, type.id, classification.accessLevel, classification.reliability],
    notes: ""
  };
}

export function documentMarkdown(document, { redacted = true } = {}) {
  return [
    `# ${document.title}`,
    "",
    document.subtitle || "",
    "",
    `Type: ${document.documentTypeLabel}`,
    `Family: ${document.documentFamilyLabel}`,
    `Date: ${document.chronology.displayDate}`,
    `Author: ${document.authorship.authorName}`,
    `Issuer: ${document.authorship.issuingOrganizationName || "None"}`,
    `Access: ${document.classification.accessLevel}`,
    `Reliability: ${document.classification.reliability}`,
    "",
    "## Purpose",
    `- Stated: ${document.purpose.statedPurpose}`,
    `- Actual: ${document.purpose.actualPurpose}`,
    `- Desired action: ${document.purpose.desiredAction}`,
    "",
    ...document.content.sections.map(section => sectionToMarkdown(section, document.redactions, redacted)),
    "",
    "## Claims",
    ...document.claims.map(claim => `- ${claim.statement} (${claim.certainty}; ${claim.visibility})`),
    "",
    "## Perspective",
    ...document.perspective.biases.map(item => `- ${item}`),
    "",
    "## Connections",
    ...document.references.map(ref => `- ${ref.entityType}: ${ref.name}`)
  ].filter(Boolean).join("\n");
}

export function documentPlainText(document, options = {}) {
  return documentMarkdown(document, options).replace(/^#+\s/gm, "").replace(/^- /gm, "");
}

export function documentPrintableHtml(document, { redacted = true } = {}) {
  const sections = document.content.sections.map(section => `<section><h2>${escapeHtml(section.title || section.type)}</h2>${section.items ? `<ul>${section.items.map(item => `<li>${escapeHtml(applyRedactions(item, document.redactions, redacted))}</li>`).join("")}</ul>` : `<p>${escapeHtml(applyRedactions(section.content || "", document.redactions, redacted))}</p>`}</section>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(document.title)}</title><style>body{font:16px Georgia,serif;background:#eee;margin:0;padding:32px}.page{max-width:760px;margin:auto;background:${document.presentation.paperTone};color:#111;padding:48px;box-shadow:0 12px 40px #999}h1{font-family:Arial,sans-serif;text-transform:uppercase}.stamp{border:2px solid #7a1f16;color:#7a1f16;display:inline-block;padding:6px 10px;text-transform:uppercase}@media print{body{background:white;padding:0}.page{box-shadow:none;max-width:none}}</style></head><body><article class="page"><p class="stamp">${escapeHtml(document.classification.accessLevel)}</p><h1>${escapeHtml(document.title)}</h1><p>${escapeHtml(document.subtitle || "")}</p><p><strong>${escapeHtml(document.documentTypeLabel)}</strong> / ${escapeHtml(document.chronology.displayDate)} / ${escapeHtml(document.authorship.authorName)}</p>${sections}</article></body></html>`;
}

export function validateDocument(document) {
  const errors = [];
  if (document.entityType !== "document") errors.push("Entity type must be document.");
  if (!document.title) errors.push("Document title is required.");
  if (!DOCUMENT_TYPES.some(type => type.id === document.documentType)) errors.push("Document type is not registered.");
  if (!DOCUMENT_FAMILIES.some(family => family.id === document.documentFamily)) errors.push("Document family is not registered.");
  if (!document.purpose?.statedPurpose) errors.push("Document purpose is required.");
  if (!document.content?.sections?.length) errors.push("Document sections are required.");
  if (new Set(document.content.sections.map(section => section.id)).size !== document.content.sections.length) errors.push("Section IDs must be unique.");
  if (!document.knowledgeContext) errors.push("Author knowledge context is required.");
  if (!document.classification?.reliability) errors.push("Reliability is required.");
  if (document.redactions?.some(redaction => !document.content.sections.some(section => section.id === redaction.sectionId))) errors.push("Redactions must reference valid sections.");
  return { valid: !errors.length, errors };
}

function family(id, label, types) {
  return { id, label, types };
}

function normalizeContext(rand, raw) {
  const system = raw.system || null;
  const settlement = raw.settlement || null;
  const organization = normalizeOrganization(raw.organization) || normalizeOrganization(raw.organizations?.[0]) || normalizeOrganization(settlement?.organizations?.[0]) || null;
  const character = normalizeCharacter(raw.character) || normalizeCharacter(raw.characters?.[0]) || null;
  const conflict = raw.conflict || null;
  const summary = raw.summary || null;
  const district = raw.district || (settlement?.districts?.length ? rand.pick(settlement.districts) : null);
  const embedded = standaloneContext(rand);
  return {
    ...raw,
    system,
    settlement,
    organization,
    character,
    conflict,
    district,
    summary,
    embedded,
    usesExistingWorld: Boolean(system || settlement || organization || character || conflict || summary)
  };
}

function standaloneContext(rand) {
  return {
    author: { id: "embedded_author", name: `${rand.pick(["Mira", "Elena", "Noor", "Tarek"])} ${rand.pick(["Voric", "Chen", "Okoye", "Rios"])}`, entityType: "embedded-character", role: "records officer" },
    organization: { id: "embedded_issuer", name: `${rand.pick(["Kestrel", "Meridian", "Civic"])} ${rand.pick(["Transit", "Authority", "Archive"])}`, entityType: "embedded-organization", industry: "public administration", office: "Records Desk" },
    location: { name: `${rand.pick(["Port", "Glass", "Dawn"])} ${rand.pick(["Meridian", "Kestrel", "Vesper"])}`, systemName: `${rand.pick(["Meridian", "Orison", "Canto"])} System` },
    subject: { id: "embedded_subject", name: rand.pick(["dock access dispute", "life-support audit", "restricted archive filing", "route closure"]), entityType: "embedded-event" }
  };
}

function normalizeOrganization(org) {
  if (!org) return null;
  return {
    id: org.id,
    seed: org.seed,
    name: org.identity?.name || org.name,
    entityType: "organization",
    industry: org.profile?.industry || org.industry || "institutional operations",
    office: org.departments?.[0]?.name || org.role || "Administrative Office",
    reputation: org.profile?.reputation || org.publicReputation || "locally important",
    culture: org.culture
  };
}

function normalizeCharacter(character) {
  if (!character) return null;
  return {
    id: character.id,
    seed: character.seed,
    name: character.name?.full || character.name,
    entityType: "character",
    role: character.occupation?.title || character.role || "local witness",
    voice: character.personality,
    occupation: character.occupation,
    beliefs: character.beliefs,
    secrets: character.secrets || [],
    goals: character.goals || []
  };
}

function pickDocumentType(rand, requested, context, requestedFamily = "") {
  if (requested && requested !== "random") {
    const found = DOCUMENT_TYPES.find(type => type.id === requested || type.label.toLowerCase() === String(requested).toLowerCase());
    if (found) return found;
  }
  if (requestedFamily && requestedFamily !== "random") {
    const familyTypes = DOCUMENT_TYPES.filter(type => type.familyId === requestedFamily);
    if (familyTypes.length) return rand.pick(familyTypes);
  }
  if (context.conflict) return rand.pick(DOCUMENT_TYPES.filter(type => ["news-article", "internal-memorandum", "witness-statement", "emergency-alert", "strike-leaflet", "legal-complaint", "intelligence-assessment"].includes(type.id)));
  if (context.character) return rand.pick(DOCUMENT_TYPES.filter(type => ["personnel-file", "performance-review", "personal-letter", "diary-entry", "email", "witness-statement"].includes(type.id)));
  if (context.organization) return rand.pick(DOCUMENT_TYPES.filter(type => ["internal-memorandum", "press-release", "incident-report", "annual-report", "employee-notice", "inspection-report"].includes(type.id)));
  if (context.settlement) return rand.pick(DOCUMENT_TYPES.filter(type => ["public-notice", "utility-advisory", "civic-report", "emergency-declaration", "news-article"].includes(type.id)));
  return rand.pick(DOCUMENT_TYPES);
}

function chooseAuthor(rand, context, type) {
  if (context.character) return context.character;
  if (type.familyId === "personal") return context.embedded.author;
  const leader = context.organization?.leadership?.[0];
  if (leader) return normalizeCharacter(leader);
  return context.embedded.author;
}

function chooseIssuer(rand, context, type, author) {
  if (type.familyId === "personal" && rand.maybe(0.7)) return { id: "", name: "", entityType: "none", office: "Personal" };
  return context.organization || normalizeOrganization(context.conflict?.parties?.[0]) || context.embedded.organization;
}

function chooseRecipient(rand, context, type) {
  if (type.familyId === "news-media") return { id: "", name: "public readers", entityType: "audience", audience: "public" };
  if (type.familyId === "personal" && context.character) return { id: "", name: "trusted recipient", entityType: "audience", audience: "private-recipient" };
  if (context.organization) return { ...context.organization, audience: rand.pick(["department heads", "dock supervisors", "authorized personnel", "council members"]) };
  return { id: "", name: rand.pick(["general public", "restricted staff", "district residents", "review board"]), entityType: "audience", audience: rand.pick(["public", "internal-readers", "district-population", "review-board"]) };
}

function chooseSubject(context, type) {
  const entity = context.conflict || context.character || context.organization || context.settlement || context.system || context.summary || context.embedded.subject;
  return {
    primaryEntityId: entity.id || "",
    primaryEntityType: entity.entityType || (context.conflict ? "conflict" : "embedded-summary"),
    primaryEntityName: entity.name?.full || entity.name || entity.title || entity.category || "unfiled subject",
    relatedEntityIds: [context.settlement?.id, context.organization?.id, context.character?.id, context.conflict?.id, context.system?.id].filter(Boolean),
    incidentIds: context.summary?.id ? [context.summary.id] : []
  };
}

function makePurpose(rand, type, subject, recipient) {
  const purpose = purposeForType(type, rand);
  return {
    statedPurpose: `${titleCase(purpose.replace(/-/g, " "))} ${subject.primaryEntityName} for ${recipient.name}.`,
    actualPurpose: rand.pick([
      `limit institutional exposure while preserving a usable record`,
      `make the reader act before the subject becomes harder to control`,
      `establish a version of events that can survive later review`,
      `preserve evidence without saying everything the author suspects`
    ]),
    desiredAction: rand.pick(["acknowledge receipt", "change behavior", "authorize next steps", "accept the official framing", "protect vulnerable parties", "open a review"]),
    institutionalFunction: purpose,
    consequenceOfIgnoring: rand.pick(["loss of access", "civilian harm", "disciplinary action", "political escalation", "evidence becoming stale"])
  };
}

function purposeForType(type, rand) {
  if (/alert|advisory|notice|bulletin|evacuation/.test(type.id)) return "warn";
  if (/warrant|order|directive|authorization/.test(type.id)) return "authorize";
  if (/report|log|minutes|record|manifest|file/.test(type.id)) return "record";
  if (/leaflet|press-release|article/.test(type.id)) return "influence-opinion";
  if (/letter|email|message|diary/.test(type.id)) return rand.pick(["seek-help", "preserve-memory", "confess"]);
  return rand.pick(PURPOSES);
}

function makeKnowledge(rand, context, author, type) {
  const publicFacts = [
    context.settlement ? `${context.settlement.name} is publicly known as the location of the matter.` : context.embedded.location.name,
    context.conflict ? context.conflict.publicNarrative?.dominantBelief || context.conflict.summary : `${context.summary?.title || context.summary?.name || "the subject"} is already in local records.`
  ].filter(Boolean);
  const institutionalFacts = [
    context.organization ? `${context.organization.name} controls relevant files or procedures.` : "",
    context.settlement?.government ? `${context.settlement.government.officialName} has jurisdiction.` : ""
  ].filter(Boolean);
  const knownSecrets = [];
  const unknownSecrets = [];
  if (context.conflict?.hiddenTruth?.truth && accessRank(accessForType(type)) >= 2) knownSecrets.push(context.conflict.hiddenTruth.truth);
  else if (context.conflict?.hiddenTruth?.truth) unknownSecrets.push("hidden driver of the conflict");
  if (author.secrets?.length && type.familyId === "personal") knownSecrets.push(author.secrets[0].title);
  return {
    publicFacts,
    institutionalFacts,
    witnessedFacts: rand.shuffle([context.summary?.summary, context.summary?.description, context.conflict?.causes?.precipitatingIncident]).filter(Boolean).slice(0, 2),
    trustedClaims: rand.shuffle([context.conflict?.causes?.publicCause, context.summary?.officialCause, context.summary?.rootCause]).filter(Boolean).slice(0, 2),
    rumors: rand.shuffle([context.conflict?.publicNarrative?.rumor, context.summary?.unofficial, "records were altered before review"]).filter(Boolean).slice(0, 2),
    knownSecrets,
    unknownSecrets,
    falseBeliefs: rand.maybe(0.25) ? [rand.pick(["the delay was accidental", "the public casualty count is complete", "the issuer is neutral"])] : [],
    inferredInformation: rand.shuffle(["the timing benefits one institution", "the public explanation is narrower than the evidence", "the affected district lacks leverage"]).slice(0, 2),
    accessLevel: accessForType(type)
  };
}

function makePerspective(rand, context, author, issuer, type) {
  return {
    institutionalLoyalty: issuer.name ? rand.pick(["high", "moderate", "strained", "performative"]) : "none",
    politicalAlignment: rand.pick(["order-first", "localist", "reformist", "corporate-pragmatic", "public-interest", "private"]),
    personalLoyalty: author.goals?.[0]?.want || rand.pick(["protect dependents", "protect the institution", "avoid blame", "force disclosure"]),
    selfInterest: rand.pick(["career protection", "legal safety", "public credibility", "family survival", "moral repair"]),
    emotionalState: rand.pick(["controlled", "angry but careful", "afraid of consequences", "professionally detached", "urgent"]),
    audienceAwareness: `Written for ${type.familyId === "personal" ? "someone expected to read between the lines" : "readers who know institutional shorthand"}.`,
    confidence: rand.pick(["high", "moderate", "limited", "overstated"]),
    biases: rand.shuffle([
      issuer.name ? `protects ${issuer.name}'s legitimacy` : "protects personal credibility",
      "trusts documented procedure more than rumor",
      "treats vulnerable residents as politically inconvenient",
      "assumes public panic is more dangerous than incomplete truth",
      "emphasizes facts that justify the requested action"
    ]).slice(0, 3),
    omissions: rand.shuffle([
      context.conflict?.hiddenTruth?.truth || "private motive behind the timing",
      "who benefits from delay",
      "uncertain casualty or impact count",
      "the author's personal stake"
    ]).filter(Boolean).slice(0, 3),
    deceptiveClaims: rand.maybe(0.22) ? ["The document implies all relevant parties were consulted."] : [],
    uncertainClaims: rand.shuffle(["cause remains under review", "timeline depends on restricted records", "witness accounts conflict"]).slice(0, 2)
  };
}

function makeClassification(rand, type, context, constraints) {
  const accessLevel = constraints.accessLevel || accessForType(type);
  const reliability = constraints.reliability || reliabilityForType(type, rand);
  const authenticity = constraints.authenticity || rand.pick(AUTHENTICITY);
  const status = constraints.status || statusForType(type, rand);
  return {
    accessLevel,
    confidentiality: accessLevel,
    authenticity,
    documentStatus: status,
    preservationStatus: rand.pick(["complete", "complete", "annotated-copy", "partial", "reconstructed"]),
    reliability,
    publicVisibility: accessLevel === "public" || type.familyId === "news-media" ? "public" : rand.pick(["private", "restricted", "leaked"])
  };
}

function accessForType(type) {
  if (["news-media", "propaganda-emergency"].includes(type.familyId)) return "public";
  if (["personal"].includes(type.familyId)) return "confidential";
  if (["military-intelligence", "legal-security"].includes(type.familyId)) return "restricted";
  if (["medical-health"].includes(type.familyId)) return "medical-private";
  return "internal";
}

function reliabilityForType(type, rand) {
  if (/leaflet|propaganda|press-release/.test(type.id)) return rand.pick(["propaganda", "biased-but-factual", "misleading"]);
  if (/diary|letter|email/.test(type.id)) return rand.pick(["biased-but-factual", "incomplete", "uncertain"]);
  if (/report|log|manifest|record/.test(type.id)) return rand.pick(["mostly-reliable", "reliable", "incomplete", "disputed"]);
  return rand.pick(RELIABILITY);
}

function statusForType(type, rand) {
  if (/alert|notice|advisory|order/.test(type.id)) return "issued";
  if (/diary|letter/.test(type.id)) return rand.pick(["draft", "archived", "partially-recovered"]);
  return rand.pick(STATUSES);
}

function titleFor(rand, type, subject, context) {
  const base = subject.primaryEntityName;
  if (type.id === "news-article") return `${base}: Questions Mount After Official Account Narrows`;
  if (type.id === "internal-memorandum") return `Internal Memorandum: ${base}`;
  if (type.id === "personnel-file") return `Personnel File: ${base}`;
  if (type.id === "inspection-report") return `Inspection Report: ${base}`;
  if (type.id === "emergency-alert") return `Emergency Alert for ${context.settlement?.name || context.embedded.location.name}`;
  return `${type.label}: ${base}`;
}

function subtitleFor(type, subject, classification) {
  return `${type.label} concerning ${subject.primaryEntityName} / ${classification.reliability.replace(/-/g, " ")}`;
}

function documentDate(rand, context) {
  const year = context.conflict?.chronology?.at?.(-1)?.year || context.settlement?.history?.at?.(-1)?.year || 2326;
  const month = String(rand.int(1, 12)).padStart(2, "0");
  const day = String(rand.int(1, 28)).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayDate(date, context) {
  const [year, month, day] = date.split("-");
  const place = context.settlement?.name?.split(" ")[0] || "Local";
  return `${Number(day)} ${place} ${year}.${month}`;
}

function makeSections(rand, data) {
  const structure = structureFor(data.type);
  return structure.map((item, index) => {
    const sectionRand = rand.derive(`${item}-${index}`);
    const section = {
      id: `section_${slug(item)}_${index}`,
      seed: deriveSeed(rand.seed, `${item}-${index}`),
      type: item,
      title: titleCase(item.replace(/-/g, " "))
    };
    if (["findings", "claims", "orders", "actions", "evidence"].includes(item)) {
      section.items = sectionItems(sectionRand, item, data);
    } else {
      section.content = sectionContent(sectionRand, item, data);
    }
    return section;
  });
}

function structureFor(type) {
  if (type.familyId === "news-media") return ["header", "lede", "background", "sources", "known-omissions"];
  if (type.familyId === "personal") return ["opening", "body", "avoided-topic", "closing"];
  if (type.familyId === "legal-security") return ["record-header", "facts", "claims", "orders", "disputed-details"];
  if (type.familyId === "scientific-technical") return ["summary", "methods", "findings", "limitations", "recommendation"];
  if (type.familyId === "logistics") return ["routing", "manifest", "exceptions", "authorization"];
  if (type.familyId === "propaganda-emergency") return ["headline", "official-instruction", "simplified-claim", "omitted-fact", "action"];
  return ["header", "summary", "findings", "actions", "distribution"];
}

function sectionContent(rand, item, data) {
  const subject = data.subject.primaryEntityName;
  const author = data.author.name;
  const issuer = data.issuer.name || author;
  const location = data.context.settlement?.name || data.context.embedded.location.name;
  const publicFact = data.knowledge.publicFacts[0] || subject;
  const omission = data.perspective.omissions[0] || "material context";
  const map = {
    header: `${issuer} records this ${data.type.label.toLowerCase()} on ${data.context.settlement ? data.context.settlement.name : location}. Author: ${author}.`,
    lede: `${subject} has become visible enough that ${issuer} can no longer treat it as routine background pressure.`,
    background: `${publicFact} The author frames the matter through ${data.perspective.biases[0]}.`,
    sources: `Sources include public notices, institutional logs, and ${rand.pick(["two guarded witnesses", "a partial transcript", "a maintenance ledger", "a council aide"])}.`,
    "known-omissions": `The document does not fully address ${omission}.`,
    opening: `${data.recipient.name}, I am writing because ${subject} has stopped being something we can wait out.`,
    body: `I know ${data.knowledge.publicFacts[0] || "the public version"}, but I do not know ${data.knowledge.unknownSecrets[0] || "who will admit responsibility"}. That gap is the dangerous part.`,
    "avoided-topic": `The writer circles around ${omission} without naming it directly.`,
    closing: `Keep this where people who need it can find it, and where the wrong office cannot.`,
    "record-header": `Record opened under ${data.classification.accessLevel} access for ${subject}.`,
    facts: `Confirmed facts remain narrower than public rumor. ${data.knowledge.trustedClaims[0] || "The initiating event is verified; motive is not."}`,
    "disputed-details": `Disputed detail: ${data.perspective.uncertainClaims[0] || "timeline and responsibility remain contested"}.`,
    summary: `${subject} requires action because the available evidence supports concern but not certainty.`,
    methods: `Review used interviews, local records, telemetry summaries, and institutional access appropriate to ${data.knowledge.accessLevel}.`,
    limitations: `The author lacks direct access to ${data.knowledge.unknownSecrets[0] || "sealed primary records"}.`,
    recommendation: rand.pick(["Open a controlled inquiry.", "Issue a temporary advisory.", "Preserve records before political review.", "Separate public safety from blame assignment."]),
    routing: `${location} routing authority logs this document for ${subject}.`,
    exceptions: `Exception noted: ${data.perspective.uncertainClaims[0] || "one authorization was incomplete"}.`,
    authorization: `Authorized by ${issuer || author}; possession risk is ${data.classification.accessLevel}.`,
    headline: `${titleCase(subject)} Cannot Be Ignored`,
    "official-instruction": `Residents are instructed to follow posted guidance and report deviations through official channels.`,
    "simplified-claim": `${issuer || "the sponsor"} presents the issue as a matter of survival and loyalty.`,
    "omitted-fact": `Omitted fact: ${omission}.`,
    action: data.purpose.desiredAction,
    distribution: `Distributed to ${data.recipient.audience || data.recipient.name}; consequence of ignoring: ${data.purpose.consequenceOfIgnoring}.`
  };
  return map[item] || `${subject} is recorded here with ${data.perspective.confidence} confidence.`;
}

function sectionItems(rand, item, data) {
  const subject = data.subject.primaryEntityName;
  const options = {
    findings: [
      `${subject} is tied to ${data.knowledge.institutionalFacts[0] || "an institutional procedure"}.`,
      `Public facts support action, but not the full motive.`,
      `${data.perspective.omissions[0] || "One key dependency"} remains outside the document's scope.`
    ],
    claims: [
      `${subject} caused a procedural breach.`,
      `${data.issuer.name || data.author.name} had authority to issue this document.`,
      `The public account is incomplete.`
    ],
    orders: [
      `Preserve all records concerning ${subject}.`,
      `Do not brief outside audiences without written authorization.`,
      `Escalate contradictory evidence to the review office.`
    ],
    actions: [
      data.purpose.desiredAction,
      `Notify ${data.recipient.name}.`,
      `Create a follow-up record within ${rand.int(2, 9)} days.`
    ],
    evidence: [
      `Record excerpt: ${data.knowledge.publicFacts[0] || subject}.`,
      `Rumor held separately: ${data.knowledge.rumors[0] || "none logged"}.`,
      `Missing item: ${data.knowledge.unknownSecrets[0] || "unreleased primary file"}.`
    ],
    manifest: [
      `Subject cargo/file: ${subject}`,
      `Origin: ${data.context.settlement?.name || data.context.embedded.location.name}`,
      `Exception code: ${rand.pick(["HOLD", "RISK", "REVIEW", "SEAL"])}-${rand.int(100, 999)}`
    ]
  };
  return options[item] || [`${subject} requires follow-up.`];
}

function makeClaims(rand, sections, subject, knowledge, classification) {
  return sections.flatMap(section => {
    const text = section.items?.[0] || section.content || "";
    return text ? [{
      id: `claim_${hashString(`${section.id}:${text}`).toString(36)}`,
      statement: text,
      subjectEntityIds: [subject.primaryEntityId].filter(Boolean),
      claimType: "factual",
      certainty: rand.pick(["confirmed", "probable", "possible", "disputed"]),
      sourceType: section.type,
      visibility: classification.accessLevel,
      truthStatus: classification.reliability === "deceptive" ? "misleading" : rand.pick(["true", "mostly-true", "unknown", "disputed"]),
      knownByCharacterIds: [],
      disputedByDocumentIds: []
    }] : [];
  }).slice(0, 5);
}

function makeQuotations(rand, context, type, knowledge) {
  const character = context.character;
  if (!character || type.familyId === "legal-security" && rand.maybe(0.4)) return [];
  return [{
    id: `quote_${hashString(`${character.id}:${type.id}`).toString(36)}`,
    speakerCharacterId: character.id,
    speakerName: character.name,
    quote: quoteForCharacter(rand, character, knowledge),
    context: rand.pick(["interview", "private message", "hearing transcript", "field note"]),
    authenticity: rand.pick(["verified", "partial", "contested"]),
    source: type.id
  }];
}

function quoteForCharacter(rand, character, knowledge) {
  const manner = character.voice?.publicManner || "careful";
  return rand.pick([
    `I can confirm what I saw, not what they hoped I would assume.`,
    `The record is clean only because the dangerous parts were moved somewhere else.`,
    `People keep calling this procedure. It felt like choosing who could wait.`,
    `I am ${manner}, not blind.`
  ]);
}

function makeRedactions(rand, sections, classification, knowledge) {
  if (!["restricted", "secret", "medical-private", "command-only", "executive-only"].includes(classification.accessLevel) && !rand.maybe(0.2)) return [];
  const candidates = sections.filter(section => (section.content || section.items?.join(" ")));
  return candidates.slice(0, rand.int(1, Math.min(3, candidates.length))).map((section, index) => {
    const text = section.content || section.items[0];
    const words = String(text).split(" ").filter(word => word.length > 5);
    const targetText = rand.pick(words.length ? words : [knowledge.knownSecrets[0] || "restricted"]);
    return {
      id: `redaction_${index}`,
      sectionId: section.id,
      targetText,
      reason: rand.pick(["classification", "personal privacy", "security review", "medical restriction", "legal privilege"]),
      visibleReplacement: "████████",
      userRevealable: true
    };
  });
}

function makeAnnotations(rand, sections, classification, perspective) {
  return sections.slice(0, rand.int(1, Math.min(3, sections.length))).map((section, index) => ({
    id: `annotation_${index}`,
    type: rand.pick(["archive-note", "investigator-note", "legal-annotation", "authenticity-warning", "later-correction"]),
    author: rand.pick(["Archive reviewer", "Case investigator", "Legal desk", "Historical indexer"]),
    date: `2327-${String(rand.int(1, 12)).padStart(2, "0")}-${String(rand.int(1, 28)).padStart(2, "0")}`,
    targetSectionId: section.id,
    note: rand.pick([`Reliability classified as ${classification.reliability}.`, `Compare this with omitted issue: ${perspective.omissions[0]}.`, "Later copy contains a wording discrepancy.", "Reader should distinguish confirmed fact from institutional framing."]),
    visibility: rand.pick(["public", "internal", "archive-only"])
  }));
}

function makeAttachments(rand, type, subject, context) {
  const kinds = ["evidence-log", "timeline", "manifest", "signature-page", "technical-diagram", "witness-list", "financial-table", "appendix"];
  return rand.shuffle(kinds).slice(0, rand.int(1, 3)).map((kind, index) => ({
    id: `attachment_${index}`,
    attachmentType: kind,
    title: `${titleCase(kind.replace(/-/g, " "))}: ${subject.primaryEntityName}`,
    description: rand.pick(["Text-only appendix", "Structured table placeholder", "Referenced but not included in public copy", "Archive-safe diagram placeholder"]),
    linkedEntityIds: subject.relatedEntityIds || []
  }));
}

function makeSignatures(rand, author, issuer, type) {
  return [{
    id: "signature_primary",
    signatureType: issuer.name ? "typed-name-and-office" : "personal-mark",
    signerName: author.name,
    signerEntityId: author.id || "",
    organizationName: issuer.name || "",
    verification: rand.pick(["typed", "digital-certificate", "archive-stamp", "witnessed", "unverified"])
  }];
}

function makeStamps(rand, classification) {
  return [
    { id: "stamp_access", label: classification.accessLevel, tone: "access" },
    { id: "stamp_status", label: classification.documentStatus, tone: "status" }
  ];
}

function makeContradictions(rand, claims, classification) {
  if (!claims.length || !["disputed", "deceptive", "propaganda", "incomplete"].includes(classification.reliability) && !rand.maybe(0.2)) return [];
  return [{
    id: "contradiction_primary",
    subjectId: claims[0].subjectEntityIds[0] || "",
    documentIds: [],
    topic: rand.pick(["motive", "timeline", "responsibility", "missing-evidence", "public-versus-private-claim"]),
    claims: [{ documentId: "", value: claims[0].statement }],
    explanation: rand.pick(["The author has limited access.", "The official category excludes vulnerable residents.", "The document protects an institution from exposure.", "Later evidence may change interpretation."])
  }];
}

function structuredFieldsFor(type, context, subject, issuer, recipient) {
  return {
    recordNumber: `${type.familyId.slice(0, 3).toUpperCase()}-${hashString(`${subject.primaryEntityName}:${type.id}`).toString(36).slice(0, 6).toUpperCase()}`,
    jurisdiction: context.settlement?.government?.officialName || context.settlement?.name || context.embedded.location.name,
    issuer: issuer.name,
    recipient: recipient.name,
    documentType: type.id
  };
}

function referencesFor(context, subject) {
  const refs = [];
  [context.system, context.settlement, context.organization, context.character, context.conflict].filter(Boolean).forEach(entity => refs.push({
    entityId: entity.id || "",
    entityType: entity.entityType || "summary",
    name: entity.name?.full || entity.name || entity.title || subject.primaryEntityName
  }));
  return refs;
}

function relationshipsFor(documentId, context, subject, author, issuer, recipient) {
  const relationships = [];
  const add = (entity, type, label) => {
    if (!entity?.id || String(entity.entityType).startsWith("embedded") || entity.entityType === "audience") return;
    relationships.push({
      id: `rel_${hashString(`${documentId}:${type}:${entity.id}`).toString(36)}`,
      fromEntityId: documentId,
      fromEntityType: "document",
      toEntityId: entity.id,
      toEntityType: entity.entityType,
      relationshipType: type,
      label,
      metadata: { subjectId: subject.primaryEntityId }
    });
  };
  add(author, "authored-by", `Authored by ${author.name}`);
  add(issuer, "issued-by", `Issued by ${issuer.name}`);
  add(recipient, "addressed-to", `Addressed to ${recipient.name}`);
  add(context.conflict, "evidence-for", `Evidence for ${context.conflict?.name}`);
  add(context.settlement, "concerns", `Concerns ${context.settlement?.name}`);
  add(context.organization, "references", `References ${context.organization?.name}`);
  add(context.character, "references", `References ${context.character?.name}`);
  add(context.system, "references", `References ${context.system?.name}`);
  return relationships;
}

function templateFor(type) {
  if (type.familyId === "news-media") return "news-article";
  if (type.familyId === "personal") return type.id === "diary-entry" ? "diary-entry" : "personal-letter";
  if (type.familyId === "propaganda-emergency") return /alert|evacuation/.test(type.id) ? "emergency-alert" : "propaganda-leaflet";
  if (type.familyId === "logistics") return "manifest-form";
  if (type.familyId === "legal-security") return "legal-record";
  return "institutional-report";
}

function typographyFor(type) {
  if (type.familyId === "news-media") return "journalistic-serif";
  if (type.familyId === "personal") return "personal-serif";
  if (type.familyId === "scientific-technical") return "technical-mono";
  return "institutional-sans";
}

function sectionsToPlainText(sections) {
  return sections.map(section => [section.title, section.content, ...(section.items || [])].filter(Boolean).join("\n")).join("\n\n");
}

function sectionToMarkdown(section, redactions, redacted) {
  const lines = [`## ${section.title || titleCase(section.type)}`];
  if (section.items) lines.push(...section.items.map(item => `- ${applyRedactions(item, redactions, redacted)}`));
  else lines.push(applyRedactions(section.content || "", redactions, redacted));
  return lines.join("\n");
}

function applyRedactions(text, redactions, redacted) {
  if (!redacted) return text;
  return redactions.reduce((output, redaction) => output.replaceAll(redaction.targetText, redaction.visibleReplacement), text);
}

function accessRank(access) {
  return { public: 0, internal: 1, confidential: 2, restricted: 3, secret: 4, "medical-private": 3, "command-only": 4, "executive-only": 4 }[access] || 1;
}

function titleCase(value) {
  return String(value).replace(/\b\w/g, char => char.toUpperCase());
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
