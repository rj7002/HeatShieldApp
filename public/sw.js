const CACHE_NAME = "heatshield-v2";

// Shell pages to pre-cache on install
const PRECACHE = ["/", "/compare", "/tools", "/results"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Always hit the network for API routes — data must be fresh
  if (url.pathname.startsWith("/api/")) return;

  // Network-first for navigation, cache fallback for offline
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, fonts, images)
  if (["script", "style", "font", "image"].includes(e.request.destination)) {
    e.respondWith(
      caches.match(e.request).then(
        (cached) =>
          cached ||
          fetch(e.request).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
            }
            return res;
          })
      )
    );
  }
});
