import type { User } from "@supabase/supabase-js";
import { isWorkspaceEmail } from "@/lib/admin-domain";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import type { UserRole } from "@/lib/roles";

const ADMIN_SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export async function finalizeAdminSignIn(
  user: User | null,
  method: "email" | "oauth" | "recovery",
  role: Extract<UserRole, "ADMIN" | "COMPANY"> = "ADMIN"
): Promise<string | null> {
  const email = user?.email?.trim().toLowerCase() ?? null;

  if (
    !user ||
    !email ||
    !user.email_confirmed_at ||
    (role === "ADMIN" && !isWorkspaceEmail(email))
  ) {
    return null;
  }

  await prisma.$transaction([
    prisma.adminSession.deleteMany({ where: { email } }),
    prisma.adminSession.create({
      data: {
        email,
        expiresAt: new Date(Date.now() + ADMIN_SESSION_LIFETIME_MS),
      },
    }),
  ]);

  logger.info({ email, method, role }, "Recruiter login success (supabase)");
  return email;
}
