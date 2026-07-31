import { esc, formatNumber, titleCase } from "../../shared/dom.js";
import { renderMetricBars } from "../../shared/metrics.js";
import { fitText } from "../../shared/svg.js";
import { overviewText, settlementMarkdown } from "./generate.js";

const SETTLEMENT_TABS = ["Overview", "Map", "Districts", "Population", "Government", "Economy", "Infrastructure", "Culture", "Transit", "Housing", "Security", "Environment", "History", "Tensions", "Story Hooks", "Network"];

export { SETTLEMENT_TABS, settlementMarkdown };

export function renderSettlementsHome(savedSettlements = [], availableSummaries = []) {
  return `
    <section class="module-hero">
      <div>
        <p class="eyebrow">Colonial Settlement Archive</p>
        <h1>Settlements</h1>
        <p class="lede">Generate detailed places where people live, work, govern, trade, struggle, and build communities inside the systems created by the Stellar Cartography Archive.</p>
      </div>
      <div class="search-board">
        <div class="field-grid">
          <label>Seed
            <input id="settlementSeedInput" type="text" placeholder="port-meridian-4821">
          </label>
          <label>Settlement scale
            <select id="settlementScale">
              <option value="random">Random</option>
              <option value="remote-site">Remote Site</option>
              <option value="outpost">Outpost</option>
              <option value="small-colony">Small Colony</option>
              <option value="regional-settlement">Regional Settlement</option>
              <option value="major-city">Major City or Habitat</option>
              <option value="megacity">Megacity or Habitat Complex</option>
            </select>
          </label>
          <label>Settlement type
            <select id="settlementType">
              <option value="random">Random</option>
              <option>port city</option>
              <option>mining settlement</option>
              <option>research colony</option>
              <option>orbital habitat</option>
              <option>trade station</option>
              <option>shipyard settlement</option>
              <option>company town</option>
              <option>refugee settlement</option>
            </select>
          </label>
          <label>Overall tone
            <select id="settlementTone">
              <option value="random">Random</option>
              <option>frontier</option>
              <option>civic</option>
              <option>strained</option>
              <option>prosperous</option>
              <option>austere</option>
              <option>cosmopolitan</option>
              <option>controlled</option>
            </select>
          </label>
        </div>
        <div class="action-row">
          <button class="primary-button" data-action="generate-settlement" type="button">Generate Settlement</button>
          <button class="ghost-button" data-action="open-settlement-seed" type="button">Load From Seed</button>
        </div>
      </div>
    </section>
    <section class="panel">
      <h2>Available for Expansion</h2>
      <div class="entry-grid">${renderAvailableSummaries(availableSummaries)}</div>
    </section>
    <section class="panel">
      <h2>Saved Settlements</h2>
      <div class="entry-grid">${renderSettlementCards(savedSettlements)}</div>
    </section>
    <section class="panel">
      <h2>Example Settlements</h2>
      <div class="entry-grid">${renderSettlementCards([], true)}</div>
    </section>
  `;
}

export function renderAvailableSummaries(items) {
  if (!items.length) return `<div class="empty-state">Save a stellar system with settlement summaries, then expand them here.</div>`;
  return items.map(item => `
    <article class="entry-card settlement-entry">
      <div class="mini-district" aria-hidden="true"><span></span><span></span><span></span></div>
      <div>
        <h3>${esc(item.summary.name)}</h3>
        <p>${esc(item.system.name)} / ${esc(item.summary.location)} / ${esc(item.summary.type)}</p>
        <p>${formatNumber(item.summary.population)} residents / ${esc(item.summary.governingAuthority)} / ${esc(item.summary.economicRole)}</p>
        <div class="meta-strip">
          <span class="badge">${item.summary.promotionStatus === "promoted" ? "Promoted" : "Summary"}</span>
          <span class="badge">${esc(item.summary.seed)}</span>
        </div>
      </div>
      <button type="button" data-action="expand-summary-settlement" data-system-seed="${esc(item.system.seed)}" data-summary-id="${esc(item.summary.id)}" aria-label="Expand ${esc(item.summary.name)}"></button>
    </article>
  `).join("");
}

