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

    const rows = visible.map(p => `
      <div class="player-row" data-id="${p.id}">
        <span class="player-name">${Players.fullName(p)}</span>
        <span class="player-elo">${p.elo} pts</span>
        <div class="player-actions">
          <button class="btn btn-sm btn-secondary btn-edit-player" data-id="${p.id}">✏️</button>
          <button class="btn btn-sm btn-danger btn-delete-player" data-id="${p.id}">🗑</button>
        </div>
      </div>
    `).join('');

    const moreBtn = hasMore ? `
      <button class="btn btn-secondary btn-load-more" id="btn-load-more-players">
        Voir plus (${players.length - this._displayCount} restants)
      </button>
    ` : '';

    return rows + moreBtn;
  },

  /** Attache tous les événements */
  _bindEvents() {
    // Ajout joueur
    document.getElementById('btn-add-player')
      .addEventListener('click', () => this._addPlayer());

    // Import CSV
    document.getElementById('btn-import-csv')
      .addEventListener('click', () => this._importCSV());

    // Nom fichier CSV
    document.getElementById('csv-file-input')
      .addEventListener('change', (e) => {
        const name = e.target.files[0]?.name || 'Aucun fichier';
        document.getElementById('csv-file-name').textContent = name;
      });

    // Liste : édition / suppression / voir plus
    document.getElementById('players-list-container')
      .addEventListener('click', (e) => {
        const editBtn   = e.target.closest('.btn-edit-player');
        const deleteBtn = e.target.closest('.btn-delete-player');
        const moreBtn   = e.target.closest('#btn-load-more-players');

        if (editBtn)   this._editPlayer(editBtn.dataset.id);
        if (deleteBtn) this._deletePlayer(deleteBtn.dataset.id);
        if (moreBtn)   this._loadMore();
      });
  },

  /** Charge plus de joueurs */
  _loadMore() {
    this._displayCount += CONFIG.ITEMS_PER_PAGE;
    this._refreshList();
  },

  /** Ajoute un joueur */
  _addPlayer() {
    const fn = document.getElementById('input-firstname').value.trim();
    const ln = document.getElementById('input-lastname').value.trim();
    if (!fn || !ln) { UI.toast('⚠️ Prénom et nom requis.'); return; }

    Players.add(fn, ln);
    UI.toast(`✅ ${fn} ${ln.toUpperCase()} ajouté !`);
    document.getElementById('input-firstname').value = '';
    document.getElementById('input-lastname').value  = '';
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
