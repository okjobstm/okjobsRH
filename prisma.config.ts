// Prisma 7 no longer auto-loads .env in the config context, so load it here.
// This makes `prisma generate`/`migrate`/`db push`/`db seed` pick up .env
// after `cp .env.example .env`, with no extra steps.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    // Prisma migrations and the long-lived Next.js server both use Supabase's
    // IPv4 session pooler so multi-statement transactions keep one connection.
    // Client generation does not connect to the database and must also work
    // in build environments where the migration URL is not configured.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
