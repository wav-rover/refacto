import "dotenv/config";
import express from "express";
import {
  createInMemoryEventBus,
  createRedisEventBus,
} from "./eventBus";
import type { EventBus } from "./ports/eventBus";
import { registerHandlers } from "./handlers";
import { currentUser } from "./middleware/currentUser";
import { createRepository } from "./persistence";
import { mountNotificationRoutes } from "./routes/notifications";

const app = express();
const port = Number(process.env.PORT) || 3003;
const repo = createRepository();

const redisUrl = process.env.REDIS_URL;
const streamName = process.env.REDIS_STREAM_NAME ?? "todo:events";
const eventBus: EventBus & { disconnect?(): Promise<void> } = redisUrl
  ? createRedisEventBus(redisUrl, streamName)
  : createInMemoryEventBus();

registerHandlers(eventBus, repo);

app.use(express.json());
app.use(currentUser);

app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

mountNotificationRoutes(app, repo);

repo
  .init()
  .then(() => eventBus.start())
  .then(() => {
    app.listen(port, () => {
      console.log(`[notification-service] Listening on port ${port}`);
    });
  })
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });

const gracefulShutdown = (): void => {
  const stop = eventBus.stop();
  const disconnect = eventBus.disconnect?.() ?? Promise.resolve();
  const teardown = repo.teardown();
  Promise.all([stop, disconnect, teardown])
    .catch(() => {})
    .then(() => process.exit());
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
process.on("SIGUSR2", gracefulShutdown);
