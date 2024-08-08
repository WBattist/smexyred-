/* global UVServiceWorker, __uv$config */

/*
 * Optimized service worker script.
 * Register this script under the scope in uv.config.js.
 */

importScripts('/@/bundle.js');
importScripts('/@/config.js');

// Use __uv$config.sw if available, otherwise fallback to '/@/sw.js'
const swScript = __uv$config.sw || '/@/sw.js';
importScripts(swScript);

const sw = new UVServiceWorker();

// Implement caching strategies
const CACHE_NAME = 'uv-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/@/bundle.js',
  '/@/config.js',
  swScript,
];

// Install event to cache necessary files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Activate event to manage old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => 
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});

// Fetch event to serve cached content and handle errors
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // Serve from cache
        }
        return fetch(event.request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            // Cache the new response
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseClone));
            return networkResponse;
          });
      }).catch(() => {
        // Handle errors (e.g., offline scenarios)
        return caches.match('/offline.html'); // Serve an offline page or fallback content
      })
  );
});
