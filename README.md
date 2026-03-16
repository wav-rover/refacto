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

**Build the frontend bundle (React app → static/js/app.js):**

```bash
npm run build:front
```

---

## Running locally

### 1. Start the backend stack with Docker (Gateway + services)

All backend services (auth, projects, tasks, notifications) and the API Gateway run via Docker Compose.

From the repo root:

```bash
docker compose up -d
```

This starts:

- `api-gateway` on **http://localhost:3000**
- `auth-service` on 3004
- `project-service` on 3001
- `task-service` on 3002
- `notification-service` on 3003
- `redis` on 6379

The API Gateway is the single entry point for the frontend:

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`
- Projects: `/api/projects/...`
- Tasks: `/api/tasks/...`
- Notifications: `/api/notifications`

### 2. Serve the frontend (React app) from the monolith

The existing monolith still serves the static frontend (HTML + JS bundle).

1. Make sure the frontend bundle is built:

   ```bash
   npm run build:front
   ```

2. Start the monolith in dev mode (serves the front on **http://localhost:3100**):

   ```bash
   npm run dev
   ```

   The HTML entry (`src/static/index.html`) sets:

   ```html
   <script>
     window.__API_BASE_URL__ = "http://localhost:3000";
   </script>
   ```

   so the frontend talks to the API Gateway on port 3000.

3. Open the app in your browser:
   - Frontend: `http://localhost:3100`
   - Auth flows go through the Gateway:
     - `POST http://localhost:3000/api/auth/register`
     - `POST http://localhost:3000/api/auth/login`
     - `GET  http://localhost:3000/api/auth/me`
     - `POST http://localhost:3000/api/auth/logout`

### 3. Notes about legacy `/items`

- The legacy todo UI still calls the monolith directly on `/items` (e.g. `http://localhost:3100/items`) for now.
- New features (projects, tasks, notifications) should **only** use the API Gateway routes (`${apiBaseUrl}/api/...`) and not talk directly to services or `/items`.

---

## Run tests

```bash
npm run test        # Jest (monolith + shared)
npm run test:e2e    # Playwright E2E (through the app)
npm run test:all    # Both
```

## Lint

```bash
npm run lint        # ESLint
npm run lint:deps   # dependency-cruiser
```
