FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/api-gateway/package.json services/api-gateway/
COPY services/auth-service/package.json services/auth-service/
COPY services/notification-service/package.json services/notification-service/
COPY services/project-service/package.json services/project-service/
COPY services/task-service/package.json services/task-service/

RUN npm ci --workspace=auth-service --include-workspace-root=false

COPY services/auth-service ./services/auth-service

RUN npm run build -w auth-service

FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/api-gateway/package.json services/api-gateway/
COPY services/auth-service/package.json services/auth-service/
COPY services/notification-service/package.json services/notification-service/
COPY services/project-service/package.json services/project-service/
COPY services/task-service/package.json services/task-service/

RUN npm ci --workspace=auth-service --include-workspace-root=false --omit=dev

COPY --from=builder /app/services/auth-service/dist ./dist

RUN mkdir -p /app/data
ENV AUTH_SQLITE_DB_LOCATION=/app/data/auth-users.db

EXPOSE 3004

CMD ["node", "dist/index.js"]
