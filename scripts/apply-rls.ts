import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

async function applyRLS() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("Missing database connection string.");
    process.exit(1);
  }

  console.log("Connecting to Supabase PostgreSQL to enable Row Level Security (RLS)...");

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  try {
    console.log("1. Enabling Row Level Security on all 9 public schema tables...");

    const enableRlsSql = `
      -- 1. Enable RLS across all 9 public tables
      ALTER TABLE IF EXISTS "public"."users" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS "public"."units" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS "public"."document_types" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS "public"."documents" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS "public"."document_versions" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS "public"."approval_actions" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS "public"."delegate_signatories" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS "public"."audit_logs" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS "public"."notification_queue" ENABLE ROW LEVEL SECURITY;
    `;

    await client.query(enableRlsSql);
    console.log("✓ RLS enabled across all tables.");

    console.log("2. Creating Helper Functions & Security Definers...");

    const helperFunctionsSql = `
      -- Helper Functions for Auth Context
      CREATE OR REPLACE FUNCTION public.get_auth_role()
      RETURNS "UserRole" AS $$
        SELECT "role" FROM public."users" WHERE "id" = auth.uid() AND "status" = 'ACTIVE';
      $$ LANGUAGE sql STABLE SECURITY DEFINER;

      CREATE OR REPLACE FUNCTION public.get_auth_unit_id()
      RETURNS uuid AS $$
        SELECT "unitId" FROM public."users" WHERE "id" = auth.uid() AND "status" = 'ACTIVE';
      $$ LANGUAGE sql STABLE SECURITY DEFINER;
    `;

    await client.query(helperFunctionsSql);
    console.log("✓ Helper functions created.");

    console.log("3. Creating Comprehensive RLS Policies...");

    const policiesSql = `
      -- -------------------------------------------------------------
      -- 1. USERS POLICIES
      -- -------------------------------------------------------------
      DROP POLICY IF EXISTS "Users_Select_Self_Or_Admin" ON public."users";
      CREATE POLICY "Users_Select_Self_Or_Admin" ON public."users"
      FOR SELECT TO authenticated USING (
        "id" = auth.uid() OR public.get_auth_role() IN ('ADMIN', 'DIRECTOR')
      );

      DROP POLICY IF EXISTS "Users_Update_Admin" ON public."users";
      CREATE POLICY "Users_Update_Admin" ON public."users"
      FOR ALL TO authenticated USING (
        public.get_auth_role() = 'ADMIN'
      );

      -- -------------------------------------------------------------
      -- 2. UNITS POLICIES
      -- -------------------------------------------------------------
      DROP POLICY IF EXISTS "Units_Select_All_Authenticated" ON public."units";
      CREATE POLICY "Units_Select_All_Authenticated" ON public."units"
      FOR SELECT TO authenticated USING (true);

      DROP POLICY IF EXISTS "Units_Admin_Manage" ON public."units";
      CREATE POLICY "Units_Admin_Manage" ON public."units"
      FOR ALL TO authenticated USING (
        public.get_auth_role() = 'ADMIN'
      );

      -- -------------------------------------------------------------
      -- 3. DOCUMENT TYPES POLICIES
      -- -------------------------------------------------------------
      DROP POLICY IF EXISTS "DocTypes_Select_All_Authenticated" ON public."document_types";
      CREATE POLICY "DocTypes_Select_All_Authenticated" ON public."document_types"
      FOR SELECT TO authenticated USING (true);

      DROP POLICY IF EXISTS "DocTypes_Admin_Manage" ON public."document_types";
      CREATE POLICY "DocTypes_Admin_Manage" ON public."document_types"
      FOR ALL TO authenticated USING (
        public.get_auth_role() = 'ADMIN'
      );

      -- -------------------------------------------------------------
      -- 4. DOCUMENTS POLICIES
      -- -------------------------------------------------------------
      DROP POLICY IF EXISTS "Documents_Select_Access" ON public."documents";
      CREATE POLICY "Documents_Select_Access" ON public."documents"
      FOR SELECT TO authenticated USING (
        public.get_auth_role() IN ('ADMIN', 'DIRECTOR')
        OR (public.get_auth_role() = 'COORDINATOR' AND "unitId" = public.get_auth_unit_id())
        OR (public.get_auth_role() = 'STAFF' AND (
          "uploaderId" = auth.uid() OR ("unitId" = public.get_auth_unit_id() AND "status" = 'APPROVED')
        ))
      );

      DROP POLICY IF EXISTS "Documents_Insert_Staff" ON public."documents";
      CREATE POLICY "Documents_Insert_Staff" ON public."documents"
      FOR INSERT TO authenticated WITH CHECK (
        "uploaderId" = auth.uid()
      );

      -- -------------------------------------------------------------
      -- 5. DOCUMENT VERSIONS POLICIES
      -- -------------------------------------------------------------
      DROP POLICY IF EXISTS "Versions_Select_Access" ON public."document_versions";
      CREATE POLICY "Versions_Select_Access" ON public."document_versions"
      FOR SELECT TO authenticated USING (
        EXISTS (
          SELECT 1 FROM public."documents" d
          WHERE d."id" = "document_versions"."documentId"
          AND (
            public.get_auth_role() IN ('ADMIN', 'DIRECTOR')
            OR (public.get_auth_role() = 'COORDINATOR' AND d."unitId" = public.get_auth_unit_id())
            OR (public.get_auth_role() = 'STAFF' AND (
              d."uploaderId" = auth.uid() OR (d."unitId" = public.get_auth_unit_id() AND d."status" = 'APPROVED')
            ))
          )
        )
      );

      -- -------------------------------------------------------------
      -- 6. APPROVAL ACTIONS POLICIES
      -- -------------------------------------------------------------
      DROP POLICY IF EXISTS "ApprovalActions_Select_Access" ON public."approval_actions";
      CREATE POLICY "ApprovalActions_Select_Access" ON public."approval_actions"
      FOR SELECT TO authenticated USING (
        EXISTS (
          SELECT 1 FROM public."documents" d
          WHERE d."id" = "approval_actions"."documentId"
        )
      );

      -- -------------------------------------------------------------
      -- 7. DELEGATE SIGNATORIES POLICIES
      -- -------------------------------------------------------------
      DROP POLICY IF EXISTS "Delegates_Select_Access" ON public."delegate_signatories";
      CREATE POLICY "Delegates_Select_Access" ON public."delegate_signatories"
      FOR SELECT TO authenticated USING (
        public.get_auth_role() IN ('ADMIN', 'DIRECTOR')
        OR "delegatorId" = auth.uid()
        OR "delegateId" = auth.uid()
      );

      -- -------------------------------------------------------------
      -- 8. AUDIT LOGS POLICIES
      -- -------------------------------------------------------------
      DROP POLICY IF EXISTS "AuditLogs_Select_Admin_Only" ON public."audit_logs";
      CREATE POLICY "AuditLogs_Select_Admin_Only" ON public."audit_logs"
      FOR SELECT TO authenticated USING (
        public.get_auth_role() IN ('ADMIN', 'DIRECTOR')
      );

      -- -------------------------------------------------------------
      -- 9. NOTIFICATION QUEUE POLICIES
      -- -------------------------------------------------------------
      DROP POLICY IF EXISTS "Notification_Select_Recipient_Or_Admin" ON public."notification_queue";
      CREATE POLICY "Notification_Select_Recipient_Or_Admin" ON public."notification_queue"
      FOR SELECT TO authenticated USING (
        public.get_auth_role() = 'ADMIN' OR "recipientId" = auth.uid()
      );
    `;

    await client.query(policiesSql);
    console.log("✓ All security policies created successfully.");

    // Query to verify RLS status
    console.log("\n4. Verifying RLS status across public schema:");
    const verifyRes = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);

    verifyRes.rows.forEach((row) => {
      console.log(`  Table: ${row.tablename.padEnd(25)} | RLS Enabled: ${row.rowsecurity ? "✓ TRUE" : "✗ FALSE"}`);
    });

  } catch (err) {
    console.error("Error applying RLS policies:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

applyRLS();
