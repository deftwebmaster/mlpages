# Salvage Zero

**Break the wreckage. Recover the core. Escape alive.**

A mobile-first arcade salvage game built with vanilla HTML5/Canvas/JavaScript. No build step, no backend, no accounts. Runs entirely in the browser and installs as an offline-capable PWA.

## Play locally

Any static file server works, e.g.:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. (Opening `index.html` directly via `file://` will not work — the game uses ES modules and a service worker, both of which require `http(s)://`.)

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. In the repo settings, open **Pages** and set the source to the `main` branch, root folder.
3. Wait for the Pages build to finish, then open the published URL.

No build step or code changes are required — every path in `index.html`, `manifest.json`, and `service-worker.js` is relative, so the game works correctly whether it's served from a domain root or a repository subpath (`username.github.io/repo-name/`).

## Project structure

```
index.html            App shell + all screens (menu, mission select, HUD, overlays)
style.css              All styling (dark industrial sci-fi theme, responsive/mobile-first)
manifest.json           PWA manifest
service-worker.js       Offline caching (cache-first app shell)
icons/                  App icons (SVG + generated PNG/maskable)
js/
  main.js                Entry point, service worker registration
  game.js                 State machine + main loop + tick/collision orchestration
  draw.js                 All canvas rendering
  config.js               Tunable constants, wreck/salvage definitions
  utils.js                Math helpers, object pool
  storage.js               localStorage save/load (prefix: salvageZero_)
  physics.js               Momentum integration, wrapping, elastic collision
  renderer.js               Camera, toroidal world->screen projection, starfield
  input.js                  Keyboard + touch (virtual joystick/buttons) input
  ship.js                    Player ship physics, heat, hull, weapon firing
  projectiles.js              Pulse cannon projectile pool
  wrecks.js                    Wreck entity defs/lifecycle, reactor countdown
  fragmentation.js              Wreck destruction -> fragment/salvage spawning
  collisions.js                  Wrap-aware spatial hash grid
  tractor.js                      Tractor beam physics, salvage entities
  particles.js                     Pooled particle effects
  missions.js                       All 12 contracts (data-driven, seeded layouts)
  ui.js                              HUD/menus/radar/score+rank calculation
  audio.js                           Web Audio API synthesized SFX (no audio files)
```

## Design notes

- **Mission layouts are seeded, not hand-plotted pixel-by-pixel.** Each contract in `js/missions.js` authors its wreck mix, quota, hazards, timer, and optional objectives by hand; exact debris placement uses a deterministic PRNG seeded per mission ID, so every playthrough of a given contract has the same layout.
- **World wrapping** is a true torus: entities store raw positions wrapped into `[0, worldW) x [0, worldH)`, and the camera projects everything using the shortest signed delta, so wrapping is seamless with no visible popping at any zoom/position.
- **All audio is synthesized** with the Web Audio API (oscillators + filtered noise) rather than loaded from files, keeping the PWA's offline cache small and asset-free.

## Controls

**Desktop:** A/D rotate · W thrust · S brake · Space fire · Shift tractor beam · Esc pause
**Mobile:** left thumb virtual joystick (steer) · right-side Thrust/Fire/Tractor/Brake buttons
