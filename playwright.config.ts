// @ts-check
import { defineConfig, devices } from "@playwright/test";

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

  webServer: {
    command: "docker compose up --build",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
