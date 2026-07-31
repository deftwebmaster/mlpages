import { esc, formatNumber, titleCase } from "../../shared/dom.js";

const SYSTEM_TABS = ["Overview", "Bodies", "Settlements", "Stations", "Economy", "Routes", "Politics", "Hazards", "History", "Stories"];

export { SYSTEM_TABS };

export function renderSystemsHome(savedSystems = []) {
  return `
    <section class="module-hero">
      <div>
        <p class="eyebrow">Stellar Cartography Archive</p>
        <h1>Stellar Systems</h1>
        <p class="lede">Generate structured star systems with inhabited bodies, stations, trade routes, hazards, politics, history, and organizations that can be opened in the Corporate Registry.</p>
      </div>
      <div class="search-board">
        <div class="field-grid">
          <label>Seed
            <input id="systemSeedInput" type="text" placeholder="kepler-7x2">
          </label>
          <label>Civilization level
            <select id="systemCivilization">
              <option value="random">Random</option>
              <option value="frontier">Frontier</option>
              <option value="developing">Developing</option>
              <option value="mature interplanetary">Mature Interplanetary</option>
              <option value="dense system civilization">Dense System Civilization</option>
              <option value="declining or ruined">Declining or Ruined</option>
            </select>
          </label>
          <label>System type
            <select id="systemType">
              <option value="random">Random</option>
              <option value="single-star">Single-Star</option>
              <option value="binary">Binary</option>
              <option value="trinary">Trinary</option>
              <option value="red-dwarf">Red Dwarf</option>
              <option value="sunlike">Sunlike</option>
              <option value="white-dwarf-remnant">White Dwarf Remnant</option>
              <option value="artificially-stabilized">Artificially Stabilized</option>
              <option value="anomalous">Anomalous</option>
            </select>
          </label>
          <label>Tone
            <select id="systemTone">
              <option value="random">Random</option>
              <option value="grounded">Grounded</option>
              <option value="frontier">Frontier</option>
              <option value="tense">Tense</option>
              <option value="prosperous">Prosperous</option>
              <option value="strange">Strange</option>
            </select>
          </label>
        </div>
        <div class="action-row">
          <button class="primary-button" data-action="generate-system" type="button">Generate Stellar System</button>
          <button class="ghost-button" data-action="open-system-seed" type="button">Load From Seed</button>
        </div>
      </div>
    </section>
    <section class="panel">
      <h2>Saved Systems</h2>
      <div class="entry-grid">${renderSystemCards(savedSystems)}</div>
    </section>
    <section class="panel">
      <h2>Example Systems</h2>
      <div class="entry-grid">${renderSystemCards([], true)}</div>
    </section>
  `;
}

export function renderSystemCards(records, examples = false) {
  const items = examples ? ["meridian-7k2m91", "blackglass-frontier", "orison-gate"].map(seed => ({ seed, system: null })) : records;
  if (!items.length) return `<div class="empty-state">No saved systems in this local archive yet.</div>`;
  return items.map(item => {
    const system = item.system || item.entity;
    const seed = item.seed;
    return `
      <article class="entry-card system-entry">
        <div class="mini-orbit" aria-hidden="true"><span></span></div>
        <div>
          <h3>${system ? esc(system.name) : esc(seed)}</h3>
          <p>${system ? `${esc(system.classification.systemType)} / ${formatNumber(system.metrics.population)} residents` : "Example seed"}</p>
          <div class="meta-strip">
            <span class="badge">${esc(seed)}</span>
            ${item.favorite ? `<span class="badge">Favorite</span>` : ""}
          </div>
        </div>
        <button type="button" data-action="open-system" data-seed="${esc(seed)}" aria-label="Open system ${esc(seed)}"></button>
      </article>
    `;
  }).join("");
}

export function renderSystemDossier(system, activeTab, saved, favorite) {
  return `
    <section class="org-header system-header">
      <div class="org-logo system-seal">${renderSystemSeal(system)}</div>
      <div class="org-title">
        <p class="eyebrow">${esc(system.catalogNumber)} / seed ${esc(system.seed)}</p>
        <h1>${esc(system.name)}</h1>
        <div class="meta-strip">
          <span class="classification">${esc(system.classification.systemType)}</span>
          <span class="badge">${esc(system.classification.settlementStatus)}</span>
          <span class="badge">${formatNumber(system.metrics.population)} residents</span>
          <span class="badge">${esc(system.position.region)}</span>
        </div>
      </div>
      <div class="action-row">
        <button class="primary-button" data-action="save-system" type="button">${saved ? "Saved" : "Save"}</button>
        <button class="ghost-button" data-action="favorite-system" type="button">${favorite ? "Favorited" : "Favorite"}</button>
        <button class="ghost-button" data-action="regenerate-system" type="button">Regenerate</button>
        <button class="ghost-button" data-action="export-system-json" type="button">JSON</button>
        <button class="ghost-button" data-action="export-system-md" type="button">Markdown</button>
      </div>
    </section>
    <nav class="tabs" aria-label="System dossier sections">
      ${SYSTEM_TABS.map(tab => `<button class="tab-button ${tab === activeTab ? "active" : ""}" data-action="system-tab" data-tab="${tab}" type="button">${tab}</button>`).join("")}
    </nav>
    <section class="tab-panel">${renderSystemTab(system, activeTab)}</section>
  `;
}

