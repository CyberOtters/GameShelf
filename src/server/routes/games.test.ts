import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth.ts";
import { errorHandler } from "../lib/errors.ts";
import { prisma } from "../lib/prisma.ts";
import { gamesRouter } from "./games.ts";

// These are integration tests: they run the real router, the real Better Auth
// session lookup and a real database. Start one with `npx prisma dev` first.
const TEST_EMAIL_DOMAIN = "gameshelf.test";

/** Mirrors how `src/server/index.ts` mounts the router. */
function buildApp() {
  const app = express();
  app.all("/api/auth/*splat", toNodeHandler(auth));
  app.use(express.json());
  app.use("/api/games", gamesRouter);
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

/** Seeds a game directly, bypassing the routes under test. */
function seed(userId: string, game: Record<string, unknown> = {}) {
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
    ["GET", "/api/games"],
    ["POST", "/api/games"],
    ["PATCH", "/api/games/1"],
    ["DELETE", "/api/games/1"],
  ])("401s %s %s without a session", async (method, path) => {
    const res = await api(path, {
      method,
      body: method === "GET" || method === "DELETE" ? undefined : {},
    });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "You must be signed in" });
  });

  it("does not touch the database when signed out", async () => {
    await api("/api/games", {
      method: "POST",
      body: { title: "Ghost", platform: "NES" },
    });

    expect(await prisma.game.count({ where: { title: "Ghost" } })).toBe(0);
  });
});

