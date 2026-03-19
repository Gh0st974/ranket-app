# 🏓 Ranket

Application de classement ping-pong avec système ELO.
PWA installable sur mobile, tablette et PC.

## Fonctionnalités
- 🏆 Classement ELO en temps réel
- ⚔️ Saisie de matchs (1 set / Best of 3 / Best of 5)
- 📋 Historique filtrable par joueur et par date
- 👥 Gestion des joueurs avec import CSV
- 🔥 Séries de victoires (flamme à partir de 3 consécutives)

## Structure
/ranket
├── index.html
├── manifest.json
├── service-worker.js
├── css/
│   ├── reset.css
│   ├── layout.css
│   ├── components.css
│   └── responsive.css
├── js/
│   ├── config.js
│   ├── storage.js
│   ├── elo.js
│   ├── players.js
│   ├── matches.js
│   ├── ranking.js
│   ├── ui.js
│   └── views/
│       ├── view-ranking.js
│       ├── view-match.js
│       ├── view-history.js
│       └── view-players.js
└── assets/
    └── icons/


## ELO K-Factor variable
| ELO | K-Factor |
|-----|----------|
| < 1200 | 40 |
| 1200–1599 | 32 |
| 1600–1999 | 24 |
| 2000+ | 20 |
