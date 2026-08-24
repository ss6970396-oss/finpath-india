import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    // Everything under test here is a pure function over strings and numbers.
    // No jsdom: a DOM would only slow the suite down and invite tests that
    // depend on rendering rather than on the parser.
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
