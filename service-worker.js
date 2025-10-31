const STATIC_CACHE_NAME = "static-cache-v2";
const DYNAMIC_CACHE_NAME = "dynamic-cache-v2";
const IMAGE_CACHE_NAME = "image-cache-v1";
const API_CACHE_NAME = "api-cache-v1";

// All the files that make up the "app shell"
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/assets/index.css",
  "/assets/index.js",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap",
];

// Cache strategies configuration
const CACHE_STRATEGIES = {
  // Static assets - cache first with long TTL
  static: {
    cacheName: STATIC_CACHE_NAME,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  // API responses - network first with fallback
  api: {
    cacheName: API_CACHE_NAME,
    maxAge: 15 * 60 * 1000, // 15 minutes
  },
  // Images - cache first with compression
  images: {
    cacheName: IMAGE_CACHE_NAME,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  // Dynamic content - stale while revalidate
  dynamic: {
    cacheName: DYNAMIC_CACHE_NAME,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log("Precaching static assets");
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.error("Failed to cache static assets during install:", error);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter(
            (key) => key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME
          )
          .map((key) => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Use a stale-while-revalidate strategy for APIs and dynamic modules.
  if (
    url.hostname === "api.rss2json.com" ||
    url.hostname === "api.open-meteo.com" ||
    url.hostname === "nominatim.openstreetmap.org" ||
    url.hostname === "esm.sh" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch((err) => {
              console.error(
                "Network fetch failed for dynamic content:",
                request.url,
                err
              );
              // If fetch fails, we still have the cachedResponse.
            });

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Use a cache-first strategy for static app shell assets.
  event.respondWith(
    caches.match(request).then((response) => {
      return (
        response ||
        fetch(request).then((fetchResponse) => {
          return caches.open(STATIC_CACHE_NAME).then((cache) => {
            if (fetchResponse && fetchResponse.status === 200) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          });
        })
      );
    })
  );
});
