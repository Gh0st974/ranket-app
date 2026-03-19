// 📄 Fichier : /js/ui.js
// 🎯 Rôle : Fonctions utilitaires partagées pour la manipulation du DOM

const UI = {

  // ===== TOAST =====

  /** Affiche un message toast temporaire */
  toast(message, duration = 2800) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), duration);
  },

  // ===== MODAL =====

  /**
   * Affiche une modale de confirmation
   * @param {string}   title     - Titre de la modale
   * @param {string}   message   - Message affiché
   * @param {Function} onConfirm - Callback si l'utilisateur confirme
   * @param {string}   confirmLabel - Texte du bouton de confirmation
   * @param {string}   confirmClass - Classe CSS du bouton
   */
  confirm(title, message, onConfirm, confirmLabel = 'Confirmer', confirmClass = 'btn-danger') {
    const overlay = document.getElementById('modal-overlay');
    const box     = document.getElementById('modal-box');

    box.innerHTML = `
      <div class="modal-title">${title}</div>
      <p style="font-size:0.88rem; color:#555; line-height:1.5;">${message}</p>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="modal-cancel">Annuler</button>
        <button class="btn ${confirmClass}" id="modal-confirm">${confirmLabel}</button>
      </div>
    `;

    overlay.style.display = 'flex';

    document.getElementById('modal-cancel').onclick  = () => this.closeModal();
    document.getElementById('modal-confirm').onclick = () => {
      this.closeModal();
      onConfirm();
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) this.closeModal();
    };
  },

  /** Ferme la modale */
  closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
  },

  /**
   * Affiche une modale avec du contenu HTML personnalisé
   */
  openModal(htmlContent) {
    const overlay = document.getElementById('modal-overlay');
    const box     = document.getElementById('modal-box');
    box.innerHTML = htmlContent;
    overlay.style.display = 'flex';

    overlay.onclick = (e) => {
      if (e.target === overlay) this.closeModal();
    };
  },

  // ===== DOM HELPERS =====

  /** Vide un conteneur */
  clear(selector) {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = '';
  },

  /** Injecte du HTML dans un conteneur */
  render(selector, html) {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = html;
  },

  /** Crée un élément DOM avec des attributs et du contenu */
  createElement(tag, attrs = {}, innerHTML = '') {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    el.innerHTML = innerHTML;
    return el;
  },

  /** Active / désactive un bouton de navigation */
  setActiveNav(view) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
  }
};
