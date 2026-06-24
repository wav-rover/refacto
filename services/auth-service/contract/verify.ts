import path from "node:path";
import type { Server } from "node:http";

import { Verifier } from "@pact-foundation/pact";

import { createApp } from "../src/app";
import { createRepository } from "../src/persistence";

// Vérification PROVIDER : rejoue le contrat publié par l'api-gateway (consommateur)
// contre une vraie instance de l'auth-service.
// Exécuté en script Node (et non sous Jest) car le Verifier de Pact dépend de
// https-proxy-agent (ESM) que Jest ne transforme pas ; Node 24 sait le charger.
async function main(): Promise<void> {
  process.env.NODE_ENV = process.env.NODE_ENV ?? "test";

  const repo = createRepository(); // in-memory en NODE_ENV=test
  await repo.init();

  const app = createApp(repo);
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const providerBaseUrl = `http://127.0.0.1:${port}`;

  const verifier = new Verifier({
    provider: "auth-service",
    providerBaseUrl,
    pactUrls: [
      path.resolve(__dirname, "../../../pacts/api-gateway-auth-service.json"),
    ],
    // Mise en place de l'état attendu par chaque interaction du contrat.
    stateHandlers: {
      "la base utilisateurs est vide": async () => {
        await repo.teardown();
        await repo.init();
      },
    },
  });

  try {
    await verifier.verifyProvider();
    console.log("✓ Vérification du contrat provider (auth-service) réussie.");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await repo.teardown().catch(() => undefined);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
