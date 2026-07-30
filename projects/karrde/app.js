const navItems = [
  "Dashboard",
  "Personnel",
  "Organizations",
  "Planets",
  "Ships",
  "Operations",
  "Intelligence Reports",
  "Timeline",
  "Search",
  "About Network",
];

const filters = [
  "All",
  "Military",
  "Political",
  "Smuggling",
  "Diplomatic",
  "Restricted",
  "Eyes Only",
  "Confirmed",
  "Probable",
];

const recordTypeOrder = [
  "Personnel",
  "Organizations",
  "Planets",
  "Ships",
  "Operations",
  "Reports",
  "Timeline",
];

const sectionForType = {
  Personnel: "Personnel",
  Organizations: "Organizations",
  Planets: "Planets",
  Ships: "Ships",
  Operations: "Operations",
  Reports: "Intelligence Reports",
  Timeline: "Timeline",
};

const typeForSection = Object.fromEntries(
  Object.entries(sectionForType).map(([type, section]) => [section, type]),
);

const reliabilityRank = {
  Confirmed: 5,
  "Highly Reliable": 4,
  Probable: 3,
  Unconfirmed: 2,
  "Possible Disinformation": 1,
};

const state = {
  section: "Dashboard",
  selectedId: "talon-karrde",
  query: "",
  filter: "All",
  cursor: 0,
  searchSubmitted: false,
  relationshipScope: "clean",
};

let data = {};
let records = [];
let index = new Map();
let rawIndex = new Map();

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function displayId(id) {
  return index.get(id)?.label ?? id.replaceAll("-", " ");
}

