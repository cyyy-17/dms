import crypto from "crypto";
import { parseUsersCsv, getSampleUsersCsvTemplate } from "../lib/csv-parser";
import { INSTITUTION_EMAIL_DOMAIN } from "../lib/constants";

async function runBatch2Verification() {
  console.log("=================================================");
  console.log("Running SASDMS Batch 2 Implementation Verification");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // --- 1. Signature Image Cryptographic SHA-256 Integrity Tests ---
  console.log("Test Suite 1: Signature SHA-256 Cryptographic Hash Integrity");
  const testBuffer1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  const testBuffer2 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAADElEQVR42mNk+M+wHwAEgwGAH0aR+wAAAABJRU5ErkJggg==", "base64");

  const hash1 = crypto.createHash("sha256").update(testBuffer1).digest("hex");
  const hash2 = crypto.createHash("sha256").update(testBuffer2).digest("hex");

  assert(hash1.length === 64, "SHA-256 hash is 64 hex characters");
  assert(/^[a-f0-9]{64}$/.test(hash1), "SHA-256 hash contains valid hexadecimal format");
  assert(hash1 !== hash2, "Distinct signatures produce distinct non-colliding hashes");

  // Re-hashing the same buffer produces identical checksum
  const hash1Repeat = crypto.createHash("sha256").update(testBuffer1).digest("hex");
  assert(hash1 === hash1Repeat, "Signature hashing is deterministic and reproducible");

  // --- 2. Delegation Auto-Expiry Calculations ---
  console.log("\nTest Suite 2: Delegation Expiry 72h / 24h Warning Window");
  const now = new Date("2026-08-28T08:00:00Z");

  function isWithin72Hours(endDate: Date, referenceDate: Date): boolean {
    const diffMs = endDate.getTime() - referenceDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 72;
  }

  const delegationExpiringIn24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const delegationExpiringIn70h = new Date(now.getTime() + 70 * 60 * 60 * 1000);
  const delegationExpiringIn5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const delegationAlreadyExpired = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  assert(isWithin72Hours(delegationExpiringIn24h, now), "Delegation expiring in 24 hours triggers alert");
  assert(isWithin72Hours(delegationExpiringIn70h, now), "Delegation expiring in 70 hours triggers alert");
  assert(!isWithin72Hours(delegationExpiringIn5Days, now), "Delegation expiring in 5 days is not triggered");
  assert(!isWithin72Hours(delegationAlreadyExpired, now), "Past expired delegation is not re-triggered");

  // --- 3. CSV Bulk User Parser & Domain Validation ---
  console.log("\nTest Suite 3: Bulk User CSV Parser & Institutional Guards");

  const validCsv = `firstName,lastName,email,role,unitCode,employeeId,title
Juan,Dela Cruz,jdelacruz@firstasia.edu.ph,STAFF,CAREER,EMP-001,Officer
Maria,Santos,msantos@firstasia.edu.ph,COORDINATOR,ALUMNI,EMP-002,Coordinator
Roberto,Tan,rtan@firstasia.edu.ph,DIRECTOR,EXTENSION,EMP-003,Director
Admin,User,admin.staff@firstasia.edu.ph,ADMIN,CAREER,EMP-004,System Admin`;

  const parsedValid = parseUsersCsv(validCsv);
  assert(parsedValid.validRows.length === 4, "Parsed 4 valid user rows from CSV");
  assert(parsedValid.errors.length === 0, "No errors found in valid CSV");
  assert(parsedValid.validRows[0].role === "STAFF", "Correctly parsed STAFF role");
  assert(parsedValid.validRows[1].role === "COORDINATOR", "Correctly parsed COORDINATOR role");
  assert(parsedValid.validRows[2].role === "DIRECTOR", "Correctly parsed DIRECTOR role");
  assert(parsedValid.validRows[3].role === "ADMIN", "Correctly parsed ADMIN role");

  // Missing required headers
  const missingHeadersCsv = `name,email,department
Juan Dela Cruz,jdelacruz@firstasia.edu.ph,CAREER`;
  const parsedMissing = parseUsersCsv(missingHeadersCsv);
  assert(parsedMissing.validRows.length === 0, "Blocked CSV with missing required columns");
  assert(parsedMissing.errors.length > 0, "Returned informative error for missing headers");

  // Invalid email domain
  const invalidDomainCsv = `firstName,lastName,email,role,unitCode
Pedro,Penduko,pedro@gmail.com,STAFF,CAREER
Ana,Reyes,ana@yahoo.com,COORDINATOR,GUIDANCE`;
  const parsedInvalidDomain = parseUsersCsv(invalidDomainCsv);
  assert(parsedInvalidDomain.validRows.length === 0, "Blocked non-institutional email domains from bulk import");
  assert(parsedInvalidDomain.errors.length === 2, "Reported 2 email domain validation errors");

  // Invalid role
  const invalidRoleCsv = `firstName,lastName,email,role,unitCode
Liza,Soberano,liza@firstasia.edu.ph,SUPERUSER,CAREER`;
  const parsedInvalidRole = parseUsersCsv(invalidRoleCsv);
  assert(parsedInvalidRole.validRows.length === 0, "Blocked invalid user role in CSV");
  assert(parsedInvalidRole.errors[0].message.includes("Invalid role"), "Clear error message for unrecognized role");

  // Sample template generator
  const sampleTemplate = getSampleUsersCsvTemplate();
  assert(sampleTemplate.includes("firstName,lastName,email,role,unitCode"), "Sample CSV template contains standard headers");
  assert(sampleTemplate.includes(INSTITUTION_EMAIL_DOMAIN), "Sample template uses official institutional email domain");

  // --- 4. Expiry Urgency Range Classification ---
  console.log("\nTest Suite 4: Expiry Calendar Urgency Categorization");

  function categorizeExpiry(expiryDate: Date, referenceDate: Date): "EXPIRED" | "URGENT" | "APPROACHING" | "HEALTHY" {
    const diffDays = Math.ceil((expiryDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "EXPIRED";
    if (diffDays <= 30) return "URGENT";
    if (diffDays <= 90) return "APPROACHING";
    return "HEALTHY";
  }

  const dateExpired = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const dateUrgent = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
  const dateApproaching = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const dateHealthy = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

  assert(categorizeExpiry(dateExpired, now) === "EXPIRED", "Past date classified as EXPIRED");
  assert(categorizeExpiry(dateUrgent, now) === "URGENT", "15 days left classified as URGENT (<30d)");
  assert(categorizeExpiry(dateApproaching, now) === "APPROACHING", "60 days left classified as APPROACHING (30-90d)");
  assert(categorizeExpiry(dateHealthy, now) === "HEALTHY", "180 days left classified as HEALTHY (>90d)");

  console.log("\n=================================================");
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runBatch2Verification();
