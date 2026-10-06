import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isWorkspaceEmail } from "@/lib/admin-domain";
import { rateLimit, maybeSweep } from "@/lib/rate-limit";
import { parseUserRole, roleHome } from "@/lib/roles";

function getClientIp(request: NextRequest): string {
  // Cloudflare sits in front of nginx. Prefer CF-Connecting-IP (real client IP
  // as Cloudflare sees it). Fall back to leftmost X-Forwarded-For (real client
  // is leftmost when CF appends its own edge IP to the chain). X-Real-IP is
  // last resort and would only be the CF edge IP, not the real user.
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimitResponse(retryAfter: number): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: "Trop de requêtes. Veuillez ralentir." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}

// An admin page must never be served from a cache: it is personalised, and a
// cached copy would outlive the session that produced it.
function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("expires", "0");
  response.headers.set("pragma", "no-cache");
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Rate limit candidate-facing routes ──────────────────────────────────
  if (pathname.startsWith("/apply") || pathname.startsWith("/api/apply")) {
    maybeSweep();
    const ip = getClientIp(request);

    // CV uploads: 10/min burst, 1/min sustained
    if (pathname.startsWith("/api/apply/upload")) {
      const result = rateLimit(`upload:${ip}`, {
        capacity: 10,
        refillPerSecond: 10 / 60,
      });
      if (!result.allowed) {
        return rateLimitResponse(result.retryAfterSeconds);
      }
    } else {
      // Apply pages and other apply API routes: 60/min burst, 1/sec sustained
      const result = rateLimit(`apply:${ip}`, {
        capacity: 60,
        refillPerSecond: 1,
      });
      if (!result.allowed) {
        return rateLimitResponse(result.retryAfterSeconds);
      }
    }

    return NextResponse.next();
  }

  // ── Sign-in routes: stricter rate limit to slow brute-force ──────────────
  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/auth/callback"
  ) {
    maybeSweep();
    const ip = getClientIp(request);
    const result = rateLimit(`login:${ip}`, {
      capacity: 50,
      refillPerSecond: 50 / 300, // 50 per 5min — generous enough for E2E test runs while still slowing brute-force
    });
    if (!result.allowed) {
      return rateLimitResponse(result.retryAfterSeconds);
    }
    return NextResponse.next();
  }

  const dashboardRoute = pathname.startsWith("/dashboard");
  const protectedRole = pathname.startsWith("/admin")
    ? "ADMIN"
    : pathname.startsWith("/candidate")
      ? "CANDIDATE"
      : pathname.startsWith("/company")
        ? "COMPANY"
        : null;

  if (!protectedRole && !dashboardRoute) {
    return NextResponse.next();
  }

  // ── Admin auth gate ─────────────────────────────────────────────────────
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // getClaims() verifies the JWT locally against Supabase's signing keys, so the
  // gate costs no network round trip. requireAuth() revalidates with getUser().
  const { data } = await supabase.auth.getClaims();

  const claimEmail = data?.claims?.email;
  const email = typeof claimEmail === "string" ? claimEmail.toLowerCase() : "";
  const appMetadata = data?.claims?.app_metadata;
  const role = parseUserRole(
    appMetadata && typeof appMetadata === "object" && "role" in appMetadata
      ? appMetadata.role
      : null
  );
  const authorized = dashboardRoute
    ? Boolean(email) && role === "CANDIDATE"
    : pathname.startsWith("/admin")
      ? Boolean(email) &&
        (role === "COMPANY" || (role === "ADMIN" && isWorkspaceEmail(email)))
      : Boolean(email) &&
        role === protectedRole &&
        (role !== "ADMIN" || isWorkspaceEmail(email));

  if (!authorized) {
    // The refresh Supabase just wrote is on `response`; a redirect built from
    // scratch would drop it and the retry would land unauthenticated.
    const destination =
      role && (role !== "ADMIN" || isWorkspaceEmail(email))
        ? roleHome(role)
        : "/login";
    const redirect = NextResponse.redirect(new URL(destination, request.url));
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return noStore(redirect);
  }

  return noStore(response);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/candidate/:path*",
    "/company/:path*",
    "/dashboard/:path*",
    "/apply/:path*",
    "/api/apply/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
  ],
};
