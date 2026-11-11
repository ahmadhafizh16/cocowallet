import js from "@eslint/js";
import next from "@next/eslint-plugin-next";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    ".next/**",
    ".opencode/**",
    ".impeccable/**",
    "node_modules/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: { "@typescript-eslint/no-explicit-any": "error" },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "@next/next": next },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
    },
  },
]);
