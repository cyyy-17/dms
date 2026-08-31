import "dotenv/config";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabase/admin";

async function setPassword() {
  const email = "mclemente@firstasia.edu.ph";
  const newPassword = "Password123!"; // Also setting an institutional default

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User ${email} not found in database.`);
    return;
  }

  // Update password in Supabase Auth
  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: newPassword,
    email_confirm: true,
  });

  if (error) {
    console.error("Failed to update password in Supabase:", error);
    return;
  }

  console.log("✓ Password successfully updated in Supabase Auth for:", email);
  console.log("Credentials:");
  console.log("Email:", email);
  console.log("Password:", newPassword);
}

setPassword().catch(console.error);
