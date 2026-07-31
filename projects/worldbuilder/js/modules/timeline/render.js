import { esc, formatNumber, titleCase } from "../../shared/dom.js";
import { timelineMarkdown } from "./generate.js";

const TIMELINE_TABS = ["Overview", "Chronology", "Eras", "Causality", "Warnings", "Gaps", "Branches", "Entities", "Export"];

export { TIMELINE_TABS, timelineMarkdown };

export function renderTimelineHome(savedTimelines = [], overview = {}, suggestions = []) {
  return `
    <section class="module-hero timeline-hero">
      <div>
        <p class="eyebrow">History and Chronology Builder</p>
        <h1>Timeline</h1>
        <p class="lede">Extract known events from the saved universe, normalize dates, reveal gaps and contradictions, and suggest connective history without replacing established canon.</p>
      </div>
      <div class="search-board">
        <div class="field-grid">
          <label>Seed
            <input id="timelineSeedInput" type="text" placeholder="meridian-history-4821">
          </label>
          <label>Subject
            <select id="timelineSubject">
              <option value="">Universe timeline</option>
              ${suggestions.map(item => `<option value="${esc(item.collection)}:${esc(item.id)}">${esc(item.title)}</option>`).join("")}
            </select>
          </label>
          <label>Mode
            <select id="timelineMode">
              <option value="extract">Extract existing events first</option>
              <option value="connective">Generate historical context</option>
              <option value="branch">Create alternate branch</option>
            </select>
          </label>
        </div>
        <div class="action-row">
          <button class="primary-button" data-action="open-universe-timeline" type="button">Open Universe Timeline</button>
          <button class="ghost-button" data-action="create-timeline" type="button">Create Filtered Timeline</button>
          <button class="ghost-button" data-action="extract-history" type="button">Extract Existing History</button>
          <button class="ghost-button" data-action="generate-connective-events" type="button">Generate Connective Events</button>
          <button class="ghost-button" data-action="add-historical-event" type="button">Add Historical Event</button>
          <button class="ghost-button" data-action="create-alternate-branch-home" type="button">Create Alternate Branch</button>
          <button class="ghost-button" data-action="open-timeline-seed" type="button">Load From Seed</button>
        </div>
      </div>
    </section>
    <section class="panel">
      <h2>Existing History</h2>
      <div class="metric-grid">
        ${metric("Known Events", overview.totalEvents)}
        ${metric("Earliest Date", overview.earliestYear || "unknown")}
        ${metric("Latest Date", overview.latestYear || "unknown")}
        ${metric("Major Eras", overview.majorEras || 0)}
        ${metric("Chronology Warnings", overview.contradictions || 0)}
        ${metric("Undated Events", overview.undated || 0)}
        ${metric("Orphaned Events", overview.orphaned || 0)}
        ${metric("Alternate Branches", overview.alternateBranches || 0)}
      </div>
    </section>
    <section class="panel">
      <h2>Suggested Timelines</h2>
      <div class="entry-grid">${renderTimelineSuggestions(suggestions)}</div>
    </section>
    <section class="panel">
      <h2>Saved Timelines</h2>
      <div class="entry-grid">${renderTimelineCards(savedTimelines)}</div>
    </section>
    <section class="panel">
      <h2>Recent Timelines</h2>
      <div class="entry-grid">${renderTimelineCards([...savedTimelines].sort((a, b) => new Date(b.updatedAt || b.savedAt) - new Date(a.updatedAt || a.savedAt)).slice(0, 4))}</div>
    </section>
    <section class="panel">
      <h2>Chronology Health</h2>
      <div class="entry-grid">
        ${healthCard("Date Conflicts", overview.contradictions || 0, "Existing records that may disagree or need a source decision.")}
        ${healthCard("Missing Periods", overview.gaps || 0, "Long empty spans where connective events may help.")}
        ${healthCard("Undated Records", overview.undated || 0, "Extracted events that preserve vague source dates.")}
        ${healthCard("Promotion Candidates", overview.totalEvents || 0, "Embedded event summaries that can become top-level historical events.")}
      </div>
    </section>
  `;
}

