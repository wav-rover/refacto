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
    && npm ci --workspace=auth-service --include-workspace-root=false \
    && apk del .build-deps

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

RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && npm ci --workspace=auth-service --include-workspace-root=false --omit=dev \
    && apk del .build-deps

COPY --from=builder /app/services/auth-service/dist ./dist

RUN mkdir -p /app/data
ENV AUTH_SQLITE_DB_LOCATION=/app/data/auth-users.db

EXPOSE 3004

CMD ["node", "dist/index.js"]
