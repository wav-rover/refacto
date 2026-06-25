import { defineConfig, devices } from "@playwright/test";

// E2E sur une stack déjà démarrée (tests d'intégration PR / CD).
// Pas de webServer : docker compose -f docker-compose.prod.yml up en amont.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["line"], ["html"]] : "html",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "microservices-setup",
      testMatch: /auth-microservices\.setup\.ts/,
    },

    {
      name: "microservices-auth",
      testMatch: /microservices\/auth-flow\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
      dependencies: ["microservices-setup"],
    },

    {
      name: "microservices",
      testMatch: /microservices\/(?!auth-flow).*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "storageState-microservices.json",
      },
      dependencies: ["microservices-setup"],
    },
  ],
});
