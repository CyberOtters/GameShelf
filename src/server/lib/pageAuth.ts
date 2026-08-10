import type { Request, RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.ts";

declare global {
  namespace Express {
    interface Request {
      /** Set by `requirePageAuth`, for rendering the signed-in chrome. */
      sessionUser?: { id: string; name: string; email: string };
    }
  }
}

/**
 * The page equivalents of `requireAuth`. HTML routes redirect instead of
 * answering with the JSON 401 the API middleware throws.
 */
async function sessionUser(req: Request) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  return session?.user ?? null;
}

/** Signed-in visitors belong on their shelf, not on the landing or auth pages. */
export const redirectToShelfIfSignedIn: RequestHandler = async (
  req,
  res,
  next,
) => {
  if (await sessionUser(req)) {
    res.redirect("/shelf");
    return;
  }
  next();
};

/** The shelf is per-user, so signed-out visitors get sent to sign in. */
export const requirePageAuth: RequestHandler = async (req, res, next) => {
  const user = await sessionUser(req);

  if (!user) {
    res.redirect("/login");
    return;
  }

  req.userId = user.id;
  req.sessionUser = { id: user.id, name: user.name, email: user.email };
  next();
};
