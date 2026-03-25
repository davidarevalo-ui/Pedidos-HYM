var CACHE = 'hym-v2';
var ARCHIVOS = ['./index.html','./manifest.json','./logo_dv.png','./logo_bt.png'];

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
  // Google Sheets: solo online, nunca desde cache
  if (e.request.url.indexOf('docs.google.com')!==-1) {
    e.respondWith(fetch(e.request).catch(function(){return new Response('[]');}));
    return;
  }
  // Todo lo demas: cache first, luego red
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var netFetch = fetch(e.request).then(function(resp) {
        caches.open(CACHE).then(function(c){ c.put(e.request, resp.clone()); });
        return resp;
      });
      return cached || netFetch;
    })
  );
});
