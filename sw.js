const CACHE_NAME = "mpi-field-tools-shell-v114";
const APP_SHELL = ["./", "./index.html", "./admin.html", "./mpi-shared.js", "./mpi-field-sync.js", "./admin.js", "./site.webmanifest", "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png", "./mpi-logo.png", "./tool-thumbnails.png", "./mpi-email-template.html"];

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
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetchFresh(event.request)
        .then(response => {
          if (response.ok && requestUrl.origin === self.location.origin) {
            const fallback = requestUrl.pathname.endsWith("/admin.html") ? "./admin.html" : "./index.html";
            caches.open(CACHE_NAME).then(cache => cache.put(fallback, response.clone()));
          }
          return response;
        })
        .catch(async () => {
          const fallback = requestUrl.pathname.endsWith("/admin.html") ? "./admin.html" : "./index.html";
          return (await caches.match(fallback)) || (await caches.match("./"));
        })
    );
    return;
  }
  if (requestUrl.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetchFresh(event.request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
      return response;
    }))
  );
});

self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("push", event => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { notification: { body: event.data ? event.data.text() : "" } };
  }
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || "MPI Field Tools";
  const body = notification.body || data.body || "A new company message is available.";
  const targetUrl = payload.fcmOptions?.link || data.link || data.click_action || "./#team-messages";
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    tag: data.tag || "mpi-team-message",
    renotify: true,
    data: { url: targetUrl }
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "./#team-messages", self.location.href).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(openClients => {
      for (const client of openClients) {
        if ("focus" in client) {
          if ("navigate" in client) client.navigate(target);
          return client.focus();
        }
      }
      return clients.openWindow ? clients.openWindow(target) : undefined;
    })
  );
});
