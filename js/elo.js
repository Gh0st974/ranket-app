// 📄 Fichier : /js/elo.js
// 🎯 Rôle : Calculs mathématiques du système ELO avec K-factor variable
//           et multiplicateur de combativité basé sur l'écart moyen de points par set

const Elo = {

  /**
   * Calcule les deltas ELO après un match
   * @param {number}  eloA  - ELO du joueur A avant le match
   * @param {number}  eloB  - ELO du joueur B avant le match
   * @param {boolean} aWins - true si A a gagné
   * @param {Array}   sets  - [{ a: number, b: number }, ...]
   * @returns {{ deltaA: number, deltaB: number }}
   */
  calculate(eloA, eloB, aWins, sets = []) {
    const expectedA = this._expected(eloA, eloB);
    const expectedB = this._expected(eloB, eloA);

    const scoreA = aWins ? 1 : 0;
    const scoreB = aWins ? 0 : 1;

    const kA = this._kFactor(eloA);
    const kB = this._kFactor(eloB);

    // Calcul de l'écart moyen de points par set
    const avgGap = this._averageGap(sets);

    // Récupération des multiplicateurs selon l'écart moyen
    const bracket = CONFIG.ELO_COMBATIVITY_BRACKETS.find(b => avgGap <= b.maxGap);
    const multWinner = bracket ? bracket.multiplierWinner : 1.0;
    const multLoser  = bracket ? bracket.multiplierLoser  : 1.0;

    // On applique le bon multiplicateur à chaque joueur
    const multA = aWins ? multWinner : multLoser;
    const multB = aWins ? multLoser  : multWinner;

    const deltaA = Math.round(kA * multA * (scoreA - expectedA));
    const deltaB = Math.round(kB * multB * (scoreB - expectedB));

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
   * Retourne le K-factor selon les paliers définis dans config.js
   * @param {number} elo
   * @returns {number}
   */
  _kFactor(elo) {
    const bracket = CONFIG.ELO_K_BRACKETS.find(b => elo < b.maxElo);
    return bracket ? bracket.k : 20;
  },

  /**
   * Calcule l'écart moyen de points par set
   * Ex: sets = [{a:11, b:9}, {a:8, b:11}, {a:11, b:7}]
   *     écarts = [2, 3, 4] → moyenne = 3
   * @param {Array} sets - [{ a: number, b: number }, ...]
   * @returns {number}
   */
  _averageGap(sets) {
    if (!sets || sets.length === 0) return 0;

    const totalGap = sets.reduce((sum, set) => {
      return sum + Math.abs(set.a - set.b);
    }, 0);

    return totalGap / sets.length;
  },

  /**
   * Score attendu selon la formule ELO standard
   * E = 1 / (1 + 10^((eloB - eloA) / 400))
   */
  _expected(eloA, eloB) {
    return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
  }
};
