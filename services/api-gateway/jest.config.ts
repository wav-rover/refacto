import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/spec"],
  testMatch: ["**/*.spec.ts"],
  modulePathIgnorePatterns: ["<rootDir>/dist"],
};

export default config;
