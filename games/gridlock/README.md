# Gridlock

**Own the maze. Rewrite the pursuit.**

A real-time arcade maze game for the browser. You are an energy siphon inside a
secured facility, draining every node before the security drones corner you —
except you can also *reconfigure the facility itself*. Grid Shift terminals
rotate junctions, slide walls, toggle gates, extend bridges and drop barriers,
turning the maze from a fixed board into your main weapon.

No backend, no accounts, no build step. Plays offline, installs as an app.

```bash
node tools/serve.mjs      # → http://localhost:4173
```

---

## Highlights

| | |
|---|---|
| **15 handcrafted sectors** | Designed as readable topology diagrams, compiled to literal ASCII tile maps |
| **5 drone personalities** | Hunter, Interceptor, Sentinel, Tracker and Wanderer — one FSM, five goal functions |
| **Grid Shift** | Six reusable maze mutations, every one validated before the player sees it |
| **Provably completable** | An exhaustive linter checks every reachable combination of shift states |
| **Zero dependencies** | Vanilla ES modules, Canvas 2D, Web Audio, localStorage, Service Worker |
| **Offline PWA** | Installable, works with no network, deploys to GitHub Pages unmodified |

---

## How it works

### The Grid Shift safety guarantee

The signature mechanic is also the biggest correctness risk: a maze that
reconfigures itself can trivially seal a player in, bury a drone inside a wall,
or strand the last energy node behind a fresh wall. Gridlock makes that
impossible in two layers.

**At runtime**, `ShiftController.activate()` is two-phase. It asks the behaviour
for a *plan*, applies it speculatively, works out where every entity would end
up, and then proves the maze is still winnable — every remaining node, power
module and terminal reachable from the player's tile. If the proof fails the
whole thing is rolled back and the player gets a "SHIFT REFUSED" toast
explaining why. Entities that a rotation would embed in a wall are pulled to the
nearest walkable tile first; a bridge that would strand the player on retraction
simply stays extended and retries.

**Offline**, `tools/validate-levels.mjs` explores every reachable combination of
terminal states for every level — up to 88 distinct maze configurations on the
late sectors — and asserts the same invariant on each. That is design brief
acceptance criterion 4, checked exhaustively rather than assumed.

```bash
node tools/validate-levels.mjs
#   ✓ L14 Blackout   163 nodes · 5 drones · 2 secrets · 88 shift states · …
#   All 15 levels valid. 0 warnings.
```

### Level authoring

Every maze sits on a 7×7 lattice of junctions three tiles apart. That means a
level's structure is a 13×13 diagram you can read at a glance:

```
o-o-o-o-o-o-o        o  a junction
| |   |   | |        -  a corridor between two junctions
o-o-o o o-o-o           (a missing - or | is a wall)
```

`tools/level-authoring.mjs` holds those diagrams plus the hand-placed spawns,
power modules, terminals, gates and secret compartments, and compiles them into
the literal ASCII maps in [`js/levels.js`](js/levels.js). The shipped file is
plain data with no runtime generation, and stays hand-editable — edit it
directly for a quick tweak, or edit the diagram and regenerate.

```bash
node tools/level-authoring.mjs
```

### Drone AI

All five drones run the same five-state machine — patrol, chase, frightened,
returning, recovering. What makes them feel like different characters is the
goal tile each one picks while chasing, not different code paths:

- **Hunter** — your tile. Relentless and readable.
- **Interceptor** — four tiles ahead of your heading. Cuts corners off.
- **Sentinel** — walks a beat between its corner and its pad, engages within seven tiles.
- **Tracker** — extrapolates your recent path six tiles forward to guess the escape.
- **Wanderer** — a random goal every few seconds. Ignores the rules everyone else follows.

Steering is gradient descent on a BFS distance field rebuilt eight times a
second, and immediately whenever `maze.version` changes. A stale field can only
ever cause one slightly-wrong step, never an invalid move — which is what lets
drones survive the maze changing shape underneath them. A drone sealed off by a
shift idles politely until a route reappears rather than thrashing.

### Playtest harness

`tools/playtest.mjs` runs the real `Game` — real maze, real drones, real shift
executor, rendering and audio stubbed — with a scripted bot at the controls, for
every level. It answers what a screenshot cannot: can each sector actually be
cleared, does any drone stall permanently after a maze change, does anything
throw across tens of thousands of simulated frames.

