import { esc, formatNumber, titleCase } from "../../shared/dom.js";
import { ATLAS_CATEGORIES, KNOWLEDGE_VIEWS, SPOILER_LEVELS, WORLD_BIBLE_PROFILES, atlasMarkdown, atlasArticleMarkdown, worldBibleMarkdown, searchAtlas } from "./generate.js";

export function renderAtlasHome(atlas, filters = {}) {
  const featured = atlas.index.items.filter(item => atlas.profile.featuredEntityIds.includes(item.entityId)).slice(0, 8);
  const majorSystems = atlas.index.items.filter(item => item.entityType === "star-system").slice(0, 6);
  const majorSettlements = atlas.index.items.filter(item => item.entityType === "settlement").slice(0, 6);
  const majorFactions = atlas.index.items.filter(item => item.entityType === "faction").slice(0, 6);
  const activeConflicts = atlas.index.items.filter(item => item.entityType === "conflict" && !/resolved|ended|historical/.test(item.status)).slice(0, 6);
  return `
    <section class="module-hero atlas-hero">
      <div>
        <p class="eyebrow">Unified Universe Reference, Navigation, and Presentation System</p>
        <h1>Universe Atlas & Encyclopedia</h1>
        <p class="lede">${esc(atlas.profile.summary)}</p>
        <div class="meta-strip">
          <span class="classification">${esc(atlas.profile.name)}</span>
          <span class="badge">${esc(atlas.filters.branch || atlas.profile.canonBranchId || "canon branch")}</span>
          <span class="badge">${esc(atlas.filters.view || atlas.profile.atlasSettings.defaultKnowledgeView || "author")} view</span>
          <span class="badge">${esc(atlas.filters.date || atlas.profile.defaultDate || "current canon")}</span>
        </div>
      </div>
      ${atlasSearchBoard(filters)}
    </section>
    <section class="panel">
      <h2>Atlas Dashboard</h2>
      <div class="metric-grid">${Object.entries(atlas.metrics).map(([label, value]) => metric(titleCase(label), value)).join("")}</div>
    </section>
    <section class="panel">
      <h2>Atlas Navigation</h2>
      <div class="card-grid">
        ${navCard("Explore Atlas", "Unified browsing with search and filters.", "#/atlas/explore")}
        ${navCard("Browse Encyclopedia", "Alphabetical and category index.", "#/atlas/index")}
        ${navCard("View Maps", "System, settlement, route, and marker views.", "#/atlas/maps")}
        ${navCard("View Timeline", "Historical browsing by era, event, and year.", "#/atlas/timeline")}
        ${navCard("Collections", "Curated exhibits, research folders, and reader guides.", "#/atlas/collections")}
        ${navCard("Glossary", "Terms, names, titles, and auto-indexed references.", "#/atlas/glossary")}
        ${navCard("World Bible", "Compile the universe into a structured reference document.", "#/atlas/world-bible")}
      </div>
    </section>
    <section class="panel"><h2>Featured Entities</h2><div class="entry-grid">${renderAtlasCards(featured)}</div></section>
    <div class="split-layout">
      <section class="panel"><h2>Major Systems</h2><div class="entry-list">${renderAtlasRows(majorSystems)}</div></section>
      <aside class="panel"><h2>Recent Additions</h2><div class="entry-list">${renderAtlasRows(atlas.recentChanges)}</div></aside>
    </div>
    <section class="panel"><h2>Major Settlements</h2><div class="entry-grid">${renderAtlasCards(majorSettlements)}</div></section>
    <section class="panel"><h2>Major Factions and Conflicts</h2><div class="entry-grid">${renderAtlasCards(majorFactions.concat(activeConflicts))}</div></section>
    <section class="panel"><h2>Continuity and Coverage</h2><div class="entry-grid">
      ${findingCard("Continuity Findings", atlas.continuity.findings)}
      ${findingCard("Underdeveloped Areas", atlas.coverage.underdeveloped)}
      ${findingCard("Unresolved References", atlas.continuity.unresolvedReferences)}
      ${findingCard("Quality Audit", atlas.coverage.findings)}
    </div></section>
  `;
}

