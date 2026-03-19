// 📄 Fichier : /js/statsUI.js
// 🎯 Rôle : Affichage DOM de l'onglet Statistiques
// ⚠️ Pas d'import/export — fonctions exposées globalement

/**
 * Point d'entrée appelé par app.js quand l'onglet Stats est ouvert
 */
function initStats() {
  _populateSelectors();
  _bindSelectors();
  _renderStats();
}

/** Remplit les <select> avec la liste des joueurs */
function _populateSelectors() {
  const players = Storage.getPlayers();
  const selectA = document.getElementById('stats-player-a');
  const selectB = document.getElementById('stats-player-b');
  if (!selectA || !selectB) return;

  const sorted = [...players].sort((a, b) => (b.elo || 1000) - (a.elo || 1000));

  // Option vide pour B
  const emptyOption = '<option value="">-- Aucun --</option>';

  selectA.innerHTML = sorted.map(p =>
    `<option value="${p.id}">${p.name} (${p.elo || 1000})</option>`
  ).join('');

  selectB.innerHTML = emptyOption + sorted.map(p =>
    `<option value="${p.id}">${p.name} (${p.elo || 1000})</option>`
  ).join('');
}

/** Écoute les changements de sélection */
function _bindSelectors() {
  const selectA = document.getElementById('stats-player-a');
  const selectB = document.getElementById('stats-player-b');
  if (!selectA || !selectB) return;

  selectA.addEventListener('change', _renderStats);
  selectB.addEventListener('change', _renderStats);
}

/** Décide quoi afficher selon la sélection */
function _renderStats() {
  const selectA = document.getElementById('stats-player-a');
  const selectB = document.getElementById('stats-player-b');
  const container = document.getElementById('stats-content');
  if (!selectA || !container) return;

  const idA = selectA.value;
  const idB = selectB ? selectB.value : '';

  if (!idA) {
    container.innerHTML = '<p class="stats-placeholder">Sélectionne un joueur pour voir ses statistiques.</p>';
    return;
  }

  const statsA = getPlayerStats(idA);
  if (!statsA) return;

  let html = _buildPlayerCard(statsA, 'a');

  // Graphique ELO
  html += `
    <div class="chart-section">
      <h3 class="section-title">Évolution ELO</h3>
      <div class="chart-wrapper">
        <canvas id="elo-chart"></canvas>
      </div>
    </div>
  `;

  // Head-to-head si joueur B sélectionné
  if (idB && idB !== idA) {
    const statsB = getPlayerStats(idB);
    html += _buildPlayerCard(statsB, 'b');
    html += _buildH2H(idA, idB);
  }

  container.innerHTML = html;

  // Dessiner le graphique après injection du DOM
  const histA = getEloHistory(idA);
  const histB = idB && idB !== idA ? getEloHistory(idB) : null;
  drawEloChart('elo-chart', histA, histB);
}

/** Génère le HTML d'une carte joueur */
function _buildPlayerCard(stats, side) {
  const label = side === 'a' ? 'player-a' : 'player-b';
  const colorClass = side === 'a' ? 'color-a' : 'color-b';

  return `
    <div class="stats-player-card ${label}">
      <div class="player-card-header ${colorClass}">
        <span class="player-card-name">${stats.player.name}</span>
        <span class="player-card-elo">${stats.elo} ELO</span>
      </div>
      <div class="stats-cards-row">
        <div class="stat-card">
          <span class="stat-value">${stats.wins}</span>
          <span class="stat-label">Victoires</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${stats.losses}</span>
          <span class="stat-label">Défaites</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${stats.winrate}%</span>
          <span class="stat-label">Winrate</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${stats.currentStreak}</span>
          <span class="stat-label">Série actuelle</span>
        </div>
      </div>
      <div class="format-stats">
        ${_buildFormatRow('Bo1', stats.bo1)}
        ${_buildFormatRow('Bo3', stats.bo3)}
        ${_buildFormatRow('Bo5', stats.bo5)}
      </div>
    </div>
  `;
}

/** Génère une ligne de stat par format */
function _buildFormatRow(label, data) {
  if (data.total === 0) return '';
  const pct = Math.round((data.wins / data.total) * 100);
  return `
    <div class="format-row">
      <span class="format-label">${label}</span>
      <span class="format-record">${data.wins}V / ${data.total - data.wins}D</span>
      <div class="format-bar-bg">
        <div class="format-bar-fill" style="width:${pct}%"></div>
      </div>
      <span class="format-pct">${pct}%</span>
    </div>
  `;
}

/** Génère le bloc Head-to-Head */
function _buildH2H(idA, idB) {
  const h2h = getHeadToHead(idA, idB);
  if (!h2h.playerA || !h2h.playerB) return '';

  const matchesHTML = h2h.matches.slice(0, 10).map(m => {
    const winnerIsA = m.winnerId === idA;
    const date = new Date(m.date).toLocaleDateString('fr-FR');
    const delta = m.eloDelta || '?';
    return `
      <div class="h2h-match-row ${winnerIsA ? 'win-a' : 'win-b'}">
        <span class="h2h-match-winner">${winnerIsA ? h2h.playerA.name : h2h.playerB.name} gagne</span>
        <span class="h2h-match-date">${date}</span>
        <span class="h2h-match-delta">±${delta} ELO</span>
      </div>
    `;
  }).join('');

  return `
    <div class="h2h-section">
      <h3 class="section-title">Face à Face</h3>
      <div class="h2h-score">
        <span class="h2h-name color-a">${h2h.playerA.name}</span>
        <span class="h2h-wins">${h2h.winsA} — ${h2h.winsB}</span>
        <span class="h2h-name color-b">${h2h.playerB.name}</span>
      </div>
      <div class="h2h-matches">
        ${matchesHTML || '<p class="stats-placeholder">Aucun match joué entre ces deux joueurs.</p>'}
      </div>
    </div>
  `;
}
