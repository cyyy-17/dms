import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "mclemente08@firstasia.edu.ph" },
    include: { unit: true },
  });

  console.log("✓ Prisma query via pg.Pool + adapter successful:", user);
}

main().catch(console.error);
