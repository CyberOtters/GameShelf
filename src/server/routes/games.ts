import { Router } from "express";
import { prisma } from "../lib/prisma.ts";
import { badRequest, notFound } from "../lib/errors.ts";
import { requireAuth, sessionUserId } from "../lib/requireAuth.ts";
import {
  parseCreateGame,
  parseGameFilters,
  parseUpdateGame,
} from "../lib/validateGame.ts";
import {
  serializePlaySession,
  sumSessionHours,
} from "../lib/validateSession.ts";

export const gamesRouter = Router();

gamesRouter.use(requireAuth);

function gameId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw badRequest("Invalid game id");
  return id;
}

// GET /games?status=BACKLOG&archived=all — the shelf, backlog and wishlist
// views all read from here; wishlist is just `status=WISHLIST`.
gamesRouter.get("/", async (req, res) => {
  const userId = sessionUserId(req);
  const { status, archived } = parseGameFilters(req.query);

  const games = await prisma.game.findMany({
    where: {
      userId,
      ...(status ? { status } : {}),
      ...(archived === undefined ? {} : { archived }),
    },
    orderBy: [{ addedAt: "desc" }, { id: "desc" }],
    include: {
      // Newest first, matching GET /games/:gameId/sessions — the shelf card
      // reads sessions[0] as the most recent play.
      sessions: { orderBy: [{ sessionDate: "desc" }, { id: "desc" }] },
    },
  });

  // hours is a Decimal and sessionDate a DATE; serialize them the same way the
  // sessions endpoint does so the client sees numbers and YYYY-MM-DD strings.
  res.json(
    games.map((game) => ({
      ...game,
      sessions: game.sessions.map(serializePlaySession),
      totalHours: sumSessionHours(game.sessions),
    })),
  );
});

gamesRouter.post("/", async (req, res) => {
  const userId = sessionUserId(req);
  const input = parseCreateGame(req.body);

  // userId comes from the session only — never from the request body.
  const game = await prisma.game.create({ data: { ...input, userId } });

  res.status(201).json(game);
});

gamesRouter.patch("/:id", async (req, res) => {
  const userId = sessionUserId(req);
  const id = gameId(req.params.id);
  const patch = parseUpdateGame(req.body);

  // Matching on userId as well as id means another user's row simply isn't
  // found, rather than reporting that it exists but is forbidden.
  const { count } = await prisma.game.updateMany({
    where: { id, userId },
    data: patch,
  });
  if (count === 0) throw notFound("Game not found");

  const game = await prisma.game.findUnique({ where: { id } });
  res.json(game);
});

gamesRouter.delete("/:id", async (req, res) => {
  const userId = sessionUserId(req);
  const id = gameId(req.params.id);

  // Cascade takes the game's PlaySession rows with it.
  const { count } = await prisma.game.deleteMany({ where: { id, userId } });
  if (count === 0) throw notFound("Game not found");

  res.status(204).end();
});