export function renderSettlementCards(records, examples = false) {
  const items = examples ? ["port-meridian-4821", "low-harbor-civic", "unity-cylinder"].map(seed => ({ seed, settlement: null })) : records;
  if (!items.length) return `<div class="empty-state">No saved settlements in this local archive yet.</div>`;
  return items.map(item => {
    const settlement = item.settlement || item.entity;
    return `
      <article class="entry-card settlement-entry">
        <div class="mini-district" aria-hidden="true"><span></span><span></span><span></span></div>
        <div>
          <h3>${settlement ? esc(settlement.name) : esc(item.seed)}</h3>
          <p>${settlement ? `${esc(settlement.classification.settlementType)} / ${settlement.population.display}` : "Example seed"}</p>
          <div class="meta-strip">
            <span class="badge">${esc(item.seed)}</span>
            ${item.favorite ? `<span class="badge">Favorite</span>` : ""}
          </div>
        </div>
        <button type="button" data-action="open-settlement" data-seed="${esc(item.seed)}" aria-label="Open settlement ${esc(item.seed)}"></button>
      </article>
    `;
  }).join("");
}

export function renderSettlementDossier(settlement, activeTab, saved, favorite, savedSystems = []) {
  return `
    <section class="org-header settlement-header">
      <div class="org-logo settlement-seal">${renderSettlementEmblem(settlement)}</div>
      <div class="org-title">
        <p class="eyebrow">${esc(settlement.designation)} / seed ${esc(settlement.seed)}</p>
        <h1>${esc(settlement.name)}</h1>
        <div class="meta-strip">
          <span class="classification">${esc(settlement.classification.settlementType)}</span>
          <span class="badge">${esc(settlement.localNickname)}</span>
          <span class="badge">${settlement.population.display}</span>
          <span class="badge">${esc(settlement.location.systemName)}</span>
          <span class="badge">Founded ${settlement.founding.year}</span>
        </div>
      </div>
      <div class="action-row">
        <button class="primary-button" data-action="save-settlement" type="button">${saved ? "Saved" : "Save"}</button>
        <button class="ghost-button" data-action="favorite-settlement" type="button">${favorite ? "Favorited" : "Favorite"}</button>
        <button class="ghost-button" data-action="regenerate-settlement" type="button">Regenerate</button>
        <button class="ghost-button" data-action="attach-settlement" type="button" ${savedSystems.length ? "" : "disabled"}>Attach to Existing System</button>
        <button class="ghost-button" data-action="export-settlement-json" type="button">JSON</button>
        <button class="ghost-button" data-action="export-settlement-md" type="button">Markdown</button>
      </div>
    </section>
    <nav class="tabs" aria-label="Settlement dossier sections">
      ${SETTLEMENT_TABS.map(tab => `<button class="tab-button ${tab === activeTab ? "active" : ""}" data-action="settlement-tab" data-tab="${tab}" type="button">${tab}</button>`).join("")}
    </nav>
    <section class="tab-panel">${renderSettlementTab(settlement, activeTab)}</section>
  `;
}

export function renderSettlementTab(settlement, tab) {
  const map = {
    Overview: renderOverview,
    Map: renderMapTab,
    Districts: renderDistricts,
    Population: renderPopulation,
    Government: renderGovernment,
    Economy: renderEconomy,
    Infrastructure: renderInfrastructure,
    Culture: renderCulture,
    Transit: renderTransit,
    Housing: renderHousing,
    Security: renderSecurity,
    Environment: renderEnvironment,
    History: renderHistory,
    Tensions: renderTensions,
    "Story Hooks": renderStoryHooks,
    Network: renderNetwork
  };
  return (map[tab] || renderOverview)(settlement);
}

