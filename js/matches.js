// 📄 Fichier : /js/matches.js
// 🎯 Rôle : Logique métier liée aux matchs (enregistrement, suppression, édition)

const Matches = {

  generateId() {
    return 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  },

  getAll() {
    return Storage.getMatches();
  },

  getById(id) {
    return this.getAll().find(m => m.id === id) || null;
  },

  add(playerAId, playerBId, format, sets) {
    const playerA = Players.findById(playerAId);
    const playerB = Players.findById(playerBId);
    if (!playerA || !playerB) return null;

    const { setsA, setsB } = this._countSets(sets);
    const aWins = setsA > setsB;
    const winnerId = aWins ? playerAId : playerBId;
    const eloResult = Elo.calculate(playerA.elo, playerB.elo, aWins, sets);

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
      eloA:      playerA.elo,
      eloB:      playerB.elo,
      deltaA:    eloResult.deltaA,
      deltaB:    eloResult.deltaB,
      eloAAfter: playerA.elo + eloResult.deltaA,
      eloBAfter: playerB.elo + eloResult.deltaB
    };

    const matches = this.getAll();
    matches.push(match);
    Storage.saveMatches(matches);

    Players.applyMatchResult(playerAId, aWins,  eloResult.deltaA);
    Players.applyMatchResult(playerBId, !aWins, eloResult.deltaB);

    return match;
  },

  remove(matchId) {
    const match = this.getAll().find(m => m.id === matchId);
    if (!match) return;

    const aWon = match.winnerId === match.playerAId;
    Players.reverseMatchResult(match.playerAId, aWon,  match.deltaA);
    Players.reverseMatchResult(match.playerBId, !aWon, match.deltaB);
    Players.recalculateStreak(match.playerAId);
    Players.recalculateStreak(match.playerBId);

    const matches = this.getAll().filter(m => m.id !== matchId);
    Storage.saveMatches(matches);
  },

  removeMany(matchIds) {
    matchIds.forEach(id => this.remove(id));
  },
  update(matchId, changes) {
    const all = this.getAll();
    const idx = all.findIndex(m => m.id === matchId);
    if (idx === -1) return;
    all[idx] = { ...all[idx], ...changes };
    Storage.saveMatches(all);
    this._recalcAllElo();
  },

  _recalcAllElo() {
    const players = Players.getAll();
    players.forEach(p => {
      p.elo    = CONFIG.ELO_DEFAULT;
      p.wins   = 0;
      p.losses = 0;
      p.streak = 0;
    });
    Storage.savePlayers(players);

    const matches = this.getAll().sort((a, b) => a.timestamp - b.timestamp);
    matches.forEach(m => {
      const pA = Players.findById(m.playerAId);
      const pB = Players.findById(m.playerBId);
      if (!pA || !pB) return;

      const aWins     = m.winnerId === m.playerAId;
      const eloResult = Elo.calculate(pA.elo, pB.elo, aWins, m.sets);

      m.eloA      = pA.elo;
      m.eloB      = pB.elo;
      m.deltaA    = eloResult.deltaA;
      m.deltaB    = eloResult.deltaB;
      m.eloAAfter = pA.elo + eloResult.deltaA;
      m.eloBAfter = pB.elo + eloResult.deltaB;

      Players.applyMatchResult(m.playerAId,  aWins, eloResult.deltaA);
      Players.applyMatchResult(m.playerBId, !aWins, eloResult.deltaB);
    });
    Storage.saveMatches(matches);
  },

  _countSets(sets) {
    let setsA = 0, setsB = 0;
    sets.forEach(s => {
      if (s.a > s.b) setsA++;
      else if (s.b > s.a) setsB++;
    });
    return { setsA, setsB };
  },

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

  formatDate(timestamp) {
    const d = new Date(timestamp);
    const date = d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
    const time = d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
    return `${date} à ${time}`;
  }

};