export function renderTimelineCards(records = []) {
  if (!records.length) return `<div class="empty-state">No saved timelines in this local archive yet.</div>`;
  return records.map(record => {
    const timeline = record.timeline || record.entity;
    return `
      <article class="entry-card timeline-entry" style="--accent:${esc(timeline.presentation?.accentColor || "var(--accent)")}">
        <div class="mini-timeline" aria-hidden="true"><span></span><span></span><span></span></div>
        <div>
          <h3>${esc(timeline.name || record.seed)}</h3>
          <p>${esc(timeline.timelineType || "timeline")} / ${timeline.health?.totalEvents || 0} events / ${timeline.health?.gaps || 0} gaps</p>
          <div class="meta-strip">
            <span class="badge">${esc(record.seed)}</span>
            ${record.favorite ? `<span class="badge">Favorite</span>` : ""}
          </div>
        </div>
        <button type="button" data-action="open-timeline" data-seed="${esc(record.seed)}" aria-label="Open timeline ${esc(record.seed)}"></button>
      </article>
    `;
  }).join("");
}

export function renderTimelineSuggestions(suggestions = []) {
  if (!suggestions.length) return `<div class="empty-state">Save systems, settlements, organizations, characters, conflicts, or documents to unlock grounded timeline suggestions.</div>`;
  return suggestions.slice(0, 12).map(item => `
    <article class="entry-card timeline-entry">
      <div class="mini-timeline" aria-hidden="true"><span></span><span></span><span></span></div>
      <div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.kind)} / ${esc(item.detail)}</p>
        <div class="meta-strip">
          <span class="badge">${esc(item.timelineType)}</span>
          <span class="badge">${esc(item.seed)}</span>
        </div>
      </div>
      <button type="button" data-action="open-suggested-timeline" data-collection="${esc(item.collection)}" data-id="${esc(item.id)}" data-seed="${esc(item.seed)}" aria-label="Open ${esc(item.title)}"></button>
    </article>
  `).join("");
}

export function renderTimelineDossier(timeline, activeTab, saved, favorite, selectedBranchId = "") {
  const branch = selectedBranchId ? timeline.branches.find(item => item.id === selectedBranchId) : null;
  return `
    <section class="org-header timeline-header" style="--accent:${esc(timeline.presentation.accentColor)}">
      <div class="org-logo timeline-seal">${timelineSeal(timeline)}</div>
      <div class="org-title">
        <p class="eyebrow">${esc(timeline.timelineType)} chronology / seed ${esc(timeline.seed)}</p>
        <h1>${esc(timeline.name)}</h1>
        <p class="lede">${esc(timeline.description)}</p>
        <div class="meta-strip">
          <span class="classification">${timeline.health.totalEvents} known events</span>
          <span class="badge">${timeline.health.earliestYear || "unknown"}-${timeline.health.latestYear || "unknown"}</span>
          <span class="badge">${timeline.health.contradictions} warning(s)</span>
          ${branch ? `<span class="badge">${esc(branch.name)}</span>` : ""}
        </div>
      </div>
      <div class="action-row">
        <button class="primary-button" data-action="save-timeline" type="button">${saved ? "Saved" : "Save"}</button>
        <button class="ghost-button" data-action="favorite-timeline" type="button">${favorite ? "Favorited" : "Favorite"}</button>
        <button class="ghost-button" data-action="regenerate-timeline" type="button">Regenerate</button>
        <button class="ghost-button" data-action="create-timeline-branch" type="button">Create Alternate Branch</button>
        <button class="ghost-button" data-action="export-timeline-json" type="button">JSON</button>
        <button class="ghost-button" data-action="export-timeline-md" type="button">Markdown</button>
      </div>
    </section>
    <nav class="tabs" aria-label="Timeline dossier sections">
      ${TIMELINE_TABS.map(tab => `<button class="tab-button ${tab === activeTab ? "active" : ""}" data-action="timeline-tab" data-tab="${tab}" type="button">${tab}</button>`).join("")}
    </nav>
    <section class="tab-panel">${renderTimelineTab(timeline, activeTab, selectedBranchId)}</section>
  `;
}

export function renderTimelineTab(timeline, tab, selectedBranchId = "") {
  const map = {
    Overview: renderOverview,
    Chronology: renderChronology,
    Eras: renderEras,
    Causality: renderCausality,
    Warnings: renderWarnings,
    Gaps: renderGaps,
    Branches: renderBranches,
    Entities: renderEntities,
    Export: renderExport
  };
  return (map[tab] || renderOverview)(timeline, selectedBranchId);
}

