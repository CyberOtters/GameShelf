import type { Request, RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.ts";
import { HttpError } from "./errors.ts";

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth`; read it through `sessionUserId`. */
      userId?: string;
    }
  }
}

/**
 * Resolves the Better Auth session and 401s when nobody is signed in.
 * On success the caller can read the id via `sessionUserId(req)`.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user) {
    next(new HttpError(401, "You must be signed in"));
    return;
  }

  req.userId = session.user.id;
  next();
};

/** Reads the id `requireAuth` stored. Only call it on routes behind that middleware. */
export function sessionUserId(req: Request): string {
  if (!req.userId) throw new HttpError(401, "You must be signed in");
  return req.userId;
}
