// 📄 Fichier : /js/views/view-ranking.js
// 🎯 Rôle : Affichage et interactions de la vue "Classement général"

const ViewRanking = {

  // Nombre de joueurs actuellement affichés
  _displayCount: CONFIG.ITEMS_PER_PAGE,
  // Mode sélection actif ?
  _selectMode: false,

  /** Point d'entrée — rend la vue complète */
  render() {
    this._displayCount = CONFIG.ITEMS_PER_PAGE;
    this._selectMode   = false;
    UI.render('#app-main', this._buildHTML());
    this._bindEvents();
  },

  /** Construit le HTML de la vue */
  _buildHTML() {
    const players = Ranking.getSorted();
    return `
      <h2 class="view-title">Classement général</h2>
      <div class="toolbar">
        <button class="btn btn-secondary" id="btn-select-ranking">✔ Sélectionner</button>
        <button class="btn btn-secondary" id="btn-clear-all-ranking">✖ Tout effacer</button>
      </div>
      <div id="ranking-table-container">
        ${this._buildTable(players)}
      </div>
    `;
  },

  /** Construit le tableau de classement */
  _buildTable(players) {
    if (players.length === 0) {
      return '<div class="empty-state">🏓 Aucun joueur enregistré</div>';
    }

    const visible  = players.slice(0, this._displayCount);
    const hasMore  = players.length > this._displayCount;

    const rows = visible.map(p => this._buildRow(p)).join('');

    const showMoreBtn = hasMore ? `
      <div class="show-more-btn">
        <button id="btn-show-more-ranking">⌄ Afficher plus</button>
      </div>` : '';

    return `
      <table class="ranking-table">
        <thead>
          <tr>
            <th>#</th>
            <th>JOUEUR</th>
            <th>ELO</th>
            <th>MATCHS</th>
            <th>V</th>
            <th>D</th>
            <th>RATIO</th>
            ${this._selectMode ? '<th></th>' : ''}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${showMoreBtn}
    `;
  },

  /** Construit une ligne de joueur */
  _buildRow(player) {
    const medal     = Ranking.getMedalEmoji(player.rank);
    const streak    = Ranking.hasStreak(player) ? '<span class="streak-icon">🔥</span>' : '';
    const ratioCls  = Ranking.getRatioClass(player.ratio);
    const checkbox  = this._selectMode
      ? `<td><input type="checkbox" class="select-checkbox ranking-check" data-id="${player.id}"></td>`
      : '';

    return `
      <tr>
        <td class="rank-cell">${medal}</td>
        <td>
          <div class="player-name-cell">
            ${Players.fullName(player)} ${streak}
          </div>
        </td>
        <td class="elo-cell">${player.elo}</td>
        <td>${player.matches}</td>
        <td class="wins-cell">${player.wins}</td>
        <td class="losses-cell">${player.losses}</td>
        <td><span class="ratio-badge ${ratioCls}">${player.ratio}%</span></td>
        ${checkbox}
      </tr>
    `;
  },

  /** Attache les événements de la vue */
  _bindEvents() {
    // Bouton sélectionner
    document.getElementById('btn-select-ranking')?.addEventListener('click', () => {
      this._selectMode = !this._selectMode;
      this._refreshTable();
    });

    // Bouton tout effacer
    document.getElementById('btn-clear-all-ranking')?.addEventListener('click', () => {
      const checked = this._selectMode
        ? [...document.querySelectorAll('.ranking-check:checked')].map(el => el.dataset.id)
        : null;

      if (this._selectMode && checked && checked.length > 0) {
        UI.confirm(
          'Supprimer les joueurs sélectionnés ?',
          `${checked.length} joueur(s) seront supprimés définitivement.`,
          () => { Players.removeMany(checked); this.render(); },
          'Supprimer', 'btn-danger'
        );
      } else if (!this._selectMode) {
        UI.confirm(
          'Effacer tout le classement ?',
          'Tous les joueurs et leurs données seront supprimés.',
          () => { Storage.clearAll(); this.render(); },
          'Tout effacer', 'btn-danger'
        );
      }
    });

    // Afficher plus
    document.getElementById('btn-show-more-ranking')?.addEventListener('click', () => {
      this._displayCount += CONFIG.ITEMS_PER_PAGE;
      this._refreshTable();
    });
  },

  /** Rafraîchit uniquement le tableau (sans reconstruire toute la vue) */
  _refreshTable() {
    const players   = Ranking.getSorted();
    const container = document.getElementById('ranking-table-container');
    if (container) container.innerHTML = this._buildTable(players);

    // Re-bind événements dynamiques
    document.getElementById('btn-show-more-ranking')?.addEventListener('click', () => {
      this._displayCount += CONFIG.ITEMS_PER_PAGE;
      this._refreshTable();
    });
  }
};
