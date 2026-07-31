import { esc, titleCase } from "../../shared/dom.js";
import { renderMetricBars } from "../../shared/metrics.js";
import { characterMarkdown } from "./generate.js";

const CHARACTER_TABS = ["Overview", "Network", "Context", "Work", "History", "Goals", "Secrets", "Story Hooks"];

export { CHARACTER_TABS, characterMarkdown };

export function renderCharactersHome(savedCharacters = [], availablePeople = [], savedSettlements = [], savedOrganizations = []) {
  return `
    <section class="module-hero">
      <div>
        <p class="eyebrow">Character Dossier Archive</p>
        <h1>Characters</h1>
        <p class="lede">Generate people as relationship networks with obligations, loyalties, secrets, conflicting goals, and concrete ties to saved worlds.</p>
      </div>
      <div class="search-board">
        <div class="field-grid">
          <label>Seed
            <input id="characterSeedInput" type="text" placeholder="elena-voric-4821">
          </label>
          <label>Character role
            <select id="characterRole">
              <option value="random">Random</option>
              <option value="supporting-protagonist">Supporting Protagonist</option>
              <option value="antagonist">Antagonist</option>
              <option value="ally">Ally</option>
              <option value="rival">Rival</option>
              <option value="witness">Witness</option>
              <option value="patron">Patron</option>
              <option value="double-agent">Double Agent</option>
            </select>
          </label>
          <label>Existing settlement
            <select id="characterSettlement">
              <option value="">Standalone</option>
              ${savedSettlements.map(record => {
                const settlement = record.settlement || record.entity;
                return `<option value="${esc(record.seed)}">${esc(settlement.name)}</option>`;
              }).join("")}
            </select>
          </label>
          <label>Existing organization
            <select id="characterOrganization">
              <option value="">None</option>
              ${savedOrganizations.map(record => {
                const org = record.organization || record.entity;
                return `<option value="${esc(record.seed)}">${esc(org.identity.name)}</option>`;
              }).join("")}
            </select>
          </label>
          <label>Relationship density
            <select id="characterRelationships">
              <option value="random">Random</option>
              <option value="sparse">Sparse</option>
              <option value="standard">Standard</option>
              <option value="dense">Dense</option>
            </select>
          </label>
          <label>Occupation
            <input id="characterOccupation" type="text" placeholder="Random">
          </label>
        </div>
        <div class="action-row">
          <button class="primary-button" data-action="generate-character" type="button">Generate Character</button>
          <button class="ghost-button" data-action="open-character-seed" type="button">Load From Seed</button>
        </div>
      </div>
    </section>
    <section class="panel">
      <h2>Available for Expansion</h2>
      <div class="entry-grid">${renderAvailablePeople(availablePeople)}</div>
    </section>
    <section class="panel">
      <h2>Saved Characters</h2>
      <div class="entry-grid">${renderCharacterCards(savedCharacters)}</div>
    </section>
    <section class="panel">
      <h2>Example Dossiers</h2>
      <div class="entry-grid">${renderCharacterCards(["elena-voric-4821", "dockside-witness", "blackfile-relative"].map(seed => ({ seed })), true)}</div>
    </section>
  `;
}

export function renderAvailablePeople(items) {
  if (!items.length) return `<div class="empty-state">Save an organization with leadership records, then expand its people here.</div>`;
  return items.map(item => `
    <article class="entry-card character-entry">
      <div class="mini-portrait" aria-hidden="true">${initials(item.person.name)}</div>
      <div>
        <h3>${esc(item.person.name)}</h3>
        <p>${esc(item.person.role)} / ${esc(item.organization.identity.name)}</p>
        <p>${esc(item.person.biography || item.person.reputation || "Embedded person summary")}</p>
        <div class="meta-strip">
          <span class="badge">${item.person.promotionStatus === "promoted" ? "Promoted" : "Summary"}</span>
          <span class="badge">${esc(item.person.seed || item.person.id)}</span>
        </div>
      </div>
      <button type="button" data-action="expand-person-character" data-org-seed="${esc(item.organization.seed)}" data-person-id="${esc(item.person.id)}" aria-label="Expand ${esc(item.person.name)}"></button>
    </article>
  `).join("");
}

