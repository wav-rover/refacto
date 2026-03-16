# Phase 6 – Frontend minimal & intégration complète via l’API Gateway – Répartition des tâches

**Objectif :** faire en sorte que le frontend utilise **exclusivement** l’API Gateway pour parler aux services (projets, tâches, notifications), avec une UI **très basique** (listes simples, formulaires minimalistes), sans chercher à faire un design abouti.

Référence : section « 5. API Gateway (point d’entrée) » et « 6. Tests distribués » du [plan de refonte architecture](../../plan-refonte-architecture.md), plus les phases 2 à 5 déjà réalisées.

---

## Prérequis

- **Phases 2 à 5 validées** :
  - `auth-service`, `project-service`, `task-service`, `notification-service` fonctionnels (cas d’usage + events).
  - `api-gateway` en place, avec routes vers :
    - `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
    - `GET /api/projects`, `POST /api/projects`, `PATCH /api/projects/:projectId`, `POST /api/projects/:projectId/close`, `POST /api/projects/:projectId/members`, `DELETE /api/projects/:projectId/members/:userId`
    - `GET /api/tasks`, `GET /api/tasks/project/:projectId`, `GET /api/tasks/user/:userId`, `GET /api/tasks/:id`, `POST /api/tasks`, `PATCH /api/tasks/:id`, `POST /api/tasks/:id/assign`, `POST /api/tasks/:id/unassign`, `POST /api/tasks/:id/complete`, `POST /api/tasks/:id/reopen`, `DELETE /api/tasks/:id`
    - `GET /api/notifications`
  - Docker Compose démarre `api-gateway` en front door (`http://localhost:3000`).
- Le frontend actuel (monolithe) fonctionne encore avec :
  - Auth basique via le Gateway (déjà branchée).
  - Gestion des items via `/items` sur le monolithe (non migrée).

---

## Vision de la phase

- Le frontend ne doit plus appeler :
  - `/items` sur le monolithe,
  - ni directement `project-service`, `task-service` ou `notification-service`.
- Il doit utiliser **uniquement** les routes exposées par l’API Gateway (`/api/**`).
- L’UI reste **très simple** :
  - Une page Login.
  - Une vue « Projets » avec liste très basique (titre + quelques infos).
  - Une vue « Tâches d’un projet » avec une liste et un formulaire minimal.
  - Une vue « Notifications » avec une simple liste.
  - Navigation rudimentaire (liens / boutons texte), pas de routing compliqué ni de design poussé.

**Première étape de la phase :**

- Jeremy finalise le branchement de **toute l’auth** côté frontend sur l’API Gateway :
  - ajouter un formulaire / une vue de **register** qui appelle `POST ${apiBaseUrl}/api/auth/register` (via le Gateway),
  - faire en sorte qu’un utilisateur puisse faire `register` → `login` → être reconnu par `/api/auth/me` → `logout`, uniquement via le Gateway,
  - garder l’UI très basique (écran unique avec login + register, pas de routing supplémentaire).

---

## Tristan – Front minimal « Projets » via Gateway

**Responsable :** Tristan

**Périmètre :** brancher une vue « Projets » basique sur les routes `projects` du Gateway.

**À faire (quoi) :**

1. **Liste des projets (lecture seule dans un premier temps)**
   - Ajouter un composant très simple « Projets » qui :
     - appelle `GET ${apiBaseUrl}/api/projects` avec `credentials: "include"`,
     - affiche une liste (ul/li ou table basique) avec :
       - nom du projet,
       - éventuellement le nombre de membres,
       - statut (ouvert / clos) si disponible.
   - Afficher les erreurs simplement (ex. une ligne de texte « Impossible de charger les projets. »).

2. **Création de projet (formulaire minimal)**
   - Ajouter un petit formulaire (nom du projet, éventuellement description) qui :
     - appelle `POST ${apiBaseUrl}/api/projects` avec `credentials: "include"`,
     - rafraîchit la liste des projets en cas de succès.
   - Gestion d’erreurs très basique (un message texte, pas de UX avancée).

3. **Actions basiques sur un projet (optionnel mais recommandé)**
   - Bouton « Clore » qui appelle `POST ${apiBaseUrl}/api/projects/:projectId/close`.
   - Boutons très simples pour gérer les membres (`POST/DELETE /api/projects/:projectId/members`).

**Contraintes UI :**

- Layout simple (une colonne, blocs les uns sous les autres).
- Pas de design complexe : texte, boutons, champs de formulaire standards.

**Livrable :**

- Une vue « Projets » dans le front qui parle **uniquement** au Gateway (`/api/projects...`) pour lire/créer/fermer des projets, même si c’est très brut visuellement.

---

## Paul – Front minimal « Tâches » via Gateway

**Responsable :** Paul

**Périmètre :** brancher une vue « Tâches » sur les routes `tasks` du Gateway, en restant fidèle aux use cases du `task-service` mais avec une interface très simple.

**À faire (quoi) :**

1. **Liste de tâches pour un projet**
   - Ajouter une vue ou un bloc « Tâches du projet sélectionné » qui :
     - récupère `projectId` (projet courant sélectionné dans la vue de Tristan, ou un ID saisi à la main pour faire simple).
     - appelle `GET ${apiBaseUrl}/api/tasks/project/:projectId` avec `credentials: "include"` (si nécessaire).
     - affiche la liste des tâches (titre, statut, priorité, assignedTo).