function initials(label) {
  return label
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function badge(value) {
  return `<span class="reliability r-${reliabilityRank[value] || 3}">${escapeHtml(value)}</span>`;
}

function auditEntriesFor(recordId) {
  return (data.audit || [])
    .filter((entry) => entry.recordId === recordId)
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

function latestAuditFor(recordId) {
  return auditEntriesFor(recordId)[0];
}

function confidenceHistory(recordId, limit = 3) {
  const entries = auditEntriesFor(recordId).slice(0, limit);
  if (!entries.length) return "";

  return `<section class="audit-trail">
    <div class="audit-header">
      <h2>Confidence History</h2>
      <span>${String(entries.length).padStart(2, "0")} entries</span>
    </div>
    ${entries
      .map(
        (entry) => `<article class="audit-entry">
          <div>
            <span>${escapeHtml(entry.date)}</span>
            <strong>${escapeHtml(entry.action)}</strong>
          </div>
          <p>${escapeHtml(entry.note)}</p>
          <small>${escapeHtml(entry.from)} -> ${escapeHtml(entry.to)} / ${escapeHtml(entry.source)}</small>
        </article>`,
      )
      .join("")}
  </section>`;
}

const relationshipLabels = {
  knownAssociates: "associate",
  knownAssets: "asset",
  recentIntelligence: "report",
  timelineEvents: "timeline",
  relatedOperations: "operation",
  relatedShips: "ship",
  relatedOrganizations: "organization",
  relatedWorlds: "world",
  leadership: "leadership",
  knownMembers: "member",
  knownAllies: "ally",
  knownRivals: "rival",
  knownContacts: "contact",
  nearbySystems: "nearby",
  historicalEvents: "event",
  currentReports: "report",
  knownOperations: "operation",
  knownOwner: "owner",
  previousOwners: "previous owner",
  knownEngagements: "engagement",
  associatedPersonnel: "personnel",
  associatedOperations: "operation",
  participants: "participant",
  timeline: "timeline",
  referencedReports: "report",
  relatedRecords: "reference",
  links: "reference",
};

const inboundRelationshipLabels = {
  knownAssociates: "associate",
  knownAssets: "uses subject",
  recentIntelligence: "cites subject",
  timelineEvents: "event cites subject",
  relatedOperations: "operation cites subject",
  relatedShips: "ship reference",
  relatedOrganizations: "organization reference",
  relatedWorlds: "world reference",
  leadership: "led by subject",
  knownMembers: "member record",
  knownAllies: "ally record",
  knownRivals: "rival record",
  knownContacts: "contact record",
  nearbySystems: "nearby system",
  historicalEvents: "historical event",
  currentReports: "current report",
  knownOperations: "operation record",
  knownOwner: "owned asset",
  previousOwners: "former asset",
  knownEngagements: "engagement record",
  associatedPersonnel: "associated actor",
  associatedOperations: "associated operation",
  participants: "participant in",
  timeline: "operation timeline",
  referencedReports: "referenced report",
  relatedRecords: "cites subject",
  links: "linked event",
};

function valuesAsIds(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function relationshipEvidence(sourceId, targetId, inverse = false) {
  const source = rawIndex.get(sourceId);
  if (!source) return [];

  return Object.entries(relationshipLabels)
    .filter(([field]) => valuesAsIds(source[field]).includes(targetId))
    .map(([field, label]) => ({
      label: inverse ? inboundRelationshipLabels[field] || label : label,
      field,
    }));
}

function recordText(record) {
  return [
    record.label,
    record.type,
    record.summary,
    record.classification,
    record.reliability,
    ...record.tags,
    ...record.links,
  ]
    .join(" ")
    .toLowerCase();
}

function linkChip(id) {
  return `<button class="link-chip" data-record="${escapeHtml(id)}" type="button">${escapeHtml(displayId(id))}</button>`;
}

function chipRow(ids) {
  return ids.length
    ? `<div class="chip-row">${ids.map(linkChip).join("")}</div>`
    : `<span class="muted">No record attached</span>`;
}

function infoGrid(items) {
  return `<dl class="info-grid">${items
    .map(
      ([label, value]) =>
        `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`,
    )
    .join("")}</dl>`;
}

function crossReferences(groups) {
  return `<section class="cross-ref"><h2>Cross References</h2>${groups
    .map(
      ([label, ids]) =>
        `<div class="reference-row"><span>${escapeHtml(label)}</span>${chipRow(ids)}</div>`,
    )
    .join("")}</section>`;
}

function dossierActions(record) {
  if (!record) return "";
  return `<div class="dossier-actions">
    <button data-action="print-dossier" type="button">Print</button>
    <button data-action="export-dossier" type="button">Export TXT</button>
  </div>`;
}

function dossier({ kicker, title, classification, reliability, quote = "", body }) {
  const record = records.find((item) => item.label === title);
  const latestAudit = record ? latestAuditFor(record.id) : null;
  const auditLabel = latestAudit ? `Last audit: ${latestAudit.date}` : "No audit logged";
  const auditTrail = record ? confidenceHistory(record.id) : "";
  return `<article class="dossier">
    <header class="dossier-header">
      <div><div class="eyebrow">${escapeHtml(kicker)}</div><h2>${escapeHtml(title)}</h2></div>
      <div class="dossier-meta">
        <div class="status-stack"><span>${escapeHtml(classification)}</span>${badge(reliability)}<small>${escapeHtml(auditLabel)}</small></div>
        ${dossierActions(record)}
      </div>
    </header>
    ${quote ? `<blockquote>${escapeHtml(quote)}</blockquote>` : ""}
    ${body}
    ${auditTrail}
  </article>`;
}

function exportValue(value) {
  if (Array.isArray(value)) {
    return value.length ? value.map(exportValue).join(", ") : "None";
  }
  if (typeof value === "string" && index.has(value)) {
    return displayId(value);
  }
  return String(value ?? "None");
}

function fieldLabel(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function currentDossierText() {
  const record = index.get(state.selectedId);
  if (!record) return "";

  const raw = rawIndex.get(record.id) || {};
  const audits = auditEntriesFor(record.id);
  const fields = Object.entries(raw)
    .filter(([key]) => key !== "id")
    .map(([key, value]) => `${fieldLabel(key)}: ${exportValue(value)}`)
    .join("\n");
  const links = record.links.length
    ? record.links.map((id) => `- ${displayId(id)} [${index.get(id)?.type || "Record"}]`).join("\n")
    : "- None";
  const auditText = audits.length
    ? audits
        .map(
          (entry) =>
            `- ${entry.date} / ${entry.action}: ${entry.from} -> ${entry.to}\n  Source: ${entry.source}\n  Analyst: ${entry.analyst}\n  Note: ${entry.note}`,
        )
        .join("\n")
    : "- No audit entries logged";

  return [
    "KARRDE INTELLIGENCE NETWORK",
    "DOSSIER EXPORT",
    "",
    `Record: ${record.label}`,
    `Type: ${record.type}`,
    `Classification: ${record.classification}`,
    `Reliability: ${record.reliability}`,
    "",
    "SUMMARY",
    record.summary,
    "",
    "SOURCE RECORD",
    fields,
    "",
    "LINKED RECORDS",
    links,
    "",
    "CONFIDENCE HISTORY",
    auditText,
  ].join("\n");
}

function exportCurrentDossier() {
  const record = index.get(state.selectedId);
  const text = currentDossierText();
  if (!record || !text) return;

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  const objectUrl = URL.createObjectURL(blob);
  link.href = objectUrl;
  link.download = `${record.id}-dossier.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function buildRecords() {
  records = [
    ...data.characters.map((record) => ({
      id: record.id,
      type: "Personnel",
      label: record.name,
      summary: record.operationalSummary,
      classification: record.classification,
      reliability: record.reliabilityRating,
      tags: [record.species, record.affiliation, record.politicalAlignment, record.occupation, record.threatLevel, record.classification, record.reliabilityRating],
      links: unique([...record.knownAssociates, ...record.knownAssets, ...record.recentIntelligence, ...record.timelineEvents, ...record.relatedOperations, ...record.relatedShips, ...record.relatedOrganizations, ...record.relatedWorlds]),
    })),
    ...data.organizations.map((record) => ({
      id: record.id,
      type: "Organizations",
      label: record.name,
      summary: record.purpose,
      classification: record.classification,
      reliability: record.reliability,
      tags: [record.classification, record.reliability, record.politicalReach, record.militaryStrength],
      links: unique([...record.leadership, ...record.knownMembers, ...record.knownAssets, ...record.knownAllies, ...record.knownRivals, ...record.relatedOperations]),
    })),
    ...data.planets.map((record) => ({
      id: record.id,
      type: "Planets",
      label: record.name,
      summary: record.strategicImportance,
      classification: record.classification,
      reliability: record.reliability,
      tags: [record.sector, record.government, record.politicalStability, record.militaryPresence, record.classification, record.reliability, ...record.primaryIndustries],
      links: unique([...record.knownContacts, ...record.nearbySystems, ...record.historicalEvents, ...record.currentReports, ...record.knownOperations]),
    })),
    ...data.ships.map((record) => ({
      id: record.id,
      type: "Ships",
      label: record.name,
      summary: record.strategicAssessment,
      classification: record.classification,
      reliability: record.reliability,
      tags: [record.manufacturer, record.class, record.currentStatus, record.classification, record.reliability],
      links: unique([record.knownOwner, ...record.previousOwners, ...record.knownEngagements, ...record.associatedPersonnel, ...record.associatedOperations]),
    })),
    ...data.operations.map((record) => ({
      id: record.id,
      type: "Operations",
      label: record.name,
      summary: record.outcome,
      classification: record.classification,
      reliability: record.reliability,
      tags: [record.classification, record.status, record.reliability, ...record.objectives],
      links: unique([...record.participants, ...record.timeline, ...record.referencedReports]),
    })),
    ...data.reports.map((record) => ({
      id: record.id,
      type: "Reports",
      label: record.title,
      summary: record.summary,
      classification: record.classification,
      reliability: record.confidence,
      tags: [record.category, record.classification, record.confidence, record.date, record.origin],
      links: unique(record.relatedRecords),
    })),
    ...data.timeline.map((record) => ({
      id: record.id,
      type: "Timeline",
      label: record.title,
      summary: record.summary,
      classification: record.era,
      reliability: "Highly Reliable",
      tags: [record.era, record.date],
      links: unique(record.links),
    })),
  ];
  index = new Map(records.map((record) => [record.id, record]));
  rawIndex = new Map(Object.values(data).flat().map((record) => [record.id, record]));
}

function searchResults() {
  const query = state.query.trim().toLowerCase();
  return records.filter((record) => {
    const text = recordText(record);
    const matchesQuery = query ? text.includes(query) : true;
    const matchesFilter = state.filter === "All" || text.includes(state.filter.toLowerCase());
    return matchesQuery && matchesFilter;
  });
}

function searchSuggestions() {
  const preferred = [
    "talon-karrde",
    "mara-jade",
    "grand-admiral-thrawn",
    "chimaera",
    "katana-fleet",
    "wayland",
  ];
  return preferred.map((id) => index.get(id)).filter(Boolean);
}

function easterEgg() {
  const normalized = state.query.trim().toLowerCase();
  if (normalized === "hot chocolate") return "No verified intelligence available.";
  if (normalized === "many bothans") return "Source attribution remains disputed.";
  if (normalized === "karrde") return "Administrator access acknowledged.";
  return "";
}

function openRecord(id) {
  const record = index.get(id);
  if (!record) return;
  state.selectedId = id;
  state.section = sectionForType[record.type];
  render();
}

function setSection(section) {
  state.section = section;
  const sectionRecords = recordsForSection(section);
  const selectedType = index.get(state.selectedId)?.type;
  if (sectionRecords.length && selectedType !== typeForSection[section]) {
    state.selectedId = sectionRecords[0].id;
  }
  render();
}

function confidenceAverage() {
  const total = records.reduce((sum, record) => sum + (reliabilityRank[record.reliability] || 3), 0);
  return Math.round((total / records.length / 5) * 100);
}

function recordsForSection(section) {
  const type = typeForSection[section];
  return type ? records.filter((record) => record.type === type) : [];
}

function sectionIndex(section, title, summary) {
  const sectionRecords = recordsForSection(section);
  if (!sectionRecords.length) return "";

  return `<section class="section-index">
    <header class="section-index-header">
      <div>
        <div class="eyebrow">${escapeHtml(section)}</div>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(summary)}</p>
      </div>
      <strong>${String(sectionRecords.length).padStart(2, "0")}</strong>
    </header>
    <div class="index-list">
      ${sectionRecords
        .map(
          (record) => `<button class="index-item ${record.id === state.selectedId ? "active" : ""}" data-record="${record.id}" type="button">
            <span>${escapeHtml(record.type)}</span>
            <strong>${escapeHtml(record.label)}</strong>
            <small>${escapeHtml(record.classification)}</small>
          </button>`,
        )
        .join("")}
    </div>
  </section>`;
}

function renderNav() {
  $("#nav-list").innerHTML = navItems
    .map(
      (item) =>
        `<button type="button" data-section="${item}" ${state.section === item ? 'aria-current="page"' : ""}>${item}</button>`,
    )
    .join("");
}

function renderFilters() {
  $("#filter-row").innerHTML = filters
    .map(
      (filter) =>
        `<button type="button" data-filter="${filter}" aria-pressed="${state.filter === filter}" class="${state.filter === filter ? "active" : ""}">${filter}</button>`,
    )
    .join("");
}

function renderShell() {
  $("#hero-ledger").innerHTML = [
    ["Records", records.length, "indexed"],
    ["Confidence", `${confidenceAverage()}%`, "weighted"],
    ["Active Threats", "04", "tracked"],
  ]
    .map(
      ([label, value, status]) =>
        `<div class="metric"><span>${label}</span><strong>${value}</strong><em>${status}</em></div>`,
    )
    .join("");

  $("#breadcrumbs").innerHTML = `<button data-section="Dashboard" type="button">Dashboard</button><span>/</span><button data-section="${state.section}" type="button">${state.section}</button>${state.section !== "Dashboard" ? `<span>/</span><span>${escapeHtml(index.get(state.selectedId)?.label || "")}</span>` : ""}`;
}

function renderDashboard() {
  const widget = (title, ids) => `<section class="folder-card">
    <div class="folder-tab"><span>${title}</span><small>${String(ids.length).padStart(2, "0")}</small></div>
    ${ids
      .map((id) => index.get(id))
      .filter(Boolean)
      .map((record) => `<button class="record-row" data-record="${record.id}" type="button"><span><strong>${escapeHtml(record.label)}</strong><small>${escapeHtml(record.summary)}</small></span>${badge(record.reliability)}</button>`)
      .join("")}
  </section>`;

  return `<div class="dashboard-grid">
    <section class="priority-brief">
      <div class="brief-topline"><div class="eyebrow">Command Dashboard</div><span>LIVE INDEX</span></div>
      <h2>Current exchange value favors verified sources over fast rumor.</h2>
      <p class="brief-copy">Priority goes to relationships that changed the cost of action: shipyard access, Imperial continuity, source credibility, and private-route coordination.</p>
      <div class="brief-table">
        <div class="metric"><span>Political Changes</span><strong>03</strong><em>reviewed</em></div>
        <div class="metric"><span>Military Activity</span><strong>07</strong><em>moving</em></div>
        <div class="metric"><span>Sector Alerts</span><strong>04</strong><em>open</em></div>
        <div class="metric"><span>Reliability Summary</span><strong>${confidenceAverage()}%</strong><em>stable</em></div>
      </div>
    </section>
    ${widget("Recently Updated Intelligence", ["report-wayland-consequences", "report-bilbringi-afteraction"])}
    ${widget("High Priority Reports", ["grand-admiral-thrawn", "mara-jade", "wayland"])}
    ${widget("Fleet Movements", ["chimaera", "katana-fleet", "bilbringi"])}
    ${widget("Newest Operations", ["op-bilbringi-intervention", "op-mount-tantiss-recovery"])}
  </div>`;
}

function renderSearch() {
  const results = searchResults();
  const query = state.query.trim();
  const egg = easterEgg();
  let absolute = 0;
  const groups = recordTypeOrder
    .map((type) => ({ type, records: results.filter((record) => record.type === type) }))
    .filter((group) => group.records.length);
  const suggestionCards = searchSuggestions()
    .map(
      (record) => `<button class="suggestion-chip" data-record="${record.id}" type="button">
        <span>${escapeHtml(record.type)}</span>
        <strong>${escapeHtml(record.label)}</strong>
      </button>`,
    )
    .join("");
  const submittedSummary =
    state.searchSubmitted && query
      ? `<div class="search-summary"><span>Query Accepted</span><strong>${escapeHtml(query)}</strong><em>${String(results.length).padStart(2, "0")} matches</em></div>`
      : "";
  const emptyMessage =
    !egg && query && !groups.length
      ? `<div class="empty-state refined-empty">
          <div>
            <span>No Verified Match</span>
            <strong>${escapeHtml(query)}</strong>
            <p>${state.filter === "All" ? "No indexed record matches this phrase." : `No ${escapeHtml(state.filter)} record matches this phrase.`}</p>
          </div>
          <div class="empty-actions">
            ${state.filter !== "All" ? `<button data-action="clear-filter" type="button">Clear Filter</button>` : ""}
            <button data-action="clear-search" type="button">Clear Search</button>
          </div>
        </div>
        <div class="suggestion-strip">
          <div class="eyebrow">Recommended Pulls</div>
          <div>${suggestionCards}</div>
        </div>`
      : "";

  return `<section class="search-results">
    ${submittedSummary}
    ${egg ? `<div class="intel-message">${egg}</div>` : ""}
    ${groups
      .map(
        (group) => `<div class="result-group">
          <div class="group-heading"><h2>${group.type}</h2><span>${String(group.records.length).padStart(2, "0")}</span></div>
          ${group.records
            .map((record) => {
              const selected = absolute === state.cursor;
              absolute += 1;
              return `<button class="search-result ${selected ? "selected" : ""}" data-record="${record.id}" type="button"><span class="result-type">${record.type}</span><strong>${escapeHtml(record.label)}</strong><small>${escapeHtml(record.summary)}</small>${badge(record.reliability)}</button>`;
            })
            .join("")}
        </div>`,
      )
      .join("")}
    ${emptyMessage}
  </section>`;
}

function selectedDatasetRecord(collection) {
  return collection.find((item) => item.id === state.selectedId) || collection[0];
}

function renderPersonnel() {
  const record = selectedDatasetRecord(data.characters);
  return `${sectionIndex(
    "Personnel",
    "Personnel Index",
    "Filed actors, brokers, military principals, and diplomatic pressure points.",
  )}${dossier({
    kicker: "Personnel Dossier",
    title: record.name,
    classification: record.classification,
    reliability: record.reliabilityRating,
    quote: record.quote,
    body: `<section class="dossier-section"><h2>Operational Assessment</h2><p>${escapeHtml(record.operationalSummary)}</p></section>
      <section class="dossier-section"><h2>Psychological Notes</h2><p>${escapeHtml(record.psychologicalNotes)}</p></section>
      ${infoGrid([
        ["Species", record.species],
        ["Affiliation", record.affiliation],
        ["Status", record.currentStatus],
        ["Location", record.knownLocation],
        ["Alignment", record.politicalAlignment],
        ["Occupation", record.occupation],
        ["Last Activity", record.lastConfirmedActivity],
        ["Strategic Importance", record.strategicImportance],
      ])}
      ${crossReferences([
        ["Known Associates", record.knownAssociates],
        ["Known Assets", record.knownAssets],
        ["Recent Intelligence", record.recentIntelligence],
        ["Timeline Events", record.timelineEvents],
        ["Related Operations", record.relatedOperations],
        ["Related Ships", record.relatedShips],
        ["Related Organizations", record.relatedOrganizations],
        ["Related Worlds", record.relatedWorlds],
      ])}`,
  })}`;
}

function renderOrganizations() {
  const record = selectedDatasetRecord(data.organizations);
  return `${sectionIndex(
    "Organizations",
    "Organization Index",
    "Power structures, temporary alignments, legacy governments, and operational networks.",
  )}${dossier({
    kicker: "Organization Profile",
    title: record.name,
    classification: record.classification,
    reliability: record.reliability,
    body: `${infoGrid([
      ["Purpose", record.purpose],
      ["Political Reach", record.politicalReach],
      ["Military Strength", record.militaryStrength],
      ["Current Activity", record.currentActivity],
      ["Historical Notes", record.historicalNotes],
    ])}${crossReferences([
      ["Leadership", record.leadership],
      ["Known Members", record.knownMembers],
      ["Known Assets", record.knownAssets],
      ["Known Allies", record.knownAllies],
      ["Known Rivals", record.knownRivals],
      ["Related Operations", record.relatedOperations],
    ])}`,
  })}`;
}

function renderPlanets() {
  const record = selectedDatasetRecord(data.planets);
  return `${sectionIndex(
    "Planets",
    "World Index",
    "Operationally relevant worlds, shipyards, capitals, staging grounds, and cache sites.",
  )}${dossier({
    kicker: "World Summary",
    title: record.name,
    classification: record.classification,
    reliability: record.reliability,
    body: `${infoGrid([
      ["Sector", record.sector],
      ["Government", record.government],
      ["Population", record.population],
      ["Political Stability", record.politicalStability],
      ["Military Presence", record.militaryPresence],
      ["Trade Value", record.tradeValue],
      ["Criminal Activity", record.criminalActivity],
      ["Strategic Importance", record.strategicImportance],
      ["Risk Assessment", record.riskAssessment],
      ["Primary Industries", record.primaryIndustries.join(", ")],
    ])}${crossReferences([
      ["Known Contacts", record.knownContacts],
      ["Nearby Systems", record.nearbySystems],
      ["Historical Events", record.historicalEvents],
      ["Current Reports", record.currentReports],
      ["Known Operations", record.knownOperations],
    ])}`,
  })}`;
}

function renderShips() {
  const record = selectedDatasetRecord(data.ships);
  return `${sectionIndex(
    "Ships",
    "Asset Index",
    "Vessels and fleet assets with ownership, movement, and strategic significance.",
  )}${dossier({
    kicker: "Intelligence Asset",
    title: record.name,
    classification: record.classification,
    reliability: record.reliability,
    body: `${infoGrid([
      ["Manufacturer", record.manufacturer],
      ["Class", record.class],
      ["Length", record.length],
      ["Crew", record.crew],
      ["Current Status", record.currentStatus],
      ["Operational History", record.operationalHistory],
      ["Known Cargo", record.knownCargo.join(", ")],
      ["Strategic Assessment", record.strategicAssessment],
    ])}${crossReferences([
      ["Known Owner", [record.knownOwner]],
      ["Previous Owners", record.previousOwners],
      ["Known Engagements", record.knownEngagements],
      ["Associated Personnel", record.associatedPersonnel],
      ["Associated Operations", record.associatedOperations],
    ])}`,
  })}`;
}

function renderOperations() {
  const record = selectedDatasetRecord(data.operations);
  return `${sectionIndex(
    "Operations",
    "Operation Index",
    "Case files where intelligence, pressure, and timing changed the outcome.",
  )}${dossier({
    kicker: "Operation File",
    title: record.name,
    classification: record.classification,
    reliability: record.reliability,
    body: `${infoGrid([
      ["Status", record.status],
      ["Outcome", record.outcome],
      ["Political Consequences", record.politicalConsequences],
      ["Military Consequences", record.militaryConsequences],
      ["Objectives", record.objectives.join("; ")],
      ["Sources", record.sources.join(", ")],
    ])}${crossReferences([
      ["Participants", record.participants],
      ["Timeline", record.timeline],
      ["Referenced Reports", record.referencedReports],
    ])}`,
  })}`;
}

function renderReports() {
  const record = selectedDatasetRecord(data.reports);
  return `${sectionIndex(
    "Intelligence Reports",
    "Report Index",
    "Short professional estimates grouped by confidence, classification, and record links.",
  )}${dossier({
    kicker: `${record.category} Report`,
    title: record.title,
    classification: record.classification,
    reliability: record.confidence,
    body: `<section class="dossier-section"><h2>Summary</h2><p>${escapeHtml(record.summary)}</p></section>
      <section class="dossier-section"><h2>Full Analysis</h2><p>${escapeHtml(record.analysis)}</p></section>
      ${infoGrid([["Date", record.date], ["Origin", record.origin], ["Sources", record.sources.join(", ")]])}
      ${crossReferences([["Related Records", record.relatedRecords]])}`,
  })}`;
}

function renderTimeline() {
  return `${sectionIndex(
    "Timeline",
    "Timeline Index",
    "Campaign events ordered as intelligence waypoints rather than historical decoration.",
  )}<section class="timeline-panel"><div class="timeline-axis" aria-hidden="true"></div>${data.timeline
    .map(
      (event) => `<article class="timeline-event">
        <div class="timeline-date">${escapeHtml(event.date)}</div>
        <div><span>${escapeHtml(event.era)}</span><h2>${escapeHtml(event.title)}</h2><p>${escapeHtml(event.summary)}</p>${chipRow(event.links)}</div>
      </article>`,
    )
    .join("")}</section>`;
}

function renderAbout() {
  return dossier({
    kicker: "Network Memorandum",
    title: "Information Exchange Doctrine",
    classification: "Internal",
    reliability: "Confirmed",
    body: infoGrid([
      ["Archive Principle", "Every record is entered by ID, reviewed for motive, and cross-referenced before circulation."],
      ["Source Handling", "Confidence changes travel with the record. A useful fact never sheds its uncertainty."],
      ["Expansion Model", "New modules can be added as JSON datasets without changing the network's record grammar."],
      ["Continuity Boundary", "Records align to Legends-era intelligence surrounding the Thrawn campaign and later Karrde network activity."],
    ]),
  });
}

function addRelationshipLink(links, item, relationship) {
  if (!item || links.has(item.id)) return;
  links.set(item.id, {
    record: item,
    ...relationship,
  });
}

function relationshipLinks(record) {
  const links = new Map();

  record.links.forEach((id) => {
    const item = index.get(id);
    const evidence = relationshipEvidence(record.id, id)[0];
    addRelationshipLink(links, item, {
      label: evidence?.label || "linked",
      detail: evidence
        ? `Direct field: ${evidence.field}`
        : "Direct archive reference",
      strength: "direct",
      score: 3,
    });
  });

  records
    .filter((candidate) => candidate.links.includes(record.id))
    .forEach((candidate) => {
      const evidence = relationshipEvidence(candidate.id, record.id, true)[0];
      addRelationshipLink(links, candidate, {
        label: evidence?.label || "inbound",
        detail: evidence
          ? `Inbound field: ${evidence.field}`
          : "Another record cites this file",
        strength: "inferred",
        score: 2,
      });
    });

  if (state.relationshipScope === "expanded") {
    Array.from(links.values())
      .slice(0, 8)
      .forEach(({ record: bridge }) => {
        bridge.links.forEach((id) => {
          if (id === record.id || links.has(id)) return;
          const item = index.get(id);
          addRelationshipLink(links, item, {
            label: `via ${bridge.label}`,
            detail: `Second-order link through ${bridge.label}`,
            strength: "network",
            score: 1,
          });
        });
      });
  }

  return Array.from(links.values())
    .sort(
      (a, b) =>
        b.score - a.score ||
        (reliabilityRank[b.record.reliability] || 0) -
          (reliabilityRank[a.record.reliability] || 0) ||
        a.record.label.localeCompare(b.record.label),
    )
    .slice(0, state.relationshipScope === "expanded" ? 18 : 10);
}

function analystNote(id) {
  return {
    "talon-karrde": "Subject appears willing to negotiate when long-term information advantage outweighs immediate tactical gain.",
    "mara-jade": "Do not confuse unresolved personal history with predictable allegiance.",
    "grand-admiral-thrawn": "If the move appears theatrical, assume the useful maneuver happened earlier.",
    wayland: "Recovered facts from contaminated facilities must be verified outside their original chain.",
    bilbringi: "Shipyards do not merely repair fleets. They repair confidence.",
  }[id] || "Record confidence remains tied to independent source confirmation and motive review.";
}

function renderContext() {
  const record = index.get(state.selectedId) || records[0];
  const related = relationshipLinks(record);
  const latestAudit = latestAuditFor(record.id);
  const auditEntries = auditEntriesFor(record.id);
  $("#quick-facts").innerHTML = `<div class="eyebrow">Quick Facts</div>${infoGrid([
    ["Record", record.label],
    ["Type", record.type],
    ["Reliability", record.reliability],
    ["Classification", record.classification],
    ["Linked Records", record.links.length],
    ["Latest Audit", latestAudit ? latestAudit.action : "No audit entry"],
  ])}`;

  $("#relationship-panel").innerHTML = `<div class="relationship-head">
      <div class="eyebrow">Related Network</div>
      <div class="relationship-controls" aria-label="Relationship scope">
        <button class="${state.relationshipScope === "clean" ? "active" : ""}" data-relationship-scope="clean" type="button">Clean</button>
        <button class="${state.relationshipScope === "expanded" ? "active" : ""}" data-relationship-scope="expanded" type="button">Expanded</button>
      </div>
    </div>
    <div class="graph-stage">
      <button class="graph-node primary" type="button"><span>${initials(record.label)}</span><strong>${escapeHtml(record.label)}</strong></button>
      ${related
        .slice(0, 6)
        .map(({ record: item, label }, i) => `<button class="graph-node ${label.startsWith("via ") ? "network" : ""} node-${i + 1}" data-record="${item.id}" type="button"><span>${initials(item.label)}</span><strong>${escapeHtml(item.label)}</strong><em>${escapeHtml(label)}</em></button>`)
        .join("")}
    </div>
    <div class="relationship-list">${related.map(({ record: item, label, detail, strength }) => `<button class="${strength}" data-record="${item.id}" type="button"><span>${escapeHtml(label)} / ${item.type}</span><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(detail)}</small></button>`).join("")}</div>`;

  $("#source-ledger").innerHTML = `<div class="eyebrow">Source Ledger</div>${
    auditEntries.length
      ? `<div class="source-list">${auditEntries
          .slice(0, 4)
          .map(
            (entry) => `<article class="source-entry">
              <div><strong>${escapeHtml(entry.action)}</strong><span>${escapeHtml(entry.date)}</span></div>
              <p>${escapeHtml(entry.source)}</p>
              <small>${escapeHtml(entry.analyst)}</small>
            </article>`,
          )
          .join("")}</div>`
      : `<p class="muted ledger-empty">No confidence changes logged for this record.</p>`
  }`;

  $("#analyst-note").textContent = analystNote(record.id);
}

function renderContent() {
  const views = {
    Dashboard: renderDashboard,
    Search: renderSearch,
    Personnel: renderPersonnel,
    Organizations: renderOrganizations,
    Planets: renderPlanets,
    Ships: renderShips,
    Operations: renderOperations,
    "Intelligence Reports": renderReports,
    Timeline: renderTimeline,
    "About Network": renderAbout,
  };
  $("#content").innerHTML = views[state.section]();
}

function render() {
  renderNav();
  renderFilters();
  renderShell();
  renderContent();
  renderContext();
  $("#global-search").value = state.query;
}

document.addEventListener("click", (event) => {
  const section = event.target.closest("[data-section]")?.dataset.section;
  const filter = event.target.closest("[data-filter]")?.dataset.filter;
  const record = event.target.closest("[data-record]")?.dataset.record;
  const relationshipScope = event.target.closest("[data-relationship-scope]")?.dataset.relationshipScope;
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (section) setSection(section);
  if (filter) {
    state.filter = filter;
    state.cursor = 0;
    state.searchSubmitted = false;
    state.section = "Search";
    render();
  }
  if (action === "clear-filter") {
    state.filter = "All";
    state.cursor = 0;
    state.searchSubmitted = false;
    render();
  }
  if (action === "clear-search") {
    state.query = "";
    state.cursor = 0;
    state.searchSubmitted = false;
    render();
    $("#global-search").focus();
  }
  if (action === "print-dossier") {
    window.print();
  }
  if (action === "export-dossier") {
    exportCurrentDossier();
  }
  if (relationshipScope) {
    state.relationshipScope = relationshipScope;
    render();
  }
  if (record) openRecord(record);
});

$("#global-search").addEventListener("input", (event) => {
  state.query = event.target.value;
  state.cursor = 0;
  state.searchSubmitted = false;
  state.section = "Search";
  render();
  $("#global-search").focus();
});

document.addEventListener("keydown", (event) => {
  const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
  if (event.key === "/" && !typing) {
    event.preventDefault();
    state.section = "Search";
    render();
    $("#global-search").focus();
  }
  if (event.key === "Escape") {
    state.query = "";
    state.cursor = 0;
    state.searchSubmitted = false;
    render();
    $("#global-search").blur();
  }
  if (state.section === "Search" && ["ArrowDown", "ArrowRight"].includes(event.key)) {
    event.preventDefault();
    state.cursor = Math.min(state.cursor + 1, Math.max(searchResults().length - 1, 0));
    render();
  }
  if (state.section === "Search" && ["ArrowUp", "ArrowLeft"].includes(event.key)) {
    event.preventDefault();
    state.cursor = Math.max(state.cursor - 1, 0);
    render();
  }
  if (state.section === "Search" && event.key === "Enter") {
    event.preventDefault();
    state.searchSubmitted = Boolean(state.query.trim());
    state.cursor = 0;
    render();
    $("#global-search").focus();
  }
});

function initializeArchive(archiveData) {
  data = archiveData;
  buildRecords();
  render();
}

function showDataError(error) {
  $("#content").innerHTML = `<section class="search-results"><div class="empty-state">Archive data could not be loaded. Use a local web server or include data-inline.js with the static upload.</div></section>`;
  console.error("Karrde Intelligence Network data load failed:", error);
}

if (window.KIN_DATA) {
  initializeArchive(window.KIN_DATA);
} else {
  Promise.all([
    fetch("data/characters.json").then((response) => response.json()),
    fetch("data/organizations.json").then((response) => response.json()),
    fetch("data/planets.json").then((response) => response.json()),
    fetch("data/ships.json").then((response) => response.json()),
    fetch("data/operations.json").then((response) => response.json()),
    fetch("data/reports.json").then((response) => response.json()),
    fetch("data/timeline.json").then((response) => response.json()),
    fetch("data/audit.json").then((response) => response.json()),
  ])
    .then(([characters, organizations, planets, ships, operations, reports, timeline, audit]) => {
      initializeArchive({
        characters,
        organizations,
        planets,
        ships,
        operations,
        reports,
        timeline,
        audit,
      });
    })
    .catch(showDataError);
}
