// 📄 Fichier : /js/views/view-edit-match.js
// 🎯 Rôle : Modal d'édition d'un match existant

const ViewEditMatch = {

  _sets: [],      // Tableau des scores par set [{a, b}, ...]
  _format: '',    // Format sélectionné

  /** Ouvre le modal d'édition pour un match donné */
  open(matchId) {
    const match = Matches.getById(matchId);
    if (!match) { UI.toast('Match introuvable.'); return; }

    const playerA = Players.findById(match.playerAId);
    const playerB = Players.findById(match.playerBId);
    if (!playerA || !playerB) { UI.toast('Joueur introuvable.'); return; }

    // Initialise les sets depuis le match existant
    // match.sets peut être un tableau [{a,b}] ou une string "2-1" (legacy)
    this._format = match.format || 'best3';
    this._sets   = this._normalizeSets(match.sets, match.setsA, match.setsB);

    UI.openModal(this._buildHTML(match, playerA, playerB));
    this._bindEvents(match);
  },

  /**
   * Normalise match.sets en tableau [{a, b}]
   * Gère l'ancien format string "2-1" et le nouveau tableau
   */
  _normalizeSets(sets, setsA, setsB) {
    if (Array.isArray(sets) && sets.length > 0 && typeof sets[0] === 'object') {
      return sets.map(s => ({ a: s.a ?? 0, b: s.b ?? 0 }));
    }
    // Legacy : on reconstitue des sets fictifs (11-x ou x-11)
    const result = [];
    const total = (setsA || 0) + (setsB || 0);
    for (let i = 0; i < total; i++) {
      // On ne connaît pas les vrais scores point par point → placeholder
      result.push({ a: '', b: '' });
    }
    return result.length > 0 ? result : [{ a: '', b: '' }];
  },

  /** Construit le HTML du modal */
  _buildHTML(match, playerA, playerB) {
    const formats  = Object.keys(CONFIG.FORMATS);
    const date     = new Date(match.timestamp);
    const dateStr  = date.toISOString().slice(0, 16);
    const nameA    = Players.fullName(playerA);
    const nameB    = Players.fullName(playerB);

    return `
      <div class="modal-header">
        <h3>✏️ Modifier le match</h3>
        <button class="modal-close" id="btn-edit-close">&times;</button>
      </div>
      <div class="modal-body">

        <p class="edit-players-label">
          <strong>${nameA}</strong> vs <strong>${nameB}</strong>
        </p>

        <!-- Format -->
        <div class="form-group">
          <label for="edit-format">Format</label>
          <select id="edit-format">
            ${formats.map(f => `
              <option value="${f}" ${this._format === f ? 'selected' : ''}>
                ${CONFIG.FORMATS[f].label}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Sets -->
        <div class="form-group">
          <label>Scores par set</label>
          <div class="sets-header">
            <span class="sets-player-label">${nameA}</span>
            <span></span>
            <span class="sets-player-label">${nameB}</span>
          </div>
          <div id="edit-sets-list">
            ${this._buildSetsHTML()}
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-edit-add-set">
            + Ajouter un set
          </button>
        </div>

        <!-- Date -->
        <div class="form-group">
          <label for="edit-date">Date &amp; heure</label>
          <input type="datetime-local" id="edit-date" value="${dateStr}" />
        </div>

      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="btn-edit-cancel">Annuler</button>
        <button class="btn btn-primary"   id="btn-edit-save">💾 Sauvegarder</button>
      </div>
    `;
  },

  /** Génère le HTML de tous les sets */
  _buildSetsHTML() {
    return this._sets.map((s, i) => this._buildSetRow(i, s.a, s.b)).join('');
  },

  /** Génère une ligne de set */
  _buildSetRow(index, valA = '', valB = '') {
    return `
      <div class="set-row" data-set="${index}">
        <input type="number" class="score-input set-input-a" min="0" max="99"
          data-index="${index}" data-player="a" value="${valA}" placeholder="0" />
        <span class="score-separator">–</span>
        <input type="number" class="score-input set-input-b" min="0" max="99"
          data-index="${index}" data-player="b" value="${valB}" placeholder="0" />
        <button type="button" class="btn-remove-set" data-index="${index}" title="Supprimer ce set">✕</button>
      </div>
    `;
  },

  /** Rafraîchit uniquement la liste des sets dans le DOM */
  _refreshSetsList() {
    const container = document.getElementById('edit-sets-list');
    if (container) {
      container.innerHTML = this._buildSetsHTML();
      this._bindSetsEvents();
    }
  },

  /** Attache les événements du modal */
  _bindEvents(match) {
    document.getElementById('btn-edit-close')?.addEventListener('click',  () => UI.closeModal());
    document.getElementById('btn-edit-cancel')?.addEventListener('click', () => UI.closeModal());

    // Changement de format → ajuste le nombre de sets
    document.getElementById('edit-format')?.addEventListener('change', (e) => {
      this._format = e.target.value;
      this._adjustSetsToFormat();
      this._refreshSetsList();
    });

    // Ajouter un set
    document.getElementById('btn-edit-add-set')?.addEventListener('click', () => {
      const fmt = CONFIG.FORMATS[this._format];
      if (this._sets.length >= fmt.maxSets) {
        UI.toast(`Maximum ${fmt.maxSets} sets pour ce format.`);
        return;
      }
      this._sets.push({ a: '', b: '' });
      this._refreshSetsList();
    });

    // Événements sur les inputs de sets
    this._bindSetsEvents();

    // Sauvegarde
    document.getElementById('btn-edit-save')?.addEventListener('click', () => {
      this._save(match);
    });
  },

  /** Attache les événements sur les inputs et boutons de sets */
  _bindSetsEvents() {
    // Mise à jour des valeurs en mémoire à chaque saisie
    document.querySelectorAll('.set-input-a, .set-input-b').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx    = parseInt(e.target.dataset.index, 10);
        const player = e.target.dataset.player;
        const val    = e.target.value === '' ? '' : parseInt(e.target.value, 10);
        this._sets[idx][player] = val;
      });
    });

    // Suppression d'un set
    document.querySelectorAll('.btn-remove-set').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        if (this._sets.length <= 1) {
          UI.toast('Il faut au moins un set.');
          return;
        }
        this._sets.splice(idx, 1);
        this._refreshSetsList();
      });
    });
  },

  /**
   * Ajuste le tableau _sets au format sélectionné
   * - Tronque si trop de sets
   * - Ajoute un set vide si vide
   */
  _adjustSetsToFormat() {
    const fmt = CONFIG.FORMATS[this._format];
    if (this._sets.length > fmt.maxSets) {
      this._sets = this._sets.slice(0, fmt.maxSets);
    }
    if (this._sets.length === 0) {
      this._sets.push({ a: '', b: '' });
    }
  },

  /** Valide et sauvegarde le match modifié */
  _save(match) {
    const format   = this._format;
    const fmt      = CONFIG.FORMATS[format];
    const dateVal  = document.getElementById('edit-date')?.value;

    // Validation date
    if (!dateVal) { UI.toast('Date invalide.'); return; }

    // Validation sets : tous les champs doivent être remplis
    const allFilled = this._sets.every(s => s.a !== '' && s.b !== '');
    if (!allFilled) { UI.toast('Remplis tous les scores de sets.'); return; }

    // Validation : pas d'égalité par set
    const hasDrawSet = this._sets.some(s => parseInt(s.a, 10) === parseInt(s.b, 10));
    if (hasDrawSet) { UI.toast('Un set ne peut pas être nul-nul ou à égalité.'); return; }

    // Compte les sets gagnés
    let setsA = 0, setsB = 0;
    this._sets.forEach(s => {
      if (parseInt(s.a, 10) > parseInt(s.b, 10)) setsA++;
      else setsB++;
    });

    // Validation format
    const maxWins = fmt.setsToWin;
    if (setsA !== maxWins && setsB !== maxWins) {
      UI.toast(`Le gagnant doit avoir exactement ${maxWins} set(s) gagnés.`);
      return;
    }
    if (setsA === setsB) { UI.toast('Match nul impossible.'); return; }

    const timestamp = new Date(dateVal).getTime();
    const winnerId  = setsA > setsB ? match.playerAId : match.playerBId;

    // Normalise les sets en entiers
    const setsNormalized = this._sets.map(s => ({
      a: parseInt(s.a, 10),
      b: parseInt(s.b, 10)
    }));

    Matches.update(match.id, {
      format,
      sets: setsNormalized,
      setsA,
      setsB,
      winnerId,
      timestamp
    });

    UI.closeModal();
    UI.toast('Match modifié ✅');

    if (typeof ViewHistory !== 'undefined') ViewHistory._refreshList();
  }

};
