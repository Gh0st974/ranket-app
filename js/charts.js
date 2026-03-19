// 📄 Fichier : /js/charts.js
// 🎯 Rôle : Dessin du graphique d'évolution ELO sur Canvas

import { getPlayers } from './storage.js';

const COLORS = {
  playerA: '#e63946',
  playerB: '#457b9d',
  grid: '#2a2a2a',
  text: '#888',
  tooltip: '#1e1e1e',
};

let tooltipEl = null;

/**
 * Point d'entrée principal — dessine le graphique
 */
export function drawEloChart(canvas, historyA, historyB = null) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // Resize canvas pour la netteté
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;
  const PAD = { top: 20, right: 20, bottom: 40, left: 55 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  ctx.clearRect(0, 0, W, H);

  // Fusionner les deux historiques pour calculer min/max
  const allPoints = [...historyA, ...(historyB || [])].filter(p => !p.isStart);
  if (allPoints.length === 0) return;

  const eloValues = allPoints.map(p => p.elo);
  const minElo = Math.min(...eloValues) - 30;
  const maxElo = Math.max(...eloValues) + 30;

  // Helpers
  const toX = (i, total) => PAD.left + (i / Math.max(total - 1, 1)) * chartW;
  const toY = (elo) => PAD.top + chartH - ((elo - minElo) / (maxElo - minElo)) * chartH;

  drawGrid(ctx, PAD, chartW, chartH, minElo, maxElo, W);
  drawCurve(ctx, historyA, toX, toY, COLORS.playerA, true);
  if (historyB) drawCurve(ctx, historyB, toX, toY, COLORS.playerB, false);

  // Légende
  drawLegend(ctx, historyA, historyB, W, PAD);

  // Tooltips interactifs
  setupTooltips(canvas, historyA, historyB, toX, toY, PAD, dpr);
}

function drawGrid(ctx, PAD, chartW, chartH, minElo, maxElo, W) {
  const steps = 5;
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = COLORS.text;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';

  for (let i = 0; i <= steps; i++) {
    const elo = minElo + ((maxElo - minElo) / steps) * i;
    const y = PAD.top + chartH - ((elo - minElo) / (maxElo - minElo)) * chartH;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(PAD.left + chartW, y);
    ctx.stroke();
    ctx.fillText(Math.round(elo), PAD.left - 5, y + 4);
  }
}

function drawCurve(ctx, history, toX, toY, color, isA) {
  const points = history.filter(p => !p.isStart);
  if (points.length === 0) return;

  // Ligne
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
    const x = toX(i, points.length);
    const y = toY(p.elo);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#121212';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

function drawLegend(ctx, historyA, historyB, W, PAD) {
  const players = getPlayers();
  const getPlayerName = (id) => players.find(p => p.id === id)?.name || '?';

  const pointsA = historyA.filter(p => !p.isStart);
  if (pointsA.length === 0) return;
  const nameA = getPlayerName(pointsA[0]?.opponent !== undefined
    ? historyA.find(p => p.opponent)?.opponent : null);

  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = COLORS.playerA;
  ctx.textAlign = 'left';

  // On récupère le nom depuis le premier point valide
}

function setupTooltips(canvas, historyA, historyB, toX, toY, PAD, dpr) {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'chart-tooltip';
    document.body.appendChild(tooltipEl);
  }

  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;

    const pointsA = historyA.filter(p => !p.isStart);
    const found = findNearestPoint(mx, pointsA, toX);

    if (found) {
      const players = getPlayers();
      const opp = players.find(p => p.id === found.point.opponent);
      const sign = found.point.won ? '+' : '-';
      const delta = Math.abs(found.point.delta);
      const date = found.point.date
        ? new Date(found.point.date).toLocaleDateString('fr-FR')
        : '';

      tooltipEl.innerHTML = `
        <div class="tt-elo">${found.point.elo} ELO</div>
        <div class="tt-delta ${found.point.won ? 'won' : 'lost'}">${sign}${delta}</div>
        ${opp ? `<div class="tt-opp">vs ${opp.name}</div>` : ''}
        <div class="tt-date">${date}</div>
      `;
      tooltipEl.style.display = 'block';
      tooltipEl.style.left = `${e.clientX + 12}px`;
      tooltipEl.style.top = `${e.clientY - 10}px`;
    } else {
      tooltipEl.style.display = 'none';
    }
  };

  canvas.onmouseleave = () => {
    if (tooltipEl) tooltipEl.style.display = 'none';
  };
}

function findNearestPoint(mx, points, toX) {
  let nearest = null;
  let minDist = 20;
  points.forEach((p, i) => {
    const x = toX(i, points.length);
    const dist = Math.abs(mx - x);
    if (dist < minDist) { minDist = dist; nearest = { point: p, index: i }; }
  });
  return nearest;
}
