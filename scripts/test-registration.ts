import "dotenv/config";
import { prisma } from "../lib/prisma";
import { registerEmployee } from "../actions/auth";

async function test() {
  const units = await prisma.unit.findMany();
  console.log("Units found in DB:", units.map((u) => ({ id: u.id, code: u.code, name: u.name })));

  if (units.length === 0) {
    console.error("No units found in DB!");
    return;
  }

  const res = await registerEmployee({
    firstName: "Mary Joy",
    lastName: "Clemente",
    email: "mclemente08@firstasia.edu.ph",
    employeeId: "EMP-2026-081",
    unitId: units[0].id,
    password: "Password123!",
  });

  console.log("Registration result:", res);
}

test().catch(console.error);
