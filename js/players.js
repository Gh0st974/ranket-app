// 📄 Fichier : /js/players.js
// 🎯 Rôle : Logique métier liée aux joueurs (CRUD, stats, import CSV)

const Players = {

  /**
   * Génère un ID unique pour un joueur
   */
  generateId() {
    return 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  },

  /**
   * Crée un objet joueur avec les valeurs par défaut
   */
  createPlayer(firstName, lastName) {
    return {
      id: this.generateId(),
      firstName: this._capitalize(firstName.trim()),
      lastName: lastName.trim().toUpperCase(),
      elo: CONFIG.ELO_DEFAULT,
      wins: 0,
      losses: 0,
      matches: 0,
      streak: 0       // victoires consécutives actuelles
    };
  },

  /** Retourne tous les joueurs */
  getAll() {
    return Storage.getPlayers();
  },

  /** Ajoute un joueur */
  add(firstName, lastName) {
    if (!firstName || !lastName) return null;
    const players = this.getAll();
    const player = this.createPlayer(firstName, lastName);
    players.push(player);
    Storage.savePlayers(players);
    return player;
  },

  /** Supprime un joueur par ID */
  remove(playerId) {
    const players = this.getAll().filter(p => p.id !== playerId);
    Storage.savePlayers(players);
  },

  /** Supprime plusieurs joueurs par IDs */
  removeMany(playerIds) {
    const players = this.getAll().filter(p => !playerIds.includes(p.id));
    Storage.savePlayers(players);
  },

  /** Met à jour un joueur */
  update(playerId, data) {
    const players = this.getAll().map(p =>
      p.id === playerId ? { ...p, ...data } : p
    );
    Storage.savePlayers(players);
  },

  /** Trouve un joueur par ID */
  findById(playerId) {
    return this.getAll().find(p => p.id === playerId) || null;
  },

  /**
   * Importe une liste de joueurs depuis un contenu CSV
   * Format attendu : Prénom;Nom (une ligne par joueur)
   * @returns {{ added: number, errors: number }}
   */
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

  /**
   * Met à jour les stats d'un joueur après un match
   * @param {string} playerId
   * @param {boolean} won       - true si victoire
   * @param {number} eloDelta   - points ELO gagnés ou perdus
   */
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

  /**
   * Annule les stats d'un match pour un joueur (lors d'une suppression)
   */
  reverseMatchResult(playerId, won, eloDelta) {
    const player = this.findById(playerId);
    if (!player) return;

    this.update(playerId, {
      elo:     player.elo - eloDelta,
      wins:    Math.max(0, player.wins   - (won ? 1 : 0)),
      losses:  Math.max(0, player.losses - (won ? 0 : 1)),
      matches: Math.max(0, player.matches - 1)
      // streak : recalculé depuis l'historique si besoin
    });
  },

  /** Recalcule la série de victoires d'un joueur depuis l'historique */
  recalculateStreak(playerId) {
    const matches = Storage.getMatches()
      .filter(m => m.playerAId === playerId || m.playerBId === playerId)
      .sort((a, b) => b.timestamp - a.timestamp);

    let streak = 0;
    for (const match of matches) {
      const won = match.winnerId === playerId;
      if (won) streak++;
      else break;
    }

    this.update(playerId, { streak });
  },

  /** Capitalise la première lettre d'un prénom */
  _capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  /** Retourne le nom complet affiché : Prénom NOM */
  fullName(player) {
    return `${player.firstName} ${player.lastName}`;
  }
};
