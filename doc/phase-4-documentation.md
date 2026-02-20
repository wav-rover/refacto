# Phase 4 – Documentation et traçabilité

Document dédié à la phase 4 (mise à jour de Node). Référence : [phase-4-mise-a-jour-node.md](./phase-4-mise-a-jour-node.md).

---

## Versions Node

Référence : [nodejs.org](https://nodejs.org/)

|                              | Version  |
| ---------------------------- | -------- |
| **Actuelle** (avant phase 4) | v24.11.1 |

**Versions disponibles (site officiel) :**

| Canal                      | Version  |
| -------------------------- | -------- |
| Dernière LTS               | v24.13.1 |
| Dernière version (Current) | v25.6.1  |

**Cible** (figée pour le projet) : **v24.13.1** (LTS)

---

## Notes / décisions

- **Cible figée** : v24.13.1 (LTS).
- **Vérifications effectuées** (Node v24.11.1) :
  - `npm ci` : OK
  - `npm test` : 19 tests Jest passés
  - `npm run test:e2e` : 12 tests Playwright passés
  - `npm run dev` : démarrage OK (port 3000)
- **Version cible figée dans le projet** :
  - `package.json` : `engines.node` >= 24.13.1
  - `.nvmrc` : 24.13.1 (pour `nvm use`)
  - `.github/workflows/tests.yml` : Node 24.13.1 en CI
- En local : utiliser Node 24.13.1 (ex. `nvm install 24.13.1 && nvm use` si nvm). Les warnings npm (deprecated, audit) restent hors périmètre phase 4 (phase 5).
