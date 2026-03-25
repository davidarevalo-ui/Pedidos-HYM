// Service Worker — Pedidos Herramientas y Más
// Guarda la app en la tablet para funcionar sin internet

var CACHE_NAME = 'hym-pedidos-v1';

// Archivos que se guardan offline
var ARCHIVOS_OFFLINE = [
  './index.html',
  './manifest.json'
];

// Al instalar: guarda los archivos en caché
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ARCHIVOS_OFFLINE);
    })
  );
  self.skipWaiting();
});

// Al activar: limpia cachés viejos
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Al pedir un archivo: primero intenta internet, si no hay usa el caché
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Peticiones a Google Sheets (lista de precios): solo con internet, nunca desde caché
  if (url.indexOf('docs.google.com') !== -1 || url.indexOf('googleapis') !== -1) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Todo lo demás: intenta internet primero, si falla usa caché
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Si descargó bien, guarda una copia en caché
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, copy);
        });
        return response;
      })
      .catch(function() {
        // Sin internet: usa la copia guardada
        return caches.match(event.request).then(function(cached) {
          if (cached) return cached;
          // Si no hay caché, devuelve el index.html principal
          return caches.match('./index.html');
        });
      })
  );
});
