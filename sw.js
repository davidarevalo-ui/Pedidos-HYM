// ── HERRAMIENTAS Y MÁS – Service Worker ──
// Cambia el número de versión aquí cada vez que actualices el index.html
var CACHE = 'hym-v5';
var ARCHIVOS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap'
];

// Al instalar: guarda el index.html en caché
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ARCHIVOS);
    })
  );
  self.skipWaiting();
});

// Al activar: borra cachés viejas
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Al hacer fetch:
// - index.html → SIEMPRE desde la red primero
// - Google Sheets y Apps Script → solo red
// - Todo lo demás → red primero, caché como respaldo offline
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // index.html → siempre red primero, sin importar si hay caché
  if (url.indexOf('index.html') !== -1 || url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(function(response) {
        var copy = response.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, copy); });
        return response;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  // Google Sheets y Apps Script → solo red
  if (url.indexOf('docs.google.com') !== -1 ||
      url.indexOf('googleapis.com') !== -1 ||
      url.indexOf('script.google.com') !== -1) {
    e.respondWith(fetch(e.request).catch(function() {
      return new Response('', { status: 503 });
    }));
    return;
  }

  // Todo lo demás → red primero, caché como respaldo offline
  e.respondWith(
    fetch(e.request).then(function(response) {
      if (response && response.status === 200 && response.type !== 'opaque') {
        var copy = response.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, copy); });
      }
      return response;
    }).catch(function() {
      return caches.match(e.request).then(function(cached) {
        return cached || new Response(
          '<h2 style="font-family:sans-serif;padding:20px;">Sin conexión.<br>Abre la app desde el ícono instalado en tu tablet.</h2>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      });
    })
  );
});
