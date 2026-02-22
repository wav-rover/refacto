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
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "storageState.json",
      },
      dependencies: ["setup"],
    },

    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        storageState: "storageState.json",
      },
      dependencies: ["setup"],
    },

    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        storageState: "storageState.json",
      },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    env: {
      ...process.env,
      AUTH_USERNAME: "admin",
      AUTH_PASSWORD: "secret",
      SESSION_SECRET: "test-session-secret",
    },
  },
});
