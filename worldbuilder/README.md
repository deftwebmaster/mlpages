# Sci-Fi Worldbuilder

A fully client-side procedural science-fiction worldbuilding suite.

Open `index.html` from a static host, or serve the folder with any simple web server. Sci-Fi Worldbuilder uses deterministic seeds, localStorage saves, hash routes, and JSON/Markdown exports for connected worldbuilding entities, including conflicts, in-universe documents, timelines, factions, relationship networks, story premises, Atlas reference pages, and technology/infrastructure records generated from existing world data. It requires no backend, account system, API key, build step, or external service.

## GitHub Pages

This repository is ready for GitHub Pages as a static site. Publish the root directory and open the generated site URL.

## Local Preview

Because the app uses browser ES modules, preview it through a local static server:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## QA Harness

Open `http://localhost:8000/qa.html` to run the static validation harness. It checks deterministic seed replay, minimum dataset size, document IDs, generated document counts, relationship counts, organization dossier tabs, star-system generation, settlement generation, relationship-centered character generation, existing-world conflict generation, Document Forge schema coherence, Timeline extraction from existing records, context-first Faction generation, Relationship Explorer graph extraction, Story Premise pressure discovery, Universe Atlas indexing, and Technology Registry dependency modeling.

## Current Capabilities

- Shared suite shell with Home, Stellar Systems, Settlements, Organizations, Characters, Conflicts, Documents, Timeline, Factions, Relationships, Story Premises, Atlas, and Technology modules
- Shared local universe storage with migration support for older saved organizations
- Stellar Cartography Archive for seeded star systems, bodies, settlements, stations, factions, routes, hazards, history, and story hooks
- Colonial Settlement Archive for standalone settlements and promoted system settlement summaries, with districts, local law, utilities, culture, maps, tensions, and story hooks
- Seeded organization generation with coherence rules for industry, risk, scale, age, documents, locations, and incidents
- Character Dossier Archive for standalone people and promoted organization personnel, with relationships treated as structured obligations, loyalties, secrets, conflicts, and shared universe links
- Conflict and Crisis Generator for turning saved settlements, organizations, characters, systems, incidents, and tensions into structured top-level conflicts
- Document Forge for generating authored in-universe records from existing entities, with authorship, recipients, purpose, knowledge scope, bias, reliability, authenticity, claims, redactions, annotations, attachments, signatures, stamps, relationships, and print-ready previews
- Historical Timeline Engine for extracting dated facts from saved entities first, normalizing them into shared chronology, detecting gaps and contradictions, suggesting connective history, generating eras, and preparing alternate-history branches
- Faction Generator for creating political, social, ideological, labor, internal, opposition, and coalition forces from saved settlements, organizations, conflicts, characters, documents, and historical events
- Relationship Explorer for normalizing shared relationships, extracting implied links, inspecting evidence and visibility, validating relationship data, finding paths, and identifying hubs, isolated entities, duplicates, and warnings
- Story Premise Engine for extracting narrative pressure signals from existing world data, selecting protagonists and opposition, calibrating stakes, choices, urgency, escalation, genre, scale, continuity, novelty, and non-canon generated additions
- Universe Atlas & Encyclopedia for rebuilding a unified reference index over existing entities, rendering encyclopedia articles, maps, historical views, search, glossary entries, continuity and coverage dashboards, collections, and world-bible exports without duplicating source dossiers
- Technology & Infrastructure Registry for context-first technologies, infrastructure systems, technical standards, research programs, facilities, components, materials, power, operations, maintenance, failure modes, cascading failures, manufacturing, supply chains, economics, ownership, regulation, compatibility, variants, lifecycle, deployment, dependency analysis, ecosystem generation, Atlas indexing, and printable exports
- Saved dossier library with search, filters, sorting, favorites, notes, and tags
- Distinct internal document templates
- Related-organization traversal and system-to-organization links
- JSON, Markdown, SVG, seal SVG, and multiple PNG visual exports
- Document JSON, Markdown, plain-text, and printable HTML exports; use the browser print dialog for PDF output

## Module Names

Sci-Fi Worldbuilder uses named archive modules. Stellar Cartography Archive, Colonial Settlement Archive, Interstellar Corporate Registry, Character Dossier Archive, Conflict and Crisis Generator, Document Forge, Historical Timeline Engine, Faction Generator, Relationship Explorer, Story Premise Engine, Universe Atlas & Encyclopedia, and Technology & Infrastructure Registry are active modules.

## Document Forge Notes

Document Forge follows the same local-first model as the rest of the suite. A generated document is a structured top-level entity with stable section IDs, claims, redactions, annotations, attachments, signatures, stamps, source metadata, and shared relationships to the entities it references. It builds an author knowledge model before writing content, so documents should use public, institutional, witnessed, rumored, and secret information according to what the author could plausibly know.

The first catalog includes more than 40 prioritized document types across news, corporate, government, legal/security, military/intelligence, scientific/technical, medical/public-health, personal, logistics, propaganda, and emergency families. Future modules can consume documents through subject references, claims, contradictions, chronology, historical metadata, and relationship records.

## Timeline Notes

