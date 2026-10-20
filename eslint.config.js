import js from "@eslint/js"
import tseslint from "typescript-eslint"
import react from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import jsxA11y from "eslint-plugin-jsx-a11y"
import testingLibrary from "eslint-plugin-testing-library"
import jestDom from "eslint-plugin-jest-dom"
import vitest from "@vitest/eslint-plugin"
import globals from "globals"

export default tseslint.config(
  { ignores: ["dist", ".claude"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true }],
      "@typescript-eslint/no-empty-object-type": ["error", { allowInterfaces: "with-single-extends" }],
    },
  },
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [
      react.configs.flat.recommended,
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: { globals: globals.browser },
    settings: { react: { version: "detect" } },
    rules: {
      "react/prop-types": "off",
    },
  },
  {
    files: ["src/**/*.test.{ts,tsx}", "src/setupTests.ts"],
    extends: [
      vitest.configs.recommended,
      testingLibrary.configs["flat/react"],
      jestDom.configs["flat/recommended"],
    ],
    languageOptions: { globals: vitest.environments.env.globals },
  },
)
