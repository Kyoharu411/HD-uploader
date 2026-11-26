const C = 'sw-hd-v18';
const A = ['./','index.html','style.css','app.js','manifest.json','lib/ffmpeg.js','lib/814.ffmpeg.js','lib/util.js','lib/ffmpeg-core.js','lib/ffmpeg-core.wasm'];

self.addEventListener('install', e => e.waitUntil(
  caches.open(C).then(c => c.addAll(A)).then(() => self.skipWaiting())
));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.includes('/lib/')) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  } else {
    e.respondWith(fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(C).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request)));
  }
});
