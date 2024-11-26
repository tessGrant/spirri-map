const CACHE_NAME = 'ev-charging-cache-v1';
const CACHED_URLS = ['/', '/api/locations'];

// Helper to check if URL should be cached
const shouldCache = url => {
  // Only cache same-origin requests
  if (!url.startsWith(self.location.origin)) return false;

  // Don't cache chrome-extension requests
  if (url.startsWith('chrome-extension://')) return false;

  // Don't cache _next/static resources (Next.js handles these)
  if (url.includes('/_next/')) return false;

  return true;
};

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return Promise.allSettled(
          CACHED_URLS.map(url =>
            fetch(url)
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch(error => console.log('Cache error:', error)),
          ),
        );
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Check if request should be cached
  if (!shouldCache(event.request.url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const networked = fetch(event.request)
        .then(response => {
          if (response.ok && shouldCache(event.request.url)) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              try {
                cache.put(event.request, responseClone);
              } catch (error) {
                console.error('Cache put error:', error);
              }
            });
          }
          return response;
        })
        .catch(() => {
          if (cached) return cached;
          return new Response('Offline content', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });

      return cached || networked;
    }),
  );
});

// Handle errors
self.addEventListener('error', event => {
  console.error('Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Unhandled rejection in service worker:', event.reason);
});

// Log registration success
self.addEventListener('activate', event => {
  console.log('Service worker activated');
});
