import { esc, formatNumber, titleCase } from "../../shared/dom.js";
import {
  FACILITY_TYPES,
  INFRASTRUCTURE_TOPOLOGIES,
  INFRASTRUCTURE_TYPES,
  RESEARCH_TYPES,
  STANDARD_TYPES,
  TECHNOLOGY_CATEGORIES,
  TECHNOLOGY_DOMAINS,
  TECHNOLOGY_MATURITY,
  TECHNOLOGY_SCALES,
  TECHNOLOGY_TYPES,
  analyzeTechnologyCoverage,
  analyzeTechnologyDependencies,
  technologyMarkdown,
  technologyPrintableHtml
} from "./generate.js";

export const TECHNOLOGY_TABS = ["Overview", "Dependencies", "Function", "Science", "Design", "Components", "Materials", "Operations", "Maintenance", "Failures", "Production", "Standards", "Deployment", "History", "Consequences", "Export"];

export { technologyMarkdown, technologyPrintableHtml };

export function renderTechnologyHome(universe = {}, suggestions = [], filters = {}) {
  const records = technologyRecords(universe);
  const coverage = analyzeTechnologyCoverage(universe);
  const filtered = applyFilters(records, filters);
  return `
    <section class="module-hero technology-hero">
      <div>
        <p class="eyebrow">Scientific, Industrial, Technical, and Infrastructure Worldbuilding System</p>
        <h1>Technology</h1>
        <p class="lede">Model the systems that make the universe work: technology, infrastructure, standards, research programs, facilities, dependencies, maintenance, failures, supply chains, and consequences.</p>
      </div>
      <div class="search-board">
        <div class="field-grid">
          <label>Seed
            <input id="technologySeedInput" type="text" placeholder="meridian-atmosphere-regulator-4281">
          </label>
          <label>Entry Type
            <select id="technologyEntityType">
              <option value="technology">Technology</option>
              <option value="infrastructureSystem">Infrastructure</option>
              <option value="technicalStandard">Standard</option>
              <option value="researchProgram">Research Program</option>
              <option value="technicalFacility">Facility</option>
            </select>
          </label>
          <label>Mode
            <select id="technologyMode">
              <option value="quick">Quick</option>
              <option value="guided">Guided</option>
              <option value="contextual">Contextual</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label>Domain
            <select id="technologyDomain"><option value="">Auto</option>${TECHNOLOGY_DOMAINS.map(item => option(item, filters.domain)).join("")}</select>
          </label>
          <label>Category
            <input id="technologyCategory" type="text" value="${esc(filters.category || "")}" placeholder="atmosphere-control">
          </label>
          <label>Scale
            <select id="technologyScale"><option value="">Auto</option>${TECHNOLOGY_SCALES.map(item => option(item, filters.scale)).join("")}</select>
          </label>
          <label>Maturity
            <select id="technologyMaturity"><option value="">Auto</option>${TECHNOLOGY_MATURITY.map(item => option(item, filters.maturity)).join("")}</select>
          </label>
          <label>Context Entity
            <select id="technologyFocus"><option value="">Use existing world pressure</option>${entityOptions(universe).map(entity => `<option value="${esc(entity.id)}">${esc(entity.label)} (${esc(entity.entityType)})</option>`).join("")}</select>
          </label>
        </div>
        <div class="action-row">
          <button class="primary-button" data-action="generate-technology" type="button">Generate Technology</button>
          <button class="ghost-button" data-action="generate-infrastructure" type="button">Generate Infrastructure</button>
          <button class="ghost-button" data-action="create-standard" type="button">Create Standard</button>
          <button class="ghost-button" data-action="create-research" type="button">Create Research Program</button>
          <button class="ghost-button" data-action="create-facility" type="button">Create Facility</button>
          <button class="ghost-button" data-action="open-technology-seed" type="button">Load From Seed</button>
        </div>
      </div>
    </section>
    <section class="panel">
      <h2>Registry Dashboard</h2>
      <div class="metric-grid">
        ${metric("Total Technologies", count(records, "technology"))}
        ${metric("Active Infrastructure", count(records, "infrastructureSystem"))}
        ${metric("Research Programs", count(records, "researchProgram"))}
        ${metric("Standards", count(records, "technicalStandard"))}
        ${metric("Facilities", count(records, "technicalFacility"))}
        ${metric("Experimental", records.filter(item => item.classification?.maturity === "prototype" || item.classification?.status === "active").length)}
        ${metric("Obsolete", records.filter(item => item.classification?.maturity === "obsolete").length)}
        ${metric("Restricted", records.filter(item => /restricted|classified|military/.test(item.classification?.availability || item.classification?.securityLevel || "")).length)}
        ${metric("Unresolved Risks", coverage.unresolvedDependencies.length)}
        ${metric("Missing Domains", coverage.missingDomains.length)}
        ${metric("Settlement Gaps", coverage.settlementGaps.length)}
        ${metric("Suggestions", suggestions.length)}
      </div>
    </section>
    <section class="panel">
      <h2>Suggested Generation</h2>
      <div class="entry-grid">
        ${generationCard("Energy Technology", "Reactors, storage, distribution, containment, and emergency power.", "energy")}
        ${generationCard("Computing or AI", "Software, autonomy, cognition, simulation, and control systems.", "artificial-intelligence")}
        ${generationCard("Communications", "Relays, beacons, encryption, public networks, and interstellar messaging.", "communications")}
        ${generationCard("Transportation", "Transit, cargo handling, docking, traffic control, and navigation.", "transportation")}
        ${generationCard("Medical Technology", "Diagnostics, surgery, implants, regeneration, and synthetic organs.", "medicine")}
        ${generationCard("Environmental Systems", "Atmosphere, water, waste, climate, and habitat stabilization.", "environmental-systems")}
        ${generationCard("Settlement Infrastructure", "Generate an operating network with topology and failure cascades.", "infrastructure")}
        ${generationCard("Industrial Standard", "Define interoperability, certification, safety, and compatibility.", "standard")}
      </div>
    </section>
    <section class="panel"><h2>Technology Suggestions From Existing Data</h2><div class="entry-list">${suggestions.map(renderSuggestion).join("") || `<div class="empty-state">Save settlements, organizations, conflicts, or documents to unlock context-first technology suggestions.</div>`}</div></section>
    <section class="panel"><h2>Saved Registry</h2><div class="entry-grid">${renderTechnologyCards(filtered)}</div></section>
    <section class="panel"><h2>Coverage and Capability Gaps</h2><div class="entry-grid">
      ${coverageCard("Missing Domains", coverage.missingDomains)}
      ${coverageCard("Dependency Risks", coverage.unresolvedDependencies)}
      ${coverageCard("Settlement Gaps", coverage.settlementGaps)}
      ${coverageCard("Warnings", coverage.findings)}
    </div></section>
  `;
}

