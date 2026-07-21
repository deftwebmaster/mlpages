import { esc, formatNumber, titleCase } from "../../shared/dom.js";
import { factionMarkdown } from "./generate.js";

const FACTION_TABS = ["Overview", "Ideology", "Constituency", "Goals", "Strategy", "Leadership", "Influence", "Internal Blocs", "Relations", "History", "Risks", "Export"];

export { FACTION_TABS, factionMarkdown };

export function renderFactionsHome(savedFactions = [], suggestions = [], metrics = {}, filters = {}) {
  return `
    <section class="module-hero faction-hero">
      <div>
        <p class="eyebrow">Political, Social, and Ideological Power Builder</p>
        <h1>Factions</h1>
        <p class="lede">Create groups united by interests, identity, ideology, grievance, loyalty, and political goals. Factions can live inside organizations, settlements, conflicts, and histories without becoming duplicate organizations.</p>
      </div>
      <div class="search-board">
        <div class="field-grid">
          <label>Seed
            <input id="factionSeedInput" type="text" placeholder="meridian-reform-coalition-4281">
          </label>
          <label>Mode
            <select id="factionMode">
              <option value="existing-first">Generate From Existing Context</option>
              <option value="quick">Quick Mode</option>
              <option value="guided">Guided Mode</option>
              <option value="advanced">Advanced Mode</option>
            </select>
          </label>
          <label>Faction family
            <select id="factionType">
              <option value="random">Auto</option>
              <option value="political movement">Political movement</option>
              <option value="labor faction">Labor faction</option>
              <option value="reform caucus">Reform caucus</option>
              <option value="corporate faction">Corporate faction</option>
              <option value="military faction">Military faction</option>
              <option value="religious faction">Religious faction</option>
              <option value="separatist movement">Separatist movement</option>
              <option value="temporary alliance">Temporary alliance</option>
            </select>
          </label>
          <label>Context
            <select id="factionContext">
              <option value="">Auto from saved universe</option>
              ${suggestions.map(item => `<option value="${esc(item.collection)}:${esc(item.id)}">${esc(item.title)}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="action-row">
          <button class="primary-button" data-action="generate-faction" type="button">Generate Faction</button>
          <button class="ghost-button" data-action="generate-world-faction" type="button">Generate From Existing Context</button>
          <button class="ghost-button" data-action="create-manual-faction" type="button">Create Faction Manually</button>
          <button class="ghost-button" data-action="open-faction-seed" type="button">Load From Seed</button>
        </div>
      </div>
    </section>
    <section class="panel">
      <h2>Faction Summary</h2>
      <div class="metric-grid">
        ${metric("Total Factions", metrics.total || 0)}
        ${metric("Active", metrics.active || 0)}
        ${metric("Underground", metrics.underground || 0)}
        ${metric("Ruling", metrics.ruling || 0)}
        ${metric("Opposition", metrics.opposition || 0)}
        ${metric("Alliances", metrics.alliances || 0)}
        ${metric("Open Rivalries", metrics.rivalries || 0)}
        ${metric("Internal Schisms", metrics.schisms || 0)}
        ${metric("Leaderless", metrics.leaderless || 0)}
        ${metric("Unassigned Characters", metrics.unassignedCharacters || 0)}
        ${metric("Ideological Conflicts", metrics.ideologicalConflicts || 0)}
      </div>
    </section>
    <section class="panel">
      <h2>Suggested Generation</h2>
      <div class="entry-grid">${renderFactionSuggestions(suggestions)}</div>
    </section>
    <section class="panel">
      <h2>Saved Factions</h2>
      <div class="entry-grid">${renderFactionCards(applyFactionFilters(savedFactions, filters))}</div>
    </section>
    <section class="panel">
      <h2>Recent Factions</h2>
      <div class="entry-grid">${renderFactionCards([...savedFactions].sort((a, b) => new Date(b.updatedAt || b.savedAt) - new Date(a.updatedAt || a.savedAt)).slice(0, 4))}</div>
    </section>
    <section class="panel">
      <h2>Faction Networks</h2>
      <div class="entry-grid">
        ${networkCard("Internal factions detected in organizations", metrics.internalCandidates || 0, "Organizations with incidents, leadership, or departments that can generate internal caucuses.")}
        ${networkCard("Factions suggested by conflicts", metrics.conflictCandidates || 0, "Conflicts can produce reformers, hardliners, displaced groups, profiteer blocs, and peace movements.")}
        ${networkCard("Factions suggested by history", metrics.historyCandidates || 0, "Historical events can become founding grievances, myths, or schism points.")}
        ${networkCard("Unrepresented constituencies", metrics.unrepresented || 0, "Saved places and conflicts with social groups that have no factional voice yet.")}
        ${networkCard("Unstable coalitions", metrics.unstableCoalitions || 0, "Saved factions with fragile alliances or high schism risk.")}
        ${networkCard("Emerging warnings", metrics.emergingWarnings || 0, "Faction conditions likely to radicalize, fragment, or trigger backlash.")}
      </div>
    </section>
  `;
}

export function renderFactionCards(records = []) {
  if (!records.length) return `<div class="empty-state">No saved factions in this local archive yet.</div>`;
  return records.map(record => {
    const faction = record.faction || record.entity;
    return `
      <article class="entry-card faction-entry" style="--accent:${esc(faction.presentation?.accentColor || "var(--accent)")}">
        <div class="mini-faction" aria-hidden="true"><span></span><span></span><span></span></div>
        <div>
          <h3>${esc(faction.name || record.seed)}</h3>
          <p>${esc(faction.classification?.factionType || "faction")} / ${esc(faction.classification?.alignmentRole || "role unknown")} / ${esc(faction.classification?.visibility || "visibility unknown")}</p>
          <div class="meta-strip">
            <span class="badge">${esc(record.seed)}</span>
            ${record.favorite ? `<span class="badge">Favorite</span>` : ""}
          </div>
        </div>
        <button type="button" data-action="open-faction" data-seed="${esc(record.seed)}" aria-label="Open faction ${esc(record.seed)}"></button>
      </article>
    `;
  }).join("");
}

export function renderFactionSuggestions(suggestions = []) {
  if (!suggestions.length) return `<div class="empty-state">Save settlements, organizations, conflicts, documents, characters, or events to reveal context-grounded faction ideas.</div>`;
  return suggestions.slice(0, 16).map(item => `
    <article class="entry-card faction-entry">
      <div class="mini-faction" aria-hidden="true"><span></span><span></span><span></span></div>
      <div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.kind)} / ${esc(item.detail)}</p>
        <div class="meta-strip">
          <span class="badge">${esc(item.factionType)}</span>
          <span class="badge">${esc(item.seed)}</span>
        </div>
      </div>
      <button type="button" data-action="open-suggested-faction" data-collection="${esc(item.collection)}" data-id="${esc(item.id)}" data-seed="${esc(item.seed)}" data-faction-type="${esc(item.factionType)}" aria-label="Generate ${esc(item.title)}"></button>
    </article>
  `).join("");
}

export function renderFactionDossier(faction, activeTab, saved, favorite) {
  return `
    <section class="org-header faction-header" style="--accent:${esc(faction.presentation.accentColor)}">
      <div class="org-logo faction-seal">${factionSeal(faction)}</div>
      <div class="org-title">
        <p class="eyebrow">${esc(faction.classification.factionType)} / seed ${esc(faction.seed)}</p>
        <h1>${esc(faction.name)}</h1>
        <p class="lede">${esc(faction.summary)}</p>
        <div class="meta-strip">
          <span class="classification">${esc(faction.classification.alignmentRole)}</span>
          <span class="badge">${esc(faction.classification.visibility)}</span>
          <span class="badge">${esc(faction.classification.legalStatus)}</span>
          <span class="badge">${esc(faction.classification.scale)}</span>
        </div>
      </div>
      <div class="action-row">
        <button class="primary-button" data-action="save-faction" type="button">${saved ? "Saved" : "Save"}</button>
        <button class="ghost-button" data-action="favorite-faction" type="button">${favorite ? "Favorited" : "Favorite"}</button>
        <button class="ghost-button" data-action="regenerate-faction" type="button">Regenerate</button>
        <button class="ghost-button" data-action="generate-faction-conflict" type="button">Generate Conflict</button>
        <button class="ghost-button" data-action="generate-faction-document" type="button">Generate Document</button>
        <button class="ghost-button" data-action="export-faction-json" type="button">JSON</button>
        <button class="ghost-button" data-action="export-faction-md" type="button">Markdown</button>
      </div>
    </section>
    <nav class="tabs" aria-label="Faction dossier sections">
      ${FACTION_TABS.map(tab => `<button class="tab-button ${tab === activeTab ? "active" : ""}" data-action="faction-tab" data-tab="${tab}" type="button">${tab}</button>`).join("")}
    </nav>
    <section class="tab-panel">${renderFactionTab(faction, activeTab)}</section>
  `;
}

export function renderFactionTab(faction, tab) {
  const map = {
    Overview: renderOverview,
    Ideology: renderIdeology,
    Constituency: renderConstituency,
    Goals: renderGoals,
    Strategy: renderStrategy,
    Leadership: renderLeadership,
    Influence: renderInfluence,
    "Internal Blocs": renderInternalBlocs,
    Relations: renderRelations,
    History: renderHistory,
    Risks: renderRisks,
    Export: renderExport
  };
  return (map[tab] || renderOverview)(faction);
}

function renderOverview(faction) {
  return `
    <div class="split-layout">
      <section class="panel">
        <p class="eyebrow">Faction force profile</p>
        <h2>${esc(faction.shortName)}</h2>
        <p class="lede">${esc(faction.summary)}</p>
        <div class="metric-grid">
          ${metric("Members", faction.membership.estimatedMembers.value)}
          ${metric("Active Core", faction.membership.activeCore)}
          ${metric("Government", `${faction.influence.government}/100`)}
          ${metric("Labor", `${faction.influence.labor}/100`)}
          ${metric("Public Opinion", `${faction.influence.publicOpinion}/100`)}
          ${metric("Schism Risk", faction.internalDynamics.schismRisk)}
        </div>
      </section>
      <aside class="panel">
        <h2>Origin</h2>
        <article class="data-card">
          <p class="eyebrow">${esc(faction.origin.originPattern)} / ${esc(faction.origin.foundingDate.displayDate)}</p>
          <h3>${esc(faction.origin.placeOfOrigin)}</h3>
          <p>${esc(faction.origin.originalGrievance)}</p>
          <p><strong>Authority response:</strong> ${esc(faction.origin.initialResponseFromAuthorities)}</p>
        </article>
      </aside>
    </div>
    <section class="panel">
      <h2>Identity</h2>
      <div class="entry-grid">
        ${card("Slogan", faction.slogan)}
        ${card("Public Image", faction.identity.publicImage)}
        ${card("Self Image", faction.identity.selfImage)}
        ${card("Symbol", faction.identity.symbols.join(", "))}
      </div>
    </section>
  `;
}

function renderIdeology(faction) {
  return `<section class="panel"><h2>Ideological Core</h2><div class="entry-grid">
    ${card("Core Belief", faction.ideology.coreDoctrine)}
    ${card("Diagnosis", faction.ideology.diagnosis)}
    ${card("Preferred Future", faction.ideology.preferredFuture)}
    ${card("Theory of Change", faction.ideology.theoryOfChange)}
    ${card("Red Line", faction.ideology.redLine)}
    ${card("Contradiction", faction.ideology.contradictions.join(" "))}
  </div></section>
  <section class="panel"><h2>Positions</h2><div class="entry-grid">
    ${positionCards(faction.ideology.politicalPositions)}
    ${positionCards(faction.ideology.economicPositions)}
    ${positionCards(faction.ideology.institutionalPositions)}
    ${positionCards(faction.ideology.technologicalPositions)}
    ${positionCards(faction.ideology.environmentalPositions)}
    ${positionCards(faction.ideology.culturalPositions)}
  </div></section>
  <section class="panel"><h2>Radicalism and Moderation</h2><div class="metric-grid">${Object.entries(faction.ideology.radicalism).map(([label, value]) => metric(titleCase(label.replace(/([A-Z])/g, " $1")), value)).join("")}</div></section>`;
}

function renderConstituency(faction) {
  return `<section class="panel"><h2>Constituency</h2><div class="entry-grid">
    ${listCard("Claims To Represent", faction.constituency.claimed)}
    ${listCard("Actual Base", faction.constituency.actualBase)}
    ${listCard("Strongest Supporters", faction.constituency.strongestSupporters)}
    ${listCard("Weak Supporters", faction.constituency.weakSupporters)}
    ${listCard("Skeptical Members", faction.constituency.skepticalConstituencyMembers)}
    ${listCard("Excluded Groups", faction.constituency.groupsExcluded)}
    ${listCard("Unintentionally Harmed", faction.constituency.groupsUnintentionallyHarmed)}
    ${listCard("Concentrations", faction.constituency.geographicConcentrations)}
  </div></section>
  <section class="panel"><h2>Membership Experience</h2><p class="lede">${esc(faction.membership.ordinaryExperience)}</p><div class="entry-grid">
    ${card("Structure", faction.membership.structure)}
    ${card("Trend", faction.membership.membershipTrends)}
    ${listCard("Obligations", faction.membership.memberObligations)}
    ${listCard("Exit Consequences", faction.membership.exitConsequences)}
  </div></section>`;
}

function renderGoals(faction) {
  return `<section class="panel"><h2>Goal Layers</h2><div class="entry-list">${Object.entries(faction.goals).map(([layer, goals]) => `
    <article class="data-card">
      <p class="eyebrow">${esc(titleCase(layer.replace(/([A-Z])/g, " $1")))}</p>
      ${goals.map(goal => `<h3>${esc(goal.description)}</h3><p>${esc(goal.priority)} priority / ${esc(goal.timeHorizon)} / ${esc(goal.visibility)}. Success: ${esc(goal.successConditions)}. Compromise: ${esc(goal.compromisesAccepted)}.</p>`).join("")}
    </article>
  `).join("")}</div></section>
  <section class="panel"><h2>Goal Compatibility</h2><div class="entry-grid">${faction.strategy.goalCompatibility.map(item => `<article class="data-card"><p class="eyebrow">${esc(item.compatibility)}</p><h3>${esc(item.goalId)}</h3><p>${esc(item.note)}</p></article>`).join("")}</div></section>`;
}

function renderStrategy(faction) {
  return `<section class="panel"><h2>Strategy and Methods</h2><div class="entry-grid">
    ${card("Primary Strategy", faction.strategy.primaryStrategy)}
    ${card("Theory Of Change", faction.strategy.theoryOfChange)}
    ${listCard("Preferred Methods", faction.strategy.preferredMethods)}
    ${listCard("Tolerated Methods", faction.strategy.toleratedMethods)}
    ${listCard("Disputed Methods", faction.strategy.disputedMethods)}
    ${listCard("Forbidden Methods", faction.strategy.forbiddenMethods)}
    ${listCard("Secretly Used", faction.strategy.secretlyUsedMethods)}
    ${listCard("Splinter Methods", faction.strategy.splinterMethods)}
  </div></section>
  <section class="panel"><h2>Recruitment</h2><p class="lede">${esc(faction.recruitment.recruitmentMessage)}</p><div class="entry-grid">
    ${listCard("Targets", faction.recruitment.targetRecruits)}
    ${card("Entry Path", faction.recruitment.entryPath)}
    ${card("Vetting", faction.recruitment.vetting)}
    ${listCard("Incentives", faction.recruitment.incentives)}
    ${listCard("Barriers", faction.recruitment.barriers)}
    ${listCard("Retention Problems", faction.recruitment.retentionProblems)}
  </div></section>`;
}

function renderLeadership(faction) {
  return `<section class="panel"><h2>Formal and Actual Leadership</h2><div class="entry-grid">
    ${card("Model", faction.leadership.leadershipModel)}
    ${listCard("Official Leaders", faction.leadership.officialLeaderIds)}
    ${listCard("Actual Power Holders", faction.leadership.actualPowerHolderIds)}
    ${card("Ideological Authority", faction.leadership.ideologicalAuthority)}
    ${card("Financial Controller", faction.leadership.financialController)}
    ${card("Hidden Patron", faction.leadership.hiddenPatron)}
    ${card("Succession", `${faction.leadership.successionModel}; ${faction.leadership.successionStability}`)}
  </div></section>
  <section class="panel"><h2>Culture</h2><div class="entry-grid">
    ${card("Meeting Style", faction.culture.meetingStyle)}
    ${listCard("Rituals", faction.culture.rituals)}
    ${card("Visual Markers", faction.culture.visualMarkers)}
    ${card("Discipline", faction.culture.disciplineTexture)}
  </div></section>`;
}

function renderInfluence(faction) {
  const influence = { ...faction.influence };
  const methods = influence.methods || [];
  delete influence.methods;
  return `<section class="panel"><h2>Institutional Influence</h2><div class="bar-list">${Object.entries(influence).map(([label, value]) => `
    <div class="bar-row mini-bar"><span>${esc(titleCase(label))}</span><div><i style="width:${Number(value)}%"></i></div><strong>${Number(value)}</strong></div>
  `).join("")}</div></section>
  <section class="panel"><h2>Resources</h2><div class="entry-grid">${faction.resources.map(resource => `<article class="data-card">
    <p class="eyebrow">${esc(resource.visibility)} / ${esc(resource.reliability)}</p>
    <h3>${esc(resource.type)}</h3>
    <p>Source: ${esc(resource.source)}. Dependency: ${esc(resource.dependency)}. Vulnerability: ${esc(resource.vulnerability)}.</p>
  </article>`).join("")}</div></section>
  <section class="panel"><h2>Influence Methods</h2>${list(methods)}</section>
  <section class="panel"><h2>Strongholds</h2><div class="entry-grid">
    ${card("Core Stronghold", faction.territory.coreStronghold)}
    ${listCard("Secondary Strongholds", faction.territory.secondaryStrongholds)}
    ${listCard("Contested Areas", faction.territory.contestedAreas)}
    ${listCard("Symbolic Territories", faction.territory.symbolicTerritories)}
    ${listCard("Hidden Bases", faction.territory.hiddenBases)}
  </div></section>`;
}

function renderInternalBlocs(faction) {
  return `<section class="panel"><h2>Internal Structure</h2><div class="entry-grid">
    ${card("Decision Making", faction.internalDynamics.decisionMaking)}
    ${card("Communication Flow", faction.internalDynamics.communicationFlow)}
    ${card("Local Autonomy", faction.internalDynamics.localAutonomy)}
    ${card("Dispute Process", faction.internalDynamics.disputeProcess)}
    ${card("Schism Risk", faction.internalDynamics.schismRisk)}
    ${listCard("Disputes", faction.internalDynamics.disputes)}
  </div></section>
  <section class="panel"><h2>Internal Blocs</h2><div class="entry-grid">${faction.internalDynamics.blocs.map(bloc => `
    <article class="data-card faction-bloc">
      <p class="eyebrow">${esc(bloc.supportShare)} / ${esc(bloc.relationshipToLeadership)}</p>
      <h3>${esc(bloc.name)}</h3>
      <p>${esc(bloc.summary)}</p>
      <p><strong>Methods:</strong> ${esc(bloc.preferredMethods.join(", "))}</p>
      <p><strong>Split risk:</strong> ${esc(bloc.splitRisk)}</p>
    </article>
  `).join("")}</div></section>`;
}

function renderRelations(faction) {
  return `<section class="panel"><h2>Faction Relations</h2><div class="entry-grid">${faction.externalRelations.factions.map(rel => relationCard(rel)).join("")}</div></section>
  <section class="panel"><h2>Organization Relations</h2><div class="entry-grid">${faction.externalRelations.organizations.map(rel => relationCard(rel)).join("") || `<div class="empty-state">No organization relations in this dossier yet.</div>`}</div></section>
  <section class="panel"><h2>Government and Conflicts</h2><div class="entry-grid">
    ${card("Government", `${faction.externalRelations.government.relationship}. ${faction.externalRelations.government.notes}`)}
    ${faction.externalRelations.conflicts.map(item => card(`Conflict ${item.conflictId}`, `${item.role}: ${item.stance}`)).join("")}
  </div></section>`;
}

function renderHistory(faction) {
  return `<section class="panel"><h2>Historical Development</h2><div class="timeline-ribbon">${faction.historicalDevelopment.events.map(event => `
    <article class="timeline-event-card">
      <div class="timeline-date">${esc(event.year)}</div>
      <div>
        <p class="eyebrow">${esc(event.promotionStatus)}</p>
        <h3>${esc(event.title)}</h3>
        <p>${esc(event.summary)}</p>
        <div class="meta-strip"><span class="badge">${esc(event.seed)}</span></div>
      </div>
    </article>
  `).join("")}</div></section>
  <section class="panel"><h2>Timeline Links</h2><div class="entry-grid">
    ${faction.historicalDevelopment.historicalEventRelationships.map(item => card(item.relationshipType, item.eventId)).join("") || `<div class="empty-state">No historical-event source was supplied.</div>`}
    ${faction.historicalDevelopment.documentInfluences.map(item => card("Document Influence", `${item.documentId}: ${item.role}`)).join("")}
  </div></section>`;
}

function renderRisks(faction) {
  return `<section class="panel"><h2>Vulnerabilities</h2><div class="entry-grid">
    ${Object.entries(faction.vulnerabilities).map(([label, value]) => card(titleCase(label), value)).join("")}
  </div></section>
  <section class="panel"><h2>Future Pressures</h2><div class="entry-grid">
    ${card("Radicalize If", faction.futurePressures.radicalizeIf)}
    ${card("Moderate If", faction.futurePressures.moderateIf)}
    ${card("Fragment If", faction.futurePressures.fragmentIf)}
    ${card("Collapse If", faction.futurePressures.collapseIf)}
    ${card("Likely Next Move", faction.futurePressures.likelyNextMove)}
    ${listCard("Conflict Hooks", faction.futurePressures.conflictHooks)}
  </div></section>`;
}

function renderExport(faction) {
  return `<section class="panel"><h2>Export Faction</h2><div class="card-grid">
    <button class="document-card" data-action="export-faction-json" type="button"><h3>Complete JSON</h3><p>Structured faction entity.</p></button>
    <button class="document-card" data-action="export-faction-md" type="button"><h3>Markdown Dossier</h3><p>Readable faction brief.</p></button>
  </div><pre class="code-block">${esc(factionMarkdown(faction))}</pre></section>`;
}

function applyFactionFilters(records, filters) {
  return records.filter(record => {
    const faction = record.faction || record.entity;
    if (!faction) return false;
    if (filters.ideology && !JSON.stringify(faction.ideology).toLowerCase().includes(filters.ideology.toLowerCase())) return false;
    if (filters.settlement && !faction.settlementIds?.includes(filters.settlement)) return false;
    if (filters.organization && !faction.organizationIds?.includes(filters.organization)) return false;
    return true;
  });
}

function factionSeal(faction) {
  const initials = faction.identity.abbreviation || faction.shortName.slice(0, 3).toUpperCase();
  return `<svg viewBox="0 0 144 144" role="img" aria-label="${esc(faction.name)} faction seal">
    <path d="M24 112V32l48-16 48 16v80l-48 16-48-16Z" fill="transparent" stroke="var(--accent)" stroke-width="7"/>
    <path d="M42 78h60M42 58h60M42 98h60" stroke="var(--accent-2)" stroke-width="5"/>
    <text x="72" y="82" text-anchor="middle" fill="var(--text)" font-family="Arial, sans-serif" font-size="22" font-weight="700">${esc(initials.slice(0, 4))}</text>
  </svg>`;
}

function relationCard(rel) {
  return `<article class="relation-card network-node">
    <p class="eyebrow">${esc(rel.publicRelationship)} / ${esc(rel.privateRelationship || "")}</p>
    <h3>${esc(rel.name || rel.entityId)}</h3>
    <p>${esc(rel.cause || "")}</p>
    <p><strong>Strength:</strong> ${esc(rel.strength || "unknown")} ${rel.disputedIssues?.length ? `/ ${esc(rel.disputedIssues.join(", "))}` : ""}</p>
  </article>`;
}

function metric(label, value) {
  return `<article class="data-card"><span class="meta-label">${esc(label)}</span><strong>${typeof value === "number" ? formatNumber(value) : esc(value)}</strong></article>`;
}

function networkCard(title, value, text) {
  return `<article class="data-card"><span class="meta-label">${esc(title)}</span><strong>${formatNumber(value)}</strong><p>${esc(text)}</p></article>`;
}

function card(title, text) {
  return `<article class="data-card"><p class="eyebrow">${esc(title)}</p><h3>${esc(text || "None recorded")}</h3></article>`;
}

function listCard(title, items = []) {
  return `<article class="data-card"><p class="eyebrow">${esc(title)}</p>${list(items)}</article>`;
}

function list(items = []) {
  if (!items?.length) return `<p>No entries recorded.</p>`;
  return `<ul>${items.map(item => `<li>${esc(item)}</li>`).join("")}</ul>`;
}

function positionCards(positions = {}) {
  return Object.entries(positions).map(([label, value]) => card(titleCase(label), value)).join("");
}
