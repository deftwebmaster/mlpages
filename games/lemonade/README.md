# 🍋 Lemonade Empire

**Squeeze. Sell. Expand.**

A mobile-first lemonade stand tycoon game, built as a fully static, installable, offline-capable Progressive Web App. No backend, no build step, no accounts — just open `index.html` (or host the folder) and play.

Start with a folding table, a pitcher, and a few dollars. Build a regional beverage empire.

---

## Table of Contents

1. [Game Overview](#game-overview)
2. [Feature List](#feature-list)
3. [Local Development](#local-development)
4. [Build & Deployment (GitHub Pages)](#build--deployment-github-pages)
5. [PWA Behavior](#pwa-behavior)
6. [Save Architecture](#save-architecture)
7. [Project Structure](#project-structure)
8. [Balance Configuration](#balance-configuration)
9. [Content Data Structure](#content-data-structure)
10. [Testing](#testing)
11. [Known Limitations](#known-limitations)
12. [Extending the Game](#extending-the-game)
13. [Changing the Title & Branding](#changing-the-title--branding)

---

## Game Overview

Each day follows five stages: **Morning Briefing → Preparation → Run the Stand → Results → Reinvestment**. You choose a recipe, set a price, prepare a batch from your inventory, and watch an animated live-selling day play out at 1×–4× speed. Afterward, a results screen explains *why* the day went the way it did — weather, price reaction, recipe match, wait times, waste, and reputation — before you reinvest and move to the next day.

Systems unlock gradually via milestones so a new player is never shown more than they can act on: marketing, equipment upgrades, employees, additional locations, and eventually bottling/wholesale all arrive as the business grows.

## Feature List

- Five-stage daily loop with a tick-based live simulation (weather, traffic curve, individual customer purchase decisions)
- Recipe builder (lemon / sugar / ice sliders) with saved recipes and 12 unlockable menu items
- Ingredient inventory with spoilage, freshness indicators, and multiple suppliers
- Dynamic pricing feedback (neighborhood price range + reaction) driven by location, reputation, and quality
- Weather system with 10 conditions, imperfect forecasts, and temperature-driven demand curves
- Reputation (0–100, six tiers) and brand awareness (separate from reputation) systems
- 10-location progression from a free driveway to a production/bottling facility
- Equipment upgrades across 6 categories (stand, production, cooling, service, business, logistics), every effect wired to a real gameplay hook (batch-size caps, wait-queue capacity, quality/appeal bonuses, forecast accuracy, spoilage/ice retention, and automated ingredient reordering)
- Employee system: hire, assign shifts, morale/experience, traits
- Marketing campaigns with reach, duration, and flop risk
- Reputation-gated competitors that shape local price expectations
- Random daily events with 2–3 concrete choices and immediate effects
- Loans with daily amortized payments
- Multi-location ownership with lightweight employee-managed simulation for locations you aren't personally running, with expansion beyond one/three locations gated behind their own milestones (not just cash and reputation)
- Wholesale/bottling: produce bottles from your recipe (3 sizes), accept rotating contract offers from 7 client types (café, school, grocery, restaurant, sports venue, hotel chain, regional supermarket), deliver against quality/deadline requirements, with penalties for missed deadlines and reputation rewards for completion — gated behind the Production Facility location
- Achievements (16) and milestones (7) that gate feature unlocks
- Reports: 7-day trend, product performance, location performance, customer segment mix
- Branded CSS splash screen on every cold launch (covers the async save lookup, then leads into either the setup form or straight into a loaded save) using the same illustrated lemonade-stand language as the playable screens
- Contextual first-day tutorial (dismissible, resettable) — not a slideshow
- One primary objective plus a couple of "also try" achievement-based optional goals shown on the Stand screen at all times
- Synthesized sound effects (Web Audio API oscillators, no audio files to ship) for sales, purchases, achievements, milestones, and day start/end, respecting the sound toggle in Settings
- 3 IndexedDB save slots, autosave, manual save, JSON export/import
- Full PWA: manifest, service worker, offline shell caching, update-available prompt
- Light/dark theme (auto by system preference or manual), reduced-motion support

## Local Development

No build step is required — this is plain HTML/CSS/ES modules. You only need a static file server (browsers block `fetch`/module imports from `file://`).

```bash
# from the project root, pick any one of these:
npx serve .
python3 -m http.server 4173
php -S localhost:4173
```

Then open `http://localhost:4173`.

**Important while iterating:** the service worker caches aggressively for offline support. If you edit files and don't see changes, unregister the service worker and clear caches once from DevTools (Application → Service Workers → Unregister, and Application → Clear storage), or do a hard reload. This is a one-time annoyance during development, not a bug in the app itself.

## Build & Deployment (GitHub Pages)

There is no build step. To deploy:

1. Push this repository to GitHub.
2. In **Settings → Pages**, set the source to the branch/folder containing these files (root, or `/docs` if you move them there).
3. GitHub Pages will serve `index.html` directly.

If you deploy under a subpath (e.g. `username.github.io/repo-name/`), everything already uses **relative paths** (`./manifest.webmanifest`, `./js/app.js`, etc.), so no changes are needed. If you ever introduce absolute paths, update `manifest.webmanifest`'s `start_url`/`scope` and `service-worker.js`'s `SHELL_URLS` to match.

Optionally, you may put Vite or another bundler in front of this for minification — the output must still be static files with relative paths.

## PWA Behavior

- `manifest.webmanifest` declares standalone display, theme colors, and icons (192/512/maskable).
- `service-worker.js` precaches the app shell (HTML/CSS/core JS/icons) on install and uses a cache-first strategy at runtime for same-origin GET requests, so the game works fully offline after the first successful load.
- Saves are **never** cached by the service worker (they live in IndexedDB, a separate storage mechanism untouched by the SW cache).
- When a new version is deployed, the new service worker installs in the background and a small **"A new version is available — Update now"** bar appears; the active session is never silently replaced.
- `apple-mobile-web-app-*` meta tags and an apple-touch-icon are included for iOS home-screen installs.

## Save Architecture

- **Storage:** IndexedDB, database `lemonade-empire`, object store `saves`, keyed by slot number (1–3). See `js/state/save-manager.js`.
- **Autosave:** debounced ~1.5s after any state-changing action, plus effectively after every completed day (finalizing a day mutates state, which triggers the same autosave path).
- **Manual save / slot switching / delete:** available under **More → Save Management**.
- **Export/Import:** the entire state object serializes to JSON (the ephemeral `liveDay` session is stripped since it isn't meaningful across reloads); import runs the save through `js/state/migrations.js` before being written to the active slot.
- **Versioning:** every save carries a `version` field (`SAVE_VERSION` in `js/utils/constants.js`). `migrations.js` walks a save forward one version at a time — add a new entry there whenever you change `default-state.js`'s shape in a way old saves won't already satisfy.
- **Corrupted/invalid saves:** `importSaveFromJson` throws a friendly error on invalid JSON; a missing/unreadable IndexedDB simply falls back to the new-game flow rather than crashing.

## Project Structure

```
/
├── index.html
├── manifest.webmanifest
├── service-worker.js
├── css/                      design tokens, reset, layout, components, screens, animations
├── assets/icons/             generated PWA icons (see below)
├── js/
│   ├── app.js                boot sequence, service worker registration, top bar, theme
│   ├── router.js             minimal hash router
│   ├── state/                default-state, game-store (pub/sub), save-manager, migrations
│   ├── simulation/            weather/demand/customer/economy/event/competitor models + day-simulator
│   ├── systems/                inventory, recipe, upgrade, employee, marketing, location,
│   │                           achievement, progression, notification, finance, briefing,
│   │                           day-cycle (glues simulation + systems together), tutorial
│   ├── screens/                one module per screen (see below), each exporting
│   │                           `render<Name>Screen(container, ctx) -> destroy?`
│   ├── components/             modal, bottom-sheet, toast, progress-bar, stat-card,
│   │                           confirm-dialog, currency-display, bottom-nav, tutorial-banner
│   ├── data/                   ingredients, recipes (menu items), locations, upgrades,
│   │                           employees, marketing, events, achievements, competitors,
│   │                           milestones, suppliers — all plain data, no UI logic
│   └── utils/                  random (seeded RNG), format, math, validation, constants
```

Every screen module follows the same contract so the router can mount/unmount them cleanly:

```js
export function renderStandScreen(container, { navigate, path }) {
  // build DOM, attach listeners
  return () => { /* optional cleanup: remove listeners, stop timers */ };
}
```

## Balance Configuration

Tunable constants are intentionally centralized rather than scattered:

- **`js/utils/constants.js`** — game title/subtitle, calendar shape, difficulty presets, reputation tiers, live-day tick timing.
- **`js/simulation/customer-model.js`** — `SEGMENT_PROFILES` (per-segment taste/price-sensitivity/patience) and `PURCHASE_WEIGHTS` (how much price/recipe-match/wait/reputation/quality/awareness each contribute to a purchase decision).
- **`js/simulation/demand-model.js`** — traffic curve by hour (`HOUR_CURVE`), reputation/awareness/competition multipliers.
- **`js/simulation/weather-model.js`** — per-condition traffic/ice multipliers and seasonal weights.
- **`js/simulation/economy-model.js`** — price-expectation formula, business valuation formula, loan math.

Simulation randomness runs through a seeded PRNG (`js/utils/random.js`, `createRng`), seeded per-day from `state.meta.rngSeed` plus the day number, so a given save+day is reproducible for debugging.

## Content Data Structure

All game content lives in `js/data/*.js` as plain arrays/objects — no content is hardcoded into screen components. Example upgrade and location shapes (matching what's actually in the code):

```js
// js/data/upgrades.js
{
  id: 'cool-insulated-chest',
  category: 'cooling',
  tier: 2,
  name: 'Insulated Chest',
  cost: 120,
  requirements: { reputation: 10 },
  effects: { iceRetention: 0.35, storageCapacity: 70 },
  description: 'Keeps ice usable longer and increases cold storage.',
}
```

```js
// js/data/locations.js
{
  id: 'community-park',
  name: 'Community Park',
  unlockRequirement: { reputation: 15, cash: 250 },
  dailyFee: 20,
  trafficBase: 14,
  weatherExposure: 0.9,
  customerMix: { children: 0.3, parents: 0.35, fitness: 0.2, tourists: 0.15, commuters: 0 },
}
```

## Testing

This project has no automated test runner wired up (no bundler/CI in scope), but the logic is written to be easy to test if you add one (Vitest/Jest work fine against plain ES modules):

- **Pure, testable modules:** everything in `js/simulation/` and `js/systems/` is plain functions that take state/params and return results or mutate a passed-in state object — no DOM access, so they're straightforward to unit test in isolation (recipe cost/quality, spoilage, purchase decisions, weather modifiers, waterfall math, upgrade effects, unlock/achievement/milestone conditions, save migration, seeded RNG determinism).
- **Manual verification checklist:**
  - Mobile layout at 360–430px width and down to 320px
  - PWA installability (Chrome DevTools → Application → Manifest; "Add to Home Screen" on a phone)
  - Offline launch (load once, then DevTools → Network → Offline, reload)
  - Save persistence across reloads, export/import round-trip
  - Service worker update flow (bump `CACHE_VERSION` in `service-worker.js`, redeploy, confirm the update bar appears)
  - Reduced motion (`prefers-reduced-motion` or the in-game toggle) actually removes animations
  - Keyboard navigation and focus states through a full day cycle

## Known Limitations

- Multi-location automation (`simulateEmployeeManagedLocation`) is a lightweight estimate, not a full second simulation — it's intentionally simple so owning several locations doesn't require manually running every stand every day.
- Wholesale contract quality checks use your *current* recipe/ingredient quality at the moment of delivery rather than tracking quality per bottle batch — simpler to reason about, but it means changing your recipe after producing a batch can retroactively affect whether that batch clears a contract's bar.
- Label design presets and retail-margin tooling (mentioned in the original design notes) were intentionally left out of the bottling system to keep it focused; bottle size, packaging cost, and shelf life are implemented.
- Sound effects are synthesized tones, not sampled audio, and there is no music track — the music toggle in Settings is inert (reserved) since there's nothing for it to control yet. Haptics are not implemented.
- There is no bundler/minifier in the repo; for a production deploy you may want to add one purely for file-size optimization (not required for correctness).

## Extending the Game

**Add an ingredient:** add an entry to `js/data/ingredients.js` (packPrice, packSize, shelfLifeDays, storagePerUnit, optional `unlockRequirement`). It automatically appears in Supplies once unlocked and can be referenced from any menu item's `baseIngredients`.

**Add an upgrade:** add an entry to `js/data/upgrades.js` with a `category` (must be one of `UPGRADE_CATEGORIES`), the next `tier` number in that category, `cost`, `requirements.reputation`, and an `effects` object using existing effect keys (see `DEFAULT_EFFECTS` in `js/systems/upgrade-system.js`) — or add a new key there if you need a new kind of effect, then read it wherever it should apply.

**Add a location:** add an entry to `js/data/locations.js` with `unlockRequirement`, `dailyFee`, `trafficBase`, `hours`, `customerMix` (should sum to ~1), and `priceExpectation`. It will show up in Business → Locations automatically.

**Add an event:** add an entry to `js/data/events.js` with a `trigger` (minDay/weight/optional requirement flags) and 2–3 `choices`, each with an `outcome` string and any combination of effect fields (`cashDelta`, `trafficMultiplier`, `qualityMultiplier`, `productionMultiplier`, `priceCapMultiplier`, `serviceSpeedMultiplier`, `closeEarlyHour`, `reputationDelta`, `awarenessDelta`, `donatePercent`) — these are applied generically by `applyEventEffectsToSession` in `js/simulation/day-simulator.js`, so no new code is needed for most events.

**Add a wholesale client:** add an entry to `js/data/contracts.js` (`CONTRACT_CLIENTS`) with `minReputation`, `quantityRange`, `deadlineDays`, `pricePerUnitRange`, `qualityRequirement`, `penalty`, and `reputationReward`. It will start appearing in rotating contract offers automatically once the player's reputation clears `minReputation` and they own the Production Facility.

**Add a bottle size:** add an entry to `js/data/bottles.js` (`BOTTLE_SIZES`) with `ozSize` (used to scale ingredient consumption relative to a 9oz cup), `packagingCost`, `shelfLifeDays`, and an optional `unlockRequirement.reputation`.

**Tune the splash artwork:** edit `js/components/brand-scenes.js` for the illustrated stand structure and `css/screens.css` for the splash scene styling. The splash is CSS-native now, so it scales cleanly, ships without a large hero image, and stays visually consistent with the stand, live-day, and results screens.

**Change the game title/branding:** edit `GAME_TITLE` and `GAME_SUBTITLE` in `js/utils/constants.js` (used throughout the UI and in `js/app.js`'s update banner). Also update `<title>` in `index.html` and `name`/`short_name` in `manifest.webmanifest`. The color palette lives entirely in `css/variables.css` as CSS custom properties.

## Changing the Title & Branding

1. `js/utils/constants.js` → `GAME_TITLE`, `GAME_SUBTITLE`
2. `index.html` → `<title>`
3. `manifest.webmanifest` → `name`, `short_name`, `description`
4. `css/variables.css` → color tokens (`--color-lemon`, `--color-coral`, etc.) if you want a different palette
5. `assets/icons/` → replace the generated PNGs with your own artwork at the same filenames/sizes if you want different iconography

---

Built with vanilla HTML/CSS/JS. No frameworks, no backend, no build step required.
