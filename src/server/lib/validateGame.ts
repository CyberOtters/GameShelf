import { z } from "zod";
import { GameStatus, Priority } from "../../../generated/prisma/enums.ts";
import { badRequest, type FieldErrors } from "./errors.ts";

export const MAX_TITLE = 100;
export const MAX_PLATFORM = 30;
export const MAX_NOTES = 500;
export const MAX_COVER_URL = 255;

const oneOf = (values: readonly string[]) =>
  `must be one of: ${values.join(", ")}`;

/** Required, non-blank, length-capped string. */
const text = (max: number) =>
  z
    .string({
      error: (issue) =>
        issue.input === undefined ? "is required" : "must be text",
    })
    .trim()
    .min(1, "is required")
    .max(max, `must be ${max} characters or fewer`);

/** Length-capped string that may be null; blank comes back as null. */
const nullableText = (max: number) =>
  z
    .string({ error: "must be text or null" })
    .trim()
    .nullable()
    .transform((value) => value || null)
    .pipe(z.string().max(max, `must be ${max} characters or fewer`).nullable());

const RATING_ERROR = "must be a whole number from 1 to 10, or null";

/** 1–10 or null. Numeric strings are accepted so plain form posts work. */
const rating = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : Number(trimmed);
  },
  z
    .number({ error: RATING_ERROR })
    .int(RATING_ERROR)
    .min(1, RATING_ERROR)
    .max(10, RATING_ERROR)
    .nullable(),
);

const status = z.enum(GameStatus, { error: oneOf(Object.values(GameStatus)) });

const priority = z.preprocess(
  (value) => (value === "" ? null : value),
  z
    .enum(Priority, { error: `${oneOf(Object.values(Priority))}, or null` })
    .nullable(),
);

const archived = z.boolean({ error: "must be true or false" });

// Rendered straight into an <img src>, so only https URLs are allowed in.
const coverUrl = nullableText(MAX_COVER_URL).pipe(
  z
    .string()
    .startsWith("https://", "must be an https:// URL")
    .nullable(),
);

const OBJECT_ERROR = { error: "Expected a JSON object" };

/** The columns a client is allowed to set on a Game. */
export const createGameSchema = z.object(
  {
    title: text(MAX_TITLE),
    platform: text(MAX_PLATFORM),
    status: status.default(GameStatus.BACKLOG),
    priority: priority.default(null),
    rating: rating.default(null),
    coverUrl: coverUrl.default(null),
    notes: nullableText(MAX_NOTES).default(null),
    archived: archived.default(false),
  },
  OBJECT_ERROR,
);

export const updateGameSchema = z.object(
  {
    title: text(MAX_TITLE).optional(),
    platform: text(MAX_PLATFORM).optional(),
    status: status.optional(),
    priority: priority.optional(),
    rating: rating.optional(),
    coverUrl: coverUrl.optional(),
    notes: nullableText(MAX_NOTES).optional(),
    archived: archived.optional(),
  },
  OBJECT_ERROR,
);

export const gameFiltersSchema = z.object({
  status: status.optional(),
  // Archived games are hidden unless asked for: `archived=true` returns only
  // archived rows, `archived=all` returns both.
  archived: z
    .enum(["true", "false", "all"], { error: "must be true, false, or all" })
    .default("false")
    .transform((value) => (value === "all" ? undefined : value === "true")),
});

export type GameInput = z.infer<typeof createGameSchema>;

/**
 * Runs a schema and turns any failure into a 400 the client can render:
 * `{ error, fields: { title: "is required", ... } }`, one message per field.
 */
function parseWith<T>(schema: z.ZodType<T>, data: unknown, message: string): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  const fields: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join(".");
    // A problem with the payload itself (not a field) is the whole story.
    if (!field) throw badRequest(issue.message);
    fields[field] ??= issue.message;
  }

  throw badRequest(message, fields);
}

/** POST /api/games — `title` and `platform` are required, the rest have defaults. */
export function parseCreateGame(body: unknown): GameInput {
  return parseWith(createGameSchema, body, "Some fields need fixing");
}

/** PATCH /api/games/:id — every field is optional, but at least one must be present. */
export function parseUpdateGame(body: unknown): Partial<GameInput> {
  const parsed = parseWith(updateGameSchema, body, "Some fields need fixing");

  const patch = Object.fromEntries(
    Object.entries(parsed).filter(([, value]) => value !== undefined),
  ) as Partial<GameInput>;

  if (Object.keys(patch).length === 0) throw badRequest("No fields to update");

  return patch;
}

/** GET /api/games — `?status=BACKLOG&archived=true`. */
export function parseGameFilters(query: unknown) {
  return parseWith(gameFiltersSchema, query, "Invalid filters");
}
