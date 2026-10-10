/**
 * High-Performance Production POS Service Worker
 * 
 * CORE ARCHITECTURE:
 * 1. Cache-First for Immutable Static Assets (_next/static, public icons, fonts) -> 0ms instant loading.
 * 2. Network-First with Fast Fallback (<1000ms) for HTML Navigation requests -> Instant app shell render.
 * 3. Pre-caches and dynamically caches the POS shell (/pos) for instantaneous startup.
 * 4. STRICT SAFETY: Never caches non-GET requests (sales, inventory mutations).
 * 5. STRICT SAFETY: Never caches backend /api/* routes or authorized transactional endpoints.
 */

const CACHE_NAME = 'pos-static-v4';

// Safe pre-cache assets for instantaneous offline & launch performance
const STATIC_ASSETS = [
  '/logo.png',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(STATIC_ASSETS);
      } catch (err) {
        console.warn('[SW] Pre-caching static assets failed gracefully:', err);
      }
      // Attempt to pre-warm the /pos shell into cache
      try {
        const posRes = await fetch('/pos');
        if (posRes && posRes.status === 200) {
          await cache.put('/pos', posRes);
        }
      } catch {
        // Pos page will be cached on first navigation
      }
    })
  );
});

self.addEventListener('activate', (event) => {
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
      }),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Strict safety: NEVER touch non-GET requests (sales, refunds, auth, stock)
  if (request.method !== 'GET') {
    return;
  }

  // 2. Strict safety: NEVER cache transactional API requests (except PWA icons)
  if (url.pathname.startsWith('/api/pwa-icon/')) {
    // Permitted to fall through to static asset cache below
  } else if (
    url.pathname.startsWith('/api/') ||
    url.port === '5000' ||
    request.headers.get('Authorization')
  ) {
    return; // Pass through to network
  }

  // 3. Immutable Static Assets: _next/static, public icons, uploads, web fonts (Cache-First)
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith('/api/pwa-icon/') ||
    url.pathname === '/logo.png' ||
    url.pathname === '/favicon.svg' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
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

  // 4. HTML Navigation Requests: Fast Network with Instant Cached Shell Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedPagePromise = cache.match(request).then(async (match) => {
          if (match) return match;
          return (await cache.match('/pos')) || (await cache.match('/offline.html'));
        });

        // Fast Network race: If network responds within 1000ms, use fresh page & update cache
        const networkFetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
              // Keep pos shell warm
              if (url.pathname === '/pos' || url.pathname === '/') {
                cache.put('/pos', networkResponse.clone());
              }
            }
            return networkResponse;
          })
          .catch(async () => {
            return (await cachedPagePromise) || null;
          });

        // Race network against a 1000ms timeout if we already have a cached shell
        const cachedShell = await cachedPagePromise;
        if (cachedShell) {
          const timeoutPromise = new Promise((resolve) =>
            setTimeout(() => resolve(null), 1000)
          );
          const winner = await Promise.race([networkFetchPromise, timeoutPromise]);
          if (winner) {
            return winner;
          }
          // Network is slow/hanging: deliver instant cached shell!
          // Network promise continues in background and caches the fresh copy for next time.
          return cachedShell;
        }

        // No cached shell yet: await network
        const result = await networkFetchPromise;
        if (result) return result;

        const fallback = await cache.match('/offline.html');
        if (fallback) return fallback;

        return new Response('POS is offline. Reconnect to network.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })()
    );
    return;
  }

  // Default: pass through to network
});
