import path from "node:path";
import type { Server, AddressInfo } from "node:net";
import express from "express";

import { Verifier } from "@pact-foundation/pact";

import { createApp } from "../src/server";

// Vérification PROVIDER (api-gateway) du contrat publié par le frontend.
// La gateway étant un proxy, on démarre un mock des services aval auxquels elle
// relaie (/v1/auth/me, /v1/projects, /v1/notifications), puis on vérifie que la
// gateway satisfait le contrat du front.
async function main(): Promise<void> {
  process.env.NODE_ENV = process.env.NODE_ENV ?? "test";

  // 1) Mock des services aval.
  const downstream = express();
  downstream.get("/v1/auth/me", (_req, res) =>
    res.status(200).json({ id: "u1", email: "user@example.com" })
  );
  downstream.get("/v1/projects", (_req, res) => res.status(200).json([]));
  downstream.get("/v1/notifications", (_req, res) => res.status(200).json([]));

  const downstreamServer: Server = await new Promise((resolve) => {
    const s = downstream.listen(0, () => resolve(s));
  });
  const dPort = (downstreamServer.address() as AddressInfo).port;
  const dUrl = `http://127.0.0.1:${dPort}`;

  // 2) La gateway relaie vers ce mock (toutes les URLs de service pointent dessus).
  process.env.API_VERSION = "v1";
  process.env.AUTH_SERVICE_URL = dUrl;
  process.env.PROJECT_SERVICE_URL = dUrl;
  process.env.TASK_SERVICE_URL = dUrl;
  process.env.NOTIFICATION_SERVICE_URL = dUrl;

  const app = createApp();
  const gatewayServer: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const gPort = (gatewayServer.address() as AddressInfo).port;

  const verifier = new Verifier({
    provider: "api-gateway",
    providerBaseUrl: `http://127.0.0.1:${gPort}`,
    pactUrls: [
      path.resolve(__dirname, "../../../pacts/frontend-api-gateway.json"),
    ],
    // Les réponses étant servies par le mock aval (statique), les états sont neutres.
    stateHandlers: {
      "un utilisateur est authentifié": async () => undefined,
      "l'utilisateur authentifié n'a aucun projet": async () => undefined,
    },
  });

  try {
    await verifier.verifyProvider();
    console.log("✓ Vérification du contrat provider (api-gateway) réussie.");
  } finally {
    await new Promise<void>((resolve) => gatewayServer.close(() => resolve()));
    await new Promise<void>((resolve) => downstreamServer.close(() => resolve()));
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
