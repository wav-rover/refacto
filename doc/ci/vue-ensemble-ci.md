# Vue d'ensemble CI/CD — pipelines du projet

Ce document décrit **les pipelines d'intégration et de livraison continues** prévus pour le projet : **quand** chacun se déclenche et **ce qui s'y enchaîne, dans l'ordre** (étapes de haut niveau, sans les commandes exactes).

Il fait le lien avec la liste **« CI »** du tableau Trello *Refacto architecture* et formalise les décisions des ADR :
- **[ADR 004](../adr/adr-004-strategie-integration-continue.md)** — stratégie d'intégration continue ;
- **[ADR 005](../adr/adr-005-livraison-docker-registry.md)** — livraison Docker & registry ;
- **[ADR 006](../adr/adr-006-npm-vs-pnpm.md)** — stratégie de workspaces (impacte l'installation).

## Synthèse

| Pipeline | Quand | But | Cartes Trello |
|---|---|---|---|
| **1. CI incrémentale** | push sur une branche + PR vers `main` | feedback rapide, uniquement sur ce qui change | 44, 35 |
| **2. Qualité & sécurité** | push / merge sur `main` | validation exhaustive + analyses de sécurité | 45 |
| **3. Publication Docker** | après que la CI #2 est verte sur `main` | construire, scanner et publier les images | 46 |
| **4. CI lourde** | tous les soirs (planifié) | suite complète + scans approfondis | 47 |
| **5. Déploiement continu** | après succès de la publication Docker sur `main` | déployer le manifeste sur la VM d'intégration | — |

Principe directeur (**fail-fast**) : chaque commit déclenche le moins coûteux ; le coûteux n'est payé qu'au merge sur `main` ou la nuit.

---

## 1. CI incrémentale

> *Cartes Trello : 44 (« CI incrémentales… à chaque commit »), 35 (« détection des changements + exécution ciblée »).*

**Quand** : à chaque push sur une branche et à chaque pull request vers `main`.

**Ce qui se lance, dans l'ordre :**
1. Récupération du code.
2. **Détection des services modifiés** depuis le commit précédent, et repérage des fichiers « globaux » (lockfile racine, config TypeScript/ESLint, fichiers `.github/…`).
3. Installation des dépendances (avec cache).
4. **Lint** du code et **analyse des dépendances** (dependency-cruiser) sur le périmètre touché.
5. **Build du frontend** — uniquement si le front a changé.
6. **Tests unitaires** (Jest) **ciblés sur les services modifiés**, avec couverture.
7. Vérification des **Dockerfiles touchés** (Hadolint) et **validation de la configuration docker compose**.
8. **Build local + scan Trivy** (bloquant) sur les Dockerfiles modifiés — sans push vers GHCR.
9. **Tests d'intégration hybrides** (si un service, le front ou un fichier global a changé) : les services modifiés sont buildés localement, les autres sont tirés de GHCR aux versions du [`manifeste de déploiement`](../../deploy/manifest.json), puis la suite E2E Playwright tourne sur la stack complète (`docker-compose.prod.yml`). Skippé sur les PR depuis un fork.
10. **Audit des dépendances** (mode informatif).

> Garde-fou : si un fichier « global » a changé, l'étape de tests/lint bascule sur **tous** les services (full build), pour ne rien laisser passer.

> *Carte Trello « Gestion des versions pour la CD » — étape 1 (PR) : tests d'intégration avec images stables des autres services.*

---

## 2. Qualité & sécurité (sur `main`)

> *Carte Trello : 45 (« CI qualité sécurité sur main »).*

**Quand** : à chaque push / merge sur la branche `main`.

**Ce qui se lance, dans l'ordre :**
1. Récupération du code et **installation complète** (tous les services).
2. **Tous les tests unitaires** (tous les services), avec couverture agrégée.
3. **Tests end-to-end** (Playwright).
4. **Analyse de sécurité du code** (CodeQL) → résultats remontés dans GitHub Security.
5. **Analyse qualité & couverture** (SonarQube / SonarCloud).
6. **Vérification des licences** des dépendances (license-checker) — bloquant si une licence non autorisée est détectée (liste blanche à définir, ex. MIT, Apache-2.0, ISC, BSD).
7. **Audit de sécurité des dépendances** (`npm audit`) — bloquant à partir d'une sévérité élevée.
8. **Publication des rapports** (couverture, E2E, sécurité, licences).

---

## 3. Publication Docker

> *Carte Trello : 46 (« CI publication des livrables Docker quand main valide la précédente »).*

**Quand** : automatiquement, **une fois la CI #2 (Qualité & sécurité) passée au vert sur `main`**. On ne publie jamais une image non validée.

**Ce qui se lance, dans l'ordre :**
1. **Bump SemVer** (patch) des services modifiés depuis le dernier manifeste — skip publication si rien n'a changé.
2. **Tests d'intégration release** (étape 3 CD) : build local des 6 images taguées `X.Y.Z`, stack `docker-compose.prod.yml`, E2E Playwright.
3. **Mise à jour du manifeste** (étape 4 CD) : [`deploy/manifest.json`](../../deploy/manifest.json) régénéré depuis les `package.json`, commit auto sur `main`.
4. **Push GHCR** (étape 5 CD) : build multi-arch, tags `sha` / `X.Y.Z`, scan Trivy bloquant, publication des images.
5. Publication des rapports de scan.

> *Carte Trello « Gestion des versions pour la CD » — étapes 2 à 5 : bump → intégration → manifeste → push registry.*

---

## 4. CI lourde (nocturne)

> *Carte Trello : 47 (« CI lourde tous les soirs »).*

**Quand** : tous les soirs, via une exécution planifiée (cron).

**Ce qui se lance, dans l'ordre :**
1. Récupération du code et installation complète.
2. **Démarrage de l'environnement de test complet** (services + dépendances, ex. Redis).
3. **Suite de tests complète** (unitaires + end-to-end de bout en bout).
4. **Scans de sécurité approfondis** (images Trivy, `npm audit` complet, **license-checker** sur l'ensemble du monorepo).
5. Publication des rapports (Playwright, logs, scans).

---

## 5. Déploiement continu (CD)

> *Carte Trello « Gestion des versions pour la CD » — étape 6 : déploiement préprod / intégration depuis le manifeste.*

**Quand** : automatiquement, **une fois le workflow « Publication Docker » passé au vert sur `main`** (images dans GHCR + [`deploy/manifest.json`](../../deploy/manifest.json) à jour).

**Chaîne complète** : `push main` → qualité & sécurité → publication Docker → **déploiement** (ce pipeline).

**Ce qui se lance, dans l'ordre :**
1. **Vérification de compatibilité** : croise les versions du manifeste avec les contraintes `requires.*` / `provides.*` des labels d'images GHCR (`deploy/check-compatibility.mjs`). Échec = aucun déploiement.
2. **Déploiement intégration** (SSH, automatique) :
   - lecture du manifeste et export des versions (`AUTH_SERVICE_VERSION`, `FRONTEND_VERSION`, …) ;
   - connexion SSH vers la VM d'intégration (`~/refacto`) ;
   - copie de `docker-compose.prod.yml` ;
   - `docker login ghcr.io`, `pull`, migrations one-shot (`*-migrate`), puis `up -d` ;
   - contrôle que les services applicatifs + Redis sont bien `running`.
3. **Gate manuelle** : approbation requise (environment GitHub `production` avec reviewer(s)) — **uniquement** sur le job `manual-gate` ; `migrate-production`, `deploy-production` et `rollback-production` enchaînent ensuite sans nouvelle approbation.
4. **Migrations production** (SSH, job dédié — étape 7 CD) :
   - connexion SSH vers la VM de production (`~/refacto`) ;
   - copie de `docker-compose.prod.yml` ;
   - `docker login ghcr.io`, `pull` des images `*-migrate` uniquement ;
   - exécution des conteneurs one-shot `auth-migrate`, `project-migrate`, `task-migrate`, `notification-migrate` ;
   - **aucun** redémarrage des services applicatifs à cette étape.
5. **Rollout production** (SSH, étape 8 CD — rolling restart séquentiel) :
   - `docker login ghcr.io`, `pull` des images applicatives ;
   - démarrage / mise à jour de `redis` ;
   - pour chaque service (`auth-service` → `project-service` → `task-service` → `notification-service` → `api-gateway` → `frontend`) : `pull` + `up -d --no-deps` + vérif `running` ;
   - smoke check HTTP sur `http://127.0.0.1:3000` (`curl` ou `wget`) ;
   - pas de double stack blue/green (VM unique, compose unique).
6. **Rollback production** (SSH, étape 9 CD) :
   - avant les migrations : snapshot de `~/refacto/manifest.deployed.json` sur la VM (artefact `prod-rollback-manifest`, repli git si absent) ;
   - si `migrate-production` ou `deploy-production` échoue : job `rollback-production` redéploie les images précédentes (rolling restart, sans rejeu des `*-migrate`) ;
   - après un deploy réussi : `deploy/manifest.json` est copié vers `manifest.deployed.json` sur la VM ;
   - **limitation** : migrations SQLite forward-only — le rollback remet les images applicatives, pas le schéma BDD.
7. Le workflow global reste **en échec** même si le rollback réussit.

**Secrets GitHub requis (intégration)** :

| Secret | Rôle |
|---|---|
| `SSH_PRIVATE_KEY_INT` | Clé privée SSH (sans passphrase) |
| `VM_HOST_INT` | Hôte de la VM |
| `VM_USER_INT` | Utilisateur SSH |
| `GITHUB_TOKEN` | Authentification GHCR sur la VM (fourni par Actions) |

**Prérequis VM** : Docker + plugin Compose installés, utilisateur dans le groupe `docker`, répertoire `~/refacto` accessible en écriture. L'environment GitHub `integration` ne doit **pas** avoir de reviewers (déploiement automatique).

**Secrets GitHub requis (production)** — à définir en **secrets du repository** (les jobs migrate/deploy/rollback n'utilisent pas l'environment `production`, seul `manual-gate` l'utilise pour la validation) :

| Secret | Rôle |
|---|---|
| `SSH_PRIVATE_KEY_PROD` | Clé privée SSH (sans passphrase) |
| `VM_HOST_PROD` | Hôte de la VM |
| `VM_USER_PROD` | Utilisateur SSH |
| `GITHUB_TOKEN` | Authentification GHCR sur la VM (fourni par Actions) |

---

## Briques transverses (où elles tournent)

Plusieurs cartes Trello ne sont pas des pipelines mais des **outils** intégrés aux pipelines ci-dessus :

| Carte | Outil / brique | Tourne dans |
|---|---|---|
| 37 | Tests unitaires + couverture | #1 (ciblé), #2 et #4 (tous) |
| 38 | Hadolint (lint Dockerfiles) | #1 |
| 39 | CodeQL + SonarQube | #2 |
| 40 | Trivy (scan images) | #1 (PR, bloquant), #3 (bloquant), #4 (approfondi) |
| — | Tests d'intégration hybrides (manifeste GHCR) | #1 |
| 41 | npm audit + `docker compose config` | #1 (audit informatif, validation compose), #2 (audit bloquant), #4 (audit complet) |
| — | license-checker (licences des dépendances) | #2 (bloquant), #4 (contrôle approfondi) |
| 42 | Traçabilité des résultats (GitHub Security, artefacts) | #2 (et #4 pour les rapports) |
| 43 | Registry privée des images | #3 |
| — | Compatibilité semver manifeste ↔ labels GHCR | #5 |
| — | Déploiement SSH intégration | #5 |
| — | Migrations BDD production (job dédié) | #5 |
| — | Rollout SSH production (service par service) | #5 |
| — | Rollback SSH production | #5 |


