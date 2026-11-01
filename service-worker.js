const CACHE_NAME = "noor-prayer-pro-v1.0.0";

const APP_ASSETS = [
  "./",
  "./index.html",
  "./404.html",
  "./privacy.html",
  "./manifest.json",
  "./assets/css/styles.css",
  "./assets/js/config.js",
  "./assets/js/state.js",
  "./assets/js/storage.js",
  "./assets/js/utils.js",
  "./assets/js/i18n.js",
  "./assets/js/dom.js",
  "./assets/js/qibla.js",
  "./assets/js/prayer.js",
  "./assets/js/app.js",
  "./assets/data/azkar.js",
  "./assets/icons/icon-512.png",
  "./assets/audio/adhan-makkah.mp3",
  "./assets/audio/adhan-madinah.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone).catch(() => {});
          });

          return networkResponse;
        })
        .catch(() => {
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return caches.match("./404.html");
        });
    })
  );
});
