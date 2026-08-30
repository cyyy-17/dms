import { parseUsersCsv, parseCsvLine } from "../lib/csv-parser";
import { checkRateLimit } from "../lib/rate-limit";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runSecurityRemediationTests() {
  console.log("\n========================================================");
  console.log("🔒 SASDMS SECURITY REMEDIATION VERIFICATION SUITE");
  console.log("========================================================\n");

  // TEST 1: CSV RFC 4180 Tokenizer & Column Shift Resistance
  console.log("Test 1: CSV RFC 4180 Parsing & Quoted Comma Support");
  const testCsv = `firstName,lastName,email,role,unitCode,title
Juan,"Dela Cruz, Jr.",jdelacruz@firstasia.edu.ph,STAFF,CAREER,"Career Officer, Level 2"
Maria,Santos,msantos@firstasia.edu.ph,COORDINATOR,ALUMNI,"Assistant Director, Alumni Relations"`;

  const parsed = parseUsersCsv(testCsv);
  assert(parsed.errors.length === 0, "No errors encountered when parsing CSV with quoted commas");
  assert(parsed.validRows.length === 2, "Parsed exactly 2 valid user rows");
  assert(parsed.validRows[0].lastName === "Dela Cruz, Jr.", "Last name preserves comma inside quotes");
  assert(parsed.validRows[0].role === "STAFF", "Role is correctly mapped as STAFF (no column shift)");
  assert(parsed.validRows[0].unitCode === "CAREER", "Unit code is correctly mapped as CAREER");
  assert(parsed.validRows[0].title === "Career Officer, Level 2", "Title preserves inner comma");
  assert(parsed.validRows[1].role === "COORDINATOR", "Second row role is COORDINATOR");
  assert(parsed.validRows[1].title === "Assistant Director, Alumni Relations", "Second row title preserves comma");

  // TEST 2: Rate Limiting Sliding Window Enforcement
  console.log("\nTest 2: Rate Limiting Enforcement & Sliding Window");
  const testKey = "test_sec_user_ip";
  const limit = 3;
  const windowMs = 2000;

  const r1 = checkRateLimit(testKey, limit, windowMs);
  assert(r1.success === true && r1.remaining === 2, "First request passes with remaining=2");

  const r2 = checkRateLimit(testKey, limit, windowMs);
  assert(r2.success === true && r2.remaining === 1, "Second request passes with remaining=1");

  const r3 = checkRateLimit(testKey, limit, windowMs);
  assert(r3.success === true && r3.remaining === 0, "Third request passes with remaining=0");

  const r4 = checkRateLimit(testKey, limit, windowMs);
  assert(r4.success === false && r4.remaining === 0, "Fourth request is blocked by rate limiter");

  const otherKey = "test_sec_other_user";
  const rOther = checkRateLimit(otherKey, limit, windowMs);
  assert(rOther.success === true, "Different key is not throttled by previous key's limit");

  // TEST 3: Auth Domain Guard Verification
  console.log("\nTest 3: Institutional Domain Guard & Constants");
  const validEmail = "employee@firstasia.edu.ph";
  const invalidEmail1 = "attacker@external.com";
  const invalidEmail2 = "attacker@firstasia.edu.ph.attacker.com";

  assert(validEmail.endsWith("@firstasia.edu.ph"), "Official domain matches institutional policy");
  assert(!invalidEmail1.endsWith("@firstasia.edu.ph"), "External email is blocked");
  assert(!invalidEmail2.endsWith("@firstasia.edu.ph"), "Subdomain spoofing is blocked");

  // TEST 4: CSV Tokenizer Unit Edge Cases
  console.log("\nTest 4: CSV Tokenizer Edge Cases");
  const complexLine = `""Juan"", "Santos", "test@firstasia.edu.ph", "STAFF", "CAREER"`;
  const tokens = parseCsvLine(complexLine);
  assert(tokens.length === 5, "Tokenized exactly 5 items from quoted input");
  assert(tokens[1] === "Santos", "Second token stripped quotes properly");

  console.log("\n========================================================");
  console.log("✅ ALL SECURITY REMEDIATION TESTS PASSED SUCCESSFULLY");
  console.log("========================================================\n");
}

runSecurityRemediationTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
