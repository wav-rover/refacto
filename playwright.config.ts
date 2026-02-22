// @ts-check
import { defineConfig, devices } from "@playwright/test";

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
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    {
      name: "chromium-auth",
      testMatch: /auth\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },

    {
      name: "chromium",
      testIgnore: /auth\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "storageState.json",
      },
      dependencies: ["setup"],
    },

    {
      name: "firefox-auth",
      testMatch: /auth\.spec\.ts/,
      use: {
        ...devices["Desktop Firefox"],
      },
    },

    {
      name: "firefox",
      testIgnore: /auth\.spec\.ts/,
      use: {
        ...devices["Desktop Firefox"],
        storageState: "storageState.json",
      },
      dependencies: ["setup"],
    },

    {
      name: "webkit-auth",
      testMatch: /auth\.spec\.ts/,
      use: {
        ...devices["Desktop Safari"],
      },
    },

    {
      name: "webkit",
      testIgnore: /auth\.spec\.ts/,
      use: {
        ...devices["Desktop Safari"],
        storageState: "storageState.json",
      },
      dependencies: ["setup"],
    },
  ],

  webServer: {
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
