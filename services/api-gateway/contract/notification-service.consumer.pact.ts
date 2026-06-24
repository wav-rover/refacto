import path from "node:path";
import { PactV3 } from "@pact-foundation/pact/src/v3";

import { forwardJson } from "../src/infra/httpClient";
import { getNotificationServiceUrl } from "../src/config/notificationConfig";

// Contrat CONSOMMATEUR : api-gateway -> notification-service.
const pactDir = path.resolve(__dirname, "../../../pacts");
const provider = new PactV3({
  consumer: "api-gateway",
  provider: "notification-service",
  dir: pactDir,
});

describe("Contrat api-gateway -> notification-service", () => {
  it("liste des notifications de l'utilisateur (GET /v1/notifications -> 200)", async () => {
    provider
      .given("l'utilisateur user-contract n'a aucune notification")
      .uponReceiving("une demande de liste des notifications de l'utilisateur")
      .withRequest({
        method: "GET",
        path: "/v1/notifications",
        headers: { Accept: "application/json", "x-user-id": "user-contract" },
      })
      .willRespondWith({
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: [],
      });

    await provider.executeTest(async (mockServer) => {
      process.env.NOTIFICATION_SERVICE_URL = mockServer.url;
      process.env.API_VERSION = "v1";

      const res = await forwardJson<unknown[]>({
        baseUrl: getNotificationServiceUrl(),
        path: "/notifications",
        method: "GET",
        headers: { accept: "application/json", "x-user-id": "user-contract" },
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
