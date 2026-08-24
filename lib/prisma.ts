import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export const isDatabaseConfigured = !!(
  (process.env.DIRECT_URL || process.env.DATABASE_URL) &&
  !(process.env.DIRECT_URL || process.env.DATABASE_URL)?.includes("placeholder")
);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString =
    process.env.DIRECT_URL || process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";

  const isCloud = connectionString.includes("supabase.com") || connectionString.includes("pooler");

  const pool = new Pool({
    connectionString,
    ssl: isCloud ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: isDatabaseConfigured && process.env.NODE_ENV === "development" ? ["warn", "error"] : [],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
