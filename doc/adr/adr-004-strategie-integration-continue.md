# ADR 004 – Stratégie d'intégration continue (CI)

- **Statut** : Accepté
- **Date** : 2026-05-21
- **Décideurs** : Tristan, Jeremy, Paul
- **Contexte** : Le repo est un monorepo de 5 services (`auth`, `project`, `task`, `notification`, `api-gateway`) + un frontend. La CI actuelle (`.github/workflows/tests.yml`) est un **unique job monolithique** qui, à chaque push/PR sur `main`/`master`, réinstalle tout, lint + lint:deps, build le front, joue **tous** les tests Jest puis **tous** les tests Playwright. Ce modèle ne passe pas à l'échelle : il rejoue l'intégralité de la chaîne même pour une modification touchant un seul service, et ne couvre ni l'analyse de sécurité ni la livraison.

## Options

### A. Conserver le workflow monolithique unique
- **Avantages** : simple, déjà en place.
- **Inconvénients** : lent (tout est rejoué), aucune sélection par service, pas d'étagement par coût, pas de place pour l'analyse de sécurité sans alourdir chaque push.

### B. Un workflow indépendant par service
- **Avantages** : isolation forte.
- **Inconvénients** : forte duplication de YAML, maintenance pénible, gestion des étapes transverses (E2E, front, lint:deps) bancale.

### C. Pipelines étagés par coût + exécution incrémentale *(retenu)*
- **Avantages** : feedback rapide sur les branches, coûteux réservé à `main`, sécurité intégrée sans bloquer les devs, exploite le découpage microservices.
- **Inconvénients** : configuration initiale plus riche (détection de changements, matrix, plusieurs workflows).

## Décision

On retient **l'option C**, structurée par le principe **fail-fast** : chaque commit déclenche le moins coûteux ; le coûteux n'est payé qu'au merge ou la nuit.

### Workflows CI

1. **`ci.yml` — CI incrémentale** *(push sur branches + PR vers `main`)*
   - Job `detect` : `dorny/paths-filter` calcule les services touchés + un flag `global` (lockfile racine, `tsconfig`, config eslint, `.github/**`…).
   - Job `services` (**matrix** sur les services touchés) : `npm ci` → `lint` → Jest + couverture.
   - Job `front` (si le front est modifié) : `build:front`.
   - Job `quality` : `lint:deps` (dependency-cruiser), Hadolint sur les Dockerfiles touchés, `docker compose config`, `npm audit` (informatif).
   - Si `global` a changé → la matrix bascule sur **tous** les services (full build).
   - Cible : feedback < ~5 min.

2. **`main-quality.yml` — Qualité & sécurité** *(push `main`)*
   - `npm ci` + `ci:services` → **tous** les tests unitaires + **Playwright E2E**.
   - **CodeQL** (JS/TS) → upload SARIF dans GitHub Security.
   - **SonarQube/SonarCloud** (qualité + couverture agrégée).
   - **license-checker** sur le monorepo (bloquant si licence hors liste blanche).
   - `npm audit --audit-level=high` (bloquant).
   - Upload des rapports (couverture, Playwright).

3. **`nightly.yml` — CI lourde** *(cron nocturne)*
   - `ci:services` + `test:all` (services + E2E complet, environnement Redis up).
   - Scans complets (Trivy full, `npm audit` complet, license-checker sur tout le monorepo).
   - Upload des rapports Playwright + logs.

> La publication des images Docker (build, scan, push) fait l'objet d'un workflow et d'une décision séparés : voir **[ADR 005](./adr-005-livraison-docker-registry.md)**.

### Détection des changements
Réalisée avec **`dorny/paths-filter` + matrix GitHub Actions** plutôt qu'un `git diff` maison : déclaratif, lisible, standard de l'écosystème. Un changement sur un fichier « global » force le full build par sécurité.

### Répartition (anti-redondance)

| Étape | CI incrémentale | Qualité & sécurité (main) | Nightly |
|---|:---:|:---:|:---:|
| Lint / lint:deps | ciblé | — | — |
| Jest unitaires | ciblé | tous | tous |
| E2E Playwright | — | ✅ | ✅ |
| CodeQL / Sonar | — | ✅ | — |
| Hadolint | ciblé | — | — |
| license-checker | — | bloquant | complet |
| npm audit | informatif | bloquant (`high`) | complet |

## Conséquences

### Positives
- Feedback rapide sur chaque branche (on ne teste que ce qui change).
- Le coûteux (E2E, CodeQL, Sonar) ne tourne qu'au merge → CI des branches légère.
- Sécurité (CodeQL, audit) intégrée au cycle sans bloquer le quotidien.
- Exploite réellement le découpage microservices.

### Négatives
- Plus de YAML à maintenir (plusieurs workflows, matrix, filtres de chemins).
- La détection de changements doit rester juste : un faux négatif laisserait passer un service non testé (atténué par le full build sur fichier global + la couverture exhaustive sur `main`).
- SonarQube/SonarCloud ajoute une dépendance externe (serveur Sonar ou compte SonarCloud).

## Actions de suivi
- **Aligner les versions Node** : la CI teste sur `24.13.1` (`.nvmrc`) alors que les services tournent sur `node:20-alpine`. À harmoniser (voir ADR 005).
- **Workspaces mono-repo** : implémenter la décision **[ADR 006](./adr-006-npm-vs-pnpm.md)** (npm workspaces, lockfile unique) avant `ci.yml`.
- Définir l'instance SonarQube (self-hosted vs SonarCloud) et le seuil de qualité (quality gate).
- Définir la **liste blanche de licences** acceptées pour license-checker (ex. MIT, Apache-2.0, ISC, BSD) et le script npm associé.
- Implémenter les workflows (`ci.yml`, `main-quality.yml`, `nightly.yml`).
