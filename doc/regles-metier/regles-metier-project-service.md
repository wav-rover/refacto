## Règles métier – `project-service`

Ce document décrit les règles métier **telles qu’implémentées aujourd’hui** dans `project-service`, plus quelques règles **cibles** non encore codées mais envisagées.

### Rôles et responsabilités

- Un projet possède exactement un responsable (`chef de projet`) identifié par `ownerId`.
- Le créateur du projet est le chef de projet et ce rôle ne change pas ensuite.
- Tous les autres membres du projet ont simplement le rôle `user`.

### Création de projet

- Un projet doit avoir :
  - un `name` non vide (trimé, sinon rejet `INVALID_INPUT`) ;
  - un `ownerId` non vide (string non vide).
- Implémentation actuelle (`createProject` + repo SQLite) :
  - le créateur devient `ownerId` ;
  - il est automatiquement ajouté comme **seul membre initial** (`memberIds = [ownerId]`) ;
  - le projet est créé avec `status = 'open'` et `createdAt` (ISO 8601).
- Contrôles non implémentés (cibles) :
  - vérifier que `ownerId` correspond à un utilisateur réel dans `auth-service` ;
  - propager des événements spécifiques de création si besoin.

### Gestion des membres

- Implémenté :
  - **ajout** : seul le chef de projet peut ajouter un membre (`addMember` vérifie `currentUserId === ownerId`) ;
  - **retrait** :
    - seul le chef peut retirer un membre ;
    - il est interdit de retirer le chef de projet lui‑même ;
    - retirer un utilisateur qui n’est pas membre renvoie une erreur.
- Non implémenté mais cible métier :
  - ne pas autoriser le retrait d’un membre s’il possède encore des tâches de ce projet (coordination prévue avec `task-service` ou un read model).

### Modification du projet

- Implémenté (`updateProject`) :
  - seul le chef de projet peut modifier les métadonnées (actuellement : `name`) ;
  - si le projet est en statut `closed`, toute tentative de modification renvoie un conflit (`CONFLICT`) ;
  - si un nouveau `name` est fourni et qu’il est vide une fois trimé, la mise à jour est rejetée (`INVALID_INPUT`).

### Clôture de projet

- Implémenté (`closeProject`) :
  - seul le chef de projet peut clôturer ;
  - si le projet n’existe pas : `NOT_FOUND` ;
  - si le projet est déjà `closed` : `CONFLICT` ;
  - sinon :
    - le projet passe en statut `closed` ;
    - un événement `ProjectClosed` est publié sur l’`EventBus` avec :
      - `projectId`, `closedAt`, `closedByUserId`, `memberIds`.
- Non implémenté mais cible métier :
  - vérifier que **toutes les tâches** associées sont terminées (`task-service`) avant de clôturer ;
  - interdire la création/réouverture de tâches sur un projet `closed` côté `task-service`.

### Suppression de projet

- Règle cible (non codée à ce jour) :
  - seul un chef de projet peut demander la suppression d’un projet ;
  - la suppression doit gérer la suppression ou l’archivage des tâches associées (coordination avec `task-service`).
- Implémentation actuelle :
  - aucune route ni use case de suppression n’est exposé dans `project-service`.

### Intégration avec les autres services

- `project-service` ne connaît pas les détails d’implémentation de `task-service` ni de `notification-service`.
- Implémentation actuelle :
  - il **publie** l’événement `ProjectClosed` vers un `EventBus` (Redis ou InMemory) ;
  - il ne consomme encore **aucun** événement externe ;
  - les règles croisées (tâches restantes pour un membre, interdiction d’actions quand le projet est fermé, etc.) sont gérées soit par le gateway/tests, soit prévues pour de futures évolutions via événements/read models.

