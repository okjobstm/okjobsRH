// Mint an admin session cookie for e2e tests.
//
// The OAuth dance needs a browser, so this goes through the Supabase admin API
// instead: create the user confirmed, generate a one-time login link, then verify
// it so GoTrue hands back genuine session cookies. Prints them as JSON so the
// Python caller can hand them to Playwright.
//
// Usage:
//   set -a && source .env.test && set +a
//   node tests/e2e/mint_admin_session.mjs

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.ADMIN_E2E_EMAIL ?? "admin@example.com").toLowerCase();

for (const [name, value] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
  DATABASE_URL: process.env.DATABASE_URL,
})) {
  if (!value) {
    console.error(`${name} must be set`);
    process.exit(1);
  }
}

const adminApi = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

const { error: createError } = await adminApi.auth.admin.createUser({
  email,
  email_confirm: true,
});
if (createError && !/already been registered|already exists/i.test(createError.message)) {
  console.error(`createUser failed: ${createError.message}`);
  process.exit(1);
}

const { data: link, error: linkError } =
  await adminApi.auth.admin.generateLink({ type: "magiclink", email });
if (linkError) {
  console.error(`generateLink failed: ${linkError.message}`);
  process.exit(1);
}

// A session spans several cookies (and is chunked into more when long), so the
// caller needs the whole set rather than one name/value pair.
const jar = new Map();
const supabase = createServerClient(url, publishableKey, {
  cookies: {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: (cookiesToSet) => {
      for (const { name, value } of cookiesToSet) jar.set(name, value);
    },
  },
});

const { error: verifyError } = await supabase.auth.verifyOtp({
  type: "email",
  token_hash: link.properties.email_otp,
});
if (verifyError) {
  console.error(`verifyOtp failed: ${verifyError.message}`);
  process.exit(1);
}

if (!jar.size) {
  console.error("verifyOtp returned no session cookie");
  process.exit(1);
}

// Mirrors what app/auth/callback/route.ts writes, so the reviewer picker sees
// this admin even though no browser ever hit the callback.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
await prisma.$transaction([
  prisma.adminSession.deleteMany({ where: { email } }),
  prisma.adminSession.create({
    data: { email, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  }),
]);
await prisma.$disconnect();

console.log(
  JSON.stringify({
    email,
    cookies: [...jar].map(([name, value]) => ({ name, value })),
  })
);