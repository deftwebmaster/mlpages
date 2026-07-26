/**
 * Circuit Breaker service worker.
 *
 * - Every path is relative to the worker's own scope, so hosting from a
 *   GitHub Pages subdirectory needs no changes.
 * - Code (HTML, CSS, JS) is network-first with a cached fallback. That keeps the
 *   markup and the modules from ever coming from different builds, and means a
 *   new deploy lands on the next online load rather than the one after it.
 * - Immutable-ish assets (icons, manifest) are cache-first with a background
 *   refresh, so repeat loads stay instant.
 * - Either way the game runs fully offline once it has been visited once.
 * - Bump CACHE_VERSION on every release.
 */

const CACHE_VERSION = 'v1.2.0';
const CACHE_NAME = `circuit-breaker-${CACHE_VERSION}`;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/main.js',
  './js/game.js',
  './js/board.js',
  './js/matches.js',
  './js/scoring.js',
  './js/heat.js',
  './js/renderer.js',
  './js/input.js',
  './js/audio.js',
  './js/storage.js',
  './js/tutorial.js',
  './js/config.js',
  './js/utils.js',
  './js/pwa.js',
  './assets/icons/favicon-32.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon-180.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Individually, so one 404 cannot fail the whole install.
    await Promise.all(PRECACHE.map(async (path) => {
      try {
        await cache.add(new Request(path, { cache: 'reload' }));
      } catch {
        /* Non-fatal: the runtime handler will pick it up later. */
      }
    }));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((name) => name.startsWith('circuit-breaker-') && name !== CACHE_NAME)
        .map((name) => caches.delete(name)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Code must stay version-consistent, so it always tries the network first.
  const isCode = request.mode === 'navigate'
    || request.destination === 'document'
    || request.destination === 'script'
    || request.destination === 'style'
    || /\.(?:html|css|m?js)$/.test(url.pathname);

  event.respondWith(isCode ? networkFirst(request) : cacheFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request)
      || await cache.match('./index.html')
      || await cache.match('./');
    if (cached) return cached;
    return new Response('Offline and no cached copy is available.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    // Refresh in the background so the next load gets the newer file.
    fetch(request)
      .then((response) => {
        if (response && response.ok) cache.put(request, response.clone());
      })
      .catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('', { status: 504 });
  }
}
