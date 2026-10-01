/* LUX96 service worker: keeps the site usable offline.
   Everything is fetched fresh from the network first; the saved copy is only
   used when there's no connection — so a new deploy shows up immediately and
   nothing needs bumping. (Changing VERSION simply clears old saved copies.) */
const VERSION = "lux96-v2";
const CORE = [
  "./", "./index.html", "./care.html", "./ideas.html", "./faq.html", "./delivery.html", "./offline.html", "./manifest.webmanifest",
  "./assets/css/main.css",
  "./assets/js/config.js", "./assets/js/wood.js", "./assets/js/render.js", "./assets/js/common.js",
  "./assets/js/main.js", "./assets/js/alive.js", "./assets/js/page.js",
  "./assets/js/delivery.js", "./assets/js/nigeria-map.js",
  "./assets/js/pricing-data.js", "./assets/js/pricing.js", "./assets/js/pricing-page.js", "./assets/js/invoice.js", "./assets/vendor/qrcode.js",
  "./pricing/", "./pricing/invoice.html",
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
  // Video streams in pieces (range requests) — leave it to the browser.
  if (req.headers.has("range") || /\.(mp4|webm)$/.test(url.pathname)) return;

  // Same-origin pages and files: network first (always fresh), saved copy when offline.
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === "navigate" ? caches.match("./offline.html") : Response.error())))
    );
    return;
  }
  // Google Fonts never change for a given URL: cache first.
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res;
    })));
  }
});
