# Paper Pilot

Static, GitHub Pages-hostable canvas game about drawing wind currents for paper planes. Mobile-first, no build step, no dependencies.

## Current Features

- Draw blue lift rails and gold gust rails.
- Erase whole rails by touching/clicking near them.
- Pan, wheel-zoom, and two-finger pinch zoom the canvas.
- Launch/reset a paper plane with rail-influenced glide physics.
- Five built-in challenge levels.
- Stars to collect, landing pads, win/fail result states, attempts, timer, scoring, and best scores.
- Undo/redo, clear, and per-level localStorage save.
- Particle bursts, animated wind rails, drifting parallax clouds, light Web Audio cues, and wind-responsive plane wobble/trails.
- Main menu, settings, level unlock flow, reset progress, and route import/export share codes.
- Static `index.html`/CSS/ES module structure — no build step, no dependencies.
- Minimal manifest and service worker for offline shell caching.

## Mobile & Responsive

- **Adaptive camera** — each level's camera is authored against a 1280×800 reference view. On smaller screens the game scales zoom down (instead of just cropping) so the opening view of a route stays readable, while keeping the launch point anchored at the same relative spot the level was designed at. Desktop is unaffected; the math is a no-op at the reference resolution.
- **Compact mobile chrome** — header, readout, and toolbar shrink their padding/type on narrow or short viewports so more of the canvas stays visible. The toolbar's less-common actions (Reset, Redo, Share, Save, Clear) collapse behind a "More" toggle on phones to keep the primary row short.
- **Landscape phones** get their own layout pass (keyed off viewport *height*, not just width) so the toolbar stays a wrapped horizontal row instead of stacking into a tall column.
- **Mobile focus mode** (toggleable in Settings) fades non-essential chrome while flying or drawing on small screens.
- Haptic feedback (`navigator.vibrate`) on launch, star pickup, and landing, gated behind the Reduced Motion setting.
- Respects the OS-level `prefers-reduced-motion` preference as the default for the in-app Reduced Motion setting (still user-overridable).
- iOS/Android home-screen meta tags (`apple-mobile-web-app-*`, `apple-touch-icon`) for a cleaner "Add to Home Screen" experience.

## Ship Notes

- Serve from a static web server or GitHub Pages. Firefox blocks ES modules when opened directly from `file://`.
- The game is self-contained and uses localStorage for per-device progress, settings, saved routes, and best scores.
- **Service worker caching**: `service-worker.js` cache-first-serves the app shell (`index.html`, `style.css`, `js/*`, manifest, icon). Returning visitors will keep getting the old files until the cache busts, so **bump `CACHE_VERSION` in `service-worker.js` on every deploy that touches `index.html`, `style.css`, or `js/`** — otherwise the update silently won't reach anyone who's already loaded the game. This tripped up local testing during development (the SW re-cached stale CSS after edits) — if you're iterating locally, unregister the service worker and clear Cache Storage from devtools between changes, or use a private/incognito window.
