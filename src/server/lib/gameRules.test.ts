import { describe, expect, it } from "vitest";
import { GameStatus } from "../../../generated/prisma/enums.ts";
import { HttpError } from "./errors.ts";
import {
  assertGameIsPlayable,
  assertUpdateAllowed,
  assertWishlistHasNoSessions,
  resolveGameState,
  WISHLIST_PLAYED_MESSAGE,
  WISHLIST_SESSION_MESSAGE,
} from "./gameRules.ts";

/** Every rule raises a 409 rather than a 400 — the payload shape is fine. */
function expectConflict(run: () => void, message: string) {
  expect(run).toThrowError(HttpError);
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).status).toBe(409);
    expect((error as HttpError).message).toBe(message);
  }
}

describe("resolveGameState", () => {
  it("keeps the stored status when the patch omits it", () => {
    expect(resolveGameState({ status: GameStatus.PLAYING }, {})).toEqual({
      status: GameStatus.PLAYING,
    });
  });

  it("applies the status the patch does set", () => {
    expect(
      resolveGameState(
        { status: GameStatus.PLAYING },
        { status: GameStatus.COMPLETED },
      ),
    ).toEqual({ status: GameStatus.COMPLETED });
  });
});

describe("assertWishlistHasNoSessions", () => {
  it("rejects moving a played game back to the wishlist", () => {
    expectConflict(
      () => assertWishlistHasNoSessions({ status: GameStatus.WISHLIST }, 1),
      WISHLIST_PLAYED_MESSAGE,
    );
  });

  it("names the offending field so the form can highlight it", () => {
    try {
      assertWishlistHasNoSessions({ status: GameStatus.WISHLIST }, 1);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect((error as HttpError).fields).toEqual({
        status: "cannot be WISHLIST once sessions are logged",
      });
    }
  });

  it("allows the move when nothing has been logged", () => {
    expect(() =>
      assertWishlistHasNoSessions({ status: GameStatus.WISHLIST }, 0),
    ).not.toThrow();
  });

  it("ignores session counts for statuses other than WISHLIST", () => {
    expect(() =>
      assertWishlistHasNoSessions({ status: GameStatus.COMPLETED }, 12),
    ).not.toThrow();
  });
});

describe("assertGameIsPlayable", () => {
  it("rejects logging play time against a wishlist entry", () => {
    expectConflict(
      () => assertGameIsPlayable(GameStatus.WISHLIST),
      WISHLIST_SESSION_MESSAGE,
    );
  });

  it("allows every other status", () => {
    for (const status of Object.values(GameStatus)) {
      if (status === GameStatus.WISHLIST) continue;
      expect(() => assertGameIsPlayable(status)).not.toThrow();
    }
  });
});

describe("assertUpdateAllowed", () => {
  it("rejects wishlisting a game that has play sessions", () => {
    expectConflict(
      () =>
        assertUpdateAllowed(
          { status: GameStatus.COMPLETED },
          { status: GameStatus.WISHLIST },
          3,
        ),
      WISHLIST_PLAYED_MESSAGE,
    );
  });

  it("allows wishlisting a game with no play history", () => {
    expect(() =>
      assertUpdateAllowed(
        { status: GameStatus.COMPLETED },
        { status: GameStatus.WISHLIST },
        0,
      ),
    ).not.toThrow();
  });

  it("leaves a rating alone — a wishlisted game may keep its score", () => {
    expect(() =>
      assertUpdateAllowed(
        { status: GameStatus.WISHLIST },
        { status: GameStatus.WISHLIST },
        0,
      ),
    ).not.toThrow();
  });

  it("returns the resolved state when everything passes", () => {
    expect(
      assertUpdateAllowed(
        { status: GameStatus.BACKLOG },
        { status: GameStatus.PLAYING },
        0,
      ),
    ).toEqual({ status: GameStatus.PLAYING });
  });
});
