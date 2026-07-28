// Minimal cache-first service worker for the static app shell.
// Real asset precaching (sprites/audio) will expand this list in later milestones.
const CACHE_NAME = 'machineworks-shell-v5';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/main.css',
  './assets/icons/icon.svg',
  './src/constants.js',
  './src/camera.js',
  './src/input.js',
  './src/renderer.js',
  './src/ui.js',
  './src/save.js',
  './src/game.js',
  './src/simulation.js',
  './src/statistics.js',
  './src/analysis.js',
  './src/blueprint.js',
  './entities/tile.js',
  './entities/placedObject.js',
  './entities/conveyor.js',
  './entities/item.js',
  './entities/machine.js',
  './data/factories/factory_00_sandbox.json',
  './data/resources.json',
  './data/recipes.json',
  './data/machines.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => cached);
    })
  );
});
