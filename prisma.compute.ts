import { defineComputeConfig } from "@prisma/compute-sdk/config";

export default defineComputeConfig({
  app: {
    name: "prisma-hello",
    // "custom" rather than "bun": the bun strategy ships only a single bundled
    // server.js, so express.static had no files to serve. custom stages the whole
    // output directory, so dist/client ships alongside the server bundle.
    framework: "custom",
    httpPort: 3000,
    build: {
      command: "npm run build",
      outputDirectory: "dist",
      entrypoint: "server.js",
    },
  },
});
