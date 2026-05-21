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
8. **Audit des dépendances** (mode informatif).

> Garde-fou : si un fichier « global » a changé, l'étape de tests/lint bascule sur **tous** les services (full build), pour ne rien laisser passer.

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
6. **Audit de sécurité des dépendances** — bloquant à partir d'une sévérité élevée.
7. **Publication des rapports** (couverture, E2E, sécurité).

---

## 3. Publication Docker

> *Carte Trello : 46 (« CI publication des livrables Docker quand main valide la précédente »).*

**Quand** : automatiquement, **une fois la CI #2 (Qualité & sécurité) passée au vert sur `main`**. On ne publie jamais une image non validée.

**Ce qui se lance, dans l'ordre :**
1. Récupération du code.
2. Préparation de l'outil de build d'images (Buildx).
3. **Construction des images** des services concernés (architecture **amd64**).
4. **Scan de sécurité des images** (Trivy) — bloque en cas de vulnérabilité haute/critique.
5. **Connexion à la registry** (GHCR) et **publication** des images.
6. **Étiquetage** des images (`latest`, identifiant de commit, version sur release).
7. Publication des rapports de scan.

---

## 4. CI lourde (nocturne)

> *Carte Trello : 47 (« CI lourde tous les soirs »).*

**Quand** : tous les soirs, via une exécution planifiée (cron).

**Ce qui se lance, dans l'ordre :**
1. Récupération du code et installation complète.
2. **Démarrage de l'environnement de test complet** (services + dépendances, ex. Redis).
3. **Suite de tests complète** (unitaires + end-to-end de bout en bout).
4. **Scans de sécurité approfondis** (images et dépendances).
5. Publication des rapports (Playwright, logs, scans).

---

## Briques transverses (où elles tournent)

Plusieurs cartes Trello ne sont pas des pipelines mais des **outils** intégrés aux pipelines ci-dessus :

| Carte | Outil / brique | Tourne dans |
|---|---|---|
| 37 | Tests unitaires + couverture | #1 (ciblé), #2 et #4 (tous) |
| 38 | Hadolint (lint Dockerfiles) | #1 |
| 39 | CodeQL + SonarQube | #2 |
| 40 | Trivy (scan images) | #3 (bloquant), #4 (approfondi) |
| 41 | npm audit + `docker compose config` | #1 (audit informatif, validation compose), #2 (audit bloquant) |
| 42 | Traçabilité des résultats (GitHub Security, artefacts) | #2 (et #4 pour les rapports) |
| 43 | Registry privée des images | #3 |

## État Trello vs réalité

- **Carte 36 (build multi-architecture)** : ramenée à **amd64 uniquement** par décision de l'**[ADR 005](../adr/adr-005-livraison-docker-registry.md)** (le multi-arch pourra être réactivé plus tard si un besoin ARM apparaît).
- **Carte 48 (« RE valider le contenu des CI »)** : ce document **est** cette validation — il fige le périmètre et l'ordonnancement des 4 pipelines.
