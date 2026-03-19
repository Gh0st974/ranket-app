// 📄 Fichier : /js/config.js
// 🎯 Rôle : Constantes et paramètres globaux de l'application

const CONFIG = {

  // --- ELO ---
  ELO_DEFAULT: 1000,        // Score ELO de départ pour tout nouveau joueur

  // K-factor variable selon le niveau ELO
  // Plus l'ELO est élevé, moins les points changent (système plus stable)
  ELO_K_FACTOR: (elo) => {
    if (elo < 1200) return 40;   // Débutants : changements rapides
    if (elo < 1600) return 32;   // Intermédiaires
    if (elo < 2000) return 24;   // Avancés
    return 20;                   // Experts : classement très stable
  },

  // --- SÉRIES ---
  STREAK_MIN: 3,            // Nombre de victoires consécutives pour afficher la flamme 🔥

  // --- RATIO couleurs ---
  RATIO_RED_MAX: 25,        // 0% → 25% = rouge
  RATIO_YELLOW_MAX: 60,     // 26% → 60% = jaune, au-dessus = vert

  // --- PAGINATION ---
  ITEMS_PER_PAGE: 8,        // Nombre d'éléments affichés avant le bouton "Afficher plus"

  // --- FORMATS DE MATCH ---
  FORMATS: {
    'best1': { label: '1 set gagnant', setsToWin: 1, maxSets: 1 },
    'best3': { label: 'Best of 3',     setsToWin: 2, maxSets: 3 },
    'best5': { label: 'Best of 5',     setsToWin: 3, maxSets: 5 }
  },

  // --- STORAGE KEYS ---
  STORAGE_KEYS: {
    PLAYERS: 'ranket_players',
    MATCHES: 'ranket_matches'
  }
};
