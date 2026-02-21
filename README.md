# Todo (refacto)

Sample Todo application — refactoring project with tests, TypeScript, and clean architecture.

---

## Installation

**Prerequisites:** Node.js >= 24.13.1 (see `engines` in `package.json`).

```bash
# Clone and enter the repo
git clone <https://github.com/wav-rover/refacto.git>
cd refacto

# Install dependencies from package lock
npm ci

# Build the frontend bundle (React app → static/js/app.js)
npm run build:front
```

**Run the app (dev):**

```bash
npm run dev
```

The server listens on **http://localhost:3000**. By default it uses **SQLite**; the DB file is `SQLITE_DB_LOCATION` or `/etc/todos/todo.db`. For local dev you can set:

```bash
export SQLITE_DB_LOCATION=./todo.db
npm run dev
```

**Run tests:**

```bash
npm run test        # Jest (backend)
npm run test:e2e    # Playwright (E2E)
npm run test:all    # Both
```

**Lint:**

```bash
npm run lint        # ESLint
npm run lint:deps   # dependency-cruiser
```

---

## Getting started (Docker)

This repository can also be used with the [Docker getting started guide](https://docs.docker.com/get-started/). It is based on the [getting-started tutorial](https://github.com/docker/getting-started).
