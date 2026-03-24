// 📄 Fichier : /js/import-export.js
// 🎯 Rôle : Logique pure d'import et d'export des données au format JSON
// ℹ️  Pas de DOM ici — uniquement manipulation de données et déclenchement de téléchargement

const ImportExport = {

  // ===== EXPORT =====

  /**
   * Génère et télécharge un fichier JSON contenant joueurs + matchs
   */
  exportJSON() {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      players: Storage.getPlayers(),
      matches: Storage.getMatches()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');

    a.href     = url;
    a.download = `ranket-backup-${this._dateStamp()}.json`;

    // ✅ Fix : l'élément doit être dans le DOM pour fonctionner sur mobile/PWA
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  },

  // ===== IMPORT =====

  /**
   * Lit un fichier JSON sélectionné par l'utilisateur et fusionne les données
   * @param {File}     file       - Fichier sélectionné via <input type="file">
   * @param {Function} onSuccess  - Callback(stats) appelé après import réussi
   * @param {Function} onError    - Callback(message) appelé en cas d'erreur
   */
  importJSON(file, onSuccess, onError) {
    if (!file || !file.name.endsWith('.json')) {
      onError('Fichier invalide. Sélectionne un fichier .json');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!this._validate(data)) {
          onError('Structure JSON invalide ou fichier non reconnu.');
          return;
        }
        const stats = this._merge(data);
        onSuccess(stats);
      } catch {
        onError('Impossible de lire le fichier JSON.');
      }
    };

    reader.readAsText(file);
  },

  // ===== VALIDATION =====

  /**
   * Vérifie que le JSON contient bien les clés attendues
   * @param {object} data
   * @returns {boolean}
   */
  _validate(data) {
    return (
      data &&
      Array.isArray(data.players) &&
      Array.isArray(data.matches)
    );
  },

  // ===== FUSION =====

  /**
   * Fusionne joueurs et matchs importés avec les données existantes
   * - Joueurs : skip si ID existant
   * - Matchs  : skip si ID existant (import additif)
   * @param {object} data - Données parsées du JSON
   * @returns {{ newPlayers: number, newMatches: number }}
   */
  _merge(data) {
    const existingPlayers = Storage.getPlayers();
    const existingMatches = Storage.getMatches();

    const existingPlayerIds = new Set(existingPlayers.map(p => p.id));
    const existingMatchIds  = new Set(existingMatches.map(m => m.id));

    // Fusion joueurs
    let newPlayers = 0;
    for (const player of data.players) {
      if (!existingPlayerIds.has(player.id)) {
        existingPlayers.push(player);
        newPlayers++;
      }
    }

    // Fusion matchs
    let newMatches = 0;
    for (const match of data.matches) {
      if (!existingMatchIds.has(match.id)) {
        existingMatches.push(match);
        newMatches++;
      }
    }

    // Sauvegarde
    Storage.savePlayers(existingPlayers);
    Storage.saveMatches(existingMatches);

    // Recalcul ELO complet
    Matches._recalcAllElo();

    return { newPlayers, newMatches };
  },

  // ===== UTILITAIRES =====

  /**
   * Retourne une date formatée pour le nom de fichier (ex: 2025-01-15)
   * @returns {string}
   */
  _dateStamp() {
    return new Date().toISOString().slice(0, 10);
  }

};
