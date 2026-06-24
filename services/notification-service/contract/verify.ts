import path from "node:path";
import type { Server } from "node:http";
import express from "express";

import { Verifier } from "@pact-foundation/pact";

import { createRepository } from "../src/persistence";
import { currentUser } from "../src/middleware/currentUser";
import { mountNotificationRoutes } from "../src/routes/notifications";

// Vérification PROVIDER (notification-service) : rejoue le contrat de l'api-gateway.
// Les routes HTTP n'utilisent que le repository (le bus d'événements n'intervient
// que côté consommation d'événements, hors périmètre de ce contrat).
async function main(): Promise<void> {
  process.env.NODE_ENV = process.env.NODE_ENV ?? "test";

  const repo = createRepository();
  await repo.init();

  const app = express();
  app.use(express.json());
  app.use(currentUser);
  const v1 = express.Router();
  mountNotificationRoutes(v1, repo);
  app.use("/v1", v1);

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  const verifier = new Verifier({
    provider: "notification-service",
    providerBaseUrl: `http://127.0.0.1:${port}`,
    pactUrls: [
      path.resolve(
        __dirname,
        "../../../pacts/api-gateway-notification-service.json"
      ),
    ],
    stateHandlers: {
      "l'utilisateur user-contract n'a aucune notification": async () => {
        await repo.teardown();
        await repo.init();
      },
    },
  });

  try {
    await verifier.verifyProvider();
    console.log(
      "✓ Vérification du contrat provider (notification-service) réussie."
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await repo.teardown().catch(() => undefined);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
