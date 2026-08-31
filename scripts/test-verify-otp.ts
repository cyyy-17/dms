import "dotenv/config";
import { supabaseAdmin } from "../lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";

async function testVerifyOtp() {
  const email = "cpm.061798@gmail.com";
  console.log("1. Generating link via supabaseAdmin...");
  const { data: genData, error: genError } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  if (genError) {
    console.error("genError:", genError);
    return;
  }

  console.log("genData properties:", genData.properties);
  const tokenHash = genData.properties.hashed_token;

  console.log("\n2. Testing verifyOtp on client with token_hash:", tokenHash);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });

  console.log("verifyError:", verifyError);
  console.log("verifyData session:", !!verifyData?.session, verifyData?.user?.email);
}

testVerifyOtp().catch(console.error);
