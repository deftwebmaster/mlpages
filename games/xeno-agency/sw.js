const CACHE_NAME = "xeno-agency-static-v14";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-1024.png",
  "./assets/icons/apple-touch-icon.png",
  "./xeno-agency-logo.png",
  "./xeno-interior-key-art.png",
  "./xeno-world-map-concept.png",
  "./xeno-main-dashboard-mockup.png",
  "./xeno-adoption-screen-concept.png",
  "./assets/portraits/alien-01.png",
  "./assets/portraits/alien-02.png",
  "./assets/portraits/alien-03.png",
  "./assets/portraits/alien-04.png",
  "./assets/portraits/alien-05.png",
  "./assets/portraits/alien-06.png",
  "./assets/portraits/alien-07.png",
  "./assets/portraits/alien-08.png",
  "./assets/portraits/alien-09.png",
  "./assets/portraits/alien-10.png",
  "./assets/portraits/alien-11.png",
  "./assets/portraits/alien-12.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match("./index.html")))
  );
});
