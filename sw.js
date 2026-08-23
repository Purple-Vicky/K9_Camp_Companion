// K9 offline support.
//
// Signal at Leeming is patchy, so the app must still open with no connection.
// Strategy: network first, cache as backup.
//
//   online   -> fetch from the network, save a copy, show the fresh version
//   offline  -> serve the last copy that was saved
//
// Network-first matters more than speed here: a cadet must never be shown
// yesterday's programme while they have signal. Falling back to cache is for
// when there is genuinely nothing else.

const CACHE = "k9-v1";

// Fetched on install so the app works offline even if the cadet has only ever
// opened the home screen.
const PRECACHE = [
  "index.html",
  "style.css",
  "data.js",
  "script.js",
  "cadets.csv",
  "mobiles.csv",
  "wristbands.html",
  "images/k9.jpg",
  "images/uniform-greens.jpg",
  "images/uniform-civvies.jpg",
  "images/uniform-sports.jpg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      // Individual failures must not abort the whole install.
      .then(cache => Promise.allSettled(PRECACHE.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;

  if (req.method !== "GET") return;

  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          // Strip the ?v= cache-buster so the cache key stays stable, or every
          // visit would store another copy under a new timestamp.
          const key = url.origin + url.pathname;
          caches.open(CACHE).then(cache => cache.put(key, copy));
        }

        return res;
      })
      .catch(() =>
        caches.match(url.origin + url.pathname).then(hit =>
          hit || caches.match("index.html")
        )
      )
  );
});
