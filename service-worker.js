const CACHE_NAME = 'chatmate-cache-v1';
const PRECACHE_URLS = [
  '.',
  'index.htm',
  'style.css',
  'script.js',
  'chatbot.js',
  'storage-service.js',
  'ui-service.js',
  'pwa.js',
  'manifest.json',
  'icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
