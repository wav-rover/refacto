## Règles métier – `notification-service`

Ce document reflète **l’implémentation actuelle** de `notification-service`.

### Objectif

- Réagir aux événements métier émis par les autres services (`task-service`, `project-service`, etc.).
- Décider **qui** doit être notifié et **avec quel message**.
- Appliquer des règles transverses (notamment : pas d’auto‑notification).

### Principes généraux

- `notification-service` :
  - ne contient pas de logique métier propre aux tâches ou projets ;
  - interprète des événements métier et les transforme en notifications utilisateur ;
  - n’est jamais appelé directement par les autres services (seule intégration via broker d’événements).
- Règle centrale :
  - une notification n’est créée que si `actionUserId !== targetUserId` (enforcée dans `createNotificationIfAllowed`).

### Modèle de notification (implémenté)

- Champs persistés :
  - `id`
  - `userId` (destinataire)
  - `message`
  - `type` (`'TaskAssigned' | 'TaskCompleted' | 'TaskReopened' | 'TaskDeleted' | 'ProjectClosed' | 'MemberAddedToProject'`)
  - `createdAt`

### Événements consommés

- Depuis `task-service` :
  - `TaskAssigned`
  - `TaskCompleted`
  - `TaskReopened`
  - `TaskDeleted`
- Depuis `project-service` :
  - `ProjectClosed`
- L’événement `MemberAddedToProject` est déclaré dans le type mais est aujourd’hui traité comme **NOOP** (aucune notification créée).

### Mapping événements → destinataires (implémenté)

- `TaskAssigned` :
  - destinataire : `assignedTo` (si présent) ;
  - message : `"Task \"<title>\" was assigned to you"` si `title` est fourni, sinon `"A task was assigned to you"` ;
  - la règle `actionUserId !== targetUserId` évite l’auto‑notification.

- `TaskCompleted` :
  - destinataire principal : `projectOwnerId` ;
  - destinataire secondaire : `assignedTo` si présent et différent de `actionUserId` ;
  - message : `"A task was completed"`.

- `TaskReopened` :
  - destinataire principal : `projectOwnerId` ;
  - destinataire secondaire : `assignedTo` si présent et différent de `actionUserId` ;
  - message : `"A task was reopened"`.

- `TaskDeleted` :
  - destinataire principal : `projectOwnerId` ;
  - destinataire secondaire : `assignedTo` si présent ;
  - message : `"A task was deleted"`.

- `ProjectClosed` :
  - destinataires : tous les `memberIds` du projet ;
  - message : `"Project was closed"`.

- `MemberAddedToProject` :
  - implémentation actuelle : **aucune notification** (NOOP).

### Intégration technique

- `notification-service` :
  - écoute l’`EventBus` (Redis Streams ou InMemory) pour les types d’événements ci‑dessus ;
  - applique des garde‑fous de payload (type‑guards sur `actionUserId`, `assignedTo`, `projectOwnerId`, `memberIds`, etc.) avant d’appeler `createNotificationIfAllowed` ;
  - persiste les notifications dans une base SQLite (`data/notification-service.db` par défaut) ;
  - expose `GET /notifications`, qui retourne les notifications du user courant (`X-User-Id`) triées par `createdAt` décroissant.

