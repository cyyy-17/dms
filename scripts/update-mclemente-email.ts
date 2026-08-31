import "dotenv/config";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabase/admin";

async function updateEmail() {
  const oldEmail = "mclemente08@firstasia.edu.ph";
  const newEmail = "mclemente@firstasia.edu.ph";

  console.log(`=== Updating User Email: ${oldEmail} -> ${newEmail} ===`);

  // 1. Find user in Prisma
  const user = await prisma.user.findUnique({
    where: { email: oldEmail },
  });

  if (!user) {
    console.log(`User with email ${oldEmail} not found in Prisma DB. Checking if ${newEmail} already exists...`);
    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing) {
      console.log(`User ${newEmail} already exists in Prisma:`, existing.id);
    }
    return;
  }

  console.log(`Found user in Prisma: ${user.id} (${user.firstName} ${user.lastName})`);

  // 2. Update Supabase Auth user email
  try {
    const { data: supaUser, error: supaErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email: newEmail,
      email_confirm: true,
    });
    if (supaErr) {
      console.error("Supabase Auth email update error:", supaErr);
    } else {
      console.log("✓ Updated Supabase Auth user email to:", supaUser.user?.email);
    }
  } catch (err) {
    console.error("Exception updating Supabase Auth user:", err);
  }

  // 3. Update Prisma User email
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { email: newEmail },
  });

  console.log("✓ Updated Prisma DB user email to:", updatedUser.email);

  // 4. Update any notification queue entries
  const notifUpdate = await prisma.notificationQueue.updateMany({
    where: { recipientEmail: oldEmail },
    data: { recipientEmail: newEmail },
  });
  console.log(`✓ Updated ${notifUpdate.count} notification queue records to ${newEmail}`);

  console.log("\n=== Email Update Complete ===");
  console.log({
    id: updatedUser.id,
    name: `${updatedUser.firstName} ${updatedUser.lastName}`,
    email: updatedUser.email,
    role: updatedUser.role,
    status: updatedUser.status,
  });
}

updateEmail().catch(console.error).finally(() => prisma.$disconnect());
