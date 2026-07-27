const CACHE_NAME = 'salvage-zero-v1';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/main.js',
  './js/game.js',
  './js/draw.js',
  './js/config.js',
  './js/utils.js',
  './js/storage.js',
  './js/physics.js',
  './js/renderer.js',
  './js/input.js',
  './js/ship.js',
  './js/projectiles.js',
  './js/wrecks.js',
  './js/fragmentation.js',
  './js/collisions.js',
  './js/tractor.js',
  './js/particles.js',
  './js/missions.js',
  './js/ui.js',
  './js/audio.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Cache-first for the app shell; network falls back to cache for everything same-origin,
// so the whole game keeps working offline after the first visit.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
