# Signal Runner

**Cross the network. Carry the signal home.**

A mobile-first, real-time lane-crossing arcade puzzle. You are a data signal
trying to cross a hostile network: you move one grid cell at a time, the
network never stops moving, and the whole thing turns on a two-frequency
*polarity* mechanic that decides what can carry you, what can block you and
what can kill you.

Built with vanilla JavaScript, HTML Canvas and the Web Audio API. No
frameworks, no build step, no backend, no accounts. Installs as a PWA and
works offline.

---

## Contents

- [Play](#play)
- [Controls](#controls)
- [Core mechanics](#core-mechanics)
- [Features](#features)
- [Technical approach](#technical-approach)
- [Project structure](#project-structure)
- [Local development](#local-development)
- [Verification tools](#verification-tools)
- [Deploying to GitHub Pages](#deploying-to-github-pages)
- [PWA notes](#pwa-notes)
- [Level data format](#level-data-format)
- [Balance configuration](#balance-configuration)
- [Accessibility](#accessibility)
- [Browser support](#browser-support)
- [Known limitations](#known-limitations)
- [Future ideas](#future-ideas)

---

## Play

Twelve handcrafted levels. Reach every uplink terminal at the top of the
board and the level is complete. Activating one uplink returns you to the
start to fetch the next — uplinks you have already brought online stay online
even if you lose the signal on the way back.

There are no lives. Losing the signal costs you a fraction of a second and a
tick on the death counter, nothing else.

Each level awards up to three badges, tracked separately rather than rolled
into a star rating:

| Badge | Requirement |
| --- | --- |
| **Connected** | Complete the level |
| **Clean Signal** | Complete it without losing the signal once |
| **Low Latency** | Complete it inside the level's target time |

## Controls

| Action | Touch | Keyboard |
| --- | --- | --- |
| Move one cell | Swipe, or tap a neighbouring cell | Arrow keys or WASD |
| Switch frequency | **FREQ** button | Space |
| Pause | Pause button | Esc or P |
| Restart level | Restart button | R |

Swipes fire the moment they cross the distance threshold rather than on
release — waiting for lift-off adds latency you can feel. A genuinely
diagonal flick is ignored instead of guessed at. Holding a direction key does
*not* walk you across the board; every step is meant to be a decision.

## Core mechanics

**Discrete player, continuous world.** You move cell to cell in about 130ms.
Everything else — traffic, platforms, scan cycles, gates — moves smoothly and
never waits for you. That contrast is the whole game.

**Signal polarity.** You are either **cyan** or **violet** and can switch at
any time, subject to a short cooldown. One consistent rule governs every
polarised object:

> A hazard is dangerous to the **opposite** frequency and harmless to a
> matching one. A platform carries only its **own** frequency. A gate admits
> only its **own** frequency.

Polarity is never signalled by colour alone: cyan objects carry a **circle**
mark, violet objects carry a **diamond**.

**Lane types.** Eight ship in this release — safe zones, security packets,
data platforms, scanners, corruption, encryption gates, pulse streams and
relays (platforms that flip frequency underneath you on a timer).

**Moving platforms.** Void rows have no floor. Support is a continuous
relationship re-evaluated every frame, not a one-off collision: a bar can
slide out from under you, or phase out when its frequency changes. While
attached, you inherit the platform's motion smoothly — and if it carries you
past the edge of the network, you lose the attempt.

**Telegraphing.** Scanners always charge before they fire, gates flash before
they flip, and relays flash before they change frequency. Nothing lethal
arrives without warning.

## Features

- 12 handcrafted levels with a deliberate teaching progression
- Four-direction tile movement with a one-deep input buffer
- Eight lane types, multi-uplink levels, partial-width lanes for split routes
- Signal fragments, near-miss bonuses and an arcade scoring system
- Per-level best time, best score, best fragment count and badges
- Level select with sequential unlocking and free replay
- Statistics screen; local save with a safe fallback when storage is blocked
- Synthesised sound effects and optional ambient music — no audio files ship
- Optional haptics, reduced-effects mode, reduced-motion support
- Installable PWA, fully playable offline, deploys to a GitHub Pages subpath

## Technical approach

The one decision everything else follows from: **the world is a pure function
of time.**

Every moving object's position is computed analytically from the lane's
definition and the current world time, rather than simulated step by step:

```js
// laneObjects.js — a lane's objects are evenly spaced slots on a wrap period
const period = slotCount(lane, cols) * lane.spacing;
const low = laneFrom(lane) - maxObjectSize(lane) - 1;
const raw = lane.offset + index * lane.spacing + lane.direction * lane.speed * t;
return low + mod(raw - low, period);
```

That buys four things:

1. **Exact frame-rate independence.** No accumulated drift; a 30fps phone and
   a 120fps one agree on where everything is.
2. **Seamless wrapping** with exact spacing and no spawn/despawn bookkeeping,
   so lane object arrays never grow.
3. **Pause and tab-switch safety.** Timers cannot desynchronise, because there
   are no timers — only a single accumulated `worldTime`.
4. **Offline verifiability.** Because the whole world is reproducible from one
   number, a route search can prove a level is completable. See
   [Verification tools](#verification-tools).

Other notable choices:

- **Shared rules, one implementation.** `motion.js` holds the player's
  movement rules as a pure state machine with no knowledge of canvases or
  audio. The browser game and the offline level solver both drive that same
  module, so the validator cannot certify a game that plays differently.
- **Input is queued, not immediate.** Events arrive at arbitrary points
  between frames. Acting on one the instant it fires would resolve the move
  against the *previous* frame's world, so the same swipe could succeed or
  kill you depending on where in the frame it landed. Input is drained at a
  fixed point in the update order instead.
- **Collision is forgiving and float-safe.** The collision circle is smaller
  than the drawn body, and lethal contact requires genuine penetration rather
  than tangency — otherwise a graze with zero visible clearance kills, and
  *whether* it kills comes down to the last bits of a double.
- **The board is cached.** Grid, lane beds, walls and safe zones are drawn
  once into an offscreen canvas and blitted; only moving objects are redrawn.
  `shadowBlur` is reserved for the player, uplinks and fragments.
- **Bounded everything.** Particles use a fixed-capacity pool with
  swap-removal, lane shapes are pooled per lane, and the steady-state
  allocation of the running game is zero.
- **Authoritative state in one place.** `game.js` owns state via one explicit
  state machine; the renderer reads and never writes.

## Project structure

```
index.html              app shell, all screens
styles.css              layout, chrome, responsive rules
manifest.webmanifest    PWA manifest (relative paths)
sw.js                   service worker, versioned cache
icons/                  generated PNG icons

src/
  main.js               composition root — wires modules, owns no rules
  config.js             every balance value in the game
  game.js               state machine, scoring, uplinks, badges, progression
  loop.js               requestAnimationFrame, delta clamping, sub-stepping
  motion.js             player movement rules (pure; shared with the solver)
  player.js             player entity — motion plus visuals and sub-states
  input.js              swipe, tap, pointer and keyboard handling
  collisions.js         all collision categories in one fixed priority
  lanes.js              lane runtime — turns definitions into per-frame shapes
  laneObjects.js        slot maths; packets, pulse streams, corruption
  platforms.js          platform and relay lanes; support resolution
  scanners.js           sweep, blink and segment scanners
  gates.js              encryption gates
  levels.js             the twelve levels — pure data
  levelLoader.js        normalisation, lookup tables, dev-time validation
  renderer.js           canvas drawing (reads state, never writes)
  particles.js          bounded, pooled particle system
  audio.js              synthesised sound; haptics
  storage.js            localStorage with a never-throw contract
  ui.js                 DOM screens and HUD
  pwa.js                service worker registration, install prompt
  utils.js              small shared helpers

tools/
  serve.mjs             zero-dependency static dev server
  validate-levels.mjs   proves every level is completable
  playtest.mjs          drives the real Game class through all 12 levels
  solver.mjs            breadth-first route finder over the real world
  diag.mjs              tick-by-tick route/live comparison for level authoring
  generate-icons.mjs    rasterises the PNG icon set
```

## Local development

No dependencies to install. ES modules and service workers both need a real
HTTP origin, so opening `index.html` from the filesystem will not work.

```bash
npm start
```

Then open <http://localhost:8123>. Any static server works;
`tools/serve.mjs` exists only so the project has nothing to install. It sends
`Cache-Control: no-store` so the service worker does not serve you yesterday's
build while you wonder why your edit did nothing.

If you are iterating on source files and see stale behaviour, the service
worker is doing its job — clear it from DevTools → Application → Service
Workers, or run this in the console:

```js
(async () => {
  for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
  for (const k of await caches.keys()) await caches.delete(k);
  location.reload();
})();
```

## Verification tools

Because the world is deterministic, level design is verifiable rather than
guessed at.

```bash
npm run validate     # prove every level has a route
npm run playtest     # drive the real Game class through all 12 levels
npm test             # both
```

**`validate-levels.mjs`** runs a breadth-first search over
`(row, x, frequency, tick)` using the engine's own motion and collision code.
For every uplink of every level it reports the fastest possible route, checks
a route still exists when you respawn at an awkward phase, and flags any level
that can be walked straight through without ever waiting — which would mean it
teaches nothing.

```
  ✓  7 Relay Transfer    optimal 1.6s        worst-phase  1.9s   rush-through   0%
  ✓ 12 Final Uplink      optimal 2.0s/2.1s/2.0s   worst-phase  2.6s   rush-through   0%
```

(The "optimal" times are what a perfect player with full knowledge could
achieve; they are a solvability floor, not a target. The target times used for
the Low Latency badge are set per level in `levels.js`.)

**`playtest.mjs`** goes a layer up and drives the actual `Game` class along
those routes, which exercises what a route search never touches: the state
machine, uplink activation and respawn, scoring, badges, fragments, death
handling and persistence. It also deliberately kills the player to confirm
activated uplinks survive, simulates 12,000 frames watching for unbounded
growth, and checks that 30/60/120fps agree on where a carried player ends up.

Useful single-level invocations:

```bash
npm run validate -- 7 --route   # print the winning input sequence for level 7
node tools/diag.mjs 3 0         # tick-by-tick solver-vs-live comparison
```

## Deploying to GitHub Pages

The project is static — push it and enable Pages.

```bash
git init && git add . && git commit -m "Signal Runner"
git branch -M main
git remote add origin https://github.com/<user>/signal-runner.git
git push -u origin main
```

Then **Settings → Pages → Source: Deploy from a branch**, branch `main`,
folder `/ (root)`. The game will be live at
`https://<user>.github.io/signal-runner/`.

Nothing needs changing for the subdirectory. Every path in the project is
relative, the manifest uses `"start_url": "./"` and `"scope": "./"`, and the
service worker resolves its precache list against `self.registration.scope`
and registers against `document.baseURI`. A single leading slash anywhere
would point at the user's root Pages site instead — this is verified by
serving the project under a `/signal-runner/` prefix and confirming all 31
cached entries stay inside it.

**Bump `CACHE_VERSION` in `sw.js` on every deploy.** Old caches are deleted on
activate, so a stale build cannot outlive its replacement.

## PWA notes

- Precaches the whole app on install — it is small and entirely static, so a
  first offline launch has nothing missing.
- Navigations are network-first with a cache fallback: a deployed update is
  picked up promptly, but a flaky connection still opens the app. Everything
  else is cache-first, because assets are version-stamped by cache name.
- When a new version installs, an unobtrusive banner offers a reload rather
  than swapping code under a running game. Accepting it triggers
  `skipWaiting`, the old cache is deleted on activate, and the page reloads
  once.
- Icons are generated, not committed as opaque binaries — `npm run icons`
  re-rasterises the whole set from `tools/generate-icons.mjs`, including a
  maskable variant with the artwork inside the safe zone.
- Audio is synthesised, so there are no media files to cache and no autoplay
  fight; the audio context is created on the first user gesture and every
  entry point tolerates it being blocked outright.

## Level data format

Levels are plain data in `src/levels.js`. The engine never branches on a level
id, so adding a thirteenth level means appending an object and nothing else.

Row 0 is the terminal row at the top, row 12 is the spawn row at the bottom,
column 0 is the left edge. "Forward" is decreasing row.

```js
{
  id: 3,
  name: 'Data Stream',
  description: 'The floor runs out. Ride the stream or lose the signal.',
  targetTime: 44,              // seconds — the Low Latency threshold
  difficulty: 2,
  backgroundVariant: 1,
  playerStart: { row: 12, col: 4 },
  uplinks: [{ col: 4 }],       // always on row 0
  lanes: [ /* see below */ ],
  collectibles: [{ row: 5, col: 7 }],
  walls: [{ row: 4, col: 0 }], // solid cells, used to funnel routes
  tutorialPrompts: [
    { id: 'platforms', trigger: { type: 'row', row: 10 }, text: '...' },
  ],
}
```

Any row you do not declare becomes a safe zone automatically.

### Lane fields

| Field | Applies to | Meaning |
| --- | --- | --- |
| `row` | all | Which row this lane occupies |
| `type` | all | `safe`, `packet`, `platform`, `relay`, `scanner`, `corruption`, `gate`, `pulse` |
| `direction` | moving | `1` (right) or `-1` (left) |
| `speed` | moving | Cells per second |
| `spacing` | moving | Distance between object starts, in cells |
| `size` / `sizes` | moving | Object width; `sizes` cycles per slot |
| `offset` | moving | Starting phase, in cells |
| `polarity` / `polarities` | any | `'cyan'`, `'violet'`, or omitted for neutral |
| `from` / `to` | any | Restrict the lane to part of the width — this is what makes split routes possible |
| `pattern` | scanner | `sweep`, `blink` or `segments` |
| `cycle`, `duty`, `phase`, `warn` | scanner, gate, pulse | Timing of the on/off cycle |
| `stride` | scanner | Column period for `segments` |
| `alternatePolarity` | scanner | Flip frequency between passes |
| `cells`, `mode`, `phaseStep` | gate | Gate columns and cycle mode (`toggle`, `polarity`, `static`); a cell may override the lane frequency |
| `trail` | corruption | Seconds a tile stays lethal after a cluster passes |
| `stagger` | relay | Offset between adjacent bars in the flip cycle |

### Validation

`levelLoader.js` validates on load and warns loudly on localhost only: bad row
indexes, unknown lane types, invalid polarities, objects wider than their
spacing, gaps too tight to stand in, platform coverage too sparse to read,
scanner duty cycles that leave no safe window, gate columns out of range,
spawn points on hazardous rows. Route-level solvability is proved separately
and offline by `npm run validate`.

## Balance configuration

Everything that affects how the game *feels* lives in `src/config.js` — grid
size, move duration, swipe thresholds, polarity cooldown, collision
forgiveness, respawn timing, score values, near-miss distance, particle
limits, audio volume, tutorial timings. Nothing in the engine invents its own
constant.

## Accessibility

- Polarity is carried by **shape** (circle / diamond) as well as colour,
  everywhere it appears: player core, hazards, platforms, gates, HUD button.
- Scanner warnings are visual — a hatched area and a filling charge bar — so
  nothing depends on audio.
- **Reduced effects** removes screen shake, flashes and most particles while
  preserving every piece of gameplay information.
- `prefers-reduced-motion` is honoured on first run and by all CSS
  transitions; it never overrides a choice already made in Settings.
- Full keyboard control, visible focus rings, labelled buttons, `aria-checked`
  toggles, live-region toasts, and touch targets at or above 44px.
- Sound, music and haptics are each independently optional and saved locally.

## Browser support

Chrome/Edge 90+, Firefox 90+, Safari 15.4+, and their mobile equivalents.

Requires ES modules, `ResizeObserver`, Canvas 2D and Pointer Events. Optional
and degraded gracefully: service workers (offline), `beforeinstallprompt`
(install button — only Chromium fires it, so elsewhere the button stays hidden
rather than lying), Web Audio (sound), `navigator.vibrate` (haptics),
`CanvasRenderingContext2D.roundRect` (falls back to `arcTo`).

If `localStorage` is unavailable or full, the game runs normally and keeps
progress in memory for the session; the Settings screen says so plainly.

## Known limitations

- Portrait by design. Landscape works but the board simply gets shorter; there
  is no separate landscape layout.
- Cells are allowed to stretch up to 16% taller than wide to reclaim dead
  space on tall phones. On an unusually tall and narrow viewport you may still
  see letterboxing above and below the board — this is deliberate, since
  distorting cells further would make lane heights misleading.
- The offline solver caps its search at 30 seconds of game time per uplink.
  That is far more than any level needs, but a substantially larger or slower
  level would need the cap raised.
- `beforeinstallprompt` is Chromium-only; on iOS, installing is done through
  Safari's **Share → Add to Home Screen**.
- No cloud save. Progress is per-device and per-browser, by design — there is
  no backend and no account.

## Future ideas

Deliberately out of scope for this release: endless survival mode, a daily
seeded challenge, a three-frequency expert mode, moving uplinks, teleport
nodes, local ghost replays, shareable result cards, challenge modifiers, an
achievement system, additional level packs, alternative visual themes, and a
level editor.

The level format and the loader were built with that last one in mind — the
engine already loads arbitrary level definitions without structural code
changes, and the validator can prove a generated level is beatable before it
ever reaches a player.

---

MIT licensed.
