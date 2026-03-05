import "dotenv/config";
import express from "express";
import sqliteUserRepository from "./persistence/sqlite-user-repository";

const app = express();
const port = Number(process.env.PORT) || 3004;

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

sqliteUserRepository
  .init()
  .then(() => {
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`[auth-service] Listening on port ${port}`);
    });
  })
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });

const gracefulShutdown = () => {
  sqliteUserRepository
    .teardown()
    .catch(() => {})
    .then(() => process.exit());
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
process.on("SIGUSR2", gracefulShutdown);