export function renderCharacterCards(records, examples = false) {
  if (!records.length) return `<div class="empty-state">No saved characters in this local archive yet.</div>`;
  return records.map(item => {
    const character = item.character || item.entity;
    const title = character ? character.name.full : item.seed;
    return `
      <article class="entry-card character-entry" style="--accent:${character ? esc(character.presentation.accentColor) : "var(--accent)"}">
        <div class="mini-portrait" aria-hidden="true">${initials(title)}</div>
        <div>
          <h3>${esc(title)}</h3>
          <p>${character ? `${esc(character.occupation.title)} / ${esc(character.currentLocation.settlementName)}` : "Example seed"}</p>
          ${character ? `<p>${esc(character.network.relationshipDensity)} ties / ${esc(character.network.unstableTies)} unstable / ${esc(character.network.hiddenTies)} hidden</p>` : ""}
          <div class="meta-strip">
            <span class="badge">${esc(item.seed)}</span>
            ${item.favorite ? `<span class="badge">Favorite</span>` : ""}
          </div>
        </div>
        <button type="button" data-action="open-character" data-seed="${esc(item.seed)}" aria-label="Open character ${esc(item.seed)}"></button>
      </article>
    `;
  }).join("");
}

export function renderCharacterDossier(character, activeTab, saved, favorite) {
  return `
    <section class="org-header character-header">
      <div class="org-logo character-portrait">${renderPortrait(character)}</div>
      <div class="org-title">
        <p class="eyebrow">${esc(character.presentation.dossierStyle)} / seed ${esc(character.seed)}</p>
        <h1>${esc(character.name.full)}</h1>
        <div class="meta-strip">
          <span class="classification">${esc(character.classification.characterRole)}</span>
          <span class="badge">${esc(character.occupation.title)}</span>
          <span class="badge">${esc(character.currentLocation.settlementName)}</span>
          <span class="badge">${character.network.relationshipDensity} relationships</span>
          <span class="badge">${character.network.unstableTies} unstable ties</span>
        </div>
      </div>
      <div class="action-row">
        <button class="primary-button" data-action="save-character" type="button">${saved ? "Saved" : "Save"}</button>
        <button class="ghost-button" data-action="favorite-character" type="button">${favorite ? "Favorited" : "Favorite"}</button>
        <button class="ghost-button" data-action="regenerate-character" type="button">Regenerate</button>
        <button class="ghost-button" data-action="export-character-json" type="button">JSON</button>
        <button class="ghost-button" data-action="export-character-md" type="button">Markdown</button>
      </div>
    </section>
    <nav class="tabs" aria-label="Character dossier sections">
      ${CHARACTER_TABS.map(tab => `<button class="tab-button ${tab === activeTab ? "active" : ""}" data-action="character-tab" data-tab="${tab}" type="button">${tab}</button>`).join("")}
    </nav>
    <section class="tab-panel">${renderCharacterTab(character, activeTab)}</section>
  `;
}

export function renderCharacterTab(character, tab) {
  const map = {
    Overview: renderOverview,
    Network: renderNetwork,
    Context: renderContext,
    Work: renderWork,
    History: renderHistory,
    Goals: renderGoals,
    Secrets: renderSecrets,
    "Story Hooks": renderStoryHooks
  };
  return (map[tab] || renderOverview)(character);
}

function renderOverview(character) {
  return `
    <div class="split-layout">
      <section class="panel">
        <p class="eyebrow">Dossier synopsis</p>
        <h2>${esc(character.classification.socialStatus)}</h2>
        <p class="lede">${esc(character.summary)}</p>
        ${renderMetricBars(character.metrics)}
      </section>
      <aside class="panel">
        <h2>Relationship Network</h2>
        ${relationshipSvg(character)}
        <div class="metric-grid" style="margin-top:1rem">
          ${Object.entries(character.network).map(([label, value]) => `<article class="data-card"><span class="meta-label">${esc(titleCase(label.replace(/([A-Z])/g, " $1")))}</span><strong>${value}</strong></article>`).join("")}
        </div>
      </aside>
    </div>
  `;
}

