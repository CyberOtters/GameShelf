import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Server route tests plus the pure client helpers in `src/client/lib`.
    // Anything under `src/client` that touches the DOM is deliberately kept out
    // of those modules so the suite needs no browser environment.
    include: ["src/**/*.test.ts"],
    // Routes talk to a real database, so `.env` has to be loaded before any
    // module reads DATABASE_URL, and files must not race each other.
    setupFiles: ["dotenv/config"],
    fileParallelism: false,
  },
});
