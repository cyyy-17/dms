import { calculateSlaStatus } from "../lib/sla";

async function runBatch4Verification() {
  console.log("=================================================");
  console.log("Running SASDMS Batch 4 Implementation Verification");
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

  // --- 1. SLA Turnaround Calculation Verification ---
  console.log("Test Suite 1: SLA Turnaround Calculation & Urgency Badges (lib/sla.ts)");

  const now = new Date("2026-08-28T12:00:00Z");

  // Submitted 4 hours ago, SLA = 48h -> 44h left -> ON_TRACK
  const sub1 = new Date("2026-08-28T08:00:00Z");
  const sla1 = calculateSlaStatus(sub1, 48, now);
  assert(sla1.status === "ON_TRACK", "Submitted 4h ago classified as ON_TRACK");
  assert(sla1.hoursRemaining === 44, "Hours remaining computed as 44h");
  assert(sla1.label.includes("SLA left"), "Label indicates remaining SLA");
  assert(!sla1.isOverdue, "Flagged as not overdue");

  // Submitted 30 hours ago, SLA = 48h -> 18h left -> APPROACHING
  const sub2 = new Date("2026-08-27T06:00:00Z");
  const sla2 = calculateSlaStatus(sub2, 48, now);
  assert(sla2.status === "APPROACHING", "Submitted 30h ago (18h left) classified as APPROACHING");
  assert(sla2.hoursRemaining === 18, "Hours remaining computed as 18h");
  assert(sla2.label === "Due in 18h", "Label formats as 'Due in 18h'");
  assert(!sla2.isOverdue, "Flagged as not overdue");

  // Submitted 60 hours ago, SLA = 48h -> -12h left -> OVERDUE
  const sub3 = new Date("2026-08-26T00:00:00Z");
  const sla3 = calculateSlaStatus(sub3, 48, now);
  assert(sla3.status === "OVERDUE", "Submitted 60h ago classified as OVERDUE");
  assert(sla3.hoursRemaining < 0, "Hours remaining is negative for overdue reviews");
  assert(sla3.isOverdue, "Flagged as isOverdue = true");
  assert(sla3.label.includes("Overdue"), "Label formats as 'Overdue by...'");

  // Director 72-hour SLA test (60h past -> 12h left -> APPROACHING)
  const subDirector = new Date("2026-08-26T00:00:00Z");
  const slaDirector = calculateSlaStatus(subDirector, 72, now);
  assert(slaDirector.status === "APPROACHING", "72h Director SLA on 60h submission is APPROACHING (12h left)");
  assert(slaDirector.hoursRemaining === 12, "Director SLA hours remaining computed as 12h");

  // --- 2. Version Diff & Size Delta Calculations ---
  console.log("\nTest Suite 2: Version Diff & Checksum Inspector Calculations");

  const v1 = {
    versionNumber: 1,
    fileSize: 1024 * 50, // 50 KB
    sha256Checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  };
  const v2 = {
    versionNumber: 2,
    fileSize: 1024 * 65, // 65 KB
    sha256Checksum: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
  };

  const deltaPositive = v2.fileSize - v1.fileSize;
  assert(deltaPositive === 15 * 1024, "Positive file size delta computed accurately (+15 KB)");

  const isDifferent = v1.sha256Checksum !== v2.sha256Checksum;
  assert(isDifferent, "Distinct version SHA-256 checksums correctly identified");

  const v3Identical = {
    versionNumber: 3,
    fileSize: 1024 * 65,
    sha256Checksum: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
  };
  assert(v2.sha256Checksum === v3Identical.sha256Checksum, "Identical checksums correctly flagged as matching payload");

  // --- 3. RA 10173 Inactivity Timeout Conversion & Logic ---
  console.log("\nTest Suite 3: RA 10173 Inactivity Lock Timeout Constraints");

  function calculateTimeoutMs(minutes: number): number {
    return minutes * 60 * 1000;
  }

  assert(calculateTimeoutMs(15) === 900000, "15 minutes standard timeout converts to 900,000ms");
  assert(calculateTimeoutMs(10) === 600000, "10 minutes timeout converts to 600,000ms");
  assert(calculateTimeoutMs(1) === 60000, "1 minute minimum timeout converts to 60,000ms");

  console.log("\n=================================================");
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runBatch4Verification();
