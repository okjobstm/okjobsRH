"use server";

import { redirect } from "next/navigation";
import { finalizeAdminSignIn } from "@/lib/admin-signin";
import { isWorkspaceEmail } from "@/lib/admin-domain";
import { getSafeAdminReturnTo } from "@/lib/auth-redirect";
import { PUBLIC_BASE_URL } from "@/lib/base-url";
import logger from "@/lib/logger";
import { parseUserRole, roleHome } from "@/lib/roles";
import { createServerClient } from "@/lib/supabase/server";
import { ensureUserRole } from "@/lib/user-role";

export type AuthActionState = {
  error?: "credentials" | "signup" | "unauthorized" | "password" | "configuration";
  status?: "check-email" | "reset-sent";
  email?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };
}

function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /\d/.test(password) && /[^A-Za-z0-9\s]/.test(password);
}

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return { error: "configuration" };

  const { email, password } = readCredentials(formData);
  if (!EMAIL_PATTERN.test(email) || !password) return { error: "credentials" };

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user || !data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    return { error: "credentials" };
  }

  const ensured = await ensureUserRole(data.user);
  if (!ensured) {
    await supabase.auth.signOut();
    return { error: "unauthorized" };
  }
  if (ensured.metadataUpdated) await supabase.auth.refreshSession();

  if (ensured.role !== "CANDIDATE") {
    if (!(await finalizeAdminSignIn(data.user, "email", ensured.role))) {
      await supabase.auth.signOut();
      return { error: "unauthorized" };
    }
    redirect(getSafeAdminReturnTo(formData.get("returnTo")));
  }

  redirect(roleHome(ensured.role));
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return { error: "configuration" };

  const { email, password } = readCredentials(formData);
  if (!EMAIL_PATTERN.test(email) || !isStrongPassword(password)) {
    return { error: "password" };
  }

  const requestedRole = parseUserRole(formData.get("role"));
  if (!requestedRole) return { error: "signup" };
  // Anyone can create a candidate or company account. Administrator remains a
  // privileged role and therefore still requires the server-side allowlist.
  if (requestedRole === "ADMIN" && !isWorkspaceEmail(email)) {
    return { error: "unauthorized" };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { requested_role: requestedRole },
      emailRedirectTo: `${PUBLIC_BASE_URL}/auth/callback`,
    },
  });

  if (error || !data.user) {
    logger.warn(
      { code: error?.code, status: error?.status },
      "Supabase signup failed"
    );
    return { error: "signup" };
  }

  if (data.session && data.user.email_confirmed_at) {
    const ensured = await ensureUserRole(data.user, requestedRole);
    if (!ensured) {
      await supabase.auth.signOut();
      return { error: "signup" };
    }
    if (ensured.metadataUpdated) await supabase.auth.refreshSession();
    if (ensured.role !== "CANDIDATE") {
      if (!(await finalizeAdminSignIn(data.user, "email", ensured.role))) {
        await supabase.auth.signOut();
        return { error: "signup" };
      }
      redirect(getSafeAdminReturnTo(formData.get("returnTo")));
    }
    redirect(roleHome(ensured.role));
  }

  return { status: "check-email", email };
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return { error: "configuration" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return { error: "credentials" };

  // Always return the same success state so this form cannot enumerate users.
  const supabase = await createServerClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${PUBLIC_BASE_URL}/auth/callback?next=/reset-password`,
  });

  return { status: "reset-sent", email };
}
