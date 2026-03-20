// 📄 Fichier : /js/views/view-stats.js
// 🎯 Rôle : Affichage complet de l'onglet Statistiques
// ⚠️ Pas d'import/export — exposé globalement via ViewStats
// Dépendances : stats.js, charts.js, storage.js

const ViewStats = (() => {

  // ─── Point d'entrée ───────────────────────────────────────────
  function render() {
  _populateSelectors(); // en premier
  _bindSelectors();     // en second
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

  const newA = selectA.cloneNode(true); // garde le contenu
  const newB = selectB.cloneNode(true);
  selectA.replaceWith(newA);
  selectB.replaceWith(newB);

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
      // ── Mode solo : radar + rivalités + chart ──
      html += _buildPlayerCard(statsA, 'a');
      html += _buildRadarSection(idA);
      html += _buildRivalriesSection(idA);
      html += `
        <div class="chart-section">
          <h3 class="section-title">Évolution ELO</h3>
          <div class="chart-wrapper">
            <canvas id="elo-chart"></canvas>
          </div>
        </div>
      `;
    }

    // Injection du HTML dans le DOM
    container.innerHTML = html;

    // Dessin des graphiques après injection
    const historyA = getEloHistory(idA);
    const historyB = (idB && idB !== idA) ? getEloHistory(idB) : null;
    drawEloChart('elo-chart', historyA, historyB);

    // Radar — solo ou comparaison
    _renderRadarChart(idA, idB);
    }
  

  // ─── Radar — HTML ──────────────────────────────────────────────
  function _buildRadarSection(playerIdA, playerIdB = null) {
    return `
      <div class="radar-section">
        <h3 class="section-title">📊 Profil du joueur</h3>
        <div class="radar-wrapper">
          <canvas id="radar-chart" width="300" height="300"></canvas>
        </div>
      </div>
    `;
  }

  // ─── Radar — Dessin Chart.js ───────────────────────────────────
function _renderRadarChart(playerIdA, playerIdB = null) {
  const canvas = document.getElementById('radar-chart');
  if (!canvas) return;

  // Détruire l'instance précédente si elle existe
  if (window._radarChartInstance) {
    window._radarChartInstance.destroy();
  }

  const dataA = getRadarStats(playerIdA);
  const playerA = Players.findById(playerIdA);
  const labelA = playerA ? Players.fullName(playerA) : 'Joueur A';

  // ── Dataset joueur A ──
  const datasets = [{
    label: labelA,
    data: [dataA.niveau, dataA.regularite, dataA.forme, dataA.combativite, dataA.experience],
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: 'rgba(99, 102, 241, 1)',
    borderWidth: 2,
    pointBackgroundColor: 'rgba(99, 102, 241, 1)',
    pointRadius: 4
  }];

  // ── Dataset joueur B (si comparaison) ──
  if (playerIdB && playerIdB !== playerIdA) {
    const dataB = getRadarStats(playerIdB);
    const playerB = Players.findById(playerIdB);
    const labelB = playerB ? Players.fullName(playerB) : 'Joueur B';

    datasets.push({
      label: labelB,
      data: [dataB.niveau, dataB.regularite, dataB.forme, dataB.combativite, dataB.experience],
      backgroundColor: 'rgba(249, 115, 22, 0.2)',
      borderColor: 'rgba(249, 115, 22, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(249, 115, 22, 1)',
      pointRadius: 4
    });
  }

  window._radarChartInstance = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: dataA.labels,
      datasets
    },
    options: {
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { display: false },
          grid: { color: 'rgba(255,255,255,0.1)' },
          angleLines: { color: 'rgba(255,255,255,0.15)' },
          pointLabels: {
            color: '#f1f5f9',
            font: { size: 13, weight: 'bold' }
          }
        }
      },
      plugins: {
        // Afficher la légende uniquement en mode comparaison
        legend: {
          display: playerIdB !== null,
          labels: {
            color: '#f1f5f9',
            font: { size: 12 }
          }
        }
      }
    }
  });
}


  // ─── Rivalités — HTML ──────────────────────────────────────────
  function _buildRivalriesSection(playerId) {
    const data = getRivalries(playerId);
    if (!data) return `
      <div class="rivalries-section">
        <h3 class="section-title">⚔️ Rivalités</h3>
        <p class="stats-placeholder">Pas assez de matchs pour calculer les rivalités (2 matchs minimum par adversaire).</p>
      </div>
    `;

    const { beteNoire, victime, rival } = data;

    return `
      <div class="rivalries-section">
        <h3 class="section-title">⚔️ Rivalités</h3>
        <div class="rivalries-grid">
          ${_buildRivalryCard(
            '😈 Bête noire',
            beteNoire.player,
            `${beteNoire.stats.losses}D / ${beteNoire.stats.total} matchs`,
            `${Math.round((beteNoire.stats.losses / beteNoire.stats.total) * 100)}% de défaites`,
            'rivalry-card--danger'
          )}
          ${_buildRivalryCard(
            '😎 Victime préférée',
            victime.player,
            `${victime.stats.wins}V / ${victime.stats.total} matchs`,
            `${Math.round((victime.stats.wins / victime.stats.total) * 100)}% de victoires`,
            'rivalry-card--success'
          )}
          ${_buildRivalryCard(
            '🤜 Rival',
            rival.player,
            `${rival.stats.wins}V ${rival.stats.losses}D`,
            `${rival.stats.total} matchs au coude à coude`,
            'rivalry-card--neutral'
          )}
        </div>
      </div>
    `;
  }

  // ─── Rivalités — Card individuelle ────────────────────────────
  function _buildRivalryCard(title, player, record, subtitle, cssClass) {
    if (!player) return '';
    const name = Players.fullName(player);
    const elo = player.elo || 1000;
    return `
      <div class="rivalry-card ${cssClass}">
        <div class="rivalry-card__title">${title}</div>
        <div class="rivalry-card__name">${name}</div>
        <div class="rivalry-card__elo">${elo} ELO</div>
        <div class="rivalry-card__record">${record}</div>
        <div class="rivalry-card__subtitle">${subtitle}</div>
      </div>
    `;
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
