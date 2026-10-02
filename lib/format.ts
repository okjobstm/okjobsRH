import { LOCALE, TIME_ZONE } from "@/lib/site-config";

type Dateish = Date | string | number | null | undefined;

function toDate(value: Dateish): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Every user-facing timestamp goes through here. Keeping locale and zone in one
// place is the point: a date that disagrees with the date beside it is worse
// than a consistently formatted one.

export function formatDate(
  value: Dateish,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }
): string {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: TIME_ZONE }).format(date);
}

export function formatDateTime(
  value: Dateish,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }
): string {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: TIME_ZONE }).format(date);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(value);
}
