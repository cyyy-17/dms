-- ============================================================================
-- Student & Alumni Services Document Management System (SASDMS)
-- Database Row Level Security (RLS) & Storage Security Configuration
-- ============================================================================

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

-- 2. Helper Functions (Secured Search Path & Permissions)
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS "UserRole"
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT "role" FROM public."users" WHERE "id" = auth.uid() AND "status" = 'ACTIVE' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_unit_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT "unitId" FROM public."users" WHERE "id" = auth.uid() AND "status" = 'ACTIVE' LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_auth_role() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_auth_unit_id() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_auth_role() TO authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.get_auth_unit_id() TO authenticated, service_role, postgres;

-- 3. RLS Policies
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

DROP POLICY IF EXISTS "Units_Select_All_Authenticated" ON public."units";
CREATE POLICY "Units_Select_All_Authenticated" ON public."units"
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Units_Admin_Manage" ON public."units";
CREATE POLICY "Units_Admin_Manage" ON public."units"
FOR ALL TO authenticated USING (
  public.get_auth_role() = 'ADMIN'
);

DROP POLICY IF EXISTS "DocTypes_Select_All_Authenticated" ON public."document_types";
CREATE POLICY "DocTypes_Select_All_Authenticated" ON public."document_types"
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "DocTypes_Admin_Manage" ON public."document_types";
CREATE POLICY "DocTypes_Admin_Manage" ON public."document_types"
FOR ALL TO authenticated USING (
  public.get_auth_role() = 'ADMIN'
);

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

DROP POLICY IF EXISTS "ApprovalActions_Select_Access" ON public."approval_actions";
CREATE POLICY "ApprovalActions_Select_Access" ON public."approval_actions"
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public."documents" d
    WHERE d."id" = "approval_actions"."documentId"
  )
);

DROP POLICY IF EXISTS "Delegates_Select_Access" ON public."delegate_signatories";
CREATE POLICY "Delegates_Select_Access" ON public."delegate_signatories"
FOR SELECT TO authenticated USING (
  public.get_auth_role() IN ('ADMIN', 'DIRECTOR')
  OR "delegatorId" = auth.uid()
  OR "delegateId" = auth.uid()
);

DROP POLICY IF EXISTS "AuditLogs_Select_Admin_Only" ON public."audit_logs";
CREATE POLICY "AuditLogs_Select_Admin_Only" ON public."audit_logs"
FOR SELECT TO authenticated USING (
  public.get_auth_role() IN ('ADMIN', 'DIRECTOR')
);

DROP POLICY IF EXISTS "Notification_Select_Recipient_Or_Admin" ON public."notification_queue";
CREATE POLICY "Notification_Select_Recipient_Or_Admin" ON public."notification_queue"
FOR SELECT TO authenticated USING (
  public.get_auth_role() = 'ADMIN' OR "recipientId" = auth.uid()
);
