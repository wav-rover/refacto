// @ts-check
import { defineConfig, devices } from "@playwright/test";

const isDockerMode = process.env.E2E_MODE === "microservices";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    // ===== Monolith (legacy) projects =====
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    {
      name: "chromium-auth",
      testMatch: /e2e\/auth\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },

    {
      name: "chromium",
      testMatch: /e2e\/todo\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "storageState.json",
      },
      dependencies: ["setup"],
    },

    {
      name: "firefox-auth",
      testMatch: /e2e\/auth\.spec\.ts/,
      use: {
        ...devices["Desktop Firefox"],
      },
    },

    {
      name: "firefox",
      testMatch: /e2e\/todo\.spec\.ts/,
      use: {
        ...devices["Desktop Firefox"],
        storageState: "storageState.json",
      },
      dependencies: ["setup"],
    },

    {
      name: "webkit-auth",
      testMatch: /e2e\/auth\.spec\.ts/,
      use: {
        ...devices["Desktop Safari"],
      },
    },

    {
      name: "webkit",
      testMatch: /e2e\/todo\.spec\.ts/,
      use: {
        ...devices["Desktop Safari"],
        storageState: "storageState.json",
      },
      dependencies: ["setup"],
    },

    // ===== Microservices projects =====
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

  webServer: isDockerMode
    ? {
        command: "docker-compose up --build",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120000,
      }
    : {
        command: "npm run dev:no-watch",
        url: "http://localhost:3000",
        reuseExistingServer: false,
        env: {
          ...process.env,
          NODE_ENV: "test",
          AUTH_USERNAME: "admin",
          AUTH_PASSWORD: "secret",
          SESSION_SECRET: "test-session-secret",
        },
      },
});
