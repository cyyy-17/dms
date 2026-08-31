import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

async function checkToken() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: "40279c2ae383c6b02fbbb20c09c865426bbd08397339e1cee9379de2",
    type: "recovery",
  });

  console.log("Error:", error);
  console.log("Data session:", !!data?.session);
}

checkToken().catch(console.error);
