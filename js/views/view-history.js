// 📄 Fichier : /js/views/view-history.js
// 🎯 Rôle : Affichage et interactions de la vue "Historique des matchs"

const ViewHistory = {

  _filterPlayerId: '',   // Filtre joueur actif
  _sortOrder: 'desc',    // Tri : 'desc' = plus récent en premier
  _displayCount: CONFIG.ITEMS_PER_PAGE,
  _selectMode: false,

  /** Point d'entrée */
  render() {
    this._filterPlayerId = '';
    this._sortOrder      = 'desc';
    this._displayCount   = CONFIG.ITEMS_PER_PAGE;
    this._selectMode     = false;
    UI.render('#app-main', this._buildHTML());
    this._bindEvents();
  },

  /** Construit le HTML complet de la vue */
  _buildHTML() {
    const players = Players.getAll();
    return `
      <h2 class="view-title">Historique des matchs</h2>

      <!-- Filtres & Tri -->
      <div class="history-filters">
        <select id="filter-player">
          <option value="">👤 Tous les joueurs</option>
          ${players.map(p =>
            `<option value="${p.id}" ${this._filterPlayerId === p.id ? 'selected' : ''}>
              ${Players.fullName(p)}
            </option>`
          ).join('')}
        </select>
        <select id="filter-sort">
          <option value="desc" ${this._sortOrder === 'desc' ? 'selected' : ''}>📅 Plus récent</option>
          <option value="asc"  ${this._sortOrder === 'asc'  ? 'selected' : ''}>📅 Plus ancien</option>
        </select>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <button class="btn btn-secondary" id="btn-select-history">✔ Sélectionner</button>
        <button class="btn btn-secondary" id="btn-clear-history">✖ Tout effacer</button>
      </div>

      <!-- Liste des matchs -->
      <div id="history-list-container">
        ${this._buildList()}
      </div>
    `;
  },

  /** Construit la liste des matchs filtrés */
  _buildList() {
    const matches = Matches.filter({
      playerId: this._filterPlayerId || null,
      order:    this._sortOrder
    });

    if (matches.length === 0) {
      return '<div class="empty-state">📋 Aucun match enregistré</div>';
    }

    const visible = matches.slice(0, this._displayCount);
    const hasMore = matches.length > this._displayCount;

    const cards = visible.map(m => this._buildCard(m)).join('');
    const showMore = hasMore ? `
      <div class="show-more-btn">
        <button id="btn-show-more-history">⌄ Afficher plus</button>
      </div>` : '';

    return cards + showMore;
  },

  /** Construit la carte HTML d'un match */
  _buildCard(match) {
    const pA      = Players.findById(match.playerAId);
    const pB      = Players.findById(match.playerBId);
    if (!pA || !pB) return '';

    const nameA   = Players.fullName(pA);
    const nameB   = Players.fullName(pB);
    const aWon    = match.winnerId === match.playerAId;
    const fmt     = CONFIG.FORMATS[match.format]?.label || match.format;
    const date    = Matches.formatDate(match.timestamp);

    const deltaASign = match.deltaA >= 0 ? '+' : '';
    const deltaBSign = match.deltaB >= 0 ? '+' : '';

    const setsDetail = match.sets.map((s, i) =>
      `<span class="set-badge">Set ${i+1} : ${s.a}—${s.b}</span>`
    ).join('');

    const checkbox = this._selectMode
      ? `<input type="checkbox" class="select-checkbox history-check" data-id="${match.id}">`
      : '';

    return `
      <div class="match-card" data-id="${match.id}">
        <div class="match-card-header">
          <span class="match-date">${date}</span>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="match-format-badge">${fmt}</span>
            ${checkbox}
          </div>
        </div>
        <div class="match-players">
          <div class="match-player">
            <span class="match-player-name ${aWon ? 'winner' : ''}">${nameA}</span>
            <span class="match-elo-delta ${match.deltaA >= 0 ? 'elo-gain' : 'elo-loss'}">
              ${deltaASign}${match.deltaA} pts ELO
            </span>
          </div>
          <span class="match-score-badge">${match.setsA} — ${match.setsB}</span>
          <div class="match-player" style="text-align:right;">
            <span class="match-player-name ${!aWon ? 'winner' : ''}">${nameB}</span>
            <span class="match-elo-delta ${match.deltaB >= 0 ? 'elo-gain' : 'elo-loss'}">
              ${deltaBSign}${match.deltaB} pts ELO
            </span>
          </div>
        </div>
        <div class="match-sets">${setsDetail}</div>
        <div class="match-card-actions" style="margin-top:8px; justify-content:flex-end; display:flex; gap:6px;">
          <button class="icon-btn icon-btn-delete" data-delete="${match.id}">🗑</button>
        </div>
      </div>
    `;
  },

  /** Attache les événements */
  _bindEvents() {
    // Filtre joueur
    document.getElementById('filter-player')?.addEventListener('change', (e) => {
      this._filterPlayerId = e.target.value;
      this._displayCount   = CONFIG.ITEMS_PER_PAGE;
      this._refreshList();
    });

    // Tri date
    document.getElementById('filter-sort')?.addEventListener('change', (e) => {
      this._sortOrder    = e.target.value;
      this._displayCount = CONFIG.ITEMS_PER_PAGE;
      this._refreshList();
    });

    // Mode sélection
    document.getElementById('btn-select-history')?.addEventListener('click', () => {
      this._selectMode = !this._selectMode;
      this._refreshList();
    });

    // Tout effacer / supprimer sélection
    document.getElementById('btn-clear-history')?.addEventListener('click', () => {
      if (this._selectMode) {
        const checked = [...document.querySelectorAll('.history-check:checked')]
          .map(el => el.dataset.id);
        if (checked.length === 0) { UI.toast('Aucun match sélectionné.'); return; }
        UI.confirm(
          'Supprimer les matchs sélectionnés ?',
          `${checked.length} match(s) seront supprimés et les ELO ajustés.`,
          () => { Matches.removeMany(checked); this._refreshList(); },
          'Supprimer', 'btn-danger'
        );
      } else {
        UI.confirm(
          'Effacer tout l\'historique ?',
          'Tous les matchs seront supprimés et les ELO réinitialisés.',
          () => { Storage.resetElo(); this.render(); },
          'Tout effacer', 'btn-danger'
        );
      }
    });

    // Délégation : suppression d'un match
    document.getElementById('history-list-container')?.addEventListener('click', (e) => {
      const deleteId = e.target.closest('[data-delete]')?.dataset.delete;
      if (deleteId) {
        UI.confirm(
          'Supprimer ce match ?',
          'L\'ELO des deux joueurs sera ajusté.',
          () => { Matches.remove(deleteId); this._refreshList(); },
          'Supprimer', 'btn-danger'
        );
      }

      // Afficher plus
      if (e.target.id === 'btn-show-more-history') {
        this._displayCount += CONFIG.ITEMS_PER_PAGE;
        this._refreshList();
      }
    });
  },

  /** Rafraîchit uniquement la liste */
  _refreshList() {
    const container = document.getElementById('history-list-container');
    if (container) container.innerHTML = this._buildList();
  }
};
