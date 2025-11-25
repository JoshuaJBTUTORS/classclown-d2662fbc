// ---- KILL SWITCH SERVICE WORKER ----
// This file forces all clients to:
// 1. delete all caches
// 2. unregister the service worker
// 3. stop intercepting requests
// -------------------------------------

self.addEventListener('install', (event) => {
  // install immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Delete ALL cache storage for this origin
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));

      // Unregister this service worker
      await self.registration.unregister();
    })()
  );

  // Take control of uncontrolled clients immediately
  self.clients.claim();
});

// Allow all requests to go straight to the network
self.addEventListener('fetch', (event) => {
  // do nothing → network only
});
