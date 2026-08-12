import { describe, expect, it } from "vitest";
import { dateInputValue, formatHours } from "./format.ts";

describe("formatHours", () => {
  it("uses the plural for zero", () => {
    expect(formatHours(0)).toBe("0 hrs");
  });

  it("uses the singular only for exactly one hour", () => {
    expect(formatHours(1)).toBe("1 hr");
    expect(formatHours(1.5)).toBe("1.5 hrs");
  });

  it("drops the decimal on whole numbers", () => {
    expect(formatHours(13)).toBe("13 hrs");
  });

  it("keeps one decimal place otherwise", () => {
    expect(formatHours(13.7)).toBe("13.7 hrs");
    expect(formatHours(0.5)).toBe("0.5 hrs");
  });
});

describe("dateInputValue", () => {
  it("zero-pads month and day", () => {
    expect(dateInputValue(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("formats a two-digit month and day", () => {
    expect(dateInputValue(new Date(2026, 11, 25))).toBe("2026-12-25");
  });

  it("uses local calendar fields, not the UTC date", () => {
    // 00:30 local on the 11th is still the 10th in UTC for western offsets;
    // the date input should show the day the user is actually living in.
    const localMidnightish = new Date(2026, 7, 11, 0, 30);

    expect(dateInputValue(localMidnightish)).toBe("2026-08-11");
  });
});
