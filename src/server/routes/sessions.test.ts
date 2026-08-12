import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth.ts";
import { errorHandler } from "../lib/errors.ts";
import { prisma } from "../lib/prisma.ts";
import { gamesRouter } from "./games.ts";
import { sessionsRouter } from "./sessions.ts";

const TEST_EMAIL_DOMAIN = "gameshelf.test";

function buildApp() {
  const app = express();
  app.all("/api/auth/*splat", toNodeHandler(auth));
  app.use(express.json());
  app.use("/api/games", gamesRouter);
  app.use("/api/games/:gameId/sessions", sessionsRouter);
  app.use(errorHandler);
  return app;
}

interface Response<T = any> {
  status: number;
  body: T;
}

let baseUrl: string;
let close: () => Promise<void>;

async function api<T = any>(
  path: string,
  options: { method?: string; body?: unknown; cookie?: string } = {},
): Promise<Response<T>> {
  const { method = "GET", body, cookie } = options;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(cookie ? { cookie } : {}),
    },
    body:
      body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
  });

  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

interface TestUser {
  id: string;
  cookie: string;
}

async function signUp(name: string): Promise<TestUser> {
  const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      email: `${name}@${TEST_EMAIL_DOMAIN}`,
      password: `${name}-test-password`,
    }),
  });
  if (!res.ok) throw new Error(`sign-up failed: ${res.status} ${await res.text()}`);

  const cookie = (res.headers.getSetCookie() ?? [])
    .map((value) => value.split(";")[0])
    .join("; ");
  const { user } = (await res.json()) as { user: { id: string } };

  return { id: user.id, cookie };
}

async function deleteTestUsers() {
  await prisma.user.deleteMany({
    where: { email: { endsWith: `@${TEST_EMAIL_DOMAIN}` } },
  });
}

function seedGame(userId: string, game: Record<string, unknown> = {}) {
  return prisma.game.create({
    data: { userId, title: "Seeded", platform: "NES", ...game },
  });
}

let alice: TestUser;
let bob: TestUser;

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (cause) {
    throw new Error(
      "These tests need a database. Start one with `npx prisma dev` and check DATABASE_URL.",
      { cause },
    );
  }

  const server = buildApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");
  baseUrl = `http://localhost:${address.port}`;
  close = () => new Promise<void>((resolve) => server.close(() => resolve()));

  await deleteTestUsers();
  alice = await signUp("alice");
  bob = await signUp("bob");
});

afterAll(async () => {
  await deleteTestUsers();
  await prisma.$disconnect();
  await close?.();
});

beforeEach(async () => {
  await prisma.game.deleteMany({ where: { userId: { in: [alice.id, bob.id] } } });
});

describe("requireAuth", () => {
  it.each([
    ["GET", "/api/games/1/sessions"],
    ["POST", "/api/games/1/sessions"],
    ["PATCH", "/api/games/1/sessions/1"],
    ["DELETE", "/api/games/1/sessions/1"],
  ])("401s %s %s without a session", async (method, path) => {
    const res = await api(path, {
      method,
      body: method === "GET" || method === "DELETE" ? undefined : {},
    });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "You must be signed in" });
  });
});

