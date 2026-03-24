// 📄 Fichier : /js/views/view-settings.html.js
// 🎯 Rôle : Templates HTML de la vue Paramètres

const ViewSettingsHTML = {

  /** Template principal de la vue Paramètres */
  main() {
    return `
      <div class="settings-container">
        <h2 class="settings-title">⚙️ Paramètres</h2>

        <!-- SECTION EXPORT -->
        <div class="settings-section">
          <h3 class="settings-section-title">📤 Exporter les données</h3>
          <p class="settings-section-desc">
            Télécharge une sauvegarde complète de tes joueurs et matchs au format JSON.
          </p>
          <button class="btn btn-primary" id="btn-export-json">
            💾 Exporter en JSON
          </button>
        </div>

        <!-- SECTION IMPORT -->
        <div class="settings-section">
          <h3 class="settings-section-title">📥 Importer des données</h3>
          <p class="settings-section-desc">
            Importe un fichier JSON Ranket. Les joueurs et matchs inconnus seront ajoutés.
            Les doublons seront ignorés. L'ELO sera entièrement recalculé.
          </p>
          <label class="btn btn-secondary" for="input-import-json">
            📂 Choisir un fichier JSON
          </label>
          <input
            type="file"
            id="input-import-json"
            accept=".json"
            style="display:none;"
          />
          <p class="settings-file-hint" id="import-file-name">Aucun fichier sélectionné</p>
        </div>

        <!-- SECTION ZONE DANGEREUSE -->
        <div class="settings-section">
          <h3 class="settings-section-title">⚠️ Zone dangereuse</h3>
          <p class="settings-section-desc">
            Ces actions sont irréversibles. Utilise-les avec précaution.
          </p>
          <div class="danger-zone">
            <div class="danger-zone-buttons">
              <button class="btn btn-warning" id="btn-reset-elo">🔄 Remettre les ELO à zéro</button>
              <button class="btn btn-danger"  id="btn-clear-all">🗑 Tout supprimer</button>
            </div>
          </div>
        </div>

      </div>
    `;
  },

  /**
   * Contenu de la modale de confirmation d'import
   * @param {string} fileName
   */
  importConfirm(fileName) {
    return `
      <strong>Fichier :</strong> ${fileName}<br><br>
      Les données seront fusionnées avec l'existant.<br>
      Les doublons seront ignorés.<br>
      L'ELO sera entièrement recalculé.
    `;
  }

};
