import "dotenv/config";
import { prisma } from "../lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";

async function makeAdmin() {
  const email = "mclemente@firstasia.edu.ph";

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User ${email} not found in database.`);
    return;
  }

  const updated = await prisma.user.update({
    where: { email },
    data: {
      status: UserStatus.ACTIVE,
      role: UserRole.ADMIN,
      approvedAt: new Date(),
    },
    include: { unit: true },
  });

  console.log("✓ User successfully approved and elevated to ADMIN:");
  console.log({
    id: updated.id,
    name: `${updated.firstName} ${updated.lastName}`,
    email: updated.email,
    role: updated.role,
    status: updated.status,
    unit: updated.unit?.name,
    approvedAt: updated.approvedAt,
  });
}

makeAdmin().catch(console.error);
