FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/data
ENV TASK_SQLITE_DB_LOCATION=/app/data/task-service.db

EXPOSE 3002

CMD ["node", "dist/index.js"]
