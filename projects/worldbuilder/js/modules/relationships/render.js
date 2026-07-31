import { esc, formatNumber, titleCase } from "../../shared/dom.js";
import { fitText } from "../../shared/svg.js";
import { relationshipMarkdown, RELATIONSHIP_TYPES } from "./generate.js";

const RELATIONSHIP_TABS = ["Overview", "Network", "Relationships", "Evidence", "Path", "Suggestions", "Warnings", "Hubs", "Export"];

export { RELATIONSHIP_TABS, relationshipMarkdown };

export function renderRelationshipsHome(graph, savedViews = [], entityOptions = []) {
  return `
    <section class="module-hero relationship-hero">
      <div>
        <p class="eyebrow">Universe Network and Connection Explorer</p>
        <h1>Relationships</h1>
        <p class="lede">Inspect how people, institutions, places, conflicts, records, history, and power connect. Relationship meaning, visibility, evidence, time, and confidence matter as much as the graph shape.</p>
      </div>
      <div class="search-board">
        <div class="field-grid">
          <label>Focus on entity
            <select id="relationshipFocus">
              <option value="">Entire universe</option>
              ${entityOptions.map(entity => `<option value="${esc(entity.id)}">${esc(entity.label)} (${esc(entity.entityType)})</option>`).join("")}
            </select>
          </label>
          <label>Relationship family
            <select id="relationshipFamily">
              <option value="">All families</option>
              ${[...new Set(RELATIONSHIP_TYPES.map(item => item.family))].map(family => `<option value="${esc(family)}">${esc(titleCase(family))}</option>`).join("")}
            </select>
          </label>
          <label>From
            <select id="relationshipFrom">
              <option value="">Choose source</option>
              ${entityOptions.map(entity => `<option value="${esc(entity.id)}">${esc(entity.label)}</option>`).join("")}
            </select>
          </label>
          <label>To
            <select id="relationshipTo">
              <option value="">Choose target</option>
              ${entityOptions.map(entity => `<option value="${esc(entity.id)}">${esc(entity.label)}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="action-row">
          <button class="primary-button" data-action="explore-relationships" type="button">Explore Universe Network</button>
          <button class="ghost-button" data-action="focus-relationships" type="button">Focus on Entity</button>
          <button class="ghost-button" data-action="find-relationship-path" type="button">Find Connection Between Two Entities</button>
          <button class="ghost-button" data-action="new-relationship" type="button">Create Relationship</button>
          <button class="ghost-button" data-action="validate-relationships" type="button">Validate Relationship Data</button>
        </div>
      </div>
    </section>
    <section class="panel">
      <h2>Relationship Overview</h2>
      <div class="metric-grid">
        ${metric("Total Relationships", graph.metrics.totalRelationships)}
        ${metric("Active", graph.metrics.activeRelationships)}
        ${metric("Historical", graph.metrics.historicalRelationships)}
        ${metric("Hidden", graph.metrics.hiddenRelationships)}
        ${metric("Disputed", graph.metrics.disputedRelationships)}
        ${metric("Unsupported", graph.metrics.unsupportedRelationships)}
        ${metric("Unresolved References", graph.metrics.unresolvedReferences)}
        ${metric("Duplicates", graph.metrics.duplicateRelationships)}
        ${metric("Isolated Entities", graph.metrics.isolatedEntities)}
        ${metric("Major Hubs", graph.metrics.majorNetworkHubs)}
        ${metric("Alternate Branch Links", graph.metrics.alternateBranchRelationships)}
      </div>
    </section>
    <section class="panel">
      <h2>Suggested Entry Points</h2>
      <div class="entry-grid">
        ${entry("Character Network", "personal and institutional links", "character")}
        ${entry("Organization Network", "employment, operations, influence, contracts", "organization")}
        ${entry("Faction Network", "membership, alliances, rivalries, influence", "faction")}
        ${entry("Conflict Network", "participants, victims, sponsors, documents", "conflict")}
        ${entry("Settlement Network", "location, government, districts, infrastructure", "settlement")}
        ${entry("Document Evidence Network", "authors, recipients, claims, references", "document")}
        ${entry("Historical Relationship View", "event-created and date-filtered ties", "historical")}
        ${entry("Find a Path", "connection between distant entities", "path")}
      </div>
    </section>
    <section class="panel">
      <h2>Relationship Warnings</h2>
      <div class="entry-grid">${renderWarnings(graph.warnings.slice(0, 6))}</div>
    </section>
    <section class="panel">
      <h2>Saved Views</h2>
      <div class="entry-grid">${savedViews.length ? savedViews.map(view => `<article class="data-card"><h3>${esc(view.name || view.seed)}</h3><p>${esc(view.seed || view.id)}</p></article>`).join("") : `<div class="empty-state">No saved relationship views yet.</div>`}</div>
    </section>
  `;
}

export function renderRelationshipExplorer(graph, activeTab = "Overview", path = []) {
  return `
    <section class="org-header relationship-header">
      <div class="org-logo relationship-seal">${relationshipSeal(graph)}</div>
      <div class="org-title">
        <p class="eyebrow">relationship explorer / ${esc(graph.focusEntityId || "universe network")}</p>
        <h1>Relationship Network</h1>
        <div class="meta-strip">
          <span class="classification">${graph.relationships.length} visible relationships</span>
          <span class="badge">${graph.nodes.length} nodes</span>
          <span class="badge">${graph.warnings.length} warning(s)</span>
          <span class="badge">${graph.suggestions.length} suggestion(s)</span>
        </div>
      </div>
      <div class="action-row">
        <button class="primary-button" data-action="save-relationship-view" type="button">Save View</button>
        <button class="ghost-button" data-action="validate-relationships" type="button">Validate</button>
        <button class="ghost-button" data-action="export-relationships-json" type="button">JSON</button>
        <button class="ghost-button" data-action="export-relationships-md" type="button">Markdown</button>
        <button class="ghost-button" data-action="export-relationships-html" type="button">Printable</button>
      </div>
    </section>
    <nav class="tabs" aria-label="Relationship explorer sections">
      ${RELATIONSHIP_TABS.map(tab => `<button class="tab-button ${tab === activeTab ? "active" : ""}" data-action="relationship-tab" data-tab="${tab}" type="button">${tab}</button>`).join("")}
    </nav>
    <section class="tab-panel">${renderRelationshipTab(graph, activeTab, path)}</section>
  `;
}

export function renderRelationshipTab(graph, tab, path = []) {
  const map = {
    Overview: renderOverview,
    Network: renderNetwork,
    Relationships: renderRelationshipList,
    Evidence: renderEvidence,
    Path: g => renderPath(g, path),
    Suggestions: renderSuggestions,
    Warnings: renderAllWarnings,
    Hubs: renderHubs,
    Export: renderExport
  };
  return (map[tab] || renderOverview)(graph);
}

export function renderRelationshipDetail(relationship, graph) {
  if (!relationship) return `<section class="panel"><p class="eyebrow">Relationship</p><h1>Relationship Not Found</h1><p>No relationship matches that route.</p></section>`;
  return `
    <section class="org-header relationship-header">
      <div class="org-logo relationship-seal">${relationshipIcon(relationship)}</div>
      <div class="org-title">
        <p class="eyebrow">${esc(relationship.relationshipFamily)} / ${esc(relationship.relationshipType)}</p>
        <h1>${esc(relationship.label)}</h1>
        <p class="lede">${esc(relationship.summary)}</p>
        <div class="meta-strip">
          <span class="classification">${esc(relationship.status)}</span>
          <span class="badge">${esc(relationship.visibility)}</span>
          <span class="badge">${esc(relationship.confidence)}</span>
          <span class="badge">${esc(relationship.strength.label)}</span>
        </div>
      </div>
      <div class="action-row"><button class="ghost-button" data-action="go-relationships" type="button">Back To Relationships</button></div>
    </section>
    <div class="split-layout">
      <section class="panel"><h2>Entities</h2><div class="entry-grid">
        ${card("Source", `${labelFor(graph, relationship.sourceEntityId)} (${relationship.sourceEntityType})`)}
        ${card("Target", `${labelFor(graph, relationship.targetEntityId)} (${relationship.targetEntityType})`)}
        ${card("Direction", relationship.directionality)}
        ${card("Inverse", relationship.inverseType || "none")}
      </div></section>
      <aside class="panel"><h2>Truth Layer</h2><div class="entry-grid">
        ${card("Canon", relationship.canonStatus)}
        ${card("Visibility", relationship.visibility)}
        ${card("Confidence", relationship.confidence)}
        ${card("Branch", relationship.branchId || "canon")}
      </div></aside>
    </div>
    <section class="panel"><h2>Evidence</h2>${evidenceBlocks(relationship)}</section>
    <section class="panel"><h2>Raw Relationship</h2><pre class="code-block">${esc(JSON.stringify(relationship, null, 2))}</pre></section>
  `;
}

function renderOverview(graph) {
  return `<div class="split-layout">
    <section class="panel"><h2>Network Health</h2><div class="metric-grid">
      ${Object.entries(graph.metrics).map(([label, value]) => metric(titleCase(label.replace(/([A-Z])/g, " $1")), value)).join("")}
    </div></section>
    <aside class="panel"><h2>Domain Rules</h2><div class="entry-list">
      ${card("Meaning First", "Relationship type, evidence, direction, visibility, confidence, and chronology are first-class data.")}
      ${card("No Silent Creation", "Implied relationships are staged as suggestions for review.")}
      ${card("Knowledge Views", "Public and secret filters avoid mixing hidden canon into limited perspectives.")}
    </div></aside>
  </div>
  <section class="panel"><h2>Major Hubs</h2><div class="entry-grid">${renderNodeCards(graph.hubs)}</div></section>`;
}

function renderNetwork(graph) {
  return `<section class="panel"><h2>Network Map</h2>${networkSvg(graph)}</section>
  <section class="panel"><h2>Text Alternative</h2><div class="entry-list">${graph.edges.slice(0, 60).map(edge => `<article class="relation-card"><p class="eyebrow">${esc(edge.family)} / ${esc(edge.type)} / ${esc(edge.visibility)}</p><h3>${esc(edge.sourceLabel)} -> ${esc(edge.targetLabel)}</h3><p>${esc(edge.label)}. Confidence: ${esc(edge.confidence)}. Strength: ${edge.strength}/100.</p></article>`).join("") || `<div class="empty-state">No visible relationships for this view.</div>`}</div></section>`;
}

function renderRelationshipList(graph) {
  return `<section class="panel"><h2>Relationships</h2><div class="entry-list">${graph.relationships.map(rel => `
    <article class="relation-card relationship-row">
      <p class="eyebrow">${esc(rel.relationshipFamily)} / ${esc(rel.relationshipType)} / ${esc(rel.visibility)}</p>
      <h3>${esc(labelFor(graph, rel.sourceEntityId))} -> ${esc(labelFor(graph, rel.targetEntityId))}</h3>
      <p>${esc(rel.label)}. ${esc(rel.summary)}</p>
      <div class="meta-strip"><span class="badge">${esc(rel.status)}</span><span class="badge">${esc(rel.confidence)}</span><span class="badge">${esc(rel.strength.label)}</span></div>
      <a class="card-link" href="#/relationships/${encodeURIComponent(rel.id)}" aria-label="Open relationship ${esc(rel.label)}"></a>
    </article>
  `).join("") || `<div class="empty-state">No relationships in this view.</div>`}</div></section>`;
}

function renderEvidence(graph) {
  const supported = graph.relationships.filter(item => item.evidence.documentIds.length || item.evidence.eventIds.length || item.evidence.conflictIds.length);
  return `<section class="panel"><h2>Evidence Network</h2><div class="entry-grid">${supported.map(rel => `<article class="data-card">
    <p class="eyebrow">${esc(rel.confidence)} / ${esc(rel.visibility)}</p>
    <h3>${esc(rel.label)}</h3>
    ${evidenceBlocks(rel)}
  </article>`).join("") || `<div class="empty-state">No document, event, or conflict evidence attached yet.</div>`}</div></section>`;
}

function renderPath(graph, path) {
  if (!path.length) return `<section class="panel"><h2>Path</h2><div class="empty-state">Choose two entities on the landing page or use #/relationships/path?from=...&to=... to find a connection.</div></section>`;
  return `<section class="panel"><h2>Connection Path</h2><div class="timeline-ribbon">${path.map(rel => `
    <article class="timeline-event-card">
      <div class="timeline-date">${esc(rel.relationshipFamily)}</div>
      <div><p class="eyebrow">${esc(rel.relationshipType)} / ${esc(rel.confidence)}</p><h3>${esc(labelFor(graph, rel.sourceEntityId))} -> ${esc(labelFor(graph, rel.targetEntityId))}</h3><p>${esc(rel.label)}</p></div>
    </article>
  `).join("")}</div></section>`;
}