describe("POST /api/games/:gameId/sessions", () => {
  it("creates a session for an owned game", async () => {
    const game = await seedGame(alice.id, { title: "Hollow Knight" });

    const res = await api(`/api/games/${game.id}/sessions`, {
      method: "POST",
      cookie: alice.cookie,
      body: {
        hours: 2.5,
        sessionDate: "2026-08-01",
        notes: "beat the Mantis Lords",
      },
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      gameId: game.id,
      userId: alice.id,
      hours: 2.5,
      sessionDate: "2026-08-01",
      notes: "beat the Mantis Lords",
    });
  });

  it("404s when the game belongs to someone else", async () => {
    const game = await seedGame(bob.id);

    const res = await api(`/api/games/${game.id}/sessions`, {
      method: "POST",
      cookie: alice.cookie,
      body: { hours: 1, sessionDate: "2026-08-01" },
    });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Game not found" });
    expect(await prisma.playSession.count({ where: { gameId: game.id } })).toBe(0);
  });

  it("rejects invalid hours and session dates", async () => {
    const game = await seedGame(alice.id);

    const res = await api(`/api/games/${game.id}/sessions`, {
      method: "POST",
      cookie: alice.cookie,
      body: {
        hours: 1000,
        sessionDate: "08/01/2026",
      },
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Some fields need fixing");
    expect(res.body.fields.hours).toContain("0.1");
    expect(res.body.fields.sessionDate).toContain("YYYY-MM-DD");
  });

  it("rejects notes that are too long", async () => {
    const game = await seedGame(alice.id);

    const res = await api(`/api/games/${game.id}/sessions`, {
      method: "POST",
      cookie: alice.cookie,
      body: {
        hours: 1,
        sessionDate: "2026-08-01",
        notes: "n".repeat(501),
      },
    });

    expect(res.status).toBe(400);
    expect(res.body.fields.notes).toContain("500");
  });

  it("accepts hours at the upper limit with one decimal place", async () => {
    const game = await seedGame(alice.id);

    const res = await api(`/api/games/${game.id}/sessions`, {
      method: "POST",
      cookie: alice.cookie,
      body: { hours: "999.9", sessionDate: "2026-01-15" },
    });

    expect(res.status).toBe(201);
    expect(res.body.hours).toBe(999.9);
  });
});

describe("GET /api/games/:gameId/sessions", () => {
  it("lists sessions newest-first and returns totalHours", async () => {
    const game = await seedGame(alice.id);
    await prisma.playSession.createMany({
      data: [
        {
          gameId: game.id,
          userId: alice.id,
          hours: 1.5,
          sessionDate: new Date("2026-07-01"),
        },
        {
          gameId: game.id,
          userId: alice.id,
          hours: 2,
          sessionDate: new Date("2026-08-01"),
        },
      ],
    });

    const res = await api(`/api/games/${game.id}/sessions`, { cookie: alice.cookie });

    expect(res.status).toBe(200);
    expect(res.body.totalHours).toBe(3.5);
    expect(res.body.sessions.map((session: any) => session.sessionDate)).toEqual([
      "2026-08-01",
      "2026-07-01",
    ]);
    expect(res.body.sessions.every((session: any) => typeof session.hours === "number")).toBe(
      true,
    );
  });

  it("404s for another user's game", async () => {
    const game = await seedGame(bob.id);

    const res = await api(`/api/games/${game.id}/sessions`, { cookie: alice.cookie });

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/games/:gameId/sessions/:sessionId", () => {
  it("updates an owned session", async () => {
    const game = await seedGame(alice.id);
    const session = await prisma.playSession.create({
      data: {
        gameId: game.id,
        userId: alice.id,
        hours: 1,
        sessionDate: new Date("2026-08-01"),
        notes: "old",
      },
    });

    const res = await api(`/api/games/${game.id}/sessions/${session.id}`, {
      method: "PATCH",
      cookie: alice.cookie,
      body: { hours: 3.5, sessionDate: "2026-08-02", notes: null },
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      hours: 3.5,
      sessionDate: "2026-08-02",
      notes: null,
    });
  });

  it("404s on another user's session", async () => {
    const game = await seedGame(bob.id);
    const session = await prisma.playSession.create({
      data: {
        gameId: game.id,
        userId: bob.id,
        hours: 1,
        sessionDate: new Date("2026-08-01"),
      },
    });

    const res = await api(`/api/games/${game.id}/sessions/${session.id}`, {
      method: "PATCH",
      cookie: alice.cookie,
      body: { hours: 9 },
    });

    expect(res.status).toBe(404);
    expect(
      (await prisma.playSession.findUnique({ where: { id: session.id } }))?.hours.toNumber(),
    ).toBe(1);
  });

  it("400s when there is nothing to update", async () => {
    const game = await seedGame(alice.id);
    const session = await prisma.playSession.create({
      data: {
        gameId: game.id,
        userId: alice.id,
        hours: 1,
        sessionDate: new Date("2026-08-01"),
      },
    });

    const res = await api(`/api/games/${game.id}/sessions/${session.id}`, {
      method: "PATCH",
      cookie: alice.cookie,
      body: {},
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "No fields to update" });
  });
});

describe("DELETE /api/games/:gameId/sessions/:sessionId", () => {
  it("deletes an owned session", async () => {
    const game = await seedGame(alice.id);
    const session = await prisma.playSession.create({
      data: {
        gameId: game.id,
        userId: alice.id,
        hours: 1,
        sessionDate: new Date("2026-08-01"),
      },
    });

    const first = await api(`/api/games/${game.id}/sessions/${session.id}`, {
      method: "DELETE",
      cookie: alice.cookie,
    });
    expect(first.status).toBe(204);
    expect(await prisma.playSession.findUnique({ where: { id: session.id } })).toBeNull();

    const second = await api(`/api/games/${game.id}/sessions/${session.id}`, {
      method: "DELETE",
      cookie: alice.cookie,
    });
    expect(second.status).toBe(404);
  });

  it("404s on another user's session", async () => {
    const game = await seedGame(bob.id);
    const session = await prisma.playSession.create({
      data: {
        gameId: game.id,
        userId: bob.id,
        hours: 1,
        sessionDate: new Date("2026-08-01"),
      },
    });

    const res = await api(`/api/games/${game.id}/sessions/${session.id}`, {
      method: "DELETE",
      cookie: alice.cookie,
    });

    expect(res.status).toBe(404);
    expect(await prisma.playSession.findUnique({ where: { id: session.id } })).not.toBeNull();
  });
});

describe("wishlist rule", () => {
  it("409s when logging play time against a wishlisted game", async () => {
    const game = await seedGame(alice.id, { status: "WISHLIST" });

    const res = await api(`/api/games/${game.id}/sessions`, {
      method: "POST",
      cookie: alice.cookie,
      body: { hours: 2, sessionDate: "2026-08-01" },
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/wishlisted game/i);
    expect(await prisma.playSession.count({ where: { gameId: game.id } })).toBe(0);
  });

  it("allows logging once the game moves off the wishlist", async () => {
    const game = await seedGame(alice.id, { status: "BACKLOG" });

    const res = await api(`/api/games/${game.id}/sessions`, {
      method: "POST",
      cookie: alice.cookie,
      body: { hours: 2, sessionDate: "2026-08-01" },
    });

    expect(res.status).toBe(201);
  });

  it("404s another user's wishlisted game rather than leaking the rule", async () => {
    const game = await seedGame(bob.id, { status: "WISHLIST" });

    const res = await api(`/api/games/${game.id}/sessions`, {
      method: "POST",
      cookie: alice.cookie,
      body: { hours: 2, sessionDate: "2026-08-01" },
    });

    expect(res.status).toBe(404);
  });
});
