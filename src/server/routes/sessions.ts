import { Router } from "express";
import { prisma } from "../lib/prisma.ts";
import { badRequest, notFound } from "../lib/errors.ts";
import { requireAuth, sessionUserId } from "../lib/requireAuth.ts";
import {
  parseCreateSession,
  parseUpdateSession,
  serializePlaySession,
  sumSessionHours,
} from "../lib/validateSession.ts";

export const sessionsRouter = Router({ mergeParams: true });

sessionsRouter.use(requireAuth);

function gameId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw badRequest("Invalid game id");
  return id;
}

function routeGameId(params: Record<string, string | undefined>) {
  return gameId(String(params.gameId));
}

function routeSessionId(params: Record<string, string | undefined>) {
  return sessionId(String(params.sessionId));
}

function sessionId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw badRequest("Invalid session id");
  return id;
}

async function requireOwnedGame(gameIdValue: number, userId: string) {
  const game = await prisma.game.findFirst({
    where: { id: gameIdValue, userId },
    select: { id: true },
  });
  if (!game) throw notFound("Game not found");
  return game;
}

// GET /games/:gameId/sessions — list sessions for an owned game
sessionsRouter.get("/", async (req, res) => {
  const userId = sessionUserId(req);
  const gameIdValue = routeGameId(req.params);
  await requireOwnedGame(gameIdValue, userId);

  const sessions = await prisma.playSession.findMany({
    where: { gameId: gameIdValue, userId },
    orderBy: [{ sessionDate: "desc" }, { id: "desc" }],
  });

  res.json({
    sessions: sessions.map(serializePlaySession),
    totalHours: sumSessionHours(sessions),
  });
});

// POST /games/:gameId/sessions — log hours against an owned game
sessionsRouter.post("/", async (req, res) => {
  const userId = sessionUserId(req);
  const gameIdValue = routeGameId(req.params);
  await requireOwnedGame(gameIdValue, userId);

  const input = parseCreateSession(req.body);

  const session = await prisma.playSession.create({
    data: {
      gameId: gameIdValue,
      userId,
      hours: input.hours,
      sessionDate: input.sessionDate,
      notes: input.notes,
    },
  });

  res.status(201).json(serializePlaySession(session));
});

// PATCH /games/:gameId/sessions/:sessionId
sessionsRouter.patch("/:sessionId", async (req, res) => {
  const userId = sessionUserId(req);
  const gameIdValue = routeGameId(req.params);
  const sessionIdValue = routeSessionId(req.params);
  await requireOwnedGame(gameIdValue, userId);

  const patch = parseUpdateSession(req.body);

  const { count } = await prisma.playSession.updateMany({
    where: { id: sessionIdValue, gameId: gameIdValue, userId },
    data: patch,
  });
  if (count === 0) throw notFound("Session not found");

  const session = await prisma.playSession.findUnique({ where: { id: sessionIdValue } });
  res.json(serializePlaySession(session!));
});

// DELETE /games/:gameId/sessions/:sessionId
sessionsRouter.delete("/:sessionId", async (req, res) => {
  const userId = sessionUserId(req);
  const gameIdValue = routeGameId(req.params);
  const sessionIdValue = routeSessionId(req.params);
  await requireOwnedGame(gameIdValue, userId);

  const { count } = await prisma.playSession.deleteMany({
    where: { id: sessionIdValue, gameId: gameIdValue, userId },
  });
  if (count === 0) throw notFound("Session not found");

  res.status(204).end();
});
