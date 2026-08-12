/**
 * The shelf's filter/sort state, plus the localStorage round-trip that keeps a
 * chosen view in place across reloads and between visits.
 *
 * Everything here is pure — `readFilters`/`writeFilters` take the storage they
 * should use — so the whole module is unit-testable without a browser.
 */

export type StatusFilter =
  | "ALL"
  | "WISHLIST"
  | "BACKLOG"
  | "PLAYING"
  | "COMPLETED"
  | "DROPPED";

/** Which archived rows to include: hide them, show everything, or only those. */
export type ArchivedFilter = "false" | "all" | "true";

export type SortOrder = "added" | "priority";

export type ShelfFilters = {
  status: StatusFilter;
  archived: ArchivedFilter;
  sort: SortOrder;
};

const STATUS_VALUES: StatusFilter[] = [
  "ALL",
  "WISHLIST",
  "BACKLOG",
  "PLAYING",
  "COMPLETED",
  "DROPPED",
];
const ARCHIVED_VALUES: ArchivedFilter[] = ["false", "all", "true"];
const SORT_VALUES: SortOrder[] = ["added", "priority"];

/** Show the whole collection, newest first — what an unfiltered shelf means. */
export const DEFAULT_FILTERS: ShelfFilters = {
  status: "ALL",
  archived: "all",
  sort: "added",
};

export const STORAGE_KEY = "gameshelf:shelf-filters";

function pick<T extends string>(allowed: T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Coerces anything — old stored shapes, hand-edited values — into valid filters. */
export function normalizeFilters(input: unknown): ShelfFilters {
  const raw = (input ?? {}) as Partial<Record<keyof ShelfFilters, unknown>>;
  return {
    status: pick(STATUS_VALUES, raw.status, DEFAULT_FILTERS.status),
    archived: pick(ARCHIVED_VALUES, raw.archived, DEFAULT_FILTERS.archived),
    sort: pick(SORT_VALUES, raw.sort, DEFAULT_FILTERS.sort),
  };
}

/**
 * The query string for `GET /api/games`. `status=ALL` is the absence of a
 * status filter, so it is left off entirely rather than sent as a value the
 * server would reject.
 */
export function filtersToQuery(filters: ShelfFilters): string {
  const params = new URLSearchParams();
  if (filters.status !== "ALL") params.set("status", filters.status);
  params.set("archived", filters.archived);
  params.set("sort", filters.sort);
  return params.toString();
}

/** Just enough of the Storage interface to read and write one key. */
export type FilterStorage = Pick<Storage, "getItem" | "setItem">;

/**
 * Reads saved filters, falling back to the defaults for anything missing or
 * corrupt. Storage can throw outright (Safari private mode), so this never
 * assumes the call succeeds.
 */
export function readFilters(storage: FilterStorage | null): ShelfFilters {
  if (!storage) return { ...DEFAULT_FILTERS };

  try {
    const stored = storage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_FILTERS };
    return normalizeFilters(JSON.parse(stored));
  } catch {
    return { ...DEFAULT_FILTERS };
  }
}

/** Persists filters, ignoring quota or private-mode failures. */
export function writeFilters(
  storage: FilterStorage | null,
  filters: ShelfFilters,
): void {
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(normalizeFilters(filters)));
  } catch {
    // A shelf that cannot remember its filters still works fine.
  }
}

/** `localStorage`, or null where it is unavailable or blocked. */
export function defaultStorage(): FilterStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
