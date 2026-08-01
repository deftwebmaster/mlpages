# Paper Pilot

Static, GitHub Pages-hostable canvas game about drawing wind currents for paper planes.

## Current Features

- Draw blue lift rails and gold gust rails.
- Erase whole rails by touching/clicking near them.
- Pan and wheel-zoom the canvas.
- Launch/reset a paper plane with rail-influenced glide physics.
- Five built-in challenge levels.
- Stars to collect, landing pads, win/fail result states, attempts, timer, scoring, and best scores.
- Undo/redo, clear, and per-level localStorage save.
- Particle bursts, animated wind rails, light Web Audio cues, and wind-responsive plane wobble/trails.
- Mobile focus mode and two-finger pinch zoom.
- Main menu, settings, level unlock flow, reset progress, and route import/export share codes.
- Static `index.html`/CSS/ES module structure.
- Minimal manifest and service worker for offline shell caching.

## Ship Notes

- Serve from a static web server or GitHub Pages. Firefox blocks ES modules when opened directly from `file://`.
- The game is self-contained and uses localStorage for per-device progress, settings, saved routes, and best scores.
