import type { User } from "@supabase/supabase-js";
import { isWorkspaceEmail } from "@/lib/admin-domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseUserRole, type UserRole } from "@/lib/roles";

export type EnsuredUserRole = {
  role: UserRole;
  metadataUpdated: boolean;
};

export function getUserRole(user: User | null): UserRole | null {
  const role = parseUserRole(user?.app_metadata?.role);
  const email = user?.email?.trim().toLowerCase() ?? "";
  if (role === "ADMIN" && !isWorkspaceEmail(email)) return null;
  return role;
}

export async function ensureUserRole(
  user: User,
  requestedRole?: unknown
): Promise<EnsuredUserRole | null> {
  const currentRole = getUserRole(user);
  if (currentRole) return { role: currentRole, metadataUpdated: false };

  const email = user.email?.trim().toLowerCase() ?? "";
  if (!email || !user.email_confirmed_at) return null;

  const requested =
    parseUserRole(requestedRole) ?? parseUserRole(user.user_metadata?.requested_role);
  const role = requested ?? (isWorkspaceEmail(email) ? "ADMIN" : "CANDIDATE");

  if (role === "ADMIN" && !isWorkspaceEmail(email)) return null;

  const { error } = await createAdminClient().auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, role },
  });
  if (error) return null;

  return { role, metadataUpdated: true };
}
