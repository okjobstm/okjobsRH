// Sign-in is open to anyone on the Google Workspace hosted domain, plus the
// explicit ADMIN_EMAILS allowlist. The allowlist is not legacy: it is the only way
// in for personal accounts, which carry no `hd` claim, and for a test project
// that has no Workspace domain of its own.

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

export function isWorkspaceEmail(email: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  if (ALLOWED_EMAILS.has(normalized)) return true;
  // No domain configured means allowlist-only, which is a valid setup.
  if (ADMIN_HOSTED_DOMAIN) {
    return normalized.endsWith(`@${ADMIN_HOSTED_DOMAIN}`);
  }
  return false;
}

// Nobody can pass the gate while this is false, so the sign-in page says so
// instead of offering a button that can only fail.
export function isAdminGateOpen(): boolean {
  return Boolean(ADMIN_HOSTED_DOMAIN) || ALLOWED_EMAILS.size > 0;
}