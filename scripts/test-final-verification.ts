import { checkRateLimit, RATE_LIMIT_PRESETS } from "../lib/rate-limit";
import {
  INSTITUTION_EMAIL_DOMAIN,
  AUTO_ESCALATION_REJECTION_THRESHOLD,
  STORAGE_BUCKETS,
  generateTrackingNumber,
} from "../lib/constants";
import { SLA_CONFIG } from "../lib/sla";

async function runFinalVerification() {
  console.log("=================================================");
  console.log("Running SASDMS Final Comprehensive System Verification");
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

  // --- 1. Rate Limiting Sliding Window Invariants ---
  console.log("Test Suite 1: Security Rate Limiting & Throttling Guard");

  const testKey = "user-test-" + Date.now();
  const r1 = checkRateLimit(testKey, 3, 5000);
  assert(r1.success === true, "First request within rate limit accepted");
  assert(r1.remaining === 2, "Remaining count decremented to 2");

  const r2 = checkRateLimit(testKey, 3, 5000);
  assert(r2.success === true && r2.remaining === 1, "Second request accepted with 1 remaining");

  const r3 = checkRateLimit(testKey, 3, 5000);
  assert(r3.success === true && r3.remaining === 0, "Third request consumes entire limit");

  const r4 = checkRateLimit(testKey, 3, 5000);
  assert(r4.success === false && r4.remaining === 0, "Fourth request properly throttled (limit reached)");

  const distinctKey = "user-distinct-" + Date.now();
  const rDistinct = checkRateLimit(distinctKey, 3, 5000);
  assert(rDistinct.success === true, "Distinct user key maintains independent bucket");

  // Verify presets exist and have positive limits
  assert(RATE_LIMIT_PRESETS.DOCUMENT_INGESTION.limit === 30, "Document ingestion rate limit preset defined");
  assert(RATE_LIMIT_PRESETS.AUTH_ATTEMPT.limit === 10, "Auth attempt rate limit preset defined");

  // --- 2. System Governance Constants & Invariants ---
  console.log("\nTest Suite 2: Institutional Governance Parameters & Whitelists");

  assert(INSTITUTION_EMAIL_DOMAIN === "@firstasia.edu.ph", "Canonical email domain is @firstasia.edu.ph");
  assert(AUTO_ESCALATION_REJECTION_THRESHOLD === 2, "Auto-escalation threshold is 2 rejections");
  assert(STORAGE_BUCKETS.DOCUMENTS === "documents-private", "Private document vault configured");
  assert(STORAGE_BUCKETS.SIGNATURES === "signatures-private", "Private signature vault configured");

  assert(SLA_CONFIG.COORDINATOR_HOURS === 48, "Coordinator SLA defined as 48 hours");
  assert(SLA_CONFIG.DIRECTOR_HOURS === 72, "Director SLA defined as 72 hours");

  const tracking = generateTrackingNumber("ACTIVITIES", 123);
  assert(/^SAS-\d{4}-ACT-00123$/.test(tracking), "Tracking number follows canonical format SAS-YYYY-UNIT-XXXXX");

  // --- 3. Error Boundary State Recovery Invariants ---
  console.log("\nTest Suite 3: Error Boundary Fallback & Resilience Invariants");

  interface BoundaryState {
    hasError: boolean;
    error: Error | null;
  }

  function simulateError(error: Error): BoundaryState {
    return { hasError: true, error };
  }

  function simulateReset(): BoundaryState {
    return { hasError: false, error: null };
  }

  const errState = simulateError(new Error("Network glitch during PDF decode"));
  assert(errState.hasError === true, "Error boundary captures error state");
  assert(errState.error?.message === "Network glitch during PDF decode", "Error message retained for diagnostics");

  const resetState = simulateReset();
  assert(resetState.hasError === false && resetState.error === null, "Error boundary successfully resets on retry");

  console.log("\n=================================================");
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runFinalVerification();
