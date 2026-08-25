const CACHE_NAME = "mpi-field-tools-shell-v15";
const APP_SHELL = ["./", "./index.html", "./site.webmanifest", "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png"];

async function fetchFresh(resource) {
  return fetch(resource, { cache: "no-store" });
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(APP_SHELL.map(async resource => {
        const response = await fetchFresh(resource);
        if (!response.ok) throw new Error(`Unable to cache ${resource}`);
        await cache.put(resource, response);
      })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate") return;

  event.respondWith(
    fetchFresh(event.request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
        }
        return response;
      })
      .catch(async () => {
        return (await caches.match("./index.html")) || (await caches.match("./"));
      })
  );
});

self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
