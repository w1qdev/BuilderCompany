const CACHE_NAME = 'csm-center-v2';

const PRECACHE_URLS = [
  '/',
  '/dashboard',
];

// Install: precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Socket.IO and hot-reload requests
  if (url.pathname.startsWith('/api/socketio') || url.pathname.startsWith('/_next/webpack-hmr')) {
    return;
  }

  // Network-first for API routes and navigation requests
  if (url.pathname.startsWith('/api/') || request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Default: network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
