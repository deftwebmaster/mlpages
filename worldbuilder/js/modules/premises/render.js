import { esc, formatNumber, titleCase } from "../../shared/dom.js";
import { renderMetricBars } from "../../shared/metrics.js";
import { PREMISE_GENRES, PREMISE_TONES, STORY_SCALES, STORY_STATUSES, CANON_STATUSES, NARRATIVE_MODES, storyPremiseMarkdown } from "./generate.js";

const PREMISE_TABS = ["Overview", "Logline", "Extended", "Source", "Protagonist", "Opposition", "Stakes", "Choice", "Escalation", "Relationships", "Evaluation", "Continuity", "Additions", "Export"];

export { PREMISE_TABS, storyPremiseMarkdown };

export function renderPremisesHome(savedPremises = [], signals = [], coverage = {}, filters = {}, entityOptions = []) {
  const filtered = applyPremiseFilters(savedPremises, filters);
  return `
    <section class="module-hero premise-hero">
      <div>
        <p class="eyebrow">Narrative Pressure and Story Concept Builder</p>
        <h1>Story Premises</h1>
        <p class="lede">Discover story ideas already implied by saved characters, factions, conflicts, documents, history, settlements, organizations, and relationships. Generated additions stay labeled as non-canon suggestions.</p>
      </div>
      <div class="search-board">
        <div class="field-grid">
          <label>Seed
            <input id="premiseSeedInput" type="text" placeholder="air-crisis-whistleblower-4281">
          </label>
          <label>Mode
            <select id="premiseMode">
              <option value="discovery">Discovery Mode</option>
              <option value="focused">Focused Mode</option>
              <option value="guided">Guided Mode</option>
              <option value="advanced">Advanced Mode</option>
            </select>
          </label>
          <label>Focus entity
            <select id="premiseFocus">
              <option value="">Universe pressure</option>
              ${entityOptions.map(entity => `<option value="${esc(entity.id)}">${esc(entity.label)} (${esc(entity.entityType)})</option>`).join("")}
            </select>
          </label>
          <label>Genre
            <select id="premiseGenre">
              <option value="">Auto</option>
              ${PREMISE_GENRES.map(item => `<option value="${esc(item)}">${esc(titleCase(item))}</option>`).join("")}
            </select>
          </label>
          <label>Scale
            <select id="premiseScale">
              <option value="">Auto</option>
              ${STORY_SCALES.map(item => `<option value="${esc(item)}">${esc(titleCase(item))}</option>`).join("")}
            </select>
          </label>
          <label>Tone
            <select id="premiseTone">
              <option value="">Auto</option>
              ${PREMISE_TONES.map(item => `<option value="${esc(item)}">${esc(titleCase(item))}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="action-row">
          <button class="primary-button" data-action="generate-premise" type="button">Discover Story Premises</button>
          <button class="ghost-button" data-action="generate-world-premise" type="button">Generate From Universe Pressure</button>
          <button class="ghost-button" data-action="open-premise-seed" type="button">Load From Seed</button>
          <button class="ghost-button" data-action="create-manual-premise" type="button">Create Premise Manually</button>
        </div>
      </div>
    </section>
    <section class="panel">
      <h2>Premise Overview</h2>
      <div class="metric-grid">
        ${metric("Total Premises", savedPremises.length)}
        ${metric("Developing", countStatus(savedPremises, "developing"))}
        ${metric("Shortlisted", countStatus(savedPremises, "shortlisted"))}
        ${metric("Drafted", countStatus(savedPremises, "drafting"))}
        ${metric("Archived", countStatus(savedPremises, "archived"))}
        ${metric("Pressure Signals", signals.length)}
        ${metric("Duplicate Concepts", coverage.duplicateConcepts?.length || 0)}
        ${metric("Unused Major Entities", coverage.unusedMajorEntities?.length || 0)}
        ${metric("Underused Characters", coverage.underusedCharacters?.length || 0)}
        ${metric("Underused Locations", coverage.underusedLocations?.length || 0)}
        ${metric("Missing Protagonists", coverage.missingProtagonists?.length || 0)}
        ${metric("Missing Stakes", coverage.missingStakes?.length || 0)}
      </div>
    </section>
    <section class="panel">
      <h2>Suggested Generation</h2>
      <div class="entry-grid">
        ${generationCard("Character-Driven Story", "Turn a character's obligations, fears, and access into a concrete choice.", "character")}
        ${generationCard("Conflict-Driven Story", "Personalize an unresolved crisis instead of expanding it randomly.", "conflict")}
        ${generationCard("Faction Story", "Find a schism, legitimacy crisis, or constituency revolt.", "faction")}
        ${generationCard("Mystery From a Document", "Use a record as inciting evidence, false evidence, or hidden history.", "document")}
        ${generationCard("Historical Echo", "Connect a past event to a present decision.", "historical")}
        ${generationCard("Settlement Crisis", "Localize infrastructure, scarcity, law, or district pressure.", "settlement")}
        ${generationCard("Organization Intrigue", "Expose mission conflict, liability, succession, or record control.", "organization")}
        ${generationCard("Relationship Breakdown", "Build from hidden ties, asymmetry, rivalry, or dependency.", "relationship")}
        ${generationCard("Survival Story", "Keep stakes focused on one system, district, ship, or community.", "survival")}
        ${generationCard("Political Thriller", "Make policy pressure personal and deadline driven.", "political-thriller")}
      </div>
    </section>
    <section class="panel">
      <h2>Strongest Narrative Pressures</h2>
      <div class="entry-list">${renderSignalCards(signals.slice(0, 10))}</div>
    </section>
    <section class="panel">
      <h2>Saved Premises</h2>
      <div class="entry-grid">${renderPremiseCards(filtered)}</div>
    </section>
    <section class="panel">
      <h2>Coverage Notes</h2>
      <div class="entry-grid">
        ${coverageCard("Underused Characters", coverage.underusedCharacters)}
        ${coverageCard("Underused Locations", coverage.underusedLocations)}
        ${coverageCard("Overused Conflicts", coverage.overusedConflicts)}
        ${coverageCard("Duplicate Concepts", coverage.duplicateConcepts)}
      </div>
    </section>
  `;
}

export function renderPremiseCards(records = []) {
  if (!records.length) return `<div class="empty-state">No saved story premises in this local archive yet.</div>`;
  return records.map(record => {
    const premise = record.storyPremise || record.entity || record;
    return `
      <article class="entry-card premise-entry" style="--accent:${esc(premise.presentation?.accentColor || "var(--accent)")}">
        <div class="mini-premise" aria-hidden="true"><span></span><span></span><span></span></div>
        <div>
          <h3>${esc(premise.title || record.seed)}</h3>
          <p>${esc(premise.logline || "Story premise")}</p>
          <div class="meta-strip">
            <span class="badge">${esc(titleCase(premise.classification?.primaryGenre || "genre"))}</span>
            <span class="badge">${esc(titleCase(premise.classification?.storyScale || "scale"))}</span>
            <span class="badge">${esc(titleCase(premise.status || "idea"))}</span>
            ${(premise.continuity?.warnings?.length || premise.evaluation?.warnings?.length) ? `<span class="badge">${(premise.continuity?.warnings?.length || 0) + (premise.evaluation?.warnings?.length || 0)} warning(s)</span>` : ""}
            ${record.favorite || premise.favorite ? `<span class="badge">Favorite</span>` : ""}
          </div>
        </div>
        <button type="button" data-action="open-premise" data-seed="${esc(record.seed || premise.seed)}" aria-label="Open premise ${esc(premise.title || record.seed)}"></button>
      </article>
    `;
  }).join("");
}

export function renderPremiseDossier(premise, activeTab = "Overview", saved = false, favorite = false) {
  return `
    <section class="org-header premise-header" style="--accent:${esc(premise.presentation?.accentColor || "var(--accent)")}">
      <div class="org-logo premise-seal">${premiseSeal(premise)}</div>
      <div class="org-title">
        <p class="eyebrow">${esc(titleCase(premise.classification.primaryGenre))} / seed ${esc(premise.seed)}</p>
        <h1>${esc(premise.title)}</h1>
        <p class="lede">${esc(premise.logline)}</p>
        <div class="meta-strip">
          <span class="classification">${esc(titleCase(premise.status))}</span>
          <span class="badge">${esc(titleCase(premise.canonStatus))}</span>
          <span class="badge">${esc(titleCase(premise.classification.storyScale))}</span>
          <span class="badge">${esc(titleCase(premise.classification.narrativeMode))}</span>
          <span class="badge">${esc(premise.protagonistModel.label)}</span>
        </div>
      </div>
      <div class="action-row">
        <button class="primary-button" data-action="save-premise" type="button">${saved ? "Saved" : "Save"}</button>
        <button class="ghost-button" data-action="favorite-premise" type="button">${favorite ? "Favorited" : "Favorite"}</button>
        <button class="ghost-button" data-action="regenerate-premise" type="button">Generate Variant</button>
        <button class="ghost-button" data-action="archive-premise" type="button">Archive</button>
        <button class="ghost-button" data-action="export-premise-json" type="button">JSON</button>
        <button class="ghost-button" data-action="export-premise-md" type="button">Markdown</button>
        <button class="ghost-button" data-action="export-premise-html" type="button">Printable</button>
      </div>
    </section>
    <nav class="tabs" aria-label="Story premise sections">
      ${PREMISE_TABS.map(tab => `<button class="tab-button ${tab === activeTab ? "active" : ""}" data-action="premise-tab" data-tab="${esc(tab)}" type="button">${esc(tab)}</button>`).join("")}
    </nav>
    <section class="tab-panel">${renderPremiseTab(premise, activeTab)}</section>
  `;
}

export function renderPremiseTab(premise, tab = "Overview") {
  const map = {
    Overview: renderOverview,
    Logline: renderLogline,
    Extended: renderExtended,
    Source: renderSource,
    Protagonist: renderProtagonist,
    Opposition: renderOpposition,
    Stakes: renderStakes,
    Choice: renderChoice,
    Escalation: renderEscalation,
    Relationships: renderRelationships,
    Evaluation: renderEvaluation,
    Continuity: renderContinuity,
    Additions: renderAdditions,
    Export: renderExport
  };
  return (map[tab] || renderOverview)(premise);
}

function renderOverview(premise) {
  return `
    <div class="split-layout">
      <section class="panel">
        <p class="eyebrow">Narrative core</p>
        <h2>${esc(premise.workingTitle)}</h2>
        <p class="lede">${esc(premise.shortPremise)}</p>
        <div class="metric-grid">
          ${metric("Evaluation", `${premise.evaluation?.overall || 0}/100`)}
          ${metric("Source Entities", premise.sourceContext?.entityIds?.length || 0)}
          ${metric("Pressure Signals", premise.inspirationSignalIds?.length || 0)}
          ${metric("Generated Additions", premise.sourceContext?.generatedAdditions?.length || 0)}
          ${metric("Warnings", (premise.evaluation?.warnings?.length || 0) + (premise.continuity?.warnings?.length || 0))}
          ${metric("Complexity", premise.continuity?.complexity?.label || "focused")}
        </div>
      </section>
      <aside class="panel">
        <h2>Canon Boundary</h2>
        <div class="entry-list">
          ${card("Canon Status", titleCase(premise.canonStatus))}
          ${card("Generated Material", `${premise.sourceContext.generatedAdditions.length} non-canon suggestion(s) awaiting review.`)}
          ${card("Novelty", `${titleCase(premise.novelty?.classification || "distinct-enough")} / ${premise.novelty?.score || 0}/100`)}
        </div>
      </aside>
    </div>
    <section class="panel"><h2>Narrative Question</h2><div class="entry-grid">
      ${card("Question", premise.narrativeCore.narrativeQuestion)}
      ${card("Promise", premise.narrativeCore.narrativePromise)}
      ${card("Irreversible Choice", premise.narrativeCore.irreversibleChoice)}
    </div></section>
  `;
}

function renderLogline(premise) {
  return `<section class="panel"><h2>Logline</h2><article class="data-card"><p class="lede">${esc(premise.logline)}</p></article></section>
  <section class="panel"><h2>Short Premise</h2><p>${esc(premise.shortPremise)}</p></section>`;
}

function renderExtended(premise) {
  return `<section class="panel"><h2>Extended Premise</h2>${paragraphs(premise.extendedPremise)}</section>
  <section class="panel"><h2>Genre Frame</h2><div class="entry-grid">
    ${card("Primary Genre", titleCase(premise.classification.primaryGenre))}
    ${card("Secondary Genres", premise.classification.secondaryGenres.map(titleCase).join(", ") || "none")}
    ${card("Tone", premise.classification.tone.map(titleCase).join(", "))}
    ${card("Narrative Mode", titleCase(premise.classification.narrativeMode))}
  </div></section>`;
}

function renderSource(premise) {
  return `<section class="panel"><h2>Source Trace</h2><div class="entry-grid">
    ${card("Context", premise.sourceContext.source.type)}
    ${card("Source Hash", premise.sourceContext.sourceContextHash)}
    ${card("Primary Signals", premise.sourceContext.primarySignalIds.join(", ") || "none")}
    ${card("Secondary Signals", premise.sourceContext.secondarySignalIds.join(", ") || "none")}
    ${card("Linked Entities", premise.sourceContext.entityIds.join(", ") || "none")}
    ${card("Branch", premise.sourceContext.branchId || "canon")}
  </div></section>
  <section class="panel"><h2>Active Pressure</h2><div class="entry-list">${premise.sourceContext.activePressures.map(item => `<article class="data-card"><p>${esc(item)}</p></article>`).join("") || `<div class="empty-state">No active pressure summaries.</div>`}</div></section>`;
}

function renderProtagonist(premise) {
  const p = premise.protagonistModel;
  return `<section class="panel"><h2>Protagonist Model</h2><div class="entry-grid">
    ${card("Focal Character", p.focalCharacterId ? `${p.label} / ${p.focalCharacterId}` : `${p.label} / generated role`)}
    ${card("Goal", p.externalGoal)}
    ${card("Need", p.internalNeed)}
    ${card("Fear", p.fear)}
    ${card("Leverage", p.leverage)}
    ${card("Vulnerability", p.vulnerability)}
    ${card("Skill", p.relevantSkill)}
    ${card("Relationship Pressure", p.relationshipPressure)}
    ${card("Cost of Refusal", p.costOfRefusal)}
    ${card("Transformation", p.potentialTransformation)}
  </div></section>
  ${p.promotion ? `<section class="panel"><h2>Promotion</h2><div class="entry-grid">${card("Character Dossier Seed", p.promotion.suggestedSeed)}${card("State", p.promotion.status)}</div></section>` : ""}`;
}

function renderOpposition(premise) {
  const o = premise.oppositionModel;
  return `<section class="panel"><h2>Opposing Force</h2><div class="entry-grid">
    ${card("Opposition", `${o.label}${o.entityId ? ` / ${o.entityId}` : ""}`)}
    ${card("Goal", o.goal)}
    ${card("Rationale", o.rationale)}
    ${card("Resources", o.resources.join(", "))}
    ${card("Leverage", o.leverage)}
    ${card("Constraints", o.constraints)}
    ${card("Relationship To Protagonist", o.relationshipToProtagonist)}
    ${card("Public Position", o.publicPosition)}
    ${card("Hidden Position", o.hiddenPosition)}
    ${card("Sympathetic Point", o.sympatheticPoint)}
    ${card("Escalation Capacity", o.escalationCapacity)}
  </div></section>`;
}

function renderStakes(premise) {
  return `<section class="panel"><h2>Stakes Calibration</h2><div class="entry-grid">
    ${card("Personal", premise.stakes.personal)}
    ${card("Local", premise.stakes.local)}
    ${card("Systemic", premise.stakes.systemic)}
    ${card("Calibration", premise.stakes.calibration)}
  </div></section>`;
}

function renderChoice(premise) {
  const choice = premise.choiceArchitecture;
  return `<section class="panel"><h2>Central Choice</h2><div class="entry-grid">
    ${card(choice.optionA.label, choice.optionA.promise)}
    ${card(choice.optionB.label, choice.optionB.promise)}
    ${card("Hidden Option", choice.hiddenOption)}
    ${card("Cost of A", choice.costOfA)}
    ${card("Cost of B", choice.costOfB)}
    ${card("Temptation", choice.temptation)}
    ${card("Moral Pressure", choice.moralPressure)}
    ${card("Irreversible Point", choice.irreversiblePoint)}
  </div></section>`;
}

function renderEscalation(premise) {
  return `<section class="panel"><h2>Escalation Path</h2><div class="timeline-ribbon">
    ${premise.escalation.steps.map((step, index) => `<article class="timeline-event-card"><div class="timeline-date">${index + 1}</div><div><p>${esc(step)}</p></div></article>`).join("")}
  </div></section>
  <section class="panel"><h2>Twist Potential</h2><div class="entry-grid">${premise.twistPotential.options.map(item => card(item.value, `Grounded in ${item.groundedIn.join(", ") || "premise context"} / ${item.status}`)).join("")}</div></section>
  <section class="panel"><h2>Ending Possibilities</h2><div class="entry-grid">${premise.endingPossibilities.options.map(item => card(titleCase(item.family), item.implication)).join("")}</div></section>`;
}

function renderRelationships(premise) {
  return `<section class="panel"><h2>Relationship and Module Links</h2><div class="entry-grid">
    ${card("Characters", premise.characterIds.join(", ") || "none")}
    ${card("Organizations", premise.organizationIds.join(", ") || "none")}
    ${card("Factions", premise.factionIds.join(", ") || "none")}
    ${card("Settlements", premise.settlementIds.join(", ") || "none")}
    ${card("Conflicts", premise.conflictIds.join(", ") || "none")}
    ${card("Documents", premise.documentIds.join(", ") || "none")}
    ${card("Historical Events", premise.historicalEventIds.join(", ") || "none")}
    ${card("Relationships", premise.relationshipIds.join(", ") || "derived from source signals")}
  </div></section>
  <section class="panel"><h2>Integration Actions</h2><div class="card-grid">
    <a class="document-card" href="#/relationships"><h3>Open Story Network</h3><p>Inspect hidden relationships, paths, evidence, and hubs.</p></a>
    ${premise.conflictIds[0] ? `<a class="document-card" href="#/conflicts/${encodeURIComponent(premise.conflictIds[0])}"><h3>Open Linked Conflict</h3><p>Compare premise pressure with canonical conflict.</p></a>` : ""}
    ${premise.documentIds[0] ? `<a class="document-card" href="#/documents/${encodeURIComponent(premise.documentIds[0])}"><h3>Open Inciting Document</h3><p>Inspect source, claims, reliability, and redactions.</p></a>` : ""}
  </div></section>`;
}

function renderEvaluation(premise) {
  const scores = premise.evaluation?.scores || {};
  return `<section class="panel"><h2>Premise Evaluation</h2>
    ${renderMetricBars(scores, { columns: 2 })}
  </section>
  <section class="panel"><h2>Warnings</h2><div class="entry-list">${(premise.evaluation?.warnings || []).map(item => `<article class="data-card warning-card"><p>${esc(item)}</p></article>`).join("") || `<div class="empty-state">No evaluation warnings.</div>`}</div></section>
  <section class="panel"><h2>Novelty</h2><div class="entry-grid">
    ${card("Classification", titleCase(premise.novelty?.classification || "distinct-enough"))}
    ${card("Score", `${premise.novelty?.score || 0}/100`)}
    ${card("Overlaps", premise.novelty?.overlaps?.map(item => item.premiseId).join(", ") || "none")}
  </div></section>`;
}

function renderContinuity(premise) {
  return `<section class="panel"><h2>Continuity Validation</h2><div class="entry-list">
    ${(premise.continuity?.warnings || []).map(item => `<article class="data-card warning-card"><p class="eyebrow">${esc(item.severity)}</p><h3>${esc(item.message)}</h3></article>`).join("") || `<div class="empty-state">No continuity warnings.</div>`}
  </div></section>
  <section class="panel"><h2>Viewpoint Knowledge</h2><div class="entry-grid">
    ${card("Hidden Relationships", premise.continuity?.viewpointKnowledge?.hiddenRelationshipIds?.join(", ") || "none")}
    ${card("Accessible Documents", premise.continuity?.viewpointKnowledge?.accessibleDocumentIds?.join(", ") || "none")}
    ${card("Risk", premise.continuity?.viewpointKnowledge?.risk || "low")}
  </div></section>
  <section class="panel"><h2>Complexity</h2><div class="metric-grid">${Object.entries(premise.continuity?.complexity || {}).map(([key, value]) => metric(titleCase(key), value)).join("")}</div></section>`;
}

function renderAdditions(premise) {
  return `<section class="panel"><h2>Generated Additions</h2><div class="entry-list">
    ${premise.sourceContext.generatedAdditions.map(item => `<article class="data-card">
      <p class="eyebrow">${esc(item.status)} / ${esc(item.canonStatus || "non-canon-concept")}</p>
      <h3>${esc(titleCase(item.field))}</h3>
      <p>${esc(item.value)}</p>
      <div class="meta-strip">${item.promotionTarget ? `<span class="badge">Promote to ${esc(item.promotionTarget)}</span>` : ""}${item.seed ? `<span class="badge">${esc(item.seed)}</span>` : ""}</div>
    </article>`).join("") || `<div class="empty-state">No generated additions.</div>`}
  </div></section>
  <section class="panel"><h2>Development Checklist</h2><div class="entry-grid">${premise.developmentNotes.checklist.map(item => card(item, "Ready for review")).join("")}</div></section>`;
}

function renderExport(premise) {
  return `<section class="panel"><h2>Export Story Premise</h2><div class="card-grid">
    <button class="document-card" data-action="export-premise-json" type="button"><h3>Complete JSON</h3><p>Full structured premise entity.</p></button>
    <button class="document-card" data-action="export-premise-md" type="button"><h3>Markdown Dossier</h3><p>Readable premise brief.</p></button>
    <button class="document-card" data-action="export-premise-html" type="button"><h3>Printable HTML</h3><p>Static premise document.</p></button>
    <button class="document-card" data-action="export-premise-brief" type="button"><h3>Development Brief</h3><p>Protagonist, conflict, stakes, choice, escalation, and continuity.</p></button>
    <button class="document-card" data-action="export-premise-seed-package" type="button"><h3>Story Seed Package</h3><p>Premise plus linked entity summaries.</p></button>
  </div><pre class="code-block">${esc(storyPremiseMarkdown(premise))}</pre></section>`;
}

function renderSignalCards(signals = []) {
  if (!signals.length) return `<div class="empty-state">Save world entities to reveal context-grounded narrative pressure.</div>`;
  return signals.map(signal => `
    <article class="relation-card premise-signal">
      <p class="eyebrow">${esc(signal.category)} / ${esc(titleCase(signal.signalType))}</p>
      <h3>${esc(signal.summary)}</h3>
      <p>${esc(signal.detail)}</p>
      <div class="meta-strip">
        <span class="badge">Potential ${signal.storyPotential}/100</span>
        <span class="badge">Severity ${signal.severity}/100</span>
        <span class="badge">Personal ${signal.personalizability}/100</span>
      </div>
      <button type="button" data-action="open-suggested-premise" data-seed="${esc(`premise-${signal.id}`)}" data-focus="${esc(signal.sourceEntityIds[0] || "")}" aria-label="Generate premise from ${esc(signal.summary)}"></button>
    </article>
  `).join("");
}

function applyPremiseFilters(records = [], filters = {}) {
  return records.filter(record => {
    const premise = record.storyPremise || record.entity || record;
    if (filters.genre && premise.classification?.primaryGenre !== filters.genre) return false;
    if (filters.scale && premise.classification?.storyScale !== filters.scale) return false;
    if (filters.status && premise.status !== filters.status) return false;
    return true;
  });
}

function countStatus(records, status) {
  return records.filter(record => (record.storyPremise || record.entity || record).status === status).length;
}

function generationCard(title, summary, kind) {
  return `<article class="entry-card premise-entry">
    <div class="mini-premise" aria-hidden="true"><span></span><span></span><span></span></div>
    <div><h3>${esc(title)}</h3><p>${esc(summary)}</p><div class="meta-strip"><span class="badge">${esc(kind)}</span></div></div>
    <button type="button" data-action="premise-entry" data-entry="${esc(kind)}" aria-label="${esc(title)}"></button>
  </article>`;
}

function coverageCard(title, items = []) {
  if (!items?.length) return `<article class="data-card"><p class="eyebrow">Coverage</p><h3>${esc(title)}</h3><p>No current warnings.</p></article>`;
  return `<article class="data-card"><p class="eyebrow">Coverage</p><h3>${esc(title)}</h3><p>${esc(items.slice(0, 5).map(item => item.name || item.title || item.id || item.ids?.join(" / ")).join(", "))}</p></article>`;
}

function premiseSeal(premise) {
  return `<svg viewBox="0 0 144 144" role="img" aria-label="Story premise seal">
    <circle cx="72" cy="72" r="54" fill="transparent" stroke="var(--accent)" stroke-width="7"></circle>
    <path d="M42 84c14-34 46-34 60 0" fill="transparent" stroke="var(--accent-2)" stroke-width="7"></path>
    <path d="M48 49h48M48 64h32M48 101h48" stroke="var(--line)" stroke-width="6"></path>
    <circle cx="98" cy="64" r="8" fill="var(--accent)"></circle>
  </svg>`;
}

function metric(label, value) {
  const display = typeof value === "number" ? formatNumber(value) : value;
  return `<article class="data-card"><span class="meta-label">${esc(label)}</span><strong>${esc(display)}</strong></article>`;
}

function card(title, body) {
  return `<article class="data-card"><p class="eyebrow">${esc(title)}</p><h3>${esc(body || "None recorded")}</h3></article>`;
}

function paragraphs(text) {
  return String(text || "").split(/\n+/).map(part => `<p>${esc(part)}</p>`).join("");
}
