import "dotenv/config";
import path from "node:path";
import { existsSync } from "node:fs";
import express from "express";
import ejs from "ejs";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { prisma } from "./lib/prisma.js";

const app = express();
const port = process.env.PORT ?? 3000;

// Built by `npm run build`. Deployed, this file is the bundle at dist/server.js and
// the client sits beside it; from source it is src/server/index.ts and the client is
// in dist/. The client assets (compiled by `build:client` with stable names) are
// served from here in both dev and production.
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

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
app.use(express.static(clientDir));

app.get("/", (_req, res) => {
  res.render("index", {
    assets: { js: "/assets/home.js", css: ["/assets/shared.css", "/assets/home.css"] },
  });
});

app.get(["/login", "/register"], (_req, res) => {
  res.render("auth", {
    assets: { js: "/assets/auth.js", css: ["/assets/shared.css", "/assets/auth.css"] },
  });
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