function renderNetwork(character) {
  return `<section class="panel">
    <h2>People as Core Data</h2>
    <p class="lede">Every tie below has values the rest of the universe can consume: trust, debt, leverage, obligation, secrets, and story use.</p>
    ${relationshipSvg(character)}
    <div class="card-grid" style="margin-top:1rem">
      ${character.relationships.map(rel => `<article class="relation-card network-node">
        <p class="eyebrow">${esc(rel.relationshipType)} / ${esc(rel.status)} / ${esc(rel.storyUse)}</p>
        <h3>${esc(rel.relatedName)}</h3>
        <p>${esc(rel.relatedRole)}</p>
        <div class="mini-bars">
          ${miniBar("Loyalty", rel.loyalty)}
          ${miniBar("Trust", rel.trust)}
          ${miniBar("Debt", rel.debt)}
        </div>
        <p><strong>Obligation:</strong> ${esc(rel.obligation)}</p>
        <p><strong>Secret:</strong> ${esc(rel.secret)}</p>
        <p><strong>Leverage:</strong> ${esc(rel.leverage)} / <strong>Conflict:</strong> ${esc(rel.conflict)}</p>
      </article>`).join("")}
      ${character.entityRelationships.map(rel => `<article class="relation-card">
        <p class="eyebrow">${esc(rel.toEntityType)} / ${esc(rel.relationshipType)}</p>
        <h3>${esc(rel.label)}</h3>
        <p>Stored as shared universe relationship ${esc(rel.id)}.</p>
      </article>`).join("")}
    </div>
  </section>`;
}

function renderContext(character) {
  return `<div class="split-layout">
    <section class="panel">
      <h2>Identity and Location</h2>
      <div class="metric-grid">
        ${Object.entries({
          Age: character.identity.age,
          Species: character.identity.species,
          Gender: character.identity.gender,
          Pronouns: character.name.pronouns,
          Citizenship: character.identity.citizenships.join(" / "),
          Languages: character.identity.languages.join(" / "),
          Settlement: character.currentLocation.settlementName,
          District: character.currentLocation.districtName,
          Residence: character.currentLocation.residenceType,
          Conditions: character.currentLocation.livingConditions
        }).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(key)}</span><p>${esc(value)}</p></article>`).join("")}
      </div>
    </section>
    <aside class="panel">
      <h2>Origin</h2>
      <p>${esc(character.origin.birthplaceSummary)}</p>
      <p><strong>Family background:</strong> ${esc(character.origin.familyBackground)}</p>
      ${character.origin.migrationHistory.map(item => `<p class="eyebrow">${esc(item)}</p>`).join("")}
    </aside>
  </div>`;
}

function renderWork(character) {
  return `<div class="split-layout">
    <section class="panel">
      <h2>${esc(character.occupation.title)}</h2>
      <div class="metric-grid">
        ${Object.entries({
          Employer: character.occupation.employerName,
          Rank: character.occupation.rank,
          Worksite: character.occupation.worksite,
          "Daily work": character.occupation.dailyWork,
          Leverage: character.occupation.leverageAtWork,
          Hazard: character.occupation.occupationalHazard
        }).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(key)}</span><p>${esc(value)}</p></article>`).join("")}
      </div>
    </section>
    <aside class="panel">
      <h2>Affiliations</h2>
      ${character.affiliations.map(item => `<article class="data-card"><h3>${esc(item.name)}</h3><p>${esc(item.role)}. Loyalty ${item.loyalty}/100.</p><p><strong>Benefit:</strong> ${esc(item.benefit)} / <strong>Cost:</strong> ${esc(item.cost)}</p></article>`).join("")}
    </aside>
  </div>`;
}

function renderHistory(character) {
  return `<section class="panel"><h2>Personal History</h2><div class="timeline">${character.history.map(item => `
    <article class="timeline-item">
      <div><strong class="timeline-year">${item.year}</strong><span class="badge">${esc(item.relatedRelationshipId ? "relationship-linked" : "context")}</span></div>
      <div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><p class="eyebrow">${esc(item.consequence)}</p></div>
    </article>
  `).join("")}</div></section>`;
}

function renderGoals(character) {
  return `<div class="split-layout">
    <section class="panel"><h2>Goals and Obstacles</h2><div class="card-grid">${character.goals.map(goal => `
      <article class="product-card"><h3>${esc(goal.want)}</h3><p><strong>Obstacle:</strong> ${esc(goal.obstacle)}</p><p class="eyebrow">${esc(goal.stakes)}</p></article>
    `).join("")}</div></section>
    <aside class="panel"><h2>Fears and Limits</h2>${character.fears.map(fear => `<article class="data-card"><p>${esc(fear)}</p></article>`).join("")}${character.limitations.map(limit => `<article class="data-card"><p>${esc(limit)}</p></article>`).join("")}</aside>
  </div>`;
}

