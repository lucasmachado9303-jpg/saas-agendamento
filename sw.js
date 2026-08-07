const CACHE = 'agendaplus-v4';
const ASSETS = ['/', '/index.html', '/app.html', '/manifest.json', '/icon.png', '/favicon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  const isHtml = url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === '';

  if (isHtml) {
    // Network-first para HTML: garante que apos um deploy o usuario recebe o arquivo atualizado.
    // So usa o cache se a rede falhar completamente (modo offline).
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Network-first para outros assets estaticos (icones, manifesto, js)
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
