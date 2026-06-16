import tseslint from "typescript-eslint";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "node_modules/**"]
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
        sourceType: "module"
      },
      globals: {
        ...globals.browser,
        ...globals.es2020
      }
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off"
    }
  }
];
