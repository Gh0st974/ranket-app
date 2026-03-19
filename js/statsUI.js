// 📄 Fichier : /js/statsUI.js
// 🎯 Rôle : Affichage DOM de l'onglet Statistiques

import { getPlayers } from './storage.js';
import { getPlayerStats, getHeadToHead } from './stats.js';
import { drawEloChart } from './charts.js';

let selectedA = null;
let selectedB = null;

/**
 * Initialise l'onglet Stats
 */
export function initStats() {
  populateSelectors();
  bindEvents();
  renderStats();
}

function populateSelectors() {
  const players = getPlayers().sort((a, b) => a.name.localeCompare(b.name));
  const selA = document.getElementById('stats-player-a');
  const selB = document.getElementById('stats-player-b');

  const emptyB = '<option value="">— Aucun (solo) —</option>';
  const options = players.map(p =>
    `<option value="${p.id}">${p.name}</option>`
  ).join('');

  selA.innerHTML = `<option value="">Choisir un joueur...</option>${options}`;
  selB.innerHTML = `${emptyB}${options}`;
}

function bindEvents() {
  document.getElementById('stats-player-a').addEventListener('change', (e) => {
    selectedA = e.target.value || null;
    renderStats();
  });

  document.getElementById('stats-player-b').addEventListener('change', (e) => {
    selectedB = e.target.value || null;
    renderStats();
  });
}

function renderStats() {
  const container = document.getElementById('stats-content');

  if (!selectedA) {
    container.innerHTML = `<p class="stats-placeholder">Sélectionne un joueur pour voir ses statistiques.</p>`;
    return;
  }

  const statsA = getPlayerStats(selectedA);
  const statsB = selectedB ? getPlayerStats(selectedB) : null;
  const h2h = selectedB ? getHeadToHead(selectedA, selectedB) : null;

  container.innerHTML = `
    ${renderGraph()}
    ${renderPlayerCards(statsA, statsB)}
    ${h2h ? renderH2H(h2h) : ''}
  `;

  // Dessiner le graphique après injection HTML
  const canvas = document.getElementById('elo-chart');
  if (canvas && statsA.eloHistory.length > 1) {
    drawEloChart(canvas, statsA.eloHistory, statsB?.eloHistory || null);
  }
}

function renderGraph() {
  return `
    <section class="stats-section">
      <h2 class="stats-section-title">📈 Évolution ELO</h2>
      <div class="chart-wrapper">
        <canvas id="elo-chart"></canvas>
      </div>
    </section>
  `;
}

function renderPlayerCards(statsA, statsB) {
  return `
    <section class="stats-section">
      <h2 class="stats-section-title">🎯 Statistiques générales</h2>
      <div class="stats-cards-row">
        ${renderCard(statsA)}
        ${statsB ? renderCard(statsB) : ''}
      </div>
    </section>
  `;
}

function renderCard(stats) {
  const { player, wins, losses, winRate, bestStreak, currentStreak, maxElo, currentElo, favoriteFormat, lastMatch } = stats;
  const lastDate = lastMatch
    ? new Date(lastMatch.date).toLocaleDateString('fr-FR')
    : 'Aucun';

  const rateClass = winRate >= 60 ? 'green' : winRate >= 25 ? 'yellow' : 'red';

  return `
    <div class="stat-card">
      <div class="stat-card-header">
        <span class="stat-card-name">${player.name}</span>
        <span class="stat-card-elo">${currentElo} ELO</span>
      </div>
      <div class="stat-rows">
        <div class="stat-row"><span>Victoires / Défaites</span><strong>${wins}V / ${losses}D</strong></div>
        <div class="stat-row"><span>Ratio</span><strong class="ratio-${rateClass}">${winRate}%</strong></div>
        <div class="stat-row"><span>ELO max atteint</span><strong>${maxElo}</strong></div>
        <div class="stat-row"><span>Meilleure série</span><strong>🔥 ${bestStreak} victoires</strong></div>
        <div class="stat-row"><span>Série en cours</span><strong>${currentStreak > 0 ? `🔥 ${currentStreak}` : '—'}</strong></div>
        ${favoriteFormat ? `<div class="stat-row"><span>Format favori</span><strong>${favoriteFormat.name} (${Math.round(favoriteFormat.wins/favoriteFormat.total*100)}%)</strong></div>` : ''}
        <div class="stat-row"><span>Dernier match</span><strong>${lastDate}</strong></div>
      </div>
    </div>
  `;
}

function renderH2H(h2h) {
  const { playerA, playerB, winsA, winsB, total, eloExchanged, matches } = h2h;
  if (total === 0) {
    return `
      <section class="stats-section">
        <h2 class="stats-section-title">⚔️ Head-to-Head</h2>
        <p class="stats-placeholder">Ces deux joueurs ne se sont jamais affrontés.</p>
      </section>
    `;
  }

  const pctA = Math.round((winsA / total) * 100);
  const pctB = 100 - pctA;
  const players = getPlayers();

  return `
    <section class="stats-section">
      <h2 class="stats-section-title">⚔️ Head-to-Head</h2>
      <div class="h2h-score">
        <div class="h2h-player ${winsA > winsB ? 'winner' : ''}">
          <span class="h2h-name">${playerA.name}</span>
          <span class="h2h-wins">${winsA}</span>
        </div>
        <div class="h2h-vs">VS</div>
        <div class="h2h-player ${winsB > winsA ? 'winner' : ''} right">
          <span class="h2h-name">${playerB.name}</span>
          <span class="h2h-wins">${winsB}</span>
        </div>
      </div>
      <div class="h2h-bar">
        <div class="h2h-bar-a" style="width:${pctA}%"></div>
        <div class="h2h-bar-b" style="width:${pctB}%"></div>
      </div>
      <p class="h2h-meta">${total} match(s) joué(s) — ${eloExchanged} pts ELO échangés au total</p>

      <div class="h2h-history">
        ${matches.map(m => {
          const winner = players.find(p => p.id === m.winnerId);
          const date = new Date(m.date).toLocaleDateString('fr-FR');
          const isAWinner = m.winnerId === playerA.id;
          return `
            <div class="h2h-match-row ${isAWinner ? 'win-a' : 'win-b'}">
              <span class="h2h-match-date">${date}</span>
              <span class="h2h-match-winner">🏆 ${winner?.name || '?'}</span>
              <span class="h2h-match-format">${m.format?.toUpperCase() || ''}</span>
              <span class="h2h-match-delta">±${Math.abs(m.eloDelta || 0)} ELO</span>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}
