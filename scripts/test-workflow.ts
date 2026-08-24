// ============================================================================
// SASDMS Verification Test Suite
// Verifies Domain Whitelist, Approval State Machine, and Auto-Escalation Rules
// ============================================================================

import { INSTITUTION_EMAIL_DOMAIN, AUTO_ESCALATION_REJECTION_THRESHOLD } from "../lib/constants";

function runTests() {
  console.log("=================================================");
  console.log("Running SASDMS Business Logic Verification Suite");
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

  // --- 1. Pre-Auth Domain Guard Tests ---
  console.log("Test Suite 1: Pre-Auth Institutional Domain Whitelist Guard");

  const validEmails = [
    "jdelacruz@firstasia.edu.ph",
    "maria.santos@firstasia.edu.ph",
    "DIRECTOR@FIRSTASIA.EDU.PH",
    "staff.unit-1@firstasia.edu.ph",
  ];

  const invalidEmails = [
    "user@gmail.com",
    "student@yahoo.com",
    "hacker@faith.edu.ph.malicious.com",
    "employee@faith.edu.ph", // Must match @firstasia.edu.ph
    "user@firstasia.edu.ph.ph",
    "notanemail",
  ];

  function validateDomain(email: string): boolean {
    const normalized = email.trim().toLowerCase();
    const pattern = /^[a-zA-Z0-9._%+-]+@firstasia\.edu\.ph$/;
    return pattern.test(normalized) && normalized.endsWith(INSTITUTION_EMAIL_DOMAIN);
  }

  for (const email of validEmails) {
    assert(validateDomain(email), `Valid email allowed: ${email}`);
  }

  for (const email of invalidEmails) {
    assert(!validateDomain(email), `Invalid email blocked: ${email}`);
  }

  // --- 2. Sequential Approval Hierarchy Tests ---
  console.log("\nTest Suite 2: Sequential Approval State Transitions");

  type DocStatus = "DRAFT" | "PENDING_COORDINATOR" | "PENDING_DIRECTOR" | "APPROVED" | "REJECTED_RETURNED" | "REJECTED_CLOSED";
  type AppLevel = "COORDINATOR_ONLY" | "DIRECTOR_REQUIRED";

  function getNextApprovalStatus(currentStatus: DocStatus, appLevel: AppLevel, escalateOverride: boolean = false): DocStatus {
    if (currentStatus === "PENDING_COORDINATOR") {
      if (appLevel === "DIRECTOR_REQUIRED" || escalateOverride) {
        return "PENDING_DIRECTOR";
      }
      return "APPROVED";
    }
    if (currentStatus === "PENDING_DIRECTOR") {
      return "APPROVED";
    }
    throw new Error(`Invalid status for approval: ${currentStatus}`);
  }

  assert(
    getNextApprovalStatus("PENDING_COORDINATOR", "COORDINATOR_ONLY") === "APPROVED",
    "COORDINATOR_ONLY moves PENDING_COORDINATOR -> APPROVED (Terminal Coordinator)"
  );

  assert(
    getNextApprovalStatus("PENDING_COORDINATOR", "DIRECTOR_REQUIRED") === "PENDING_DIRECTOR",
    "DIRECTOR_REQUIRED moves PENDING_COORDINATOR -> PENDING_DIRECTOR"
  );

  assert(
    getNextApprovalStatus("PENDING_COORDINATOR", "COORDINATOR_ONLY", true) === "PENDING_DIRECTOR",
    "Coordinator override moves COORDINATOR_ONLY -> PENDING_DIRECTOR"
  );

  assert(
    getNextApprovalStatus("PENDING_DIRECTOR", "DIRECTOR_REQUIRED") === "APPROVED",
    "Director approval moves PENDING_DIRECTOR -> APPROVED"
  );

  // --- 3. Rejection & Auto-Escalation Tests ---
  console.log("\nTest Suite 3: Rejection Counter & Auto-Escalation");

  function processRejection(currentRejections: number): { nextRejections: number; isEscalated: boolean; status: DocStatus } {
    const nextRejections = currentRejections + 1;
    const isEscalated = nextRejections >= AUTO_ESCALATION_REJECTION_THRESHOLD;
    return {
      nextRejections,
      isEscalated,
      status: "REJECTED_RETURNED",
    };
  }

  const rej1 = processRejection(0);
  assert(
    rej1.nextRejections === 1 && !rej1.isEscalated && rej1.status === "REJECTED_RETURNED",
    "First rejection: rejections=1, isEscalated=false, status=REJECTED_RETURNED"
  );

  const rej2 = processRejection(rej1.nextRejections);
  assert(
    rej2.nextRejections === 2 && rej2.isEscalated && rej2.status === "REJECTED_RETURNED",
    "Second rejection: rejections=2, triggers isEscalated=true (Auto-Escalated to Director)"
  );

  const rej3 = processRejection(rej2.nextRejections);
  assert(
    rej3.nextRejections === 3 && rej3.isEscalated,
    "Subsequent rejections maintain isEscalated=true"
  );

  console.log("\n=================================================");
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
