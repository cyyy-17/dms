import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

async function fixLinterWarnings() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("Missing database connection string.");
    process.exit(1);
  }

  console.log("Connecting to Supabase PostgreSQL to fix function security linter warnings...");

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  try {
    const fixSql = `
      -- 1. Recreate get_auth_role with fixed search_path and SECURITY INVOKER
      CREATE OR REPLACE FUNCTION public.get_auth_role()
      RETURNS "UserRole"
      LANGUAGE sql
      STABLE
      SECURITY INVOKER
      SET search_path = public, pg_temp
      AS $$
        SELECT "role" FROM public."users" WHERE "id" = auth.uid() AND "status" = 'ACTIVE' LIMIT 1;
      $$;

      -- 2. Recreate get_auth_unit_id with fixed search_path and SECURITY INVOKER
      CREATE OR REPLACE FUNCTION public.get_auth_unit_id()
      RETURNS uuid
      LANGUAGE sql
      STABLE
      SECURITY INVOKER
      SET search_path = public, pg_temp
      AS $$
        SELECT "unitId" FROM public."users" WHERE "id" = auth.uid() AND "status" = 'ACTIVE' LIMIT 1;
      $$;

      -- 3. Revoke EXECUTE from anon role so public unauthenticated RPC cannot invoke them
      REVOKE EXECUTE ON FUNCTION public.get_auth_role() FROM anon, public;
      REVOKE EXECUTE ON FUNCTION public.get_auth_unit_id() FROM anon, public;

      -- 4. Grant EXECUTE specifically to authenticated and service_role for RLS evaluation
      GRANT EXECUTE ON FUNCTION public.get_auth_role() TO authenticated, service_role, postgres;
      GRANT EXECUTE ON FUNCTION public.get_auth_unit_id() TO authenticated, service_role, postgres;
    `;

    await client.query(fixSql);
    console.log("✓ Successfully fixed function search_path, security definer, and execution permissions.");

  } catch (err) {
    console.error("Error applying function fixes:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

fixLinterWarnings();
