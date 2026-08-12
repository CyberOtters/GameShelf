import { GameStatus } from "../../../generated/prisma/enums.ts";
import { conflict } from "./errors.ts";

/**
 * Rules about what a Game *means*, as opposed to what shape its fields take —
 * `validateGame.ts` already guarantees a rating is 1–10 and a status is a real
 * enum member, so everything here is about combinations that pass that check
 * but still describe something impossible.
 *
 * Both rules exist because wishlist entries are `Game` rows rather than a table
 * of their own: without them, a game could sit on the wishlist while carrying a
 * play history.
 *
 * These are pure so they can be unit-tested without a database; callers load
 * whatever state they need and pass it in.
 */

export const WISHLIST_SESSION_MESSAGE =
  "You cannot log play time against a wishlisted game — move it to your backlog first";

export const WISHLIST_PLAYED_MESSAGE =
  "This game already has play time logged, so it cannot go back on the wishlist";

/** The subset of a Game the rules below actually look at. */
export type GameRuleState = {
  status: GameStatus;
};

/**
 * The status a PATCH would leave behind — the stored one unless the patch
 * changes it.
 */
export function resolveGameState(
  current: GameRuleState,
  patch: Partial<GameRuleState>,
): GameRuleState {
  return { status: patch.status ?? current.status };
}

/** Moving a game back to the wishlist has to discard a real play history. */
export function assertWishlistHasNoSessions(
  state: GameRuleState,
  sessionCount: number,
): void {
  if (state.status === GameStatus.WISHLIST && sessionCount > 0) {
    throw conflict(WISHLIST_PLAYED_MESSAGE, {
      status: "cannot be WISHLIST once sessions are logged",
    });
  }
}

/** Guards the write side of play sessions: you cannot play what you do not own. */
export function assertGameIsPlayable(status: GameStatus): void {
  if (status === GameStatus.WISHLIST) {
    throw conflict(WISHLIST_SESSION_MESSAGE);
  }
}

/** Every rule that applies to an edit, given the row as it stands today. */
export function assertUpdateAllowed(
  current: GameRuleState,
  patch: Partial<GameRuleState>,
  sessionCount: number,
): GameRuleState {
  const next = resolveGameState(current, patch);
  assertWishlistHasNoSessions(next, sessionCount);
  return next;
}
