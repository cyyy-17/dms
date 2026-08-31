import "dotenv/config";
import {
  isValidInstitutionalEmail,
  generateTrackingNumber,
  INSTITUTION_EMAIL_DOMAIN,
  AUTO_ESCALATION_REJECTION_THRESHOLD,
  getAppBaseUrl,
} from "../lib/constants";
import { checkRateLimit } from "../lib/rate-limit";
import { parseUsersCsv } from "../lib/csv-parser";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✓ ${description}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    failedCount++;
  }
}

async function runSystemVerification() {
  console.log("\n========================================================");
  console.log("🔒 SASDMS CORE SYSTEM & SECURITY VERIFICATION SUITE");
  console.log("========================================================\n");

  // 1. Institutional Email Security & Governance
  console.log("Test Suite 1: Institutional Governance & Domain Rules");
  assert(INSTITUTION_EMAIL_DOMAIN === "@firstasia.edu.ph", "Canonical email domain is @firstasia.edu.ph");
  assert(isValidInstitutionalEmail("mclemente@firstasia.edu.ph"), "Official @firstasia.edu.ph accepted");
  assert(!isValidInstitutionalEmail("user@gmail.com"), "External gmail rejected");
  assert(!isValidInstitutionalEmail("attacker@firstasia.edu.ph.fake.com"), "Subdomain spoofing rejected");
  assert(AUTO_ESCALATION_REJECTION_THRESHOLD === 2, "Auto-escalation threshold configured as 2 rejections");

  // 2. Tracking Number & Base URL Resolution
  console.log("\nTest Suite 2: Tracking Numbers & Dynamic URL Resolution");
  const trackingNumber = generateTrackingNumber("CAREER", 42);
  assert(trackingNumber.startsWith(`SAS-${new Date().getFullYear()}-CAR-00042`), "Tracking number follows canonical format");
  assert(getAppBaseUrl("dms-drab.vercel.app", true) === "https://dms-drab.vercel.app", "Dynamic SSL Vercel URL resolved");
  assert(getAppBaseUrl("localhost:3000", false).includes("localhost:3000") || getAppBaseUrl().length > 0, "Base URL fallback active");

  // 3. Security Rate Limiting
  console.log("\nTest Suite 3: Security Rate Limiting (Sliding Window)");
  const testKey = `test-rl-${Date.now()}`;
  const rl1 = checkRateLimit(testKey, 2, 60000);
  assert(rl1.success && rl1.remaining === 1, "First request passes with remaining quota");
  const rl2 = checkRateLimit(testKey, 2, 60000);
  assert(rl2.success && rl2.remaining === 0, "Second request consumes quota");
  const rl3 = checkRateLimit(testKey, 2, 60000);
  assert(!rl3.success, "Third request is correctly throttled");

  // 4. CSV RFC 4180 Ingestion Parser
  console.log("\nTest Suite 4: Institutional CSV User Ingestion");
  const sampleCsv = `firstName,lastName,email,role,unitCode,title
Juan,"Dela Cruz, Jr.",jdelacruz@firstasia.edu.ph,COORDINATOR,CAREER,"Career Placement, Head"`;
  const parsed = parseUsersCsv(sampleCsv);
  assert(parsed.validRows.length === 1, "Parsed exactly 1 valid CSV record");
  if (parsed.validRows.length > 0) {
    assert(parsed.validRows[0].lastName === "Dela Cruz, Jr.", "Quoted comma inside last name preserved");
    assert(parsed.validRows[0].title === "Career Placement, Head", "Quoted comma inside title preserved");
    assert(parsed.validRows[0].role === "COORDINATOR", "Role mapped properly");
  }

  console.log("\n========================================================");
  console.log(`Results: ${passedCount} passed, ${failedCount} failed.`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSystemVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
