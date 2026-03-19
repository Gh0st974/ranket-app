// 📄 Fichier : /js/elo.js
// 🎯 Rôle : Calculs mathématiques du système ELO

const Elo = {

  /**
   * Calcule les deltas ELO après un match
   * @param {number}  eloA  - ELO du joueur A avant le match
   * @param {number}  eloB  - ELO du joueur B avant le match
   * @param {boolean} aWins - true si A a gagné
   * @returns {{ deltaA: number, deltaB: number }}
   */
  calculate(eloA, eloB, aWins) {
    const expectedA = this._expected(eloA, eloB);
    const expectedB = this._expected(eloB, eloA);

    const scoreA = aWins ? 1 : 0;
    const scoreB = aWins ? 0 : 1;

    const kA = CONFIG.ELO_K_FACTOR(eloA);
    const kB = CONFIG.ELO_K_FACTOR(eloB);

    const deltaA = Math.round(kA * (scoreA - expectedA));
    const deltaB = Math.round(kB * (scoreB - expectedB));

    return { deltaA, deltaB };
  },

  /**
   * Calcule la probabilité de victoire de A contre B
   * @returns {number} Pourcentage arrondi (ex: 67)
   */
  winProbability(eloA, eloB) {
    return Math.round(this._expected(eloA, eloB) * 100);
  },

  /**
   * Score attendu selon la formule ELO standard
   * E = 1 / (1 + 10^((eloB - eloA) / 400))
   */
  _expected(eloA, eloB) {
    return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
  }
};
