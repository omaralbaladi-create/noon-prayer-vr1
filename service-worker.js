// The cache name follows APP_CONFIG.version, so bumping the version in
// assets/js/config.js is the ONLY step needed to ship an update.
// (config.js is also byte-checked by the browser, because it is imported here.)
self.window = self;
importScripts("./assets/js/config.js");

const VERSION = (self.APP_CONFIG && self.APP_CONFIG.version) || "0";
const CACHE_NAME = `noor-prayer-pro-v${VERSION}`;
const NETWORK_TIMEOUT_MS = 4000;

const CORE_ASSETS = [
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
  "./assets/js/alerts.js",
  "./assets/js/push.js",
  "./assets/js/native.js",
  "./assets/js/ramadan.js",
  "./assets/js/app.js",
  "./assets/data/azkar.js",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/apple-touch-icon.png"
];

// Big files: cached best-effort so a missing/slow audio file never breaks the install.
const OPTIONAL_ASSETS = [
  "./assets/audio/adhan-makkah.mp3",
  "./assets/audio/adhan-madinah.mp3"
];

const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(CORE_ASSETS);
      await Promise.all(OPTIONAL_ASSETS.map((url) => cache.add(url).catch(() => {})));

      // First install: nothing to protect, activate immediately.
      // Update: wait until the user taps "Update" (SKIP_WAITING message).
      if (!self.registration.active) self.skipWaiting();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("noor-prayer-pro-") && k !== CACHE_NAME).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// ---------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------
function cacheable(response) {
  return response && response.ok && (response.type === "basic" || response.type === "cors");
}

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), NETWORK_TIMEOUT_MS))
    ]);

    if (cacheable(response)) cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch (_) {
    const cached =
      (await cache.match(request, { ignoreSearch: true })) ||
      (fallbackUrl ? await cache.match(fallbackUrl) : null);
    return cached || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (cacheable(response)) cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch (_) {
    return Response.error();
  }
}

// Safari requests audio with Range headers and refuses a plain 200 from the cache.
async function rangeResponse(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request.url, { ignoreSearch: true });

  if (!cached) {
    try {
      return await fetch(request);
    } catch (_) {
      return Response.error();
    }
  }

  const header = request.headers.get("range");
  if (!header) return cached;

  const buffer = await cached.arrayBuffer();
  const match = /bytes=(\d*)-(\d*)/.exec(header);
  if (!match) return cached;

  const size = buffer.byteLength;
  let start = match[1] === "" ? size - Number(match[2]) : Number(match[1]);
  let end = match[1] !== "" && match[2] !== "" ? Number(match[2]) : size - 1;
  if (Number.isNaN(start) || start < 0) start = 0;
  if (Number.isNaN(end) || end >= size) end = size - 1;

  return new Response(buffer.slice(start, end + 1), {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "Content-Type": cached.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes"
    }
  });
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const refresh = fetch(request)
    .then((response) => {
      if (cacheable(response)) cache.put(request, response.clone()).catch(() => {});
      return response;
    })
    .catch(() => null);

  return cached || (await refresh) || Response.error();
}

// ---------------------------------------------------------------
// Routing
// ---------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Fonts: fast from cache, refreshed in the background.
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Everything else cross-origin (Nominatim geocoding, etc.) goes straight to the network.
  if (url.origin !== self.location.origin) return;

  // Pages: always try the network first so a new deploy shows up, fall back to the cached shell offline.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "./index.html"));
    return;
  }

  if (/\.(mp3|ogg|m4a|wav)$/i.test(url.pathname)) {
    event.respondWith(rangeResponse(request));
    return;
  }

  if (/\.(png|jpe?g|svg|webp|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Code, styles, data, manifest: network first, cache as the offline fallback.
  event.respondWith(networkFirst(request));
});

// ---------------------------------------------------------------
// Web Push: prayer notifications while the app is closed
// ---------------------------------------------------------------
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { title: "NoorPrayer", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "NoorPrayer";
  const options = {
    body: data.body || "",
    tag: data.tag || "noor-push",
    icon: "./assets/icons/icon-512.png",
    badge: "./assets/icons/icon-192.png",
    lang: data.lang === "en" ? "en" : "ar",
    dir: data.lang === "en" ? "ltr" : "rtl",
    renotify: true,
    data: { key: data.key || "" }
  };

  event.waitUntil(
    (async () => {
      // A browser must show something for every push, so always show it.
      await self.registration.showNotification(title, options);

      // If the app is open, let it also react (e.g. play the adhan audio).
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      clients.forEach((c) => c.postMessage({ type: "PRAYER_PUSH", key: data.key || "" }));
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        if ("focus" in client) {
          await client.focus();
          client.postMessage({ type: "PRAYER_PUSH", key: (event.notification.data || {}).key || "" });
          return;
        }
      }
      await self.clients.openWindow("./");
    })()
  );
});
