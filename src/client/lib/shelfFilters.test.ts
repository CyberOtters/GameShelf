import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTERS,
  filtersToQuery,
  normalizeFilters,
  readFilters,
  STORAGE_KEY,
  writeFilters,
  type FilterStorage,
} from "./shelfFilters.ts";

/** An in-memory stand-in for localStorage. */
function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    read: (key: string) => data.get(key) ?? null,
  };
}

/** Storage that throws on every call, as it does in Safari private mode. */
const hostileStorage: FilterStorage = {
  getItem() {
    throw new Error("denied");
  },
  setItem() {
    throw new Error("denied");
  },
};

describe("normalizeFilters", () => {
  it("passes through a fully valid object", () => {
    const filters = {
      status: "WISHLIST" as const,
      archived: "true" as const,
      sort: "priority" as const,
    };

    expect(normalizeFilters(filters)).toEqual(filters);
  });

  it("falls back per field rather than discarding the whole object", () => {
    expect(
      normalizeFilters({ status: "NONSENSE", sort: "priority" }),
    ).toEqual({
      status: DEFAULT_FILTERS.status,
      archived: DEFAULT_FILTERS.archived,
      sort: "priority",
    });
  });

  it("returns the defaults for null and undefined", () => {
    expect(normalizeFilters(null)).toEqual(DEFAULT_FILTERS);
    expect(normalizeFilters(undefined)).toEqual(DEFAULT_FILTERS);
  });
});

describe("filtersToQuery", () => {
  it("omits status entirely when the filter is ALL", () => {
    const query = filtersToQuery({
      status: "ALL",
      archived: "all",
      sort: "added",
    });

    expect(query).toBe("archived=all&sort=added");
    expect(query).not.toContain("status");
  });

  it("sends a real status through", () => {
    expect(
      filtersToQuery({
        status: "WISHLIST",
        archived: "false",
        sort: "priority",
      }),
    ).toBe("status=WISHLIST&archived=false&sort=priority");
  });
});

describe("readFilters", () => {
  it("returns the defaults when nothing is stored", () => {
    expect(readFilters(fakeStorage())).toEqual(DEFAULT_FILTERS);
  });

  it("reads back what writeFilters stored", () => {
    const storage = fakeStorage();
    const filters = {
      status: "PLAYING" as const,
      archived: "false" as const,
      sort: "priority" as const,
    };

    writeFilters(storage, filters);

    expect(readFilters(storage)).toEqual(filters);
  });

  it("repairs a stored value that is no longer valid", () => {
    const storage = fakeStorage({
      [STORAGE_KEY]: JSON.stringify({ status: "RETIRED", sort: "priority" }),
    });

    expect(readFilters(storage)).toEqual({
      ...DEFAULT_FILTERS,
      sort: "priority",
    });
  });

  it("survives malformed JSON", () => {
    const storage = fakeStorage({ [STORAGE_KEY]: "{not json" });

    expect(readFilters(storage)).toEqual(DEFAULT_FILTERS);
  });

  it("survives storage being unavailable", () => {
    expect(readFilters(null)).toEqual(DEFAULT_FILTERS);
    expect(readFilters(hostileStorage)).toEqual(DEFAULT_FILTERS);
  });
});

describe("writeFilters", () => {
  it("stores normalized values, not whatever it was handed", () => {
    const storage = fakeStorage();

    writeFilters(storage, {
      status: "BOGUS",
      archived: "all",
      sort: "added",
    } as never);

    expect(JSON.parse(storage.read(STORAGE_KEY)!)).toEqual(DEFAULT_FILTERS);
  });

  it("does not throw when storage refuses to write", () => {
    expect(() => writeFilters(hostileStorage, DEFAULT_FILTERS)).not.toThrow();
    expect(() => writeFilters(null, DEFAULT_FILTERS)).not.toThrow();
  });
});