```bash
node tools/playtest.mjs        # all 15 levels, ~4s
node tools/playtest.mjs 14     # one level
GRIDLOCK_DEBUG=1 node tools/playtest.mjs 14   # explain the deaths
```

It earns its keep. It caught three real defects during development: drones
running at 98% of player speed (perfect pathfinding at near-parity makes a chase
mathematically unwinnable), an idle siphon auto-charging into a corner and dying
on repeat, and secret compartments whose carving severed a corridor and left a
six-tile dead end that was a guaranteed death if a drone followed you in.

---

## Controls

| | |
|---|---|
| **Mobile** | Swipe anywhere on the board; optional virtual D-pad (Settings → auto/always/never) |
| **Desktop** | `WASD` or arrow keys · `Esc`/`P` pause · `R` restart · `Space` confirm · `M` mute |

Your next turn is buffered for 0.42 s, so an early swipe registers but a stale
one never hijacks you two junctions later. Reversing takes effect instantly
mid-corridor. The siphon holds still until you first steer on each life.

---

## Scoring

| Event | Points |
|---|---|
| Energy node | 10 |
| Bonus node (secret) | 25 |
| Power module | 50 |
| Drone (chained) | 100 → 200 → 400 → 800 → 1600 |
| First use of a terminal | 250 |
| Secret compartment found | 500 |
| Perfect Clear | 1000 |

Rank blends time against the sector's target, deaths, and secrets found:
**S+ / S / A / B / C**. A **Perfect Clear** needs no deaths, every secret, and
the target time — and awards a medal on the level select.

There is no game over. Deaths cost time and rank, never the run.

---

## Project layout

```
index.html            app shell — every screen
styles.css            interface styles, mobile-first
manifest.webmanifest  PWA manifest
sw.js                 service worker (cache-first app shell)

js/
  main.js         bootstrap, fixed-timestep loop, PWA wiring
  game.js         session orchestration, scoring, run state machine
  config.js       every tunable constant and enum
  maze.js         tile grid, collectables, ASCII parsing, validation
  shift.js        Grid Shift behaviours + two-phase safe executor
  drone.js        five personalities over one FSM
  player.js       buffered tile movement
  entity.js       shared tile-locked mover
  pathfinding.js  BFS flow fields, flood fill, direction choice
  renderer.js     Canvas 2D, cached static maze layer, shift animations
  particles.js    pooled particle system + named effects
  audio.js        fully synthesised SFX and generative soundtrack
  input.js        keyboard, swipe, virtual D-pad
  storage.js      progress, records, settings, achievements
  levels.js       the 15 sectors (generated data, hand-editable)
  ui.js           screens, HUD, overlays

tools/
  level-authoring.mjs   level design source → js/levels.js
  validate-levels.mjs   exhaustive maze + shift-safety linter
  playtest.mjs          headless bot soak test
  gen-icons.mjs         procedural PWA icons (PNG via zlib only)
  serve.mjs             zero-dependency static server
```

## Verify everything

```bash
node tools/level-authoring.mjs && node tools/validate-levels.mjs && node tools/playtest.mjs
```

## Deploying to GitHub Pages

Push the repository and enable Pages on the branch root. Nothing else is
required — there is no build step, `.nojekyll` is present so the `js/` directory
is served verbatim, and every path in the HTML, manifest and service worker is
relative, so it works from a project subpath (`user.github.io/gridlock/`) as well
as a domain root.

Bump `CACHE_VERSION` in [`sw.js`](sw.js) when you ship an update; the old cache
is dropped on activation and players are told a new version is ready.

## Performance

Targets 60 FPS on modern phones. Gameplay integrates on a fixed 1/120 s timestep
so movement, collision and AI decisions are identical at 60, 90 or 120 Hz, while
rendering stays as smooth as the display allows. The maze geometry is drawn once
into an offscreen canvas and blitted each frame — a Grid Shift costs one rebuild,
not sixty a second. Particles are pooled, pathfinding buffers are preallocated,
and a running game allocates essentially nothing per frame.

## Browser support

Any browser with ES modules and Canvas 2D. `roundRect` is polyfilled for older
iOS Safari. Audio initialises on the first user gesture, as mobile requires.
Progress lives in `localStorage` under the `gridlock_` prefix; if storage is
unavailable (private browsing) the game stays fully playable, just amnesiac.
