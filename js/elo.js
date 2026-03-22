// 📄 Fichier : /js/elo.js
// 🎯 Rôle : Calculs mathématiques du système ELO avec K-factor variable
//           et multiplicateur de combativité asymétrique selon les rôles
//           fort/faible et la performance réelle vs attendue

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

    // multA et multB sont directement liés aux joueurs A et B
    const { multA, multB } = this._combativityMultiplier(eloA, eloB, aWins, sets);

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
   * Calcule les multiplicateurs de combativité asymétriques.
   *
   * Identifie qui est le joueur_fort (ELO le plus haut) et le joueur_faible,
   * calcule la performance du joueur_faible (écart_attendu - écart_réel),
   * puis applique les multiplicateurs selon 4 cas évalués dans l'ordre :
   *
   *   CAS 1 — Upset        : joueur_faible gagne
   *                          → faible ×1.5 | fort ×0.6
   *   CAS 2 — Match serré  : joueur_fort gagne ET performance ≥ 2
   *                          → faible ×1.2 | fort ×0.8
   *   CAS 3 — Dans les clous : -2 ≤ performance < 2
   *                          → faible ×1.0 | fort ×1.0
   *   CAS 4 — Écrasement   : performance < -2
   *                          → faible ×1.0 | fort ×1.0
   *
   * @param {number}  eloA
   * @param {number}  eloB
   * @param {boolean} aWins
   * @param {Array}   sets - [{ a: number, b: number }, ...]
   * @returns {{ multA: number, multB: number }}
   */
  _combativityMultiplier(eloA, eloB, aWins, sets) {
    // Valeur par défaut si pas de sets
    if (!sets || sets.length === 0) return { multA: 1.0, multB: 1.0 };

    // --- Identification des rôles ---
    // aIsFort = true si A est le joueur avec le plus haut ELO
    // En cas d'égalité d'ELO, A est arbitrairement considéré comme le fort
    const aIsFort   = eloA >= eloB;
    const fortWins  = aIsFort ? aWins : !aWins;  // true si le joueur_fort a gagné
    const faibleWins = !fortWins;                 // true si le joueur_faible a gagné

    // --- Calcul de la performance du joueur_faible ---
    // performance > 0 : le faible a mieux résisté qu'attendu
    // performance < 0 : le fort a dominé au-delà des attentes
    const eloDiff     = Math.abs(eloA - eloB);
    const expectedGap = this._expectedGap(eloDiff);
    const avgGap      = this._averageGap(sets);
    const performance = expectedGap - avgGap;

    // --- Sélection du cas (ordre prioritaire) ---
    const C = CONFIG.ELO_COMBATIVITY;
    let multFort, multFaible;

    if (faibleWins) {
      // CAS 1 — Upset : le joueur_faible a gagné
      multFaible = C.UPSET.multFaible;
      multFort   = C.UPSET.multFort;

    } else if (fortWins && performance >= 2) {
      // CAS 2 — Match serré : fort gagne mais faible a bien résisté
      multFaible = C.TIGHT.multFaible;
      multFort   = C.TIGHT.multFort;

    } else {
      // CAS 3 — Dans les clous (-2 ≤ performance < 2)
      // CAS 4 — Écrasement (performance < -2)
      // Les deux cas sont neutres
      multFaible = C.NEUTRAL.multFaible;
      multFort   = C.NEUTRAL.multFort;
    }

    // --- Réaffectation vers les joueurs A et B ---
    const multA = aIsFort ? multFort : multFaible;
    const multB = aIsFort ? multFaible : multFort;

    return { multA, multB };
  },

  /**
   * Retourne l'écart de points attendu par set selon la différence d'ELO.
   * Plus la différence est grande, plus l'écart attendu est élevé.
   *
   * Table :
   *   0   - 50  → 2 pts
   *   51  - 150 → 4 pts
   *   151 - 300 → 6 pts
   *   301+      → 8 pts
   *
   * @param {number} eloDiff - différence absolue entre les deux ELO
   * @returns {number}
   */
  _expectedGap(eloDiff) {
    if (eloDiff <= 50)  return 2;
    if (eloDiff <= 150) return 4;
    if (eloDiff <= 300) return 6;
    return 8;
  },

  /**
   * Calcule l'écart moyen de points par set.
   * Ex: sets = [{a:11, b:9}, {a:8, b:11}] → écarts = [2, 3] → moyenne = 2.5
   *
   * @param {Array} sets - [{ a: number, b: number }, ...]
   * @returns {number}
   */
  _averageGap(sets) {
    if (!sets || sets.length === 0) return 0;
    const totalGap = sets.reduce((sum, set) => sum + Math.abs(Number(set.a) - Number(set.b)), 0);
    return totalGap / sets.length;
  },

  /**
   * Score attendu selon la formule ELO standard.
   * E = 1 / (1 + 10^((eloB - eloA) / 400))
   */
  _expected(eloA, eloB) {
    return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
  }
};
