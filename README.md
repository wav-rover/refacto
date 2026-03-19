# Todo (refacto)

Sample Todo application — refactoring project with tests, TypeScript, and clean architecture.

---

## Installation

**Prerequisites:** Node.js >= 24.13.1 (see `engines` in `package.json`).

```bash
# Clone and enter the repo
git clone https://github.com/wav-rover/refacto.git
cd refacto

# Install dependencies from package lock
npm ci
```

Note: the frontend bundle is built automatically by Docker when you run `docker compose up --build`.

---

## Running locally

### 1. Full stack with Docker (frontend + API Gateway + services)

All backend services (auth, projects, tasks, notifications), the API Gateway, and the React frontend run via Docker Compose.

From the repo root:

```bash
docker compose up -d --build
```

This starts:

- Frontend (NGINX) **and** API Gateway together on **http://localhost:3000**
  - UI served at `/`
  - API exposed at `/api/...`
- `auth-service`, `project-service`, `task-service`, `notification-service` on the Docker network only (no direct host ports needed)
- `redis` on 6379

The Gateway is the single entry point for the frontend:

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`
- Projects: `/api/projects/...`
- Tasks: `/api/tasks/...`
- Notifications: `/api/notifications`

### 2. Créer un compte et utiliser l'application

1. Ouvrir le navigateur sur **http://localhost:3000**.
2. Sur l'écran de connexion, saisir un email et un mot de passe.
3. Cliquer sur **"Créer un compte"** :
   - Le frontend appelle `POST /api/auth/register` via le Gateway.
   - En cas de succès, un login est enchaîné automatiquement (`POST /api/auth/login`) et la session est créée.
4. Utiliser ensuite les vues **Projets**, **Tâches** et **Notifications** depuis le menu de l'UI.

---

## Run tests

```bash
npm run test           # Jest for microservices (auth, projects, tasks, notifications)
npm run test:services  # Jest in domain services only (auth, projects, tasks, notifications)
npm run test:e2e       # Playwright E2E (expects an app running on http://localhost:3000)
npm run test:all       # Jest + Playwright
```

## Lint

```bash
npm run lint        # ESLint
npm run lint:deps   # dependency-cruiser
```
