import path from "node:path";
import type { Server } from "node:http";
import express from "express";

import { Verifier } from "@pact-foundation/pact";

import { createRepository } from "../src/persistence";
import { createInMemoryEventBus } from "../src/eventBus";
import { currentUser } from "../src/middleware/currentUser";
import { mountTaskRoutes } from "../src/routes/tasks";

// Vérification PROVIDER (task-service) : rejoue le contrat de l'api-gateway.
// L'app est construite ici (json + currentUser + montage /v1) avec un repository
// et un event bus in-memory, sans dépendre de Redis ni du code de démarrage.
async function main(): Promise<void> {
  process.env.NODE_ENV = process.env.NODE_ENV ?? "test";

  const repo = createRepository();
  const eventBus = createInMemoryEventBus();
  await repo.init();

  const app = express();
  app.use(express.json());
  app.use(currentUser);
  const v1 = express.Router();
  mountTaskRoutes(v1, repo, eventBus);
  app.use("/v1", v1);

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  const verifier = new Verifier({
    provider: "task-service",
    providerBaseUrl: `http://127.0.0.1:${port}`,
    pactUrls: [
      path.resolve(__dirname, "../../../pacts/api-gateway-task-service.json"),
    ],
    stateHandlers: {
      "aucune tâche n'existe": async () => {
        await repo.teardown();
        await repo.init();
      },
    },
  });

  try {
    await verifier.verifyProvider();
    console.log("✓ Vérification du contrat provider (task-service) réussie.");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await repo.teardown().catch(() => undefined);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
