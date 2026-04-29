// SalesPro CRM — Service Worker v202604273000
const CACHE_APP = 'salespro-app-202604273000';
const CACHE_TILES = 'salespro-tiles-202604273000';

const APP_SHELL = [
  '/',
  './index.html',
  './icon-120.png',
  './icon-152.png',
  './icon-167.png',
  './icon-180.png',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css',
  'https://tiles.openfreemap.org/styles/liberty',
];

// Install — skip waiting immediately so new SW takes over right away
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_APP).then(cache =>
      Promise.allSettled(APP_SHELL.map(url =>
        cache.add(url).catch(() => {})
      ))
    )
  );
});

// Activate — delete ALL old caches, claim all clients immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_APP && k !== CACHE_TILES)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => {
        // Tell all open tabs to reload so they get fresh content
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
        });
      })
  );
});

// Fetch
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (isTileRequest(url)) { e.respondWith(tileStrategy(e.request)); return; }
  if (isAppShell(url)) { e.respondWith(cacheFirst(e.request, CACHE_APP)); return; }
  e.respondWith(networkFirst(e.request));
});

function isTileRequest(url) {
  return url.hostname.includes('openfreemap.org') ||
         url.hostname.includes('openstreetmap.org') ||
         /\/\d+\/\d+\/\d+(\.(png|pbf|mvt))?$/.test(url.pathname);
}
function isAppShell(url) {
  return url.hostname.includes('unpkg.com') ||
         url.pathname === '/' ||
         url.pathname.endsWith('.html') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css');
}
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(cacheName)).put(request, response.clone());
    return response;
  } catch { return new Response('Offline', { status: 503 }); }
}
async function tileStrategy(request) {
  const cache = await caches.open(CACHE_TILES);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) { cache.put(request, response.clone()); pruneCache(cache, 2000); }
    return response;
  } catch {
    return new Response(
      atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
      { headers: { 'Content-Type': 'image/png' } }
    );
  }
}
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(CACHE_APP)).put(request, response.clone());
    return response;
  } catch {
    return (await caches.match(request)) || new Response('Offline', { status: 503 });
  }
}
async function pruneCache(cache, max) {
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map(k => cache.delete(k)));
}
