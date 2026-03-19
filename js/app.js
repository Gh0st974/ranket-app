// 📄 Fichier : /js/app.js
// 🎯 Rôle : Point d'entrée principal — routing entre les vues et init PWA
// ℹ️  Pas d'import ES module — tous les scripts sont chargés via <script src>
//     dans index.html dans le bon ordre. Les objets sont donc globaux.

const App = {

  // Vue actuellement affichée
  _currentView: 'ranking',

  // Vues classiques — injectées dynamiquement dans #app-main
  // Stats est géré séparément (section fixe dans le HTML)
  _views: {
    ranking: ViewRanking,
    match:   ViewMatch,
    history: ViewHistory,
    players: ViewPlayers,
  },

  /** Initialisation de l'application */
  init() {
    this._registerServiceWorker();
    this._bindNavigation();
    this._navigate('ranking'); // Vue par défaut
  },

  /**
   * Navigue vers une vue
   * @param {string} viewName - nom de la vue cible
   */
  _navigate(viewName) {
    this._currentView = viewName;

    // Mettre à jour le bouton actif dans la nav
    UI.setActiveNav(viewName);

    if (viewName === 'stats') {
      // Cas spécial : onglet Stats — section HTML fixe
      this._showStatsTab();
    } else {
      // Cas classique : masquer l'onglet stats, injecter la vue dans #app-main
      this._hideStatsTab();
      const view = this._views[viewName];
      if (view) view.render();
    }
  },

  /** Affiche la section Stats et l'initialise */
  _showStatsTab() {
    document.getElementById('app-main').classList.add('hidden');
    document.getElementById('tab-stats').classList.remove('hidden');
    // initStats() est exposé par statsUI.js (global)
    if (typeof initStats === 'function') initStats();
  },

  /** Masque la section Stats et réaffiche le main */
  _hideStatsTab() {
    document.getElementById('app-main').classList.remove('hidden');
    document.getElementById('tab-stats').classList.add('hidden');
  },

  /** Attache les événements de navigation sur les boutons */
  _bindNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view; // tous les boutons utilisent data-view
        if (view) this._navigate(view);
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

// Lancement au chargement du DOM
document.addEventListener('DOMContentLoaded', () => App.init());
