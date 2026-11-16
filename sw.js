self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('deadzone-v1').then((cache) => {
      return cache.addAll(['./', './index.html', './game.js', './phaser.min.js']);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
