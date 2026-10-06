import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const adapter = new PrismaPg({
    connectionString,
    // Supabase Free has a small shared pool. Keeping the application pool
    // bounded prevents concurrent page renders from starving transactions.
    max: 5,
    connectionTimeoutMillis: 15_000,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    // Supavisor session mode can queue briefly while it assigns a backend
    // connection. Prisma's 2s default is too short for that normal hand-off.
    transactionOptions: {
      maxWait: 30_000,
      timeout: 30_000,
    },
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
