import express, { type Application } from "express";

import { apiRouter } from "./routes";
import { cors } from "./middlewares/cors";
import { logger } from "./middlewares/logger";
import { requestId } from "./middlewares/requestId";
import { getApiVersion } from "./config/apiVersion";
import { buildOpenApiDocument } from "./openapi";

export function createApp(): Application {
  const app = express();

  app.use(express.json());
  app.use(cors);
  app.use(requestId);
  app.use(logger);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Documentation OpenAPI exposée uniquement en développement.
  if (process.env.NODE_ENV !== "production") {
    app.get(`/api/${getApiVersion()}/openapi.json`, (_req, res) => {
      res.status(200).json(buildOpenApiDocument());
    });
  }

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