function renderSecrets(character) {
  return `<section class="panel"><h2>Secrets and Conflicts</h2><div class="card-grid">
    ${character.secrets.map(secret => `<article class="incident-card">
      <p class="eyebrow">${esc(secret.risk)}</p>
      <h3>${esc(secret.title)}</h3>
      <p>Known by ${esc(secret.knownBy)}. Containment: ${esc(secret.containment)}.</p>
      <p>Tied entity: ${esc(secret.tiedEntity)}</p>
    </article>`).join("")}
    ${character.conflicts.map(conflict => `<article class="incident-card">
      <p class="eyebrow">${esc(conflict.publicFace)}</p>
      <h3>${esc(conflict.name)}</h3>
      <p><strong>Private cause:</strong> ${esc(conflict.privateCause)}</p>
      <p><strong>Trigger:</strong> ${esc(conflict.escalationTrigger)} / <strong>Likely betrayal:</strong> ${esc(conflict.likelyBetrayal)}</p>
    </article>`).join("")}
  </div></section>`;
}

function renderStoryHooks(character) {
  return `<section class="panel"><h2>Story Hooks</h2><div class="card-grid">${character.storyHooks.map(hook => `
    <article class="product-card">
      <p class="eyebrow">${esc(hook.usefulFor)}</p>
      <h3>${esc(hook.premise)}</h3>
      <p>${esc(hook.complication)}</p>
    </article>
  `).join("")}</div></section>`;
}

function relationshipSvg(character) {
  const accent = esc(character.presentation.accentColor);
  const center = { x: 350, y: 180 };
  const nodes = character.relationships.map((rel, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(1, character.relationships.length);
    const radius = 112 + (index % 2) * 34;
    return { rel, x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
  });
  return `<svg class="system-map relationship-map" viewBox="0 0 700 360" role="img" aria-label="Relationship network for ${esc(character.name.full)}">
    <circle cx="${center.x}" cy="${center.y}" r="42" fill="${accent}" opacity=".78"/>
    <text x="${center.x}" y="${center.y + 4}" text-anchor="middle" fill="#101316" font-size="13" font-weight="700">${esc(initials(character.name.full))}</text>
    ${nodes.map(node => `<line x1="${center.x}" y1="${center.y}" x2="${node.x}" y2="${node.y}" stroke="${node.rel.trust < 40 ? "#d86a5d" : accent}" stroke-width="${Math.max(1, Math.round(node.rel.debt / 24))}" opacity=".65"/>`).join("")}
    ${nodes.map(node => `<g tabindex="0">
      <circle cx="${node.x}" cy="${node.y}" r="${node.rel.status === "hidden" ? 18 : 15}" fill="rgba(255,255,255,.08)" stroke="${node.rel.trust < 40 ? "#d86a5d" : accent}" stroke-width="2"/>
      <text x="${node.x}" y="${node.y + 4}" text-anchor="middle" fill="#f2eee6" font-size="9">${esc(initials(node.rel.relatedName))}</text>
      <title>${esc(node.rel.relatedName)}: ${esc(node.rel.relationshipType)}; trust ${node.rel.trust}; debt ${node.rel.debt}</title>
    </g>`).join("")}
  </svg>`;
}

function renderPortrait(character) {
  const accent = esc(character.presentation.accentColor);
  return `<svg viewBox="0 0 144 144" role="img" aria-label="Archive portrait for ${esc(character.name.full)}">
    <rect x="16" y="16" width="112" height="112" fill="#11161a" stroke="${accent}" stroke-width="5"/>
    <circle cx="72" cy="54" r="23" fill="${accent}" opacity=".82"/>
    <path d="M34 120c5-29 20-44 38-44s33 15 38 44" fill="rgba(255,255,255,.16)" stroke="${accent}" stroke-width="4"/>
    <path d="M38 30h68M38 114h68" stroke="#f2eee6" stroke-width="3" opacity=".55"/>
  </svg>`;
}

function miniBar(label, value) {
  return `<div class="bar-row mini-bar"><span>${esc(label)}</span><span class="bar-track"><span class="bar-fill" style="width:${value}%"></span></span><span>${value}</span></div>`;
}

function initials(name) {
  return String(name).split(/\s+/).filter(Boolean).slice(0, 3).map(part => part[0]).join("").toUpperCase();
}
