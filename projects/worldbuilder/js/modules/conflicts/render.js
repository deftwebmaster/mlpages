import { esc, titleCase } from "../../shared/dom.js";
import { renderMetricBars } from "../../shared/metrics.js";
import { fitText } from "../../shared/svg.js";
import { conflictMarkdown } from "./generate.js";

const CONFLICT_TABS = ["Overview", "Parties", "Causes", "Stakes", "Timeline", "Escalation", "Interventions", "Network"];

export { CONFLICT_TABS, conflictMarkdown };

export function renderConflictsHome(savedConflicts = [], pressurePoints = [], savedSettlements = [], savedOrganizations = [], savedCharacters = [], savedSystems = []) {
  const dashboard = conflictDashboard(savedConflicts);
  return `
    <section class="module-hero">
      <div>
        <p class="eyebrow">Conflict and Crisis Generator</p>
        <h1>Conflicts</h1>
        <p class="lede">Generate active crises from the people, institutions, places, resources, secrets, histories, and tensions already saved in this universe.</p>
      </div>
      <div class="search-board">
        <div class="field-grid">
          <label>Seed
            <input id="conflictSeedInput" type="text" placeholder="meridian-air-crisis-2291">
          </label>
          <label>Context mode
            <select id="conflictContextMode">
              <option value="existing-first">Use existing world first</option>
              <option value="standalone">Standalone conflict</option>
            </select>
          </label>
          <label>Settlement
            <select id="conflictSettlement">
              <option value="">Auto</option>
              ${savedSettlements.map(record => {
                const settlement = record.settlement || record.entity;
                return `<option value="${esc(record.seed)}">${esc(settlement.name)}</option>`;
              }).join("")}
            </select>
          </label>
          <label>Organization
            <select id="conflictOrganization">
              <option value="">Auto</option>
              ${savedOrganizations.map(record => {
                const org = record.organization || record.entity;
                return `<option value="${esc(record.seed)}">${esc(org.identity.name)}</option>`;
              }).join("")}
            </select>
          </label>
          <label>Character
            <select id="conflictCharacter">
              <option value="">Auto</option>
              ${savedCharacters.map(record => {
                const character = record.character || record.entity;
                return `<option value="${esc(record.seed)}">${esc(character.name.full)}</option>`;
              }).join("")}
            </select>
          </label>
          <label>System
            <select id="conflictSystem">
              <option value="">Auto</option>
              ${savedSystems.map(record => {
                const system = record.system || record.entity;
                return `<option value="${esc(record.seed)}">${esc(system.name)}</option>`;
              }).join("")}
            </select>
          </label>
        </div>
        <div class="action-row">
          <button class="primary-button" data-action="generate-conflict" type="button">Generate Conflict</button>
          <button class="ghost-button" data-action="generate-world-conflict" type="button">Generate From Existing World</button>
          <button class="ghost-button" data-action="open-conflict-seed" type="button">Load From Seed</button>
        </div>
      </div>
    </section>
    <section class="panel">
      <h2>Conflict Dashboard</h2>
      <div class="metric-grid">
        ${Object.entries(dashboard).map(([label, value]) => `<article class="data-card"><span class="meta-label">${esc(titleCase(label))}</span><strong>${value}</strong></article>`).join("")}
      </div>
    </section>
    <section class="panel">
      <h2>Existing Pressure Points</h2>
      <div class="entry-grid">${renderPressurePointCards(pressurePoints)}</div>
    </section>
    <section class="panel">
      <h2>Saved Conflicts</h2>
      <div class="entry-grid">${renderConflictCards(savedConflicts)}</div>
    </section>
    <section class="panel">
      <h2>Recently Viewed</h2>
      <div class="entry-grid">${renderConflictCards([...savedConflicts].sort((a, b) => new Date(b.updatedAt || b.savedAt) - new Date(a.updatedAt || a.savedAt)).slice(0, 4))}</div>
    </section>
  `;
}

