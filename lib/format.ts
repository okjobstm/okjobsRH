import { LOCALE, TIME_ZONE } from "@/lib/site-config";
import type { RoleFitBand } from "@/lib/scoring/synthesis";
import type { InviteStatus, JobStatus } from "@prisma/client";

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

// RoleFitBand is persisted verbatim in SynthesisResult.synthesisJson, so the
// English keys must stay and translation belongs only at the render site.
export const ROLE_FIT_LABEL: Record<RoleFitBand, string> = {
  "Strong fit": "Très bonne adéquation",
  "Likely fit": "Adéquation probable",
  "Mixed fit": "Adéquation moyenne",
  "Weak fit": "Adéquation faible",
  "Likely mis-fit": "Inadéquation probable",
};

// Prisma enums are compared as raw keys elsewhere (job.status === "OPEN"), so
// only the rendered label is French.
export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  DRAFT: "Brouillon",
  OPEN: "Ouvert",
  CLOSED: "Clôturé",
  ARCHIVED: "Archivé",
};

export const INVITE_STATUS_LABEL: Record<InviteStatus, string> = {
  ACTIVE: "Actif",
  EXPIRED: "Expiré",
  REVOKED: "Révoqué",
};
