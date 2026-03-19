// 📄 Fichier : /js/storage.js
// 🎯 Rôle : Lecture et écriture des données dans le localStorage

const Storage = {

  // ---- JOUEURS ----

  /** Récupère la liste complète des joueurs */
  getPlayers() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.PLAYERS);
    return raw ? JSON.parse(raw) : [];
  },

  /** Sauvegarde la liste complète des joueurs */
  savePlayers(players) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  },

  // ---- MATCHS ----

  /** Récupère la liste complète des matchs */
  getMatches() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.MATCHES);
    return raw ? JSON.parse(raw) : [];
  },

  /** Sauvegarde la liste complète des matchs */
  saveMatches(matches) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.MATCHES, JSON.stringify(matches));
  },

  // ---- RESET ----

  /** Supprime toutes les données (joueurs + matchs) */
  clearAll() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.PLAYERS);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.MATCHES);
  },

  /** Supprime uniquement les matchs et remet les ELO à la valeur par défaut */
  resetElo() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.MATCHES);
    const players = this.getPlayers().map(p => ({
      ...p,
      elo: CONFIG.ELO_DEFAULT,
      wins: 0,
      losses: 0,
      matches: 0,
      streak: 0
    }));
    this.savePlayers(players);
  }
};
