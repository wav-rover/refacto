"use strict";

const tsRaw = require("@typescript-eslint/eslint-plugin/use-at-your-own-risk/raw-plugin");
const jestPlugin = require("eslint-plugin-jest");
const reactPlugin = require("eslint-plugin-react");

const flatRecommendedKey = "flat/recommended";
const tsRecommended = tsRaw.flatConfigs[flatRecommendedKey];

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "src/static/**",
      "tests/**",
      "playwright.config.ts",
      "jest.config.ts",
    ],
  },
  ...tsRecommended,
  {
    // Phase 5: project uses CommonJS require(); ESM migration out of scope.
    // TODO: remove this rule when we migrate to ESM.
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["spec/**/*.ts"],
    plugins: { jest: jestPlugin },
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        jest: "readonly",
      },
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
      // export {} used in spec files for TS module boundary.
      "jest/no-export": "off",
    },
  },
  {
    files: ["src/**/*.tsx"],
    plugins: { react: reactPlugin },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
    },
    settings: {
      react: { version: "detect" },
    },
  },
];
