import path from "node:path";
import { PactV3 } from "@pact-foundation/pact/src/v3";

import { forwardJson } from "../src/infra/httpClient";
import { getProjectServiceUrl } from "../src/config/projectConfig";

// Contrat CONSOMMATEUR : api-gateway -> project-service.
// La gateway propage l'identité de l'utilisateur via l'en-tête x-user-id.
const pactDir = path.resolve(__dirname, "../../../pacts");
const provider = new PactV3({
  consumer: "api-gateway",
  provider: "project-service",
  dir: pactDir,
});

describe("Contrat api-gateway -> project-service", () => {
  it("liste des projets de l'utilisateur (GET /v1/projects -> 200)", async () => {
    provider
      .given("l'utilisateur user-contract n'a aucun projet")
      .uponReceiving("une demande de liste des projets de l'utilisateur")
      .withRequest({
        method: "GET",
        path: "/v1/projects",
        headers: { Accept: "application/json", "x-user-id": "user-contract" },
      })
      .willRespondWith({
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: [],
      });

    await provider.executeTest(async (mockServer) => {
      process.env.PROJECT_SERVICE_URL = mockServer.url;
      process.env.API_VERSION = "v1";

      const res = await forwardJson<unknown[]>({
        baseUrl: getProjectServiceUrl(),
        path: "/projects",
        method: "GET",
        headers: { accept: "application/json", "x-user-id": "user-contract" },
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
