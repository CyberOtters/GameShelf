import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth.ts";
import { errorHandler } from "../lib/errors.ts";
import { prisma } from "../lib/prisma.ts";
import { sessionsRouter } from "./sessions.ts";

// These are integration tests: they run the real router, the real Better Auth
// session lookup and a real database. Start one with `npx prisma dev` first.
const TEST_EMAIL_DOMAIN = "gameshelf.test";

/** Mirrors how `src/server/index.ts` mounts the router. */
function buildApp() {
  const app = express();
  app.all("/api/auth/*splat", toNodeHandler(auth));
  app.use(express.json());
  app.use("/api/sessions", sessionsRouter);
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

/** Registers a throwaway account and returns its id plus session cookie. */
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

/** Seeds a game directly so sessions have something to hang off. */
function seedGame(userId: string, game: Record<string, unknown> = {}) {
  return prisma.game.create({
    data: { userId, title: "Seeded", platform: "NES", ...game },
  });
}

/** Seeds a play session directly, bypassing the routes under test. */
function seedSession(
  userId: string,
  gameId: number,
  session: Record<string, unknown> = {},
) {
  return prisma.playSession.create({
    data: {
      userId,
      gameId,
      hours: 1.5,
      sessionDate: new Date("2026-08-01"),
      ...session,
    },
  });
}

let alice: TestUser;
let bob: TestUser;
let aliceGame: { id: number };
let bobGame: { id: number };

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
  alice = await signUp("alice-sessions");
  bob = await signUp("bob-sessions");
});

afterAll(async () => {
  await deleteTestUsers();
  await prisma.$disconnect();
  await close?.();
});

beforeEach(async () => {
  // Deleting the games cascades away any sessions from the previous test.
  await prisma.game.deleteMany({ where: { userId: { in: [alice.id, bob.id] } } });
  aliceGame = await seedGame(alice.id, { title: "Alice's Game" });
  bobGame = await seedGame(bob.id, { title: "Bob's Game" });
});

describe("requireAuth", () => {
  it.each([
    ["GET", "/api/sessions"],
    ["POST", "/api/sessions"],
    ["PATCH", "/api/sessions/1"],
    ["DELETE", "/api/sessions/1"],
  ])("401s %s %s without a session", async (method, path) => {
    const res = await api(path, {
      method,
      body: method === "GET" || method === "DELETE" ? undefined : {},
    });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "You must be signed in" });
  });

  it("does not touch the database when signed out", async () => {
    await api("/api/sessions", {
      method: "POST",
      body: { gameId: aliceGame.id, hours: 2, sessionDate: "2026-08-01" },
    });

    expect(
      await prisma.playSession.count({ where: { gameId: aliceGame.id } }),
    ).toBe(0);
  });
});

