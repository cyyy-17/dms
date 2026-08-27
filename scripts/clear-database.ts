import "dotenv/config";
import { prisma } from "../lib/prisma";

async function clearDatabase() {
  console.log("=================================================");
  console.log("Starting SASDMS Database Cleanup...");
  console.log("Target: Clear units, non-admin users, doc types, and documents.");
  console.log("Preserving exclusively: admin@firstasia.edu.ph");
  console.log("=================================================");

  // 1. Check if admin@firstasia.edu.ph exists
  let adminUser = await prisma.user.findUnique({
    where: { email: "admin@firstasia.edu.ph" },
  });

  if (!adminUser) {
    console.log("admin@firstasia.edu.ph not found in database. Creating base administrator account...");
    // Let's create it with a standard UUID
    const crypto = await import("crypto");
    const adminId = crypto.randomUUID();
    adminUser = await prisma.user.create({
      data: {
        id: adminId,
        email: "admin@firstasia.edu.ph",
        firstName: "System",
        lastName: "Administrator",
        role: "ADMIN",
        status: "ACTIVE",
        unitId: null,
      },
    });
    console.log(`Created admin user with ID: ${adminUser.id}`);
  } else {
    console.log(`Found existing admin user (${adminUser.email}, ID: ${adminUser.id}). Setting unitId & approvedById to null...`);
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        unitId: null,
        approvedById: null,
        status: "ACTIVE",
        role: "ADMIN",
      },
    });
  }

  // 2. Clear Audit Logs & Notifications
  console.log("Clearing audit logs & notification queues...");
  const deletedAudit = await prisma.auditLog.deleteMany({});
  const deletedNotifs = await prisma.notificationQueue.deleteMany({});
  console.log(`Deleted ${deletedAudit.count} audit logs, ${deletedNotifs.count} notifications.`);

  // 3. Clear Delegations & Approval Actions
  console.log("Clearing delegate signatories & approval actions...");
  const deletedDelegates = await prisma.delegateSignatory.deleteMany({});
  const deletedApprovals = await prisma.approvalAction.deleteMany({});
  console.log(`Deleted ${deletedDelegates.count} delegations, ${deletedApprovals.count} approval actions.`);

  // 4. Break circular references in Documents & DocumentVersions
  console.log("Clearing document active version & signatory pointers...");
  await prisma.document.updateMany({
    data: {
      currentVersionId: null,
      currentSignatoryId: null,
    },
  });

  // 5. Delete Document Versions & Documents
  console.log("Deleting document versions & documents...");
  const deletedVersions = await prisma.documentVersion.deleteMany({});
  const deletedDocuments = await prisma.document.deleteMany({});
  console.log(`Deleted ${deletedVersions.count} versions, ${deletedDocuments.count} documents.`);

  // 6. Delete Document Types
  console.log("Deleting document types...");
  const deletedDocTypes = await prisma.documentType.deleteMany({});
  console.log(`Deleted ${deletedDocTypes.count} document types.`);

  // 7. Delete all users EXCEPT admin@firstasia.edu.ph
  console.log("Deleting all users except admin@firstasia.edu.ph...");
  // Clear any approvedById references to other users first
  await prisma.user.updateMany({
    data: {
      approvedById: null,
      unitId: null,
    },
  });

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: {
        not: "admin@firstasia.edu.ph",
      },
    },
  });
  console.log(`Deleted ${deletedUsers.count} non-admin users.`);

  // 8. Delete all Units
  console.log("Deleting all units...");
  const deletedUnits = await prisma.unit.deleteMany({});
  console.log(`Deleted ${deletedUnits.count} units.`);

  // 9. Final Verification
  const remainingUnits = await prisma.unit.count();
  const remainingDocTypes = await prisma.documentType.count();
  const remainingDocuments = await prisma.document.count();
  const remainingVersions = await prisma.documentVersion.count();
  const remainingUsers = await prisma.user.findMany({ select: { id: true, email: true, role: true, status: true } });

  console.log("=================================================");
  console.log("Cleanup Verification Results:");
  console.log(`- Units remaining: ${remainingUnits}`);
  console.log(`- Document Types remaining: ${remainingDocTypes}`);
  console.log(`- Documents remaining: ${remainingDocuments}`);
  console.log(`- Document Versions remaining: ${remainingVersions}`);
  console.log(`- Users remaining (${remainingUsers.length}):`, remainingUsers);
  console.log("=================================================");

  if (
    remainingUnits === 0 &&
    remainingDocTypes === 0 &&
    remainingDocuments === 0 &&
    remainingVersions === 0 &&
    remainingUsers.length === 1 &&
    remainingUsers[0].email === "admin@firstasia.edu.ph"
  ) {
    console.log("✓ SUCCESS: Database successfully reset to clean state with admin@firstasia.edu.ph preserved.");
  } else {
    console.warn("⚠️ Discrepancy detected in cleanup counts.");
  }
}

clearDatabase()
  .catch((e) => {
    console.error("Cleanup error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
