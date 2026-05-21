# ADR 006 – Stratégie workspaces : npm workspaces vs pnpm

- **Statut** : Accepté
- **Date** : 2026-05-21
- **Décideurs** : Tristan, Jeremy, Paul

## Contexte

Début de la consolidation CI du mono-repo (app legacy + 5 packages sous `services/`). La structuration des pipelines est traitée dans **[ADR 004](./adr-004-strategie-integration-continue.md)**.

Le dépôt est déjà structuré en **mono-repository** sans workspaces formels :

| Zone                                                                                              | Rôle                                                                      | Gestion des deps aujourd’hui                                         |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Racine (`package.json`)                                                                           | App legacy, build front (esbuild), Playwright, ESLint, dependency-cruiser | `package-lock.json` + `npm ci`                                       |
| `services/auth-service`, `project-service`, `task-service`, `notification-service`, `api-gateway` | Microservices isolés (pas d’import inter-service)                         | **5** `package-lock.json` distincts                                  |
| CI (`.github/workflows/tests.yml`)                                                                | Lint, build front, Jest par service, e2e                                  | `npm ci` à la racine puis boucle `npm ci` dans chaque `services/*/`  |
| Docker                                                                                            | Image par service                                                         | `npm install` dans le contexte du service seul                       |
| Scripts                                                                                           | `scripts/ci-services.mjs`, `npm run test:services`                        | Installations et tests **séquentiels**, non orchestrés par workspace |

**Constats issus de la revue du projet :**

1. **Duplication** : `express`, `typescript`, `jest`, `ts-jest`, `supertest`, `@types/*` sont répétés dans chaque service ; `task-service` diverge encore (`express` ^5.0.1, `typescript` ^5.3.3 vs ^5.2.1 / ^5.9.3 ailleurs).
2. **CI coûteuse** : jusqu’à **6** résolutions `npm ci` par pipeline (1 racine + 5 services), sans cache workspace unifié.
3. **Outillage déjà npm** : README, `ci:services`, workflows GitHub et Dockerfiles supposent **npm** ; la racine utilise déjà `overrides` pour corriger des CVE.
4. **Isolation métier** : chaque service garde son `Dockerfile` et son cycle de vie ; les workspaces doivent **unifier l’install et les scripts CI**, pas fusionner le code des services.

**Objectif de cette décision** : choisir l’outil de workspaces pour la **première étape** du CI mono-repo (une installation reproductible, scripts racine, alignement des versions outillage), sans bloquer les builds Docker par service.

## Options

### A. npm workspaces (natif npm ≥ 7)

Déclarer dans le `package.json` racine :

```json
{
  "workspaces": ["services/*"]
}
```

Puis remplacer la boucle CI par `npm ci` à la racine et des commandes du type `npm run test -w auth-service` ou `npm run test --workspaces --if-present`.

### B. pnpm workspaces

Fichier `pnpm-workspace.yaml` :

```yaml
packages:
  - "services/*"
```

Lockfile unique `pnpm-lock.yaml`, installs via store global, commandes `pnpm -r run test`, filtres `pnpm --filter task-service`.

## Comparaison

| Critère                              | npm workspaces                                                                                                                               | pnpm workspaces                                                                                                                                         |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Adoption actuelle**                | Déjà utilisé partout (CI, README, scripts, Docker).                                                                                          | Migration complète : nouveau lockfile, `corepack` / `pnpm/action-setup`, adaptation Docker et docs.                                                     |
| **Courbe d’apprentissage**           | Faible pour l’équipe et les reviewers du cours.                                                                                              | Commandes et layout `node_modules` (.pnpm) à documenter.                                                                                                |
| **CI GitHub Actions**                | `setup-node` + cache `npm` natif ; un seul `npm ci` suffit après migration.                                                                  | `pnpm/action-setup` + cache dédié ; gains de temps surtout visibles avec cache chaud et nombreux paquets.                                               |
| **Déduplication / disque**           | Hoisting npm ; correct pour ~6 packages avec deps similaires.                                                                                | Store content-addressable ; meilleure déduplication à grande échelle.                                                                                   |
| **Isolation des deps**               | Hoisting peut masquer des deps manquantes déclarées (risque modéré ici).                                                                     | `node_modules` strict : imports fantômes impossibles — utile à long terme, plus strict au démarrage.                                                    |
| **Alignement des versions**          | `overrides` racine déjà en place ; `workspace:*` pour lier des paquets internes futurs.                                                      | `pnpm.overrides` équivalent ; écosystème très utilisé en monorepos JS.                                                                                  |
| **Docker par service**               | Chaque `Dockerfile` copie `package.json` + lock du service ; possible de garder ce modèle ou d’utiliser `npm pack` / build depuis la racine. | Build d’image **depuis la racine** plus naturel ; build contexte service seul demande `pnpm deploy` ou duplication — friction pour 5 images distinctes. |
| **Scripts existants**                | `test:services`, `ci-services.mjs` se réécrivent en flags workspace sans changer de CLI.                                                     | Remplacement par `pnpm -r` ; réécriture des scripts et du workflow.                                                                                     |
| **Maturité / Node 24**               | Support officiel Node ; engines `>=24.13.1` à la racine.                                                                                     | Très mature ; nécessite pin de version pnpm en CI (`packageManager` dans `package.json`).                                                               |
| **Bénéfice immédiat pour ce projet** | **Élevé** : supprime 5 `npm ci` redondants, unifie le lock, peu de changement culturel.                                                      | **Moyen** : gains perf et strictness reportés après coût de migration.                                                                                  |

