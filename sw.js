/**
 * Service Worker for Tính Giá Bán Đa Kênh
 * Enables offline functionality
 */

const CACHE_PREFIX = 'tinh-gia-ban';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icons/icon.svg',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

let activeCacheName = null;

async function getCacheName() {
    if (activeCacheName) return activeCacheName;
    try {
        const response = await fetch('./manifest.json', { cache: 'no-store' });
        if (response.ok) {
            const manifest = await response.json();
            if (manifest && manifest.version) {
                activeCacheName = `${CACHE_PREFIX}-${manifest.version}`;
                return activeCacheName;
            }
        }
    } catch (error) {
        console.warn('Could not read manifest version:', error);
    }
    activeCacheName = `${CACHE_PREFIX}-v1`;
    return activeCacheName;
}

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        getCacheName().then(cacheName => {
            return caches.open(cacheName)
                .then(cache => {
                    console.log('Caching app assets:', cacheName);
                    return cache.addAll(ASSETS_TO_CACHE);
                })
                .then(() => self.skipWaiting());
        })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        getCacheName().then(cacheName => {
            return caches.keys()
                .then(cacheNames => {
                    return Promise.all(
                        cacheNames.map(existingCache => {
                            if (existingCache.startsWith(CACHE_PREFIX) && existingCache !== cacheName) {
                                console.log('Deleting old cache:', existingCache);
                                return caches.delete(existingCache);
                            }
                            return null;
                        })
                    );
                })
                .then(() => self.clients.claim());
        })
    );
});

// Fetch event - cache first, then network
self.addEventListener('fetch', event => {
    event.respondWith(
        (async () => {
            const cacheName = await getCacheName();
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
                return cachedResponse;
            }

            try {
                const response = await fetch(event.request);
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseToCache = response.clone();
                const cache = await caches.open(cacheName);
                cache.put(event.request, responseToCache);
                return response;
            } catch (error) {
                console.warn('Fetch failed, serving offline fallback:', error);
                return caches.match('./index.html');
            }
        })()
    );
});
