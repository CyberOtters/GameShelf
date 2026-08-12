/**
 * Small formatting helpers shared by the shelf and the play log. Kept free of
 * DOM access so they can be unit-tested under Node.
 */

/** `13.7 hrs`, `1 hr`, `0 hrs` — trailing `.0` is dropped. */
export function formatHours(totalHours: number): string {
  if (totalHours === 0) return "0 hrs";
  const formatted = Number.isInteger(totalHours)
    ? String(totalHours)
    : totalHours.toFixed(1);
  return `${formatted} hr${totalHours === 1 ? "" : "s"}`;
}

/**
 * Today as `YYYY-MM-DD` in the viewer's own timezone, for pre-filling a
 * `<input type="date">`. `toISOString()` would be UTC and can land on the wrong
 * day for anyone west of Greenwich in the evening.
 */
export function dateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
