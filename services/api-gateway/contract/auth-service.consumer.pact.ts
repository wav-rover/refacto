import path from "node:path";
// Import par sous-chemin v3 : évite de charger le verifier (et sa dépendance
// ESM https-proxy-agent) que Jest ne sait pas transformer.
import { PactV3, MatchersV3 } from "@pact-foundation/pact/src/v3";

import { forwardJson } from "../src/infra/httpClient";
import { getAuthServiceUrl } from "../src/config/authConfig";

const { like } = MatchersV3;

// Contrat CONSOMMATEUR : l'API Gateway en tant que client de l'auth-service.
// Le test exerce le vrai client HTTP de la gateway (forwardJson + getAuthServiceUrl),
// donc le contrat capture le chemin versionné réel (/v1/auth/...).
// Les fichiers de pacts sont écrits à la racine du repo (pacts/), où le test
// provider de l'auth-service ira les vérifier.
const pactDir = path.resolve(__dirname, "../../../pacts");

const provider = new PactV3({
  consumer: "api-gateway",
  provider: "auth-service",
  dir: pactDir,
});

describe("Contrat api-gateway -> auth-service", () => {
  it("inscription d'un nouvel utilisateur (POST /v1/auth/register -> 201)", async () => {
    provider
      .given("la base utilisateurs est vide")
      .uponReceiving("une demande d'inscription d'un nouvel utilisateur")
      .withRequest({
        method: "POST",
        path: "/v1/auth/register",
        headers: { "Content-Type": "application/json" },
        body: { email: "contract-new@example.com", password: "password123" },
      })
      .willRespondWith({
        status: 201,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: {
          id: like("user-123"),
          email: "contract-new@example.com",
          createdAt: like("2026-01-01T00:00:00.000Z"),
        },
      });

    await provider.executeTest(async (mockServer) => {
      process.env.AUTH_SERVICE_URL = mockServer.url;
      process.env.API_VERSION = "v1";

      const res = await forwardJson<{ email: string }>({
        baseUrl: getAuthServiceUrl(),
        path: "/auth/register",
        method: "POST",
        headers: { accept: "application/json" },
        body: { email: "contract-new@example.com", password: "password123" },
      });

      expect(res.status).toBe(201);
      expect(res.body?.email).toBe("contract-new@example.com");
    });
  });

  it("connexion avec un utilisateur inexistant (POST /v1/auth/login -> 401)", async () => {
    provider
      .given("la base utilisateurs est vide")
      .uponReceiving("une demande de connexion pour un utilisateur inexistant")
      .withRequest({
        method: "POST",
        path: "/v1/auth/login",
        headers: { "Content-Type": "application/json" },
        body: { email: "contract-nobody@example.com", password: "password123" },
      })
      .willRespondWith({
        status: 401,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: { error: like("Invalid credentials") },
      });

    await provider.executeTest(async (mockServer) => {
      process.env.AUTH_SERVICE_URL = mockServer.url;
      process.env.API_VERSION = "v1";

      const res = await forwardJson<{ error: string }>({
        baseUrl: getAuthServiceUrl(),
        path: "/auth/login",
        method: "POST",
        headers: { accept: "application/json" },
        body: { email: "contract-nobody@example.com", password: "password123" },
      });

      expect(res.status).toBe(401);
      expect(res.body?.error).toBeDefined();
    });
  });
});