export function renderSystemTab(system, tab) {
  const map = {
    Overview: renderOverview,
    Bodies: renderBodies,
    Settlements: renderSettlements,
    Stations: renderStations,
    Economy: renderEconomy,
    Routes: renderRoutes,
    Politics: renderPolitics,
    Hazards: renderHazards,
    History: renderHistory,
    Stories: renderStories
  };
  return (map[tab] || renderOverview)(system);
}

export function systemMarkdown(system) {
  return [
    `# ${system.name}`,
    "",
    `Catalog: ${system.catalogNumber}`,
    `Seed: ${system.seed}`,
    `Population: ${formatNumber(system.metrics.population)}`,
    "",
    "## Classification",
    ...Object.entries(system.classification).map(([key, value]) => `- ${titleCase(key.replace(/([A-Z])/g, " $1"))}: ${value}`),
    "",
    "## Stars",
    ...system.stars.map(star => `- ${star.name}: ${star.stellarClass}, ${star.spectralType}, ${star.massSolar} solar masses, ${star.stability}`),
    "",
    "## Major Bodies",
    ...system.orbitalBodies.map(body => `- ${body.designation} ${body.name}: ${body.bodyType}, ${body.environment.habitability}, population ${formatNumber(body.civilization.population)}`),
    "",
    "## Settlements",
    ...system.settlements.map(item => `- ${item.name}: ${item.type} on ${item.location}, population ${formatNumber(item.population)}, current problem: ${item.currentProblem}`),
    "",
    "## Hazards",
    ...system.hazards.map(item => `- ${item.name} (${item.severity}): ${item.operationalImpact}`),
    "",
    "## Story Hooks",
    ...system.storyHooks.map(item => `- ${item.premise} ${item.complication}`)
  ].join("\n");
}

function renderOverview(system) {
  const metrics = Object.entries(system.metrics).map(([label, value]) => [titleCase(label.replace(/([A-Z])/g, " $1")), typeof value === "number" ? formatNumber(value) : value]);
  return `
    <div class="split-layout">
      <section class="panel">
        <p class="eyebrow">System synopsis</p>
        <h2>${esc(system.classification.settlementStatus)}</h2>
        <p class="lede">${esc(system.name)} is a ${esc(system.classification.systemType.replace(/-/g, " "))} archive zone in the ${esc(system.position.region)} with ${system.orbitalBodies.length} major orbital bodies, ${system.settlements.length} settlements, and ${system.stations.length} notable stations.</p>
        <div class="metric-grid">${metrics.map(([label, value]) => `<article class="data-card"><span class="meta-label">${esc(label)}</span><strong>${esc(value)}</strong></article>`).join("")}</div>
      </section>
      <aside class="panel">
        <h2>Cartographic Map</h2>
        ${renderSystemMap(system)}
      </aside>
    </div>
    <section class="panel">
      <h2>Important Organizations</h2>
      <div class="card-grid">${system.importantOrganizations.map(org => `
        <article class="relation-card network-node">
          <p class="eyebrow">${esc(org.industry)} / ${esc(org.influence)} influence</p>
          <h3>${esc(org.name)}</h3>
          <p>${esc(org.roleInSystem)} headquartered at ${esc(org.headquarters)}. Relationship: ${esc(org.governmentRelationship)} local government.</p>
          <button class="ghost-button" data-action="open-system-organization" data-seed="${esc(org.seed)}" data-name="${esc(org.name)}" type="button">Open in Corporate Registry</button>
        </article>
      `).join("")}</div>
    </section>
  `;
}

