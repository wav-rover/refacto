# task-service – Gestion des tâches et affectations (Phase 3)

Service dédié à la création et à la gestion des tâches et de leur affectation à des membres de projet. Référence métier : [regles-metier-task-service](../../doc/regles-metier-task-service.md).

## Identification de l'utilisateur courant

En phase 3, l'utilisateur courant est transmis par le **header `X-User-Id`** (posé par le client après login ou par le futur gateway). Toutes les routes qui modifient des données exigent ce header ; sinon la réponse est `401 Unauthorized`.

## Endpoints

Les routes protégées nécessitent le header : `X-User-Id: <userId>`.

### POST /tasks

Crée une nouvelle tâche liée à un projet.

- **Headers** : `X-User-Id` (obligatoire), `Content-Type: application/json`
- **Body JSON** :
  ```json
  {
    "title": "Ma tâche",
    "projectId": "uuid-du-projet",
    "assignedTo": "uuid-utilisateur",  // optionnel
    "status": "todo",                   // optionnel, défaut: "todo"
    "priority": "medium",               // optionnel, défaut: "medium"
    "dueDate": "2024-12-31"             // optionnel
  }
  ```
- **Réponses** :
  - `201` : tâche créée (objet task)
  - `400` : titre manquant ou vide, projectId manquant
  - `401` : header `X-User-Id` absent
  - `409` : l'utilisateur assigné a déjà une tâche active

### GET /tasks

Liste toutes les tâches.

- **Réponse** : `200` – tableau de tâches.

### GET /tasks/:id

Détail d'une tâche.

- **Réponses** : `200` (tâche) ou `404` (tâche introuvable).

### GET /tasks/project/:projectId

Liste les tâches d'un projet.

- **Réponse** : `200` – tableau de tâches du projet.

### GET /tasks/user/:userId

Liste les tâches assignées à un utilisateur.

- **Réponse** : `200` – tableau de tâches assignées.

### PATCH /tasks/:id

Met à jour une tâche (titre, statut, priorité, dueDate). Interdit si la tâche est terminée.

- **Headers** : `X-User-Id` (obligatoire)
- **Body JSON** :
  ```json
  {
    "title": "Nouveau titre",
    "status": "in_progress",
    "priority": "high",
    "dueDate": "2024-12-31"
  }
  ```
- **Réponses** : `200` (tâche mise à jour), `400` (titre vide), `401`, `404`, `409` (tâche terminée).

### POST /tasks/:id/assign

Affecte une tâche à un utilisateur.

- **Headers** : `X-User-Id` (obligatoire)
- **Body JSON** : `{ "userId": "uuid-utilisateur" }`
- **Réponses** : `200` (tâche mise à jour), `400` (userId manquant), `401`, `404`, `409` (utilisateur a déjà une tâche active ou tâche terminée).

### POST /tasks/:id/unassign

Désaffecte une tâche (retire l'utilisateur assigné).

- **Headers** : `X-User-Id` (obligatoire)
- **Réponses** : `200` (tâche mise à jour), `401`, `404`, `409` (tâche terminée).

### POST /tasks/:id/complete

Marque une tâche comme terminée (status=done, completed=true).

- **Headers** : `X-User-Id` (obligatoire)
- **Réponses** : `200` (tâche terminée), `401`, `404`.

### POST /tasks/:id/reopen

Réouvre une tâche terminée (status=todo, completed=false).

- **Headers** : `X-User-Id` (obligatoire)
- **Réponses** : `200` (tâche réouverte), `401`, `404`.
- **Note phase 4** : la vérification « projet non clôturé » sera ajoutée via événements.

### DELETE /tasks/:id

Supprime une tâche (suppression physique).

- **Headers** : `X-User-Id` (obligatoire)
- **Réponses** : `200` `{ "success": true }`, `401`, `404`.
- **Note phase 4** : la vérification « projet non clôturé » sera ajoutée via événements.

## Règles métier appliquées

- Une tâche appartient à un projet (`projectId`) et possède au plus un assigné (`assignedTo`).
- **Règle de capacité** : un utilisateur ne peut avoir qu'**une seule tâche active** (status ≠ done) assignée au global.
- Le titre est obligatoire et ne peut pas être vide.
- Une tâche terminée (`status=done`) ne peut pas être modifiée, assignée ou désassignée.
- Suppression physique des tâches.

## Coordination avec project-service (Phase 4)

Les vérifications suivantes sont **prévues pour la phase 4** (événements ou read model, pas d'appel HTTP direct) :

- Vérifier que le projet existe et est ouvert avant création de tâche.
- Vérifier que l'utilisateur assigné est membre du projet.
- Interdire la réouverture d'une tâche si le projet est clôturé.
- Interdire la suppression d'une tâche si le projet est clôturé.

En phase 3, ces contrôles ne sont pas implémentés pour respecter la règle « pas d'appel HTTP direct inter-services ».

## Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port HTTP du service | `3002` |
| `TASK_SQLITE_DB_LOCATION` | Chemin du fichier SQLite | `data/task-service.db` |
| `REDIS_URL` | URL du broker Redis (phase 4) | `redis://redis:6379` |

## Persistance

- **Port** : `TaskRepository` (voir `src/ports/taskRepository.ts`).
- **Implémentations** : SQLite (prod / dev) et InMemory (tests).
- Le choix est fait dans `src/persistence/index.ts` selon `NODE_ENV === 'test'`.

## Lancement

```bash
cd services/task-service
npm install
npm run build
npm start
```

Développement : `npm run dev`. Tests : `npm test` (Jest, `NODE_ENV=test` → InMemory).

## Docker

```bash
docker build -t task-service ./services/task-service
docker run -p 3002:3002 task-service
```

Avec volume pour la base :
```bash
docker run -p 3002:3002 -v task-data:/app/data -e TASK_SQLITE_DB_LOCATION=/app/data/task-service.db task-service
```

## Modèle de données Task

```typescript
interface Task {
  id: string;
  title: string;
  projectId: string;
  createdBy: string;
  assignedTo: string | null;
  completed: boolean;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  createdAt: string;
}
```
