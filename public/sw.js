const CACHE = "expense-tracker-v1";
const STATIC = ["/_next/static/", "/icon-192", "/icon-512", "/apple-icon"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

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

  // Never intercept API calls or non-GET requests
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) return;

  // Cache-first for Next.js static chunks and icons
  if (STATIC.some((p) => url.pathname.startsWith(p))) {
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

  // Network-first for HTML pages — fall back to cache when offline
  if (request.headers.get("accept")?.includes("text/html")) {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
});
