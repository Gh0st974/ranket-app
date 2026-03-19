// 📄 Fichier : /js/app.js
// 🎯 Rôle : Point d'entrée principal — routing entre les vues et init PWA

const App = {

  // Vue actuellement affichée
  _currentView: 'ranking',

  // Map des vues disponibles
  _views: {
    ranking: ViewRanking,
    match:   ViewMatch,
    history: ViewHistory,
    players: ViewPlayers
  },

  /** Initialisation de l'application */
  init() {
    this._registerServiceWorker();
    this._bindNavigation();
    this._navigate('ranking');
  },

  /** Navigue vers une vue */
  _navigate(viewName) {
    const view = this._views[viewName];
    if (!view) return;

    this._currentView = viewName;
    UI.setActiveNav(viewName);
    view.render();
  },

  /** Attache les boutons de navigation */
  _bindNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._navigate(btn.dataset.view);
      });
    });
  },

  /** Enregistre le Service Worker pour la PWA */
  _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js')
        .then(() => console.log('✅ Service Worker enregistré'))
        .catch(err => console.warn('⚠️ SW non enregistré :', err));
    }
  }
};

// Lancement de l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', () => App.init());
