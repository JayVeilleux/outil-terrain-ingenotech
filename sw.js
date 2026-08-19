// Service worker minimal: rend l'app installable et met seulement en cache
// la coquille de l'app (index.html, icones). Toutes les donnees en direct
// (cadastre, milieux humides, puits, tuiles de carte) passent toujours par
// le reseau normalement - jamais mises en cache, pour ne jamais montrer une
// information perimee ou trompeuse sur le terrain.

var CACHE = 'outil-terrain-shell-v1';
var SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  var isShell = url.origin === location.origin &&
    (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html') ||
     url.pathname.endsWith('/manifest.json') || url.pathname.endsWith('/icon-192.png') ||
     url.pathname.endsWith('/icon-512.png'));

  if (e.request.method !== 'GET' || !isShell) {
    return; // laisse le navigateur gerer normalement (donnees en direct, tuiles, etc.)
  }

  e.respondWith(
    caches.match(e.request).then(function (cached) {
      var network = fetch(e.request).then(function (res) {
        caches.open(CACHE).then(function (c) { c.put(e.request, res.clone()); });
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