describe("POST /api/sessions", () => {
  it("logs a session against the user's own game", async () => {
    const res = await api("/api/sessions", {
      method: "POST",
      cookie: alice.cookie,
      body: {
        gameId: aliceGame.id,
        hours: 2.5,
        sessionDate: "2026-08-09",
        notes: "beat the water temple",
      },
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      userId: alice.id,
      gameId: aliceGame.id,
      hours: "2.5",
      notes: "beat the water temple",
      game: { title: "Alice's Game", platform: "NES" },
    });
    expect(res.body.sessionDate).toContain("2026-08-09");
  });

  it("applies defaults for the optional columns", async () => {
    const res = await api("/api/sessions", {
      method: "POST",
      cookie: alice.cookie,
      body: { gameId: aliceGame.id, hours: 1, sessionDate: "2026-08-01" },
    });

    expect(res.status).toBe(201);
    expect(res.body.notes).toBeNull();
  });

  it("takes userId from the session, never the body", async () => {
    const res = await api("/api/sessions", {
      method: "POST",
      cookie: alice.cookie,
      body: {
        gameId: aliceGame.id,
        hours: 1,
        sessionDate: "2026-08-01",
        userId: bob.id,
      },
    });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(alice.id);
  });

  it("404s when logging against another user's game", async () => {
    const res = await api("/api/sessions", {
      method: "POST",
      cookie: alice.cookie,
      body: { gameId: bobGame.id, hours: 1, sessionDate: "2026-08-01" },
    });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Game not found" });
    expect(
      await prisma.playSession.count({ where: { gameId: bobGame.id } }),
    ).toBe(0);
  });

  it("404s on a game that does not exist", async () => {
    const res = await api("/api/sessions", {
      method: "POST",
      cookie: alice.cookie,
      body: { gameId: 99999999, hours: 1, sessionDate: "2026-08-01" },
    });

    expect(res.status).toBe(404);
  });

  it("coerces numeric strings and blanks notes to null", async () => {
    const res = await api("/api/sessions", {
      method: "POST",
      cookie: alice.cookie,
      body: {
        gameId: String(aliceGame.id),
        hours: "3.5",
        sessionDate: "2026-08-02",
        notes: "   ",
      },
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ hours: "3.5", notes: null });
  });

  it("accepts hours at the limits", async () => {
    const low = await api("/api/sessions", {
      method: "POST",
      cookie: alice.cookie,
      body: { gameId: aliceGame.id, hours: 0.1, sessionDate: "2026-08-01" },
    });
    expect(low.status).toBe(201);

    const high = await api("/api/sessions", {
      method: "POST",
      cookie: alice.cookie,
      body: { gameId: aliceGame.id, hours: 999.9, sessionDate: "2026-08-01" },
    });
    expect(high.status).toBe(201);
    expect(high.body.hours).toBe("999.9");
  });

  it.each([0, -1, 1000, 2.55, "abc"])("rejects hours %p", async (hours) => {
    const res = await api("/api/sessions", {
      method: "POST",
      cookie: alice.cookie,
      body: { gameId: aliceGame.id, hours, sessionDate: "2026-08-01" },
    });

    expect(res.status).toBe(400);
    expect(res.body.fields.hours).toBe(
      "must be a number from 0.1 to 999.9, in tenths of an hour",
    );
  });

  it.each(["yesterday", "08-01-2026", "2026-13-40", ""])(
    "rejects sessionDate %p",
    async (sessionDate) => {
      const res = await api("/api/sessions", {
        method: "POST",
        cookie: alice.cookie,
        body: { gameId: aliceGame.id, hours: 1, sessionDate },
      });

      expect(res.status).toBe(400);
      expect(res.body.fields.sessionDate).toBe(
        "must be a date in YYYY-MM-DD format",
      );
    },
  );

  it("requires gameId, hours, and sessionDate", async () => {
    const res = await api("/api/sessions", {
      method: "POST",
      cookie: alice.cookie,
      body: {},
    });

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.fields).sort()).toEqual([
      "gameId",
      "hours",
      "sessionDate",
    ]);
  });

  it("rejects over-long notes", async () => {
    const res = await api("/api/sessions", {
      method: "POST",
      cookie: alice.cookie,
      body: {
        gameId: aliceGame.id,
        hours: 1,
        sessionDate: "2026-08-01",
        notes: "n".repeat(501),
      },
    });

    expect(res.status).toBe(400);
    expect(res.body.fields.notes).toBe("must be 500 characters or fewer");
  });

  it("rejects a body that is not an object", async () => {
    const res = await api("/api/sessions", {
      method: "POST",
      cookie: alice.cookie,
      body: [],
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Expected a JSON object" });
  });
});

describe("GET /api/sessions", () => {
  it("returns only the caller's sessions, newest session date first", async () => {
    const older = await seedSession(alice.id, aliceGame.id, {
      sessionDate: new Date("2026-08-01"),
    });
    const newer = await seedSession(alice.id, aliceGame.id, {
      sessionDate: new Date("2026-08-05"),
    });
    await seedSession(bob.id, bobGame.id);

    const res = await api("/api/sessions", { cookie: alice.cookie });

    expect(res.status).toBe(200);
    expect(res.body.map((session: any) => session.id)).toEqual([
      newer.id,
      older.id,
    ]);
    expect(res.body.every((session: any) => session.userId === alice.id)).toBe(
      true,
    );
  });

  it("includes the parent game's title and platform", async () => {
    await seedSession(alice.id, aliceGame.id);

    const res = await api("/api/sessions", { cookie: alice.cookie });

    expect(res.status).toBe(200);
    expect(res.body[0].game).toEqual({
      title: "Alice's Game",
      platform: "NES",
    });
  });

  it("filters by gameId", async () => {
    const otherGame = await seedGame(alice.id, { title: "Other" });
    await seedSession(alice.id, aliceGame.id, { notes: "wanted" });
    await seedSession(alice.id, otherGame.id, { notes: "filtered out" });

    const res = await api(`/api/sessions?gameId=${aliceGame.id}`, {
      cookie: alice.cookie,
    });

    expect(res.status).toBe(200);
    expect(res.body.map((session: any) => session.notes)).toEqual(["wanted"]);
  });

  it("rejects a bogus gameId filter", async () => {
    const res = await api("/api/sessions?gameId=abc", { cookie: alice.cookie });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid filters");
    expect(res.body.fields.gameId).toBe("must be a valid game id");
  });
});

