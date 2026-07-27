/**
 * sw.js — Service worker: offline support with a versioned cache.
 *
 * Strategy:
 *   - Precache the whole app on install. It is small and entirely static, so
 *     there is no reason for a first offline launch to be missing anything.
 *   - Navigations are network-first with a cache fallback, so a deployed
 *     update is picked up promptly but a flaky connection still opens the app.
 *   - Everything else is cache-first, because every asset is version-stamped
 *     by CACHE_NAME rather than by filename.
 *
 * Bump CACHE_VERSION on every deploy. Old caches are deleted on activate, so
 * a stale build cannot outlive its replacement.
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `signal-runner-${CACHE_VERSION}`;

// Relative to the worker's own location, which is what makes this work from a
// GitHub Pages project subdirectory without any path rewriting.
const PRECACHE = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'src/main.js',
  'src/game.js',
  'src/loop.js',
  'src/renderer.js',
  'src/player.js',
  'src/motion.js',
  'src/input.js',
  'src/levels.js',
  'src/levelLoader.js',
  'src/lanes.js',
  'src/laneObjects.js',
  'src/platforms.js',
  'src/scanners.js',
  'src/gates.js',
  'src/collisions.js',
  'src/particles.js',
  'src/audio.js',
  'src/storage.js',
  'src/ui.js',
  'src/config.js',
  'src/pwa.js',
  'src/utils.js',
  'icons/favicon.png',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const urls = PRECACHE.map((path) => new URL(path, self.registration.scope).toString());
      // addAll rejects the whole install if any single request fails, so each
      // asset is fetched individually and failures are reported rather than
      // silently leaving the app half-cached.
      const results = await Promise.allSettled(
        urls.map(async (url) => {
          const response = await fetch(url, { cache: 'reload' });
          if (!response.ok) throw new Error(`${response.status} ${url}`);
          await cache.put(url, response);
        }),
      );
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length) {
        console.warn('[sw] some assets failed to precache:', failed.map((f) => f.reason?.message));
      }
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('signal-runner-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Never touch cross-origin requests; the game makes none, and intercepting
  // them would only create surprising failure modes.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function handleNavigation(event) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const preload = await event.preloadResponse;
    const response = preload || (await fetch(event.request));
    if (response && response.ok) cache.put(event.request, response.clone());
    return response;
  } catch {
    const cached =
      (await cache.match(event.request)) ||
      (await cache.match(new URL('index.html', self.registration.scope).toString())) ||
      (await cache.match(self.registration.scope));
    if (cached) return cached;
    return new Response('Signal Runner is offline and has no cached copy yet.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === 'basic') {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Offline and uncached: fail honestly rather than returning a 200 with
    // nothing in it, which would break module loading in confusing ways.
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}
