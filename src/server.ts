import "dotenv/config";
import path from "node:path";
import express from "express";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { prisma } from "./lib/prisma.js";

const app = express();
const port = process.env.PORT ?? 3000;
// Built by `npm run build` (Vite). In dev the client is served by `vite` on :5173,
// which proxies /api and /games back here.
const clientDir = path.resolve(import.meta.dirname, "../dist/client");

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
app.use(express.static(clientDir));

app.get(["/login", "/register"], (_req, res) => {
  res.sendFile(path.join(clientDir, "auth.html"));
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
