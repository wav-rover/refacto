import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/spec/**/*.spec.{js,ts}"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/tests/",
    "/services/auth-service/spec/",
    "/services/project-service/spec/",
    "/services/task-service/spec/",
    "/services/notification-service/spec/",
  ],
};

export default config;