## Synthèse

- **npm workspaces** : meilleur rapport **effort / bénéfice** pour _démarrer_ le CI mono-repo : une commande d’install, scripts racine, `overrides` conservés, compatibilité avec l’existant.
- **pnpm** : pertinent si le pipeline devient lent, si l’on veut des filtres CI par package modifié (`--filter ...[origin/main]`) ou une isolation stricte des dépendances — plutôt en **phase 2** une fois les workspaces npm stabilisés.

## Décision

**Retenir npm workspaces** pour la stratégie workspaces au début du CI.

**Non retenu pour l’instant** : migration pnpm (coût sur 6 lockfiles, 5 Dockerfiles, workflow, documentation et habitudes équipe, sans gain critique à l’échelle actuelle du dépôt).

### Build Docker & workspaces

Avec un **lockfile unique à la racine**, un `npm ci` exécuté dans le contexte d’un service isolé n’a plus de `package-lock.json` à sa disposition — or les Dockerfiles actuels utilisent `context: ./services/<service>` puis `COPY package*.json ./` + `npm ci`. On retient donc le **build en contexte racine** :

- `context: .` (racine) dans `docker-compose.yml` et la CI, au lieu de `./services/<service>`.
- chaque `Dockerfile` copie le `package-lock.json` racine + les `package.json` du workspace, exécute `npm ci`, puis build et démarre le service ciblé (multi-stage + `--omit=dev` au runtime).

Cela lève la contradiction avec l’**[ADR 005](./adr-005-livraison-docker-registry.md)** (qui impose `npm ci` dans les Dockerfiles) : le lockfile unique est respecté du test jusqu’à l’image.

## Conséquences

### Positives

- Un seul `npm ci` en CI (et en local via `npm run ci:services` refactoré).
- Alignement progressif des devDependencies communes (TypeScript, Jest, types Express) via la racine ou des `overrides`.
- Scripts simplifiés : `npm run test --workspaces --if-present`, `npm run build -w api-gateway`, etc.
- Cohérence avec `engines.node`, Playwright et dependency-cruiser déjà à la racine.
- Réversibilité : une migration pnpm reste possible plus tard en conservant la même découpe `services/*`.

### Négatives

- Hoisting npm : vigilance sur les dépendances non déclarées dans un service (mitigation : `lint:deps` / tests par package).
- Les builds Docker passent en **contexte racine** (cf. décision « Build Docker & workspaces ») : l’image embarque la résolution du workspace, couche d’install un peu plus lourde — atténué par multi-stage et `--omit=dev` au runtime. L’isolation des images par service est conservée.

### Actions de suivi

1. Ajouter `"workspaces": ["services/*"]` au `package.json` racine et fusionner les lockfiles en un `package-lock.json` racine unique (suppression des 5 locks de service).
2. **Build Docker en contexte racine** : passer `context: ./services/<service>` → `context: .` dans `docker-compose.yml`, et adapter chaque `Dockerfile` pour copier le lock racine + les `package.json` du workspace et exécuter `npm ci` (cohérent avec l’**[ADR 005](./adr-005-livraison-docker-registry.md)**).
3. Mettre à jour `.github/workflows/tests.yml` : une étape `npm ci`, supprimer la boucle sur `services/*/`.
4. Remplacer `scripts/ci-services.mjs` et `test:services` par des commandes workspace (`--workspaces`).
5. Harmoniser les versions dans les `package.json` des services (priorité : `task-service` vs les autres).
6. Documenter dans `README.md` : `npm ci` unique à la racine.
7. **Réévaluer pnpm** dans un ADR ultérieur si : temps CI > seuil convenu, besoin de `pnpm --filter` pour CI incrémental, ou politique d’isolation stricte imposée.

## Références projet

- CI actuelle : `.github/workflows/tests.yml`
- Install local : `README.md`, `scripts/ci-services.mjs`
- Structure services : `services/README.md` (mono-repo, isolation par package)
