import "dotenv/config";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabase/admin";
import { SEED_UNITS, SEED_DOCUMENT_TYPES, STORAGE_BUCKETS } from "../lib/constants";
import { UserRole, UserStatus, ApprovalLevel, AuditAction } from "@prisma/client";

async function resetForProduction() {
  console.log("=================================================");
  console.log("🚀 STARTING PRODUCTION DATABASE & AUTH PURGE");
  console.log("=================================================\n");

  // ---------------------------------------------------------------------------
  // STEP 1: Delete all test/dummy data from Postgres in foreign key order
  // ---------------------------------------------------------------------------
  console.log("1. Deleting all records from PostgreSQL database...");
  
  await prisma.approvalAction.deleteMany({});
  console.log("  ✓ Cleared ApprovalAction table");

  await prisma.notificationQueue.deleteMany({});
  console.log("  ✓ Cleared NotificationQueue table");

  await prisma.auditLog.deleteMany({});
  console.log("  ✓ Cleared AuditLog table");

  await prisma.delegateSignatory.deleteMany({});
  console.log("  ✓ Cleared DelegateSignatory table");

  await prisma.documentVersion.deleteMany({});
  console.log("  ✓ Cleared DocumentVersion table");

  await prisma.document.deleteMany({});
  console.log("  ✓ Cleared Document table");

  await prisma.user.deleteMany({});
  console.log("  ✓ Cleared User table");

  await prisma.documentType.deleteMany({});
  console.log("  ✓ Cleared DocumentType table");

  await prisma.unit.deleteMany({});
  console.log("  ✓ Cleared Unit table");

  // ---------------------------------------------------------------------------
  // STEP 2: Purge all users from Supabase Auth
  // ---------------------------------------------------------------------------
  console.log("\n2. Purging existing users from Supabase Auth...");
  const { data: authList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error("  ✕ Failed to list Supabase Auth users:", listError);
  } else if (authList?.users) {
    for (const authUser of authList.users) {
      const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      if (delError) {
        console.warn(`  ✕ Could not delete user ${authUser.email} (${authUser.id}):`, delError.message);
      } else {
        console.log(`  ✓ Deleted Supabase Auth user: ${authUser.email} (${authUser.id})`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 3: Clean up files in Supabase Storage Buckets
  // ---------------------------------------------------------------------------
  console.log("\n3. Cleaning up Supabase Storage buckets...");
  for (const bucketName of [STORAGE_BUCKETS.DOCUMENTS, STORAGE_BUCKETS.SIGNATURES]) {
    try {
      const { data: files, error: listFilesErr } = await supabaseAdmin.storage
        .from(bucketName)
        .list("", { limit: 100 });

      if (listFilesErr) {
        console.warn(`  Note on listing bucket ${bucketName}:`, listFilesErr.message);
      } else if (files && files.length > 0) {
        const filePaths = files.map((f) => f.name);
        const { error: removeErr } = await supabaseAdmin.storage
          .from(bucketName)
          .remove(filePaths);
        if (removeErr) {
          console.warn(`  ✕ Failed to empty bucket ${bucketName}:`, removeErr.message);
        } else {
          console.log(`  ✓ Removed ${filePaths.length} file(s) from '${bucketName}' bucket`);
        }
      } else {
        console.log(`  ✓ Bucket '${bucketName}' is clean`);
      }
    } catch (err) {
      console.warn(`  Storage cleanup note on ${bucketName}:`, err);
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 4: Seed Canonical SAS Department Units
  // ---------------------------------------------------------------------------
  console.log("\n4. Seeding official Student & Alumni Services (SAS) Units...");
  const createdUnits = [];
  for (const u of SEED_UNITS) {
    const createdUnit = await prisma.unit.create({
      data: {
        code: u.code,
        name: u.name,
        description: u.description,
        isActive: true,
      },
    });
    createdUnits.push(createdUnit);
    console.log(`  ✓ Seeded Unit: [${createdUnit.code}] ${createdUnit.name}`);
  }

  // ---------------------------------------------------------------------------
  // STEP 5: Seed Canonical SAS Document Types
  // ---------------------------------------------------------------------------
  console.log("\n5. Seeding official Document Types & Retention Rules...");
  for (const dt of SEED_DOCUMENT_TYPES) {
    const createdDocType = await prisma.documentType.create({
      data: {
        code: dt.code,
        name: dt.name,
        description: dt.description,
        defaultApprovalLevel: dt.defaultApprovalLevel as ApprovalLevel,
        requiresExpiryTracking: dt.requiresExpiryTracking,
        defaultRetentionDays: dt.defaultRetentionDays,
        isActive: true,
      },
    });
    console.log(`  ✓ Seeded DocType: [${createdDocType.code}] ${createdDocType.name} (${createdDocType.defaultApprovalLevel})`);
  }

  // ---------------------------------------------------------------------------
  // STEP 6: Create & Verify Single Super Admin Account
  // ---------------------------------------------------------------------------
  console.log("\n6. Creating Single Super Admin Account...");
  const adminEmail = "admin@firstasia.edu.ph";
  const adminPassword = "Password123!";
  const adminFirstName = "System";
  const adminLastName = "Administrator";
  const adminEmployeeId = "EMP-ADMIN-001";

  // Create in Supabase Auth
  const { data: newAdminAuth, error: createAdminErr } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      firstName: adminFirstName,
      lastName: adminLastName,
      role: UserRole.ADMIN,
    },
  });

  if (createAdminErr || !newAdminAuth.user) {
    throw new Error(`Failed to create Super Admin in Supabase Auth: ${createAdminErr?.message}`);
  }

  const adminAuthId = newAdminAuth.user.id;
  console.log(`  ✓ Created Supabase Auth user (UID: ${adminAuthId})`);

  // Create in Prisma Postgres DB
  const createdAdminUser = await prisma.user.create({
    data: {
      id: adminAuthId,
      email: adminEmail,
      firstName: adminFirstName,
      lastName: adminLastName,
      employeeId: adminEmployeeId,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      unitId: null, // Global System Admin
      approvedAt: new Date(),
    },
  });
  console.log(`  ✓ Created & Activated Postgres User Profile for ${createdAdminUser.email}`);

  // Create Audit Log Entry
  await prisma.auditLog.create({
    data: {
      action: AuditAction.USER_APPROVE,
      actorId: adminAuthId,
      targetType: "USER",
      targetId: adminAuthId,
      details: {
        event: "SUPER_ADMIN_SYSTEM_INITIALIZATION",
        email: adminEmail,
        role: UserRole.ADMIN,
        initializedFor: "FINAL_PRODUCTION_DEPLOYMENT",
      },
    },
  });
  console.log("  ✓ Created initial system initialization audit trail log");

  // ---------------------------------------------------------------------------
  // STEP 7: Final Verification Summary
  // ---------------------------------------------------------------------------
  console.log("\n=================================================");
  console.log("🔍 RUNNING FINAL PRODUCTION INTEGRITY VERIFICATION");
  console.log("=================================================");

  const [
    userCount,
    activeAdminCount,
    documentCount,
    versionCount,
    approvalCount,
    unitCount,
    docTypeCount,
    auditCount,
    notifCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE } }),
    prisma.document.count(),
    prisma.documentVersion.count(),
    prisma.approvalAction.count(),
    prisma.unit.count(),
    prisma.documentType.count(),
    prisma.auditLog.count(),
    prisma.notificationQueue.count(),
  ]);

  const { data: finalAuthUsers } = await supabaseAdmin.auth.admin.listUsers();

  console.log(`\nPostgres Database State:`);
  console.log(`- Total Users: ${userCount} (Active Admins: ${activeAdminCount})`);
  console.log(`- Total Documents: ${documentCount}`);
  console.log(`- Total Document Versions: ${versionCount}`);
  console.log(`- Total Approvals: ${approvalCount}`);
  console.log(`- Total Units: ${unitCount}`);
  console.log(`- Total Document Types: ${docTypeCount}`);
  console.log(`- Total Audit Logs: ${auditCount}`);
  console.log(`- Total Notification Queue Items: ${notifCount}`);

  console.log(`\nSupabase Auth State:`);
  console.log(`- Registered Auth Users: ${finalAuthUsers?.users?.length || 0}`);
  finalAuthUsers?.users?.forEach((u) => {
    console.log(`  • ${u.email} [Confirmed: ${u.email_confirmed_at ? "YES" : "NO"}] (ID: ${u.id})`);
  });

  console.log("\n=================================================");
  console.log("✅ PRODUCTION RESET & INITIALIZATION COMPLETE!");
  console.log("=================================================");
  console.log("SUPER ADMIN CREDENTIALS:");
  console.log(`Email:    ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  console.log(`Role:     ADMIN (Verified Active)`);
  console.log(`Name:     ${adminFirstName} ${adminLastName}`);
  console.log("=================================================\n");
}

resetForProduction()
  .catch((e) => {
    console.error("FATAL ERROR during production reset:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
