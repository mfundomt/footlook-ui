/**
 * Parses a timestamp the central service labels "Utc". A value without a zone marker (for example 2026-09-20T10:00:00)
 * would be read as local time by the browser, so it is treated as UTC here.
 */
export function parseUtc(value: string): number {
  const text = value.trim();
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text);
  return Date.parse(hasZone ? text : `${text}Z`);
}

/** A short local date and time such as "20 Sep 2026, 14:05", or an empty string for an unreadable value. */
export function formatWhen(value: string): string {
  const time = parseUtc(value);
  if (!Number.isFinite(time)) return '';
  return new Date(time).toLocaleString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

/** A short local date such as "20 Sep 2026". */
export function formatDay(value: string): string {
  const time = parseUtc(value);
  if (!Number.isFinite(time)) return '';
  return new Date(time).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}
