/**
 * Production-Safe POS Service Worker
 * 
 * CRITICAL SAFETY RULES:
 * 1. NEVER cache non-GET requests (POST, PUT, DELETE, PATCH).
 * 2. NEVER cache /api/*, dynamic POS transactions, orders, payments, auth, or inventory endpoints.
 * 3. ONLY cache static immutable assets (_next/static, icons, fonts, favicon).
 * 4. Navigation requests use Network-First to ensure real-time POS data is always fresh.
 */

const CACHE_NAME = 'pos-static-v1';

// Safe static pre-cache list
const STATIC_ASSETS = [
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  '/manifest.json',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  // Activate new service worker immediately without waiting
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching static assets failed gracefully:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  // Claim all clients immediately
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Strict safety: NEVER touch non-GET requests (sales, inventory updates, auth, etc.)
  if (request.method !== 'GET') {
    return;
  }

  // 2. Strict safety: NEVER cache any API or backend request
  // Backend runs on port 5000 or paths starting with /api/
  if (
    url.pathname.startsWith('/api/') ||
    url.port === '5000' ||
    request.headers.get('Authorization')
  ) {
    return; // Pass through to network
  }

  // 3. Immutable Static Assets: _next/static, public icons, web fonts
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/favicon.svg' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          // Serve cached version immediately
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          return cachedResponse || Promise.reject(err);
        }
      })
    );
    return;
  }

  // 4. HTML Navigation Requests: Network-First (real-time POS data is always prioritized)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        // Only if network is offline, attempt to serve cached shell
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) return cached;
        const posCached = await cache.match('/pos');
        if (posCached) return posCached;
        const offlinePage = await cache.match('/offline.html');
        if (offlinePage) return offlinePage;
        return new Response('POS is offline. Reconnect to network.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
    );
    return;
  }

  // Default: pass through to network
});