export function renderEventDetail(event, timeline) {
  if (!event) {
    return `<section class="panel"><p class="eyebrow">Historical Event</p><h1>Event Not Found</h1><p>No saved or extracted event matches that route.</p></section>`;
  }
  return `
    <section class="org-header timeline-header">
      <div class="org-logo timeline-seal">${eventIcon(event)}</div>
      <div class="org-title">
        <p class="eyebrow">${esc(event.eventCategory)} / ${esc(event.eventType)}</p>
        <h1>${esc(event.title)}</h1>
        <p class="lede">${esc(event.summary)}</p>
        <div class="meta-strip">
          <span class="classification">${esc(event.chronology.displayDate)}</span>
          <span class="badge">${esc(event.historicalAssessment.certainty)}</span>
          <span class="badge">${esc(event.source.parentName || event.source.type)}</span>
        </div>
      </div>
      <div class="action-row">
        <button class="ghost-button" data-action="go-timeline" type="button">Back To Timeline</button>
      </div>
    </section>
    <div class="split-layout">
      <section class="panel">
        <h2>Consequences</h2>
        ${list(event.consequences, "No consequences extracted yet.")}
      </section>
      <aside class="panel">
        <h2>Perspectives</h2>
        ${event.perspectives.map(item => `<article class="data-card"><h3>${esc(item.authorOrInstitution)}</h3><p>${esc(item.claim)}</p><p class="eyebrow">${esc(item.bias)} / ${esc(item.confidence)}</p></article>`).join("")}
      </aside>
    </div>
    <div class="split-layout">
      <section class="panel">
        <h2>Historical Memory</h2>
        <article class="data-card"><h3>Public Memory</h3><p>${esc(event.historicalMemory?.publicMemory || "No memory model recorded yet.")}</p></article>
        <article class="data-card"><h3>Institutional Memory</h3><p>${esc(event.historicalMemory?.institutionalMemory || "No institutional account recorded yet.")}</p></article>
      </section>
      <aside class="panel">
        <h2>Source Coverage</h2>
        <div class="metric-grid">
          ${metric("Sources", event.sourceCoverage?.sourceCount || event.sourceDocumentIds.length || 1)}
          ${metric("Diversity", event.sourceCoverage?.sourceDiversity || 1)}
          ${metric("Agreement", event.sourceCoverage?.agreementLevel || "unknown")}
        </div>
        ${list(event.sourceCoverage?.missingPerspectives || [], "No obvious missing perspectives detected.")}
      </aside>
    </div>
    <section class="panel"><h2>Entity Changes</h2><div class="entry-grid">${(event.entityChanges || []).map(change => `<article class="data-card"><p class="eyebrow">${esc(change.entityType)} / ${esc(change.changeType)}</p><h3>${esc(change.entityId)}</h3><p>${esc(change.description)}</p></article>`).join("") || `<div class="empty-state">No entity change records extracted.</div>`}</div></section>
    <section class="panel"><h2>Source</h2><pre class="code-block">${esc(JSON.stringify(event.source, null, 2))}</pre></section>
    ${timeline ? `<section class="panel"><h2>Timeline Context</h2>${renderChronology({ ...timeline, events: nearbyEvents(timeline.events, event) })}</section>` : ""}
  `;
}

function renderOverview(timeline) {
  return `
    <div class="split-layout">
      <section class="panel">
        <p class="eyebrow">Chronology summary</p>
        <h2>${esc(timeline.name)}</h2>
        <p class="lede">${esc(timeline.description)}</p>
        <div class="metric-grid">
          ${metric("Known Events", timeline.health.totalEvents)}
          ${metric("Earliest", timeline.health.earliestYear || "unknown")}
          ${metric("Latest", timeline.health.latestYear || "unknown")}
          ${metric("Eras", timeline.eras.length)}
          ${metric("Gaps", timeline.gaps.length)}
          ${metric("Warnings", timeline.contradictions.length)}
        </div>
      </section>
      <aside class="panel">
        <h2>Extraction Rules</h2>
        <div class="entry-list">
          <article class="data-card"><h3>Existing world first</h3><p>Saved records are read before any connective history is suggested.</p></article>
          <article class="data-card"><h3>Original dates preserved</h3><p>Normalized chronology keeps the source date text alongside sortable values.</p></article>
          <article class="data-card"><h3>Suggestions stay visible</h3><p>Generated bridge events remain marked as suggestions until saved later.</p></article>
        </div>
      </aside>
    </div>
    <section class="panel">
      <h2>Turning Points</h2>
      <div class="entry-grid">${timeline.events.filter(event => event.historicalAssessment.turningPoint).slice(0, 6).map(renderEventCard).join("") || `<div class="empty-state">No turning points detected yet.</div>`}</div>
    </section>
  `;
}

function renderChronology(timeline) {
  return `<section class="panel"><h2>Shared Chronology</h2><div class="timeline-ribbon">${timeline.events.map(renderTimelineEvent).join("")}</div></section>`;
}

