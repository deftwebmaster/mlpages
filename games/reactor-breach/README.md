# Reactor Breach

**Break the core. Control the fallout.**

A mobile-first arcade ricochet game built with vanilla HTML5, CSS3, JavaScript (ES modules) and Canvas. You control a containment deflector inside a failing reactor chamber, ricocheting a volatile energy orb through reactor components while routing the energy they release into three competing systems in real time.

No backend, no accounts, no build step. Runs entirely in the browser, installs as a PWA, and works offline after the first load.

## Controls

**Desktop**
- `←`/`A`, `→`/`D` — move the deflector
- Mouse move — position the deflector directly
- `Space` / left click — launch the held orb, or activate the selected channel's ability
- `Shift` / right click — magnetic catch (arm the deflector to catch the next orb)
- `1` `2` `3` — select Deflector / Orb / Reactor Control channel
- `Q` `E` — cycle the selected channel
- `P` / `Esc` — pause
- `R` — restart the stage

**Mobile**
- Drag anywhere in the chamber to move the deflector
- **LAUNCH** button — launch / activate ability
- **CATCH** button — magnetic catch
- Tap a channel meter to select it

## Power routing

Destroyed components release energy packets. Catch them with the deflector to fill whichever channel is currently selected — switching channels never pauses the action.

- **Deflector** — Expansion, Magnetic Field (extra catch charge), Containment Shield, Precision Control
- **Orb** — Acceleration, Piercing, Multi-Orb, Overcharge (explosive)
- **Reactor Control** — Diagnostic Scan, System Suppression, Time Dilation, Core Override

Each channel fills toward tiered thresholds; press the launch input with no orb held to activate the best available tier on the selected channel.

## Component types

Structural Plate, Reinforced Plate, Heavy Armor (needs piercing/overcharge), Conduit (disables connected shields when destroyed), Shield Node (protected by a barrier), Reflector, Phase Component (cycles solid/intangible), Volatile Cell (chain explosions), Corruption Node (spreads on a timer), Core Segment.

## Features

- 18 handcrafted chambers (12 standard, 4 challenge, 2 boss encounters)
- Deterministic swept-collision orb physics with contact-position rebound aiming
- Multi-orb (cap 5), piercing, overcharge, magnetic catch & relaunch
- Live three-channel power routing with tiered abilities
- Conduits, shields, phase components, volatile chains, spreading corruption
- Two boss encounters (Defense Matrix, Final Reactor) built from the same core mechanics
- Score, combo multiplier, S+/S/A/B/C ranks, three medals per stage
- Local save (progress, records, medals, statistics, settings) via `localStorage`
- Mobile-first responsive layout, keyboard/mouse/touch input
- Synthesized WebAudio SFX/music (no audio files to fetch — offline-safe by construction)
- Haptics, reduced-motion / reduced-effects / assist-mode accessibility settings
- Offline-capable PWA, installable, deployable under a GitHub Pages subdirectory

## Technical approach

Pure ES modules, no framework, no bundler. `requestAnimationFrame` game loop with clamped delta time. All balance values live in [`js/config.js`](js/config.js). Stage content is fully declarative data in [`js/stages.js`](js/stages.js), built with small grid helpers in [`js/stageHelpers.js`](js/stageHelpers.js) — no per-stage logic is hardcoded into engine modules.

## Project structure

```
index.html
css/styles.css
manifest.webmanifest
service-worker.js
icons/
js/
  config.js         balance values
  utils.js          math/helpers
  storage.js        localStorage save/load
  audio.js          synthesized WebAudio SFX/music
  input.js          keyboard/mouse/touch → normalized input
  particles.js       pooled particle system
  collisions.js      circle/rect/capsule narrow-phase tests
  physics.js         reflection, anti-stall, swept substeps
  deflector.js        player deflector
  orb.js / orbManager.js   orb state + collision integration
  components.js / componentBehaviors.js   reactor components + chain effects
  connections.js      conduit → shield/turret graph
  shields.js          shield barrier geometry/state
  powerRouting.js / abilities.js   3-channel energy routing + tier abilities
  energyPackets.js / powerUps.js  collectible drops
  hazards.js          debris, turrets, heat, drains, wells, pulses
  bosses.js           reusable boss phase behaviors
  objectives.js / scoring.js   objective checks, score, combo, rank, medals
  stageHelpers.js / stages.js  declarative stage data (18 chambers)
  stageLoader.js       stage instantiation + dev-time validation
  renderer.js          canvas rendering
  ui.js                DOM HUD/menus
  game.js              state machine + orchestration
  loop.js              rAF loop
  pwa.js               service worker registration + install prompt
  main.js              bootstrap
```