export function renderTechnologyCards(records = []) {
  if (!records.length) return `<div class="empty-state">No saved technology or infrastructure records yet.</div>`;
  return records.map(record => {
    const entity = unwrap(record);
    return `
      <article class="entry-card technology-entry">
        <div class="mini-technology" aria-hidden="true"><span></span><span></span><span></span></div>
        <div>
          <h3>${esc(entity.name || record.seed)}</h3>
          <p>${esc(entity.summary || "Technical registry record.")}</p>
          <div class="meta-strip">
            <span class="badge">${esc(title(entity.entityType))}</span>
            <span class="badge">${esc(title(entity.classification?.domain || entity.classification?.serviceDomain || entity.classification?.facilityType || "domain"))}</span>
            <span class="badge">${esc(title(entity.classification?.maturity || entity.classification?.operationalStatus || entity.classification?.status || "active"))}</span>
            ${record.favorite || entity.favorite ? `<span class="badge">Favorite</span>` : ""}
          </div>
        </div>
        <button type="button" data-action="open-technology" data-id="${esc(entity.id || record.seed)}" aria-label="Open ${esc(entity.name || record.seed)}"></button>
      </article>
    `;
  }).join("");
}

export function renderTechnologyDossier(entity, activeTab = "Overview", saved = false, favorite = false, universe = {}) {
  const validation = entity.validation || {};
  return `
    <section class="org-header technology-header">
      <div class="org-logo technology-seal">${technologySeal(entity)}</div>
      <div class="org-title">
        <p class="eyebrow">${esc(title(entity.entityType))} / seed ${esc(entity.seed)}</p>
        <h1>${esc(entity.name)}</h1>
        <p class="lede">${esc(entity.summary || "")}</p>
        <div class="meta-strip">
          <span class="classification">${esc(title(entity.classification?.domain || entity.classification?.serviceDomain || entity.classification?.facilityType || "technical"))}</span>
          <span class="badge">${esc(title(entity.classification?.category || entity.classification?.infrastructureType || entity.classification?.standardType || entity.classification?.researchType || ""))}</span>
          <span class="badge">${esc(title(entity.classification?.maturity || entity.classification?.operationalStatus || entity.classification?.status || "active"))}</span>
          <span class="badge">${esc(validation.valid === false ? "Needs Review" : "Validated")}</span>
        </div>
      </div>
      <div class="action-row">
        <button class="primary-button" data-action="save-technology" type="button">${saved ? "Saved" : "Save"}</button>
        <button class="ghost-button" data-action="favorite-technology" type="button">${favorite ? "Favorited" : "Favorite"}</button>
        <button class="ghost-button" data-action="regenerate-technology" type="button">Regenerate</button>
        <button class="ghost-button" data-action="export-technology-json" type="button">JSON</button>
        <button class="ghost-button" data-action="export-technology-md" type="button">Markdown</button>
        <button class="ghost-button" data-action="export-technology-html" type="button">Printable</button>
      </div>
    </section>
    <nav class="tabs" aria-label="Technology registry sections">
      ${TECHNOLOGY_TABS.map(tab => `<button class="tab-button ${tab === activeTab ? "active" : ""}" data-action="technology-tab" data-tab="${esc(tab)}" type="button">${esc(tab)}</button>`).join("")}
    </nav>
    <section class="tab-panel">${renderTechnologyTab(entity, activeTab, universe)}</section>
  `;
}

