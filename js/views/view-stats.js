// 📄 Fichier : /js/views/view-stats.js
// 🎯 Rôle : Affichage complet de l'onglet Statistiques
// ⚠️ Pas d'import/export — exposé globalement via ViewStats
// Dépendances : stats.js, charts.js, storage.js

const ViewStats = (() => {

  // ─── Point d'entrée ───────────────────────────────────────────
  function render() {
    _populateSelectors();
    _bindSelectors();
    _renderStats();
  }

  // ─── Remplissage des <select> ──────────────────────────────────
  function _populateSelectors() {
    const players = Storage.getPlayers();
    const selectA = document.getElementById('stats-player-a');
    const selectB = document.getElementById('stats-player-b');
    if (!selectA || !selectB) return;

    const sorted = [...players].sort((a, b) => (b.elo || 1000) - (a.elo || 1000));

    selectA.innerHTML = sorted.map(p =>
      `<option value="${p.id}">${Players.fullName(p)} (${p.elo || 1000})</option>`
    ).join('');

    selectB.innerHTML = '<option value="">-- Aucun --</option>' + sorted.map(p =>
      `<option value="${p.id}">${Players.fullName(p)} (${p.elo || 1000})</option>`
    ).join('');
  }

  // ─── Binding des événements ────────────────────────────────────
  function _bindSelectors() {
    const selectA = document.getElementById('stats-player-a');
    const selectB = document.getElementById('stats-player-b');
    if (!selectA || !selectB) return;

    // Évite les doublons d'écouteurs si render() est rappelé
    selectA.replaceWith(selectA.cloneNode(true));
    selectB.replaceWith(selectB.cloneNode(true));

    document.getElementById('stats-player-a').addEventListener('change', _renderStats);
    document.getElementById('stats-player-b').addEventListener('change', _renderStats);
  }

  // ─── Rendu principal ───────────────────────────────────────────
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

  let html = '';

  // ── Mode comparaison : côte à côte ──
  if (idB && idB !== idA) {
    const statsB = getPlayerStats(idB);
    if (statsB) {
      html += `
        <div class="comparison-row">
          ${_buildPlayerCard(statsA, 'a')}
          ${_buildPlayerCard(statsB, 'b')}
        </div>
      `;
      html += `
        <div class="chart-section">
          <h3 class="section-title">Évolution ELO</h3>
          <div class="chart-wrapper">
            <canvas id="elo-chart"></canvas>
          </div>
        </div>
      `;
      html += _buildH2H(idA, idB);
    }
  } else {
    // ── Mode solo ──
    html += _buildPlayerCard(statsA, 'a');
    html += `
      <div class="chart-section">
        <h3 class="section-title">Évolution ELO</h3>
        <div class="chart-wrapper">
          <canvas id="elo-chart"></canvas>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  const historyA = getEloHistory(idA);
  const historyB = (idB && idB !== idA) ? getEloHistory(idB) : null;
  drawEloChart('elo-chart', historyA, historyB);
}


  // ─── Carte joueur ──────────────────────────────────────────────
  function _buildPlayerCard(stats, side) {
    const colorClass = side === 'a' ? 'color-a' : 'color-b';
    return `
      <div class="player-stats-card ${colorClass}">
        <h3 class="player-stats-name">${Players.fullName(stats.player)}</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">${stats.elo}</span>
            <span class="stat-label">ELO</span>
          </div>
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
          <div class="stat-card">
            <span class="stat-value">${stats.bestStreak}</span>
            <span class="stat-label">Meilleure série</span>
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

  // ─── Ligne format Bo1/Bo3/Bo5 ──────────────────────────────────
  function _buildFormatRow(label, data) {
    if (!data || data.total === 0) return '';
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

  // ─── Bloc Head-to-Head ─────────────────────────────────────────
  function _buildH2H(idA, idB) {
    const h2h = getHeadToHead(idA, idB);
    if (!h2h.playerA || !h2h.playerB) return '';

    const matchesHTML = h2h.matches.slice(0, 10).map(m => {
      const winnerIsA = m.winnerId === idA;
      const date = new Date(m.timestamp).toLocaleDateString('fr-FR');
      const delta = Math.abs(m.deltaA) || '?';
      return `
        <div class="h2h-match-row ${winnerIsA ? 'win-a' : 'win-b'}">
          <span class="h2h-match-winner">${winnerIsA ? Players.fullName(h2h.playerA) : Players.fullName(h2h.playerB)} gagne</span>
          <span class="h2h-match-date">${date}</span>
          <span class="h2h-match-delta">±${delta} ELO</span>
        </div>
      `;
    }).join('');

    return `
      <div class="h2h-section">
        <h3 class="section-title">Face à Face</h3>
        <div class="h2h-score">
          <span class="h2h-name color-a">${Players.fullName(h2h.playerA)}</span>
          <span class="h2h-wins">${h2h.winsA} — ${h2h.winsB}</span>
          <span class="h2h-name color-b">${Players.fullName(h2h.playerB)}</span>
        </div>
        <div class="h2h-matches">
          ${matchesHTML || '<p class="stats-placeholder">Aucun match entre ces deux joueurs.</p>'}
        </div>
      </div>
    `;
  }

  // ─── API publique ──────────────────────────────────────────────
  return { render };

})();