2. **Création de tâche**
   - Formulaire basique (input titre obligatoire, éventuellement priorité / statut initial) qui :
     - appelle `POST ${apiBaseUrl}/api/tasks` avec un body du type :
       - `{ title, projectId, ... }`
     - utilise le `userId` injecté côté Gateway (pas besoin de gérer `createdBy` dans le front).
     - rafraîchit la liste en cas de succès.

3. **Actions principales sur une tâche**
   - Boutons simples :
     - « Assigner » → `POST ${apiBaseUrl}/api/tasks/:id/assign`
     - « Terminer » → `POST ${apiBaseUrl}/api/tasks/:id/complete`
     - « Réouvrir » → `POST ${apiBaseUrl}/api/tasks/:id/reopen`
     - « Supprimer » → `DELETE ${apiBaseUrl}/api/tasks/:id`
   - Pas de modal, pas de confirmation compliquée : au pire un `confirm()` natif ou rien pour cette phase.

4. **Gestion très simple des erreurs**
   - Si la réponse n’est pas `2xx`, afficher un message texte sous la liste ou sous le formulaire.

**Livrable :**

- Une vue « Tâches » fonctionnelle, qui illustre les principaux cas d’usage (création, assignation, complétion, réouverture, suppression) en passant **uniquement** par l’API Gateway.

---

## Jeremy – Front minimal « Notifications » via Gateway

**Responsable :** Jeremy

**Périmètre :** exposer une vue très simple des notifications utilisateur via `GET /api/notifications` du Gateway, et préparer les scénarios E2E principaux.

**À faire (quoi) :**

1. **Vue liste de notifications**
   - Ajouter un bloc ou une page « Notifications » qui :
     - appelle périodiquement (ou sur action manuelle type bouton « Rafraîchir ») `GET ${apiBaseUrl}/api/notifications` avec `credentials: "include"`.
     - affiche une liste texte des notifications (un item par ligne, avec l’info principale : type, message, date).

2. **Scénario de test manuel**
   - Documenter dans la phase ou le README du front un scénario de test :
     - Connexion avec un user A, création / assignation / complétion de tâche impliquant un user B.
     - Connexion en tant que B, puis clic sur « Rafraîchir » → la vue « Notifications » doit afficher les notifications correspondantes (même si c’est juste du texte brut).

3. **Scénarios E2E automatisés (à implémenter dans la suite de la phase)**
   - Ajouter au moins **2 tests E2E** (Playwright déjà présent dans le repo) qui passent **par le Gateway et le front** :
     - **Scénario 1 – Assignation avec notification :**
       - User A crée un projet via le front (Gateway → `project-service`).
       - User B rejoint le projet.
       - User A crée une tâche et l’assigne à B.
       - User B se connecte, ouvre la vue « Notifications » et voit au moins une notification liée à cette assignation.
     - **Scénario 2 – Complétion sans notification (règle de non auto-notif) :**
       - User B complète sa propre tâche (cas où le `notification-service` ne doit pas notifier l’acteur).
       - La vue « Notifications » pour B ne doit pas contenir de nouvelle notification liée à cette action.

**Livrable :**

- Une vue de notifications très simple mais branchée de bout en bout sur le `notification-service` via l’API Gateway.
- Deux scénarios E2E documentés et implémentés (tests Playwright) couvrant :
  - au moins un cas avec notification attendue (assignation),
  - au moins un cas sans notification (complétion par l’acteur lui‑même ou cas équivalent).

---

## Règles communes

- **Frontend ultra basique** :
  - Pas de refonte design.
  - Pas de routing complexe, pas de state management avancé.
  - Composants React simples, formulaires HTML natifs, listes `<ul>` ou `<table>`.
- **Un seul point d’entrée API** :
  - Tous les appels front → `${apiBaseUrl}/api/...` (via le Gateway).
  - Aucun appel direct aux services internes ou au monolithe pour les nouvelles fonctionnalités (projets, tâches, notifications).
- **Gestion minimale des erreurs** :
  - Messages texte, pas de systèmes d’alertes avancés.
- **Alignement avec les use cases** :
  - Ne pas réimplémenter de règles métier côté front.
  - Laisser `project-service`, `task-service`, `notification-service` décider et retourner les erreurs métiers.

---

## Critères de validation

- Le frontend ne fait plus aucun appel à `/items` pour la logique principale de projets/tâches.
- Toutes les fonctionnalités de base suivantes passent par l’API Gateway :
  - Authentification (`/api/auth/*`).
  - Consultation / création de projets (`/api/projects/...`).
  - Consultation / gestion de tâches (`/api/tasks/...`).
  - Consultation des notifications (`/api/notifications`).
- L’UI reste volontairement simple, mais permet un flux bout-en-bout :
  - Se connecter.
  - Créer un projet.
  - Créer une tâche dans ce projet.
  - L’assigner / la compléter / la réouvrir.
  - Voir les notifications générées.
- Ajouter au moins **2 scénarios E2E principaux** (via Playwright ou équivalent), en s’appuyant sur le Gateway :
  - Assignation d’une tâche avec notification attendue (user A assigne à user B → B voit une notification).
  - Complétion d’une tâche sans notification (cas où les règles du `notification-service` ne doivent pas notifier l’acteur).
- Docker Compose démarre toute la stack (`api-gateway` en front door), et le front consomme **uniquement** le Gateway pour ces opérations.

