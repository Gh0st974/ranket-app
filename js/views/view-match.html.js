// 📄 Fichier : /js/views/view-match.html.js
// 🎯 Rôle : Construction du HTML de la vue "Saisir un match"

const ViewMatchHTML = {

  /** HTML complet de la vue */
  build(format, sets) {
    const players = Players.getAll();
    return `
      <h2 class="view-title">Saisir un match</h2>

      <!-- Format -->
      <div class="section-label">Format</div>
      <div class="format-selector">
        ${Object.entries(CONFIG.FORMATS).map(([key, f]) => `
          <button class="format-btn ${key === format ? 'active' : ''}"
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
          ${this.buildSets(sets)}
        </div>
        <button class="btn-add-set" id="btn-add-set">+ Ajouter un set</button>
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
      <div class="submit-block">
        <button class="btn btn-primary btn-full" id="btn-save-match">
          ✅ Enregistrer le match
        </button>
      </div>
    `;
  },

  /** HTML des lignes de sets */
  buildSets(sets) {
    return sets.map((s, i) => `
      <div class="set-row">
        <span class="set-label">Set ${i + 1}</span>
        <input class="set-input" type="number" min="0"
               data-set="${i}" data-player="a"
               value="${s.a}" placeholder="0" />
        <span class="set-separator">—</span>
        <input class="set-input" type="number" min="0"
               data-set="${i}" data-player="b"
               value="${s.b}" placeholder="0" />
        <button class="set-delete-btn" data-remove="${i}">✕</button>
      </div>
    `).join('');
  }
};
