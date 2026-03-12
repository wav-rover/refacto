import 'dotenv/config';
import express from 'express';
import { createInMemoryEventBus, createRedisEventBus } from './eventBus';
import type { EventBus } from './ports/eventBus';
import { createRepository } from './persistence';
import { currentUser } from './middleware/currentUser';
import { mountTaskRoutes } from './routes/tasks';

const app = express();
const port = Number(process.env.PORT) || 3002;
const repo = createRepository();

const redisUrl = process.env.REDIS_URL;
const streamName = process.env.REDIS_STREAM_NAME ?? 'todo:events';
const eventBus: EventBus & { disconnect?(): Promise<void> } = redisUrl
  ? createRedisEventBus(redisUrl, streamName)
  : createInMemoryEventBus();

app.use(express.json());
app.use(currentUser);

app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

mountTaskRoutes(app, repo, eventBus);

repo
  .init()
  .then(() => {
    app.listen(port, () => {
      console.log(`[task-service] Listening on port ${port}`);
    });
  })
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });

const gracefulShutdown = (): void => {
  const disconnect = eventBus.disconnect?.();
  const teardown = repo.teardown();
  Promise.all([disconnect ?? Promise.resolve(), teardown])
    .catch(() => {})
    .then(() => process.exit());
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown);