## Local development

No build step required — it's static files.

```bash
python3 -m http.server 8080
# then open http://localhost:8080/
```

Any static file server works. Opening `index.html` directly via `file://` will run the game, but the service worker (and therefore offline mode) will not register — serve it over `http(s)` to test PWA behavior.

## GitHub Pages deployment

The game uses relative asset paths throughout and registers the service worker relative to `document.baseURI`, so it works from any subdirectory, e.g.:

```
https://<user>.github.io/<repo>/games/reactor-breach/
```

1. Commit this folder into your Pages-published branch/path.
2. Push to GitHub and enable Pages for that branch.
3. No configuration changes are needed for nested paths — do not use absolute `/`-rooted URLs anywhere in this project.

## PWA notes

- `manifest.webmanifest` declares standalone display, theme/background colors, and `any`/`maskable` SVG icons.
- `service-worker.js` precaches the app shell and all game scripts under a versioned cache name (`CACHE_VERSION` in the file); bump it on every deploy so returning users get the new build instead of a stale cache.
- Runtime requests use cache-first-with-background-refresh, falling back to the cached `index.html` when offline.
- All audio is synthesized at runtime (no `.mp3`/`.ogg` fetches), so there is nothing extra to precache or that can fail to load offline.

## Stage data format

See [`js/stages.js`](js/stages.js) and [`js/stageHelpers.js`](js/stageHelpers.js). Each stage is a plain object: `id, name, subtitle, backgroundVariant, containmentCharges, powerRoutingRules, componentLayout, shieldSystems, hazards, bossConfiguration?, primaryObjective, secondaryObjectives, rankThresholds, tutorialPrompts, musicVariant`. Components declare `id, type, x, y, width, height, hitPoints, rotation, movementPattern, connectionIds, objectiveTag, behaviorConfig`. `js/stageLoader.js` runs lightweight dev-time validation (duplicate ids, dangling connections, missing objectives) that logs `console.warn` only on `localhost`/`file://`.

## Configuration

All tunable balance numbers (speeds, costs, thresholds, score values, combo curve, rank thresholds, particle caps, etc.) live in [`js/config.js`](js/config.js) — nothing is scattered through the engine modules.

## Browser support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari) on desktop and mobile. Uses ES modules, Canvas 2D, Web Audio API, Pointer Events, `localStorage`, and Service Workers. Gracefully degrades when `localStorage`, Web Audio, or `navigator.vibrate` are unavailable.

## Accessibility

Reduced Motion and Reduced Effects settings (shorter/disabled trails, fewer particles, no screen shake), a screen-shake toggle (Full/Reduced/Off), sound and haptics toggles, color-independent component shapes/symbols, large touch targets, full keyboard control, and an Assist Mode (unlimited containment charges, rank capped at A, clearly disclosed in Settings).

## Known limitations

- Audio is synthesized rather than sampled/mixed from produced assets — functional and offline-safe, but not a mixed soundtrack.
- Moving components use their declared motion pattern each frame rather than full continuous-time swept collision against moving geometry (fast orbs are still protected against tunneling via substepping against the component's current position each substep).
- Boss phase behaviors are driven by a small set of reusable phase primitives (tag-clear, duty-cycle core, overload timer) rather than fully bespoke scripting per encounter.

## Future ideas

Endless reactor mode, daily seeded chamber, additional boss pack, alternate deflector chassis, modifier-based challenge mode, local ghost/trajectory replay, shareable score cards, achievements, a custom stage editor, additional orb types, a hardcore one-charge campaign, boss-rush mode, and accessibility presets.
