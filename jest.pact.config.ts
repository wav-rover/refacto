import type { Config } from "jest";

// Config Jest pour le test de contrat CONSOMMATEUR du frontend (Front -> Gateway).
// isolatedModules : on transpile sans type-check (le client front référence des
// globales navigateur — window/fetch — non typées par le tsconfig node).
const config: Config = {
  testEnvironment: "node",
  roots: ["<rootDir>/contract"],
  testMatch: ["**/*.pact.ts"],
  testTimeout: 30000,
  transform: {
    "^.+\\.ts$": ["ts-jest", { isolatedModules: true }],
  },
};

export default config;
