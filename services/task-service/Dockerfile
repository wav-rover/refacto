FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/api-gateway/package.json services/api-gateway/
COPY services/auth-service/package.json services/auth-service/
COPY services/notification-service/package.json services/notification-service/
COPY services/project-service/package.json services/project-service/
COPY services/task-service/package.json services/task-service/

RUN npm ci --workspace=task-service --include-workspace-root=false

COPY services/task-service ./services/task-service

RUN npm run build -w task-service

FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/api-gateway/package.json services/api-gateway/
COPY services/auth-service/package.json services/auth-service/
COPY services/notification-service/package.json services/notification-service/
COPY services/project-service/package.json services/project-service/
COPY services/task-service/package.json services/task-service/

RUN npm ci --workspace=task-service --include-workspace-root=false --omit=dev

COPY --from=builder /app/services/task-service/dist ./dist

RUN mkdir -p /app/data
ENV TASK_SQLITE_DB_LOCATION=/app/data/task-service.db

EXPOSE 3002

CMD ["node", "dist/index.js"]