export function renderAtlasExplore(atlas, filters = {}) {
  const results = searchAtlas(atlas.index, filters.query || "", filters);
  return `
    <section class="org-header atlas-header">
      <div class="org-logo atlas-seal">${atlasSeal()}</div>
      <div class="org-title">
        <p class="eyebrow">atlas explore / ${esc(filters.query || "all indexed records")}</p>
        <h1>Explore Atlas</h1>
        <p class="lede">Search and filter the rebuilt Atlas index without duplicating source module data.</p>
        <div class="meta-strip"><span class="classification">${results.length} result(s)</span><span class="badge">${atlas.index.items.length} indexed</span><span class="badge">${esc(filters.view || "author")} view</span></div>
      </div>
      <div class="action-row">
        <button class="primary-button" data-action="save-atlas-view" type="button">Save View</button>
        <button class="ghost-button" data-action="export-atlas-json" type="button">JSON</button>
        <button class="ghost-button" data-action="export-atlas-md" type="button">Markdown</button>
        <button class="ghost-button" data-action="export-atlas-html" type="button">Printable</button>
      </div>
    </section>
    <section class="panel">${atlasSearchBoard(filters)}</section>
    <section class="panel"><h2>Search Results</h2><div class="entry-list">${renderAtlasRows(results)}</div></section>
    <section class="panel"><h2>Grouped By Category</h2><div class="entry-grid">${ATLAS_CATEGORIES.map(cat => categoryCard(cat, atlas.index.byCategory[cat.id] || 0)).join("")}</div></section>
  `;
}

export function renderAtlasIndex(atlas, filters = {}) {
  const letters = Object.keys(atlas.index.byLetter).sort();
  const items = searchAtlas(atlas.index, filters.query || "", filters);
  return `
    <section class="panel">
      <p class="eyebrow">Encyclopedia index</p>
      <h1>Atlas Index</h1>
      <p class="lede">Alphabetical and category browsing across systems, settlements, organizations, characters, factions, conflicts, documents, history, relationships, and premises.</p>
      <div class="letter-nav" aria-label="Alphabetical index">${letters.map(letter => `<a href="#atlas-letter-${esc(letter)}">${esc(letter)}</a>`).join("")}</div>
    </section>
    <section class="panel"><h2>Categories</h2><div class="entry-grid">${ATLAS_CATEGORIES.map(cat => categoryCard(cat, atlas.index.byCategory[cat.id] || 0)).join("")}</div></section>
    <section class="panel"><h2>A-Z Entries</h2>${letters.map(letter => `<section id="atlas-letter-${esc(letter)}" class="atlas-letter"><h3>${esc(letter)}</h3><div class="entry-list">${renderAtlasRows(items.filter(item => item.title.toUpperCase().startsWith(letter)))}</div></section>`).join("")}</section>
  `;
}

export function renderAtlasCategory(atlas, categoryId) {
  const category = ATLAS_CATEGORIES.find(item => item.id === categoryId) || { id: categoryId, label: titleCase(categoryId), description: "Atlas category." };
  const items = atlas.index.items.filter(item => item.category === categoryId);
  return `
    <section class="org-header atlas-header">
      <div class="org-logo atlas-seal">${atlasSeal()}</div>
      <div class="org-title">
        <p class="eyebrow">atlas category</p>
        <h1>${esc(category.label)}</h1>
        <p class="lede">${esc(category.description)}</p>
        <div class="meta-strip"><span class="classification">${items.length} indexed</span><span class="badge">cards</span><span class="badge">table</span><span class="badge">map where relevant</span></div>
      </div>
      <div class="action-row"><a class="ghost-button" href="#/atlas/index">Back To Index</a></div>
    </section>
    <section class="panel"><h2>Featured</h2><div class="entry-grid">${renderAtlasCards(items.slice(0, 8))}</div></section>
    <section class="panel"><h2>Table View</h2><div class="entry-list">${renderAtlasRows(items)}</div></section>
  `;
}

