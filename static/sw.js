self.addEventListener('install', (e) => {
 e.waitUntil(
   caches.open('kenya-cooks-v1').then((cache) => cache.addAll([
     '/',
     '/static/manifest.json',
   ])),
 );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
});