export function settlementMapSvg(settlement) {
  const districts = settlement.districts;
  const accent = esc(settlement.presentation.accentColor);
  const ring = settlement.presentation.mapStyle === "ring-habitat";
  const nodes = districts.map((district, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(1, districts.length);
    const radius = ring ? 118 : 55 + (index % 3) * 38;
    const w = ring ? 108 : 138;
    const h = ring ? 42 : 54;
    return {
      district,
      // Ring nodes are centred on their point; grid nodes anchor top-left.
      x: ring ? 350 + Math.cos(angle) * radius - w / 2 : 40 + (index % 4) * 160,
      y: ring ? 180 + Math.sin(angle) * radius - h / 2 : 70 + Math.floor(index / 4) * 88,
      w,
      h
    };
  });
  const pad = 8;
  const labelWidth = node => node.w - pad * 2;
  return `<svg class="system-map settlement-map" viewBox="0 0 700 360" role="img" aria-label="District map of ${esc(settlement.name)}. ${esc(districts.map(district => district.name).join(", "))}">
    <rect x="18" y="18" width="664" height="324" fill="rgba(255,255,255,.018)" stroke="rgba(255,255,255,.14)"/>
    ${ring ? `<circle cx="350" cy="180" r="132" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="18"/><circle cx="350" cy="180" r="36" fill="${accent}" opacity=".7"/>` : ""}
    ${nodes.slice(1).map(node => `<line x1="${nodes[0].x + nodes[0].w / 2}" y1="${nodes[0].y + nodes[0].h / 2}" x2="${node.x + node.w / 2}" y2="${node.y + node.h / 2}" stroke="rgba(255,255,255,.14)"/>`).join("")}
    ${nodes.map((node, index) => `<g class="district-node" tabindex="0">
      <rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" fill="${index === 0 ? accent : "rgba(255,255,255,.07)"}" stroke="${accent}" opacity="${index === 0 ? ".85" : "1"}"/>
      <text x="${node.x + pad}" y="${node.y + 20}" fill="#f2eee6" font-size="11">${esc(fitText(node.district.name, labelWidth(node), 11))}</text>
      <text x="${node.x + pad}" y="${node.y + 36}" fill="#a7adb0" font-size="9">${esc(fitText(node.district.districtType.replace(/-/g, " "), labelWidth(node), 9))}</text>
      <title>${esc(node.district.name)}: ${esc(node.district.localProblem)}</title>
    </g>`).join("")}
    ${settlement.environment.hazards.slice(0, 3).map((hazard, index) => `<circle cx="${648 - index * 34}" cy="${44 + index * 34}" r="11" fill="#d86a5d" opacity=".55"><title>${esc(hazard.name)}</title></circle>`).join("")}
  </svg>`;
}

function renderOverview(settlement) {
  return `
    <div class="split-layout">
      <section class="panel">
        <p class="eyebrow">Settlement synopsis</p>
        <h2>${esc(settlement.classification.developmentLevel.replace(/-/g, " "))}</h2>
        <p class="lede">${esc(overviewText(settlement))}</p>
        ${renderMetricBars(settlement.metrics)}
      </section>
      <aside class="panel">
        <h2>At a Glance</h2>
        <dl class="fact-list">
          <div><dt>Settlement type</dt><dd>${esc(titleCase(settlement.classification.settlementType.replace(/-/g, " ")))}</dd></div>
          <div><dt>Population</dt><dd>${formatNumber(settlement.population.permanent)}</dd></div>
          <div><dt>Government</dt><dd>${esc(titleCase(settlement.government.structure.replace(/-/g, " ")))}</dd></div>
          <div><dt>Legal status</dt><dd>${esc(titleCase(settlement.classification.legalStatus.replace(/-/g, " ")))}</dd></div>
          <div><dt>Founded</dt><dd>${esc(String(settlement.founding.year))}</dd></div>
          <div><dt>Districts</dt><dd>${settlement.districts.length}</dd></div>
        </dl>
      </aside>
    </div>
    <section class="panel map-panel">
      <div class="panel-head">
        <h2>Civic Map</h2>
        <p class="meta-label">${settlement.districts.length} districts &middot; ${esc(settlement.presentation.mapStyle.replace(/-/g, " "))}</p>
      </div>
      ${settlementMapSvg(settlement)}
    </section>
  `;
}

