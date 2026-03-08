import "dotenv/config";
import express from "express";
import { createInMemoryEventBus } from "./eventBus/inMemory";
import { registerHandlers } from "./handlers";
import { currentUser } from "./middleware/currentUser";
import { createRepository } from "./persistence";
import { mountNotificationRoutes } from "./routes/notifications";

const app = express();
const port = Number(process.env.PORT) || 3003;
const repo = createRepository();
const eventBus = createInMemoryEventBus();
registerHandlers(eventBus);

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
      // eslint-disable-next-line no-console
      console.log(`[notification-service] Listening on port ${port}`);
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

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
process.on("SIGUSR2", gracefulShutdown);
