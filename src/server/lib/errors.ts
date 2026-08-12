import type { ErrorRequestHandler } from "express";

/** Field name -> human-readable problem, e.g. `{ title: "must be 100 characters or fewer" }`. */
export type FieldErrors = Record<string, string>;

/** An error with a status code the client is meant to see. */
export class HttpError extends Error {
  status: number;
  fields?: FieldErrors;

  constructor(status: number, message: string, fields?: FieldErrors) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.fields = fields;
  }
}

export function badRequest(message: string, fields?: FieldErrors) {
  return new HttpError(400, message, fields);
}

export function notFound(message = "Not found") {
  return new HttpError(404, message);
}

/**
 * The request is well-formed but the rows it would produce break a business
 * rule (see `gameRules.ts`) — a 409 rather than a 400, since nothing about the
 * payload's shape is wrong.
 */
export function conflict(message: string, fields?: FieldErrors) {
  return new HttpError(409, message, fields);
}

/**
 * Last handler in the stack: turns thrown errors into JSON the client can
 * display. Express 5 forwards rejected promises here on its own, so route
 * handlers can just throw.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.message,
      ...(err.fields ? { fields: err.fields } : {}),
    });
    return;
  }

  // express.json() rejects malformed bodies with a status-carrying SyntaxError.
  const status = (err as { status?: unknown })?.status;
  if (typeof status === "number" && status >= 400 && status < 500) {
    res.status(status).json({ error: "Invalid request body" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
};
