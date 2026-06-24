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

# Métadonnées de compatibilité (vérifiées au déploiement par deploy/check-compatibility.mjs).
# La gateway expose l'API v1 et appelle les 4 backends : elle exige leur major 1.x.
LABEL provides.api-version="v1"
LABEL requires.auth-service=">=1.0.0 <2.0.0"
LABEL requires.project-service=">=1.0.0 <2.0.0"
LABEL requires.task-service=">=1.0.0 <2.0.0"
LABEL requires.notification-service=">=1.0.0 <2.0.0"

EXPOSE 3000

CMD ["node", "dist/server.js"]
