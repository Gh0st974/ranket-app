// 📄 Fichier : /js/app.js
// 🎯 Rôle : Point d'entrée principal — routing entre les vues et init PWA
// ℹ️  Pas d'import ES module — tous les scripts sont chargés via <script src>
//     dans index.html dans le bon ordre. Les objets sont donc globaux.

const App = {

  // Vue actuellement affichée
  _currentView: 'ranking',

  /** Initialisation de l'application */
  init() {
    this._registerServiceWorker();
    this._bindNavigation();
    this._navigate('ranking'); // Vue par défaut
  },

  /**
   * Résout dynamiquement la vue correspondant au nom donné.
   * Déclaré en fonction pour éviter les problèmes de référence anticipée.
   * @param {string} viewName
   * @returns {object|null}
   */
  _resolveView(viewName) {
    const viewMap = {
      ranking: typeof ViewRanking !== 'undefined' ? ViewRanking : null,
      match:   typeof ViewMatch   !== 'undefined' ? ViewMatch   : null,
      history: typeof ViewHistory !== 'undefined' ? ViewHistory : null,
      players: typeof ViewPlayers !== 'undefined' ? ViewPlayers : null,
    };
    return viewMap[viewName] || null;
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
      const view = this._resolveView(viewName);
      if (view) {
        view.render();
      } else {
        console.warn(`⚠️ Vue introuvable : ${viewName}`);
      }
    }
  },

  /** Affiche la section Stats et l'initialise */
  _showStatsTab() {
    document.getElementById('app-main').classList.add('hidden');
    document.getElementById('tab-stats').classList.remove('hidden');
    if (typeof ViewStats !== 'undefined') ViewStats.render();
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
        const view = btn.dataset.view;
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
