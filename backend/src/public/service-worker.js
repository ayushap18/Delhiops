const STATIC_CACHE = 'delhi-ops-static-v1';
const API_CACHE = 'delhi-ops-api-v1';
const STATIC_ASSETS = ['/cache-dashboard', '/assets/cache-dashboard.html'];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/v1/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const cloned = response.clone();
                    caches.open(API_CACHE).then((cache) => cache.put(request, cloned));
                    return response;
                })
                .catch(async () => {
                    const cached = await caches.match(request);
                    return (
                        cached ||
                        new Response(JSON.stringify({ message: 'Offline cache miss' }), {
                            status: 503,
                            headers: { 'Content-Type': 'application/json' },
                        })
                    );
                })
        );
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request);
        })
    );
});
