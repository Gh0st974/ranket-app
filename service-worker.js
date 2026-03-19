// 📄 Fichier : /service-worker.js
// 🎯 Rôle : Cache les ressources pour le mode hors-ligne (PWA)

const CACHE_NAME = 'ranket-v1';

// Ressources à mettre en cache lors de l'installation
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/reset.css',
  './css/layout.css',
  './css/components.css',
  './css/responsive.css',
  './js/config.js',
  './js/storage.js',
  './js/elo.js',
  './js/players.js',
  './js/matches.js',
  './js/ranking.js',
  './js/ui.js',
  './js/views/view-ranking.js',
  './js/views/view-match.js',
  './js/views/view-history.js',
  './js/views/view-players.js',
  './js/app.js'
];

// Installation : mise en cache des ressources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activation : suppression des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch : répondre depuis le cache si disponible
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