function renderBodies(system) {
  return `<section class="panel"><h2>Orbital Bodies</h2><div class="card-grid">${system.orbitalBodies.map(body => `
    <article class="location-card">
      <p class="eyebrow">${esc(body.designation)} / ${esc(body.bodyType)}</p>
      <h3>${esc(body.name)}</h3>
      <p>${esc(body.description)}</p>
      <p><strong>Orbit:</strong> ${body.orbit.semiMajorAxisAU} AU / ${body.orbit.orbitalPeriodDays} days</p>
      <p><strong>Atmosphere:</strong> ${esc(body.physical.atmosphere)} / <strong>Gravity:</strong> ${body.physical.gravityEarth}g / <strong>Water:</strong> ${body.environment.surfaceWaterPercent}%</p>
      <p><strong>Civilization:</strong> ${esc(body.civilization.settlementLevel)} / ${formatNumber(body.civilization.population)} residents / ${esc(body.civilization.primaryEconomy)}</p>
    </article>
  `).join("")}</div></section>`;
}

function renderSettlements(system) {
  return `<section class="panel"><h2>Settlements</h2><div class="card-grid">${system.settlements.map(item => `
    <article class="location-card">
      <p class="eyebrow">${esc(item.type)} / founded ${item.foundedYear}</p>
      <h3>${esc(item.name)}</h3>
      <p>${formatNumber(item.population)} residents on ${esc(item.location)}. Governed by ${esc(item.governingAuthority)}.</p>
      <p><strong>Role:</strong> ${esc(item.economicRole)} / <strong>Infrastructure:</strong> ${esc(item.infrastructureLevel)}</p>
      <p>${esc(item.culturalNote)} Current problem: ${esc(item.currentProblem)}.</p>
      <button class="ghost-button" data-action="expand-system-settlement" data-summary-id="${esc(item.id)}" type="button">${item.promotionStatus === "promoted" ? "Open Full Settlement" : "Expand Into Full Settlement"}</button>
    </article>
  `).join("")}</div></section>`;
}

function renderStations(system) {
  return `<section class="panel"><h2>Stations and Habitats</h2><div class="card-grid">${system.stations.map(station => `
    <article class="location-card">
      <p class="eyebrow">${esc(station.type)} / ${esc(station.securityLevel)}</p>
      <h3>${esc(station.name)}</h3>
      <p>${esc(station.function)} in ${esc(station.orbitalLocation)}. Population or crew: ${formatNumber(station.population)}.</p>
      <p><strong>Owner:</strong> ${esc(station.owner)} / <strong>Condition:</strong> ${esc(station.condition)} / <strong>Docks:</strong> ${station.dockingCapacity}</p>
      <p>Known issue: ${esc(station.knownIssue)}.</p>
    </article>
  `).join("")}</div></section>`;
}

