import type { Config } from "jest";

// Config Jest dédiée aux tests de contrat (Pact), séparée de la suite unitaire
// (jest.config.ts scanne spec/ ; ici on scanne contract/).
const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/contract"],
  testMatch: ["**/*.pact.ts"],
  testTimeout: 30000,
};

export default config;
