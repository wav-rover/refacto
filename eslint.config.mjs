"use strict";

import tsRaw from "@typescript-eslint/eslint-plugin/use-at-your-own-risk/raw-plugin";
import jestPlugin from "eslint-plugin-jest";
import reactPlugin from "eslint-plugin-react";

const flatRecommendedKey = "flat/recommended";
const tsRecommended = tsRaw.flatConfigs[flatRecommendedKey];

export default [
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