describe("POST /api/games", () => {
  it("creates a game owned by the session user", async () => {
    const res = await api("/api/games", {
      method: "POST",
      cookie: alice.cookie,
      body: {
        title: "  Super Mario Bros. 3  ",
        platform: "NES",
        status: "PLAYING",
        priority: "HIGH",
        rating: 10,
        notes: "raccoon suit",
      },
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      userId: alice.id,
      title: "Super Mario Bros. 3",
      platform: "NES",
      status: "PLAYING",
      priority: "HIGH",
      rating: 10,
      notes: "raccoon suit",
      archived: false,
    });
  });

  it("applies defaults for the optional columns", async () => {
    const res = await api("/api/games", {
      method: "POST",
      cookie: alice.cookie,
      body: { title: "Chrono Trigger", platform: "SNES" },
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      status: "BACKLOG",
      priority: null,
      rating: null,
      notes: null,
      archived: false,
    });
  });

  it("takes userId from the session, never the body", async () => {
    const res = await api("/api/games", {
      method: "POST",
      cookie: alice.cookie,
      body: { title: "Injection", platform: "PC", userId: bob.id },
    });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(alice.id);
  });

  it("coerces a numeric-string rating and blanks to null", async () => {
    const res = await api("/api/games", {
      method: "POST",
      cookie: alice.cookie,
      body: {
        title: "Metroid Prime 4",
        platform: "Switch",
        rating: "7",
        notes: "   ",
        priority: "",
      },
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ rating: 7, notes: null, priority: null });
  });

  it("accepts explicit nulls for the nullable columns", async () => {
    const res = await api("/api/games", {
      method: "POST",
      cookie: alice.cookie,
      body: {
        title: "Tetris",
        platform: "Game Boy",
        rating: null,
        notes: null,
        priority: null,
      },
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ rating: null, notes: null, priority: null });
  });

  it("accepts values sitting exactly on the limits", async () => {
    const title = "t".repeat(100);
    const platform = "p".repeat(30);
    const notes = "n".repeat(500);

    const res = await api("/api/games", {
      method: "POST",
      cookie: alice.cookie,
      body: { title, platform, notes, rating: 1 },
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title, platform, notes, rating: 1 });
  });

  it("reports every bad field at once", async () => {
    const res = await api("/api/games", {
      method: "POST",
      cookie: alice.cookie,
      body: {
        title: "x".repeat(101),
        platform: "p".repeat(31),
        status: "NOPE",
        priority: "URGENT",
        rating: 11,
        notes: "n".repeat(501),
      },
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Some fields need fixing");
    expect(Object.keys(res.body.fields).sort()).toEqual([
      "notes",
      "platform",
      "priority",
      "rating",
      "status",
      "title",
    ]);
    expect(res.body.fields.title).toBe("must be 100 characters or fewer");
    expect(res.body.fields.rating).toBe(
      "must be a whole number from 1 to 10, or null",
    );
  });

  it("requires title and platform", async () => {
    const res = await api("/api/games", {
      method: "POST",
      cookie: alice.cookie,
      body: {},
    });

    expect(res.status).toBe(400);
    expect(res.body.fields).toEqual({
      title: "is required",
      platform: "is required",
    });
  });

  it("rejects a blank title", async () => {
    const res = await api("/api/games", {
      method: "POST",
      cookie: alice.cookie,
      body: { title: "   ", platform: "NES" },
    });

    expect(res.status).toBe(400);
    expect(res.body.fields.title).toBe("is required");
  });

  it.each([0, 7.5, "abc"])("rejects rating %p", async (rating) => {
    const res = await api("/api/games", {
      method: "POST",
      cookie: alice.cookie,
      body: { title: "T", platform: "P", rating },
    });

    expect(res.status).toBe(400);
    expect(res.body.fields.rating).toBe(
      "must be a whole number from 1 to 10, or null",
    );
  });

  it("rejects a body that is not an object", async () => {
    const res = await api("/api/games", {
      method: "POST",
      cookie: alice.cookie,
      body: [],
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Expected a JSON object" });
  });

  it("rejects malformed JSON", async () => {
    const res = await api("/api/games", {
      method: "POST",
      cookie: alice.cookie,
      body: "{oops",
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid request body" });
  });
});

describe("GET /api/games", () => {
  it("returns only the caller's games, newest first", async () => {
    const older = await seed(alice.id, { title: "Older" });
    const newer = await seed(alice.id, { title: "Newer" });
    await seed(bob.id, { title: "Bob's" });

    const res = await api("/api/games", { cookie: alice.cookie });

    expect(res.status).toBe(200);
    expect(res.body.map((game: any) => game.id)).toEqual([newer.id, older.id]);
    expect(res.body.every((game: any) => game.userId === alice.id)).toBe(true);
  });

  it("filters by status", async () => {
    await seed(alice.id, { title: "Wishlisted", status: "WISHLIST" });
    await seed(alice.id, { title: "Backlogged", status: "BACKLOG" });

    const res = await api("/api/games?status=WISHLIST", { cookie: alice.cookie });

    expect(res.status).toBe(200);
    expect(res.body.map((game: any) => game.title)).toEqual(["Wishlisted"]);
  });

  it("hides archived games unless asked for them", async () => {
    const active = await seed(alice.id, { title: "Active" });
    const archived = await seed(alice.id, { title: "Archived", archived: true });

    const ids = async (query: string) =>
      (await api(`/api/games${query}`, { cookie: alice.cookie })).body
        .map((game: any) => game.id)
        .sort();

    expect(await ids("")).toEqual([active.id]);
    expect(await ids("?archived=true")).toEqual([archived.id]);
    expect(await ids("?archived=false")).toEqual([active.id]);
    expect(await ids("?archived=all")).toEqual([active.id, archived.id].sort());
  });

  it("rejects unknown filter values", async () => {
    const status = await api("/api/games?status=bogus", { cookie: alice.cookie });
    expect(status.status).toBe(400);
    expect(status.body.error).toBe("Invalid filters");
    expect(status.body.fields.status).toContain("must be one of");

    const archived = await api("/api/games?archived=maybe", {
      cookie: alice.cookie,
    });
    expect(archived.status).toBe(400);
    expect(archived.body.fields.archived).toBe("must be true, false, or all");
  });
});

describe("PATCH /api/games/:id", () => {
  it("updates the given fields and returns the row", async () => {
    const game = await seed(alice.id, { status: "PLAYING", rating: 5 });

    const res = await api(`/api/games/${game.id}`, {
      method: "PATCH",
      cookie: alice.cookie,
      body: { status: "COMPLETED", rating: 9, notes: "credits rolled" },
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: game.id,
      status: "COMPLETED",
      rating: 9,
      notes: "credits rolled",
      platform: "NES",
    });
  });

  it("updates title and platform, trimming both", async () => {
    const game = await seed(alice.id, { title: "Old", platform: "NES" });

    const res = await api(`/api/games/${game.id}`, {
      method: "PATCH",
      cookie: alice.cookie,
      body: { title: "  Super Mario Bros. 3  ", platform: "  SNES  " },
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: game.id,
      title: "Super Mario Bros. 3",
      platform: "SNES",
    });
  });

  it("rejects a blank or over-long title and platform", async () => {
    const game = await seed(alice.id);

    const res = await api(`/api/games/${game.id}`, {
      method: "PATCH",
      cookie: alice.cookie,
      body: { title: "   ", platform: "p".repeat(31) },
    });

    expect(res.status).toBe(400);
    expect(res.body.fields).toEqual({
      title: "is required",
      platform: "must be 30 characters or fewer",
    });
    expect((await prisma.game.findUnique({ where: { id: game.id } }))?.title).toBe(
      "Seeded",
    );
  });

  it("accepts title and platform at the length limits", async () => {
    const game = await seed(alice.id);
    const title = "t".repeat(100);
    const platform = "p".repeat(30);

    const res = await api(`/api/games/${game.id}`, {
      method: "PATCH",
      cookie: alice.cookie,
      body: { title, platform },
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title, platform });
  });

  it("clears nullable fields when passed null", async () => {
    const game = await seed(alice.id, {
      rating: 8,
      notes: "old note",
      priority: "HIGH",
    });

    const res = await api(`/api/games/${game.id}`, {
      method: "PATCH",
      cookie: alice.cookie,
      body: { rating: null, notes: null, priority: null },
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ rating: null, notes: null, priority: null });
  });

  it("archives a game", async () => {
    const game = await seed(alice.id);

    const res = await api(`/api/games/${game.id}`, {
      method: "PATCH",
      cookie: alice.cookie,
      body: { archived: true },
    });

    expect(res.status).toBe(200);
    expect(res.body.archived).toBe(true);
  });

  it("404s on another user's game and leaves it untouched", async () => {
    const game = await seed(bob.id, { title: "Bob's" });

    const res = await api(`/api/games/${game.id}`, {
      method: "PATCH",
      cookie: alice.cookie,
      body: { title: "Pwned" },
    });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Game not found" });
    expect((await prisma.game.findUnique({ where: { id: game.id } }))?.title).toBe(
      "Bob's",
    );
  });

  it("404s on an id that does not exist", async () => {
    const res = await api("/api/games/99999999", {
      method: "PATCH",
      cookie: alice.cookie,
      body: { title: "Nope" },
    });

    expect(res.status).toBe(404);
  });

  it("400s on a non-numeric id", async () => {
    const res = await api("/api/games/abc", {
      method: "PATCH",
      cookie: alice.cookie,
      body: { rating: 5 },
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid game id" });
  });

  it("400s when there is nothing to update", async () => {
    const game = await seed(alice.id);

    const empty = await api(`/api/games/${game.id}`, {
      method: "PATCH",
      cookie: alice.cookie,
      body: {},
    });
    expect(empty.status).toBe(400);
    expect(empty.body).toEqual({ error: "No fields to update" });

    const unknownOnly = await api(`/api/games/${game.id}`, {
      method: "PATCH",
      cookie: alice.cookie,
      body: { nope: 1 },
    });
    expect(unknownOnly.status).toBe(400);
  });

  it("validates the fields it is given", async () => {
    const game = await seed(alice.id);

    const res = await api(`/api/games/${game.id}`, {
      method: "PATCH",
      cookie: alice.cookie,
      body: { status: "PAUSED", archived: "yes" },
    });

    expect(res.status).toBe(400);
    expect(res.body.fields.status).toContain("must be one of");
    expect(res.body.fields.archived).toBe("must be true or false");
  });
});

describe("DELETE /api/games/:id", () => {
  it("deletes an owned game once", async () => {
    const game = await seed(alice.id);

    const first = await api(`/api/games/${game.id}`, {
      method: "DELETE",
      cookie: alice.cookie,
    });
    expect(first.status).toBe(204);
    expect(await prisma.game.findUnique({ where: { id: game.id } })).toBeNull();

    const second = await api(`/api/games/${game.id}`, {
      method: "DELETE",
      cookie: alice.cookie,
    });
    expect(second.status).toBe(404);
  });

  it("404s on another user's game and leaves it in place", async () => {
    const game = await seed(bob.id);

    const res = await api(`/api/games/${game.id}`, {
      method: "DELETE",
      cookie: alice.cookie,
    });

    expect(res.status).toBe(404);
    expect(await prisma.game.findUnique({ where: { id: game.id } })).not.toBeNull();
  });

  it("cascades to the game's play sessions", async () => {
    const game = await seed(alice.id);
    await prisma.playSession.create({
      data: {
        gameId: game.id,
        userId: alice.id,
        hours: 2.5,
        sessionDate: new Date("2026-08-01"),
      },
    });

    const res = await api(`/api/games/${game.id}`, {
      method: "DELETE",
      cookie: alice.cookie,
    });

    expect(res.status).toBe(204);
    expect(await prisma.playSession.count({ where: { gameId: game.id } })).toBe(0);
  });
});
