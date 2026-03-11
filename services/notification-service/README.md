# notification-service – Notifications métier (Phase 4)

Service dédié à la réaction aux événements métier émis par les autres services. Il ne contient pas de logique métier propre aux tâches ou projets ; il interprète des événements et les transforme en notifications utilisateur. Il n’est jamais appelé directement par les autres services (communication via broker Redis Streams). Référence : [regles-metier-notification-service](../../doc/regles-metier-notification-service.md).

**Contrat des événements** : types et payloads définis dans [contrat-evenements.md](../../doc/architecture/contrat-evenements.md).

## Règle métier

- **Pas d’auto-notification** : une notification n’est créée que si `actionUserId !== targetUserId`.

## Modèle de notification

- `id` : identifiant unique
- `userId` : destinataire (destinataire de la notification)
- `message` : texte du message
- `type` : type d’événement (TaskAssigned, TaskCompleted, TaskReopened, TaskDeleted, ProjectClosed, MemberAddedToProject)
- `createdAt` : date de création (ISO string)

## Événements consommés

Le service s’abonne au stream Redis (consumer group `notification-service`) et traite les types suivants : **TaskAssigned**, **TaskCompleted**, **TaskReopened**, **TaskDeleted**, **ProjectClosed**. Le type `TaskCreated` est ignoré (aucune notification prévue). Format des messages : [contrat-evenements.md](../../doc/architecture/contrat-evenements.md).

## Mapping événements → destinataires

| Événement | Destinataire(s) | Règle |
|-----------|-----------------|--------|
| TaskAssigned | `assignedTo` | 1 notification (pas si actionUserId === assignedTo) |
| TaskCompleted | `projectOwnerId` ; optionnellement `assignedTo` si ≠ actionUserId | Chef de projet + ancien assigné si différent de l’actionneur |
| TaskReopened | Idem TaskCompleted | Chef de projet + assigné si différent |
| TaskDeleted | `projectOwnerId` et `assignedTo` si présent | Une notification par destinataire |
| ProjectClosed | Chaque id dans `memberIds` | Une notification par membre (pas si membre === closedByUserId) |

## Endpoints

### GET /notifications

Liste les notifications du utilisateur courant.

- **Headers** : `X-User-Id` (obligatoire)
- **Réponse** : `200` – tableau de notifications (`id`, `userId`, `message`, `type`, `createdAt`)
- **401** : header `X-User-Id` absent

La création des notifications se fait uniquement via les handlers d’événements (souscription au broker) ; il n’y a pas de route POST.

## Persistance

- **Port** : `NotificationRepository` (voir `src/ports/notificationRepository.ts`).
- **Implémentations** : SQLite (prod / dev) et InMemory (tests).
- Choix dans `src/persistence/index.ts` selon `NODE_ENV === 'test'`.

## Structure EventBus

- **Port** : `EventBus` (`src/ports/eventBus.ts`) avec `subscribe`, `start`, `stop`.
- **Handlers** : `src/handlers/index.ts` enregistre les handlers via `registerHandlers(eventBus, repo)` ; chaque handler appelle `createNotificationIfAllowed` pour créer les notifications.
- **Implémentations** : `createInMemoryEventBus()` (tests, ou lorsque `REDIS_URL` est absent) ; `createRedisEventBus(redisUrl, streamName)` lorsque `REDIS_URL` est défini — souscription au stream via consumer group, dispatch par `type`, XACK après succès. Barrel : `src/eventBus/index.ts`.

## Variables d’environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| PORT | Port HTTP du service | 3003 |
| NOTIFICATION_SQLITE_DB_LOCATION | Chemin du fichier SQLite | `data/notification-service.db` (relatif au repo depuis `dist/`) |
| REDIS_URL | URL du broker Redis (obligatoire pour consommer en prod) | — (si absent, InMemoryEventBus utilisé) |
| REDIS_STREAM_NAME | Nom du stream Redis | `todo:events` |

## Lancement

```bash
cd services/notification-service
npm install
npm run build
npm start
```

Développement : `npm run dev`. Tests : `npm test` (Jest, `NODE_ENV=test` → InMemory).

## Docker

```bash
docker build -t notification-service ./services/notification-service
docker run -p 3003:3003 notification-service
```

Avec volume pour la base :

```bash
docker run -p 3003:3003 -v notification-data:/app/data -e NOTIFICATION_SQLITE_DB_LOCATION=/app/data/notification-service.db notification-service
```
