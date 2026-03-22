# 🏓 Ranket

Application PWA de classement ping-pong avec système ELO avancé.
Installable sur mobile, tablette et PC.

---

## ✨ Fonctionnalités

### 🏆 Classement
- Classement ELO en temps réel
- Affichage du ratio V/D et nombre de matchs joués
- 🔥 Séries de victoires consécutives (flamme à partir de 3)
- Badges et indicateurs visuels de progression

### ⚔️ Matchs
- Saisie de matchs avec score par sets
- Formats disponibles : **1 set gagnant** / **Best of 3** / **Best of 5**
- Calcul automatique du gagnant selon les sets remportés
- Modification et suppression d'un match existant
- Recalcul global de l'ELO après toute modification

### 📋 Historique
- Liste complète des matchs joués
- Filtres par joueur et par date

### 👥 Joueurs
- Ajout manuel (prénom + nom)
- Suppression simple ou multiple
- Import via fichier CSV (format : `prénom;nom`)
- ELO de départ configurable

### 📊 Statistiques
- Statistiques détaillées par joueur
- Graphiques d'évolution ELO dans le temps
- Visualisation des performances globales

---

## 📐 Système ELO

### ELO par défaut
Chaque nouveau joueur commence avec un ELO de **1000** (modifiable dans `config.js`).

### K-Factor variable
Le K-factor détermine l'amplitude maximale des gains/pertes d'ELO.
Plus un joueur est fort, plus son ELO est stable.

| ELO actuel | K-Factor |
|------------|----------|
| < 1200 | 40 |
| 1200 – 1599 | 32 |
| 1600 – 1999 | 24 |
| 2000+ | 20 |

### Probabilité de victoire
Calculée avec la formule ELO standard :

```
E = 1 / (1 + 10^((eloB - eloA) / 400))
```

> Battre un adversaire très fort rapporte beaucoup. Perdre contre lui coûte peu.

---

### 🔥 Multiplicateur de combativité

Le gain ELO ne dépend pas uniquement du résultat, mais aussi de **comment** le match s'est déroulé.

On compare l'écart attendu par set (selon la différence d'ELO) à l'écart réel moyen des scores saisis :

```
performance = écart_attendu - écart_réel
```

**Écart attendu selon la différence d'ELO :**

| Différence d'ELO | Écart attendu par set |
|------------------|-----------------------|
| 0 – 50 | 2 points |
| 51 – 150 | 4 points |
| 151 – 300 | 6 points |
| 301+ | 8 points |

**Paliers de combativité :**

| Performance | Situation | Mult. Gagnant | Mult. Perdant |
|-------------|-----------|---------------|---------------|
| ≥ 4 | Résistance exceptionnelle | × 1.4 | × 1.3 |
| ≥ 2 | Au-dessus des attentes | × 1.2 | × 1.1 |
| ≥ -2 | Dans les clous | × 1.0 | × 1.0 |
| < -2 | Écrasement | × 0.8 | × 0.8 |

> 💡 **Exemple :** ELO 1000 perd 11-3, 11-2 contre ELO 1400 → écart attendu 6 pts, écart réel ~8.5 pts → performance = -2.5 → **× 0.8** : tout le monde perd moins de points.

> 💡 **Exemple :** ELO 1000 perd 11-9, 11-10 contre ELO 1400 → écart réel ~1 pt → performance = +5 → **× 1.4** : le gagnant est très récompensé, le perdant est valorisé.

---

### 🎮 Multiplicateur de format

Le format du match influence également les points échangés.
Un match long est plus représentatif du vrai niveau.

| Format | Multiplicateur |
|--------|---------------|
| 1 set gagnant (Bo1) | × 0.6 |
| Best of 3 ⭐ | × 1.0 |
| Best of 5 | × 1.3 |

---

### 🧮 Formule finale

```
Delta ELO = K-factor × Surprise × Combativité × Format
```

---

### 🔄 Recalcul complet

En cas de modification ou suppression d'un match, l'ELO est **entièrement recalculé depuis zéro** pour tous les joueurs, dans l'ordre chronologique. Cela garantit une cohérence totale du classement.

---

## 📁 Structure du projet

```
/ranket-app
│
├── index.html
├── manifest.json
├── service-worker.js
├── README.md
│
├── /assets
│   ├── /icons
│   └── /images
│
├── /css
│   ├── reset.css
│   ├── layout.css
│   ├── responsive.css
│   └── /components
│       ├── buttons.css
│       ├── forms.css
│       ├── match-cards.css
│       ├── modal.css
│       ├── stats.css
│       ├── table-ranking.css
│       └── ui.css
│
└── /js
    ├── app.js
    ├── config.js
    ├── storage.js
    ├── elo.js
    ├── players.js
    ├── matches.js
    ├── ranking.js
    ├── stats.js
    ├── charts.js
    ├── ui.js
    └── /views
        ├── view-ranking.js
        ├── view-players.js
        ├── view-match.js
        ├── view-match.html.js
        ├── view-match.logic.js
        ├── view-history.js
        ├── view-edit-match.js
        └── view-stats.js
```

---

## 🧱 Architecture & Philosophie

Le projet suit une architecture **modulaire Lego** :
chaque fichier a une responsabilité unique et peut être modifié sans impacter les autres.

| Rôle | Fichiers |
|------|----------|
| Données | `storage.js` |
| Logique métier | `players.js`, `matches.js`, `elo.js`, `ranking.js`, `stats.js` |
| Affichage | `ui.js`, `views/*.js`, `views/*.html.js` |
| Logique de vue | `views/*.logic.js` |
| Graphiques | `charts.js` |
| Configuration | `config.js` |
| Routing / Init | `app.js` |

---

## 📱 PWA

L'application est installable comme une application native grâce à :
- `manifest.json` — métadonnées et icônes
- `service-worker.js` — cache et fonctionnement hors ligne

---

## 🛠️ Technologies

| Technologie | Usage |
|-------------|-------|
| **HTML / CSS / JS Vanilla** | Aucun framework |
| **localStorage** | Persistance des données en local |
| **PWA** | Installable sur tous les appareils |