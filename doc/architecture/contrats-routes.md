# Contrats des routes API (gateway)

Ce document décrit la surface HTTP exposée par `services/api-gateway` et consommée par le front React.

Notes :
- Les détails “métier” (codes d’erreur, validations) sont alignés sur les `README` des services (`auth-service`, `project-service`, `task-service`, `notification-service`).
- Les routes protégées exigent le cookie de session : le gateway appelle `GET /api/auth/me` côté `auth-service` et injecte ensuite `X-User-Id` vers les services métiers.

---

## Auth

### POST `/api/auth/register`

- Body JSON : `{ "email": "<string>", "password": "<string>" }`
- Réponses :
  - `201` : `{ "id": "<uuid>", "email": "<string>", "createdAt": "<iso>" }`
  - `400` : input invalide
  - `409` : email déjà utilisé

### POST `/api/auth/login`

- Body JSON : `{ "email": "<string>", "password": "<string>" }`
- Réponses :
  - `200` : session créée (cookie `HttpOnly`) et `{ "ok": true, "user": { "id": "<uuid>", "email": "<string>" } }`
  - `400` : input invalide
  - `401` : credentials invalides

### GET `/api/auth/me`

- Réponses :
  - `200` : `{ "id": "<uuid>", "email": "<string>" }`
  - `401` : pas de session valide

### POST `/api/auth/logout`

Laisse la session invalider côté `auth-service`.

---

## Projects

Ces routes sont protégées par session (le gateway requiert auth pour tout ce qui est exposé dans `services/api-gateway/src/routes/projects.ts`).

### GET `/api/projects`

- Réponse : `200` avec tableau de projets.

### POST `/api/projects`

- Body JSON : `{ "name": "<string>" }`
- Réponses :
  - `201` : projet créé
  - `400` : nom manquant / vide
  - `401` : non authentifié

### PATCH `/api/projects/:projectId`

- Body JSON : `{ "name": "<string>" }`
- Réponses typiques : `200`, `400`, `401`, `403` (pas chef), `404`, `409` (projet clôturé).

### POST `/api/projects/:projectId/close`

- Réponses typiques : `200`, `401`, `403`, `404`, `409` (déjà clos).

### POST `/api/projects/:projectId/members`

- Body JSON : `{ "userId": "<string>" }`
- Réponses typiques : `200`, `400`, `401`, `403`, `404`, `409` (déjà membre).

### DELETE `/api/projects/:projectId/members/:userId`

- Réponse typique : `200` (projet mis à jour), sinon `401`, `403`, `404`.

---

## Tasks

Le gateway expose des routes `GET` non-protégées, mais les routes `POST/PATCH/DELETE` (modifications) exigent l’auth cookie (par injection de `X-User-Id`).

Types attendus (réponse des services) :
- `Task` : `{
  id, title, projectId, createdBy,
  assignedTo: string | null,
  completed: boolean,
  status: 'todo' | 'in_progress' | 'done',
  priority: 'low' | 'medium' | 'high',
  dueDate: string | null,
  createdAt
}`

### GET `/api/tasks`

- Réponse : `200` avec tableau de `Task`.

### GET `/api/tasks/project/:projectId`

- Réponse : `200` avec tableau de `Task` filtrées par `projectId`.

### GET `/api/tasks/user/:userId`

- Réponse : `200` avec tableau de `Task` assignées à l’utilisateur.

### GET `/api/tasks/:id`

- Réponse : `200` (task) ou `404`.

### POST `/api/tasks`

- Body JSON :
  - `title` (string, requis)
  - `projectId` (string, requis)
  - `assignedTo` (string | null, optionnel)
  - `status` (string, optionnel, défaut `todo`)
  - `priority` (string, optionnel, défaut `medium`)
  - `dueDate` (string | null, optionnel)
- Réponses : `201`, `400`, `401`, `409` (capacité : une seule tâche active par utilisateur).

### PATCH `/api/tasks/:id`

- Body JSON : `{ "title"?, "status"?, "priority"?, "dueDate"? }`
- Réponses typiques : `200`, `400`, `401`, `404`, `409` (tâche terminée).

### POST `/api/tasks/:id/assign`

- Body JSON : `{ "userId": "<string>" }`
- Réponses typiques : `200`, `400`, `401`, `404`, `409`.

### POST `/api/tasks/:id/unassign`

- Body JSON : `{}` (le service ne dépend pas du body)
- Réponses typiques : `200`, `401`, `404`, `409`.

### POST `/api/tasks/:id/complete`

- Body JSON :
  - `projectOwnerId?: "<string>"` (le service lit `req.body.projectOwnerId` et retombe sur `''` si absent)
- UI actuelle : envoie `{}`.
- Réponses typiques : `200`, `401`, `404`.

### POST `/api/tasks/:id/reopen`

- Body JSON :
  - `projectOwnerId?: "<string>"` (retombe sur `''` si absent)
- UI actuelle : envoie `{}`.
- Réponses typiques : `200`, `401`, `404`.

### DELETE `/api/tasks/:id`

- Query string optionnel : `projectOwnerId=<string>` (le service le lit via `req.query`)
- UI actuelle : pas de query string.
- Réponse : `200 { "success": true }`, sinon `401`, `404`, `409` (selon règles).

---

## Notifications

### GET `/api/notifications`

- Réponse : `200` avec tableau de notifications pour l’utilisateur courant.
- L’utilisateur courant est déterminé via session (gateway -> `auth-service`) et injection `X-User-Id`.
- Réponses typiques : `200`, `401`.
