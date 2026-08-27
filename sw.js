const CACHE_NAME = "mpi-field-tools-shell-v104";
const APP_SHELL = ["./", "./index.html", "./site.webmanifest", "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png", "./mpi-logo.png", "./tool-thumbnails.png"];

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
