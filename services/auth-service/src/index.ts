import "dotenv/config";

import { createRepository } from "./persistence";
import { createApp } from "./app";

const port = Number(process.env.PORT) || 3004;
const repo = createRepository();
const app = createApp(repo);

repo
  .init()
  .then(() => {
    app.listen(port, () => {
      console.log(`[auth-service] Listening on port ${port}`);
    });
  })
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });

const gracefulShutdown = () => {
  repo
    .teardown()
    .catch(() => {})
    .then(() => process.exit());
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
process.on("SIGUSR2", gracefulShutdown);