function renderMapTab(settlement) {
  return `<div class="split-layout">
    <section class="panel">
      <h2>District Schematic</h2>
      ${settlementMapSvg(settlement)}
      <div class="action-row" style="margin-top:1rem">
        <button class="ghost-button" data-action="export-settlement-map-svg" type="button">Export Map SVG</button>
      </div>
    </section>
    <aside class="panel">
      <h2>Accessible District List</h2>
      ${settlement.districts.map(district => `<article class="data-card"><h3>${esc(district.name)}</h3><p>${esc(district.districtType)}. ${esc(district.localProblem)}</p></article>`).join("")}
    </aside>
  </div>`;
}

function renderDistricts(settlement) {
  return `<section class="panel"><h2>Major Districts</h2><div class="card-grid">${settlement.districts.map(district => `
    <article class="location-card">
      <p class="eyebrow">${esc(district.districtType)} / ${esc(district.wealthLevel)}</p>
      <h3>${esc(district.name)}</h3>
      <p>${formatNumber(district.population)} residents. ${esc(district.currentPurpose)}.</p>
      <p><strong>Architecture:</strong> ${esc(district.architecturalStyle)} / <strong>Authority:</strong> ${esc(district.controllingAuthority)}</p>
      <p>${esc(district.atmosphere)}. Problem: ${esc(district.localProblem)}.</p>
      <p class="eyebrow">${district.sensoryDetails.map(esc).join(" / ")}</p>
    </article>
  `).join("")}</div></section>`;
}

function renderPopulation(settlement) {
  return `<div class="split-layout"><section class="panel"><h2>Population</h2><div class="metric-grid">
    ${Object.entries({
      "Permanent residents": settlement.population.display,
      "Transient population": formatNumber(settlement.population.transient),
      "Density": settlement.population.density,
      "Growth trend": settlement.population.growthTrend,
      "Age distribution": settlement.population.ageDistribution,
      "Migration pattern": settlement.population.migrationPattern
    }).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(key)}</span><p>${esc(value)}</p></article>`).join("")}
  </div></section><aside class="panel"><h2>Major Communities</h2>${settlement.population.majorCommunities.map(group => `<article class="data-card"><h3>${esc(group.name)} / ${group.share}%</h3><p>${esc(group.origin)}. Work: ${esc(group.occupations)}. Concern: ${esc(group.concerns)}.</p></article>`).join("")}</aside></div>`;
}

function renderGovernment(settlement) {
  const gov = settlement.government;
  return `<div class="split-layout"><section class="panel"><h2>${esc(gov.officialName)}</h2><div class="metric-grid">
    ${Object.entries({
      Structure: gov.structure,
      Executive: gov.executiveRole,
      "Decision body": gov.decisionBody,
      "Selection method": gov.selectionMethod,
      Legitimacy: gov.legalLegitimacy,
      "Public approval": `${gov.publicApproval}/100`,
      Corruption: gov.corruptionLevel,
      "Policy priority": gov.currentPolicyPriority
    }).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(key)}</span><p>${esc(value)}</p></article>`).join("")}
  </div></section><aside class="panel"><h2>Local Law</h2>${gov.notableLaws.map(law => `<article class="data-card"><h3>${esc(law.name)}</h3><p>${esc(law.effect)}</p><p class="eyebrow">${esc(law.publicReaction)}</p><button class="ghost-button" data-action="expand-settlement-law-document" data-law-id="${esc(law.id || law.name)}" type="button">${law.promotionStatus === "promoted" ? "Open Full Document" : "Expand Into Full Document"}</button></article>`).join("")}</aside></div>`;
}

