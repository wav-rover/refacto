# Cartographie des flux principaux — front React (`src/frontend/*`)

Ce document décrit les flux UI actuels (projets, tâches, notifications) et les appels faits au `api-gateway`.

---

## 0. Démarrage & état d’auth

| Élément | Détail |
|--------|--------|
| **Composant** | `App` (`src/frontend/app.tsx`) |
| **Déclencheur** | Montage du composant |
| **Code** | `fetch(${apiBaseUrl}/api/auth/me, { credentials: 'include' })` |
| **API** | `GET /api/auth/me` |
| **Effet** | `authState` passe à `logged_in` ou `logged_out` |

---

## 1. Vues Projets

### 1.1 Chargement de la liste

| Élément | Détail |
|--------|--------|
| **Composant** | `ProjectsView` (`src/frontend/ProjectsView.tsx`) |
| **Déclencheur** | `useEffect` après montage (ou après création/MAJ) |
| **Code** | `fetch(/api/projects, { credentials: 'include' })` puis `setProjects(data)` |
| **API** | `GET /api/projects` |

### 1.2 Création d’un projet

| Élément | Détail |
|--------|--------|
| **Composant** | Form “Créer” dans `ProjectsView` |
| **Code** | `POST /api/projects` avec body `{ name }` puis refresh via `fetchProjects()` |
| **API** | `POST /api/projects` |
| **Body** | `{ "name": "<string>" }` |

### 1.3 Clôture d’un projet

| Élément | Détail |
|--------|--------|
| **Composant** | Bouton “Clore” dans `ProjectsView` |
| **Code** | `POST /api/projects/:projectId/close` puis refresh liste |
| **API** | `POST /api/projects/:projectId/close` |

### 1.4 Gestion des membres

| Action | Code | API |
|--------|------|-----|
| Ajout membre | `POST /api/projects/:projectId/members` avec `{ userId }` puis refresh | `POST /api/projects/:projectId/members` |
| Retrait membre | `DELETE /api/projects/:projectId/members/:userId` puis refresh | `DELETE /api/projects/:projectId/members/:userId` |

---

## 2. Vues Tâches

### 2.1 Chargement des tâches d’un projet

| Élément | Détail |
|--------|--------|
| **Composant** | `TasksView` (`src/frontend/TasksView.tsx`) |
| **Déclencheur** | Cliquer sur “Afficher” ou changement de `projectId` |
| **Code** | `fetch(/api/tasks/project/:projectId, { credentials: 'include' })` |
| **API** | `GET /api/tasks/project/:projectId` |
| **Effet** | `setTasks(data)` |

### 2.2 Création d’une tâche

| Élément | Détail |
|--------|--------|
| **Code** | `POST /api/tasks` avec `{ title, projectId, priority, status, dueDate }` puis refresh |
| **API** | `POST /api/tasks` |
| **Body** | `{ "title": "...", "projectId": "...", "priority": "...", "status": "...", "dueDate": "<string|null>" }` |

### 2.3 Mise à jour d’une tâche

| Élément | Détail |
|--------|--------|
| **Code** | `PATCH /api/tasks/:id` avec `{ title, status, priority, dueDate }` puis refresh |
| **API** | `PATCH /api/tasks/:id` |

### 2.4 Assignation / désassignation

| Action | Code | API |
|--------|------|-----|
| Assigner | `POST /api/tasks/:id/assign` avec `{ userId }` puis refresh | `POST /api/tasks/:id/assign` |
| Désassigner | `POST /api/tasks/:id/unassign` (body `{}`) puis refresh | `POST /api/tasks/:id/unassign` |

### 2.5 Terminer / réouvrir

| Action | Code | API |
|--------|------|-----|
| Terminer | `POST /api/tasks/:id/complete` (body `{}`) puis refresh | `POST /api/tasks/:id/complete` |
| Réouvrir | `POST /api/tasks/:id/reopen` (body `{}`) puis refresh | `POST /api/tasks/:id/reopen` |

Note : `task-service` lit `projectOwnerId` depuis le body pour publier les événements ; l’UI actuelle envoie `{}`.

### 2.6 Suppression

| Élément | Détail |
|--------|--------|
| **Code** | confirmation puis `DELETE /api/tasks/:id` puis refresh |
| **API** | `DELETE /api/tasks/:id` |

---

## 3. Vues Notifications

| Élément | Détail |
|--------|--------|
| **Composant** | `NotificationsView` (`src/frontend/NotificationsView.tsx`) |
| **Déclencheur** | `useEffect` puis bouton “Rafraîchir” |
| **Code** | `fetch(/api/notifications, { credentials: 'include' })` |
| **API** | `GET /api/notifications` |
| **Effet** | `setNotifications(data)` |

---

## Synthèse (API -> action UI)

| Flux | Déclencheur | Méthode / Route |
|------|-------------|-----------------|
| Auth check | Montage `App` | `GET /api/auth/me` |
| Projets list | Montage / refresh | `GET /api/projects` |
| Projets create | Soumission formulaire | `POST /api/projects` |
| Projets close | Clic “Clore” | `POST /api/projects/:projectId/close` |
| Membre add | Soumission ajout | `POST /api/projects/:projectId/members` |
| Membre remove | Clic “Retirer” | `DELETE /api/projects/:projectId/members/:userId` |
| Tâches list | “Afficher” / changement projectId | `GET /api/tasks/project/:projectId` |
| Tâches create | Soumission création | `POST /api/tasks` |
| Tâches update | Clic “Enregistrer” en édition | `PATCH /api/tasks/:id` |
| Tâches assign | Clic “Assigner” | `POST /api/tasks/:id/assign` |
| Tâches unassign | Clic “Désassigner” | `POST /api/tasks/:id/unassign` |
| Tâches complete | Clic “Terminer” | `POST /api/tasks/:id/complete` |
| Tâches reopen | Clic “Réouvrir” | `POST /api/tasks/:id/reopen` |
| Tâches delete | Clic “Supprimer” + confirm | `DELETE /api/tasks/:id` |
| Notifications list | Montage / refresh | `GET /api/notifications` |
