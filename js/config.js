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

  // Multiplicateur de combativité selon l'écart moyen de points par set
  // Plus l'écart est faible, plus le match était serré = bonus ELO
  ELO_COMBATIVITY_BRACKETS: [
    { maxGap: 3,        multiplierWinner: 1.4, multiplierLoser: 1.3 },
    { maxGap: 6,        multiplierWinner: 1.2, multiplierLoser: 1.1 },
    { maxGap: 9,        multiplierWinner: 1.0, multiplierLoser: 1.0 },
    { maxGap: Infinity, multiplierWinner: 0.8, multiplierLoser: 0.8 }
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
