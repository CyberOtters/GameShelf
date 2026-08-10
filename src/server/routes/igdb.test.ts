import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth.ts";
import { errorHandler } from "../lib/errors.ts";
import { prisma } from "../lib/prisma.ts";
import { igdbRouter } from "./igdb.ts";

// Auth and validation only — nothing here calls the live IGDB API, so the
// tests run without Twitch credentials. The happy path is exercised manually
// (see README: GET /api/igdb/search?q=hades with a signed-in session).
const TEST_EMAIL_DOMAIN = "gameshelf.igdb.test";

/** Mirrors how `src/server/index.ts` mounts the router. */
function buildApp() {
  const app = express();
  app.all("/api/auth/*splat", toNodeHandler(auth));
  app.use(express.json());
  app.use("/api/igdb", igdbRouter);
  app.use(errorHandler);
  return app;
}

let baseUrl: string;
let close: () => Promise<void>;
let cookie: string;

async function signUp(name: string): Promise<string> {
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

  return (res.headers.getSetCookie() ?? [])
    .map((value) => value.split(";")[0])
    .join("; ");
}

async function deleteTestUsers() {
  await prisma.user.deleteMany({
    where: { email: { endsWith: `@${TEST_EMAIL_DOMAIN}` } },
  });
}

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
  cookie = await signUp("searcher");
});

afterAll(async () => {
  await deleteTestUsers();
  await prisma.$disconnect();
  await close?.();
});

describe("GET /api/igdb/search", () => {
  it("401s without a session", async () => {
    const res = await fetch(`${baseUrl}/api/igdb/search?q=hades`);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "You must be signed in" });
  });

  it("400s without search text", async () => {
    const res = await fetch(`${baseUrl}/api/igdb/search`, {
      headers: { cookie },
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Missing search text" });
  });

  it("400s on blank search text", async () => {
    const res = await fetch(`${baseUrl}/api/igdb/search?q=%20%20`, {
      headers: { cookie },
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Missing search text" });
  });

  it("400s on over-long search text", async () => {
    const q = "z".repeat(101);
    const res = await fetch(`${baseUrl}/api/igdb/search?q=${q}`, {
      headers: { cookie },
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Search text must be 100 characters or fewer",
    });
  });
});
