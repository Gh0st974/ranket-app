// 📄 Fichier : /js/views/view-stats.js
// 🎯 Rôle : Affichage de l'onglet Statistiques — comparaison face à face + graphique ELO

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
      `<option value="${p.id}">${Players.fullName(p)}</option>`
    ).join('');

    selectB.innerHTML = '<option value="">Selectionnez</option>' + sorted.map(p =>
      `<option value="${p.id}">${Players.fullName(p)}</option>`
    ).join('');
  }

  // ─── Binding des événements ────────────────────────────────────
  function _bindSelectors() {
    const selectA = document.getElementById('stats-player-a');
    const selectB = document.getElementById('stats-player-b');
    if (!selectA || !selectB) return;

    const newA = selectA.cloneNode(true);
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
    container.innerHTML = '<p class="stats-placeholder">Sélectionne un joueur.</p>';
    return;
  }

  const statsA = getPlayerStats(idA);
  if (!statsA) return;

  const statsB = (idB && idB !== idA) ? getPlayerStats(idB) : null;

  container.innerHTML = _buildComparison(statsA, statsB) + _buildEloChart(idA, idB);
  _drawEloChart(idA, idB || null);
}


  // ─── Tableau comparatif ────────────────────────────────────────
  function _buildComparison(sA, sB) {
    const nameA = Players.fullName(sA.player);
    const nameB = sB ? Players.fullName(sB.player) : '';

    const wr = (s) => s ? `${s.winrate}%` : '-';
    const val = (s, key) => s ? s[key] : '-';
    const bo = (s, key) => {
      if (!s) return '- % -V / D';
      const d = s[key];
      if (!d || d.total === 0) return '- % -V / D';
      const pct = Math.round((d.wins / d.total) * 100);
      return `${pct}% - ${d.wins}V / ${d.total - d.wins}D`;
    };

    const rows = [
      { label: 'ELO',              a: val(sA,'elo'),          b: val(sB,'elo')          },
      { label: 'Victoires',        a: val(sA,'wins'),         b: val(sB,'wins')         },
      { label: 'Défaites',         a: val(sA,'losses'),       b: val(sB,'losses')       },
      { label: 'Global Winrate',   a: wr(sA),                 b: wr(sB)                 },
      { label: 'Série actuelle',   a: `${val(sA,'currentStreak')} Série actuelle`, b: sB ? `${val(sB,'currentStreak')} Série actuelle` : '- Série actuelle' },
      { label: 'Meilleure série',  a: `${val(sA,'bestStreak')} Meilleure série`,  b: sB ? `${val(sB,'bestStreak')} Meilleure série` : '- Meilleure série'  },
      { label: 'Bo 1 - % -V / D', a: bo(sA,'bo1'),           b: bo(sB,'bo1')           },
      { label: 'Bo 3 - % -V / D', a: bo(sA,'bo3'),           b: bo(sB,'bo3')           },
      { label: 'Bo 5 - % -V / D', a: bo(sA,'bo5'),           b: bo(sB,'bo5')           },
    ];

    const rowsHTML = rows.map(r => `
      <div class="cmp-row">
        <span class="cmp-val-a">${r.a}</span>
        <span class="cmp-label">${r.label}</span>
        <span class="cmp-val-b">${r.b}</span>
      </div>
    `).join('');

    return `
      <div class="cmp-table">
        <div class="cmp-header">
          <span class="cmp-badge badge-a">${nameA}</span>
          <span class="cmp-vs">VS</span>
          <span class="cmp-badge badge-b">${nameB}</span>
        </div>
        ${rowsHTML}
      </div>
    `;
  }

  // ─── HTML du bloc graphique ────────────────────────────────────
function _buildEloChart(idA, idB) {
  return `
    <div class="elo-chart-section">
      <div class="elo-chart-title">📈 Évolution ELO</div>
      <canvas id="elo-chart-canvas"></canvas>
    </div>
  `;
}

// ─── Dessin du canvas ──────────────────────────────────────────
function _drawEloChart(idA, idB) {
  const matches = Storage.getMatches();
  const players = Storage.getPlayers();
  const canvas = document.getElementById('elo-chart-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 300;
  const H = 200;
  canvas.width = W;
  canvas.height = H;

  // ─── Reconstruction de la courbe ELO pour un joueur ──────────
  function buildCurve(playerId) {
    const player = players.find(p => p.id === playerId);
    if (!player) return [];
    const startElo = 1000;
    const playerMatches = matches
      .filter(m => m.playerAId === playerId || m.playerBId === playerId)
      .sort((a, b) => a.timestamp - b.timestamp);

    let elo = startElo;
    const points = [{ elo, label: 'Départ' }];
    playerMatches.forEach(m => {
      const delta = m.playerAId === playerId ? (m.eloChangeA || 0) : (m.eloChangeB || 0);
      elo += delta;
      const opp = players.find(p => p.id === (m.playerAId === playerId ? m.playerBId : m.playerAId));
      points.push({ elo, label: opp ? Players.fullName(opp) : '?' });
    });
    return points;
  }

  const curveA = buildCurve(idA);
  const curveB = idB ? buildCurve(idB) : [];

  const allElos = [...curveA, ...curveB].map(p => p.elo);
  const minElo = Math.min(...allElos) - 30;
  const maxElo = Math.max(...allElos) + 30;

  const pad = { top: 20, bottom: 30, left: 45, right: 20 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  // ─── Utilitaire coordonnées ───────────────────────────────────
  function toX(i, total) {
    return pad.left + (i / Math.max(total - 1, 1)) * chartW;
  }
  function toY(elo) {
    return pad.top + chartH - ((elo - minElo) / (maxElo - minElo)) * chartH;
  }

  // ─── Grille ───────────────────────────────────────────────────
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();
    const val = Math.round(maxElo - ((maxElo - minElo) / 4) * i);
    ctx.fillStyle = '#999';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val, pad.left - 4, y + 4);
  }

  // ─── Fonction dessin courbe ───────────────────────────────────
  function drawCurve(points, color) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    points.forEach((p, i) => {
      const x = toX(i, points.length);
      const y = toY(p.elo);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Points
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(toX(i, points.length), toY(p.elo), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  drawCurve(curveA, '#6c3fcf');
  if (curveB.length > 0) drawCurve(curveB, '#cf3f3f');

  // ─── Légende si 2 joueurs ─────────────────────────────────────
  if (curveB.length > 0) {
    const pA = players.find(p => p.id === idA);
    const pB = players.find(p => p.id === idB);
    const nameA = pA ? Players.fullName(pA) : 'Joueur A';
    const nameB = pB ? Players.fullName(pB) : 'Joueur B';

    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';

    ctx.fillStyle = '#6c3fcf';
    ctx.fillRect(pad.left, H - 14, 12, 4);
    ctx.fillText(nameA, pad.left + 16, H - 10);

    ctx.fillStyle = '#cf3f3f';
    ctx.fillRect(pad.left + 120, H - 14, 12, 4);
    ctx.fillText(nameB, pad.left + 136, H - 10);
  }
}


  return { render };
})();
