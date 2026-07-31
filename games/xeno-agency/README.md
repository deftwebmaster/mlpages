# Xeno Agency

Xeno Agency is a static browser RPG prototype about inheriting a failing interstellar adoption office and raising one alien through activities, projects, arena exhibitions, research clues, and local campaign history.

## Run Locally

Serve the folder with any static file server, then open the local URL:

```sh
python3 -m http.server 8010
```

The game has no server runtime, accounts, API keys, database service, or build step. Progress is saved locally in IndexedDB with a localStorage backup, and saves can be exported or imported from the Save screen.

## GitHub Pages

Publish the repository root as a GitHub Pages static site. All asset references are relative, so the game can run from a project subdirectory.

## Current Features

Phase 3 is complete for this prototype: the midgame now has reachable progression gates, location-based activity identity, campaign chapter tracking, choice-driven story events, and visible faction/rival pressure.

Phase 4 Pass 1 adds the endgame spine: a final origin hearing project, three campaign ending directions, campaign-complete state, and a local legacy archive action.

Phase 4 Pass 2 tunes the route to that finale: facility upgrades now improve related activity odds, the Mutation Stabilizer reduces stressful study/medical sessions, project cards show missing resources directly, and a balance smoke test checks that a representative campaign can reach the origin hearing.

Phase 4 Pass 3 completes the polish pass: the Alien screen now has a bond dossier, Chapter 3 shows an origin-hearing readiness checklist, profile cards include bond or ending state, and the legacy archive preserves each completed alien with portrait, clues, trust, and memory count.

Phase 5 Pass 1 expands playable content with new office, market, research, wreck, and moon assignments; three new agency projects; three new story events; and additional shop items so progression has more variety between major gates.

Phase 5 Pass 2 adds alien-specific reactivity: activity odds and completion text now account for positive traits, difficult traits, fears, preferences, aversions, and bond stage, while agency event modals show a short read on how the adopted alien is likely to feel about the report.

Phase 5 Pass 3 completes replayability: each campaign now has a seeded narrative lens, finale choices resolve into route-dependent variants, and legacy archives preserve the variant, motif, and major route factors behind the ending.

Phase 6 Pass 1 hardens save stability: migration now fills missing save structures defensively, import errors explain what failed, boot can fall back from a bad IndexedDB save to the local backup, and recovery notices surface stored-save problems without blocking a fresh start.

Phase 6 Pass 2 improves responsive and accessibility polish: modals now use consistent labeled dialog markup, import runs through the shared render path, Escape closes dialogs, Tab stays inside open modals, repeated controls have clearer accessible names, toast/recovery messages announce as status updates, and mobile layout handles long names and bottom-sheet dialogs more gracefully.

Phase 6 Pass 3 wraps the release package: square PWA icons, richer manifest metadata, shortcut routing, static-hosting notes, a GitHub Pages `.nojekyll` marker, and an in-game About this build panel are now included.

- Deterministic three-candidate adoption flow
- Twelve cropped alien portrait assets generated from the original portrait sheet
- One-alien campaign save with memories, needs, stats, traits, equipment, and species profile
- Two concurrent timer slots: alien activities and agency projects
- Campaign chapter tracking with visible objectives and origin clue progress
- Chapter 3 finale route with Protector Agency, Research Compact, and Feared Institution endings
- Chapter 3 origin-hearing readiness checklist
- Facility bonuses that make upgraded rooms improve related assignments
- Requirement-gated projects and activities tied to facilities, agency level, trust, clues, and chapters
- Missing-resource tags on agency projects
- Alien bond dossier with portrait, care status, fear, favorite, and memory count
- Expanded Phase 5 assignment set for casework, comfort care, diplomacy, ethics, field prep, and lunar recovery
- Personality-driven activity modifiers and reaction text for traits, fears, preferences, aversions, and bond state
- Alien-specific event notes before major agency choices
- Seeded campaign lenses and route-dependent finale variants
- Legacy archive factors showing why a completed ending landed the way it did
- Defensive save migration, clearer import validation, and recovery notices for stored-save issues
- Labeled dialogs, keyboard modal handling, accessible repeated controls, and mobile overflow polish
- Release-ready PWA icons, manifest screenshots, app shortcuts, static-hosting checklist, and in-game build notes
- Additional agency projects: Casework Board, Comfort Kitchen, and Field Kit Cache
- Additional shop items for food, field gear, and memory-focused charm builds
- Choice-driven agency events with trust, faction, stress, reputation, data, and clue consequences
- Early office-safe salvage and outreach activities to prevent midgame resource dead ends
- Offline rival advancement and personality reactions to activity categories/preferences
- Offline progress processing without starvation, death, or abandonment penalties
- Unlockable map locations, research clues, facilities, local achievements, and rival arena simulation
- World-screen faction pressure and rival agency tracking
- Expanded midgame content for the Research District, Neon Market, Wreck Fields, Memory Archive, Expedition Hangar, and Forbidden Moon
- Daily seeded shop inventory
- Export/import saves, challenge codes, and generated profile cards
- Local legacy archive for completed campaign endings with portrait and run details
- PWA manifest and service worker for offline reloads after first successful load

## Verification

```sh
node --check app.js
node --check sw.js
node -e "JSON.parse(require('fs').readFileSync('manifest.webmanifest','utf8')); console.log('manifest ok')"
node tools/balance-smoke.mjs
node tools/save-migration-smoke.mjs
```

See [RELEASE.md](./RELEASE.md) for the static-hosting preflight checklist.