function renderEras(timeline) {
  return `<section class="panel"><h2>Historical Eras</h2><div class="entry-grid">${timeline.eras.map(era => `
    <article class="era-band">
      <p class="eyebrow">${esc(era.startDate)} to ${esc(era.endDate)}</p>
      <h3>${esc(era.name)}</h3>
      <p>${esc(era.interpretation)}</p>
      <div class="meta-strip">${era.definingTraits.map(trait => `<span class="badge">${esc(trait)}</span>`).join("")}</div>
    </article>
  `).join("") || `<div class="empty-state">Save or extract more dated events to generate era boundaries.</div>`}</div></section>`;
}

function renderCausality(timeline) {
  if (!timeline.causalLinks.length) return `<section class="panel"><h2>Event Chains</h2><div class="empty-state">No causal links detected yet. More shared entities or repeated categories will strengthen the chain.</div></section>`;
  const byId = new Map(timeline.events.map(event => [event.id, event]));
  return `<section class="panel"><h2>Event Chains</h2><div class="entry-list">${timeline.causalLinks.map(link => {
    const source = byId.get(link.sourceEventId);
    const target = byId.get(link.targetEventId);
    return `<article class="relation-card">
      <p class="eyebrow">${esc(link.relationshipType)} / ${esc(link.strength)} / ${esc(link.certainty)}</p>
      <h3>${esc(source?.shortLabel || "Earlier event")} -> ${esc(target?.shortLabel || "Later event")}</h3>
      <p>${esc(source?.chronology.displayDate || "")} to ${esc(target?.chronology.displayDate || "")}</p>
    </article>`;
  }).join("")}</div></section>`;
}

function renderWarnings(timeline) {
  return `<section class="panel"><h2>Chronology Warnings</h2><div class="entry-list">${timeline.contradictions.map(warning => `
    <article class="data-card warning-card">
      <p class="eyebrow">${esc(warning.severity)} / ${esc(warning.warningType)}</p>
      <h3>${esc(warning.message)}</h3>
      <p>${esc(warning.resolutionOptions.join(", "))}</p>
    </article>
  `).join("") || `<div class="empty-state">No contradictions detected in extracted records.</div>`}</div></section>`;
}

function renderGaps(timeline) {
  return `<section class="panel"><h2>Suggested Missing Events</h2><div class="entry-list">${timeline.gaps.map(gap => `
    <article class="data-card gap-card">
      <p class="eyebrow">${esc(gap.severity)} / ${esc(gap.gapType)}</p>
      <h3>${esc(gap.fromTitle)}${gap.toTitle ? ` to ${esc(gap.toTitle)}` : ""}</h3>
      <p>${esc(gap.suggestion)}</p>
    </article>
  `).join("") || `<div class="empty-state">No major chronology gaps detected.</div>`}</div></section>
  <section class="panel"><h2>Generated Connective Events</h2><div class="entry-grid">${timeline.connectiveEvents.map(renderEventCard).join("") || `<div class="empty-state">No bridge events needed yet.</div>`}</div></section>`;
}

function renderBranches(timeline, selectedBranchId = "") {
  return `<section class="panel"><h2>Alternate-History Branches</h2><div class="entry-grid">${timeline.branches.map(branch => `
    <article class="era-band ${branch.id === selectedBranchId ? "selected" : ""}">
      <p class="eyebrow">${esc(branch.status)} branch / diverges ${esc(branch.divergenceDate)}</p>
      <h3>${esc(branch.name)}</h3>
      <p>${esc(branch.summary)}</p>
      ${list(branch.consequences)}
    </article>
  `).join("") || `<div class="empty-state">No branch candidates yet.</div>`}</div></section>`;
}

function renderEntities(timeline) {
  const counts = {
    systems: unique(timeline.events.flatMap(event => event.location.systemIds)).length,
    settlements: unique(timeline.events.flatMap(event => [...event.location.settlementIds, ...event.participants.settlementIds])).length,
    organizations: unique(timeline.events.flatMap(event => event.participants.organizationIds)).length,
    characters: unique(timeline.events.flatMap(event => event.participants.characterIds)).length,
    documents: unique(timeline.events.flatMap(event => event.sourceDocumentIds)).length,
    conflicts: unique(timeline.events.flatMap(event => event.sourceConflictIds)).length
  };
  return `<section class="panel"><h2>Entities Over Time</h2><div class="metric-grid">${Object.entries(counts).map(([label, value]) => metric(titleCase(label), value)).join("")}</div></section>
  <section class="panel"><h2>Source Records</h2><div class="entry-grid">${unique(timeline.events.map(event => event.source.parentName)).slice(0, 18).map(name => `<article class="data-card"><h3>${esc(name || "Unnamed Source")}</h3><p>Referenced by extracted historical events.</p></article>`).join("")}</div></section>`;
}