export function renderAtlasArticle(article) {
  if (!article) return `<section class="panel"><p class="eyebrow">Atlas Article</p><h1>Article Not Found</h1><p>No indexed Atlas entity matches that route.</p></section>`;
  const item = article.item;
  return `
    <section class="breadcrumbs" aria-label="Atlas breadcrumbs">${article.breadcrumbs.map(crumb => `<a href="${esc(crumb.route)}">${esc(crumb.label)}</a>`).join("<span>/</span>")}</section>
    <section class="org-header atlas-header">
      <div class="org-logo atlas-seal">${atlasSeal()}</div>
      <div class="org-title">
        <p class="eyebrow">${esc(titleCase(item.entityType))} / ${esc(item.primaryLocation || "location not recorded")}</p>
        <h1>${esc(item.title)}</h1>
        <p class="lede">${esc(article.summary.short)}</p>
        <div class="meta-strip">
          <span class="classification">${esc(titleCase(item.status))}</span>
          <span class="badge">${esc(titleCase(item.canonStatus))}</span>
          <span class="badge">${esc(titleCase(item.importance))}</span>
          <span class="badge">${esc(item.dateRange.start || "date unknown")}</span>
        </div>
      </div>
      <div class="action-row">
        <a class="primary-button" href="${esc(item.sourceRoute)}">Open Source</a>
        <button class="ghost-button" data-action="export-atlas-article-md" data-entity-id="${esc(item.entityId)}" type="button">Markdown</button>
        <button class="ghost-button" data-action="export-atlas-article-html" data-entity-id="${esc(item.entityId)}" type="button">Printable</button>
        <button class="ghost-button" data-action="copy-atlas-link" data-route="${esc(item.route)}" type="button">Copy Link</button>
      </div>
    </section>
    <div class="split-layout">
      <section class="panel"><h2>Key Facts</h2><div class="entry-grid">${article.keyFacts.map(fact => card(fact.label, fact.value)).join("")}</div></section>
      <aside class="panel"><h2>Summary Trace</h2><div class="entry-list">
        ${card("Knowledge View", article.summarySource.knowledgeView)}
        ${card("Source Updated", article.summarySource.sourceUpdatedAt)}
        ${card("Generator", article.summarySource.generatorVersion)}
        ${card("Stale", article.summarySource.stale ? "yes" : "no")}
      </div></aside>
    </div>
    <section class="panel"><h2>Article Introduction</h2><p>${esc(article.summary.extended)}</p></section>
    <section class="panel"><h2>Relationships</h2><div class="entry-list">${article.relationships.map(text => `<article class="relation-card"><p>${esc(text)}</p></article>`).join("") || `<div class="empty-state">No relationship summaries yet.</div>`}</div><div class="action-row"><a class="ghost-button" href="#/relationships?focus=${encodeURIComponent(item.entityId)}">Open In Relationship Explorer</a></div></section>
    <section class="panel"><h2>Documents, History, and Premises</h2><div class="entry-grid">
      ${sectionList("Documents", article.documents)}
      ${sectionList("Historical Events", article.events)}
      ${sectionList("Story Premises", article.premises)}
    </div></section>
    <section class="panel"><h2>Maps and Spatial Context</h2>${renderMapList(article.maps)}</section>
    <section class="panel"><h2>See Also</h2><div class="entry-grid">${renderAtlasCards(article.seeAlso)}</div></section>
    <section class="panel"><h2>Article Template</h2><div class="meta-strip">${article.articleTemplate.sections.map(section => `<span class="badge">${esc(section)}</span>`).join("")}</div></section>
    <section class="panel"><h2>Continuity and Coverage</h2><div class="entry-grid">${findingCard("Continuity", article.continuity)}${findingCard("Coverage", article.coverage)}</div></section>
  `;
}

