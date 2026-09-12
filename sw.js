const CACHE_NAME = "magic-dragon-pin-v0.10.15-dev";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./Magic-Dragon-logo.jpeg"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith("magic-dragon-pin-") && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  // v0.10.9 DEV: never intercept cross-origin API requests (e.g. Supabase).
  // Safari can otherwise turn a failed/uncacheable API request into
  // "FetchEvent.respondWith ... Returned response is null" and hide the real error.
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  // This service worker is only an offline cache for app assets/navigation.
  if (event.request.method !== "GET" && event.request.method !== "HEAD") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, {cache: "no-store"})
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  if (new URL(event.request.url).pathname.endsWith("/Magic-Dragon-logo.jpeg")) {
    event.respondWith(
      fetch(event.request, {cache: "no-store"})
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(response => {
        if (response && response.ok && event.request.method === "GET") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);

      return cached || networkFetch;
    })
  );
});
