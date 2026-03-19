// 📄 Fichier : /js/charts.js
// 🎯 Rôle : Dessin du graphique ELO sur un élément Canvas
// ⚠️ Pas d'import/export — fonctions exposées globalement

/**
 * Dessine le graphique ELO d'un ou deux joueurs
 * @param {string} canvasId - ID du canvas HTML
 * @param {Array} dataA - historique ELO joueur A [{elo, label}]
 * @param {Array} dataB - historique ELO joueur B (optionnel)
 */
function drawEloChart(canvasId, dataA, dataB = null) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Dimensions
  const W = canvas.width = canvas.offsetWidth;
  const H = canvas.height = canvas.offsetHeight || 250;
  const PAD = { top: 20, right: 20, bottom: 40, left: 50 };

  ctx.clearRect(0, 0, W, H);

  // Fusionner les données pour trouver min/max
  const allElos = [...dataA.map(d => d.elo), ...(dataB ? dataB.map(d => d.elo) : [])];
  const minElo = Math.min(...allElos) - 50;
  const maxElo = Math.max(...allElos) + 50;

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  /** Convertit une valeur ELO en coordonnée Y */
  function eloToY(elo) {
    return PAD.top + chartH - ((elo - minElo) / (maxElo - minElo)) * chartH;
  }

  /** Convertit un index en coordonnée X */
  function indexToX(i, total) {
    return PAD.left + (i / Math.max(total - 1, 1)) * chartW;
  }

  // Fond grille
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = PAD.top + (chartH / 5) * i;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(W - PAD.right, y);
    ctx.stroke();
  }

  // Axe ELO (labels gauche)
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const val = Math.round(minElo + ((maxElo - minElo) / 5) * (5 - i));
    const y = PAD.top + (chartH / 5) * i;
    ctx.fillText(val, PAD.left - 6, y + 4);
  }

  /** Dessine une courbe */
  function drawLine(data, color) {
    if (!data || data.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    data.forEach((d, i) => {
      const x = indexToX(i, data.length);
      const y = eloToY(d.elo);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Points
    data.forEach((d, i) => {
      const x = indexToX(i, data.length);
      const y = eloToY(d.elo);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  drawLine(dataA, '#e63946');
  if (dataB) drawLine(dataB, '#457b9d');

  // Label dernier point
  function labelLast(data, color) {
    if (!data || data.length === 0) return;
    const last = data[data.length - 1];
    const x = indexToX(data.length - 1, data.length);
    const y = eloToY(last.elo);
    ctx.fillStyle = color;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(last.elo, x + 6, y + 4);
  }

  labelLast(dataA, '#e63946');
  if (dataB) labelLast(dataB, '#457b9d');
}
