import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/spec/**/*.spec.{js,ts}"],
  testPathIgnorePatterns: ["/node_modules/", "/tests/"],
};

export default config;
