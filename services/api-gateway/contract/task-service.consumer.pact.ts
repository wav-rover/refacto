import path from "node:path";
import { PactV3 } from "@pact-foundation/pact/src/v3";

import { forwardJson } from "../src/infra/httpClient";
import { getTaskServiceUrl } from "../src/config/taskConfig";

// Contrat CONSOMMATEUR : api-gateway -> task-service.
const pactDir = path.resolve(__dirname, "../../../pacts");
const provider = new PactV3({
  consumer: "api-gateway",
  provider: "task-service",
  dir: pactDir,
});

describe("Contrat api-gateway -> task-service", () => {
  it("liste des tâches (GET /v1/tasks -> 200)", async () => {
    provider
      .given("aucune tâche n'existe")
      .uponReceiving("une demande de liste des tâches")
      .withRequest({
        method: "GET",
        path: "/v1/tasks",
        headers: { Accept: "application/json" },
      })
      .willRespondWith({
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: [],
      });

    await provider.executeTest(async (mockServer) => {
      process.env.TASK_SERVICE_URL = mockServer.url;
      process.env.API_VERSION = "v1";

      const res = await forwardJson<unknown[]>({
        baseUrl: getTaskServiceUrl(),
        path: "/tasks",
        method: "GET",
        headers: { accept: "application/json" },
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
