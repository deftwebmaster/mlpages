# Karrde Intelligence Network

A premium static intelligence terminal for Talon Karrde's private archive during the Legends-era Thrawn campaign around 9 ABY. The project is designed as an immersive information brokerage system, not a wiki: every page reads as a professional intelligence record with classification, confidence, source context, and cross references.

## Upload-Ready Static Site

For GitHub Pages or any static host, upload these paths:

```text
index.html
styles.css
app.js
data-inline.js
public/
data/
```

The root `index.html` version uses vanilla JavaScript. It loads `data-inline.js` first so local/offline previews work, while the modular JSON files in `data/` remain the editable source records. No build step, backend, or database is required.

Current archive coverage:

- 112 searchable records
- 20 confidence/source audit entries
- 19 personnel, 13 organizations, 14 planets, 10 ships, 16 operations, 22 reports, and 18 timeline events
- Record-backed dossiers include print and plain-text export controls

## Technology

- HTML, CSS, and vanilla JavaScript for direct static hosting
- Optional Vinext / React project files are retained for local development
- CSS-only visual system with the specified restrained archive palette
- Modular JSON datasets as the source of truth
- No backend, no database, no external runtime dependency for content

## Directory Structure

```text
app/
  layout.tsx       Site metadata and root document
  page.tsx         Interactive intelligence terminal
  globals.css      Visual system and responsive layout
index.html         Upload-ready static entrypoint
styles.css         Upload-ready static stylesheet
app.js             Upload-ready static behavior
data/
  characters.json
  organizations.json
  planets.json
  ships.json
  operations.json
  reports.json
  timeline.json
  audit.json
public/
  favicon.svg
scripts/
  validate-data.mjs
```

## JSON Format

Every record has a stable `id`. Relationship fields store IDs, never duplicated display text. The app builds search records and the related network from those IDs at load time.

Records should include:

- A display name or title
- Classification
- Reliability or confidence
- Operational summary fields
- Arrays of related record IDs

## Confidence History

`data/audit.json` stores source and confidence changes. Each entry points to a `recordId` and records the action, prior confidence, new confidence, source, analyst, and note. The app surfaces this in two places:

- `Source Ledger` in the right column for the active record.
- `Confidence History` inside dossiers when audit entries exist.

## Data Quality

Run the data guardrail before packaging a new upload:

```bash
npm test
```

The validator checks required fields, unique kebab-case IDs, relationship targets, classification and confidence labels, audit targets, and whether `data-inline.js` matches the editable JSON datasets.

## How To Add Characters

Add an object to `data/characters.json` with the same field structure as the existing dossiers. Keep biography out of the file. Use operational assessments, known assets, source confidence, and relationship IDs.

Important relationship fields:

- `knownAssociates`
- `knownAssets`
- `recentIntelligence`
- `timelineEvents`
- `relatedOperations`
- `relatedShips`
- `relatedOrganizations`
- `relatedWorlds`

## How To Add Operations

Add an object to `data/operations.json`. Operations should read like case files: objectives, participants, outcome, consequences, sources, and referenced reports.

Use:

- `participants` for personnel IDs
- `timeline` for event IDs
- `referencedReports` for report IDs

## How Relationships Work

`app.js` consolidates all JSON records into a single search index. The related network combines outgoing links from the active record with inbound links from other records. This keeps the graph clean and avoids manual duplication.

The right-side relationship panel has two scopes:

- `Clean`: direct and inbound relationships only, capped for readability.
- `Expanded`: adds second-order links through the strongest nearby records.

Relationship labels are inferred from the JSON field that created the link, such as `associate`, `asset`, `operation`, `world`, `report`, `participant`, or `owned asset`.

When adding a new module, create a new JSON file, load it in `app.js`, map it into the shared record shape, and add the module to `recordTypeOrder` plus `sectionForType`.

## Dossier Export

Each record-backed dossier can be printed or exported as a `.txt` file. Print mode removes the app chrome and produces a clean dossier sheet. Export includes the record summary, source fields, linked records, and confidence history.

## Deployment

The static site can be uploaded as-is. The optional local React/Vinext build still verifies with:

```bash
npm run build
```

The root static files are compatible with GitHub Pages-style static hosting or any basic static file host.

## Future Expansion

Good next modules:

- Species intelligence summaries
- Sectors and hyperspace routes
- Asset custody changes
- Era-specific timeline zoom controls
- Analyst note revisions per record