export function renderAtlasMaps(atlas) {
  return `
    <section class="panel"><p class="eyebrow">Geographic Atlas</p><h1>Maps</h1><p class="lede">Schematic maps are generated as presentation layers from source entities, markers, routes, regions, and relationships.</p></section>
    <section class="panel"><h2>Map Gallery</h2><div class="entry-grid">${atlas.maps.map(map => mapCard(map, atlas.index)).join("")}</div></section>
    <section class="panel"><h2>Accessible Map Alternative</h2><div class="entry-list">${atlas.maps.map(map => `<article class="data-card"><p class="eyebrow">${esc(map.mapType)} / ${map.layers.map(layer => layer.label).join(", ")}</p><h3>${esc(map.title)}</h3><p>${esc(map.markerIds.length)} marker(s), ${esc(map.routeIds.length)} route(s), ${esc(map.regionIds.length)} region(s). Parent: ${esc(map.parentEntityId)}.</p></article>`).join("")}</div></section>
  `;
}

export function renderAtlasTimeline(atlas, year = "") {
  const events = year ? atlas.timeline.events.filter(event => String(event.sortYear) === String(year)) : atlas.timeline.events;
  return `
    <section class="panel"><p class="eyebrow">Historical Atlas</p><h1>${year ? esc(year) : "Timeline"}</h1><p class="lede">Move from places and entities into their historical context, with branch and date filters preserved in the Atlas view.</p></section>
    <section class="panel"><h2>Era and Year Index</h2><div class="entry-grid">
      ${Object.entries(atlas.timeline.years).slice(0, 24).map(([date, count]) => `<a class="data-card" href="#/atlas/year/${encodeURIComponent(date)}"><p class="eyebrow">year</p><h3>${esc(date)}</h3><p>${count} event(s)</p></a>`).join("") || `<div class="empty-state">No dated events yet.</div>`}
    </div></section>
    <section class="panel"><h2>Events</h2><div class="timeline-ribbon">${events.map(event => `<article class="timeline-event-card"><div class="timeline-date">${esc(event.displayDate)}</div><div><h3>${esc(event.title)}</h3><p>${esc(event.summary)}</p><div class="meta-strip">${event.entityIds.slice(0, 5).map(id => `<span class="badge">${esc(id)}</span>`).join("")}</div></div></article>`).join("") || `<div class="empty-state">No events for this view.</div>`}</div></section>
  `;
}

export function renderAtlasCollections(atlas) {
  const collections = atlas.index.items.filter(item => item.entityType === "atlasCollection");
  return `
    <section class="panel"><p class="eyebrow">Atlas Collections</p><h1>Collections</h1><p class="lede">Curated reference sets, exhibits, reader guides, research folders, and story project groupings.</p></section>
    <section class="panel"><h2>Saved Collections</h2><div class="entry-grid">${renderAtlasCards(collections)}</div></section>
    <section class="panel"><h2>Suggested Collections</h2><div class="entry-grid">
      ${suggestedCollection("Major Characters", atlas.index.items.filter(item => item.entityType === "character"))}
      ${suggestedCollection("Political Factions", atlas.index.items.filter(item => item.entityType === "faction"))}
      ${suggestedCollection("Historical Sources", atlas.index.items.filter(item => item.entityType === "document" || item.entityType === "historicalEvent"))}
      ${suggestedCollection("Reader Primer", atlas.index.items.filter(item => ["star-system", "settlement", "faction", "conflict"].includes(item.entityType)).slice(0, 12))}
    </div></section>
  `;
}

