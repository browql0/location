import tseslint from "typescript-eslint";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "node_modules/**"]
  },
  {
    files: ["src/**/*.ts", "prisma/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        sourceType: "module"
      },
      globals: {
        ...globals.node
      }
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off"
    }
  }
];
