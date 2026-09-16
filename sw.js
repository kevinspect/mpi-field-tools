const CACHE_NAME = "mpi-field-tools-shell-v203";
const APP_SHELL = [
  "./", "./index.html", "./admin.html",
  "./mpi-app-theme.css", "./mpi-app-theme.css?build=203",
  "./mpi-native-bridge.js", "./mpi-native-bridge.js?build=203",
  "./mpi-office-navigation.js", "./mpi-office-navigation.js?build=203",
  "./mpi-owner-view.js", "./mpi-owner-view.js?build=203",
  "./mpi-tool-bag.js", "./mpi-tool-bag.js?build=203",
  "./mpi-shared.js", "./mpi-shared.js?build=203",
  "./mpi-field-sync.js", "./mpi-field-sync.js?build=203",
  "./mpi-subcontractor.js", "./mpi-subcontractor.js?build=203",
  "./mpi-comment-ai.js", "./mpi-comment-ai.js?build=203",
  "./mpi-equipment-images.js", "./mpi-equipment-images.js?build=203",
  "./mpi-equipment.js", "./mpi-equipment.js?build=203",
  "./mpi-equipment-admin.js", "./mpi-equipment-admin.js?build=203",
  "./admin.js", "./admin.js?build=203",
  "./mpi-planning.js", "./mpi-planning.js?build=203",
  "./site.webmanifest", "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png", "./mpi-logo.png", "./tool-thumbnails.png", "./mpi-email-template.html",
  "./equipment-images/inspection-tote.jpg",
  "./equipment-images/gfci-tester.jpg",
  "./equipment-images/driver-11-in-1.jpg",
  "./equipment-images/voltage-ir-detector.jpg",
  "./equipment-images/rover-flood-light.jpg",
  "./equipment-images/ratcheting-driver-8-in-1.jpg",
  "./equipment-images/moisture-meter-mm9.jpg",
  "./equipment-images/clamp-meter-cl220.jpg",
  "./equipment-images/gas-detector-pt210s.jpg",
  "./equipment-images/headlamp-2012r.jpg",
  "./equipment-images/safety-glasses.jpg",
  "./equipment-images/tape-measure-6ft.jpg",
  "./equipment-images/respirator-p100.jpg",
  "./equipment-images/cut-level-5-gloves.jpg",
  "./equipment-images/dead-blow-mallet.jpg",
  "./equipment-images/pipe-wrench-18.jpg",
  "./equipment-images/co-detector-ct580.jpg",
  "./equipment-images/thermal-camera-tc002c.jpg",
  "./equipment-images/wrecking-bar-42.jpg",
  "./equipment-images/well-yield-kit.jpg",
  "./equipment-images/wombat-crawler.jpg",
  "./equipment-images/digging-shovel.jpg",
  "./equipment-images/mattock.jpg",
  "./equipment-images/garden-hose-50.jpg",
  "./equipment-images/leader-hose-15.jpg",
  "./equipment-images/drone-mini-4.jpg",
  "./equipment-images/sewer-scope-scout-3-micro.jpg"
];

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
    requireInteraction: true,
    silent: false,
    vibrate: [250, 100, 250, 100, 450],
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
