import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

// Note: SUPABASE_SERVICE_ROLE_KEY bypasses RLS and is used ONLY for
// server-side administrative tasks (pre-auth user provisioning, background storage operations).
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
