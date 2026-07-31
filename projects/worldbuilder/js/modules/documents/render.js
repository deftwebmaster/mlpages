import { esc, titleCase } from "../../shared/dom.js";
import { DOCUMENT_FAMILIES, DOCUMENT_TYPES, documentMarkdown, documentPlainText, documentPrintableHtml } from "./generate.js";

const DOCUMENT_TABS = ["Preview", "Metadata", "Authorship", "Recipients", "Subject", "Perspective", "Claims", "Redactions", "Attachments", "Annotations", "Relationships", "Export"];

export { DOCUMENT_TABS, DOCUMENT_FAMILIES, DOCUMENT_TYPES, documentMarkdown, documentPlainText, documentPrintableHtml };

export function renderDocumentsHome(savedDocuments = [], suggestions = [], subjects = {}) {
  return `
    <section class="module-hero">
      <div>
        <p class="eyebrow">In-Universe Document Generator</p>
        <h1>Documents</h1>
        <p class="lede">Create records, memos, reports, letters, alerts, and evidence from the universe you have already built.</p>
      </div>
      <div class="search-board">
        <div class="field-grid">
          <label>Seed
            <input id="documentSeedInput" type="text" placeholder="kestrel-memo-4821">
          </label>
          <label>Mode
            <select id="documentMode">
              <option value="quick">Quick</option>
              <option value="guided">Guided</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label>Document family
            <select id="documentFamily"><option value="random">Auto</option>${DOCUMENT_FAMILIES.map(family => `<option value="${esc(family.id)}">${esc(family.label)}</option>`).join("")}</select>
          </label>
          <label>Document type
            <select id="documentType"><option value="random">Auto</option>${DOCUMENT_TYPES.map(type => `<option value="${esc(type.id)}">${esc(type.label)}</option>`).join("")}</select>
          </label>
          <label>Author character
            <select id="documentCharacter"><option value="">Auto</option>${(subjects.characters || []).map(optionForCharacter).join("")}</select>
          </label>
          <label>Issuing organization
            <select id="documentOrganization"><option value="">Auto</option>${(subjects.organizations || []).map(optionForOrganization).join("")}</select>
          </label>
          <label>Settlement
            <select id="documentSettlement"><option value="">Auto</option>${(subjects.settlements || []).map(optionForSettlement).join("")}</select>
          </label>
          <label>Conflict
            <select id="documentConflict"><option value="">Auto</option>${(subjects.conflicts || []).map(optionForConflict).join("")}</select>
          </label>
          <label>Access
            <select id="documentAccess">
              <option value="">Auto</option><option value="public">Public</option><option value="internal">Internal</option><option value="confidential">Confidential</option><option value="restricted">Restricted</option><option value="secret">Secret</option><option value="medical-private">Medical Private</option>
            </select>
          </label>
          <label>Reliability
            <select id="documentReliability">
              <option value="">Auto</option><option value="reliable">Reliable</option><option value="incomplete">Incomplete</option><option value="biased-but-factual">Biased but factual</option><option value="uncertain">Uncertain</option><option value="deceptive">Deceptive</option><option value="disputed">Disputed</option>
            </select>
          </label>
        </div>
        <div class="action-row">
          <button class="primary-button" data-action="generate-document" type="button">Create Document</button>
          <button class="ghost-button" data-action="generate-world-document" type="button">Generate From Existing World</button>
          <button class="ghost-button" data-action="generate-conflict-evidence" type="button">Generate Evidence for Conflict</button>
          <button class="ghost-button" data-action="open-document-seed" type="button">Load From Seed</button>
        </div>
      </div>
    </section>
    <section class="panel">
      <h2>Suggested Documents</h2>
      <div class="entry-grid">${renderDocumentSuggestions(suggestions)}</div>
    </section>
    <section class="panel">
      <h2>Document Collections</h2>
      <div class="metric-grid">
        ${["Conflict Packet", "Incident Packet", "Character Packet", "Organization Packet"].map(name => `<article class="data-card"><span class="meta-label">Packet Template</span><strong>${esc(name)}</strong><p>Generate multiple perspectives around a shared subject.</p></article>`).join("")}
      </div>
    </section>
    <section class="panel">
      <h2>Saved Documents</h2>
      <div class="entry-grid">${renderDocumentCards(savedDocuments)}</div>
    </section>
  `;
}

export function renderDocumentSuggestions(suggestions) {
  if (!suggestions.length) return `<div class="empty-state">Save conflicts, characters, organizations, or settlements to receive document suggestions.</div>`;
  return suggestions.map(item => `
    <article class="entry-card document-entry">
      <div class="mini-document" aria-hidden="true"></div>
      <div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.kind)} / ${esc(item.subjectName)}</p>
        <div class="meta-strip"><span class="badge">${esc(item.documentType)}</span><span class="badge">${esc(item.seed)}</span></div>
      </div>
      <button type="button" data-action="generate-suggested-document" data-source-type="${esc(item.sourceType)}" data-parent-seed="${esc(item.parentSeed)}" data-source-id="${esc(item.sourceId)}" data-document-type="${esc(item.documentType)}" aria-label="Generate ${esc(item.title)}"></button>
    </article>
  `).join("");
}

