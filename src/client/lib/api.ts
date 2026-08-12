/**
 * Shared handling for the JSON API's error shape, `{ error, fields? }`.
 *
 * Those messages are written for the user — particularly the 409s the wishlist
 * rules raise — so the UI shows them verbatim rather than inventing its own.
 */

/** A failed API call, carrying the status and the server's own message. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Builds an ApiError from a non-OK response, falling back if the body is not JSON. */
export async function apiError(
  response: Response,
  fallback: string,
): Promise<ApiError> {
  const body = await response.json().catch(() => null);
  const message =
    body && typeof body.error === "string" ? body.error : fallback;
  return new ApiError(response.status, message);
}