export function renderAtlasGlossary(atlas) {
  return `
    <section class="panel"><p class="eyebrow">Glossary</p><h1>Terms and Names</h1><p class="lede">Automatic glossary entries and custom encyclopedia concepts share links back to Atlas articles.</p></section>
    <section class="panel"><h2>Glossary Entries</h2><div class="entry-list">${atlas.glossary.map(entry => `<article class="relation-card"><p class="eyebrow">${esc(entry.entryType)}${entry.automatic ? " / automatic" : ""}</p><h3>${esc(entry.term)}</h3><p>${esc(entry.summary || "No summary yet.")}</p><div class="meta-strip">${(entry.relatedEntityIds || []).slice(0, 4).map(id => `<a class="badge" href="#/atlas/entity/${encodeURIComponent(id)}">${esc(id)}</a>`).join("")}</div></article>`).join("") || `<div class="empty-state">No glossary entries yet.</div>`}</div></section>
  `;
}

export function renderWorldBible(worldBible) {
  return `
    <section class="org-header atlas-header">
      <div class="org-logo atlas-seal">${atlasSeal()}</div>
      <div class="org-title">
        <p class="eyebrow">World Bible / ${esc(titleCase(worldBible.profile))}</p>
        <h1>${esc(worldBible.title)}</h1>
        <p class="lede">A generated reference package assembled from Atlas index records and source summaries.</p>
      </div>
      <div class="action-row">
        <button class="primary-button" data-action="export-world-bible-md" type="button">Markdown</button>
        <button class="ghost-button" data-action="export-world-bible-json" type="button">JSON</button>
        <button class="ghost-button" data-action="export-world-bible-html" type="button">Printable</button>
      </div>
    </section>
    <section class="panel"><h2>World Bible Profiles</h2><div class="meta-strip">${WORLD_BIBLE_PROFILES.map(profile => `<span class="badge">${esc(titleCase(profile))}</span>`).join("")}</div></section>
    ${worldBible.sections.map(section => `<section class="panel"><h2>${esc(section.title)}</h2><div class="entry-list">${section.items.slice(0, 40).map(item => `<article class="data-card"><h3>${esc(item.title || item.name || item.message || item.id)}</h3><p>${esc(item.oneLine || item.summary || item.findingType || "")}</p></article>`).join("") || `<div class="empty-state">No items for this section.</div>`}</div></section>`).join("")}
  `;
}

export function atlasHtml(atlas) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(atlas.profile.name)} Atlas</title><style>body{font:16px Georgia,serif;background:#f4f0e8;color:#111;margin:0;padding:32px}.page{max-width:960px;margin:auto}.entry{border-top:1px solid #999;padding:12px 0}.meta{font:12px monospace;text-transform:uppercase}@media print{body{padding:0}.page{max-width:none;padding:24px}}</style></head><body><article class="page"><h1>${esc(atlas.profile.name)} Atlas</h1><p>${esc(atlas.profile.summary)}</p>${atlas.index.items.slice(0, 200).map(item => `<section class="entry"><p class="meta">${esc(item.entityType)} / ${esc(item.status)} / ${esc(item.canonStatus)}</p><h2>${esc(item.title)}</h2><p>${esc(item.oneLine)}</p></section>`).join("")}</article></body></html>`;
}

export function articleHtml(article) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(article.item.title)}</title><style>body{font:16px Georgia,serif;background:#f4f0e8;color:#111;margin:0;padding:32px}.page{max-width:900px;margin:auto}.meta{font:12px monospace;text-transform:uppercase}.fact{border-top:1px solid #999;padding:10px 0}@media print{body{padding:0}.page{max-width:none;padding:24px}}</style></head><body><article class="page"><p class="meta">${esc(article.item.entityType)} / ${esc(article.item.status)} / ${esc(article.item.canonStatus)}</p><h1>${esc(article.item.title)}</h1><p>${esc(article.summary.extended)}</p><h2>Key Facts</h2>${article.keyFacts.map(fact => `<div class="fact"><strong>${esc(fact.label)}</strong><br>${esc(fact.value)}</div>`).join("")}<h2>See Also</h2>${article.seeAlso.map(item => `<p>${esc(item.title)} (${esc(item.entityType)})</p>`).join("")}</article></body></html>`;
}

