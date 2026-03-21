// 📄 Fichier : /js/views/view-edit-match.js
// 🎯 Rôle : Modal d'édition d'un match existant - layout visuel face-à-face

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

  _buildHTML(match, playerA, playerB) {
    const date    = new Date(match.timestamp);
    const dateStr = date.toISOString().slice(0, 16);
    const nameA   = Players.fullName(playerA);
    const nameB   = Players.fullName(playerB);
    const scoreA  = this._sets.filter(s => Number(s.a) > Number(s.b)).length;
    const scoreB  = this._sets.filter(s => Number(s.b) > Number(s.a)).length;

    return `
      <div class="em-header">
        <button class="modal-close" id="btn-edit-close">&times;</button>
      </div>

      <div class="em-body">

        <div class="em-date-block">
          <div class="em-date-label">Date &amp; heure</div>
          <input type="datetime-local" id="edit-datetime" class="em-date-input" value="${dateStr}">
        </div>

        <div class="em-players-row">
          <span class="em-player-name">${nameA}</span>
          <span class="em-player-name em-player-right">${nameB}</span>
        </div>

        <div class="em-format-row">
          <select id="edit-format" class="em-format-select">
            <option value="best1" ${this._format==='best1'?'selected':''}>Format : 1 set gagnant</option>
            <option value="best3" ${this._format==='best3'?'selected':''}>Format : Best of 3</option>
            <option value="best5" ${this._format==='best5'?'selected':''}>Format : Best of 5</option>
          </select>
        </div>

        <div id="edit-sets-list" class="em-sets-list">
          ${this._buildSetsHTML()}
        </div>

        <button class="btn btn-outline btn-sm em-add-set-btn" id="btn-add-set">+ Ajouter un set</button>

        <div class="em-score-final">
          <div class="em-score-number">${scoreA}</div>
          <div class="em-score-badge">SCORE</div>
          <div class="em-score-number">${scoreB}</div>
        </div>

      </div>

      <div class="em-footer">
        <span class="em-footer-title">✏️ Modifier le match</span>
        <div class="em-footer-actions">
          <button class="btn btn-outline" id="btn-edit-cancel">Annuler</button>
          <button class="btn btn-primary" id="btn-edit-save">💾 Sauvegarder</button>
        </div>
      </div>
    `;
  },

  _buildSetsHTML() {
    return this._sets.map((s, i) => `
      <div class="em-set-row" data-index="${i}">
        <input type="number" class="em-set-input set-input-a" value="${s.a}" min="0" data-index="${i}">
        <span class="em-set-label">Set ${i + 1}</span>
        <input type="number" class="em-set-input set-input-b" value="${s.b}" min="0" data-index="${i}">
        <button class="btn-remove-set" data-index="${i}" title="Supprimer">✕</button>
      </div>
    `).join('');
  },

  _refreshSets() {
    document.getElementById('edit-sets-list').innerHTML = this._buildSetsHTML();
    this._refreshScore();
    this._bindSetEvents();
  },

  _refreshScore() {
    const scoreA = this._sets.filter(s => Number(s.a) > Number(s.b)).length;
    const scoreB = this._sets.filter(s => Number(s.b) > Number(s.a)).length;
    const nums = document.querySelectorAll('.em-score-number');
    if (nums[0]) nums[0].textContent = scoreA;
    if (nums[1]) nums[1].textContent = scoreB;
  },

  _bindEvents(match) {
    document.getElementById('btn-edit-close').addEventListener('click', () => UI.closeModal());
    document.getElementById('btn-edit-cancel').addEventListener('click', () => UI.closeModal());

    document.getElementById('btn-add-set').addEventListener('click', () => {
      this._sets.push({ a: '', b: '' });
      this._refreshSets();
    });

    document.getElementById('edit-format').addEventListener('change', e => {
      this._format = e.target.value;
    });

    this._bindSetEvents();

    document.getElementById('btn-edit-save').addEventListener('click', () => {
      this._save(match);
    });
  },

  _bindSetEvents() {
    document.querySelectorAll('.set-input-a').forEach(input => {
      input.addEventListener('input', e => {
        const i = Number(e.target.dataset.index);
        this._sets[i].a = e.target.value;
        this._refreshScore();
      });
    });
    document.querySelectorAll('.set-input-b').forEach(input => {
      input.addEventListener('input', e => {
        const i = Number(e.target.dataset.index);
        this._sets[i].b = e.target.value;
        this._refreshScore();
      });
    });
    document.querySelectorAll('.btn-remove-set').forEach(btn => {
      btn.addEventListener('click', e => {
        const i = Number(e.target.dataset.index);
        this._sets.splice(i, 1);
        this._refreshSets();
      });
    });
  },

  _save(match) {
    const datetime = document.getElementById('edit-datetime').value;
    if (!datetime) { UI.toast('Date invalide.'); return; }

    const scoreA = this._sets.filter(s => Number(s.a) > Number(s.b)).length;
    const scoreB = this._sets.filter(s => Number(s.b) > Number(s.a)).length;

    Matches.update(match.id, {
      format:    this._format,
      sets:      this._sets.map(s => ({ a: Number(s.a), b: Number(s.b) })),
      setsA:     scoreA,
      setsB:     scoreB,
      winnerId:  scoreA > scoreB ? match.playerAId : match.playerBId,
      timestamp: new Date(datetime).getTime()
    });

    UI.closeModal();
    UI.toast('Match mis à jour ✅');

    // Rafraîchit la vue active quelle qu'elle soit
    App.refreshCurrentView();
  }

};
