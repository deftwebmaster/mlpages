/**
 * sw.js — Offline support.
 *
 * Gridlock is a fixed set of small static files with no backend, so the cache
 * strategy is deliberately simple:
 *
 *   • install  — precache the whole app shell
 *   • fetch    — cache-first for everything we own (instant, works offline),
 *                falling back to the network, then to index.html for
 *                navigations so deep links still boot the app
 *   • activate — delete every cache that is not the current version
 *
 * Bump CACHE_VERSION on release; the old cache is dropped on activation and the
 * page is told to reload at the user's convenience (see main.js).
 */

const CACHE_VERSION = 'gridlock-v2.0.0';

/** Paths are relative so the app works from a GitHub Pages project subpath. */
const PRECACHE = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'js/main.js',
  'js/game.js',
  'js/config.js',
  'js/utils.js',
  'js/storage.js',
  'js/audio.js',
  'js/input.js',
  'js/particles.js',
  'js/pathfinding.js',
  'js/maze.js',
  'js/shift.js',
  'js/drone.js',
  'js/player.js',
  'js/entity.js',
  'js/renderer.js',
  'js/levels.js',
  'js/ui.js',
  'icons/favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      // addAll is atomic: one bad entry would leave the app half-cached, so add
      // individually and let a single failure degrade rather than break install.
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => {
            /* a missing optional asset must not block installation */
          })
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) {
        // Refresh in the background so the next launch is up to date.
        event.waitUntil(refresh(request));
        return cached;
      }

      try {
        const response = await fetch(request);
        if (response && response.ok && response.type === 'basic') {
          const cache = await caches.open(CACHE_VERSION);
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        if (request.mode === 'navigate') {
          const shell = await caches.match('index.html', { ignoreSearch: true });
          if (shell) return shell;
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })()
  );
});

async function refresh(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === 'basic') {
      const cache = await caches.open(CACHE_VERSION);
      await cache.put(request, response);
    }
  } catch {
    /* offline — the cached copy stands */
  }
}

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
