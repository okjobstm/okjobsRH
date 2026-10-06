export const USER_ROLES = ["ADMIN", "CANDIDATE", "COMPANY"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function parseUserRole(value: unknown): UserRole | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return USER_ROLES.find((role) => role === normalized) ?? null;
}

export function roleHome(role: UserRole): string {
  if (role === "CANDIDATE") return "/dashboard";
  return "/admin";
}
