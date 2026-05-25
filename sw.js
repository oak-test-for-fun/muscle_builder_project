const CACHE = 'diet-tracker-v5';
const ASSETS = [
  './index.html',
  './index-zh.html',
  './chart.min.js',
  './manifest.json',
  './manifest-zh.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if(e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => {
        // オフライン時：リクエストURLに応じて適切なHTMLを返す
        const url = new URL(e.request.url);
        const fallback = url.pathname.includes('index-zh') ? './index-zh.html' : './index.html';
        return caches.match(fallback);
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if(res && res.status === 200 && e.request.method === 'GET'){
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
