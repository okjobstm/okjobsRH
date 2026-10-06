import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { finalizeAdminSignIn } from "@/lib/admin-signin";
import { PUBLIC_BASE_URL } from "@/lib/base-url";
import logger from "@/lib/logger";
import { roleHome } from "@/lib/roles";
import { ensureUserRole } from "@/lib/user-role";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") === "/reset-password" ? "/reset-password" : "/admin";
  // Not the Host header: behind Cloudflare that reflects whatever the proxy
  // passed, and the redirect that follows a fresh session should land on the
  // origin the rest of the app already treats as canonical.
  const loginUrl = new URL("/login", PUBLIC_BASE_URL);

  if (!code) {
    loginUrl.searchParams.set("error", "code_manquant");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  const user = data.user;
  const email = user?.email?.toLowerCase() ?? null;

  if (error || !user || !email || !user.email_confirmed_at) {
    await supabase.auth.signOut();
    logger.warn({ err: error, email }, "Supabase sign-in refused");
    loginUrl.searchParams.set("error", "acces_refuse");
    return NextResponse.redirect(loginUrl);
  }

  if (next === "/reset-password") {
    logger.info({ email }, "Supabase password recovery verified");
    return NextResponse.redirect(new URL(next, PUBLIC_BASE_URL));
  }

  const ensured = await ensureUserRole(user);
  if (!ensured) {
    await supabase.auth.signOut();
    loginUrl.searchParams.set("error", "acces_refuse");
    return NextResponse.redirect(loginUrl);
  }
  if (ensured.metadataUpdated) await supabase.auth.refreshSession();

  if (
    ensured.role !== "CANDIDATE" &&
    !(await finalizeAdminSignIn(user, "oauth", ensured.role))
  ) {
    await supabase.auth.signOut();
    loginUrl.searchParams.set("error", "acces_refuse");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(roleHome(ensured.role), PUBLIC_BASE_URL));
}
