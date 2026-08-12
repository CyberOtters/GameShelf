import { Router } from "express";
import { HttpError, badRequest } from "../lib/errors.ts";
import { requireAuth } from "../lib/requireAuth.ts";
import {
  igdbCoverUrl,
  searchIgdbGames,
  type IgdbSearchGame,
} from "../lib/igdb.ts";

export const igdbRouter = Router();

// Search is only offered from the add/edit form, which is behind a login, and
// every call spends part of our IGDB rate limit — so require a session.
igdbRouter.use(requireAuth);

const MAX_LIMIT = 25;
const DEFAULT_LIMIT = 8;
// Matches Game.title's column width. Anything longer is a runaway paste rather
// than a real search, and rejecting it here keeps it off our IGDB rate limit.
const MAX_QUERY_LENGTH = 100;

/** The shape the add-game form renders; see `GameSearchResult` in shelf.ts. */
type GameSearchResult = {
  igdbId: number;
  title: string;
  coverUrl: string | null;
  releaseYear: number | null;
  platforms: string[];
  genres: string[];
  rating: number | null;
};

function releaseYear(timestamp?: number | null): number | null {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).getUTCFullYear();
}

function toSearchResult(game: IgdbSearchGame): GameSearchResult {
  return {
    igdbId: game.id,
    title: game.name,
    coverUrl: igdbCoverUrl(game.cover),
    releaseYear: releaseYear(game.first_release_date),
    platforms: game.platforms?.map((platform) => platform.name) ?? [],
    genres: game.genres?.map((genre) => genre.name) ?? [],
    rating: typeof game.rating === "number" ? game.rating / 10 : null,
  };
}

function searchText(raw: unknown): string {
  const q = typeof raw === "string" ? raw.trim() : "";
  if (!q) throw badRequest("Missing search text");
  if (q.length > MAX_QUERY_LENGTH) {
    throw badRequest(
      `Search text must be ${MAX_QUERY_LENGTH} characters or fewer`,
    );
  }
  return q;
}

function searchLimit(raw: unknown): number {
  if (raw === undefined) return DEFAULT_LIMIT;
  const limit = Number(raw);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw badRequest(`limit must be a whole number from 1 to ${MAX_LIMIT}`);
  }
  return limit;
}

// GET /api/igdb/search?q=zelda — type-ahead for the add-game form.
igdbRouter.get("/search", async (req, res) => {
  const q = searchText(req.query.q);

  let games: IgdbSearchGame[];
  try {
    games = await searchIgdbGames(q, searchLimit(req.query.limit));
  } catch (error) {
    // IGDB being down or misconfigured isn't the client's fault, and the form
    // treats a failure as "search unavailable" and lets the user type a title.
    console.error("IGDB search failed:", error);
    throw new HttpError(503, "Game search is unavailable right now");
  }

  res.json(games.map(toSearchResult));
});