function renderSuggestions(graph) {
  return `<section class="panel"><h2>Relationship Suggestions</h2><div class="entry-list">${graph.suggestions.map(item => `<article class="data-card">
    <p class="eyebrow">${esc(item.relationship.relationshipFamily)} / ${esc(item.relationship.relationshipType)}</p>
    <h3>${esc(item.title)}</h3>
    <p>${esc(item.summary)}</p>
    <div class="meta-strip"><span class="badge">Create Relationship</span><span class="badge">Review Source</span><span class="badge">Merge With Existing</span></div>
  </article>`).join("") || `<div class="empty-state">No staged suggestions for this view.</div>`}</div></section>`;
}

function renderAllWarnings(graph) {
  return `<section class="panel"><h2>Relationship Warnings</h2><div class="entry-list">${renderWarnings(graph.warnings)}</div></section>`;
}

function renderHubs(graph) {
  return `<section class="panel"><h2>Major Network Hubs</h2><div class="entry-grid">${renderNodeCards(graph.hubs)}</div></section>
  <section class="panel"><h2>Isolated Entities</h2><div class="entry-grid">${renderNodeCards(graph.isolatedEntities.slice(0, 24))}</div></section>`;
}

function renderExport(graph) {
  return `<section class="panel"><h2>Export Relationship View</h2><div class="card-grid">
    <button class="document-card" data-action="export-relationships-json" type="button"><h3>Complete JSON</h3><p>Nodes, edges, warnings, suggestions, and metrics.</p></button>
    <button class="document-card" data-action="export-relationships-md" type="button"><h3>Markdown Dossier</h3><p>Readable relationship report.</p></button>
    <button class="document-card" data-action="export-relationships-html" type="button"><h3>Printable HTML</h3><p>Static report for browser printing.</p></button>
  </div><pre class="code-block">${esc(relationshipMarkdown(graph))}</pre></section>`;
}

