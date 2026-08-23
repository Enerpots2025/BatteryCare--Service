// BatteryCare OS — service worker
// Caches the app shell (HTML/manifest/icons) so the app can install and
// open instantly even on a flaky connection. Live data (Firebase) always
// goes over the network — only the shell is cached.

const CACHE_NAME = "batterycare-shell-v1";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle our own same-origin shell files. Everything else
  // (Firebase reads/writes, fonts, etc.) goes straight to the network
  // untouched, so data is always fresh and auth/DB calls aren't cached.
  const url = new URL(req.url);
  const isShellFile = url.origin === self.location.origin;
  if (req.method !== "GET" || !isShellFile) {
    return; // let the browser handle it normally
  }

  // Network-first for the shell, so a new deploy is picked up on next
  // load when online, but falls back to cache when offline.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
  );
});