export function renderDocumentCards(records) {
  if (!records.length) return `<div class="empty-state">No saved documents in this local archive yet.</div>`;
  return records.map(record => {
    const document = record.document || record.entity;
    return `
      <article class="entry-card document-entry" style="--accent:${document ? esc(document.presentation.paperTone) : "var(--accent)"}">
        <div class="mini-document" aria-hidden="true"></div>
        <div>
          <h3>${esc(document?.title || record.seed)}</h3>
          <p>${document ? `${esc(document.documentTypeLabel)} / ${esc(document.classification.accessLevel)} / ${esc(document.classification.reliability)}` : "Document seed"}</p>
          <div class="meta-strip"><span class="badge">${esc(record.seed)}</span>${record.favorite ? `<span class="badge">Favorite</span>` : ""}</div>
        </div>
        <button type="button" data-action="open-document" data-seed="${esc(record.seed)}" aria-label="Open document ${esc(record.seed)}"></button>
      </article>
    `;
  }).join("");
}

export function renderDocumentDossier(document, activeTab, saved, favorite, revealRedactions = false) {
  return `
    <section class="org-header document-header">
      <div class="org-logo document-seal">${renderDocumentSeal(document)}</div>
      <div class="org-title">
        <p class="eyebrow">${esc(document.documentFamilyLabel)} / seed ${esc(document.seed)}</p>
        <h1>${esc(document.title)}</h1>
        <div class="meta-strip">
          <span class="classification">${esc(document.documentTypeLabel)}</span>
          <span class="badge">${esc(document.chronology.displayDate)}</span>
          <span class="badge">${esc(document.authorship.authorName)}</span>
          <span class="badge">${esc(document.classification.accessLevel)}</span>
          <span class="badge">${esc(document.classification.authenticity)}</span>
        </div>
      </div>
      <div class="action-row">
        <button class="primary-button" data-action="save-document" type="button">${saved ? "Saved" : "Save"}</button>
        <button class="ghost-button" data-action="favorite-document" type="button">${favorite ? "Favorited" : "Favorite"}</button>
        <button class="ghost-button" data-action="regenerate-document" type="button">Regenerate</button>
        <button class="ghost-button" data-action="toggle-redactions" type="button">${revealRedactions ? "Hide Redactions" : "Reveal Redactions"}</button>
        <button class="ghost-button" data-action="print-document" type="button">Print</button>
      </div>
    </section>
    <nav class="tabs" aria-label="Document dossier sections">
      ${DOCUMENT_TABS.map(tab => `<button class="tab-button ${tab === activeTab ? "active" : ""}" data-action="document-tab" data-tab="${tab}" type="button">${tab}</button>`).join("")}
    </nav>
    <section class="tab-panel">${renderDocumentTab(document, activeTab, revealRedactions)}</section>
  `;
}

export function renderDocumentTab(document, tab, revealRedactions = false) {
  const map = {
    Preview: renderPreview,
    Metadata: renderMetadata,
    Authorship: renderAuthorship,
    Recipients: renderRecipients,
    Subject: renderSubject,
    Perspective: renderPerspective,
    Claims: renderClaims,
    Redactions: renderRedactions,
    Attachments: renderAttachments,
    Annotations: renderAnnotations,
    Relationships: renderRelationships,
    Export: renderExport
  };
  return (map[tab] || renderPreview)(document, revealRedactions);
}

function renderPreview(document, revealRedactions) {
  return `<div class="split-layout document-workbench">
    <section class="document-preview-wrap">
      ${renderDocumentPage(document, revealRedactions)}
    </section>
    <aside class="panel">
      <h2>Reader Context</h2>
      <p>${esc(document.purpose.actualPurpose)}</p>
      <div class="metric-grid">
        <article class="data-card"><span class="meta-label">Reliability</span><strong>${esc(document.classification.reliability)}</strong></article>
        <article class="data-card"><span class="meta-label">Authenticity</span><strong>${esc(document.classification.authenticity)}</strong></article>
        <article class="data-card"><span class="meta-label">Status</span><strong>${esc(document.classification.documentStatus)}</strong></article>
      </div>
    </aside>
  </div>`;
}

