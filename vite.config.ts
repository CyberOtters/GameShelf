import path from "node:path";
import { defineConfig, type Plugin } from "vite";

const clientDir = path.resolve(import.meta.dirname, "client");

// Express serves auth.html at /login and /register; mirror those URLs in the
// dev server so both entry points behave the same on :5173 and in production.
function authRoutes(): Plugin {
  return {
    name: "gameshelf-auth-routes",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const pathname = req.url?.split("?")[0];
        if (pathname === "/login" || pathname === "/register") {
          req.url = "/auth.html";
        }
        next();
      });
    },
  };
}

export default defineConfig({
  root: clientDir,
  plugins: [authRoutes()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
      "/games": "http://localhost:3000",
    },
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/client"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.join(clientDir, "index.html"),
        auth: path.join(clientDir, "auth.html"),
      },
    },
  },
});
