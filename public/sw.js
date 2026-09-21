const CACHE_NAME = 'sinetrack-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32x32.png',
];

// Install Event: Cache Core Shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate Event: Cleanup Old Caches (including sinetrack-v1)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network-First with Cache Fallback for navigation, complete bypass for all video and API requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Complete bypass for external CDNs, video streams, segments, and API routes
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('.m3u8') ||
    url.pathname.includes('.ts') ||
    url.pathname.includes('.mp4') ||
    url.pathname.includes('.jpg') ||
    url.pathname.includes('.png') ||
    url.pathname.includes('.vtt') ||
    url.pathname.includes('.txt') ||
    url.pathname.includes('/dl?') ||
    request.method !== 'GET'
  ) {
    return; // Pass through directly to native browser networking
  }

  // Network-first strategy for pages and static assets
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for static assets
        if (
          response &&
          response.status === 200 &&
          (url.pathname.startsWith('/_next/static/') ||
            url.pathname.startsWith('/icons/'))
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('', { status: 404, statusText: 'Not Found' });
        });
      })
  );
});
