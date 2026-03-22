// 📄 Fichier : /js/views/view-match.logic.js
// 🎯 Rôle : Logique métier de la vue "Saisir un match" (proba, score, save)

const ViewMatchLogic = {

  /** Met à jour l'affichage ELO + probabilité de victoire */
  updateProba() {
    const idA = document.getElementById('select-player-a')?.value;
    const idB = document.getElementById('select-player-b')?.value;
    const pA  = idA ? Players.findById(idA) : null;
    const pB  = idB ? Players.findById(idB) : null;

    document.getElementById('elo-a-display').textContent =
      pA ? `ELO : ${pA.elo ?? CONFIG.DEFAULT_ELO}` : 'ELO : —';
    document.getElementById('elo-b-display').textContent =
      pB ? `ELO : ${pB.elo ?? CONFIG.DEFAULT_ELO}` : 'ELO : —';

    if (!pA || !pB) {
      document.getElementById('proba-display').innerHTML = 'probabilité de victoire';
      return;
    }

    const eloA  = pA.elo ?? CONFIG.DEFAULT_ELO;
    const eloB  = pB.elo ?? CONFIG.DEFAULT_ELO;
    const probaA = Elo.winProbability(eloA, eloB);
    const probaB = 100 - probaA;

    const nameA = Players.fullName(pA);
    const nameB = Players.fullName(pB);

    document.getElementById('proba-display').innerHTML =
      `<span class="proba-highlight" style="color:var(--color-primary)">${probaA}%</span>
       &nbsp;probabilité de victoire&nbsp;
       <span class="proba-highlight" style="color:var(--color-primary)">${probaB}%</span>`;
  },

  /** Met à jour le score final affiché */
  updateFinalScore(sets) {
    const idA = document.getElementById('select-player-a')?.value;
    const idB = document.getElementById('select-player-b')?.value;

    const nameA = idA ? Players.fullName(Players.findById(idA)) : '—';
    const nameB = idB ? Players.fullName(Players.findById(idB)) : '—';

    let setsA = 0, setsB = 0;
    sets.forEach(s => {
      const a = parseInt(s.a) || 0;
      const b = parseInt(s.b) || 0;
      if (a > b) setsA++;
      else if (b > a) setsB++;
    });

    document.getElementById('final-name-a').textContent  = nameA;
    document.getElementById('final-name-b').textContent  = nameB;
    document.getElementById('final-score-a').textContent = setsA;
    document.getElementById('final-score-b').textContent = setsB;
  },

  /** Valide et enregistre le match */
  saveMatch(format, sets, onSuccess) {
    const idA = document.getElementById('select-player-a')?.value;
    const idB = document.getElementById('select-player-b')?.value;

    if (!idA || !idB) {
      UI.toast('⚠️ Sélectionne les deux joueurs.'); return;
    }
    if (idA === idB) {
      UI.toast('⚠️ Les deux joueurs doivent être différents.'); return;
    }

    const validSets = sets.filter(s => s.a !== '' && s.b !== '');
    if (validSets.length === 0) {
      UI.toast('⚠️ Saisis au moins un score de set.'); return;
    }

    const fmt = CONFIG.FORMATS[format];
    let setsA = 0, setsB = 0;
    validSets.forEach(s => {
      if (parseInt(s.a) > parseInt(s.b)) setsA++;
      else if (parseInt(s.b) > parseInt(s.a)) setsB++;
    });

    if (setsA < fmt.setsToWin && setsB < fmt.setsToWin) {
      UI.toast(`⚠️ Le format ${fmt.label} requiert ${fmt.setsToWin} set(s) gagnant(s).`); return;
    }

    const match = Matches.add(idA, idB, format, validSets);
    if (match) {
      UI.toast('✅ Match enregistré !');
      setTimeout(() => onSuccess(), 1000);
    } else {
      UI.toast('❌ Erreur lors de l\'enregistrement.');
    }
  }
};