export function renderDocumentPage(document, revealRedactions = false) {
  return `<article class="document-page ${esc(document.presentation.templateId)}" style="--paper:${esc(document.presentation.paperTone)}">
    <header class="document-page-header">
      <div>
        <p class="document-kicker">${esc(document.documentFamilyLabel)}</p>
        <h2>${esc(document.title)}</h2>
        <p>${esc(document.subtitle || "")}</p>
      </div>
      <div class="stamp-stack">${document.stamps.map(stamp => `<span class="doc-stamp-text">${esc(stamp.label)}</span>`).join("")}</div>
    </header>
    <dl class="document-meta-line">
      <div><dt>Date</dt><dd>${esc(document.chronology.displayDate)}</dd></div>
      <div><dt>Author</dt><dd>${esc(document.authorship.authorName)}</dd></div>
      <div><dt>Issuer</dt><dd>${esc(document.authorship.issuingOrganizationName || "Personal")}</dd></div>
      <div><dt>Record</dt><dd>${esc(document.content.structuredFields.recordNumber)}</dd></div>
    </dl>
    ${document.content.sections.map(section => `<section class="document-section">
      <h3>${esc(section.title || titleCase(section.type))}</h3>
      ${section.items ? `<ul>${section.items.map(item => `<li>${renderRedactedText(item, document.redactions, revealRedactions)}</li>`).join("")}</ul>` : `<p>${renderRedactedText(section.content || "", document.redactions, revealRedactions)}</p>`}
    </section>`).join("")}
    ${document.quotations.length ? `<section class="document-section"><h3>Quoted Material</h3>${document.quotations.map(quote => `<blockquote>${esc(quote.quote)}<cite>${esc(quote.speakerName)} / ${esc(quote.context)}</cite></blockquote>`).join("")}</section>` : ""}
    <footer class="document-page-footer">
      ${document.signatures.map(signature => `<div class="signature-block"><strong>${esc(signature.signerName)}</strong><span>${esc(signature.organizationName || signature.verification)}</span></div>`).join("")}
    </footer>
  </article>`;
}

function renderMetadata(document) {
  return `<section class="panel"><h2>Metadata</h2><div class="metric-grid">
    ${Object.entries({
      Title: document.title,
      Type: document.documentTypeLabel,
      Family: document.documentFamilyLabel,
      Date: document.chronology.displayDate,
      Access: document.classification.accessLevel,
      Confidentiality: document.classification.confidentiality,
      Authenticity: document.classification.authenticity,
      Status: document.classification.documentStatus,
      Preservation: document.classification.preservationStatus,
      Reliability: document.classification.reliability,
      "Public visibility": document.classification.publicVisibility
    }).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(key)}</span><p>${esc(value)}</p></article>`).join("")}
  </div></section>`;
}

function renderAuthorship(document) {
  return `<div class="split-layout"><section class="panel"><h2>Authorship</h2><div class="metric-grid">
    ${Object.entries(document.authorship).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(titleCase(key.replace(/([A-Z])/g, " $1")))}</span><p>${Array.isArray(value) ? value.map(esc).join(" / ") : esc(value || "None")}</p></article>`).join("")}
  </div></section><aside class="panel"><h2>Purpose</h2>${Object.entries(document.purpose).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(titleCase(key.replace(/([A-Z])/g, " $1")))}</span><p>${esc(value)}</p></article>`).join("")}</aside></div>`;
}

function renderRecipients(document) {
  return `<section class="panel"><h2>Recipients and Audience</h2><div class="metric-grid">${Object.entries(document.recipients).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(titleCase(key.replace(/([A-Z])/g, " $1")))}</span><p>${Array.isArray(value) ? value.map(esc).join(" / ") : esc(value)}</p></article>`).join("")}</div></section>`;
}

function renderSubject(document) {
  return `<section class="panel"><h2>Subject</h2><div class="metric-grid">${Object.entries(document.subject).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(titleCase(key.replace(/([A-Z])/g, " $1")))}</span><p>${Array.isArray(value) ? value.map(esc).join(" / ") : esc(value)}</p></article>`).join("")}</div></section>`;
}

function renderPerspective(document) {
  return `<div class="split-layout"><section class="panel"><h2>Author Knowledge</h2>${Object.entries(document.knowledgeContext).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(titleCase(key.replace(/([A-Z])/g, " $1")))}</span><p>${Array.isArray(value) ? value.map(esc).join(" / ") || "None" : esc(value)}</p></article>`).join("")}</section><aside class="panel"><h2>Bias and Omissions</h2>${Object.entries(document.perspective).map(([key, value]) => `<article class="data-card"><span class="meta-label">${esc(titleCase(key.replace(/([A-Z])/g, " $1")))}</span><p>${Array.isArray(value) ? value.map(esc).join(" / ") || "None" : esc(value)}</p></article>`).join("")}</aside></div>`;
}

