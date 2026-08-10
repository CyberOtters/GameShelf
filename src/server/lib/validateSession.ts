import { z } from "zod";
import { badRequest, type FieldErrors, HttpError } from "./errors.ts";

export const MAX_SESSION_HOURS = 999.9;
export const MAX_SESSION_NOTES = 500;

const HOURS_ERROR = `must be a number from 0.1 to ${MAX_SESSION_HOURS} with at most one decimal place`;

/** Prisma returns Decimal for hours; convert before arithmetic in JS. */
export function decimalToNumber(value: { toNumber(): number } | null | undefined): number {
  if (value == null) return 0;
  return value.toNumber();
}

/**
 * Parses a YYYY-MM-DD string as a UTC calendar date so local timezone offset
 * does not shift the stored DATE column.
 */
export function parseSessionDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) throw badRequest("Invalid session date", { sessionDate: "must be YYYY-MM-DD" });

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw badRequest("Invalid session date", { sessionDate: "must be a valid calendar date" });
  }

  return date;
}

function formatSessionDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseHours(value: unknown): number {
  let hours: number;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^\d+(\.\d)?$/.test(trimmed)) {
      throw badRequest("Some fields need fixing", { hours: HOURS_ERROR });
    }
    hours = Number(trimmed);
  } else if (typeof value === "number") {
    hours = value;
  } else {
    throw badRequest("Some fields need fixing", { hours: HOURS_ERROR });
  }

  if (!Number.isFinite(hours) || hours < 0.1 || hours > MAX_SESSION_HOURS) {
    throw badRequest("Some fields need fixing", { hours: HOURS_ERROR });
  }

  if (Math.round(hours * 10) !== hours * 10) {
    throw badRequest("Some fields need fixing", { hours: HOURS_ERROR });
  }

  return hours;
}

const nullableNotes = z
  .string({ error: "must be text or null" })
  .trim()
  .nullable()
  .transform((value) => value || null)
  .pipe(z.string().max(MAX_SESSION_NOTES, `must be ${MAX_SESSION_NOTES} characters or fewer`).nullable());

const OBJECT_ERROR = { error: "Expected a JSON object" };

const createSessionSchema = z.object(
  {
    hours: z.unknown(),
    sessionDate: z.string({ error: "is required" }),
    notes: nullableNotes.default(null),
  },
  OBJECT_ERROR,
);

const updateSessionSchema = z.object(
  {
    hours: z.unknown().optional(),
    sessionDate: z.string().optional(),
    notes: nullableNotes.optional(),
  },
  OBJECT_ERROR,
);

function parseWith<T>(schema: z.ZodType<T>, data: unknown, message: string): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  const fields: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join(".");
    if (!field) throw badRequest(issue.message);
    fields[field] ??= issue.message;
  }

  throw badRequest(message, fields);
}

export type SessionInput = {
  hours: number;
  sessionDate: Date;
  notes: string | null;
};

export function parseCreateSession(body: unknown): SessionInput {
  const parsed = parseWith(createSessionSchema, body, "Some fields need fixing");

  const fields: FieldErrors = {};
  let hours: number | undefined;
  let sessionDate: Date | undefined;

  try {
    hours = parseHours(parsed.hours);
  } catch (error) {
    if (error instanceof HttpError && error.fields) {
      Object.assign(fields, error.fields);
    }
  }

  try {
    sessionDate = parseSessionDate(parsed.sessionDate);
  } catch (error) {
    if (error instanceof HttpError && error.fields) {
      Object.assign(fields, error.fields);
    }
  }

  if (Object.keys(fields).length > 0) {
    throw badRequest("Some fields need fixing", fields);
  }

  return {
    hours: hours!,
    sessionDate: sessionDate!,
    notes: parsed.notes,
  };
}

export function parseUpdateSession(body: unknown): Partial<SessionInput> {
  const parsed = parseWith(updateSessionSchema, body, "Some fields need fixing");

  const patch: Partial<SessionInput> = {};
  if (parsed.hours !== undefined) patch.hours = parseHours(parsed.hours);
  if (parsed.sessionDate !== undefined) patch.sessionDate = parseSessionDate(parsed.sessionDate);
  if (parsed.notes !== undefined) patch.notes = parsed.notes;

  if (Object.keys(patch).length === 0) throw badRequest("No fields to update");

  return patch;
}

export function serializePlaySession<T extends { hours: { toNumber(): number }; sessionDate: Date }>(
  session: T,
) {
  return {
    ...session,
    hours: decimalToNumber(session.hours),
    sessionDate: formatSessionDate(session.sessionDate),
  };
}

export function sumSessionHours(
  sessions: Array<{ hours: { toNumber(): number } }>,
): number {
  return sessions.reduce((total, session) => total + decimalToNumber(session.hours), 0);
}
