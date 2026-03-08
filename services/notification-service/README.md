# notification-service – Notifications métier (Phase 3)

Service dédié à la réaction aux événements métier émis par les autres services. Il ne contient pas de logique métier propre aux tâches ou projets ; il interprète des événements et les transforme en notifications utilisateur. Il n’est jamais appelé directement par les autres services (communication via broker, phase 4). Référence : [regles-metier-notification-service](../../doc/regles-metier-notification-service.md).

## Règle métier

- **Pas d’auto-notification** : une notification n’est créée que si `actionUserId !== targetUserId`.

## Modèle de notification

- `id` : identifiant unique
- `userId` : destinataire (destinataire de la notification)
- `message` : texte du message
- `type` : type d’événement (TaskAssigned, TaskCompleted, TaskReopened, TaskDeleted, ProjectClosed, MemberAddedToProject)
- `createdAt` : date de création (ISO string)

## Mapping événements → destinataires (prévu pour phase 4)

| Événement | Destinataire(s) principal(aux) | Destinataire(s) secondaire(s) |
|-----------|-------------------------------|-------------------------------|
| TaskAssigned | Utilisateur assigné | Chef de projet |
| TaskCompleted | Chef de projet | Utilisateur assigné (si complétion par un autre) |
| TaskReopened | Chef de projet | Utilisateur assigné (si différent de l’actionneur) |
| TaskDeleted | Chef de projet, utilisateur assigné si présent | — |
| ProjectClosed | Tous les membres du projet | — |
| MemberAddedToProject | Nouvel utilisateur ajouté | Chef de projet / autres membres (selon politique) |

## Endpoints

### GET /notifications

Liste les notifications du utilisateur courant.

- **Headers** : `X-User-Id` (obligatoire)
- **Réponse** : `200` – tableau de notifications (`id`, `userId`, `message`, `type`, `createdAt`)
- **401** : header `X-User-Id` absent

La création des notifications se fait uniquement via les handlers d’événements (phase 4) ; il n’y a pas de route POST en phase 3.

## Persistance

- **Port** : `NotificationRepository` (voir `src/ports/notificationRepository.ts`).
- **Implémentations** : SQLite (prod / dev) et InMemory (tests).
- Choix dans `src/persistence/index.ts` selon `NODE_ENV === 'test'`.

## Structure EventBus

- **Port** : `EventBus` (`src/ports/eventBus.ts`) avec `subscribe`, `start`, `stop`.
- **Handlers** : `src/handlers/index.ts` définit les types d’événements et la fonction `registerHandlers` pour les enregistrer sur un EventBus.
- En **phase 3** : une fausse implémentation (InMemoryEventBus, `src/eventBus/inMemory.ts`) est branchée au démarrage : pas de Redis, mais `registerHandlers` est appelé et les handlers sont enregistrés. Méthode `emit` exposée pour les tests d’intégration (simuler la réception d’un événement).
- En **phase 4** : injection d’une implémentation Redis (souscription au broker), et les handlers appelleront `createNotificationIfAllowed` pour créer les notifications.

## Variables d’environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| PORT | Port HTTP du service | 3003 |
| NOTIFICATION_SQLITE_DB_LOCATION | Chemin du fichier SQLite | `data/notification-service.db` (relatif au repo depuis `dist/`) |
| REDIS_URL | URL du broker Redis (phase 4) | redis://redis:6379 |

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
