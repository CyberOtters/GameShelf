import "dotenv/config";
import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import express from "express";
import ejs from "ejs";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { prisma } from "./lib/prisma.js";

const app = express();
const port = process.env.PORT ?? 3000;
const isDev = process.env.NODE_ENV === "development";
// In dev the client modules are served for HMR by Vite's dev server; the browser
// loads them from this origin while Express renders the pages on :3000.
const viteDevOrigin = "http://localhost:5173";

// Built by `npm run build`. Deployed, this file is the bundle at dist/server.js and
// the client sits beside it; from source it is src/server/index.ts and the client is
// in dist/.
const clientCandidates = [
  path.resolve(import.meta.dirname, "client"),
  path.resolve(import.meta.dirname, "../../dist/client"),
];
const clientDir = clientCandidates.find(existsSync) ?? clientCandidates[1];

// EJS views ship beside the server: src/server/views from source, dist/views once
// `build:server` copies them next to the bundle.
app.engine("ejs", ejs.renderFile);
app.set("view engine", "ejs");
app.set("views", path.resolve(import.meta.dirname, "views"));

type ViteChunk = { file: string; css?: string[] };
type PageAssets = { js: string; css: string[]; dev: string | null };
let manifest: Record<string, ViteChunk> | null = null;

// Resolve the built JS/CSS for a client entry. In production the URLs come from
// Vite's manifest (hashed filenames); in dev they point at the Vite dev server,
// which injects the SCSS through the JS module, so no separate CSS links.
function assetsFor(entry: "home" | "auth"): PageAssets {
  if (isDev) {
    return { js: `${viteDevOrigin}/${entry}.ts`, css: [], dev: viteDevOrigin };
  }
  if (!manifest) {
    const manifestPath = path.join(clientDir, ".vite", "manifest.json");
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  }
  const chunk = manifest![`${entry}.ts`];
  return {
    js: `/${chunk.file}`,
    css: (chunk.css ?? []).map((file) => `/${file}`),
    dev: null,
  };
}

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
app.use(express.static(clientDir));

app.get("/", (_req, res) => {
  const { js, css, dev } = assetsFor("home");
  res.render("index", { assets: { js, css }, dev });
});

app.get(["/login", "/register"], (_req, res) => {
  const { js, css, dev } = assetsFor("auth");
  res.render("auth", { assets: { js, css }, dev });
});

app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  res.json(session);
});

// quick sanity check that Prisma + Postgres are wired up
app.get("/games", async (_req, res) => {
  const games = await prisma.game.findMany();
  res.json(games);
});

app.listen(port, () => {
  console.log(`GameShelf listening on http://localhost:${port}`);
});
