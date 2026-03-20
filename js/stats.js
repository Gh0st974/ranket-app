// 📄 Fichier : /js/stats.js
// 🎯 Rôle : Logique métier — calcul des statistiques, head-to-head, radar et rivalités
// ⚠️ Pas d'import/export — fonctions exposées globalement

/**
 * Retourne les stats complètes d'un joueur
 */
function getPlayerStats(playerId) {
  const players = Storage.getPlayers();
  const matches = Storage.getMatches();
  const player = players.find(p => p.id === playerId);
  if (!player) return null;

  const playerMatches = matches.filter(
    m => m.playerAId === playerId || m.playerBId === playerId
  );

  let wins = 0, losses = 0;
  let bestStreak = 0, tempStreak = 0, currentStreak = 0;
  let bo1Wins = 0, bo1Total = 0;
  let bo3Wins = 0, bo3Total = 0;
  let bo5Wins = 0, bo5Total = 0;

  const sorted = [...playerMatches].sort((a, b) => a.timestamp - b.timestamp);

  sorted.forEach(m => {
    const isWinner = m.winnerId === playerId;
    const format = m.format || 'best1';

    if (format === 'best1') { bo1Total++; if (isWinner) bo1Wins++; }
    if (format === 'best3') { bo3Total++; if (isWinner) bo3Wins++; }
    if (format === 'best5') { bo5Total++; if (isWinner) bo5Wins++; }

    if (isWinner) {
      wins++;
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else {
      losses++;
      tempStreak = 0;
    }
  });

  // Série actuelle depuis la fin
  const reversed = [...sorted].reverse();
  for (const m of reversed) {
    if (m.winnerId === playerId) currentStreak++;
    else break;
  }

  const total = wins + losses;
  const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return {
    player,
    wins,
    losses,
    total,
    winrate,
    currentStreak,
    bestStreak,
    bo1: { wins: bo1Wins, total: bo1Total },
    bo3: { wins: bo3Wins, total: bo3Total },
    bo5: { wins: bo5Wins, total: bo5Total },
    elo: player.elo || 1000
  };
}

/**
 * Retourne les stats head-to-head entre deux joueurs
 */
function getHeadToHead(playerAId, playerBId) {
  const matches = Storage.getMatches();
  const players = Storage.getPlayers();

  const h2hMatches = matches.filter(m =>
    (m.playerAId === playerAId && m.playerBId === playerBId) ||
    (m.playerAId === playerBId && m.playerBId === playerAId)
  ).sort((a, b) => b.timestamp - a.timestamp);

  let winsA = 0, winsB = 0;

  h2hMatches.forEach(m => {
    if (m.winnerId === playerAId) winsA++;
    else if (m.winnerId === playerBId) winsB++;
  });

  return {
    playerA: players.find(p => p.id === playerAId),
    playerB: players.find(p => p.id === playerBId),
    winsA,
    winsB,
    matches: h2hMatches
  };
}

/**
 * Retourne l'historique ELO d'un joueur sous forme de tableau de points
 */
function getEloHistory(playerId) {
  const matches = Storage.getMatches();
  const players = Storage.getPlayers();
  const player = players.find(p => p.id === playerId);
  if (!player) return [];

  const sorted = matches
    .filter(m => m.playerAId === playerId || m.playerBId === playerId)
    .sort((a, b) => a.timestamp - b.timestamp);

  let elo = 1000;
  const history = [{ date: null, elo, label: 'Départ' }];

  sorted.forEach(m => {
    const isWinner = m.winnerId === playerId;
    const delta = Math.abs(m.deltaA || 20);
    elo += isWinner ? delta : -delta;
    history.push({
      date: m.timestamp,
      elo,
      label: new Date(m.timestamp).toLocaleDateString('fr-FR')
    });
  });

  return history;
}

/**
 * Retourne les 5 axes normalisés (0-100) pour le graphique radar d'un joueur
 * Axes : Niveau, Régularité, Forme, Combativité, Expérience
 */
function getRadarStats(playerId) {
  const players = Storage.getPlayers();
  const matches = Storage.getMatches();

  // ── Niveau : ELO normalisé parmi tous les joueurs ──────────────
  const elos = players.map(p => p.elo || 1000);
  const minElo = Math.min(...elos);
  const maxElo = Math.max(...elos);
  const playerElo = players.find(p => p.id === playerId)?.elo || 1000;
  const niveau = maxElo === minElo ? 50 : Math.round(((playerElo - minElo) / (maxElo - minElo)) * 100);

  // ── Stats de base du joueur ────────────────────────────────────
  const playerMatches = matches
    .filter(m => m.playerAId === playerId || m.playerBId === playerId)
    .sort((a, b) => a.timestamp - b.timestamp);

  const total = playerMatches.length;

  // ── Régularité : winrate global ────────────────────────────────
  const wins = playerMatches.filter(m => m.winnerId === playerId).length;
  const regularite = total > 0 ? Math.round((wins / total) * 100) : 0;

  // ── Forme : winrate des 5 derniers matchs ──────────────────────
  const last5 = [...playerMatches].reverse().slice(0, 5);
  const winsLast5 = last5.filter(m => m.winnerId === playerId).length;
  const forme = last5.length > 0 ? Math.round((winsLast5 / last5.length) * 100) : 0;

  // ── Combativité : winrate Bo3+Bo5 vs Bo1 ──────────────────────
  const longMatches = playerMatches.filter(m => m.format === 'best3' || m.format === 'best5');
  const longWins = longMatches.filter(m => m.winnerId === playerId).length;
  const combativite = longMatches.length > 0 ? Math.round((longWins / longMatches.length) * 100) : regularite;

  // ── Expérience : matchs joués normalisé sur tous les joueurs ───
  const allMatchCounts = players.map(p =>
    matches.filter(m => m.playerAId === p.id || m.playerBId === p.id).length
  );
  const maxMatches = Math.max(...allMatchCounts, 1);
  const experience = Math.round((total / maxMatches) * 100);

  return {
    niveau,
    regularite,
    forme,
    combativite,
    experience,
    labels: ['💪 Niveau', '🏆 Régularité', '🔥 Forme', '⚔️ Combativité', '📈 Expérience']
  };
}

/**
 * Retourne les rivalités d'un joueur :
 * - bête noire (celui contre qui il perd le plus)
 * - victime préférée (celui qu'il bat le plus)
 * - rival (matchs les plus équilibrés)
 */
function getRivalries(playerId) {
  const players = Storage.getPlayers();
  const matches = Storage.getMatches();

  // Regrouper les matchs par adversaire
  const opponents = {};

  matches.forEach(m => {
    const isA = m.playerAId === playerId;
    const isB = m.playerBId === playerId;
    if (!isA && !isB) return;

    const oppId = isA ? m.playerBId : m.playerAId;
    if (!opponents[oppId]) opponents[oppId] = { wins: 0, losses: 0, total: 0 };

    opponents[oppId].total++;
    if (m.winnerId === playerId) opponents[oppId].wins++;
    else opponents[oppId].losses++;
  });

  // Ne garder que les adversaires avec au moins 2 matchs
  const eligible = Object.entries(opponents).filter(([, s]) => s.total >= 2);
  if (eligible.length === 0) return null;

  // Bête noire : meilleur taux de défaite
  const beteNoire = eligible.reduce((best, curr) => {
    const ratioB = curr[1].losses / curr[1].total;
    const ratioBest = best[1].losses / best[1].total;
    return ratioB > ratioBest ? curr : best;
  });

  // Victime préférée : meilleur taux de victoire
  const victime = eligible.reduce((best, curr) => {
    const ratioC = curr[1].wins / curr[1].total;
    const ratioB = best[1].wins / best[1].total;
    return ratioC > ratioB ? curr : best;
  });

  // Rival : matchs les plus équilibrés (ratio le plus proche de 50%)
  const rival = eligible.reduce((best, curr) => {
    const diffC = Math.abs(curr[1].wins / curr[1].total - 0.5);
    const diffB = Math.abs(best[1].wins / best[1].total - 0.5);
    return diffC < diffB ? curr : best;
  });

  const findPlayer = id => players.find(p => p.id === id);

  return {
    beteNoire: {
      player: findPlayer(beteNoire[0]),
      stats: beteNoire[1]
    },
    victime: {
      player: findPlayer(victime[0]),
      stats: victime[1]
    },
    rival: {
      player: findPlayer(rival[0]),
      stats: rival[1]
    }
  };
}