export function renderTechnologyTab(entity, tab = "Overview", universe = {}) {
  const analysis = analyzeTechnologyDependencies(entity, universe);
  const map = {
    Overview: () => renderOverview(entity, analysis),
    Dependencies: () => renderDependencies(entity, analysis),
    Function: () => renderFunction(entity),
    Science: () => renderScience(entity),
    Design: () => renderDesign(entity),
    Components: () => renderComponents(entity),
    Materials: () => renderMaterials(entity),
    Operations: () => renderOperations(entity),
    Maintenance: () => renderMaintenance(entity),
    Failures: () => renderFailures(entity),
    Production: () => renderProduction(entity),
    Standards: () => renderStandards(entity),
    Deployment: () => renderDeployment(entity),
    History: () => renderHistory(entity),
    Consequences: () => renderConsequences(entity),
    Export: () => renderExport(entity)
  };
  return (map[tab] || map.Overview)();
}

export function renderTechnologyComparison(records = []) {
  const entities = records.map(unwrap).filter(Boolean).slice(0, 5);
  return `
    <section class="panel"><p class="eyebrow">Technology Comparison</p><h1>Compare</h1><p class="lede">Compare function, scale, maturity, reliability, cost, maintenance, safety, availability, regulation, and strategic importance.</p></section>
    <section class="panel"><div class="comparison-grid">${entities.map(entity => `
      <article class="data-card">
        <h3>${esc(entity.name)}</h3>
        ${comparisonFact("Function", entity.function?.primary || entity.service?.provided)}
        ${comparisonFact("Scale", entity.classification?.scale)}
        ${comparisonFact("Maturity", entity.classification?.maturity || entity.classification?.operationalStatus)}
        ${comparisonFact("Reliability", entity.classification?.reliability)}
        ${comparisonFact("Maintenance", entity.maintenance?.burden)}
        ${comparisonFact("Regulation", entity.regulation?.model)}
        ${comparisonFact("Importance", entity.classification?.strategicImportance || entity.classification?.criticality)}
      </article>
    `).join("") || `<div class="empty-state">Save two to five Registry records to compare them.</div>`}</div></section>
  `;
}

