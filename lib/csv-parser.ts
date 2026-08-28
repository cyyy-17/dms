import { INSTITUTION_EMAIL_DOMAIN } from "@/lib/constants";
import { UserRole } from "@prisma/client";

export interface BulkUserRow {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  title?: string;
  email: string;
  employeeId?: string;
  role: UserRole;
  unitCode: string;
  password?: string;
}

export interface ParseResult {
  validRows: BulkUserRow[];
  errors: Array<{ row: number; email?: string; message: string }>;
}

/**
 * Parses and validates CSV string for bulk user creation.
 * Supported headers: firstName, lastName, email, role, unitCode, middleName, suffix, title, employeeId, password
 */
export function parseUsersCsv(csvContent: string): ParseResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { validRows: [], errors: [{ row: 0, message: "CSV file is empty." }] };
  }

  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());

  const getCol = (hName: string) => headers.indexOf(hName.toLowerCase());

  const fnIdx = getCol("firstname");
  const lnIdx = getCol("lastname");
  const emailIdx = getCol("email");
  const roleIdx = getCol("role");
  const unitIdx = getCol("unitcode") !== -1 ? getCol("unitcode") : getCol("unit");

  const mnIdx = getCol("middlename");
  const sfxIdx = getCol("suffix");
  const titleIdx = getCol("title");
  const empIdx = getCol("employeeid");
  const pwdIdx = getCol("password");

  const errors: Array<{ row: number; email?: string; message: string }> = [];
  const validRows: BulkUserRow[] = [];

  if (fnIdx === -1 || lnIdx === -1 || emailIdx === -1 || roleIdx === -1 || unitIdx === -1) {
    return {
      validRows: [],
      errors: [
        {
          row: 1,
          message:
            "Missing required CSV column headers. Required: firstName, lastName, email, role, unitCode",
        },
      ],
    };
  }

  const validRoles = ["STAFF", "COORDINATOR", "DIRECTOR", "ADMIN"];

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1;
    const row = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));

    if (row.length === 0 || row.every((c) => c === "")) continue;

    const firstName = row[fnIdx] || "";
    const lastName = row[lnIdx] || "";
    const email = (row[emailIdx] || "").toLowerCase();
    const rawRole = (row[roleIdx] || "").toUpperCase();
    const unitCode = (row[unitIdx] || "").toUpperCase();

    if (!firstName || !lastName) {
      errors.push({ row: rowNumber, email, message: "First name and last name are required." });
      continue;
    }

    if (!email || !email.endsWith(INSTITUTION_EMAIL_DOMAIN)) {
      errors.push({
        row: rowNumber,
        email,
        message: `Email must belong to official institutional domain (${INSTITUTION_EMAIL_DOMAIN}).`,
      });
      continue;
    }

    if (!validRoles.includes(rawRole)) {
      errors.push({
        row: rowNumber,
        email,
        message: `Invalid role '${rawRole}'. Must be one of: STAFF, COORDINATOR, DIRECTOR, ADMIN.`,
      });
      continue;
    }

    if (!unitCode) {
      errors.push({ row: rowNumber, email, message: "Department unit code is required." });
      continue;
    }

    validRows.push({
      firstName,
      middleName: mnIdx !== -1 ? row[mnIdx] || undefined : undefined,
      lastName,
      suffix: sfxIdx !== -1 ? row[sfxIdx] || undefined : undefined,
      title: titleIdx !== -1 ? row[titleIdx] || undefined : undefined,
      email,
      employeeId: empIdx !== -1 ? row[empIdx] || undefined : undefined,
      role: rawRole as UserRole,
      unitCode,
      password: pwdIdx !== -1 ? row[pwdIdx] || undefined : undefined,
    });
  }

  return { validRows, errors };
}

/**
 * Generates sample CSV template content for download.
 */
export function getSampleUsersCsvTemplate(): string {
  return `firstName,lastName,email,role,unitCode,employeeId,title
Juan,Dela Cruz,jdelacruz@firstasia.edu.ph,STAFF,CAREER,EMP-2026-001,Career Officer
Maria,Santos,msantos@firstasia.edu.ph,COORDINATOR,ALUMNI,EMP-2026-002,Alumni Affairs Coordinator
Roberto,Tan,rtan@firstasia.edu.ph,STAFF,SCHOLARSHIPS,EMP-2026-003,Scholarship Specialist`;
}
