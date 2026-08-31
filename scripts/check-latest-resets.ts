import "dotenv/config";
import { prisma } from "../lib/prisma";

async function checkLatestResets() {
  console.log("=== Checking User Record ===");
  const user = await prisma.user.findUnique({
    where: { email: "cpm.061798@gmail.com" },
  });
  console.log("User in Prisma:", user ? { id: user.id, email: user.email, status: user.status, role: user.role } : "NOT FOUND");

  console.log("\n=== Latest NotificationQueue entries ===");
  const notifications = await prisma.notificationQueue.findMany({
    where: { recipientEmail: "cpm.061798@gmail.com" },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  console.log(`Found ${notifications.length} notification queue entries:`);
  notifications.forEach((n) => {
    console.log(`- ID: ${n.id} | Status: ${n.status} | Template: ${n.templateName} | CreatedAt: ${n.createdAt.toISOString()} | Error: ${n.lastError}`);
  });

  console.log("\n=== Latest Audit Logs ===");
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  console.log(`Found ${auditLogs.length} audit logs:`);
  auditLogs.forEach((a) => {
    console.log(`- Action: ${a.action} | Target: ${a.targetType} (${a.targetId}) | Time: ${a.createdAt.toISOString()} | Details:`, a.details);
  });
}

checkLatestResets().catch(console.error).finally(() => prisma.$disconnect());
