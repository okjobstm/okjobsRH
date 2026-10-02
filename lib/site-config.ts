// Branding and contact details surfaced in user-facing copy (login footer,
// privacy policy, terms of use, page metadata). Override these via env to
// rebrand the app for your organization. NEXT_PUBLIC_ is required so they are
// available in both server and client components.
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Recruit";

export const ORG_NAME = process.env.NEXT_PUBLIC_ORG_NAME || "Your Organization";

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "privacy@example.com";

// The interface is French. Pinning the locale matters beyond translation: the
// runtime default would render `Apr 30, 2026` on some admins' machines and
// `30/04/2026` on others for the same row.
export const LOCALE = process.env.NEXT_PUBLIC_LOCALE || "fr-FR";

// Timestamps are rendered server-side but read by humans in one place. Without
// an explicit zone the value depends on the box that rendered it, which also
// makes server and client markup disagree and trip hydration.
export const TIME_ZONE = process.env.NEXT_PUBLIC_TIME_ZONE || "Africa/Brazzaville";
