## Règles métier – `task-service`

Ce document détaille les règles métier propres au service de gestion des tâches.

### Modèle de tâche

- Une tâche possède au minimum :
  - `id`
  - `title` (non vide)
  - `projectId`
  - `createdBy`
  - `assignedTo` (optionnel mais au plus un utilisateur)
  - `completed` (boolean)
  - `status` (`todo`, `in_progress`, `done`)
  - `priority` (`low`, `medium`, `high`)
  - `dueDate` (optionnelle, date d’échéance ou `null`)

### Périmètre d’un projet

- Toute tâche est liée à un projet existant via `projectId`.
- Le `task-service` ne peut pas créer de tâche pour un projet inexistant.
- Les règles de cycle de vie d’un projet (ouvert/fermé) influent directement sur ce que l’on peut faire avec les tâches :
  - impossible de créer une nouvelle tâche si le projet est `closed` ;
  - impossible de réouvrir une tâche si le projet est `closed`.

### Affectation des tâches

- Une tâche peut être non assignée ou assignée à **exactement un** utilisateur (`assignedTo`).
- L’utilisateur assigné doit :
  - exister dans le `user-service` ;
  - être membre du projet correspondant (validation via `project-service` ou read model).
- Règle de capacité : **une seule tâche active par personne au global**  
  (par exemple, une seule tâche avec `status !== done` pour un `assignedTo` donné).
- Toute affectation réussie déclenche un événement `TaskAssigned`.

Le `project-service` garantit qu’un membre ne peut pas être retiré d’un projet tant qu’au moins une tâche de ce projet lui est assignée, ce qui évite toute tâche pointant vers un utilisateur externe au projet.

### Création de tâche

- Invariants à la création :
  - le projet est `open` ;
  - le titre est non vide ;
  - si une affectation initiale existe, elle respecte les règles d’affectation ci-dessus.
- La création réussie publie un événement `TaskCreated`.

### Modification de tâche

- Les modifications possibles (titre, description, statut, priorité, dueDate, etc.) sont centralisées dans un use case `UpdateTask`.
- Seules les tâches non clôturées (`status !== done` et projet non `closed`) peuvent être modifiées.
- Une modification significative peut publier un événement `TaskUpdated` si d’autres services doivent réagir.

### Cycle de vie et suppression de la tâche

- États possibles pour `status` :
  - `todo` : créée, éventuellement non assignée ;
  - `in_progress` : en cours ;
  - `done` : terminée.
- Les transitions exactes entre ces états sont laissées à l’implémentation tant qu’elles respectent les règles de projet  
  (par exemple, pas de réouverture si le projet est `closed`).

### Suppression de tâche

- Les tâches sont supprimées **physiquement** (suppression de la ligne en base).
- Le `task-service` ne porte pas de logique d’autorisation fine : tout utilisateur authentifié peut créer, mettre à jour, supprimer ou (dés)assigner une tâche d’un projet auquel il a accès.
- Le projet doit être `open` (sauf traitement technique/audit).
- Une suppression peut publier un événement `TaskDeleted` si d’autres services doivent réagir (notifications, reporting, etc.).

### Intégration avec les autres services

- Le `task-service` publie les événements suivants (liste indicative) :
  - `TaskCreated`
  - `TaskAssigned`
  - `TaskCompleted`
  - `TaskReopened`
  - `TaskDeleted`
- Il consomme au besoin :
  - des événements liés aux projets (par exemple `ProjectClosed`) pour verrouiller certaines transitions.
- Il ne connaît pas les détails de la logique de notification : il se contente de publier des événements métier.