The Historical Timeline Engine is extraction-first. It scans saved star systems, settlements, organizations, characters, conflicts, documents, and promoted historical events before suggesting any connective history. Original source dates are preserved beside normalized sortable chronology, and generated bridge events remain marked as suggestions until explicitly saved or promoted. Timeline routes are hash-based for GitHub Pages compatibility, including `#/timeline`, `#/timeline/new?seed=meridian-history-4821`, contextual routes such as `#/timeline?settlement=settlement_port_meridian`, and event detail routes such as `#/events/event_id`.

## Faction Notes

The Faction Generator keeps factions distinct from organizations. A faction can link to a host organization, government, settlement, conflict, document, character, or historical event, but it stores political identity, constituency, ideology, goals, strategy, membership, internal blocs, legitimacy, resources, territory, vulnerabilities, and external relations as faction-specific data. Faction routes are hash-based for GitHub Pages compatibility, including `#/factions`, `#/factions/new?seed=meridian-reform-coalition-4281`, contextual generation routes such as `#/factions/new?settlement=settlement_port_meridian`, and filtered views such as `#/factions?ideology=reformist`.

## Relationship Notes

The Relationship Explorer uses one shared relationship model rather than a separate graph store. It normalizes saved relationship records and extracts domain-aware links from systems, settlements, organizations, characters, conflicts, documents, historical events, and factions. It tracks relationship family, type, inverse, direction, status, visibility, confidence, chronology, strength, sentiment, evidence, phases, warnings, suggestions, hubs, isolated entities, and paths. Routes are hash-based for GitHub Pages compatibility, including `#/relationships`, `#/relationships/explore`, `#/relationships?focus=entity_id`, `#/relationships/path?from=entity_a&to=entity_b`, and `#/relationships/:relationship_id`.

## Story Premise Notes

The Story Premise Engine is context-first. It extracts narrative pressure from saved conflicts, unstable relationships, factions, characters, organizations, settlements, documents, historical events, systems, and relationship graph data before inventing connective plot material. Premises are top-level `storyPremise` entities with status, canon status, genre, scale, tone, narrative mode, source context, protagonist model, opposition model, stakes, central choice, escalation, twist potential, ending directions, evaluation, novelty, continuity warnings, coverage signals, and story seed package exports.

Generated incidents, proposed protagonists, future pressures, and promotion targets remain labeled as non-canon suggestions until reviewed. Routes are hash-based for GitHub Pages compatibility, including `#/premises`, `#/premises/new?seed=air-crisis-whistleblower-4281`, contextual routes such as `#/premises/new?conflict=conflict_meridian_air_crisis`, filtered views such as `#/premises?genre=political-thriller`, and saved premise routes such as `#/premises/premise_id`.

## Atlas Notes

The Universe Atlas is the shared reference layer for the suite. It rebuilds an Atlas index from source entities instead of storing duplicate character, settlement, faction, document, conflict, relationship, history, or premise records. Atlas-owned data is limited to presentation and navigation records such as the universe profile, custom encyclopedia entries, Atlas collections, map views, saved views, article summaries, and notes.

The Atlas provides encyclopedia article pages, category pages, A-Z browsing, unified search, schematic system and settlement maps with text alternatives, historical browsing by event and year, glossary entries, relationship and premise cross-references, continuity findings, coverage findings, reader/author knowledge views, spoiler controls, saved views, and World Bible exports. Routes are hash-based for GitHub Pages compatibility, including `#/atlas`, `#/atlas/explore`, `#/atlas/index`, `#/atlas/maps`, `#/atlas/timeline`, `#/atlas/collections`, `#/atlas/glossary`, `#/atlas/world-bible`, `#/atlas/entity/entity_id`, `#/atlas/category/characters`, `#/atlas/system/system_id`, `#/atlas/settlement/settlement_id`, and `#/atlas/year/2315`.

## Technology Notes

The Technology & Infrastructure Registry is the suite's operational systems layer. It treats technology as a web of scientific, industrial, logistical, institutional, and political dependencies rather than a list of futuristic objects. Generation is context-first: saved settlements, systems, organizations, characters, conflicts, documents, historical events, factions, and story premises are consumed before new technical detail is invented.

The Registry supports `technology`, `infrastructureSystem`, `technicalStandard`, `researchProgram`, `technicalFacility`, and embedded `technologyVariant` records. Technology dossiers include function, scientific basis, design, components, materials, software, power, performance, operating conditions, operators, automation, maintenance procedures, failure modes, cascading failures, safety, security, manufacturing, production process, supply chain, economics, ownership, intellectual property, regulation, standards, compatibility, variants, deployment, lifecycle, history, vulnerabilities, future development, and consequences.

Infrastructure records include service, topology, zones, nodes, control systems, power dependencies, capacity, demand, redundancy, maintenance, staffing, emergency systems, access, service levels, ownership, regulation, security, vulnerabilities, and failure cascades. The Registry also provides dependency analysis, failure-cascade tracing, capability-gap coverage, contextual technology suggestions, ecosystem generation, JSON/Markdown/HTML/CSV/SVG exports, Relationship Explorer links, and Atlas articles/search/glossary/timeline support. Routes are hash-based for GitHub Pages compatibility, including `#/technology`, `#/technology/new?seed=meridian-atmosphere-regulator-4281`, `#/technology/new?settlement=settlement_port_meridian`, `#/technology/technology_id`, `#/infrastructure/infrastructure_id`, `#/standards/standard_id`, `#/research/research_id`, and `#/facilities/facility_id`.
