import { Router } from "express";
import { prisma } from "../lib/prisma.ts";
import { badRequest, notFound } from "../lib/errors.ts";
import { requireAuth, sessionUserId } from "../lib/requireAuth.ts";
import {
  parseCreateSession,
  parseSessionFilters,
  parseUpdateSession,
} from "../lib/validateSession.ts";

export const sessionsRouter = Router();

sessionsRouter.use(requireAuth);

function playSessionId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw badRequest("Invalid session id");
  return id;
}

// The parent game's title and platform ride along so the session list is
// readable on its own, without a second lookup per row.
const withGame = {
  game: { select: { title: true, platform: true } },
} as const;

// GET /sessions?gameId=42 — the user's play log, newest session first.
sessionsRouter.get("/", async (req, res) => {
  const userId = sessionUserId(req);
  const { gameId } = parseSessionFilters(req.query);

  const sessions = await prisma.playSession.findMany({
    where: { userId, ...(gameId ? { gameId } : {}) },
    orderBy: [{ sessionDate: "desc" }, { id: "desc" }],
    include: withGame,
  });

  res.json(sessions);
});

sessionsRouter.post("/", async (req, res) => {
  const userId = sessionUserId(req);
  const input = parseCreateSession(req.body);

  // Logging time against someone else's game reads as the game not existing,
  // the same way the game routes treat foreign rows.
  const game = await prisma.game.findFirst({
    where: { id: input.gameId, userId },
    select: { id: true },
  });
  if (!game) throw notFound("Game not found");

  // userId comes from the session only — never from the request body.
  const playSession = await prisma.playSession.create({
    data: { ...input, userId },
    include: withGame,
  });

  res.status(201).json(playSession);
});

sessionsRouter.patch("/:id", async (req, res) => {
  const userId = sessionUserId(req);
  const id = playSessionId(req.params.id);
  const patch = parseUpdateSession(req.body);

  // Matching on userId as well as id means another user's row simply isn't
  // found, rather than reporting that it exists but is forbidden.
  const { count } = await prisma.playSession.updateMany({
    where: { id, userId },
    data: patch,
  });
  if (count === 0) throw notFound("Session not found");

  const playSession = await prisma.playSession.findUnique({
    where: { id },
    include: withGame,
  });
  res.json(playSession);
});

sessionsRouter.delete("/:id", async (req, res) => {
  const userId = sessionUserId(req);
  const id = playSessionId(req.params.id);

  const { count } = await prisma.playSession.deleteMany({
    where: { id, userId },
  });
  if (count === 0) throw notFound("Session not found");

  res.status(204).end();
});
