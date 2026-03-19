// 📄 Fichier : /js/views/view-match.js
// 🎯 Rôle : Affichage et interactions de la vue "Saisir un match"

const ViewMatch = {

  _format: 'best3',  // Format sélectionné par défaut
  _sets: [{ a: '', b: '' }],  // Sets saisis

  /** Point d'entrée */
  render() {
    this._format = 'best3';
    this._sets   = [{ a: '', b: '' }];
    UI.render('#app-main', this._buildHTML());
    this._bindEvents();
    this._updateProba();
    this._updateFinalScore();
  },

  _buildHTML() {
    const players = Players.getAll();
    return `
      <h2 class="view-title">Saisir un match</h2>

      <!-- Format -->
      <div class="section-label">Format</div>
      <div class="format-selector">
        ${Object.entries(CONFIG.FORMATS).map(([key, f]) => `
          <button class="format-btn ${key === this._format ? 'active' : ''}"
                  data-format="${key}">${f.label}</button>
        `).join('')}
      </div>

      <!-- Joueurs -->
      <div class="vs-container">
        <div class="player-select-block">
          <label>Joueur A</label>
          <select id="select-player-a">
            <option value="">— Choisir —</option>
            ${players.map(p => `<option value="${p.id}">${Players.fullName(p)}</option>`).join('')}
          </select>
        </div>
        <div class="vs-label">VS</div>
        <div class="player-select-block">
          <label>Joueur B</label>
          <select id="select-player-b">
            <option value="">— Choisir —</option>
            ${players.map(p => `<option value="${p.id}">${Players.fullName(p)}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- ELO + Probabilité -->
      <div class="elo-proba-row" id="elo-proba-row">
        <span id="elo-a-display">ELO : —</span>
        <span id="proba-display">probabilité de victoire</span>
        <span id="elo-b-display">ELO : —</span>
      </div>

      <!-- Sets -->
      <div class="sets-section">
        <h3>Sets</h3>
        <div id="sets-container">
          ${this._buildSetsHTML()}
        </div>
        <button class="btn btn-secondary" id="btn-add-set" style="margin-top:8px;">+ Ajouter un set</button>
      </div>

      <!-- Score final -->
      <div class="final-score-block">
        <div class="final-score-title">⚡ SCORE FINAL</div>
        <div class="final-score-display" id="final-score-display">
          <span id="final-name-a">—</span>
          <span class="final-score-number" id="final-score-a">0</span>
          <span>—</span>
          <span class="final-score-number" id="final-score-b">0</span>
          <span id="final-name-b">—</span>
        </div>
      </div>

      <!-- Bouton enregistrer -->
      <button class="btn btn-primary btn-full" id="btn-save-match">✔ Enregistrer le match</button>
    `;
  },

  /** Construit le HTML des lignes de sets */
  _buildSetsHTML() {
    return this._sets.map((s, i) => `
      <div class="set-row" data-index="${i}">
        <label>Set ${i + 1}</label>
        <input type="number" class="set-input" data-player="a" data-index="${i}"
               value="${s.a}" min="0" placeholder="0">
        <span class="set-separator">—</span>
        <input type="number" class="set-input" data-player="b" data-index="${i}"
               value="${s.b}" min="0" placeholder="0">
        <button class="set-delete-btn" data-index="${i}">✕</button>
      </div>
    `).join('');
  },
  /** Attache tous les événements de la vue */
  _bindEvents() {

    // --- Format ---
    document.querySelectorAll('.format-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._format = btn.dataset.format;
        document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._updateFinalScore();
      });
    });

    // --- Sélection joueurs ---
    document.getElementById('select-player-a').addEventListener('change', () => {
      this._updateProba();
      this._updateFinalScore();
    });
    document.getElementById('select-player-b').addEventListener('change', () => {
      this._updateProba();
      this._updateFinalScore();
    });

    // --- Inputs sets ---
    document.getElementById('sets-container').addEventListener('input', (e) => {
      if (e.target.classList.contains('set-input')) {
        const i      = parseInt(e.target.dataset.index);
        const player = e.target.dataset.player;
        this._sets[i][player] = parseInt(e.target.value) || 0;
        this._updateFinalScore();
      }
    });

    // --- Supprimer un set ---
    document.getElementById('sets-container').addEventListener('click', (e) => {
      if (e.target.classList.contains('set-delete-btn')) {
        const i = parseInt(e.target.dataset.index);
        if (this._sets.length > 1) {
          this._sets.splice(i, 1);
          this._refreshSets();
          this._updateFinalScore();
        }
      }
    });

    // --- Ajouter un set ---
    document.getElementById('btn-add-set').addEventListener('click', () => {
      const maxSets = CONFIG.FORMATS[this._format].maxSets;
      if (this._sets.length < maxSets) {
        this._sets.push({ a: 0, b: 0 });
        this._refreshSets();
      } else {
        UI.toast(`Maximum ${maxSets} sets pour ce format.`);
      }
    });

    // --- Enregistrer le match ---
    document.getElementById('btn-save-match').addEventListener('click', () => {
      this._saveMatch();
    });
  },

  /** Met à jour l'affichage ELO et probabilité de victoire */
  _updateProba() {
    const idA = document.getElementById('select-player-a').value;
    const idB = document.getElementById('select-player-b').value;

    const eloAEl   = document.getElementById('elo-a-display');
    const eloBEl   = document.getElementById('elo-b-display');
    const probaEl  = document.getElementById('proba-display');

    if (!idA || !idB || idA === idB) {
      eloAEl.textContent  = idA ? `ELO : ${Players.findById(idA)?.elo}` : 'ELO : —';
      eloBEl.textContent  = idB ? `ELO : ${Players.findById(idB)?.elo}` : 'ELO : —';
      probaEl.innerHTML   = 'probabilité de victoire';
      return;
    }

    const playerA = Players.findById(idA);
    const playerB = Players.findById(idB);

    const probaA = Elo.winProbability(playerA.elo, playerB.elo);
    const probaB = Math.round((1 - probaA / 100) * 100);

    eloAEl.textContent = `ELO : ${playerA.elo}`;
    eloBEl.textContent = `ELO : ${playerB.elo}`;
    probaEl.innerHTML  =
      `<span class="proba-highlight">${probaA}%</span> — <span class="proba-highlight">${probaB}%</span>`;
  },

  /** Met à jour le score final affiché en temps réel */
  _updateFinalScore() {
    const idA = document.getElementById('select-player-a').value;
    const idB = document.getElementById('select-player-b').value;

    const nameA = idA ? Players.fullName(Players.findById(idA)) : '—';
    const nameB = idB ? Players.fullName(Players.findById(idB)) : '—';

    let setsA = 0, setsB = 0;
    this._sets.forEach(s => {
      const a = parseInt(s.a) || 0;
      const b = parseInt(s.b) || 0;
      if (a > b) setsA++;
      else if (b > a) setsB++;
    });

    document.getElementById('final-name-a').textContent  = nameA;
    document.getElementById('final-name-b').textContent  = nameB;
    document.getElementById('final-score-a').textContent = setsA;
    document.getElementById('final-score-b').textContent = setsB;
  },

  /** Rafraîchit uniquement la zone des sets */
  _refreshSets() {
    const container = document.getElementById('sets-container');
    if (container) container.innerHTML = this._buildSetsHTML();
  },

  /** Valide et enregistre le match */
  _saveMatch() {
    const idA = document.getElementById('select-player-a').value;
    const idB = document.getElementById('select-player-b').value;

    // Validations
    if (!idA || !idB) {
      UI.toast('⚠️ Sélectionne les deux joueurs.'); return;
    }
    if (idA === idB) {
      UI.toast('⚠️ Les deux joueurs doivent être différents.'); return;
    }

    // Vérification que les sets sont renseignés
    const validSets = this._sets.filter(s => s.a !== '' && s.b !== '');
    if (validSets.length === 0) {
      UI.toast('⚠️ Saisis au moins un score de set.'); return;
    }

    // Vérification du format
    const fmt     = CONFIG.FORMATS[this._format];
    let setsA = 0, setsB = 0;
    validSets.forEach(s => {
      if (parseInt(s.a) > parseInt(s.b)) setsA++;
      else if (parseInt(s.b) > parseInt(s.a)) setsB++;
    });

    if (setsA < fmt.setsToWin && setsB < fmt.setsToWin) {
      UI.toast(`⚠️ Le format ${fmt.label} requiert ${fmt.setsToWin} set(s) gagnant(s).`); return;
    }

    // Enregistrement
    const match = Matches.add(idA, idB, this._format, validSets);
    if (match) {
      UI.toast('✅ Match enregistré !');
      // Réinitialise la vue après 1 seconde
      setTimeout(() => this.render(), 1000);
    } else {
      UI.toast('❌ Erreur lors de l\'enregistrement.');
    }
  }
};