function renderEconomy(system) {
  const econ = system.economy;
  return `<div class="split-layout">
    <section class="panel">
      <h2>Economy</h2>
      <div class="metric-grid">
        ${Object.entries({
          "Primary industries": econ.primaryIndustries.join(" / "),
          "Major exports": econ.majorExports.join(" / "),
          "Major imports": econ.majorImports.join(" / "),
          "Energy sources": econ.energySources.join(" / "),
          "Labor structure": econ.laborStructure,
          "Exchange system": econ.exchangeSystem,
          "Trade dependence": econ.tradeDependence,
          "Economic vulnerability": econ.economicVulnerability
        }).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(key)}</span><p>${esc(value)}</p></article>`).join("")}
      </div>
    </section>
    <aside class="panel">
      <h2>Infrastructure</h2>
      ${system.infrastructure.map(item => `<article class="data-card"><h3>${esc(item.asset)}</h3><p>${esc(item.location)} / ${esc(item.owner)} / ${esc(item.condition)}. Weakness: ${esc(item.knownWeakness)}.</p></article>`).join("")}
    </aside>
  </div>`;
}

function renderRoutes(system) {
  return `<section class="panel"><h2>Trade and Travel Routes</h2><div class="card-grid">${system.routes.map(route => `
    <article class="relation-card">
      <p class="eyebrow">${esc(route.type)} / ${esc(route.securityStatus)}</p>
      <h3>${esc(route.name)}</h3>
      <p>${esc(route.origin)} to ${esc(route.destination)} in ${esc(route.typicalTravelTime)}. Traffic: ${esc(route.trafficVolume)}.</p>
      <p><strong>Operator:</strong> ${esc(route.operator)} / <strong>Cargo:</strong> ${esc(route.primaryCargo)} / <strong>Risk:</strong> ${esc(route.riskLevel)}</p>
      <p>${esc(route.navigationNotes)}</p>
    </article>
  `).join("")}</div></section>`;
}

function renderPolitics(system) {
  return `<section class="panel"><h2>Political Structure</h2><div class="card-grid">${system.factions.map(faction => `
    <article class="relation-card network-node">
      <p class="eyebrow">${esc(faction.type)} / ${esc(faction.legitimacy)}</p>
      <h3>${esc(faction.name)}</h3>
      <p>Territory: ${esc(faction.territory)}. Capital: ${esc(faction.capital)}.</p>
      <p><strong>Principle:</strong> ${esc(faction.ideology)} / <strong>Enforcement:</strong> ${esc(faction.enforcementStrength)}</p>
      <p>Objective: ${esc(faction.currentObjective)}.</p>
    </article>
  `).join("")}</div></section>`;
}

function renderHazards(system) {
  return `<section class="panel"><h2>Hazards</h2><div class="card-grid">${system.hazards.map(hazard => `
    <article class="incident-card">
      <p class="eyebrow">${esc(hazard.type)} / ${esc(hazard.severity)}</p>
      <h3>${esc(hazard.name)}</h3>
      <p>${esc(hazard.location)}. Frequency: ${esc(hazard.frequency)}. Warning signs: ${esc(hazard.warningSigns)}.</p>
      <p><strong>Impact:</strong> ${esc(hazard.operationalImpact)} / <strong>Mitigation:</strong> ${esc(hazard.mitigation)}</p>
      <p>${esc(hazard.storyRelevance)}</p>
    </article>
  `).join("")}</div></section>`;
}

function renderHistory(system) {
  return `<section class="panel"><h2>System Timeline</h2><div class="timeline">${system.history.map(item => `
    <article class="timeline-item">
      <div><strong class="timeline-year">${item.year}</strong><span class="badge">${esc(item.status)}</span></div>
      <div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><p class="eyebrow">${esc(item.lastingConsequence)}</p></div>
    </article>
  `).join("")}</div></section>`;
}

function renderStories(system) {
  return `<section class="panel"><h2>Story Opportunities</h2><div class="card-grid">${system.storyHooks.map(hook => `
    <article class="product-card">
      <p class="eyebrow">${esc(hook.usefulFor)}</p>
      <h3>${esc(hook.premise)}</h3>
      <p>${esc(hook.complication)}</p>
    </article>
  `).join("")}</div></section>
  <section class="panel"><h2>Current Tensions</h2><div class="card-grid">${system.tensions.map(tension => `
    <article class="incident-card">
      <p class="eyebrow">${esc(tension.pressure)} / ${esc(tension.currentState)}</p>
      <h3>${esc(tension.title)}</h3>
      <p>${esc(tension.parties.join(" versus "))} at ${esc(tension.location)}. Linked hazard: ${esc(tension.linkedHazard)}.</p>
      <button class="ghost-button" data-action="expand-system-tension" data-tension-id="${esc(tension.id || tension.title)}" type="button">${tension.promotionStatus === "promoted" ? "Open Full Conflict" : "Expand Into Full Conflict"}</button>
    </article>
  `).join("")}</div></section>`;
}

function renderSystemSeal(system) {
  return `<svg viewBox="0 0 144 144" role="img" aria-label="${esc(system.name)} seal">
    <circle cx="72" cy="72" r="56" fill="#11161a" stroke="${esc(system.presentation.accentColor)}" stroke-width="6"/>
    <circle cx="72" cy="72" r="24" fill="${esc(system.presentation.accentColor)}"/>
    ${system.orbitalBodies.slice(0, 6).map((body, index) => {
      const radius = 36 + index * 8;
      return `<circle cx="72" cy="72" r="${radius}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1"/><circle cx="${72 + Math.cos(index * 1.35) * radius}" cy="${72 + Math.sin(index * 1.35) * radius}" r="${index % 2 ? 3 : 4}" fill="#f2eee6"/>`;
    }).join("")}
  </svg>`;
}

function renderSystemMap(system) {
  const bodies = system.orbitalBodies;
  return `<svg class="system-map orbital-map" viewBox="0 0 700 360" role="img" aria-label="Orbital map of ${esc(system.name)}">
    <circle cx="80" cy="180" r="18" fill="${esc(system.presentation.accentColor)}"/>
    ${bodies.map((body, index) => {
      const x = 135 + index * (520 / Math.max(1, bodies.length - 1));
      const y = 180 + (index % 2 ? -26 : 26);
      const r = body.bodyType.includes("giant") ? 10 : 6;
      return `<line x1="80" y1="180" x2="${x}" y2="${y}" stroke="rgba(255,255,255,.09)"/><circle cx="${x}" cy="${y}" r="${r}" fill="#f2eee6"/><text x="${x + 12}" y="${y + 4}" fill="#a7adb0" font-size="11">${esc(body.name)}</text>`;
    }).join("")}
    ${system.stations.slice(0, 8).map((station, index) => `<rect x="${130 + index * 58}" y="${index % 2 ? 255 : 82}" width="7" height="7" fill="${esc(system.presentation.accentColor)}"><title>${esc(station.name)}</title></rect>`).join("")}
  </svg>`;
}