function renderExport(timeline) {
  return `<section class="panel"><h2>Export Timeline</h2><div class="card-grid">
    <button class="document-card" data-action="export-timeline-json" type="button"><h3>Complete JSON</h3><p>Timeline, event, era, branch, gap, and warning data.</p></button>
    <button class="document-card" data-action="export-timeline-md" type="button"><h3>Markdown Dossier</h3><p>Readable chronology for notes or publishing.</p></button>
    <button class="document-card" data-action="export-timeline-html" type="button"><h3>Printable HTML</h3><p>Standalone static timeline document.</p></button>
  </div><pre class="code-block">${esc(timelineMarkdown(timeline))}</pre></section>`;
}

function renderTimelineEvent(event) {
  return `
    <article class="timeline-event-card ${event.status === "suggested" ? "suggested" : ""}">
      <div class="timeline-date">${esc(event.chronology.displayDate)}</div>
      <div>
        <p class="eyebrow">${esc(event.eventCategory)} / ${esc(event.historicalAssessment.certainty)}</p>
        <h3>${esc(event.title)}</h3>
        <p>${esc(event.summary)}</p>
        <div class="meta-strip">
          <span class="badge">${esc(event.scale)}</span>
          <span class="badge">${event.historicalAssessment.turningPoint ? "Turning Point" : "Context"}</span>
          ${event.status === "suggested" ? `<span class="badge">Suggested</span>` : ""}
        </div>
      </div>
      <a class="card-link" href="#/events/${encodeURIComponent(event.id)}" aria-label="Open event ${esc(event.title)}"></a>
    </article>
  `;
}

function renderEventCard(event) {
  return `<article class="data-card event-summary-card">
    <p class="eyebrow">${esc(event.chronology.displayDate)} / ${esc(event.eventCategory)}</p>
    <h3>${esc(event.title)}</h3>
    <p>${esc(event.summary)}</p>
    <div class="meta-strip"><span class="badge">${esc(event.historicalAssessment.certainty)}</span>${event.status === "suggested" ? `<span class="badge">Suggested</span>` : ""}</div>
  </article>`;
}

function timelineSeal(timeline) {
  const items = timeline.eras.length || 3;
  return `<svg viewBox="0 0 144 144" role="img" aria-label="${esc(timeline.name)} timeline seal">
    <circle cx="72" cy="72" r="54" fill="transparent" stroke="var(--accent)" stroke-width="7"/>
    <path d="M34 76h76" stroke="var(--accent-2)" stroke-width="6"/>
    ${Array.from({ length: items }, (_, index) => {
      const x = 40 + index * (64 / Math.max(1, items - 1));
      return `<circle cx="${x}" cy="76" r="8" fill="var(--accent)"/>`;
    }).join("")}
    <path d="M72 24v24M72 96v24" stroke="var(--line)" stroke-width="5"/>
  </svg>`;
}

function eventIcon(event) {
  return `<svg viewBox="0 0 144 144" role="img" aria-label="${esc(event.title)}">
    <rect x="26" y="26" width="92" height="92" fill="transparent" stroke="var(--accent)" stroke-width="7"/>
    <path d="M42 78h60M42 58h38M42 98h48" stroke="var(--accent-2)" stroke-width="6"/>
  </svg>`;
}

function metric(label, value) {
  return `<article class="data-card"><span class="meta-label">${esc(label)}</span><strong>${typeof value === "number" ? formatNumber(value) : esc(value)}</strong></article>`;
}

function healthCard(title, value, text) {
  return `<article class="data-card"><span class="meta-label">${esc(title)}</span><strong>${formatNumber(value)}</strong><p>${esc(text)}</p></article>`;
}

function list(items = [], empty = "No entries yet.") {
  if (!items.length) return `<p>${esc(empty)}</p>`;
  return `<ul>${items.map(item => `<li>${esc(item)}</li>`).join("")}</ul>`;
}

function unique(items = []) {
  return [...new Set(items.filter(Boolean))];
}

function nearbyEvents(events, event) {
  const index = events.findIndex(item => item.id === event.id);
  if (index < 0) return [event];
  return events.slice(Math.max(0, index - 2), index + 3);
}
