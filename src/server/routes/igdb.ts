import { Router } from "express";
import { badRequest, HttpError } from "../lib/errors.ts";
import { requireAuth } from "../lib/requireAuth.ts";
import { searchIgdbGames, type IgdbSearchGame } from "../lib/igdb.ts";

export const igdbRouter = Router();

// Auth-gated so the endpoint isn't an open proxy for the team's Twitch key.
igdbRouter.use(requireAuth);

const MAX_QUERY = 100;

/** What the client needs to fill the Add Game form from a search result. */
export type GameSearchResult = {
  igdbId: number;
  title: string;
  coverUrl: string | null;
  releaseYear: number | null;
  platforms: string[];
  genres: string[];
  rating: number | null;
};

/**
 * IGDB covers arrive as `//images.igdb.com/...t_thumb/xyz.jpg`. Swap in the
 * shelf-card size and a real scheme so the URL can go straight into
 * `Game.coverUrl`.
 */
function coverUrl(game: IgdbSearchGame): string | null {
  const url = game.cover?.url;
  if (!url) return null;

  const sized = url.replace("/t_thumb/", "/t_cover_big/");
  return sized.startsWith("//") ? `https:${sized}` : sized;
}

function toSearchResult(game: IgdbSearchGame): GameSearchResult {
  return {
    igdbId: game.id,
    title: game.name,
    coverUrl: coverUrl(game),
    releaseYear: game.first_release_date
      ? new Date(game.first_release_date * 1000).getUTCFullYear()
      : null,
    platforms: game.platforms?.map((platform) => platform.name) ?? [],
    genres: game.genres?.map((genre) => genre.name) ?? [],
    rating: game.rating == null ? null : Math.round(game.rating) / 10,
  };
}

// GET /search?q=hades — server-side lookup the Add Game form searches against.
igdbRouter.get("/search", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q) throw badRequest("Missing search text");
  if (q.length > MAX_QUERY) {
    throw badRequest(`Search text must be ${MAX_QUERY} characters or fewer`);
  }

  let games: IgdbSearchGame[];
  try {
    games = await searchIgdbGames(q);
  } catch (cause) {
    console.error("IGDB search failed", cause);
    throw new HttpError(502, "Game search is unavailable right now");
  }

  res.json(games.map(toSearchResult));
});
