// 📄 Fichier : /js/views/view-settings.js
// 🎯 Rôle : Gestion des événements et affichage de la vue Paramètres

const ViewSettings = {

  // Fichier sélectionné en attente de confirmation
  _pendingFile: null,

  /** Rendu principal de la vue */
  render() {
    document.getElementById('tab-settings').innerHTML = ViewSettingsHTML.main();
    this._bindEvents();
  },

  /** Attache tous les événements de la vue */
  _bindEvents() {
    this._bindExport();
    this._bindImport();
  },

  // ===== EXPORT =====

  /** Gère le clic sur "Exporter en JSON" */
  _bindExport() {
    document.getElementById('btn-export-json')
      .addEventListener('click', () => {
        ImportExport.exportJSON();
        UI.toast('✅ Export téléchargé !');
      });
  },

  // ===== IMPORT =====

  /** Gère la sélection de fichier et déclenche la confirmation */
  _bindImport() {
    const input = document.getElementById('input-import-json');

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      this._pendingFile = file;
      document.getElementById('import-file-name').textContent = file.name;

      // Modale de confirmation avant import
      UI.confirm(
        '📥 Confirmer l\'import',
        ViewSettingsHTML.importConfirm(file.name),
        () => this._executeImport(),
        'Importer',
        'btn-primary'
      );
    });
  },

  /** Lance l'import après confirmation */
  _executeImport() {
    if (!this._pendingFile) return;

    ImportExport.importJSON(
      this._pendingFile,
      (stats) => {
        this._pendingFile = null;
        UI.toast(`✅ Import réussi — ${stats.newPlayers} joueur(s), ${stats.newMatches} match(s) ajouté(s)`);
      },
      (errorMsg) => {
        this._pendingFile = null;
        UI.toast(`❌ Erreur : ${errorMsg}`);
      }
    );
  }

};
