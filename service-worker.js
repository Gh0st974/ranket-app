// 📄 Fichier : service-worker.js
// 🎯 Rôle : Cache des ressources pour le mode PWA offline

// ⚠️ Incrémenter cette version à chaque déploiement
const CACHE_NAME = 'ranket-v6';

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
  // Force l'activation immédiate sans attendre la fermeture des onglets
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url).catch(err => {
          console.warn('⚠️ Impossible de cacher :', url, err);
        }))
      );
    })
  );
});

// Activation — nettoyage des anciens caches + prise de contrôle immédiate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim()) // ← prend le contrôle immédiatement
  );
});

// Fetch — Network First pour JS/CSS, Cache First pour le reste
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // ✅ Ignorer les requêtes non-HTTP (extensions Chrome, etc.)
  if (!url.startsWith('http')) return;

  const isAsset = url.endsWith('.js') || url.endsWith('.css');
  if (isAsset) {
    // ✅ Network First — toujours la version fraîche pour le code
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request)) // fallback offline
    );
  } else {
    // Cache First pour images, fonts, etc.
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request);
      })
    );
  }
});