function renderEconomy(settlement) {
  const econ = settlement.economy;
  return `<section class="panel"><h2>Economy</h2><div class="metric-grid">
    ${Object.entries({
      "Primary industries": econ.primaryIndustries.join(" / "),
      "Secondary industries": econ.secondaryIndustries.join(" / "),
      "Largest employers": econ.largestEmployers.join(" / "),
      "Major exports": econ.majorExports.join(" / "),
      "Major imports": econ.majorImports.join(" / "),
      "Payment system": econ.paymentSystem,
      "Employment conditions": econ.employmentConditions,
      "Informal economy": econ.informalEconomy,
      "Cost of living": econ.costOfLiving,
      "Vulnerability": econ.economicVulnerability,
      "Recent change": econ.recentChange
    }).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(key)}</span><p>${esc(value)}</p></article>`).join("")}
  </div></section>`;
}

function renderInfrastructure(settlement) {
  return `<section class="panel"><h2>Utilities and Life Support</h2><div class="card-grid">${settlement.infrastructure.utilities.map(utility => `
    <article class="product-card">
      <p class="eyebrow">${esc(utility.capacity)} / ${esc(utility.reliability)}</p>
      <h3>${esc(utility.name)}</h3>
      <p>Provider: ${esc(utility.provider)}. Source: ${esc(utility.source)}.</p>
      <p><strong>Redundancy:</strong> ${esc(utility.redundancy)} / <strong>Inequality:</strong> ${esc(utility.accessInequality)}</p>
      <p>Weakness: ${esc(utility.knownWeakness)}. Recent incident: ${esc(utility.recentIncident)}.</p>
    </article>`).join("")}</div></section>`;
}

function renderCulture(settlement) {
  const culture = settlement.culture;
  return `<div class="split-layout"><section class="panel"><h2>Culture and Daily Life</h2><div class="metric-grid">
    ${Object.entries({
      Values: culture.publicValues.join(" / "),
      Identity: culture.localIdentity,
      Languages: culture.languages.join(" / "),
      Etiquette: culture.etiquette,
      "Work rhythms": culture.workRhythms,
      Leisure: culture.leisure,
      Fashion: culture.fashion,
      Holidays: culture.holidays.join(" / "),
      Complaint: culture.commonComplaint,
      Pride: culture.civicPride
    }).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(key)}</span><p>${esc(value)}</p></article>`).join("")}
  </div></section><aside class="panel"><h2>Local Terms</h2>${culture.slang.map(term => `<article class="data-card"><h3>${esc(term.phrase)}</h3><p>${esc(term.meaning)} Origin: ${esc(term.origin)}.</p><p>${esc(term.example)}</p></article>`).join("")}</aside></div>`;
}

function renderTransit(settlement) {
  const transit = settlement.transit;
  return `<section class="panel"><h2>Local Transit</h2><div class="metric-grid">
    ${Object.entries(transit).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(titleCase(key.replace(/([A-Z])/g, " $1")))}</span><p>${Array.isArray(value) ? value.map(esc).join(" / ") : esc(value)}</p></article>`).join("")}
  </div></section>`;
}

function renderHousing(settlement) {
  return `<section class="panel"><h2>Housing</h2><div class="metric-grid">
    ${Object.entries(settlement.housing).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(titleCase(key.replace(/([A-Z])/g, " $1")))}</span><p>${Array.isArray(value) ? value.map(esc).join(" / ") : esc(value)}</p></article>`).join("")}
  </div></section>`;
}

function renderSecurity(settlement) {
  return `<section class="panel"><h2>Security and Crime</h2><div class="metric-grid">
    ${Object.entries(settlement.security).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(titleCase(key.replace(/([A-Z])/g, " $1")))}</span><p>${Array.isArray(value) ? value.map(esc).join(" / ") : esc(value)}</p></article>`).join("")}
  </div></section>`;
}

function renderEnvironment(settlement) {
  const env = settlement.environment;
  return `<div class="split-layout"><section class="panel"><h2>Environmental Context</h2><div class="metric-grid">
    ${Object.entries({
      Environment: env.environmentType,
      "Pressure architecture": env.architecturePressure,
      Clothing: env.clothing,
      Food: env.foodConstraints,
      Procedures: env.emergencyProcedures,
      "Public space": env.publicSpace
    }).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(key)}</span><p>${esc(value)}</p></article>`).join("")}
  </div></section><aside class="panel"><h2>Environmental Risks</h2>${env.hazards.map(hazard => `<article class="incident-card"><h3>${esc(hazard.name)}</h3><p>${esc(hazard.affectedDistricts.join(" / "))}. Severity: ${esc(hazard.severity)}. ${esc(hazard.mitigation)}.</p><p>Confidence: ${esc(hazard.publicConfidence)} / ${esc(hazard.recentEvent)}</p></article>`).join("")}</aside></div>`;
}

