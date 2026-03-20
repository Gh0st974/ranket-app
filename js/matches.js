// 📄 Fichier : /js/matches.js
// 🎯 Rôle : Logique métier liée aux matchs (enregistrement, suppression, édition)

const Matches = {

  /** Génère un ID unique pour un match */
  generateId() {
    return 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  },

  /** Retourne tous les matchs */
  getAll() {
    return Storage.getMatches();
  },

  /**
   * Enregistre un nouveau match et met à jour les ELO des joueurs
   * @param {string} playerAId
   * @param {string} playerBId
   * @param {string} format       - clé dans CONFIG.FORMATS
   * @param {Array}  sets         - [{ a: number, b: number }, ...]
   * @returns {object|null} Le match créé ou null si erreur
   */
  add(playerAId, playerBId, format, sets) {
    const playerA = Players.findById(playerAId);
    const playerB = Players.findById(playerBId);
    if (!playerA || !playerB) return null;

    // Calcul du score en sets
    const { setsA, setsB } = this._countSets(sets);
    const aWins = setsA > setsB;
    const winnerId = aWins ? playerAId : playerBId;

    // Calcul ELO
    const eloResult = Elo.calculate(playerA.elo, playerB.elo, aWins, setsA, setsB);

    // Création de l'objet match
    const match = {
      id:        this.generateId(),
      timestamp: Date.now(),
      format,
      playerAId,
      playerBId,
      sets,
      setsA,
      setsB,
      winnerId,
      eloA:      playerA.elo,  // ELO avant le match
      eloB:      playerB.elo,
      deltaA:    eloResult.deltaA,
      deltaB:    eloResult.deltaB
    };

    // Sauvegarde
    const matches = this.getAll();
    matches.push(match);
    Storage.saveMatches(matches);

    // Mise à jour des stats des joueurs
    Players.applyMatchResult(playerAId, aWins,  eloResult.deltaA);
    Players.applyMatchResult(playerBId, !aWins, eloResult.deltaB);

    return match;
  },

  /**
   * Supprime un match et annule son impact sur les ELO
   */
  remove(matchId) {
    const match = this.getAll().find(m => m.id === matchId);
    if (!match) return;

    // Annulation ELO
    const aWon = match.winnerId === match.playerAId;
    Players.reverseMatchResult(match.playerAId, aWon,  match.deltaA);
    Players.reverseMatchResult(match.playerBId, !aWon, match.deltaB);

    // Recalcul des séries
    Players.recalculateStreak(match.playerAId);
    Players.recalculateStreak(match.playerBId);

    // Suppression
    const matches = this.getAll().filter(m => m.id !== matchId);
    Storage.saveMatches(matches);
  },

  /** Supprime plusieurs matchs */
  removeMany(matchIds) {
    matchIds.forEach(id => this.remove(id));
  },

  /**
   * Compte le nombre de sets gagnés par chaque joueur
   */
  _countSets(sets) {
    let setsA = 0, setsB = 0;
    sets.forEach(s => {
      if (s.a > s.b) setsA++;
      else if (s.b > s.a) setsB++;
    });
    return { setsA, setsB };
  },

  /**
   * Filtre et trie les matchs
   * @param {object} options - { playerId, order: 'desc'|'asc' }
   */
  filter({ playerId = null, order = 'desc' } = {}) {
    let matches = this.getAll();

    if (playerId) {
      matches = matches.filter(
        m => m.playerAId === playerId || m.playerBId === playerId
      );
    }

    matches.sort((a, b) =>
      order === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
    );

    return matches;
  },

  /**
   * Formate une date timestamp en chaîne lisible
   */
  formatDate(timestamp) {
    const d = new Date(timestamp);
    const date = d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
    const time = d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
    return `${date} à ${time}`;
  }
};
