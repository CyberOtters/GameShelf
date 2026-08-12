import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.ts";
import { errorHandler } from "./errors.ts";
import { prisma } from "./prisma.ts";
import { redirectToShelfIfSignedIn, requirePageAuth } from "./pageAuth.ts";
import { requireAuth, sessionUserId } from "./requireAuth.ts";

// HTML routes redirect where the JSON API 401s; these cover both guards
// against a real Better Auth session. Needs a database (`npx prisma dev`).
const TEST_EMAIL_DOMAIN = "gameshelf.pageauth.test";

/** Mirrors how `src/server/index.ts` wires the guards onto page and API routes. */
function buildApp() {
  const app = express();
  app.all("/api/auth/*splat", toNodeHandler(auth));
  app.use(express.json());

  app.get("/", redirectToShelfIfSignedIn, (_req, res) => {
    res.send("landing");
  });

  app.get("/shelf", requirePageAuth, (req, res) => {
    res.json({ user: req.sessionUser, userId: req.userId });
  });

  app.get("/api/me", requireAuth, (req, res) => {
    res.json({ userId: sessionUserId(req) });
  });

  app.use(errorHandler);
  return app;
}

let baseUrl: string;
let close: () => Promise<void>;
let cookie: string;
let userId: string;

/** `redirect: "manual"` so a 302 is observable instead of being followed. */
function visit(path: string, options: { cookie?: string } = {}) {
  return fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    headers: options.cookie ? { cookie: options.cookie } : {},
  });
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

  const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "pagevisitor",
      email: `pagevisitor@${TEST_EMAIL_DOMAIN}`,
      password: "pagevisitor-test-password",
    }),
  });
  if (!res.ok) throw new Error(`sign-up failed: ${res.status}`);

  cookie = (res.headers.getSetCookie() ?? [])
    .map((value) => value.split(";")[0])
    .join("; ");
  ({
    user: { id: userId },
  } = (await res.json()) as { user: { id: string } });
});

afterAll(async () => {
  await deleteTestUsers();
  await prisma.$disconnect();
  await close?.();
});

describe("requirePageAuth", () => {
  it("redirects a signed-out visitor to /login", async () => {
    const res = await visit("/shelf");

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/login");
  });

  it("ignores a junk session cookie", async () => {
    const res = await visit("/shelf", {
      cookie: "better-auth.session_token=not-a-real-token",
    });

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/login");
  });

  it("lets a signed-in visitor through", async () => {
    const res = await visit("/shelf", { cookie });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      user: {
        id: userId,
        name: "pagevisitor",
        email: `pagevisitor@${TEST_EMAIL_DOMAIN}`,
      },
      userId,
    });
  });
});

describe("redirectToShelfIfSignedIn", () => {
  it("renders the landing page for a signed-out visitor", async () => {
    const res = await visit("/");

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("landing");
  });

  it("sends a signed-in visitor to their shelf", async () => {
    const res = await visit("/", { cookie });

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/shelf");
  });
});

describe("requireAuth", () => {
  it("401s as JSON rather than redirecting", async () => {
    const res = await visit("/api/me");

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "You must be signed in" });
  });

  it("exposes the session user id to the route", async () => {
    const res = await visit("/api/me", { cookie });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId });
  });
});
