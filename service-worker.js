// 📄 Fichier : service-worker.js
// 🎯 Rôle : Cache des ressources pour le mode PWA offline

const CACHE_NAME = 'ranket-v1';

// ⚠️ Liste uniquement les fichiers qui existent réellement
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/reset.css',
  './css/layout.css',
  './css/responsive.css',
  './css/components/buttons.css',
  './css/components/table-ranking.css',
  './css/components/match-cards.css',
  './css/components/forms.css',
  './css/components/ui.css',
  './css/components/stats.css',
  './js/config.js',
  './js/storage.js',
  './js/elo.js',
  './js/players.js',
  './js/matches.js',
  './js/ranking.js',
  './js/ui.js',
  './js/stats.js',
  './js/charts.js',
  './js/statsUI.js',
  './js/views/view-ranking.js',
  './js/views/view-match.js',
  './js/views/view-history.js',
  './js/views/view-players.js',
  './js/app.js'
];


// Installation — mise en cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // On ajoute les fichiers un par un pour éviter qu'un seul
      // fichier manquant ne fasse tout échouer
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url).catch(err => {
          console.warn('⚠️ Impossible de cacher :', url, err);
        }))
      );
    })
  );
});

// Activation — nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
});

// Fetch — répondre depuis le cache si disponible
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});
