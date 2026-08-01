/**
 * Service worker.
 *
 * Every path is registered relative to the worker's own scope, so the same file
 * works from a domain root or from a GitHub Pages project subdirectory.
 *
 * Strategy:
 *   navigation requests → network first, falling back to the cached shell
 *   same-origin assets  → cache first, refreshed in the background
 *   cross-origin        → left to the network entirely
 *
 * Bump CACHE_VERSION on every deploy; old caches are deleted on activate.
 */

const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `blackbox-courier-${CACHE_VERSION}`;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/main.js',
  './js/game.js',
  './js/loop.js',
  './js/renderer.js',
  './js/player.js',
  './js/input.js',
  './js/world.js',
  './js/chunks.js',
  './js/generator.js',
  './js/obstacles.js',
  './js/collisions.js',
  './js/particles.js',
  './js/audio.js',
  './js/storage.js',
  './js/ui.js',
  './js/config.js',
  './js/pwa.js',
  './js/utils.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
].map((p) => new URL(p, self.registration.scope).toString());

const SHELL = new URL('./index.html', self.registration.scope).toString();

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        // addAll fails atomically; add individually so one missing optional
        // asset cannot block the whole install.
        Promise.all(
          PRECACHE.map((url) =>
            cache.add(new Request(url, { cache: 'reload' })).catch(() => undefined)
          )
        )
      )
      .then(() => self.skipWaiting())
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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(SHELL, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(SHELL).then((r) => r || caches.match(req)))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