export function worldBibleHtml(worldBible) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(worldBible.title)}</title><style>body{font:16px Georgia,serif;background:#f4f0e8;color:#111;margin:0;padding:32px}.page{max-width:960px;margin:auto}.entry{border-top:1px solid #999;padding:10px 0}@media print{body{padding:0}.page{max-width:none;padding:24px}}</style></head><body><article class="page"><h1>${esc(worldBible.title)}</h1>${worldBible.sections.map(section => `<h2>${esc(section.title)}</h2>${section.items.slice(0, 80).map(item => `<div class="entry"><strong>${esc(item.title || item.name || item.message || item.id)}</strong><p>${esc(item.oneLine || item.summary || item.findingType || "")}</p></div>`).join("")}`).join("")}</article></body></html>`;
}

export { atlasMarkdown, atlasArticleMarkdown, worldBibleMarkdown };

function atlasSearchBoard(filters = {}) {
  return `<div class="search-board">
    <div class="field-grid">
      <label>Search Atlas
        <input id="atlasQuery" type="search" value="${esc(filters.query || "")}" placeholder="Port Meridian, air crisis, factions">
      </label>
      <label>Category
        <select id="atlasCategory"><option value="">All categories</option>${ATLAS_CATEGORIES.map(cat => `<option value="${esc(cat.id)}" ${filters.category === cat.id ? "selected" : ""}>${esc(cat.label)}</option>`).join("")}</select>
      </label>
      <label>Knowledge view
        <select id="atlasView">${KNOWLEDGE_VIEWS.map(view => `<option value="${esc(view)}" ${filters.view === view ? "selected" : ""}>${esc(titleCase(view))}</option>`).join("")}</select>
      </label>
      <label>Spoiler level
        <select id="atlasSpoiler">${SPOILER_LEVELS.map(level => `<option value="${esc(level)}" ${filters.spoiler === level ? "selected" : ""}>${esc(titleCase(level))}</option>`).join("")}</select>
      </label>
    </div>
    <div class="action-row">
      <button class="primary-button" data-action="search-atlas" type="button">Search Atlas</button>
      <a class="ghost-button" href="#/atlas/explore">Explore Atlas</a>
      <a class="ghost-button" href="#/atlas/maps">View Maps</a>
      <a class="ghost-button" href="#/atlas/world-bible">Open World Bible</a>
    </div>
  </div>`;
}

function renderAtlasCards(items = []) {
  if (!items.length) return `<div class="empty-state">No Atlas entries for this view.</div>`;
  return items.map(item => `
    <article class="entry-card atlas-entry">
      <div class="mini-atlas" aria-hidden="true"><span></span><span></span><span></span></div>
      <div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.oneLine || item.summary || "Indexed Atlas article.")}</p>
        <div class="meta-strip"><span class="badge">${esc(titleCase(item.entityType))}</span><span class="badge">${esc(titleCase(item.status))}</span><span class="badge">${esc(titleCase(item.canonStatus))}</span></div>
      </div>
      <a class="card-link" href="${esc(item.route)}" aria-label="Open Atlas article ${esc(item.title)}"></a>
    </article>
  `).join("");
}

function renderAtlasRows(items = []) {
  if (!items.length) return `<div class="empty-state">No Atlas entries for this view.</div>`;
  return items.map(item => `
    <article class="relation-card atlas-row">
      <p class="eyebrow">${esc(titleCase(item.entityType))} / ${esc(titleCase(item.status))} / ${esc(titleCase(item.canonStatus))}</p>
      <h3>${esc(item.title)}</h3>
      <p>${esc(item.oneLine || item.summary || "Indexed Atlas article.")}</p>
      <div class="meta-strip"><span class="badge">${esc(item.primaryLocation || "location not recorded")}</span><span class="badge">${item.relationshipIds?.length || 0} relationship(s)</span><span class="badge">${item.documentIds?.length || 0} document(s)</span></div>
      <a class="card-link" href="${esc(item.route)}" aria-label="Open Atlas article ${esc(item.title)}"></a>
    </article>
  `).join("");
}

