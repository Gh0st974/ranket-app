// 📄 Fichier : /js/stats.js
// 🎯 Rôle : Logique métier — calcul des statistiques et head-to-head

import { getPlayers, getMatches } from './storage.js';

/**
 * Retourne les stats complètes d'un joueur
 */
export function getPlayerStats(playerId) {
  const players = getPlayers();
  const matches = getMatches();
  const player = players.find(p => p.id === playerId);
  if (!player) return null;

  // Filtrer les matchs du joueur
  const playerMatches = matches.filter(
    m => m.player1Id === playerId || m.player2Id === playerId
  );

  let wins = 0, losses = 0;
  let currentStreak = 0, bestStreak = 0, tempStreak = 0;
  let bo1Wins = 0, bo1Total = 0;
  let bo3Wins = 0, bo3Total = 0;
  let bo5Wins = 0, bo5Total = 0;
  let lastMatch = null;

  // Trier par date croissante pour la série
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

    lastMatch = m;
  });

  // Série actuelle (depuis la fin)
  const reversed = [...sorted].reverse();
  for (const m of reversed) {
    if (m.winnerId === playerId) currentStreak++;
    else break;
  }

  // Format favori
  const formatStats = [
    { name: 'Bo1', wins: bo1Wins, total: bo1Total },
    { name: 'Bo3', wins: bo3Wins, total: bo3Total },
    { name: 'Bo5', wins: bo5Wins, total: bo5Total },
  ].filter(f => f.total > 0);

  const favoriteFormat = formatStats.sort(
    (a, b) => (b.wins / b.total) - (a.wins / a.total)
  )[0] || null;

  // ELO max
  const eloHistory = buildEloHistory(playerId, matches, players);
  const maxElo = eloHistory.length
    ? Math.max(...eloHistory.map(e => e.elo))
    : player.elo;

  return {
    player,
    wins,
    losses,
    total: wins + losses,
    winRate: wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0,
    currentStreak,
    bestStreak,
    favoriteFormat,
    formatStats,
    maxElo,
    currentElo: player.elo,
    lastMatch,
    eloHistory,
  };
}

/**
 * Retourne les stats head-to-head entre deux joueurs
 */
export function getHeadToHead(playerAId, playerBId) {
  const matches = getMatches();
  const players = getPlayers();

  const h2hMatches = matches.filter(m =>
    (m.player1Id === playerAId && m.player2Id === playerBId) ||
    (m.player1Id === playerBId && m.player2Id === playerAId)
  ).sort((a, b) => b.date - a.date);

  let winsA = 0, winsB = 0, eloExchanged = 0;

  h2hMatches.forEach(m => {
    if (m.winnerId === playerAId) winsA++;
    else winsB++;
    eloExchanged += Math.abs(m.eloDelta || 0);
  });

  const playerA = players.find(p => p.id === playerAId);
  const playerB = players.find(p => p.id === playerBId);

  return {
    playerA,
    playerB,
    winsA,
    winsB,
    total: h2hMatches.length,
    eloExchanged: Math.round(eloExchanged),
    matches: h2hMatches,
  };
}

/**
 * Reconstruit l'historique ELO point par point pour un joueur
 */
export function buildEloHistory(playerId, matchesParam = null, playersParam = null) {
  const matches = matchesParam || getMatches();
  const players = playersParam || getPlayers();
  const player = players.find(p => p.id === playerId);
  if (!player) return [];

  const playerMatches = matches
    .filter(m => m.player1Id === playerId || m.player2Id === playerId)
    .sort((a, b) => a.date - b.date);

  // Reconstruire depuis l'ELO actuel en remontant
  let elo = player.elo;
  const points = [];

  // On part de l'ELO actuel et on remonte
  const reversed = [...playerMatches].reverse();
  reversed.forEach(m => {
    points.unshift({
      date: m.date,
      elo: Math.round(elo),
      opponent: m.player1Id === playerId ? m.player2Id : m.player1Id,
      won: m.winnerId === playerId,
      delta: m.eloDelta || 0,
      matchId: m.id,
    });
    const delta = m.eloDelta || 0;
    if (m.winnerId === playerId) elo -= delta;
    else elo += delta;
  });

  // Ajouter le point de départ
  points.unshift({ date: null, elo: Math.round(elo), isStart: true });

  return points;
}
