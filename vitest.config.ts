import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/server/**/*.test.ts"],
    // Routes talk to a real database, so `.env` has to be loaded before any
    // module reads DATABASE_URL, and files must not race each other.
    setupFiles: ["dotenv/config"],
    fileParallelism: false,
  },
});
