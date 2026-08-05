import "dotenv/config";
import path from "node:path";
import express from "express";
import ejs from "ejs";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.ts";
import { prisma } from "./lib/prisma.ts";

const app = express();
const port = process.env.PORT ?? 3000;
const isDev = process.env.STAGE === "development";
console.log(
  `GameShelf starting in ${isDev ? "development" : "production"} mode`,
);

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

// gameshelf
app.get("/shelf", (_req, res) => {
  // temporary games or data
  const games = [
    {
      id: 1,
      userId: "temporary-user-id",
      title: "Hades",
      platform: "PC",
      priority: "HIGH",
      status: "PLAYING",
      archived: false,
      rating: 9,
      coverUrl: null,
      addedAt: new Date("2026-07-10T12:00:00"),
      notes: "Working through the main story.",
    },
    {
      id: 2,
      userId: "temporary-user-id",
      title: "Hollow Knight",
      platform: "Nintendo Switch",
      priority: "MEDIUM",
      status: "BACKLOG",
      archived: false,
      rating: null,
      coverUrl: null,
      addedAt: new Date("2026-07-15T12:00:00"),
      notes: null,
    },
    {
      id: 3,
      userId: "temporary-user-id",
      title: "Metroid Prime 4",
      platform: "Nintendo Switch",
      priority: "HIGH",
      status: "WISHLIST",
      archived: false,
      rating: null,
      coverUrl: null,
      addedAt: new Date("2026-07-20T12:00:00"),
      notes: "Buy after release.",
    },
    {
      id: 4,
      userId: "temporary-user-id",
      title: "Final Fantasy VII Rebirth",
      platform: "PS5",
      priority: "LOW",
      status: "DROPPED",
      archived: true,
      rating: 6,
      coverUrl: null,
      addedAt: new Date("2026-07-25T12:00:00"),
      notes: "May return to it later.",
    },
    {
      id: 5,
      userId: "temporary-user-id",
      title: "Celeste",
      platform: "PC",
      priority: "MEDIUM",
      status: "COMPLETED",
      archived: false,
      rating: 10,
      coverUrl: null,
      addedAt: new Date("2026-07-30T12:00:00"),
      notes: "Finished the main story.",
    },
  ];

  res.render("shelf", {
    games,
    assets: {
      js: "assets/shelf.js",
      css: ["/assets/shared.css", "/assets/shelf.css"],
    },
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