function renderWarnings(warnings) {
  return warnings.length ? warnings.map(warning => `<article class="data-card warning-card"><p class="eyebrow">${esc(warning.severity)} / ${esc(warning.warningType)}</p><h3>${esc(warning.message)}</h3><p>${esc(warning.resolutionOptions.join(", "))}</p></article>`).join("") : `<div class="empty-state">No relationship warnings in this view.</div>`;
}

function renderNodeCards(nodes) {
  return nodes.length ? nodes.map(node => `<article class="data-card"><p class="eyebrow">${esc(node.entityType)} / degree ${node.degree}</p><h3>${esc(node.label)}</h3><p>${esc(node.id)}</p></article>`).join("") : `<div class="empty-state">No entities in this category.</div>`;
}

function networkSvg(graph) {
  const nodes = graph.nodes.filter(node => node.degree > 0).sort((a, b) => b.degree - a.degree).slice(0, 18);
  if (!nodes.length) return `<div class="empty-state">No relationships to map yet.</div>`;
  const nodeIds = new Set(nodes.map(node => node.id));
  const edges = graph.edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target)).slice(0, 42);
  const size = 560;
  const center = size / 2;
  const radius = 190;
  // Labels sit outside the ring, so the arc between neighbours is the budget.
  const labelBudget = Math.min(120, (Math.PI * 2 * radius) / nodes.length - 6);
  const positions = new Map(nodes.map((node, index) => {
    const angle = (Math.PI * 2 * index) / nodes.length - Math.PI / 2;
    return [node.id, { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius }];
  }));
  return `<svg class="relationship-map" viewBox="0 0 ${size} ${size}" role="img" aria-label="Relationship network map showing ${nodes.length} connected entities">
    <rect width="${size}" height="${size}" fill="transparent"/>
    ${edges.map(edge => {
      const a = positions.get(edge.source);
      const b = positions.get(edge.target);
      return a && b ? `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="var(--line)" stroke-width="${Math.max(1, edge.strength / 34)}"><title>${esc(edge.label)}</title></line>` : "";
    }).join("")}
    ${nodes.map(node => {
      const pos = positions.get(node.id);
      const nodeRadius = Math.min(28, 8 + node.degree * 2);
      // Push the label to whichever side keeps it inside the frame.
      const below = pos.y >= center;
      const labelY = below ? pos.y + nodeRadius + 14 : pos.y - nodeRadius - 7;
      return `<g tabindex="0">
        <circle cx="${pos.x}" cy="${pos.y}" r="${nodeRadius}" fill="var(--panel)" stroke="var(--accent)" stroke-width="3"><title>${esc(node.label)}: ${node.degree} links</title></circle>
        <text x="${pos.x}" y="${labelY}" text-anchor="middle" fill="var(--text)" font-size="10">${esc(fitText(node.label, labelBudget, 10))}</text>
      </g>`;
    }).join("")}
  </svg>`;
}

