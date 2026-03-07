import 'dotenv/config';
import express from 'express';
import { createRepository } from './persistence';
import { currentUser } from './middleware/currentUser';
import { mountTaskRoutes } from './routes/tasks';

const app = express();
const port = Number(process.env.PORT) || 3002;
const repo = createRepository();

app.use(express.json());
app.use(currentUser);

app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

mountTaskRoutes(app, repo);

repo
  .init()
  .then(() => {
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`[task-service] Listening on port ${port}`);
    });
  })
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });

const gracefulShutdown = (): void => {
  repo
    .teardown()
    .catch(() => {})
    .then(() => process.exit());
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown);
