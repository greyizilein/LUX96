/* LUX96 service worker: works offline and loads instantly on repeat visits.
   Bump VERSION whenever you deploy changes so visitors get the new files. */
const VERSION = "lux96-v1";
const CORE = [
  "./", "./index.html", "./care.html", "./offline.html", "./manifest.webmanifest",
  "./assets/css/main.css",
  "./assets/js/config.js", "./assets/js/wood.js", "./assets/js/render.js", "./assets/js/common.js",
  "./assets/js/main.js", "./assets/js/alive.js", "./assets/js/page.js",
  "./assets/js/delivery.js", "./assets/js/nigeria-map.js",
  "./assets/img/logo.svg", "./assets/img/favicon.svg", "./assets/img/icon-192.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Pages: network first (fresh content), fall back to cache, then the offline page.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("./offline.html")))
    );
    return;
  }
  // Same-origin files and Google Fonts: serve from cache, refresh in the background.
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req).then((res) => {
          if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
  }
});
