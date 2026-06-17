FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/api-gateway/package.json services/api-gateway/
COPY services/auth-service/package.json services/auth-service/
COPY services/notification-service/package.json services/notification-service/
COPY services/project-service/package.json services/project-service/
COPY services/task-service/package.json services/task-service/

RUN npm ci --workspace=api-gateway --include-workspace-root=false

COPY services/api-gateway ./services/api-gateway

RUN npm run build -w api-gateway

FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/api-gateway/package.json services/api-gateway/
COPY services/auth-service/package.json services/auth-service/
COPY services/notification-service/package.json services/notification-service/
COPY services/project-service/package.json services/project-service/
COPY services/task-service/package.json services/task-service/

RUN npm ci --workspace=api-gateway --include-workspace-root=false --omit=dev

# Durcissement runtime (ADR 005) : correctifs OS + retrait du CLI npm (CVE glob/tar embarquées).
RUN apk upgrade --no-cache \
    && npm r -g npm

COPY --from=builder /app/services/api-gateway/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
