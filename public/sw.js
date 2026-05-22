const CACHE = "expense-tracker-v2";
const OFFLINE_URL = "/offline";
const STATIC_PREFIXES = ["/_next/static/", "/icon-192", "/icon-512", "/apple-icon"];

// Pre-cache the offline page at install time
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll([OFFLINE_URL]))
  );
  self.skipWaiting();
});

// Clean up old caches on activate
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Never intercept non-GET requests
  if (request.method !== "GET") return;

  // Cache-first for Next.js static chunks and icons
  if (STATIC_PREFIXES.some((p) => url.pathname.startsWith(p))) {
    e.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
            return res;
          })
      )
    );
    return;
  }

  // Network-first for HTML pages — serve /offline when both network and cache fail
  if (request.headers.get("accept")?.includes("text/html")) {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) => cached || caches.match(OFFLINE_URL)
          )
        )
    );
  }
});
