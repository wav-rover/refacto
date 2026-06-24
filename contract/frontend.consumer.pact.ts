import path from "node:path";
import { PactV3, MatchersV3 } from "@pact-foundation/pact/src/v3";

import { fetchCurrentUser, fetchProjects } from "../src/frontend/apiClient";

const { like } = MatchersV3;

// Contrat CONSOMMATEUR : frontend -> api-gateway (routes publiques /api/v1/...).
const pactDir = path.resolve(__dirname, "../pacts");
const provider = new PactV3({
  consumer: "frontend",
  provider: "api-gateway",
  dir: pactDir,
});

describe("Contrat frontend -> api-gateway", () => {
  it("récupère l'utilisateur courant (GET /api/v1/auth/me -> 200)", async () => {
    provider
      .given("un utilisateur est authentifié")
      .uponReceiving("une demande de l'utilisateur courant")
      .withRequest({
        method: "GET",
        path: "/api/v1/auth/me",
        headers: { Accept: "application/json" },
      })
      .willRespondWith({
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: { id: like("u1"), email: like("user@example.com") },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetchCurrentUser(mockServer.url);
      expect(res.status).toBe(200);
      expect(res.body?.email).toBeDefined();
    });
  });

  it("liste les projets (GET /api/v1/projects -> 200)", async () => {
    provider
      .given("l'utilisateur authentifié n'a aucun projet")
      .uponReceiving("une demande de liste des projets")
      .withRequest({
        method: "GET",
        path: "/api/v1/projects",
        headers: { Accept: "application/json" },
      })
      .willRespondWith({
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: [],
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetchProjects(mockServer.url);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
