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

  // Multiplicateur de combativité basé sur la performance relative
  // performance = écart_attendu - écart_réel
  //   → performance élevée : le faible a résisté au-delà des attentes → bonus
  //   → performance faible ou négative : le fort a dominé → malus
  // Les paliers sont triés du plus grand au plus petit (ordre décroissant)
  ELO_COMBATIVITY_BRACKETS: [
    { minPerf:  4, multiplierWinner: 1.4, multiplierLoser: 1.3 }, // Résistance exceptionnelle
    { minPerf:  2, multiplierWinner: 1.2, multiplierLoser: 1.1 }, // Légèrement au-dessus des attentes
    { minPerf: -2, multiplierWinner: 1.0, multiplierLoser: 1.0 }, // Dans les clous
    { minPerf: -Infinity, multiplierWinner: 0.8, multiplierLoser: 0.8 } // Écrasement
  ],

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
