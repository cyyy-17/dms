import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export const isDatabaseConfigured = !!(
  (process.env.DATABASE_URL || process.env.DIRECT_URL) &&
  !(process.env.DATABASE_URL || process.env.DIRECT_URL)?.includes("placeholder")
);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient() {
  // Prioritize pooled DATABASE_URL for runtime queries; fallback to DIRECT_URL
  const connectionString =
    process.env.DATABASE_URL || process.env.DIRECT_URL || "postgresql://postgres:postgres@localhost:5432/postgres";

  const isCloud = connectionString.includes("supabase.com") || connectionString.includes("pooler");

  // In serverless / Supabase environments, keep connection pool small (max 2) per worker
  // and short idle timeout to prevent exhausting Supabase pool_size: 15
  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString,
      ssl: isCloud ? { rejectUnauthorized: false } : undefined,
      max: isCloud ? 2 : 10,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 10000,
    });

  globalForPrisma.pool = pool;

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: isDatabaseConfigured && process.env.NODE_ENV === "development" ? ["warn", "error"] : [],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Ensure prisma and pool singleton are preserved across all environments
globalForPrisma.prisma = prisma;

export default prisma;
