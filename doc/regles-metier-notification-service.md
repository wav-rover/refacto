## Règles métier – `notification-service`

Ce document détaille les règles métier propres au service de notifications.

### Objectif

- Réagir aux événements métier émis par les autres services (`task-service`, `project-service`, etc.).
- Décider **qui** doit être notifié et **avec quel message**.
- Appliquer des règles transverses (notamment pas d’auto-notification).

### Principes généraux

- Le `notification-service` :
  - ne contient pas de logique métier propre aux tâches ou projets ;
  - ne fait qu’interpréter des événements métier et les transformer en notifications utilisateur ;
  - n’est jamais appelé directement par les autres services (pas de couplage fort, uniquement via le broker).
- Règle générale :
  - une notification n’est créée que si `actionUserId !== targetUserId`.

### Modèle de notification

- Modèle métier minimal :
  - `message: Text`
  - `type: NotificationType` (Value Object)
  - `coordonnees: NotificationCoordonnees` (Value Object)

### Détails de persistance (optionnels)

- Champs typiques pour le stockage :
  - `id`
  - `userId` (destinataire)
  - `message`
  - `type`
  - `createdAt`

### Événements consommés (exemples)

- Depuis `task-service` :
  - `TaskAssigned`
  - `TaskCompleted`
  - `TaskReopened`
  - `TaskDeleted` / `TaskCancelled`
- Depuis `project-service` :
  - `ProjectClosed`
  - éventuellement `MemberAddedToProject`, `MemberRemovedFromProject`, etc.

### Mapping événements → destinataires (vue d’ensemble)

> Les détails exacts par type d’événement peuvent évoluer ; cette section donne les grandes lignes.

- `TaskAssigned` :
  - destinataire principal : utilisateur assigné ;
  - destinataire secondaire possible : chef de projet.
- `TaskCompleted` :
  - destinataire principal : chef de projet ;
  - destinataire secondaire possible : utilisateur initialement assigné si la complétion est réalisée par un autre.
- `TaskReopened` :
  - destinataire principal : chef de projet ;
  - destinataire secondaire possible : utilisateur assigné si différent de l’actionneur.
- `TaskDeleted` / `TaskCancelled` :
  - destinataires : chef de projet et utilisateur assigné si présent.
- `ProjectClosed` :
  - destinataires : tous les membres du projet (ou sous-ensemble défini par les besoins).
- `MemberAddedToProject` :
  - destinataire principal : nouvel utilisateur ajouté ;
  - destinataire secondaire : éventuellement chef de projet ou autres membres selon la politique choisie.

### Intégration technique

- Le `notification-service` :
  - écoute le broker sur des sujets/queues dédiés aux événements métier ;
  - transforme ces messages en notifications persistées ;
  - peut publier des événements secondaires (`NotificationCreated`, `NotificationRead`, etc.) si d’autres briques doivent réagir.
