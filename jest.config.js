module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/spec/**/*.spec.{js,ts}"],
  testPathIgnorePatterns: ["/node_modules/", "/tests/"],
};