export function renderPressurePointCards(items) {
  if (!items.length) return `<div class="empty-state">Save systems, settlements, organizations, or characters to reveal pressure points that can become full conflicts.</div>`;
  return items.map(item => `
    <article class="entry-card conflict-entry">
      <div class="mini-conflict" aria-hidden="true"><span></span><span></span></div>
      <div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.parentName)} / ${esc(item.kind)} / ${esc(item.detail)}</p>
        <div class="meta-strip">
          <span class="badge">${item.promotedEntityId ? "Promoted" : "Available"}</span>
          <span class="badge">${esc(item.seed)}</span>
        </div>
      </div>
      <button type="button" data-action="expand-pressure-conflict" data-source-type="${esc(item.sourceType)}" data-parent-seed="${esc(item.parentSeed)}" data-source-id="${esc(item.sourceId)}" aria-label="Expand ${esc(item.title)} into full conflict"></button>
    </article>
  `).join("");
}

export function renderConflictCards(records) {
  if (!records.length) return `<div class="empty-state">No saved conflicts in this local archive yet.</div>`;
  return records.map(item => {
    const conflict = item.conflict || item.entity;
    return `
      <article class="entry-card conflict-entry" style="--accent:${conflict ? esc(conflict.presentation.accentColor) : "var(--accent)"}">
        <div class="mini-conflict" aria-hidden="true"><span></span><span></span></div>
        <div>
          <h3>${esc(conflict?.name || item.seed)}</h3>
          <p>${conflict ? `${esc(conflict.classification.status)} / ${esc(conflict.classification.scope)} / ${esc(conflict.classification.category)}` : "Conflict seed"}</p>
          <div class="meta-strip">
            <span class="badge">${esc(item.seed)}</span>
            ${item.favorite ? `<span class="badge">Favorite</span>` : ""}
          </div>
        </div>
        <button type="button" data-action="open-conflict" data-seed="${esc(item.seed)}" aria-label="Open conflict ${esc(item.seed)}"></button>
      </article>
    `;
  }).join("");
}

export function renderConflictDossier(conflict, activeTab, saved, favorite) {
  return `
    <section class="org-header conflict-header">
      <div class="org-logo conflict-seal">${renderConflictSeal(conflict)}</div>
      <div class="org-title">
        <p class="eyebrow">${esc(conflict.presentation.dossierStyle)} / seed ${esc(conflict.seed)}</p>
        <h1>${esc(conflict.name)}</h1>
        <div class="meta-strip">
          <span class="classification">${esc(conflict.classification.status)}</span>
          <span class="badge">${esc(conflict.classification.scope)}</span>
          <span class="badge">${esc(conflict.classification.category)}</span>
          <span class="badge">${esc(conflict.classification.intensity)} intensity</span>
        </div>
      </div>
      <div class="action-row">
        <button class="primary-button" data-action="save-conflict" type="button">${saved ? "Saved" : "Save"}</button>
        <button class="ghost-button" data-action="favorite-conflict" type="button">${favorite ? "Favorited" : "Favorite"}</button>
        <button class="ghost-button" data-action="regenerate-conflict" type="button">Regenerate</button>
        <button class="ghost-button" data-action="generate-suggested-document" data-source-type="conflict" data-parent-seed="${esc(conflict.seed)}" data-source-id="${esc(conflict.id)}" data-document-type="witness-statement" type="button">Generate Evidence</button>
        <button class="ghost-button" data-action="export-conflict-json" type="button">JSON</button>
        <button class="ghost-button" data-action="export-conflict-md" type="button">Markdown</button>
      </div>
    </section>
    <nav class="tabs" aria-label="Conflict dossier sections">
      ${CONFLICT_TABS.map(tab => `<button class="tab-button ${tab === activeTab ? "active" : ""}" data-action="conflict-tab" data-tab="${tab}" type="button">${tab}</button>`).join("")}
    </nav>
    <section class="tab-panel">${renderConflictTab(conflict, activeTab)}</section>
  `;
}

export function renderConflictTab(conflict, tab) {
  const map = {
    Overview: renderOverview,
    Parties: renderParties,
    Causes: renderCauses,
    Stakes: renderStakes,
    Timeline: renderTimeline,
    Escalation: renderEscalation,
    Interventions: renderInterventions,
    Network: renderNetwork
  };
  return (map[tab] || renderOverview)(conflict);
}

