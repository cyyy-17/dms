import "dotenv/config";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabase/admin";
import { UserRole, UserStatus } from "@prisma/client";

async function createPersonalAccount() {
  const email = "cpm.061798@gmail.com";
  const password = "Password123!";
  const firstName = "Cyrell Peter";
  const lastName = "Mercado";
  const employeeId = "EMP-TEST-0617";
  const role = UserRole.ADMIN; // Provide full Admin privileges so all notification workflows can be tested

  console.log(`\n=================================================`);
  console.log(`Provisioning Account for: ${email}`);
  console.log(`=================================================`);

  // 1. Fetch default unit
  const unit = await prisma.unit.findFirst({
    where: { isActive: true },
    orderBy: { code: "asc" },
  });

  if (!unit) {
    console.error("Error: No active department unit found in database.");
    return;
  }

  console.log(`Assigned Unit: ${unit.name} (${unit.code})`);

  let authUserId: string;

  // 2. Check Supabase Auth
  const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error("Supabase listUsers error:", listError);
  }

  const existingAuthUser = userList?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (existingAuthUser) {
    console.log(`User already exists in Supabase Auth (UID: ${existingAuthUser.id}). Updating password and metadata...`);
    authUserId = existingAuthUser.id;
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      password: password,
      email_confirm: true,
      user_metadata: {
        firstName,
        lastName,
      },
    });

    if (updateError) {
      console.error("Error updating Supabase user:", updateError);
    }
  } else {
    console.log(`Creating new user in Supabase Auth...`);
    const { data: newAuth, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        firstName,
        lastName,
      },
    });

    if (createError || !newAuth.user) {
      console.error("Error creating Supabase user:", createError);
      return;
    }

    authUserId = newAuth.user.id;
  }

  // 3. Check / Upsert in Prisma Database
  const existingPrismaUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingPrismaUser) {
    console.log(`Updating existing Prisma profile for ${email}...`);
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        id: authUserId,
        firstName,
        lastName,
        employeeId,
        role,
        status: UserStatus.ACTIVE,
        unitId: unit.id,
        approvedAt: new Date(),
      },
    });
  } else {
    console.log(`Creating new Prisma profile for ${email}...`);
    await prisma.user.create({
      data: {
        id: authUserId,
        email: email.toLowerCase(),
        firstName,
        lastName,
        employeeId,
        role,
        status: UserStatus.ACTIVE,
        unitId: unit.id,
        approvedAt: new Date(),
      },
    });
  }

  console.log("\n=================================================");
  console.log("✓ Account Successfully Created & Activated!");
  console.log("=================================================");
  console.log(`Email:       ${email}`);
  console.log(`Password:    ${password}`);
  console.log(`Role:        ${role}`);
  console.log(`Status:      ACTIVE`);
  console.log(`Unit:        ${unit.name} (${unit.code})`);
  console.log(`Employee ID: ${employeeId}`);
  console.log(`User ID:     ${authUserId}`);
  console.log("=================================================\n");
}

createPersonalAccount()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
