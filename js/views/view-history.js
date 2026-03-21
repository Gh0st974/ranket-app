// 📄 Fichier : /js/views/view-history.js
// 🎯 Rôle : Affichage et interactions de la vue "Historique des matchs"

const ViewHistory = {

  _filterPlayerId: '',
  _sortOrder: 'desc',
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

  /** Construit la liste des matchs filtrés/triés */
  _buildList() {
    let matches = Matches.getAll();

    // Filtre par joueur
    if (this._filterPlayerId) {
      matches = matches.filter(m =>
        m.playerAId === this._filterPlayerId ||
        m.playerBId === this._filterPlayerId
      );
    }

    // Tri
    matches = matches.sort((a, b) =>
      this._sortOrder === 'desc'
        ? b.timestamp - a.timestamp
        : a.timestamp - b.timestamp
    );

    if (matches.length === 0) {
      return `<p class="empty-state">Aucun match enregistré.</p>`;
    }

    const visible = matches.slice(0, this._displayCount);
    const hasMore = matches.length > this._displayCount;

    return `
      ${visible.map(m => this._buildCard(m)).join('')}
      ${hasMore ? `
        <button class="btn btn-secondary" id="btn-show-more-history">
          Afficher plus (${matches.length - this._displayCount} restants)
        </button>` : ''}
    `;
  },

  /** Construit la carte HTML d'un match */
  _buildCard(match) {
    const pA = Players.findById(match.playerAId);
    const pB = Players.findById(match.playerBId);
    if (!pA || !pB) return '';

    const nameA = Players.fullName(pA);
    const nameB = Players.fullName(pB);
    const aWon  = match.winnerId === match.playerAId;
    const fmt   = CONFIG.FORMATS[match.format]?.label || match.format;
    const date  = Matches.formatDate(match.timestamp);

    // ELO avant/après
    const eloABefore = (match.eloAAfter ?? 0) - (match.deltaA ?? 0);
    const eloBBefore = (match.eloBAfter ?? 0) - (match.deltaB ?? 0);
    const eloAAfter  = match.eloAAfter ?? '—';
    const eloBAfter  = match.eloBAfter ?? '—';

    const deltaASign = (match.deltaA ?? 0) >= 0 ? '+' : '';
    const deltaBSign = (match.deltaB ?? 0) >= 0 ? '+' : '';
    const deltaACls  = (match.deltaA ?? 0) >= 0 ? 'elo-gain' : 'elo-loss';
    const deltaBCls  = (match.deltaB ?? 0) >= 0 ? 'elo-gain' : 'elo-loss';

    // Badges sets
    const setsDetail = (match.sets || []).map((s, i) =>
      `<span class="set-badge">Set ${i + 1} : ${s.a} - ${s.b}</span>`
    ).join('');

    // Checkbox si mode sélection actif
    const checkbox = this._selectMode
      ? `<input type="checkbox" class="select-checkbox history-check" data-id="${match.id}">`
      : '';

    return `
      <div class="match-card" data-id="${match.id}">

        <!-- Ligne 1 : date | format | actions -->
        <div class="match-card-header">
          <span class="match-date">📅 ${date}</span>
          <span class="match-format-badge">Format : ${fmt}</span>
          <div class="match-card-actions">
            ${checkbox}
            <button class="icon-btn icon-btn-edit" data-edit="${match.id}">✏️</button>
            <button class="icon-btn icon-btn-delete" data-delete="${match.id}">🗑️</button>
          </div>
        </div>

        <!-- Ligne 2 : Joueur A | score | Joueur B -->
        <div class="match-players">
          <div class="match-player match-player--left">
            ${aWon ? '<span class="winner-trophy">🏆</span>' : ''}
            <span class="match-player-name ${aWon ? 'winner' : ''}">${nameA}</span>
          </div>

          <span class="match-score-badge">${match.setsA} - ${match.setsB}</span>

          <div class="match-player match-player--right">
            ${!aWon ? '<span class="winner-trophy">🏆</span>' : ''}
            <span class="match-player-name ${!aWon ? 'winner' : ''}">${nameB}</span>
          </div>
        </div>

        <!-- Ligne 3 : ELO avant > après + delta -->
        <div class="match-elo-row">
          <div class="match-elo-block match-elo-block--left">
            <span class="elo-track">${eloABefore} › ${eloAAfter}</span>
            <span class="elo-delta-badge ${deltaACls}">${deltaASign}${match.deltaA ?? 0}</span>
          </div>
          <div class="match-elo-block match-elo-block--right">
            <span class="elo-track">${eloBBefore} › ${eloBAfter}</span>
            <span class="elo-delta-badge ${deltaBCls}">${deltaBSign}${match.deltaB ?? 0}</span>
          </div>
        </div>

        <!-- Ligne 4 : Sets -->
        <div class="match-sets">${setsDetail}</div>

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

    // Délégation : suppression / afficher plus
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
