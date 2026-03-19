# Contrat des événements métier (Phase 4)

Document partagé qui fixe les types d’événements, les payloads et les conventions Redis Streams pour la communication entre task-service, project-service et notification-service. Référence : [Phase 4 – Communication événementielle](../phases/refacto-2-archi/phase-4-communication-evenementielle-repartition-taches.md).

---

## 1. Liste des types d’événements

- `TaskCreated`
- `TaskAssigned`
- `TaskCompleted`
- `TaskReopened`
- `TaskDeleted`
- `ProjectClosed`

---

## 2. Payload par type

Champs attendus pour chaque type, alignés avec les règles métier ([task](../regles-metier/regles-metier-task-service.md), [project](../regles-metier/regles-metier-project-service.md), [notification](../regles-metier/regles-metier-notification-service.md)).

| Type | Champs | Description |
|------|--------|-------------|
| **TaskCreated** | `taskId`, `projectId`, `createdBy`, `title`, `assignedTo?` | Création de tâche. Optionnel : `assignedTo` si affectation initiale. Le notification-service peut ignorer ce type si aucune notification n’est prévue. |
| **TaskAssigned** | `taskId`, `projectId`, `actionUserId`, `assignedTo`, `title?` | Qui assigne (`actionUserId`), destinataire = `assignedTo` (targetUserId). |
| **TaskCompleted** | `taskId`, `projectId`, `actionUserId`, `assignedTo?`, `projectOwnerId` | Qui marque terminé (`actionUserId`). Destinataire principal = `projectOwnerId` (chef de projet) ; optionnel `assignedTo` (ancien assigné). |
| **TaskReopened** | `taskId`, `projectId`, `actionUserId`, `projectOwnerId`, `assignedTo?` | Même logique que TaskCompleted pour les destinataires. |
| **TaskDeleted** | `taskId`, `projectId`, `actionUserId`, `projectOwnerId`, `assignedTo?` | Destinataires : `projectOwnerId` et `assignedTo` si présent. |
| **ProjectClosed** | `projectId`, `closedAt`, `closedByUserId`, `memberIds` | `closedByUserId` = actionUserId ; `memberIds` = tableau d’IDs des membres du projet (destinataires). |

Tous les champs listés sans `?` sont obligatoires. Les champs optionnels peuvent être absents du payload.

---

## 3. Convention Redis Streams

- **Nom du stream** : une seule stream pour tous les types. Nom par défaut : `todo:events`. Configurable via la variable d’environnement `REDIS_STREAM_NAME` (défaut : `todo:events`). Le champ `type` dans chaque message permet de router vers les handlers.

- **Structure du message** dans le stream : chaque entrée contient un objet JSON avec :
  - `type` (string) : un des types listés ci-dessus.
  - `payload` (object) : les champs décrits au § 2.
  - `timestamp` (string) : date ISO 8601 (ex. `2026-03-08T12:00:00.000Z`).

- **Variables d’environnement** :
  - `REDIS_URL` (obligatoire en prod pour publier/consommer) : ex. `redis://localhost:6379`, `redis://redis:6379` (Docker).
  - `REDIS_STREAM_NAME` (optionnel) : nom du stream ; défaut `todo:events`.

Référence : [ADR 003 – Broker Redis](../adr/adr-003-broker-redis-vs-rabbitmq.md) (utilisation des Redis Streams, pas uniquement Pub/Sub).

---

## 4. Exemples JSON par type (validation croisée)

Les services peuvent s’appuyer sur ces exemples pour valider la forme des messages.

**TaskCreated**

```json
{
  "type": "TaskCreated",
  "payload": {
    "taskId": "task-1",
    "projectId": "project-1",
    "createdBy": "user-a",
    "title": "Implement login",
    "assignedTo": "user-b"
  },
  "timestamp": "2026-03-08T12:00:00.000Z"
}
```

**TaskAssigned**

```json
{
  "type": "TaskAssigned",
  "payload": {
    "taskId": "task-1",
    "projectId": "project-1",
    "actionUserId": "user-a",
    "assignedTo": "user-b",
    "title": "Implement login"
  },
  "timestamp": "2026-03-08T12:05:00.000Z"
}
```

**TaskCompleted**

```json
{
  "type": "TaskCompleted",
  "payload": {
    "taskId": "task-1",
    "projectId": "project-1",
    "actionUserId": "user-b",
    "assignedTo": "user-b",
    "projectOwnerId": "user-a"
  },
  "timestamp": "2026-03-08T14:00:00.000Z"
}
```

**TaskReopened**

```json
{
  "type": "TaskReopened",
  "payload": {
    "taskId": "task-1",
    "projectId": "project-1",
    "actionUserId": "user-a",
    "projectOwnerId": "user-a",
    "assignedTo": "user-b"
  },
  "timestamp": "2026-03-08T15:00:00.000Z"
}
```

**TaskDeleted**

```json
{
  "type": "TaskDeleted",
  "payload": {
    "taskId": "task-1",
    "projectId": "project-1",
    "actionUserId": "user-a",
    "projectOwnerId": "user-a",
    "assignedTo": "user-b"
  },
  "timestamp": "2026-03-08T16:00:00.000Z"
}
```

**ProjectClosed**

```json
{
  "type": "ProjectClosed",
  "payload": {
    "projectId": "project-1",
    "closedAt": "2026-03-08T17:00:00.000Z",
    "closedByUserId": "user-a",
    "memberIds": ["user-a", "user-b", "user-c"]
  },
  "timestamp": "2026-03-08T17:00:00.000Z"
}
```

---

Une fois ce document validé par l’équipe (Paul, Tristan, Jeremy), les implémentations task-service (publication), project-service (publication ProjectClosed / écoute) et notification-service (souscription) s’y alignent.
