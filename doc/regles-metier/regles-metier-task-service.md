## Règles métier – `task-service`

Ce document reflète **l’implémentation actuelle** de `task-service` et les règles cibles non encore codées.

### Modèle de tâche (implémenté)

Une tâche possède au minimum :

- `id`
- `title` (non vide, trimé à la création et en mise à jour)
- `projectId`
- `createdBy`
- `assignedTo` (`string | null`, au plus un utilisateur)
- `completed` (`boolean`)
- `status` (`'todo' | 'in_progress' | 'done'`)
- `priority` (`'low' | 'medium' | 'high'`)
- `dueDate` (`string | null`)
- `createdAt` (`string`, ISO 8601)

### Périmètre d’un projet

- Implémenté :
  - toute tâche est liée à un projet via `projectId` ;
  - `projectId` doit être une string non vide (sinon `INVALID_INPUT`).
- Non implémenté mais cible :
  - vérifier que le projet existe dans `project-service` ;
  - interdire la création/réouverture/suppression si le projet est `closed` (à ce jour, `task-service` ne consomme pas `ProjectClosed`).

### Affectation des tâches

- Une tâche peut être non assignée ou assignée à **exactement un** utilisateur (`assignedTo`).
- Implémenté :
  - **règle de capacité** : une seule tâche **active** (`status !== 'done'`) par personne au global :
    - à la création, si `assignedTo` est fourni, on vérifie l’absence d’autre tâche active pour cet utilisateur ;
    - lors de `assignTask`, on vérifie aussi cette contrainte (sinon `CONFLICT`).
  - une tâche terminée (`status = 'done'`) ne peut pas être assignée ni désassignée.
- Non implémenté mais cible :
  - vérifier que `assignedTo` existe dans `auth-service` ;
  - vérifier que `assignedTo` est membre du projet côté `project-service`.

### Création de tâche (`createTask`)

- Invariants implémentés :
  - `title` non vide (trimé) ;
  - `projectId` non vide ;
  - `createdBy` non vide ;
  - si `assignedTo` est fourni, règle de capacité vérifiée.
- Valeurs par défaut :
  - `status = 'todo'` si absent ;
  - `priority = 'medium'` si absente ;
  - `dueDate = null` si absente.
- Événement publié :
  - `TaskCreated` avec au minimum `taskId`, `projectId`, `createdBy`, `title` et éventuellement `assignedTo`.

### Mise à jour de tâche (`updateTask`)

- Implémenté :
  - la tâche doit exister (`NOT_FOUND` sinon) ;
  - si la tâche est `status = 'done'`, toute mise à jour est refusée (`CONFLICT`) ;
  - si un `title` est fourni, il est trimé et ne peut pas être vide (`INVALID_INPUT`) ;
  - `status`, `priority`, `dueDate` peuvent être mis à jour.
- Non implémenté mais cible :
  - empêcher la mise à jour si le projet est `closed` (info à remonter via événements/read model) ;
  - éventuellement publier un événement `TaskUpdated` (absent aujourd’hui).

### Terminer, réouvrir, supprimer

- **Terminer (`completeTask`)** :
  - si la tâche n’existe pas : `NOT_FOUND` ;
  - si elle est déjà `done`, l’appel est idempotent (on renvoie la tâche telle quelle) ;
  - sinon, la tâche passe en `status = 'done'`, `completed = true` ;
  - publication d’un événement `TaskCompleted` avec `taskId`, `projectId`, `actionUserId`, `projectOwnerId` et éventuellement `assignedTo`.

- **Réouvrir (`reopenTask`)** :
  - la tâche doit exister (`NOT_FOUND` sinon) ;
  - si elle n’est pas `done`, l’appel est idempotent ;
  - sinon, la tâche passe en `status = 'todo'`, `completed = false` ;
  - publication d’un événement `TaskReopened` avec `taskId`, `projectId`, `actionUserId`, `projectOwnerId` et éventuellement `assignedTo`.
  - contrôle non implémenté mais cible : refuser la réouverture si le projet est `closed`.

- **Supprimer (`deleteTask`)** :
  - la tâche doit exister (`NOT_FOUND` sinon) ;
  - suppression **physique** en base (pas de soft delete) ;
  - publication d’un événement `TaskDeleted` avec `taskId`, `projectId`, `actionUserId`, `projectOwnerId` et éventuellement `assignedTo`.
  - contrôle non implémenté mais cible : refuser la suppression si le projet est `closed`.

### Désassignation (`unassignTask`)

- La tâche doit exister (`NOT_FOUND` sinon).
- Interdit si `status = 'done'` (`CONFLICT`).
- Sinon, `assignedTo` est mis à `null`. Aucun événement n’est publié aujourd’hui pour la désassignation.

### Intégration avec les autres services

- `task-service` publie les événements suivants (implémentés) :
  - `TaskCreated`
  - `TaskAssigned`
  - `TaskCompleted`
  - `TaskReopened`
  - `TaskDeleted`
- Il ne consomme actuellement **aucun** événement externe (`ProjectClosed`, etc.).
- `notification-service` consomme ces événements pour créer des notifications selon ses propres règles (notamment « pas d’auto‑notification »).

