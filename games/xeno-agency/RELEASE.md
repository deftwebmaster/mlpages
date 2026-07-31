# Xeno Agency Release Checklist

Xeno Agency ships as a static browser game. Host the repository root on any static file host; no build step, backend, database, account system, or environment variables are required.

## Release Contents

- `index.html`, `styles.css`, and `app.js` contain the playable game.
- `manifest.webmanifest`, `sw.js`, and `assets/icons/` provide installable PWA metadata and offline reload support after the first successful load.
- `assets/portraits/` contains the twelve individual alien portraits used by candidate, profile, and legacy archive views.
- `.nojekyll` keeps GitHub Pages from treating underscore-prefixed paths or static assets as Jekyll content.

## Preflight

Run these checks before publishing:

```sh
node --check app.js
node --check sw.js
node -e "JSON.parse(require('fs').readFileSync('manifest.webmanifest','utf8')); console.log('manifest ok')"
node tools/balance-smoke.mjs
node tools/save-migration-smoke.mjs
```

Then serve locally and open the app:

```sh
python3 -m http.server 8010
```

Visit `http://localhost:8010/`, start or load a save, open Save, export a save file, and confirm the About this build panel appears.

## Publishing Notes

- Publish from the repository root so relative asset paths resolve consistently.
- Keep `sw.js` cache names bumped whenever cached assets change.
- Player progress remains local to each browser. Ask players to export saves before changing devices, clearing site data, or moving to another browser.
