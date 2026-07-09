/* ============================================
   NEXAWEATHER - SERVICE WORKER
   PWA | Offline Support | Caching
   ============================================ */

const CACHE_NAME = 'nexaweather-v1';
const ASSETS = [
    '/NexaWeather/',
    '/NexaWeather/index.html',
    '/NexaWeather/style.css',
    '/NexaWeather/script.js',
    '/NexaWeather/manifest.json',
    '/NexaWeather/offline.html',
    '/NexaWeather/favicon.ico',
    '/NexaWeather/assets/icons/icon-192.png',
    '/NexaWeather/assets/icons/icon-512.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// ---------- INSTALL ----------
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching assets...');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// ---------- ACTIVATE ----------
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Removing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ---------- FETCH ----------
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin) &&
        !event.request.url.includes('fonts.googleapis.com') &&
        !event.request.url.includes('cdn.jsdelivr.net')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cached) => {
                if (cached) {
                    return cached;
                }

                return fetch(event.request)
                    .then((response) => {
                        // Cache successful responses
                        if (response && response.status === 200) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, clone);
                                });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Offline fallback
                        if (event.request.mode === 'navigate') {
                            return caches.match('/NexaWeather/offline.html');
                        }
                    });
            })
    );
});