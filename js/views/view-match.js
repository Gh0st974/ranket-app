// 📄 Fichier : /js/views/view-match.js
// 🎯 Rôle : Orchestration et événements de la vue "Saisir un match"

const ViewMatch = {

  _format: 'best3',
  _sets: [{ a: '', b: '' }],

  /** Point d'entrée */
  render() {
    this._format = 'best3';
    this._sets   = [{ a: '', b: '' }];
    UI.render('#app-main', ViewMatchHTML.build(this._format, this._sets));
    this._bindEvents();
    ViewMatchLogic.updateProba();
    ViewMatchLogic.updateFinalScore(this._sets);
  },

  /** Attache tous les événements */
  _bindEvents() {

    // Format
    document.querySelectorAll('.format-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._format = btn.dataset.format;
        document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Sélection joueurs
    ['select-player-a', 'select-player-b'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => {
        ViewMatchLogic.updateProba();
        ViewMatchLogic.updateFinalScore(this._sets);
      });
    });

    // Saisie des sets (délégation)
    document.getElementById('sets-container')?.addEventListener('input', e => {
      if (!e.target.matches('.set-input')) return;
      const i      = parseInt(e.target.dataset.set);
      const player = e.target.dataset.player;
      this._sets[i][player] = e.target.value;
      ViewMatchLogic.updateFinalScore(this._sets);
    });

    // Supprimer un set (délégation)
    document.getElementById('sets-container')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-remove]');
      if (!btn) return;
      const i = parseInt(btn.dataset.remove);
      if (this._sets.length > 1) {
        this._sets.splice(i, 1);
        this._refreshSets();
        ViewMatchLogic.updateFinalScore(this._sets);
      }
    });

    // Ajouter un set
    document.getElementById('btn-add-set')?.addEventListener('click', () => {
      const fmt = CONFIG.FORMATS[this._format];
      if (this._sets.length >= fmt.maxSets) {
        UI.toast(`⚠️ Maximum ${fmt.maxSets} sets pour ce format.`); return;
      }
      this._sets.push({ a: '', b: '' });
      this._refreshSets();
    });

    // Enregistrer
    document.getElementById('btn-save-match')?.addEventListener('click', () => {
      ViewMatchLogic.saveMatch(this._format, this._sets, () => this.render());
    });
  },

  /** Rafraîchit uniquement la zone des sets */
  _refreshSets() {
    const container = document.getElementById('sets-container');
    if (container) container.innerHTML = ViewMatchHTML.buildSets(this._sets);
  }
};