describe("PATCH /api/sessions/:id", () => {
  it("updates the given fields and returns the row", async () => {
    const session = await seedSession(alice.id, aliceGame.id);

    const res = await api(`/api/sessions/${session.id}`, {
      method: "PATCH",
      cookie: alice.cookie,
      body: { hours: 4, sessionDate: "2026-08-07", notes: "long night" },
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: session.id,
      hours: "4",
      notes: "long night",
    });
    expect(res.body.sessionDate).toContain("2026-08-07");
  });

  it("clears notes when passed null", async () => {
    const session = await seedSession(alice.id, aliceGame.id, {
      notes: "old note",
    });

    const res = await api(`/api/sessions/${session.id}`, {
      method: "PATCH",
      cookie: alice.cookie,
      body: { notes: null },
    });

    expect(res.status).toBe(200);
    expect(res.body.notes).toBeNull();
  });

  it("validates the fields it is given", async () => {
    const session = await seedSession(alice.id, aliceGame.id);

    const res = await api(`/api/sessions/${session.id}`, {
      method: "PATCH",
      cookie: alice.cookie,
      body: { hours: 0, sessionDate: "soon" },
    });

    expect(res.status).toBe(400);
    expect(res.body.fields.hours).toContain("0.1 to 999.9");
    expect(res.body.fields.sessionDate).toContain("YYYY-MM-DD");
  });

  it("ignores attempts to move a session to another game", async () => {
    const session = await seedSession(alice.id, aliceGame.id);

    const res = await api(`/api/sessions/${session.id}`, {
      method: "PATCH",
      cookie: alice.cookie,
      body: { gameId: bobGame.id },
    });

    // gameId isn't an editable field, so this reads as an empty patch.
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "No fields to update" });
  });

  it("404s on another user's session and leaves it untouched", async () => {
    const session = await seedSession(bob.id, bobGame.id, { notes: "Bob's" });

    const res = await api(`/api/sessions/${session.id}`, {
      method: "PATCH",
      cookie: alice.cookie,
      body: { notes: "Pwned" },
    });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Session not found" });
    expect(
      (await prisma.playSession.findUnique({ where: { id: session.id } }))
        ?.notes,
    ).toBe("Bob's");
  });

  it("404s on an id that does not exist", async () => {
    const res = await api("/api/sessions/99999999", {
      method: "PATCH",
      cookie: alice.cookie,
      body: { hours: 1 },
    });

    expect(res.status).toBe(404);
  });

  it("400s on a non-numeric id", async () => {
    const res = await api("/api/sessions/abc", {
      method: "PATCH",
      cookie: alice.cookie,
      body: { hours: 1 },
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid session id" });
  });

  it("400s when there is nothing to update", async () => {
    const session = await seedSession(alice.id, aliceGame.id);

    const res = await api(`/api/sessions/${session.id}`, {
      method: "PATCH",
      cookie: alice.cookie,
      body: {},
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "No fields to update" });
  });
});

describe("DELETE /api/sessions/:id", () => {
  it("deletes an owned session once", async () => {
    const session = await seedSession(alice.id, aliceGame.id);

    const first = await api(`/api/sessions/${session.id}`, {
      method: "DELETE",
      cookie: alice.cookie,
    });
    expect(first.status).toBe(204);
    expect(
      await prisma.playSession.findUnique({ where: { id: session.id } }),
    ).toBeNull();

    const second = await api(`/api/sessions/${session.id}`, {
      method: "DELETE",
      cookie: alice.cookie,
    });
    expect(second.status).toBe(404);
  });

  it("404s on another user's session and leaves it in place", async () => {
    const session = await seedSession(bob.id, bobGame.id);

    const res = await api(`/api/sessions/${session.id}`, {
      method: "DELETE",
      cookie: alice.cookie,
    });

    expect(res.status).toBe(404);
    expect(
      await prisma.playSession.findUnique({ where: { id: session.id } }),
    ).not.toBeNull();
  });

  it("leaves the parent game in place", async () => {
    const session = await seedSession(alice.id, aliceGame.id);

    await api(`/api/sessions/${session.id}`, {
      method: "DELETE",
      cookie: alice.cookie,
    });

    expect(
      await prisma.game.findUnique({ where: { id: aliceGame.id } }),
    ).not.toBeNull();
  });
});