function renderHistory(settlement) {
  return `<section class="panel"><h2>Settlement Timeline</h2><div class="timeline">${settlement.history.map(item => `
    <article class="timeline-item">
      <div><strong class="timeline-year">${item.year}</strong><span class="badge">${esc(item.status)}</span></div>
      <div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><p class="eyebrow">${esc(item.lastingConsequence)} / ${esc(item.affectedDistricts.join(" / "))}</p></div>
    </article>
  `).join("")}</div></section>`;
}

function renderTensions(settlement) {
  return `<section class="panel"><h2>Current Tensions</h2><div class="card-grid">${settlement.tensions.map(tension => `
    <article class="incident-card">
      <p class="eyebrow">${esc(tension.escalationRisk)} risk / ${esc(tension.currentStatus)}</p>
      <h3>${esc(tension.name)}</h3>
      <p>${esc(tension.parties.join(" versus "))}. Root cause: ${esc(tension.rootCause)}.</p>
      <p><strong>Public narrative:</strong> ${esc(tension.publicNarrative)} / <strong>Hidden pressure:</strong> ${esc(tension.hiddenPressure)}</p>
      <p>${esc(tension.affectedDistricts.join(" / "))}. Outcomes: ${esc(tension.possibleOutcomes.join(" / "))}.</p>
      <button class="ghost-button" data-action="expand-settlement-tension" data-tension-id="${esc(tension.id || tension.name)}" type="button">${tension.promotionStatus === "promoted" ? "Open Full Conflict" : "Expand Into Full Conflict"}</button>
    </article>`).join("")}</div></section>`;
}

function renderStoryHooks(settlement) {
  return `<section class="panel"><h2>Story Hooks</h2><div class="card-grid">${settlement.storyHooks.map(hook => `
    <article class="product-card">
      <p class="eyebrow">${esc(hook.usefulFor)}</p>
      <h3>${esc(hook.premise)}</h3>
      <p>${esc(hook.complication)}</p>
    </article>`).join("")}</div></section>`;
}

function renderNetwork(settlement) {
  return `<section class="panel"><h2>Connected Archive</h2><div class="card-grid">
    ${settlement.organizations.map(org => `<article class="relation-card network-node"><p class="eyebrow">${esc(org.role)} / ${esc(org.influence)}</p><h3>${esc(org.name)}</h3><p>${esc(org.industry)}. ${esc(org.localRelationship)}. Reputation: ${esc(org.publicReputation)}.</p><button class="ghost-button" data-action="open-settlement-organization" data-seed="${esc(org.seed)}" data-name="${esc(org.name)}" type="button">Open in Corporate Registry</button></article>`).join("")}
    ${settlement.relationships.filter(rel => rel.toEntityType === "star-system").map(rel => `<article class="relation-card"><p class="eyebrow">${esc(rel.relationshipType)}</p><h3>${esc(rel.label)}</h3><button class="ghost-button" data-action="open-system" data-seed="${esc(rel.toEntityId)}" type="button">Open Related System</button></article>`).join("")}
  </div></section>`;
}

function renderSettlementEmblem(settlement) {
  const accent = esc(settlement.presentation.accentColor);
  return `<svg viewBox="0 0 144 144" role="img" aria-label="${esc(settlement.name)} civic emblem">
    <rect x="22" y="22" width="100" height="100" fill="#11161a" stroke="${accent}" stroke-width="6"/>
    <path d="M42 104V70l30-24 30 24v34" fill="none" stroke="${accent}" stroke-width="6"/>
    <path d="M52 104V78h40v26M36 112h72" stroke="#f2eee6" stroke-width="5"/>
    <circle cx="72" cy="42" r="8" fill="#f2eee6"/>
  </svg>`;
}
