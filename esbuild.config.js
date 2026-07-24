import esbuild from "esbuild";

// Toggle dev behavior with `--watch` (adds sourcemaps + rebuilds on change).
// Select a single target with `--server` or `--client`; default builds both.
const args = process.argv.slice(2);
const watch = args.includes("--watch");
const only = args.includes("--server")
  ? "server"
  : args.includes("--client")
    ? "client"
    : "both";

/** @type {import("esbuild").BuildOptions} */
const server = {
  entryPoints: ["src/server/index.ts"],
  outfile: "dist/server.js",
  bundle: true,
  platform: "node",
  format: "esm",
  sourcemap: watch,
  minify: !watch,
  // Recreate `require` for CJS deps pulled into the ESM bundle.
  banner: {
    js: "import{createRequire}from'node:module';const require=createRequire(import.meta.url);",
  },
};

/** @type {import("esbuild").BuildOptions} */
const client = {
  entryPoints: ["src/client/home.ts", "src/client/auth.ts"],
  outdir: "dist/client/assets",
  bundle: true,
  format: "esm",
  sourcemap: watch,
  minify: !watch,
};

const configs = {
  server: [server],
  client: [client],
  both: [server, client],
}[only];

if (watch) {
  await Promise.all(
    configs.map(async (config) => {
      const ctx = await esbuild.context(config);
      await ctx.watch();
    }),
  );
  console.log(`esbuild watching (${only})...`);
} else {
  await Promise.all(configs.map((config) => esbuild.build(config)));
}