function mapCard(map, index) {
  const markers = map.markerIds.map(id => index.items.find(item => item.entityId === id)?.title || id).slice(0, 8);
  return `<article class="data-card atlas-map-card">
    <p class="eyebrow">${esc(titleCase(map.mapType))}</p>
    <h3>${esc(map.title)}</h3>
    <div class="atlas-map" role="img" aria-label="${esc(map.title)} schematic map with ${map.markerIds.length} markers">${markers.map((marker, i) => `<span style="--x:${18 + (i * 19) % 68}%;--y:${22 + (i * 29) % 58}%">${esc(String(i + 1))}</span>`).join("")}</div>
    <p>${esc(markers.join(", ") || "No markers yet.")}</p>
    <div class="meta-strip">${map.layers.slice(0, 5).map(layer => `<span class="badge">${esc(layer.label)}</span>`).join("")}</div>
  </article>`;
}

function renderMapList(maps = []) {
  if (!maps.length) return `<div class="empty-state">No maps reference this entity yet.</div>`;
  return `<div class="entry-grid">${maps.map(map => `<article class="data-card"><p class="eyebrow">${esc(map.mapType)}</p><h3>${esc(map.title)}</h3><p>${map.markerIds.length} marker(s), ${map.routeIds.length} route(s).</p></article>`).join("")}</div>`;
}

function categoryCard(category, count) {
  return `<a class="data-card" href="#/atlas/category/${encodeURIComponent(category.id)}"><p class="eyebrow">Category</p><h3>${esc(category.label)}</h3><p>${esc(category.description)} ${count} indexed.</p></a>`;
}

function sectionList(label, items = []) {
  return `<article class="data-card"><p class="eyebrow">${esc(label)}</p><h3>${items.length} linked</h3><p>${esc(items.slice(0, 5).map(item => item.title).join(", ") || "None linked yet.")}</p></article>`;
}

function findingCard(title, findings = []) {
  if (!findings?.length) return `<article class="data-card"><p class="eyebrow">${esc(title)}</p><h3>No current findings</h3><p>This area is clean for the current Atlas view.</p></article>`;
  return `<article class="data-card warning-card"><p class="eyebrow">${esc(title)}</p><h3>${findings.length} finding(s)</h3><p>${esc(findings.slice(0, 4).map(item => item.message || item.coverageType || item.findingType).join(" "))}</p></article>`;
}

function suggestedCollection(title, items = []) {
  return `<article class="data-card"><p class="eyebrow">Suggested Collection</p><h3>${esc(title)}</h3><p>${items.length} candidate item(s).</p><div class="meta-strip">${items.slice(0, 5).map(item => `<span class="badge">${esc(item.title)}</span>`).join("")}</div></article>`;
}

function navCard(title, summary, route) {
  return `<a class="document-card" href="${esc(route)}"><h3>${esc(title)}</h3><p>${esc(summary)}</p></a>`;
}

function card(title, body) {
  return `<article class="data-card"><p class="eyebrow">${esc(title)}</p><h3>${esc(body || "Not recorded")}</h3></article>`;
}

function metric(label, value) {
  return `<article class="data-card"><span class="meta-label">${esc(label)}</span><strong>${esc(typeof value === "number" ? formatNumber(value) : value)}</strong></article>`;
}

function atlasSeal() {
  return `<svg viewBox="0 0 144 144" role="img" aria-label="Atlas seal"><circle cx="72" cy="72" r="54" fill="transparent" stroke="var(--accent)" stroke-width="7"></circle><path d="M30 73h84M72 20c18 21 18 83 0 104M72 20c-18 21-18 83 0 104" fill="transparent" stroke="var(--line)" stroke-width="5"></path><circle cx="72" cy="72" r="11" fill="var(--accent-2)"></circle></svg>`;
}
