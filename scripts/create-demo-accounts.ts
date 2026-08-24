import "dotenv/config";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabase/admin";
import { UserRole, UserStatus } from "@prisma/client";

async function createAccounts() {
  console.log("Fetching existing units...");
  const units = await prisma.unit.findMany({
    orderBy: { code: "asc" },
  });

  console.log(`Found ${units.length} units.`);
  units.forEach((u) => console.log(`- ${u.code}: ${u.name} (ID: ${u.id})`));

  const careerUnit = units.find((u) => u.code === "CAREER") || units[0];

  const accountsToCreate = [
    {
      email: "coordinator.career@firstasia.edu.ph",
      password: "Password123!",
      firstName: "Maria",
      lastName: "Santos",
      employeeId: "EMP-COORD-001",
      role: UserRole.COORDINATOR,
      unitId: careerUnit.id,
      unitName: careerUnit.name,
    },
    {
      email: "staff.career@firstasia.edu.ph",
      password: "Password123!",
      firstName: "Juan",
      lastName: "Dela Cruz",
      employeeId: "EMP-STAFF-001",
      role: UserRole.STAFF,
      unitId: careerUnit.id,
      unitName: careerUnit.name,
    },
  ];

  for (const acc of accountsToCreate) {
    console.log(`\nCreating ${acc.role} account for ${acc.email}...`);

    // Check if user exists in Prisma
    let user = await prisma.user.findUnique({
      where: { email: acc.email },
    });

    let authUserId: string;

    // Check if user exists in Supabase
    const { data: listUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = listUsers?.users?.find((u) => u.email === acc.email);

    if (existingAuthUser) {
      console.log(`User already exists in Supabase Auth (UID: ${existingAuthUser.id}). Updating password...`);
      authUserId = existingAuthUser.id;
      await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        password: acc.password,
        email_confirm: true,
      });
    } else {
      console.log(`Creating new user in Supabase Auth...`);
      const { data: newAuth, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          firstName: acc.firstName,
          lastName: acc.lastName,
        },
      });

      if (createError || !newAuth.user) {
        console.error(`Error creating Supabase user for ${acc.email}:`, createError);
        continue;
      }
      authUserId = newAuth.user.id;
    }

    // Upsert in Prisma
    if (user) {
      console.log(`Updating existing Prisma record for ${acc.email}...`);
      user = await prisma.user.update({
        where: { email: acc.email },
        data: {
          id: authUserId,
          firstName: acc.firstName,
          lastName: acc.lastName,
          employeeId: acc.employeeId,
          role: acc.role,
          status: UserStatus.ACTIVE,
          unitId: acc.unitId,
          approvedAt: new Date(),
        },
      });
    } else {
      console.log(`Creating new Prisma record for ${acc.email}...`);
      user = await prisma.user.create({
        data: {
          id: authUserId,
          email: acc.email,
          firstName: acc.firstName,
          lastName: acc.lastName,
          employeeId: acc.employeeId,
          role: acc.role,
          status: UserStatus.ACTIVE,
          unitId: acc.unitId,
          approvedAt: new Date(),
        },
      });
    }

    console.log(`✓ ${acc.role} Account Created & Activated!`);
    console.log(`  Email: ${acc.email}`);
    console.log(`  Password: ${acc.password}`);
    console.log(`  Role: ${acc.role}`);
    console.log(`  Unit: ${acc.unitName} (${acc.unitId})`);
  }

  console.log("\n=================================================");
  console.log("All requested accounts successfully provisioned!");
  console.log("=================================================");
}

createAccounts()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
