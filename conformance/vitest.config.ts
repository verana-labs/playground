import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", "results/**"],
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
