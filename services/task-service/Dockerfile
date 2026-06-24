FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/api-gateway/package.json services/api-gateway/
COPY services/auth-service/package.json services/auth-service/
COPY services/notification-service/package.json services/notification-service/
COPY services/project-service/package.json services/project-service/
COPY services/task-service/package.json services/task-service/

# sqlite3 n'a pas de prebuilt musl/node24 -> compilation via node-gyp,
# qui exige python3 + toolchain. Installées en virtuel puis retirées.
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && npm ci --workspace=task-service --include-workspace-root=false \
    && apk del .build-deps

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

RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && npm ci --workspace=task-service --include-workspace-root=false --omit=dev \
    && apk del .build-deps

# Durcissement runtime (ADR 005) : correctifs OS + retrait du CLI npm (CVE glob/tar embarquées).
RUN apk upgrade --no-cache \
    && npm r -g npm

COPY --from=builder /app/services/task-service/dist ./dist

RUN mkdir -p /app/data
ENV TASK_SQLITE_DB_LOCATION=/app/data/task-service.db

# Métadonnées de compatibilité (vérifiées au déploiement) : version d'API fournie.
LABEL provides.api-version="v1"

EXPOSE 3002

CMD ["node", "dist/index.js"]