function renderOverview(conflict) {
  return `
    <div class="split-layout">
      <section class="panel">
        <p class="eyebrow">Conflict synopsis</p>
        <h2>${esc(conflict.subtitle)}</h2>
        <p class="lede">${esc(conflict.summary)}</p>
        ${renderMetricBars(conflict.metrics)}
      </section>
      <aside class="panel">
        <h2>Pressure Network</h2>
        ${pressureSvg(conflict)}
      </aside>
    </div>
  `;
}

function renderParties(conflict) {
  return `<section class="panel"><h2>Parties and Wants</h2><div class="card-grid">${conflict.parties.map(party => `
    <article class="relation-card network-node">
      <p class="eyebrow">${esc(party.role)} / ${esc(party.entityType)}</p>
      <h3>${esc(party.name)}</h3>
      <p><strong>Public goal:</strong> ${esc(party.publicGoal)}</p>
      <p><strong>Private goal:</strong> ${esc(party.privateGoal)}</p>
      <p><strong>Leverage:</strong> ${esc(party.leverage)} / <strong>Vulnerability:</strong> ${esc(party.vulnerability)}</p>
      <p><strong>Current move:</strong> ${esc(party.currentMove)}</p>
    </article>`).join("")}</div></section>`;
}

function renderCauses(conflict) {
  return `<div class="split-layout">
    <section class="panel"><h2>Causes</h2><div class="metric-grid">
      ${Object.entries(conflict.causes).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(titleCase(key.replace(/([A-Z])/g, " $1")))}</span><p>${esc(value)}</p></article>`).join("")}
    </div></section>
    <aside class="panel"><h2>Public and Hidden Narrative</h2>
      <article class="incident-card"><h3>${esc(conflict.publicNarrative.headline)}</h3><p>${esc(conflict.publicNarrative.dominantBelief)}</p><p>Rumor: ${esc(conflict.publicNarrative.rumor)}</p></article>
      <article class="incident-card"><h3>Hidden Truth</h3><p>${esc(conflict.hiddenTruth.truth)}</p><p>Evidence: ${esc(conflict.hiddenTruth.evidence)}. Exposure: ${esc(conflict.hiddenTruth.exposureRisk)}.</p></article>
    </aside>
  </div>`;
}

function renderStakes(conflict) {
  return `<section class="panel"><h2>Stakes and Resources</h2><div class="card-grid">
    ${conflict.stakes.map(stake => `<article class="incident-card"><p class="eyebrow">${esc(stake.severity)}</p><h3>${esc(stake.name)}</h3><p>${esc(stake.description)}</p></article>`).join("")}
    ${conflict.resources.map(resource => `<article class="product-card"><p class="eyebrow">${esc(resource.scarcity)}</p><h3>${esc(resource.name)}</h3><p>Controlled by ${esc(resource.controller)}.</p></article>`).join("")}
  </div></section>`;
}

function renderTimeline(conflict) {
  return `<section class="panel"><h2>Chronology</h2><div class="timeline">${conflict.chronology.map(item => `
    <article class="timeline-item">
      <div><strong class="timeline-year">${item.year}</strong><span class="badge">${esc(item.visibility)}</span></div>
      <div><h3>${esc(item.title)}</h3><p>${esc(item.event)}</p></div>
    </article>`).join("")}</div></section>`;
}

function renderEscalation(conflict) {
  return `<div class="split-layout">
    <section class="panel"><h2>Escalation Ladder</h2><div class="timeline">${conflict.escalation.ladder.map(item => `
      <article class="timeline-item"><div><strong class="timeline-year">${esc(item.stage)}</strong></div><div><p>${esc(item.event)}</p></div></article>`).join("")}</div></section>
    <aside class="panel"><h2>If Nobody Intervenes</h2><p class="lede">${esc(conflict.escalation.noInterventionOutcome)}</p><p class="eyebrow">${esc(conflict.escalation.currentThreshold)}</p></aside>
  </div>`;
}

function renderInterventions(conflict) {
  return `<section class="panel"><h2>Choices That Change the Outcome</h2><div class="card-grid">${conflict.possibleInterventions.map(item => `
    <article class="product-card">
      <p class="eyebrow">Backer: ${esc(item.likelyBacker)}</p>
      <h3>${esc(item.choice)}</h3>
      <p>${esc(item.effect)}</p>
      <p><strong>Risk:</strong> ${esc(item.risk)}</p>
    </article>`).join("")}</div>
    <h2 style="margin-top:1rem">Possible Outcomes</h2>
    <div class="card-grid">${conflict.outcomes.map(item => `<article class="incident-card"><h3>${esc(item.name)}</h3><p>${esc(item.result)}</p><p><strong>Cost:</strong> ${esc(item.cost)}</p></article>`).join("")}</div>
  </section>`;
}

function renderNetwork(conflict) {
  return `<section class="panel"><h2>Affected Existing Entities</h2><div class="card-grid">
    ${conflict.affectedEntities.map(entity => `<article class="relation-card"><p class="eyebrow">${esc(entity.entityType)}</p><h3>${esc(entity.name)}</h3><p>${esc(entity.effect)}</p></article>`).join("")}
    ${conflict.relationships.map(rel => `<article class="data-card"><p class="eyebrow">${esc(rel.toEntityType)} / ${esc(rel.relationshipType)}</p><h3>${esc(rel.label)}</h3><p>Stored as shared universe relationship ${esc(rel.id)}.</p></article>`).join("")}
  </div></section>`;
}

function renderConflictSeal(conflict) {
  const accent = esc(conflict.presentation.accentColor);
  return `<svg viewBox="0 0 144 144" role="img" aria-label="${esc(conflict.name)} conflict seal">
    <rect x="18" y="18" width="108" height="108" fill="#11161a" stroke="${accent}" stroke-width="6"/>
    <path d="M34 92 58 48l24 48 24-44" fill="none" stroke="${accent}" stroke-width="8"/>
    <circle cx="58" cy="48" r="8" fill="#f2eee6"/>
    <circle cx="82" cy="96" r="8" fill="#f2eee6"/>
    <path d="M32 112h80M32 32h80" stroke="#f2eee6" stroke-width="4" opacity=".45"/>
  </svg>`;
}

function pressureSvg(conflict) {
  const accent = esc(conflict.presentation.accentColor);
  const nodes = conflict.parties.map((party, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(1, conflict.parties.length);
    return { party, x: 350 + Math.cos(angle) * 130, y: 180 + Math.sin(angle) * 105 };
  });
  return `<svg class="system-map relationship-map" viewBox="0 0 700 360" role="img" aria-label="Pressure network for ${esc(conflict.name)}">
    <circle cx="350" cy="180" r="44" fill="${accent}" opacity=".84"/>
    <text x="350" y="184" text-anchor="middle" fill="#101316" font-size="12" font-weight="700">CRISIS</text>
    ${nodes.map(node => `<line x1="350" y1="180" x2="${node.x}" y2="${node.y}" stroke="${accent}" stroke-width="3" opacity=".58"/>`).join("")}
    ${nodes.map(node => `<g tabindex="0">
      <rect x="${node.x - 62}" y="${node.y - 20}" width="124" height="40" fill="rgba(255,255,255,.08)" stroke="${accent}" stroke-width="2"/>
      <text x="${node.x}" y="${node.y + 4}" text-anchor="middle" fill="#f2eee6" font-size="10">${esc(fitText(node.party.name, 112, 10))}</text>
      <title>${esc(node.party.name)}: ${esc(node.party.publicGoal)}</title>
    </g>`).join("")}
  </svg>`;
}

function conflictDashboard(records) {
  const statuses = { active: 0, emerging: 0, escalating: 0, stalemated: 0, resolved: 0, archived: 0 };
  records.forEach(record => {
    const status = (record.conflict || record.entity)?.classification?.status || "active";
    statuses[status] = (statuses[status] || 0) + 1;
  });
  return statuses;
}
