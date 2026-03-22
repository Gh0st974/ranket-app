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

  // Seuil de différence d'ELO en dessous duquel les joueurs sont considérés "égaux"
  // Au-delà → un écrasement est attendu → NEUTRAL
  ELO_CRUSH_MAX_DIFF: 100,

  // Multiplicateurs de combativité asymétriques
  //
  // performance = expectedGap - avgGap
  //   → performance > 0  : le faible a mieux résisté qu'attendu
  //   → performance <= 0 : le fort a dominé au-delà des attentes
  //
  // CAS 1 — Upset      : le joueur_faible gagne
  // CAS 2 — Serré      : le fort gagne ET performance ≥ 2
  // CAS 3 — Crush      : écrasement + eloDiff ≤ ELO_CRUSH_MAX_DIFF
  //                       → gagnant récompensé, perdant pénalisé
  // CAS 4 — Neutral    : tout le reste (attendu selon l'écart ELO)
  ELO_COMBATIVITY: {
    UPSET: {
      multFaible : 1.5,
      multFort   : 1.5
    },
    TIGHT: {
      multFaible : 0.6,
      multFort   : 0.8
    },
    CRUSH: {
      multGagnant : 1.3,
      multPerdant : 1.3
    },
    NEUTRAL: {
      multFaible : 1.0,
      multFort   : 1.0
    }
  },

  // Multiplicateurs de format de match
  // Bo3 est la référence neutre (× 1.0)
  ELO_FORMAT_MULTIPLIER: {
    'best1': 0.5,
    'best3': 1.0,
    'best5': 1.67
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