function renderClaims(document) {
  return `<section class="panel"><h2>Claims and Contradictions</h2><div class="card-grid">${document.claims.map(claim => `<article class="incident-card"><p class="eyebrow">${esc(claim.certainty)} / ${esc(claim.truthStatus)}</p><h3>${esc(claim.claimType)}</h3><p>${esc(claim.statement)}</p><p>Visibility: ${esc(claim.visibility)} / Source: ${esc(claim.sourceType)}</p></article>`).join("")}${document.contradictions.map(item => `<article class="incident-card"><p class="eyebrow">${esc(item.topic)}</p><h3>Contradiction</h3><p>${esc(item.explanation)}</p></article>`).join("")}</div></section>`;
}

function renderRedactions(document) {
  return `<section class="panel"><h2>Redactions</h2><div class="card-grid">${document.redactions.length ? document.redactions.map(redaction => `<article class="incident-card"><p class="eyebrow">${esc(redaction.reason)}</p><h3>${esc(redaction.visibleReplacement)}</h3><p>Section: ${esc(redaction.sectionId)}</p><p>Hidden text: ${esc(redaction.targetText)}</p></article>`).join("") : `<div class="empty-state">No deterministic redactions on this document.</div>`}</div></section>`;
}

function renderAttachments(document) {
  return `<section class="panel"><h2>Attachments</h2><div class="card-grid">${document.attachments.map(item => `<article class="product-card"><p class="eyebrow">${esc(item.attachmentType)}</p><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p></article>`).join("")}</div></section>`;
}

function renderAnnotations(document) {
  return `<section class="panel"><h2>Annotations</h2><div class="card-grid">${document.annotations.map(item => `<article class="data-card"><p class="eyebrow">${esc(item.type)} / ${esc(item.visibility)}</p><h3>${esc(item.author)}</h3><p>${esc(item.note)}</p><p>${esc(item.date)} / ${esc(item.targetSectionId)}</p></article>`).join("")}</div></section>`;
}

function renderRelationships(document) {
  return `<section class="panel"><h2>Document Relationships</h2><div class="card-grid">${document.relationships.map(rel => `<article class="relation-card"><p class="eyebrow">${esc(rel.toEntityType)} / ${esc(rel.relationshipType)}</p><h3>${esc(rel.label)}</h3><p>Stored as shared universe relationship ${esc(rel.id)}.</p></article>`).join("")}${document.references.map(ref => `<article class="data-card"><p class="eyebrow">${esc(ref.entityType)}</p><h3>${esc(ref.name)}</h3><p>${esc(ref.entityId)}</p></article>`).join("")}</div></section>`;
}

function renderExport(document) {
  return `<section class="panel"><h2>Export</h2><div class="card-grid">
    <button class="document-card" data-action="export-document-json" type="button"><h3>JSON</h3><p>Full structured entity.</p></button>
    <button class="document-card" data-action="export-document-md" type="button"><h3>Markdown</h3><p>Readable structured document.</p></button>
    <button class="document-card" data-action="export-document-text" type="button"><h3>Plain Text</h3><p>Reading copy without markup.</p></button>
    <button class="document-card" data-action="export-document-html" type="button"><h3>Printable HTML</h3><p>Self-contained print-ready file.</p></button>
    <button class="document-card" data-action="export-document-full-md" type="button"><h3>Full Markdown</h3><p>Unredacted reading copy.</p></button>
  </div></section>`;
}

function renderDocumentSeal(document) {
  const fill = esc(document.presentation.paperTone);
  return `<svg viewBox="0 0 144 144" role="img" aria-label="${esc(document.title)} document seal">
    <rect x="24" y="16" width="96" height="112" fill="${fill}" stroke="var(--accent)" stroke-width="5"/>
    <path d="M42 42h60M42 60h46M42 78h60M42 96h38" stroke="#11161a" stroke-width="5"/>
    <path d="M94 16v28h26" fill="none" stroke="var(--accent)" stroke-width="5"/>
  </svg>`;
}

function renderRedactedText(text, redactions, reveal) {
  let output = esc(text);
  redactions.forEach(redaction => {
    const target = esc(redaction.targetText);
    output = output.replaceAll(target, reveal ? `<mark class="revealed-redaction">${target}</mark>` : `<span class="redacted" aria-label="Redacted ${esc(redaction.reason)}">${esc(redaction.visibleReplacement)}</span>`);
  });
  return output;
}

function optionForCharacter(record) {
  const entity = record.character || record.entity;
  return `<option value="${esc(record.seed)}">${esc(entity.name.full)}</option>`;
}

function optionForOrganization(record) {
  const entity = record.organization || record.entity;
  return `<option value="${esc(record.seed)}">${esc(entity.identity.name)}</option>`;
}

function optionForSettlement(record) {
  const entity = record.settlement || record.entity;
  return `<option value="${esc(record.seed)}">${esc(entity.name)}</option>`;
}

function optionForConflict(record) {
  const entity = record.conflict || record.entity;
  return `<option value="${esc(record.seed)}">${esc(entity.name)}</option>`;
}
