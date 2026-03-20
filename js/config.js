// 📄 Fichier : /js/config.js
// 🎯 Rôle : Constantes et paramètres globaux de l'application

const CONFIG = {

  // --- ELO ---
  ELO_DEFAULT: 1000,

  // K-factor variable selon le niveau ELO
  ELO_K_BRACKETS: [
    { maxElo: 1200, k: 40 },
    { maxElo: 1600, k: 32 },
    { maxElo: 2000, k: 24 },
    { maxElo: Infinity, k: 20 }
  ],

  // Multiplicateurs de combativité selon le score en sets
  // Clé : "setsGagnant-setsPerdant"
  ELO_SET_MULTIPLIERS: {
    // Vainqueur
    '3-0': 1.0,
    '3-1': 1.2,
    '3-2': 1.4,
    '2-0': 1.0,
    '2-1': 1.2,
    '1-0': 1.0,
    // Perdant (clé du point de vue du perdant)
    '0-3': 0.8,
    '1-3': 1.1,
    '2-3': 1.3,
    '0-2': 0.8,
    '1-2': 1.1,
    '0-1': 0.8
  },

  // --- SÉRIES ---
  STREAK_MIN: 3,

  // --- RATIO couleurs ---
  RATIO_RED_MAX: 25,
  RATIO_YELLOW_MAX: 60,

  // --- PAGINATION ---
  ITEMS_PER_PAGE: 8,

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
