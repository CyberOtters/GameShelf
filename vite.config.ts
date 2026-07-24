import path from "node:path";
import { defineConfig } from "vite";

const clientDir = path.resolve(import.meta.dirname, "src/client");

// The pages are server-rendered EJS (see src/server/views). Vite no longer owns any
// HTML — it only bundles the client entry points and emits a manifest so the server
// can resolve the hashed asset URLs. In dev the browser loads the page from Express
// on :3000 and pulls these modules (and HMR) from the Vite dev server on :5173.
export default defineConfig({
  root: clientDir,
  server: {
    port: 5173,
    cors: true,
    origin: "http://localhost:5173",
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/client"),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: {
        home: path.join(clientDir, "home.ts"),
        auth: path.join(clientDir, "auth.ts"),
      },
    },
  },
});
