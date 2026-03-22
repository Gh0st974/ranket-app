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

  // Multiplicateurs de combativité asymétriques
  // Appliqués selon le rôle ELO (fort / faible) et la performance du joueur_faible
  // performance = écart_attendu - écart_réel
  //   → performance > 0  : le faible a mieux résisté qu'attendu
  //   → performance <= 0 : le fort a dominé au-delà des attentes
  //
  // CAS 1 — Upset        : le joueur_faible gagne
  // CAS 2 — Match serré  : le joueur_fort gagne ET performance ≥ 2
  // CAS 3 — Dans les clous : -2 ≤ performance < 2   → neutre
  // CAS 4 — Écrasement   : performance < -2          → neutre
  ELO_COMBATIVITY: {
    UPSET: {
      multFaible : 1.5,
      multFort   : 0.6
    },
    TIGHT: {
      multFaible : 0.6,
      multFort   : 0.8
    },
    NEUTRAL: {
      multFaible : 1.0,
      multFort   : 1.0
    }
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
