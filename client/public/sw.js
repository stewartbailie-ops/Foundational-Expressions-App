// Advisory Connect — minimal service worker.
//
// Sole purpose: satisfy PWA installability so Chrome/Android can fire the
// native "Install app" prompt. It is DELIBERATELY non-caching — every request
// goes straight to the network, so the live app can never serve stale content.
// (If we ever want true offline support, that's a separate, considered change.)
//
// Bump VERSION to force waiting clients to update.
const VERSION = "v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// A fetch handler must exist for installability. Pure network passthrough,
// GET only, with no cache reads/writes.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request));
});
