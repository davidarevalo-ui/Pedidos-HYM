// ── HERRAMIENTAS Y MÁS – Service Worker ──
var CACHE = 'hym-v2';
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

// Al hacer fetch: primero intenta la red, si falla usa caché
// Para Google Sheets (precios): solo intenta red, nunca caché
// Para el HTML/CSS/fuentes: caché primero si no hay red
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Google Sheets → solo red (si falla, la app maneja el error con el caché de localStorage)
  if (url.indexOf('docs.google.com') !== -1 || url.indexOf('googleapis.com') !== -1) {
    e.respondWith(fetch(e.request).catch(function() {
      return new Response('', { status: 503 });
    }));
    return;
  }

  // Todo lo demás → caché primero, luego red
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        // Guarda en caché si es una respuesta válida
        if (response && response.status === 200 && response.type !== 'opaque') {
          var copy = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, copy); });
        }
        return response;
      }).catch(function() {
        // Sin red y sin caché → página de error mínima
        return new Response(
          '<h2 style="font-family:sans-serif;padding:20px;">Sin conexión.<br>Abre la app desde el ícono instalado en tu tablet.</h2>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      });
    })
  );
});
