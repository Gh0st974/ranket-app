// 📄 Fichier : /js/players.js
// 🎯 Rôle : Logique métier liée aux joueurs (CRUD, stats, import CSV)

const Players = {

  generateId() {
    return 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  },

  createPlayer(firstName, lastName) {
    return {
      id:        this.generateId(),
      firstName: this._capitalize(firstName.trim()),
      lastName:  lastName.trim().toUpperCase(),
      elo:       CONFIG.ELO_DEFAULT,
      wins:      0,
      losses:    0,
      matches:   0,
      streak:    0
    };
  },

  getAll() {
    return Storage.getPlayers();
  },

  add(firstName, lastName) {
    if (!firstName || !lastName) return null;
    const players = this.getAll();
    const player  = this.createPlayer(firstName, lastName);
    players.push(player);
    Storage.savePlayers(players);
    return player;
  },

  remove(playerId) {
    const players = this.getAll().filter(p => p.id !== playerId);
    Storage.savePlayers(players);
  },

  removeMany(playerIds) {
    const players = this.getAll().filter(p => !playerIds.includes(p.id));
    Storage.savePlayers(players);
  },

  update(playerId, data) {
    const players = this.getAll().map(p =>
      p.id === playerId ? { ...p, ...data } : p
    );
    Storage.savePlayers(players);
  },

  /** Met à jour un joueur directement (usage interne recalcul ELO) */
  updateRaw(player) {
    const all = this.getAll();
    const idx = all.findIndex(p => p.id === player.id);
    if (idx !== -1) {
      all[idx] = player;
      Storage.savePlayers(all);
    }
  },

  findById(playerId) {
    return this.getAll().find(p => p.id === playerId) || null;
  },

  importFromCSV(csvContent) {
    const lines = csvContent.split('\n').map(l => l.trim()).filter(Boolean);
    let added = 0;
    let errors = 0;

    lines.forEach(line => {
      const parts = line.split(';');
      if (parts.length >= 2) {
        const firstName = parts[0].trim();
        const lastName  = parts[1].trim();
        if (firstName && lastName) {
          this.add(firstName, lastName);
          added++;
        } else {
          errors++;
        }
      } else {
        errors++;
      }
    });

    return { added, errors };
  },

  applyMatchResult(playerId, won, eloDelta) {
    const player = this.findById(playerId);
    if (!player) return;

    const newStreak = won ? player.streak + 1 : 0;

    this.update(playerId, {
      elo:     player.elo + eloDelta,
      wins:    player.wins    + (won ? 1 : 0),
      losses:  player.losses  + (won ? 0 : 1),
      matches: player.matches + 1,
      streak:  newStreak
    });
  },

  reverseMatchResult(playerId, won, eloDelta) {
    const player = this.findById(playerId);
    if (!player) return;

    this.update(playerId, {
      elo:     player.elo - eloDelta,
      wins:    Math.max(0, player.wins    - (won ? 1 : 0)),
      losses:  Math.max(0, player.losses  - (won ? 0 : 1)),
      matches: Math.max(0, player.matches - 1)
    });
  },

  recalculateStreak(playerId) {
    const matches = Storage.getMatches()
      .filter(m => m.playerAId === playerId || m.playerBId === playerId)
      .sort((a, b) => b.timestamp - a.timestamp);

    let streak = 0;
    for (const match of matches) {
      if (match.winnerId === playerId) streak++;
      else break;
    }

    this.update(playerId, { streak });
  },

  _capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  fullName(player) {
    return `${player.firstName} ${player.lastName}`;
  }

};
