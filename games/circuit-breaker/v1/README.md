# Circuit Breaker

**Match nodes. Build combos. Keep the grid alive.**

An offline-ready, installable match-three puzzle game for the browser. Swap
energised circuit nodes to discharge them, chain cascades to cool the system, and
push your score as far as you can before the grid hits 100% heat.

No backend, no accounts, no dependencies — the source *is* the deployable site.

> **Screenshot placeholder** — drop a capture of the game screen at
> `assets/screenshot.png` and swap this block for
> `![Circuit Breaker](assets/screenshot.png)`.

---

## Features

- 7×7 board, five node types, each with its own colour **and** shape
- Tap-to-swap, swipe-to-swap, mouse, and full keyboard play
- Cascade chains with rising score multipliers (`CHAIN x2` → `SYSTEM SURGE xN`)
- **Heat**: every valid move adds heat; big matches and chains cool it back down
- **Line Breaker** special node — match four in a line, then set it off to
  discharge a whole row or column (breakers chain into each other)
- Automatic deadlock detection and reshuffle — the board can never get stuck
- Synthesised sound effects (Web Audio, no audio files) and optional haptics
- Local best score, run count, and lifetime score
- First-run tutorial, help screen, pause, and a stats-rich game-over panel
- Installable PWA that works fully offline after the first visit
- Respects `prefers-reduced-motion`, plus a manual "reduced FX" switch

## Play locally

The game needs to be served over HTTP (ES modules and service workers do not run
from `file://`).

```bash
npm start
```

Then open <http://localhost:5173/>. Any static server works — the dev server here
is a ~60-line zero-dependency script.

Run the logic tests (board generation, matching, specials, gravity, deadlock
recovery, scoring, heat, plus 200 simulated full games):

```bash
npm test
```

## Deploy to GitHub Pages

1. Push this directory to a repository.
2. **Settings → Pages → Build and deployment → Deploy from a branch**, then pick
   your branch and the `/ (root)` folder.
3. Wait for the Pages build, then open `https://<user>.github.io/<repo>/`.

Every path in the project is relative, so the app runs correctly from a project
sub-path — no base-href edits, no build step. The included `.nojekyll` file stops
Jekyll from stripping anything.

To confirm sub-path hosting before you deploy, serve it under a prefix locally:

```bash
node tools/serve.mjs 5173 /circuit-breaker/
```

## PWA notes

- `manifest.webmanifest` declares the app; icons live in `assets/icons/`.
- `sw.js` precaches the whole app under a versioned cache name.
  **Bump `CACHE_VERSION` in `sw.js` on every release.**
- Code (HTML/CSS/JS) is network-first with a cache fallback, so markup and
  modules can never come from two different builds and a new deploy lands on the
  next online load. Icons are cache-first with a background refresh.
- When an update installs, the game shows a "new build installed" prompt rather
  than reloading underneath you mid-run.
- The install button on the main menu appears only where the browser offers an
  install prompt (Chromium). On iOS, use Share → Add to Home Screen.

## Project structure

```
index.html               app shell: every screen and overlay
css/styles.css           complete visual system
js/config.js             ← all balance values live here
js/utils.js              timing, reduced-motion, cancellable waits
js/board.js              board model: generation, gravity, refill, reshuffle
js/matches.js            match detection, special planning, breaker chains
js/scoring.js            per-step score and cooling
js/heat.js               heat value and presentation stages
js/renderer.js           DOM mirror of the model, animations, particles
js/input.js              tap, swipe, mouse, keyboard, input locking
js/game.js               state machine and the turn pipeline
js/tutorial.js           first-run coaching
js/audio.js              synthesised sound effects and haptics
js/storage.js            localStorage with validation and safe fallbacks
js/pwa.js                service-worker registration and install prompt
sw.js                    offline caching
tools/generate-icons.py  regenerates the icon set (stdlib only)
tools/serve.mjs          dev server
tools/test-logic.mjs     headless model tests
```

The board model is the single source of truth; the DOM only ever mirrors it. One
explicit state machine (`js/game.js`) owns turn flow — there are no scattered
`isAnimating` flags.

## Balance configuration

Everything tunable is in [`js/config.js`](js/config.js): board size, heat gain
and cooling, score table, cascade multipliers, animation durations, swipe
thresholds, heat stage thresholds, and feature flags.

Current defaults give roughly a 15-move run for careless play and 25+ moves at
3× the score when you play for cooling — verified by the simulation in
`npm test`.

## Browser support

Modern evergreen browsers: Safari 16.4+ (iOS 16.4+), Chrome/Edge 105+, Firefox
110+. Requires ES modules, CSS container queries, and `color-mix()` — a plain
solid-colour fallback is used where `color-mix()` is unavailable.

## Known limitations

- The board itself is not fully screen-reader playable. Nodes carry descriptive
  ARIA labels and keyboard play works, but there is no spoken board overview.
- No landscape-specific layout; the game is designed and locked to portrait.
- Best scores are per-browser (localStorage) — clearing site data clears them.
- One special node type ships in this version (Line Breaker).

## Future ideas

Pulse Bomb (3×3 clear from an L/T match), Wildcard Core (clear all of one type
from a five-match), daily seeded challenge, limited-move and timed modes,
unlockable themes, and a local statistics dashboard. The matching and special
systems are structured so these slot in without rewriting detection.
