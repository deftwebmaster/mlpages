// Reactor Breach service worker.
// Bump CACHE_VERSION on every deploy so stale assets are replaced cleanly.
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `reactor-breach-${CACHE_VERSION}`;

const SCOPE_URL = new URL(self.registration.scope);
const rel = (p) => new URL(p, SCOPE_URL).pathname;

const PRECACHE_URLS = [
  '',
  'index.html',
  'manifest.webmanifest',
  'css/styles.css',
  'icons/icon.svg',
  'icons/icon-maskable.svg',
  'js/abilities.js',
  'js/audio.js',
  'js/bosses.js',
  'js/collisions.js',
  'js/componentBehaviors.js',
  'js/components.js',
  'js/config.js',
  'js/connections.js',
  'js/deflector.js',
  'js/energyPackets.js',
  'js/game.js',
  'js/hazards.js',
  'js/input.js',
  'js/loop.js',
  'js/main.js',
  'js/objectives.js',
  'js/orb.js',
  'js/orbManager.js',
  'js/particles.js',
  'js/physics.js',
  'js/powerRouting.js',
  'js/powerUps.js',
  'js/pwa.js',
  'js/renderer.js',
  'js/scoring.js',
  'js/shields.js',
  'js/stageHelpers.js',
  'js/stageLoader.js',
  'js/stages.js',
  'js/storage.js',
  'js/ui.js',
  'js/utils.js'
].map(rel);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached || caches.match(rel('index.html')));
      return cached || networkFetch;
    })
  );
});
