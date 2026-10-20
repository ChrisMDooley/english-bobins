/* sw.js — English-Bobins offline cache. Network first (updates arrive), cache as fallback.
   Bump VERSION on every release. */
const VERSION = 'english-v1.0.0';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'css/english.css', 'icons/icon.svg',
  'js/text.js', 'data/irregular.js', 'js/check.js', 'data/demo.js', 'data/grammar.js', 'data/vocab.js', 'js/grammar.js', 'js/content.js',
  'js/srs.js', 'js/store.js', 'js/session.js', 'js/speech.js', 'js/platform.js', 'js/ui.js', 'js/practice.js', 'js/screens.js', 'js/parent.js', 'js/app.js',
  'fonts/atkinson-hyperlegible-latin-400-normal.woff2', 'fonts/atkinson-hyperlegible-latin-700-normal.woff2',
  'fonts/OpenDyslexic-Regular.woff', 'fonts/OpenDyslexic-Bold.woff'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== VERSION).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
