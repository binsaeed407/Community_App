import { defineConfig } from "vitest/config";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

/**
 * Tests here are deliberately narrow: pure functions and validation rules, run
 * in Node with no database and no browser.
 *
 * That is a choice, not a shortcut. The valuable tests in this project are the
 * ones that pin down rules which are easy to break by accident — what counts as
 * valid input, which status transitions are allowed, whether the status cache
 * can drift from the history. Rendering React in a fake DOM to assert that a
 * heading says "Sign in" would cost more to maintain than it could ever catch.
 */
// Vitest does not read .env the way Next.js does, so the database invariant
// test would see no DATABASE_URL and skip itself even when one is configured.
loadEnv();

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      // Mirrors the "@/*" path in tsconfig.json, which Vitest does not read.
      "@": resolve(__dirname, "./src"),
    },
  },
});
