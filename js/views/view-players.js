// 📄 Fichier : /js/views/view-players.js
// 🎯 Rôle : Affichage et interactions de la vue "Gestion des joueurs"

const ViewPlayers = {

  _displayCount: CONFIG.ITEMS_PER_PAGE,

  /** Point d'entrée */
  render() {
    this._displayCount = CONFIG.ITEMS_PER_PAGE;
    UI.render('#app-main', this._buildHTML());
    this._bindEvents();
  },

  /** Construit le HTML complet */
  _buildHTML() {
    return `
      <h2 class="view-title">Gestion des joueurs</h2>

      <!-- Formulaire ajout -->
      <div class="section-label">Ajouter un joueur</div>
      <div class="add-player-form">
        <input type="text" id="input-firstname" placeholder="Prénom" maxlength="30">
        <input type="text" id="input-lastname"  placeholder="Nom"    maxlength="30">
        <button class="btn btn-primary" id="btn-add-player">+ Ajouter</button>
      </div>

      <!-- Import CSV -->
      <div class="section-label">Import CSV</div>
      <div class="csv-import-row">
        <label class="csv-file-label" for="csv-file-input">📂 Choisir un fichier</label>
        <input type="file" id="csv-file-input" accept=".csv,.txt">
        <span class="csv-file-name" id="csv-file-name">Aucun fichier</span>
        <button class="btn btn-warning" id="btn-import-csv">⬆ Importer</button>
      </div>
      <p style="font-size:0.72rem; color:#aaa; margin-top:6px;">
        Format attendu : <strong>Prénom;Nom</strong> (une ligne par joueur)
      </p>

      <!-- Liste des joueurs -->
      <div class="section-label" style="margin-top:20px;">
        Joueurs enregistrés
      </div>
      <div id="players-list-container">
        ${this._buildList()}
      </div>

      <!-- Zone danger -->
      <div class="danger-zone">
        <div class="danger-zone-title">⚠️ Zone dangereuse</div>
        <div class="danger-zone-subtitle">Ces actions sont irréversibles</div>
        <div class="danger-zone-buttons">
          <button class="btn btn-warning" id="btn-reset-elo">🔄 Remettre les ELO à zéro</button>
          <button class="btn btn-danger"  id="btn-clear-all">🗑 Tout supprimer</button>
        </div>
      </div>
    `;
  },

  /** Construit la liste des joueurs */
  _buildList() {
    const players = Players.getAll();
    if (players.length === 0) {
      return '<div class="empty-state">👥 Aucun joueur enregistré</div>';
    }

    const visible = players.slice(0, this._displayCount);
    const hasMore = players.length > this._displayCount;

    const items = visible.map(p => `
      <div class="player-list-item" data-id="${p.id}">
        <div class="player-list-info">
          <span class="player-list-name">${Players.fullName(p)}</span>
          <span class="player-list-stats">
            ELO : ${p.elo} — ${p.matches} match(s) — ${p.wins}V / ${p.losses}D
          </span>
        </div>
        <div class="player-list-actions">
          <button class="icon-btn icon-btn-edit"   data-edit="${p.id}">✏️</button>
          <button class="icon-btn icon-btn-delete" data-delete="${p.id}">🗑</button>
        </div>
      </div>
    `).join('');

    const showMore = hasMore ? `
      <div class="show-more-btn">
        <button id="btn-show-more-players">⌄ Afficher plus</button>
      </div>` : '';

    return items + showMore;
  },

  /** Attache les événements */
  _bindEvents() {
    // Ajout joueur
    document.getElementById('btn-add-player').addEventListener('click', () => {
      this._addPlayer();
    });

    // Entrée clavier sur les champs
    ['input-firstname', 'input-lastname'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this._addPlayer();
      });
    });

    // Affichage nom fichier CSV
    document.getElementById('csv-file-input')?.addEventListener('change', (e) => {
      const name = e.target.files[0]?.name || 'Aucun fichier';
      document.getElementById('csv-file-name').textContent = name;
    });

    // Import CSV
    document.getElementById('btn-import-csv')?.addEventListener('click', () => {
      this._importCSV();
    });

    // Délégation sur la liste
    document.getElementById('players-list-container')?.addEventListener('click', (e) => {
      const editId   = e.target.closest('[data-edit]')?.dataset.edit;
      const deleteId = e.target.closest('[data-delete]')?.dataset.delete;

      if (editId)   this._editPlayer(editId);
      if (deleteId) this._deletePlayer(deleteId);

      if (e.target.id === 'btn-show-more-players') {
        this._displayCount += CONFIG.ITEMS_PER_PAGE;
        this._refreshList();
      }
    });

    // Reset ELO
    document.getElementById('btn-reset-elo')?.addEventListener('click', () => {
      UI.confirm(
        'Remettre tous les ELO à zéro ?',
        `Les ELO seront remis à ${CONFIG.ELO_DEFAULT}. L'historique des matchs sera supprimé.`,
        () => { Storage.resetElo(); UI.toast('ELO réinitialisés ✅'); this.render(); },
        'Réinitialiser', 'btn-warning'
      );
    });

    // Tout supprimer
    document.getElementById('btn-clear-all')?.addEventListener('click', () => {
      UI.confirm(
        'Tout supprimer ?',
        'Tous les joueurs et matchs seront définitivement supprimés.',
        () => { Storage.clearAll(); UI.toast('Données supprimées ✅'); this.render(); },
        'Tout supprimer', 'btn-danger'
      );
    });
  },

  /** Ajoute un joueur depuis le formulaire */
  _addPlayer() {
    const firstName = document.getElementById('input-firstname').value.trim();
    const lastName  = document.getElementById('input-lastname').value.trim();
    if (!firstName || !lastName) {
      UI.toast('⚠️ Prénom et nom requis.'); return;
    }
    Players.add(firstName, lastName);
    document.getElementById('input-firstname').value = '';
    document.getElementById('input-lastname').value  = '';
    UI.toast(`✅ ${firstName} ${lastName.toUpperCase()} ajouté !`);
    this._refreshList();
  },

  /** Importe des joueurs depuis un fichier CSV */
  _importCSV() {
    const file = document.getElementById('csv-file-input').files[0];
    if (!file) { UI.toast('⚠️ Aucun fichier sélectionné.'); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = Players.importFromCSV(e.target.result);
      UI.toast(`✅ ${result.added} joueur(s) importé(s)${result.errors ? ` — ${result.errors} erreur(s)` : ''}`);
      this._refreshList();
    };
    reader.readAsText(file);
  },

  /** Ouvre la modale d'édition d'un joueur */
  _editPlayer(playerId) {
    const player = Players.findById(playerId);
    if (!player) return;

    UI.openModal(`
      <div class="modal-title">✏️ Modifier le joueur</div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <input type="text" id="edit-firstname" value="${player.firstName}"
               placeholder="Prénom" style="padding:8px; border:1px solid #ddd; border-radius:8px;">
        <input type="text" id="edit-lastname"  value="${player.lastName}"
               placeholder="Nom"    style="padding:8px; border:1px solid #ddd; border-radius:8px;">
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="UI.closeModal()">Annuler</button>
        <button class="btn btn-primary"   id="btn-confirm-edit">Enregistrer</button>
      </div>
    `);

    document.getElementById('btn-confirm-edit').addEventListener('click', () => {
      const fn = document.getElementById('edit-firstname').value.trim();
      const ln = document.getElementById('edit-lastname').value.trim();
      if (!fn || !ln) { UI.toast('⚠️ Champs requis.'); return; }
      Players.update(playerId, { firstName: fn, lastName: ln.toUpperCase() });
      UI.closeModal();
      UI.toast('✅ Joueur mis à jour !');
      this._refreshList();
    });
  },

  /** Demande confirmation puis supprime un joueur */
  _deletePlayer(playerId) {
    const player = Players.findById(playerId);
    if (!player) return;
    UI.confirm(
      'Supprimer ce joueur ?',
      `${Players.fullName(player)} sera définitivement supprimé.`,
      () => {
        Players.remove(playerId);
        UI.toast('✅ Joueur supprimé.');
        this._refreshList();
      },
      'Supprimer', 'btn-danger'
    );
  },

  /** Rafraîchit uniquement la liste */
  _refreshList() {
    const container = document.getElementById('players-list-container');
    if (container) container.innerHTML = this._buildList();
  }
};
