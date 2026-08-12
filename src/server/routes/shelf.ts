import { Router } from "express";
import { prisma } from "../lib/prisma.ts";
import { requirePageAuth } from "../lib/pageAuth.ts";

export const shelfRouter = Router();

shelfRouter.use(requirePageAuth);

shelfRouter.get("/", (req, res) => {
  res.render("shelf", {
    user: req.sessionUser,
    assets: {
      js: "/assets/shelf.js",
      css: ["/assets/shared.css", "/assets/shelf.css"],
    },
  });
});

shelfRouter.get("/games/:gameId/log", async (req, res) => {
  const gameId = Number(req.params.gameId);
  if (!Number.isInteger(gameId) || gameId < 1) {
    res.redirect("/shelf");
    return;
  }

  const game = await prisma.game.findFirst({
    where: { id: gameId, userId: req.userId },
    select: { id: true, title: true, platform: true, status: true },
  });

  if (!game) {
    res.redirect("/shelf");
    return;
  }

  res.render("game-log", {
    user: req.sessionUser,
    game,
    assets: {
      js: "/assets/game-log.js",
      css: ["/assets/shared.css", "/assets/game-log.css"],
    },
  });
});
