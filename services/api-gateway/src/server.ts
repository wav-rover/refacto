import express, { type Application } from "express";

import { apiRouter } from "./routes";
import { logger } from "./middlewares/logger";
import { requestId } from "./middlewares/requestId";

export function createApp(): Application {
  const app = express();

  app.use(express.json());
  app.use(requestId);
  app.use(logger);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api", apiRouter);

  return app;
}

const port = Number(process.env.PORT ?? 3000);

if (process.env.NODE_ENV !== "test") {
  const app = createApp();

  app.listen(port, () => {
    console.log(`API Gateway listening on port ${port}`);
  });
}
