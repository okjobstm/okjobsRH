import { redirect } from "next/navigation";
import { isWorkspaceEmail } from "@/lib/admin-domain";
import { createServerClient } from "@/lib/supabase/server";
import { type UserRole } from "@/lib/roles";
import { getUserRole } from "@/lib/user-role";

export interface UserIdentity {
  email: string;
  userId: string;
  role: UserRole;
}

export type AdminIdentity = UserIdentity & { role: "ADMIN" };
export type RecruiterIdentity = UserIdentity & { role: "ADMIN" | "COMPANY" };

/**
 * Validity comes from Supabase: getUser() revalidates the access token against
 * GoTrue, so a cookie forged with an expired or revoked token is refused. AdminSession
 * rows are a first-login record, not a session store.
 */
export async function getAuthedUser(): Promise<UserIdentity | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !user.email_confirmed_at) return null;

  const role = getUserRole(user);
  if (!role) return null;

  return { email: user.email.toLowerCase(), userId: user.id, role };
}

export async function getAuthedAdmin(): Promise<AdminIdentity | null> {
  const user = await getAuthedUser();
  if (!user || user.role !== "ADMIN") return null;
  return { ...user, role: "ADMIN" };
}

export async function requireAuth(): Promise<RecruiterIdentity> {
  const user = await getAuthedUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "COMPANY")) {
    redirect("/login?error=acces_refuse");
  }
  return { ...user, role: user.role };
}

export async function requireRole(role: UserRole): Promise<UserIdentity> {
  const user = await getAuthedUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect("/login?error=acces_refuse");
  return user;
}

/**
 * Emails to surface in reviewer pickers: everyone who has signed in at least
 * once, plus any explicit addition from ADMIN_EMAILS so a fresh deploy has
 * someone to assign before the first login.
 */
export async function getKnownAdminEmails(): Promise<string[]> {
  const { prisma } = await import("./prisma");
  const rows = await prisma.adminSession.findMany({
    distinct: ["email"],
    select: { email: true },
    orderBy: { email: "asc" },
  });
  const fromDb = rows.map((r) => r.email.toLowerCase());

  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e && isWorkspaceEmail(e));

  return Array.from(new Set([...fromDb, ...fromEnv])).sort();
}
