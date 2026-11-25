const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Start and end of a day in Indian time. offsetDays: 0 = today, 1 = tomorrow
export function istDayRange(offsetDays = 0) {
  const nowIst = new Date(Date.now() + IST_OFFSET_MS);
  const midnightUtc = Date.UTC(
    nowIst.getUTCFullYear(),
    nowIst.getUTCMonth(),
    nowIst.getUTCDate() + offsetDays
  );
  const start = new Date(midnightUtc - IST_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

// "2026-12-18" -> Date at midnight Indian time (or null if invalid)
export function parseIstDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00+05:30`);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getUTCFullYear();
  if (year < 2000 || year > 2100) return null;
  return d;
}

// Date -> "2026-12-18" for a date input, in Indian time
export function toDateInputValue(date) {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}