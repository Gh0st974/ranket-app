// 📄 Fichier : /js/ranking.js
// 🎯 Rôle : Calculs et tri du classement général

const Ranking = {

  /**
   * Retourne les joueurs triés par ELO décroissant
   * avec leurs statistiques calculées
   * @returns {Array} Joueurs enrichis avec rang et ratio
   */
  getSorted() {
    const players = Players.getAll();

    // Tri par ELO décroissant, puis par victoires en cas d'égalité
    const sorted = [...players].sort((a, b) => {
      if (b.elo !== a.elo) return b.elo - a.elo;
      return b.wins - a.wins;
    });

    // Ajout du rang et du ratio calculé
    return sorted.map((player, index) => ({
      ...player,
      rank:  index + 1,
      ratio: this.calcRatio(player)
    }));
  },

  /**
   * Calcule le ratio victoires/matchs en pourcentage
   * @returns {number} Entre 0 et 100
   */
  calcRatio(player) {
    if (player.matches === 0) return 0;
    return Math.round((player.wins / player.matches) * 100);
  },

  /**
   * Retourne la classe CSS du badge ratio selon les seuils de CONFIG
   */
  getRatioClass(ratio) {
    if (ratio <= CONFIG.RATIO_RED_MAX)    return 'ratio-red';
    if (ratio <= CONFIG.RATIO_YELLOW_MAX) return 'ratio-yellow';
    return 'ratio-green';
  },

  /**
   * Retourne l'emoji médaille selon le rang
   */
  getMedalEmoji(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  },

  /**
   * Indique si un joueur est en série de victoires
   */
  hasStreak(player) {
    return player.streak >= CONFIG.STREAK_MIN;
  }
};