export function registryHtml(records = []) {
  const entities = records.map(unwrap).filter(Boolean);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Technology Registry</title><style>body{font:16px Georgia,serif;background:#f4f0e8;color:#111;margin:0;padding:32px}.page{max-width:960px;margin:auto}.entry{border-top:1px solid #999;padding:12px 0}.meta{font:12px monospace;text-transform:uppercase}@media print{body{padding:0}.page{max-width:none;padding:24px}}</style></head><body><article class="page"><h1>Technology & Infrastructure Registry</h1>${entities.map(entity => `<section class="entry"><p class="meta">${esc(entity.entityType)} / ${esc(entity.classification?.domain || entity.classification?.serviceDomain || "")}</p><h2>${esc(entity.name)}</h2><p>${esc(entity.summary || "")}</p></section>`).join("")}</article></body></html>`;
}

function renderOverview(entity, analysis) {
  return `
    <div class="split-layout">
      <section class="panel">
        <h2>Overview</h2>
        <div class="metric-grid">
          ${metric("Dependencies", analysis.direct.length)}
          ${metric("Critical", analysis.critical.length)}
          ${metric("Failure Modes", entity.failureModes?.length || 0)}
          ${metric("Components", entity.components?.length || entity.technologies?.length || 0)}
          ${metric("Materials", entity.materials?.length || entity.materialInputs?.length || 0)}
          ${metric("Warnings", (entity.validation?.warnings || []).length)}
        </div>
      </section>
      <aside class="panel">
        <h2>Validation</h2>
        <div class="entry-list">
          ${(entity.validation?.errors || []).map(item => warningCard("Error", item)).join("")}
          ${(entity.validation?.warnings || []).map(item => warningCard("Warning", item)).join("")}
          ${!(entity.validation?.errors?.length || entity.validation?.warnings?.length) ? `<article class="data-card"><h3>No blocking issues</h3><p>Core plausibility checks passed.</p></article>` : ""}
        </div>
      </aside>
    </div>
    <section class="panel"><h2>Key Facts</h2><div class="entry-grid">
      ${card("Primary Function", entity.function?.primary || entity.service?.provided || "Not recorded")}
      ${card("Maintenance Burden", title(entity.maintenance?.burden || "not recorded"))}
      ${card("Power", entity.power?.source || entity.powerDependencies?.join(", ") || "not recorded")}
      ${card("Worst Failure", entity.failureModes?.[0]?.name || "not recorded")}
      ${card("Owner", entity.ownership?.rightsHolder || entity.ownership?.model || "not recorded")}
      ${card("Regulation", title(entity.regulation?.model || "not recorded"))}
    </div></section>
  `;
}

function renderDependencies(entity, analysis) {
  return `
    <section class="panel"><p class="eyebrow">Dependency Explorer</p><h2>${esc(entity.name)} Dependency Network</h2>${dependencySvg(entity, analysis)}
      <div class="entry-grid">
        ${listCard("Direct Dependencies", analysis.direct)}
        ${listCard("Critical Dependencies", analysis.critical)}
        ${listCard("Single Points of Failure", analysis.singlePointsOfFailure)}
        ${listCard("Substitutes", analysis.substitutes)}
      </div>
    </section>
    <section class="panel"><h2>Text Alternative</h2><p>${esc(entity.name)} depends on ${analysis.direct.join(", ") || "no recorded dependencies"}.</p></section>
  `;
}

function renderFunction(entity) {
  return `<section class="panel"><h2>Function</h2><div class="entry-grid">
    ${card("Primary", entity.function?.primary || entity.service?.provided)}
    ${listCard("Secondary", entity.function?.secondary)}
    ${card("Problem Solved", entity.function?.problemSolved)}
    ${listCard("Limitations", entity.function?.limitations)}
    ${listCard("Unintended Uses", entity.function?.unintendedUses)}
    ${card("Why Adopted", entity.function?.whyAdopted)}
  </div></section>`;
}

function renderScience(entity) {
  return `<section class="panel"><h2>Scientific Basis</h2><div class="entry-grid">
    ${listCard("Principles", entity.scientificBasis?.principles)}
    ${card("Accepted Theory", entity.scientificBasis?.acceptedTheory)}
    ${listCard("Speculative Elements", entity.scientificBasis?.speculativeElements)}
    ${listCard("Known Limits", entity.scientificBasis?.knownLimits)}
    ${card("Competing Interpretation", entity.scientificBasis?.competingInterpretation)}
  </div></section>`;
}

function renderDesign(entity) {
  return `<section class="panel"><h2>Design</h2><div class="entry-grid">
    ${card("Architecture", entity.design?.architecture)}
    ${card("Form Factor", entity.design?.formFactor)}
    ${listCard("Subsystems", entity.design?.majorSubsystems)}
    ${listCard("Interfaces", entity.design?.interfaces)}
    ${card("Controls", entity.design?.controls)}
    ${card("Repairability", entity.design?.repairability)}
  </div></section>`;
}

function renderComponents(entity) {
  const items = entity.components || entity.technologies || entity.nodes || [];
  return `<section class="panel"><h2>Components and Nodes</h2><div class="entry-grid">${items.map(item => `
    <article class="data-card"><p class="eyebrow">${esc(item.componentType || item.nodeType || item.role || "component")}</p><h3>${esc(item.name)}</h3><p>${esc(item.role || item.status || "")}</p><p>${esc(item.criticality || "")} / ${esc(item.replaceability || "")}</p></article>
  `).join("") || `<div class="empty-state">No component records.</div>`}</div></section>`;
}

function renderMaterials(entity) {
  const items = entity.materials || (entity.materialInputs || []).map(name => ({ name })) || [];
  return `<section class="panel"><h2>Materials</h2><div class="entry-grid">${items.map(item => `
    <article class="data-card"><p class="eyebrow">${esc(item.scarcity || "material")}</p><h3>${esc(item.name)}</h3><p>${esc(item.function || "")}</p><p>Source: ${esc(item.source || "not recorded")}</p><p>Substitutes: ${esc((item.substitutes || []).join(", ") || "none recorded")}</p></article>
  `).join("") || `<div class="empty-state">No material dependencies.</div>`}</div></section>`;
}

function renderOperations(entity) {
  return `<section class="panel"><h2>Operations</h2><div class="entry-grid">
    ${card("Operator Model", entity.operation?.operatorModel || entity.staffing?.operatorModel)}
    ${card("Required Skill", entity.operation?.requiredSkill)}
    ${card("Certification", entity.operation?.certification)}
    ${card("Automation", entity.operation?.automationLevel)}
    ${card("Human Oversight", entity.operation?.humanOversight)}
    ${card("Access", entity.service?.access || entity.serviceLevels?.guaranteed)}
  </div></section>`;
}

function renderMaintenance(entity) {
  return `<section class="panel"><h2>Maintenance</h2><div class="entry-grid">
    ${card("Burden", title(entity.maintenance?.burden || ""))}
    ${card("Inspection", entity.maintenance?.inspectionInterval)}
    ${card("Overhaul", entity.maintenance?.overhaulInterval)}
    ${listCard("Required Roles", entity.maintenance?.requiredRoles)}
    ${listCard("Critical Spares", entity.maintenance?.criticalSpares)}
    ${card("Delay Consequence", entity.maintenance?.consequencesOfDelay)}
  </div></section>
  <section class="panel"><h2>Procedures</h2><div class="entry-grid">${(entity.maintenanceProcedures || []).map(item => `<article class="data-card"><p class="eyebrow">${esc(item.procedureType)}</p><h3>${esc(item.name)}</h3><p>${esc(item.interval)}${item.promotableToDocument ? " / promotable to Document Forge" : ""}</p></article>`).join("") || `<div class="empty-state">No procedures recorded.</div>`}</div></section>`;
}

function renderFailures(entity) {
  const cascade = entity.failureCascade?.steps || [];
  return `<section class="panel"><h2>Failure Modes</h2><div class="entry-grid">${(entity.failureModes || []).map(item => `
    <article class="data-card"><p class="eyebrow">${esc(item.severity)} / ${esc(item.probability)}</p><h3>${esc(item.name)}</h3><p>${esc(item.cause)}</p><p>${esc((item.consequences || []).join("; "))}</p><p>Mitigation: ${esc((item.mitigations || []).join(", "))}</p></article>
  `).join("") || `<div class="empty-state">No failure modes recorded.</div>`}</div></section>
  <section class="panel"><h2>Cascading Failure</h2><div class="cascade-list">${cascade.map((step, index) => `<article><strong>${index + 1}</strong><span>${esc(step)}</span></article>`).join("")}</div></section>`;
}

function renderProduction(entity) {
  return `<section class="panel"><h2>Manufacturing and Supply Chain</h2><div class="entry-grid">
    ${card("Production Method", entity.manufacturing?.productionMethod)}
    ${listCard("Bottlenecks", entity.manufacturing?.bottlenecks)}
    ${listCard("Supply Risks", entity.supplyChain?.risks)}
    ${listCard("Required Facilities", entity.manufacturing?.requiredFacilities || entity.infrastructureDependencies)}
    ${card("Quality Control", entity.manufacturing?.qualityControl)}
    ${card("Cost of Failure", entity.economics?.costOfFailure)}
  </div></section>
  <section class="panel"><h2>Production Process</h2><div class="entry-list">${(entity.productionProcess || []).map(item => `<article class="relation-card"><p class="eyebrow">${esc(item.risk)}</p><h3>${esc(title(item.stage))}</h3><p>${esc((item.dependencies || []).join(", "))}</p></article>`).join("") || `<div class="empty-state">No production stages recorded.</div>`}</div></section>`;
}

function renderStandards(entity) {
  return `<section class="panel"><h2>Standards and Compatibility</h2><div class="entry-grid">
    ${listCard("Required Standards", entity.compatibility?.requiredStandards || entity.standardIds)}
    ${listCard("Supported Standards", entity.compatibility?.supportedStandards)}
    ${listCard("Incompatible", entity.compatibility?.incompatibleStandards)}
    ${card("Legacy Support", entity.compatibility?.legacySupport)}
    ${card("IP Model", title(entity.intellectualProperty?.model || ""))}
    ${card("Regulation", title(entity.regulation?.model || ""))}
  </div></section>
  <section class="panel"><h2>Compatibility Matrix</h2><div class="entry-grid">${(entity.compatibility?.matrix || []).map(row => `<article class="data-card"><h3>${esc(row.item)}</h3><p>${esc(row.compatibleWith)} / ${esc(row.limitation)}</p></article>`).join("") || `<div class="empty-state">No compatibility matrix recorded.</div>`}</div></section>`;
}

function renderDeployment(entity) {
  const deployments = entity.deployment?.instances || entity.zones || [];
  return `<section class="panel"><h2>Deployment and Service</h2><div class="entry-grid">
    ${card("Largest Deployment", entity.deployment?.largestDeployment || entity.service?.coverage)}
    ${card("Adoption", title(entity.adoption?.status || ""))}
    ${card("Access", entity.service?.access)}
    ${card("Capacity", entity.capacity?.current)}
    ${card("Redundancy", entity.redundancy?.level)}
    ${card("Demand", entity.demand?.current)}
  </div></section>
  <section class="panel"><h2>Instances and Zones</h2><div class="entry-grid">${deployments.map(item => `<article class="data-card"><p class="eyebrow">${esc(item.status || item.serviceLevel || "deployment")}</p><h3>${esc(item.name || item.id)}</h3><p>${esc(item.maintenanceState || item.risk || item.criticality || "")}</p></article>`).join("") || `<div class="empty-state">No deployment instances recorded.</div>`}</div></section>`;
}

function renderHistory(entity) {
  return `<section class="panel"><h2>Historical Development</h2><div class="entry-grid">
    ${card("Inventor", entity.historicalDevelopment?.inventor)}
    ${card("Developed At", entity.historicalDevelopment?.developedAt)}
    ${card("Invention Date", entity.historicalDevelopment?.inventionDate)}
    ${listCard("Controversies", entity.historicalDevelopment?.controversies)}
  </div></section>
  <section class="panel"><h2>Milestones</h2><div class="timeline-ribbon">${(entity.historicalDevelopment?.milestones || []).map(item => `<article class="timeline-event-card"><div class="timeline-date">${esc(item.year)}</div><div><h3>${esc(item.title)}</h3><p>${item.promotableToTimeline ? "Promotable to Historical Timeline." : "Development record."}</p></div></article>`).join("")}</div></section>
  <section class="panel"><h2>Lifecycle</h2><div class="entry-grid">${card("Stage", title(entity.lifecycle?.currentStage || ""))}${card("Predecessor", entity.lifecycle?.predecessor)}${card("Successor", entity.lifecycle?.successor)}${card("Replacement", entity.lifecycle?.replacement)}${listCard("Roadmap", entity.futureDevelopment?.roadmap || entity.futureProjects?.roadmap)}</div></section>`;
}

function renderConsequences(entity) {
  return `<section class="panel"><h2>Consequences</h2><div class="entry-grid">
    ${listCard("Intended Benefits", entity.consequences?.intendedBenefits)}
    ${listCard("Expected Tradeoffs", entity.consequences?.expectedTradeoffs)}
    ${listCard("Unintended Harms", entity.consequences?.unintendedHarms)}
    ${listCard("Groups Benefited", entity.consequences?.groupsBenefited)}
    ${listCard("Groups Harmed", entity.consequences?.groupsHarmed)}
    ${listCard("Ethical Issues", entity.consequences?.ethicalIssues)}
    ${card("Public Perception", entity.consequences?.publicPerception || entity.topology?.politicalEffect)}
  </div></section>`;
}

function renderExport(entity) {
  return `<section class="panel"><h2>Export</h2><div class="document-grid">
    <button class="document-card" data-action="export-technology-json" type="button"><h3>Complete JSON</h3><p>Full structured Registry entity.</p></button>
    <button class="document-card" data-action="export-technology-md" type="button"><h3>Technical Dossier</h3><p>Readable Markdown reference.</p></button>
    <button class="document-card" data-action="export-technology-html" type="button"><h3>Printable HTML</h3><p>Print-ready technical reference.</p></button>
    <button class="document-card" data-action="export-technology-csv" type="button"><h3>CSV Registry</h3><p>Flat index for saved technical records.</p></button>
    <button class="document-card" data-action="export-technology-svg" type="button"><h3>SVG Dependencies</h3><p>Dependency diagram with text alternative.</p></button>
  </div></section>`;
}

function dependencySvg(entity, analysis) {
  const items = analysis.critical.slice(0, 7);
  const height = Math.max(220, 80 + items.length * 34);
  return `<svg class="dependency-map" viewBox="0 0 760 ${height}" role="img" aria-label="Dependency diagram for ${esc(entity.name)}">
    <rect x="0" y="0" width="760" height="${height}" fill="transparent"></rect>
    <rect x="260" y="24" width="240" height="54" fill="rgba(255,255,255,.06)" stroke="var(--accent)"></rect>
    <text x="380" y="56" text-anchor="middle" fill="var(--text)" font-size="14">${esc(entity.name.slice(0, 34))}</text>
    ${items.map((item, index) => {
      const y = 110 + index * 34;
      return `<line x1="380" y1="78" x2="148" y2="${y - 6}" stroke="rgba(255,255,255,.2)"></line><rect x="24" y="${y - 24}" width="248" height="30" fill="rgba(255,255,255,.04)" stroke="var(--line)"></rect><text x="34" y="${y - 5}" fill="var(--muted)" font-size="12">${esc(String(item).slice(0, 34))}</text>`;
    }).join("")}
  </svg>`;
}

function technologySeal(entity) {
  return `<svg viewBox="0 0 120 120" role="img" aria-label="${esc(entity.name)} seal">
    <rect x="18" y="18" width="84" height="84" fill="none" stroke="var(--accent)" stroke-width="5"></rect>
    <path d="M34 60h52M60 34v52M42 42l36 36M78 42 42 78" stroke="var(--accent-2)" stroke-width="4"></path>
    <circle cx="60" cy="60" r="12" fill="var(--accent)"></circle>
  </svg>`;
}

function renderSuggestion(item) {
  return `<article class="relation-card">
    <p class="eyebrow">${esc(title(item.entityType))} / ${esc(title(item.domain))}</p>
    <h3>${esc(item.title)}</h3>
    <p>${esc(item.reason)}</p>
    <div class="action-row">
      <button class="ghost-button" data-action="generate-suggested-technology" data-entity-type="${esc(item.entityType)}" data-domain="${esc(item.domain)}" data-category="${esc(item.category)}" data-source-id="${esc(item.sourceEntityId)}" type="button">Generate</button>
      <a class="ghost-button" href="#/atlas/entity/${encodeURIComponent(item.sourceEntityId)}">Open Source</a>
    </div>
  </article>`;
}

function generationCard(titleText, description, domain) {
  return `<button class="document-card" data-action="technology-entry" data-domain="${esc(domain)}" type="button"><h3>${esc(titleText)}</h3><p>${esc(description)}</p></button>`;
}

function coverageCard(titleText, items = []) {
  return `<article class="data-card"><h3>${esc(titleText)}</h3><p>${items.length || 0} item(s)</p><div class="meta-strip">${items.slice(0, 4).map(item => `<span class="badge">${esc(item.message || item.coverageType || item)}</span>`).join("")}</div></article>`;
}

function metric(label, value) {
  return `<article class="data-card"><span class="meta-label">${esc(label)}</span><strong>${esc(formatNumber(value || 0))}</strong></article>`;
}

function card(label, value) {
  return `<article class="data-card"><p class="eyebrow">${esc(label)}</p><h3>${esc(value || "Not recorded")}</h3></article>`;
}

function listCard(label, items = []) {
  const values = (items || []).filter(Boolean);
  return `<article class="data-card"><p class="eyebrow">${esc(label)}</p><h3>${values.length || "No"} item(s)</h3><p>${esc(values.join(", ") || "Not recorded")}</p></article>`;
}

function warningCard(label, value) {
  return `<article class="data-card"><p class="eyebrow">${esc(label)}</p><h3>${esc(value)}</h3></article>`;
}

function comparisonFact(label, value) {
  return `<p><strong>${esc(label)}:</strong> ${esc(value || "not recorded")}</p>`;
}

function option(value, current) {
  return `<option value="${esc(value)}" ${current === value ? "selected" : ""}>${esc(title(value))}</option>`;
}

function applyFilters(records, filters = {}) {
  return records.filter(entity => {
    if (filters.entityType && entity.entityType !== filters.entityType) return false;
    if (filters.domain && entity.classification?.domain !== filters.domain && entity.classification?.serviceDomain !== filters.domain) return false;
    if (filters.status && ![entity.classification?.maturity, entity.classification?.operationalStatus, entity.classification?.status, entity.classification?.availability].includes(filters.status)) return false;
    return true;
  });
}

function entityOptions(universe = {}) {
  const collections = ["settlements", "organizations", "characters", "conflicts", "documents", "historicalEvents", "factions", "storyPremises"];
  return collections.flatMap(key => (universe[key] || []).map(unwrap).filter(Boolean)).map(entity => ({
    id: entity.id,
    entityType: entity.entityType,
    label: entity.name?.full || entity.identity?.name || entity.name || entity.title || entity.id
  })).sort((a, b) => a.label.localeCompare(b.label));
}

function technologyRecords(universe = {}) {
  return ["technologies", "infrastructureSystems", "technicalStandards", "researchPrograms", "technicalFacilities"].flatMap(key => (universe[key] || []).map(unwrap).filter(Boolean));
}

function count(records, entityType) {
  return records.filter(item => item.entityType === entityType).length;
}

function unwrap(record) {
  if (!record) return null;
  if (record.id && record.entityType) return record;
  return record.entity || record.technology || record.infrastructureSystem || record.technicalStandard || record.researchProgram || record.technicalFacility || record;
}

function title(value) {
  return String(value || "").replace(/([A-Z])/g, " $1").replace(/[-_]+/g, " ").replace(/\b\w/g, char => char.toUpperCase()).trim();
}
