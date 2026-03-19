# project-service – Gestion des projets et des membres

Service dédié à la création et à la gestion des projets et de leurs membres. Référence métier : [regles-metier-project-service](../../doc/regles-metier/regles-metier-project-service.md).

## Identification de l’utilisateur courant

En phase 3, l’utilisateur courant n’est pas géré par session ni JWT dans ce service. Il est transmis par le **header `X-User-Id`** (posé par le client après login ou par le futur gateway). Toutes les routes qui modifient des données (création, mise à jour, clôture, ajout/retrait de membre) exigent ce header ; sinon la réponse est `401 Unauthorized`.

## Endpoints

Les routes protégées nécessitent le header : `X-User-Id: <userId>`.

### POST /projects

Crée un projet. L’appelant devient chef de projet et est ajouté comme membre.

- **Headers** : `X-User-Id` (obligatoire), `Content-Type: application/json`
- **Body JSON** : `{ "name": "Mon projet" }`
- **Réponses** :
  - `201` : projet créé (objet projet avec `id`, `name`, `ownerId`, `memberIds`, `status`, `createdAt`)
  - `400` : nom manquant ou vide
  - `401` : header `X-User-Id` absent

### GET /projects

Liste tous les projets.

- **Réponse** : `200` – tableau de projets.

### GET /projects/:id

Détail d’un projet.

- **Réponses** : `200` (projet) ou `404` (projet introuvable).

### PATCH /projects/:id

Met à jour les métadonnées du projet (ex. nom). Réservé au chef de projet. Interdit si le projet est clôturé.

- **Headers** : `X-User-Id` (obligatoire)
- **Body JSON** : `{ "name": "Nouveau nom" }`
- **Réponses** : `200` (projet mis à jour), `400` (nom vide), `401`, `403` (pas chef de projet), `404`, `409` (projet clôturé).

### POST /projects/:id/close

Clôture le projet. Réservé au chef de projet. À la clôture réussie, le service publie l’événement `ProjectClosed` sur le broker (voir Phase 4 ci-dessous).

- **Headers** : `X-User-Id` (obligatoire)
- **Réponses** : `200` (projet clôturé), `401`, `403`, `404`, `409` (déjà clôturé).

### POST /projects/:id/members

Ajoute un membre au projet. Réservé au chef de projet. Un utilisateur ne peut pas être ajouté deux fois.

- **Headers** : `X-User-Id` (obligatoire)
- **Body JSON** : `{ "userId": "uuid-du-membre" }`
- **Réponses** : `200` (projet mis à jour), `400` (userId manquant), `401`, `403`, `404`, `409` (déjà membre).

### DELETE /projects/:id/members/:userId

Retire un membre du projet. Réservé au chef de projet. Le chef ne peut pas être retiré. En phase 3, la vérification « le membre n’a plus aucune tâche assignée » n’est pas branchée (prévue en phase 4).

- **Headers** : `X-User-Id` (obligatoire)
- **Réponses** : `200` (projet mis à jour), `401`, `403`, `404`.

## Règles métier appliquées

- Un projet a un **chef de projet** (`ownerId`) ; le créateur est automatiquement chef et membre.
- Seul le chef peut : ajouter/retirer des membres, modifier les métadonnées, clôturer le projet.
- Modifications interdites si le projet est en statut `closed`.
- Pas d’ajout en double d’un même membre ; le chef ne peut pas être retiré.
- Coordination avec le task-service (retrait membre si tâches assignées, clôture si toutes les tâches terminées) : prévue en phase 4 (événements / read model).

## Phase 4 – Communication événementielle

- **Événement publié** : `ProjectClosed` lorsque le projet est clôturé (use case close réussi). Payload : `projectId`, `closedAt` (ISO 8601), `closedByUserId`, `memberIds` (IDs des membres du projet).
- **Contrat** : [contrat des événements](../../doc/architecture/contrat-evenements.md) (format des messages, nom du stream, variables d’environnement Redis).

## Variables d’environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port HTTP du service | `3001` |
| `PROJECT_SQLITE_DB_LOCATION` | Chemin du fichier SQLite (projets + membres) | `data/project-service.db` (relatif au repo depuis `dist/`) |
| `REDIS_URL` | URL Redis pour la publication d’événements (stream) | — (si absent, publication en mémoire uniquement) |
| `REDIS_STREAM_NAME` | Nom du stream Redis pour les événements métier | `todo:events` |

En Docker, pour persister les données, monter un volume sur le répertoire contenant le fichier DB (ex. `/app/data`) et définir `PROJECT_SQLITE_DB_LOCATION=/app/data/project-service.db`.

## Persistance

- **Port** : `ProjectRepository` (voir `src/ports/projectRepository.ts`).
- **Implémentations** : SQLite (prod / dev) et InMemory (tests). Le choix est fait dans `src/persistence/index.ts` selon `NODE_ENV === 'test'`.
- Chaque service possède son propre code de persistance (pas de package partagé).

## Lancement

```bash
cd services/project-service
npm install
npm run build
npm start
```

Développement : `npm run dev`. Tests : `npm test` (Jest, `NODE_ENV=test` → InMemory).

## Docker

```bash
docker build -t project-service ./services/project-service
docker run -p 3001:3001 project-service
```

Avec volume pour la base : `docker run -p 3001:3001 -v project-data:/app/data -e PROJECT_SQLITE_DB_LOCATION=/app/data/project-service.db project-service`.
