// 📄 Fichier : /js/views/view-edit-match.js
// 🎯 Rôle : Modal d'édition d'un match existant - layout visuel amélioré

const ViewEditMatch = {

  _sets: [],
  _format: '',

  open(matchId) {
    const match = Matches.getById(matchId);
    if (!match) { UI.toast('Match introuvable.'); return; }

    const playerA = Players.findById(match.playerAId);
    const playerB = Players.findById(match.playerBId);
    if (!playerA || !playerB) { UI.toast('Joueur introuvable.'); return; }

    this._format = match.format || 'best3';
    this._sets   = this._normalizeSets(match.sets, match.setsA, match.setsB);

    UI.openModal(this._buildHTML(match, playerA, playerB));
    this._bindEvents(match);
  },

  _normalizeSets(sets, setsA, setsB) {
    if (Array.isArray(sets) && sets.length > 0 && typeof sets[0] === 'object') {
      return sets.map(s => ({ a: s.a ?? '', b: s.b ?? '' }));
    }
    const total = (setsA || 0) + (setsB || 0);
    const result = [];
    for (let i = 0; i < total; i++) result.push({ a: '', b: '' });
    return result.length > 0 ? result : [{ a: '', b: '' }];
  },

  /** Construit le HTML du modal avec le nouveau layout */
  _buildHTML(match, playerA, playerB) {
    const date    = new Date(match.timestamp);
    const dateStr = date.toISOString().slice(0, 16);
    const nameA   = Players.fullName(playerA);
    const nameB   = Players.fullName(playerB);

    return `
      <div class="modal-header edit-modal-header">
        <button class="modal-close" id="btn-edit-close">&times;</button>
      </div>
      <div class="modal-body edit-modal-body">

        <!-- DATE -->
        <div class="edit-date-block">
          <div class="edit-date-label">Date &amp; heure</div>
          <input type="datetime-local" id="edit-date" class="edit-date-input" value="${dateStr}">
        </div>

        <!-- NOMS JOUEURS -->
        <div class="edit-players-row">
          <span class="edit-player-name">${nameA}</span>
          <span class="edit-player-name edit-player-name--right">${nameB}</span>
        </div>

        <!-- FORMAT -->
        <div class="edit-format-row">
          <select id="edit-format" class="edit-format-select">
            ${Object.keys(CONFIG.FORMATS).map(f => `
              <option value="${f}" ${this._format === f ? 'selected' : ''}>
                ${CONFIG.FORMATS[f].label}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- SETS -->
        <div id="edit-sets-list" class="edit-sets-list">
          ${this._buildSetsHTML()}
        </div>

        <!-- BOUTON AJOUTER SET -->
        <button id="btn-edit-add-set" class="btn btn-outline btn-sm edit-add-set-btn">
          + Ajouter un set
        </button>

        <!-- SCORE FINAL -->
        <div class="edit-score-final" id="edit-score-final">
          ${this._buildScoreHTML()}
        </div>

      </div>

      <!-- FOOTER -->
      <div class="edit-modal-footer">
        <div class="edit-footer-title">✏️ Modifier le match</div>
        <div class="edit-footer-actions">
          <button class="btn btn-outline" id="btn-edit-cancel">Annuler</button>
          <button class="btn btn-primary" id="btn-edit-save">
            💾 Sauvegarder
          </button>
        </div>
      </div>
    `;
  },

  /** Génère les lignes de sets */
  _buildSetsHTML() {
    return this._sets.map((s, i) => `
      <div class="edit-set-row">
        <input
          type="number" min="0" max="99"
          class="edit-set-input"
          data-set="${i}" data-player="a"
          value="${s.a}"
          placeholder="—"
        >
        <span class="edit-set-label">Set ${i + 1}</span>
        <input
          type="number" min="0" max="99"
          class="edit-set-input"
          data-set="${i}" data-player="b"
          value="${s.b}"
          placeholder="—"
        >
        ${this._sets.length > 1
          ? `<button class="btn-remove-set" data-index="${i}" title="Supprimer">✕</button>`
          : ''}
      </div>
    `).join('');
  },

  /** Calcule et affiche le score final (sets gagnés) */
  _buildScoreHTML() {
    let setsA = 0, setsB = 0;
    this._sets.forEach(s => {
      const a = parseInt(s.a, 10);
      const b = parseInt(s.b, 10);
      if (!isNaN(a) && !isNaN(b) && a !== b) {
        if (a > b) setsA++; else setsB++;
      }
    });
    return `
      <div class="edit-score-number">${setsA}</div>
      <div class="edit-score-badge">SCORE</div>
      <div class="edit-score-number">${setsB}</div>
    `;
  },

  _refreshSetsList() {
    const container = document.getElementById('edit-sets-list');
    if (container) container.innerHTML = this._buildSetsHTML();
    this._bindSetEvents();
    this._refreshScore();
  },

  _refreshScore() {
    const el = document.getElementById('edit-score-final');
    if (el) el.innerHTML = this._buildScoreHTML();
  },

  _bindEvents(match) {
    // Fermer
    document.getElementById('btn-edit-close')?.addEventListener('click', () => UI.closeModal());
    document.getElementById('btn-edit-cancel')?.addEventListener('click', () => UI.closeModal());

    // Format
    document.getElementById('edit-format')?.addEventListener('change', e => {
      this._format = e.target.value;
      this._adjustSetsToFormat();
      this._refreshSetsList();
    });

    // Ajouter set
    document.getElementById('btn-edit-add-set')?.addEventListener('click', () => {
      const fmt = CONFIG.FORMATS[this._format];
      if (this._sets.length >= fmt.maxSets) {
        UI.toast(`Maximum ${fmt.maxSets} sets pour ce format.`); return;
      }
      this._sets.push({ a: '', b: '' });
      this._refreshSetsList();
    });

    // Sauvegarder
    document.getElementById('btn-edit-save')?.addEventListener('click', () => {
      this._save(match);
    });

    this._bindSetEvents();
  },

  _bindSetEvents() {
    // Saisie scores
    document.querySelectorAll('.edit-set-input').forEach(input => {
      input.addEventListener('input', e => {
        const i      = parseInt(e.target.dataset.set, 10);
        const player = e.target.dataset.player;
        this._sets[i][player] = e.target.value;
        this._refreshScore();
      });
    });

    // Supprimer set
    document.querySelectorAll('.btn-remove-set').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.target.dataset.index, 10);
        if (this._sets.length <= 1) { UI.toast('Il faut au moins un set.'); return; }
        this._sets.splice(idx, 1);
        this._refreshSetsList();
      });
    });
  },

  _adjustSetsToFormat() {
    const fmt = CONFIG.FORMATS[this._format];
    if (this._sets.length > fmt.maxSets) this._sets = this._sets.slice(0, fmt.maxSets);
    if (this._sets.length === 0) this._sets.push({ a: '', b: '' });
  },

  _save(match) {
    const format  = this._format;
    const fmt     = CONFIG.FORMATS[format];
    const dateVal = document.getElementById('edit-date')?.value;

    if (!dateVal) { UI.toast('Date invalide.'); return; }

    const allFilled = this._sets.every(s => s.a !== '' && s.b !== '');
    if (!allFilled) { UI.toast('Remplis tous les scores de sets.'); return; }

    const hasDrawSet = this._sets.some(s => parseInt(s.a, 10) === parseInt(s.b, 10));
    if (hasDrawSet) { UI.toast('Un set ne peut pas être à égalité.'); return; }

    let setsA = 0, setsB = 0;
    this._sets.forEach(s => {
      if (parseInt(s.a, 10) > parseInt(s.b, 10)) setsA++; else setsB++;
    });

    if (setsA !== fmt.setsToWin && setsB !== fmt.setsToWin) {
      UI.toast(`Le gagnant doit avoir exactement ${fmt.setsToWin} set(s) gagnés.`); return;
    }
    if (setsA === setsB) { UI.toast('Match nul impossible.'); return; }

    const timestamp     = new Date(dateVal).getTime();
    const winnerId      = setsA > setsB ? match.playerAId : match.playerBId;
    const setsNormalized = this._sets.map(s => ({
      a: parseInt(s.a, 10),
      b: parseInt(s.b, 10)
    }));

    Matches.update(match.id, { format, sets: setsNormalized, setsA, setsB, winnerId, timestamp });
    UI.closeModal();
    UI.toast('Match modifié ✅');
    if (typeof ViewHistory !== 'undefined') ViewHistory._refreshList();
  }
};
