// 📄 Fichier : /js/stats.js
// 🎯 Rôle : Logique métier — calcul des statistiques et head-to-head
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
    m => m.player1Id === playerId || m.player2Id === playerId
  );

  let wins = 0, losses = 0;
  let bestStreak = 0, tempStreak = 0, currentStreak = 0;
  let bo1Wins = 0, bo1Total = 0;
  let bo3Wins = 0, bo3Total = 0;
  let bo5Wins = 0, bo5Total = 0;

  const sorted = [...playerMatches].sort((a, b) => a.date - b.date);

  sorted.forEach(m => {
    const isWinner = m.winnerId === playerId;
    const format = m.format || 'bo1';

    if (format === 'bo1') { bo1Total++; if (isWinner) bo1Wins++; }
    if (format === 'bo3') { bo3Total++; if (isWinner) bo3Wins++; }
    if (format === 'bo5') { bo5Total++; if (isWinner) bo5Wins++; }

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
    (m.player1Id === playerAId && m.player2Id === playerBId) ||
    (m.player1Id === playerBId && m.player2Id === playerAId)
  ).sort((a, b) => b.date - a.date);

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
    .filter(m => m.player1Id === playerId || m.player2Id === playerId)
    .sort((a, b) => a.date - b.date);

  let elo = 1000;
  const history = [{ date: null, elo, label: 'Départ' }];

  sorted.forEach(m => {
    const isWinner = m.winnerId === playerId;
    const delta = m.eloDelta || 20;
    elo += isWinner ? delta : -delta;
    history.push({
      date: m.date,
      elo,
      label: new Date(m.date).toLocaleDateString('fr-FR')
    });
  });

  return history;
}
