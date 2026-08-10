import { z } from "zod";
import { badRequest, type FieldErrors } from "./errors.ts";

export const MAX_SESSION_NOTES = 500;

/** Turns a numeric string into a number so plain form posts work. */
const numeric = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : Number(trimmed);
};

const GAME_ID_ERROR = "must be a valid game id";

const gameId = z.preprocess(
  numeric,
  z.number({ error: GAME_ID_ERROR }).int(GAME_ID_ERROR).min(1, GAME_ID_ERROR),
);

const HOURS_ERROR =
  "must be a number from 0.1 to 999.9, in tenths of an hour";

/** Matches the Decimal(4,1) column: 0.1–999.9, at most one decimal place. */
const hours = z.preprocess(
  numeric,
  z
    .number({ error: HOURS_ERROR })
    .min(0.1, HOURS_ERROR)
    .max(999.9, HOURS_ERROR)
    .refine(
      (value) => Math.abs(value * 10 - Math.round(value * 10)) < 1e-9,
      HOURS_ERROR,
    ),
);

const DATE_ERROR = "must be a date in YYYY-MM-DD format";

/** A calendar date like 2026-08-10, stored in the DATE column. */
const sessionDate = z
  .string({ error: DATE_ERROR })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_ERROR)
  .transform((value, ctx) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: DATE_ERROR });
      return z.NEVER;
    }
    return date;
  });

/** Notes may be null; blank comes back as null. Mirrors validateGame's nullableText. */
const notes = z
  .string({ error: "must be text or null" })
  .trim()
  .nullable()
  .transform((value) => value || null)
  .pipe(
    z
      .string()
      .max(MAX_SESSION_NOTES, `must be ${MAX_SESSION_NOTES} characters or fewer`)
      .nullable(),
  );

const OBJECT_ERROR = { error: "Expected a JSON object" };

/** The columns a client is allowed to set on a PlaySession. */
export const createSessionSchema = z.object(
  {
    gameId,
    hours,
    sessionDate,
    notes: notes.default(null),
  },
  OBJECT_ERROR,
);

// `gameId` is deliberately not editable — a session belongs to its game.
export const updateSessionSchema = z.object(
  {
    hours: hours.optional(),
    sessionDate: sessionDate.optional(),
    notes: notes.optional(),
  },
  OBJECT_ERROR,
);

export const sessionFiltersSchema = z.object({
  gameId: gameId.optional(),
});

export type SessionInput = z.infer<typeof createSessionSchema>;

/**
 * Runs a schema and turns any failure into a 400 the client can render:
 * `{ error, fields: { hours: "...", ... } }`, one message per field.
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

/** POST /api/sessions — `gameId`, `hours`, and `sessionDate` are required. */
export function parseCreateSession(body: unknown): SessionInput {
  return parseWith(createSessionSchema, body, "Some fields need fixing");
}

/** PATCH /api/sessions/:id — every field is optional, but at least one must be present. */
export function parseUpdateSession(body: unknown) {
  const parsed = parseWith(updateSessionSchema, body, "Some fields need fixing");

  const patch = Object.fromEntries(
    Object.entries(parsed).filter(([, value]) => value !== undefined),
  ) as Partial<z.infer<typeof updateSessionSchema>>;

  if (Object.keys(patch).length === 0) throw badRequest("No fields to update");

  return patch;
}

/** GET /api/sessions — `?gameId=42`. */
export function parseSessionFilters(query: unknown) {
  return parseWith(sessionFiltersSchema, query, "Invalid filters");
}
