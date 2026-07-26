const CACHE_VERSION = 'v1';
const CACHE_NAME = `dead-drop-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  'index.html',
  'manifest.json',
  'css/style.css',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-512-maskable.png',
  'js/main.js',
  'js/utils/constants.js',
  'js/utils/helpers.js',
  'js/core/Game.js',
  'js/core/GameState.js',
  'js/core/TurnEngine.js',
  'js/core/Vision.js',
  'js/core/Undo.js',
  'js/level/Level.js',
  'js/level/levels/manifest.json',
  'js/level/levels/01-first-steps.json',
  'js/level/levels/02-patrol.json',
  'js/level/levels/03-eyes-in-the-walls.json',
  'js/level/levels/04-behind-closed-doors.json',
  'js/level/levels/05-remote-access.json',
  'js/level/levels/06-two-sets-of-eyes.json',
  'js/level/levels/07-clearance-required.json',
  'js/level/levels/08-moving-eyes.json',
  'js/level/levels/09-mixed-signals.json',
  'js/level/levels/10-dead-drop.json',
  'js/board/Board.js',
  'js/entities/Guard.js',
  'js/entities/Camera.js',
  'js/planning/Path.js',
  'js/planning/PlanningMode.js',
  'js/render/Renderer.js',
  'js/render/Animation.js',
  'js/render/Particles.js',
  'js/input/Input.js',
  'js/ui/UI.js',
  'js/audio/Audio.js',
  'js/storage/Storage.js',
  'js/pwa/PWA.js',
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
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => {
          if (req.mode === 'navigate') return caches.match('index.html');
          return cached;
        });
    })
  );
});
