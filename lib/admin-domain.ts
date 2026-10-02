// Google Workspace hosted domain allowed to sign in to the admin area.
// With personal Gmail accounts (no `hd` claim), we switch to an explicit
// allowlist via ADMIN_EMAILS instead of enforcing the hosted domain.

// Keep for display/backwards compatibility (may be empty/unused).
export const ADMIN_HOSTED_DOMAIN =
  process.env.ADMIN_HOSTED_DOMAIN?.trim().toLowerCase() || "";

function parseAllowedEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

const ALLOWED_EMAILS = parseAllowedEmails();

export function isAllowedAdminEmail(email: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return ALLOWED_EMAILS.has(normalized);
}

// Backwards compatibility: treat explicitly allowed emails as "workspace"
// compatible for reviewer picker logic. Existing DB emails remain valid.
export function isWorkspaceEmail(email: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (ALLOWED_EMAILS.has(normalized)) return true;
  // Fallback to legacy domain check if ADMIN_HOSTED_DOMAIN is still configured
  if (ADMIN_HOSTED_DOMAIN) {
    return normalized.endsWith(`@${ADMIN_HOSTED_DOMAIN}`);
  }
  return false;
}