function relationshipSeal(graph) {
  return `<svg viewBox="0 0 144 144" role="img" aria-label="Relationship explorer seal"><circle cx="72" cy="72" r="54" fill="transparent" stroke="var(--accent)" stroke-width="7"/><circle cx="44" cy="54" r="10" fill="var(--accent)"/><circle cx="98" cy="50" r="10" fill="var(--accent-2)"/><circle cx="78" cy="98" r="10" fill="var(--accent)"/><path d="M52 56l36-4M49 62l22 28M94 58 82 90" stroke="var(--line)" stroke-width="5"/></svg>`;
}

function relationshipIcon(relationship) {
  return `<svg viewBox="0 0 144 144" role="img" aria-label="${esc(relationship.label)}"><circle cx="44" cy="72" r="22" fill="transparent" stroke="var(--accent)" stroke-width="7"/><circle cx="100" cy="72" r="22" fill="transparent" stroke="var(--accent-2)" stroke-width="7"/><path d="M66 72h12" stroke="var(--text)" stroke-width="7"/></svg>`;
}

function evidenceBlocks(rel) {
  return `<div class="meta-strip">
    <span class="badge">${rel.evidence.documentIds.length} docs</span>
    <span class="badge">${rel.evidence.eventIds.length} events</span>
    <span class="badge">${rel.evidence.conflictIds.length} conflicts</span>
    <span class="badge">${rel.evidence.sourceEntityIds.length} sources</span>
  </div>`;
}

function entry(title, detail, type) {
  return `<article class="entry-card relationship-entry"><div class="mini-relationship" aria-hidden="true"><span></span><span></span></div><div><h3>${esc(title)}</h3><p>${esc(detail)}</p><div class="meta-strip"><span class="badge">${esc(type)}</span></div></div><button type="button" data-action="relationship-entry" data-entry="${esc(type)}" aria-label="${esc(title)}"></button></article>`;
}

function metric(label, value) {
  return `<article class="data-card"><span class="meta-label">${esc(label)}</span><strong>${typeof value === "number" ? formatNumber(value) : esc(value)}</strong></article>`;
}

function card(title, text) {
  return `<article class="data-card"><p class="eyebrow">${esc(title)}</p><h3>${esc(text || "None recorded")}</h3></article>`;
}

function labelFor(graph, id) {
  return graph.nodes.find(node => node.id === id)?.label || id;
}
