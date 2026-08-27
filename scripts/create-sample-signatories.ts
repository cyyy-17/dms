import "dotenv/config";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabase/admin";
import { UserRole, UserStatus } from "@prisma/client";

async function createSampleSignatoryAccounts() {
  console.log("=================================================");
  console.log("Provisioning Signatory Accounts from Sample Document");
  console.log("=================================================\n");

  // Ensure ASEAN Student Residences Unit exists
  const aseanUnit = await prisma.unit.upsert({
    where: { code: "ASEAN_RES" },
    update: {
      name: "ASEAN Student Residences",
      description: "Dormitory management, student residential operations, and hall administration.",
    },
    create: {
      code: "ASEAN_RES",
      name: "ASEAN Student Residences",
      description: "Dormitory management, student residential operations, and hall administration.",
      isActive: true,
    },
  });
  console.log(`✓ Unit ready: ${aseanUnit.name} (${aseanUnit.code})`);

  // Ensure Institutional Student Programs Unit exists
  const programsUnit = await prisma.unit.upsert({
    where: { code: "STUDENT_PROGRAMS" },
    update: {
      name: "Institutional Student Programs and Services",
      description: "Institutional student development programs and campus services.",
    },
    create: {
      code: "STUDENT_PROGRAMS",
      name: "Institutional Student Programs and Services",
      description: "Institutional student development programs and campus services.",
      isActive: true,
    },
  });
  console.log(`✓ Unit ready: ${programsUnit.name} (${programsUnit.code})`);

  // General Director / Admin Unit
  const generalUnit = await prisma.unit.findFirst({
    where: { isActive: true },
  });

  const accounts = [
    {
      email: "dennis.ramos@firstasia.edu.ph",
      password: "Password123!",
      firstName: "Dennis",
      lastName: "Ramos",
      employeeId: "EMP-COORD-002",
      role: UserRole.COORDINATOR,
      unitId: aseanUnit.id,
      unitName: aseanUnit.name,
      title: "Coordinator, ASEAN Student Residences",
    },
    {
      email: "janine.javier@firstasia.edu.ph",
      password: "Password123!",
      firstName: "Janine Mae",
      lastName: "Javier",
      employeeId: "EMP-COORD-003",
      role: UserRole.COORDINATOR,
      unitId: programsUnit.id,
      unitName: programsUnit.name,
      title: "Head, Institutional Student Programs and Services",
    },
    {
      email: "aljon.tolentino@firstasia.edu.ph",
      password: "Password123!",
      firstName: "Aljon",
      lastName: "Tolentino",
      employeeId: "EMP-DIR-001",
      role: UserRole.DIRECTOR,
      unitId: generalUnit?.id || aseanUnit.id,
      unitName: "Student and Alumni Services",
      title: "Director, Student and Alumni Services",
    },
    {
      email: "emmanuel.sator@firstasia.edu.ph",
      password: "Password123!",
      firstName: "Emmanuel",
      lastName: "Sator",
      employeeId: "EMP-SVP-001",
      role: UserRole.DIRECTOR,
      unitId: generalUnit?.id || aseanUnit.id,
      unitName: "Administration and Support Units",
      title: "SVP, Administration and Support Units",
    },
  ];

  for (const acc of accounts) {
    console.log(`\n-------------------------------------------------`);
    console.log(`Provisioning: ${acc.firstName} ${acc.lastName} (${acc.role})...`);

    let authUserId: string;

    // 1. Supabase Auth Provisioning
    const { data: listUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = listUsers?.users?.find((u) => u.email?.toLowerCase() === acc.email.toLowerCase());

    if (existingAuthUser) {
      console.log(`  Supabase Auth user exists (${existingAuthUser.id}). Updating password...`);
      authUserId = existingAuthUser.id;
      await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          firstName: acc.firstName,
          lastName: acc.lastName,
        },
      });
    } else {
      console.log(`  Creating new user in Supabase Auth...`);
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
        console.error(`  Error creating Supabase user for ${acc.email}:`, createError);
        continue;
      }
      authUserId = newAuth.user.id;
    }

    // 2. Prisma Database Upsert
    const userRecord = await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        id: authUserId,
        firstName: acc.firstName,
        lastName: acc.lastName,
        employeeId: acc.employeeId,
        role: acc.role,
        status: UserStatus.ACTIVE,
        unitId: acc.unitId,
        approvedAt: new Date(),
      },
      create: {
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

    console.log(`✓ Provisioned & Activated successfully!`);
    console.log(`  Name: ${userRecord.firstName} ${userRecord.lastName}`);
    console.log(`  Email: ${acc.email}`);
    console.log(`  Password: ${acc.password}`);
    console.log(`  Role: ${acc.role}`);
    console.log(`  Unit: ${acc.unitName}`);
    console.log(`  Designation: ${acc.title}`);
  }

  console.log("\n=================================================");
  console.log("All sample signatory accounts ready for testing!");
  console.log("=================================================");
}

createSampleSignatoryAccounts()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
