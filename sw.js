/* Service worker: lets the app be installed, open offline, and show a
   "time's up" notification. It cannot run timers itself (browsers stop
   service workers after a few seconds), so all timing stays in the page.
   Network-first, so a new deploy is picked up as soon as the device is online. */
var CACHE = 'segment-timer-v1';
var ASSETS = ['./', 'index.html', 'manifest.json', 'timer.mp3', 'Inter.ttf', 'SpaceGrotesk.ttf',
              'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(ASSETS.map(function(a){ return c.add(a).catch(function(){}); }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  // Range requests (media streaming) can't be cached; let the browser handle them.
  if(req.method !== 'GET' || req.headers.has('range') || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(function(res){
      if(res && res.ok){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
      }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(r){ return r || caches.match('index.html'); });
    })
  );
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
      for(var i = 0; i < list.length; i++){
        if('focus' in list[i]) return list[i].focus();
      }
      return self.clients.openWindow('./');
    })
  );
});
