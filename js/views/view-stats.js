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

    container.innerHTML = _buildComparison(statsA, statsB) + _buildEloChart(idA);

    // Dessiner le graphique après injection DOM
    _drawEloChart(idA);
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

  // ─── Conteneur graphique ELO ───────────────────────────────────
  function _buildEloChart(idA) {
    return `
      <div class="elo-chart-section">
        <h3 class="elo-chart-title">Evolution Elo</h3>
        <canvas id="elo-chart-canvas"></canvas>
      </div>
    `;
  }

  // ─── Dessin du graphique ELO (canvas natif) ────────────────────
  function _drawEloChart(idA) {
    const canvas = document.getElementById('elo-chart-canvas');
    if (!canvas) return;

    const history = getEloHistory(idA);
    if (history.length < 2) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const elos = history.map(h => h.elo);
    const minElo = Math.min(...elos) - 30;
    const maxElo = Math.max(...elos) + 30;
    const pad = { top: 30, right: 40, bottom: 20, left: 10 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    const xOf = i => pad.left + (i / (elos.length - 1)) * chartW;
    const yOf = v => pad.top + (1 - (v - minElo) / (maxElo - minElo)) * chartH;

    // Ligne
    ctx.beginPath();
    ctx.strokeStyle = '#5b8dee';
    ctx.lineWidth = 2;
    elos.forEach((v, i) => i === 0 ? ctx.moveTo(xOf(i), yOf(v)) : ctx.lineTo(xOf(i), yOf(v)));
    ctx.stroke();

    // Points + labels premier/dernier
    elos.forEach((v, i) => {
      ctx.beginPath();
      ctx.arc(xOf(i), yOf(v), 4, 0, Math.PI * 2);
      ctx.fillStyle = '#5b8dee';
      ctx.fill();

      if (i === 0 || i === elos.length - 1) {
        ctx.fillStyle = '#333';
        ctx.font = '12px sans-serif';
        ctx.textAlign = i === 0 ? 'left' : 'right';
        ctx.fillText(v, xOf(i), yOf(v) - 8);
      }
    });
  }

  return { render };
})();
