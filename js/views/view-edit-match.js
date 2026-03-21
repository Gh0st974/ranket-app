// 📄 Fichier : /js/views/view-edit-match.js
// 🎯 Rôle : Modal d'édition d'un match existant

const ViewEditMatch = {

  /** Ouvre le modal d'édition pour un match donné */
  open(matchId) {
    const match = Matches.getById(matchId);
    if (!match) { UI.toast('Match introuvable.'); return; }

    const playerA = Players.getById(match.playerAId);
    const playerB = Players.getById(match.playerBId);
    if (!playerA || !playerB) { UI.toast('Joueur introuvable.'); return; }

    UI.openModal(this._buildHTML(match, playerA, playerB));
    this._bindEvents(match);
  },

  /** Construit le HTML du modal */
  _buildHTML(match, playerA, playerB) {
    const formats = Object.keys(CONFIG.FORMATS);
    const date = new Date(match.timestamp);
    const dateStr = date.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"

    return `
      <div class="modal-header">
        <h3>✏️ Modifier le match</h3>
        <button class="modal-close" id="btn-edit-close">&times;</button>
      </div>
      <div class="modal-body">
        <p class="edit-players-label">
          <strong>${Players.fullName(playerA)}</strong> vs <strong>${Players.fullName(playerB)}</strong>
        </p>

        <!-- Format -->
        <div class="form-group">
          <label for="edit-format">Format</label>
          <select id="edit-format">
            ${formats.map(f =>
              `<option value="${f}" ${match.format === f ? 'selected' : ''}>${f}</option>`
            ).join('')}
          </select>
        </div>

        <!-- Score sets -->
        <div class="form-group">
          <label>Score (sets)</label>
          <div class="edit-score-row">
            <span>${Players.fullName(playerA)}</span>
            <input type="number" id="edit-sets-a" min="0" max="5"
              value="${match.setsA}" class="score-input" />
            <span>–</span>
            <input type="number" id="edit-sets-b" min="0" max="5"
              value="${match.setsB}" class="score-input" />
            <span>${Players.fullName(playerB)}</span>
          </div>
        </div>

        <!-- Date -->
        <div class="form-group">
          <label for="edit-date">Date & heure</label>
          <input type="datetime-local" id="edit-date" value="${dateStr}" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="btn-edit-cancel">Annuler</button>
        <button class="btn btn-primary"   id="btn-edit-save">💾 Sauvegarder</button>
      </div>
    `;
  },

  /** Attache les événements du modal */
  _bindEvents(match) {
    document.getElementById('btn-edit-close')?.addEventListener('click', () => UI.closeModal());
    document.getElementById('btn-edit-cancel')?.addEventListener('click', () => UI.closeModal());

    document.getElementById('btn-edit-save')?.addEventListener('click', () => {
      const format = document.getElementById('edit-format').value;
      const setsA  = parseInt(document.getElementById('edit-sets-a').value, 10);
      const setsB  = parseInt(document.getElementById('edit-sets-b').value, 10);
      const dateVal = document.getElementById('edit-date').value;

      // Validation
      if (isNaN(setsA) || isNaN(setsB) || setsA < 0 || setsB < 0) {
        UI.toast('Score invalide.'); return;
      }
      if (setsA === setsB) {
        UI.toast('Un match ne peut pas se terminer par un égalité.'); return;
      }
      if (!dateVal) {
        UI.toast('Date invalide.'); return;
      }

      const timestamp = new Date(dateVal).getTime();
      const winnerId  = setsA > setsB ? match.playerAId : match.playerBId;

      Matches.update(match.id, {
        format,
        setsA,
        setsB,
        sets:      `${setsA}-${setsB}`,
        winnerId,
        timestamp
      });

      UI.closeModal();
      UI.toast('Match modifié ✅');

      // Rafraîchir la vue historique si active
      if (typeof ViewHistory !== 'undefined') ViewHistory._refreshList();
    });
  }

};
