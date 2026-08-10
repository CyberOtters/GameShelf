import "dotenv/config";
import path from "node:path";
import express from "express";
import ejs from "ejs";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.ts";
import { errorHandler } from "./lib/errors.ts";
import { gamesRouter } from "./routes/games.ts";
import { requireAuth } from "./lib/requireAuth.ts";
import { shelfRouter } from "./routes/shelf.ts";

const app = express();
const port = process.env.PORT ?? 3000;
const isDev = process.env.STAGE === "development";
console.log(
  `GameShelf starting in ${isDev ? "development" : "production"} mode`,
);
console.log(`DATABASE_URL=${process.env.DATABASE_URL}`);

const clientDir = isDev
  ? path.resolve(import.meta.dirname, "../../dist/client")
  : path.resolve(import.meta.dirname, "client");
// Static files (favicon.ico, etc.). From the project root in dev; `build:server`
// copies public/ next to the bundle for production.
const publicDir = isDev
  ? path.resolve(import.meta.dirname, "../../public")
  : path.resolve(import.meta.dirname, "public");
// EJS views ship beside the server: src/server/views from source, dist/views once
// `build:server` copies them next to the bundle.
app.engine("ejs", ejs.renderFile);
app.set("view engine", "ejs");
app.set("views", path.resolve(import.meta.dirname, "views"));

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
app.use(express.static(publicDir));
app.use(express.static(clientDir));

app.get("/", (_req, res) => {
  res.render("index", {
    assets: {
      js: "/assets/home.js",
      css: ["/assets/shared.css", "/assets/home.css"],
    },
  });
});

app.get(["/login", "/register"], (_req, res) => {
  res.render("auth", {
    assets: {
      js: "/assets/auth.js",
      css: ["/assets/shared.css", "/assets/auth.css"],
    },
  });
});

app.get("/api/me", requireAuth, async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  res.json(session);
});

app.use("/shelf", shelfRouter);

app.use("/api/games", gamesRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`GameShelf listening on http://localhost:${port}`);
});
