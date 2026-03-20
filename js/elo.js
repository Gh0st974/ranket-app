// 📄 Fichier : /js/elo.js
// 🎯 Rôle : Calculs mathématiques du système ELO avec K-factor variable
//           et multiplicateur de combativité basé sur le score en sets

const Elo = {

  /**
   * Calcule les deltas ELO après un match
   * @param {number}  eloA   - ELO du joueur A avant le match
   * @param {number}  eloB   - ELO du joueur B avant le match
   * @param {boolean} aWins  - true si A a gagné
   * @param {number}  setsA  - Sets remportés par A
   * @param {number}  setsB  - Sets remportés par B
   * @returns {{ deltaA: number, deltaB: number }}
   */
  calculate(eloA, eloB, aWins, setsA = 0, setsB = 0) {
    const expectedA = this._expected(eloA, eloB);
    const expectedB = this._expected(eloB, eloA);

    const scoreA = aWins ? 1 : 0;
    const scoreB = aWins ? 0 : 1;

    const kA = this._kFactor(eloA);
    const kB = this._kFactor(eloB);

    // Multiplicateur selon le score vu du gagnant et du perdant
    const multWinner = this._multiplier(
      aWins ? setsA : setsB,
      aWins ? setsB : setsA,
      true
    );
    const multLoser = this._multiplier(
      aWins ? setsA : setsB,
      aWins ? setsB : setsA,
      false
    );

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
   * Retourne le multiplicateur de combativité selon le score en sets
   * @param {number}  setsWinner - Sets du gagnant
   * @param {number}  setsLoser  - Sets du perdant
   * @param {boolean} isWinner   - true si on calcule pour le gagnant
   * @returns {number}
   */
  _multiplier(setsWinner, setsLoser, isWinner) {
    const key = isWinner
      ? `${setsWinner}-${setsLoser}`   // ex: "3-1" pour le gagnant
      : `${setsLoser}-${setsWinner}`;  // ex: "1-3" pour le perdant

    const mult = CONFIG.ELO_SET_MULTIPLIERS[key];

    // Si la clé n'existe pas, multiplicateur neutre par défaut
    if (mult === undefined) {
      console.warn(`[ELO] Multiplicateur introuvable pour la clé "${key}", valeur 1.0 utilisée.`);
      return 1.0;
    }

    return mult;
  },

  /**
   * Score attendu selon la formule ELO standard
   * E = 1 / (1 + 10^((eloB - eloA) / 400))
   */
  _expected(eloA, eloB) {
    return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
  }
};
