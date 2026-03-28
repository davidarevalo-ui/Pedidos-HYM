var CACHE = 'hym-v3';
var ARCHIVOS = ['./index.html', './manifest.json'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ARCHIVOS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.url.indexOf('docs.google.com') !== -1) {
    e.respondWith(fetch(e.request).catch(function(){ return new Response(''); }));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var net = fetch(e.request).then(function(resp) {
        caches.open(CACHE).then(function(c){ c.put(e.request, resp.clone()); });
        return resp;
      });
      return cached || net;
    })
  );
});
