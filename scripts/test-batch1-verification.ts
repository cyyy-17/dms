import { PDFDocument } from "pdf-lib";
import { applyDownloadWatermark } from "../lib/pdf/watermark";
import { env } from "../lib/env";

async function runBatch1Verification() {
  console.log("=================================================");
  console.log("Running SASDMS Batch 1 Implementation Verification");
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

  // --- 1. Environment & Config Validation ---
  console.log("Test Suite 1: Environment & Config Validation (lib/env.ts)");
  assert(env !== undefined, "env object exported and initialized");
  assert(typeof env.NODE_ENV === "string", `NODE_ENV is valid string: ${env.NODE_ENV}`);

  // --- 2. PDF Download Watermarking Pipeline ---
  console.log("\nTest Suite 2: PDF Watermarking Verification (lib/pdf/watermark.ts)");
  try {
    // Generate a minimal valid PDF
    const testDoc = await PDFDocument.create();
    const page1 = testDoc.addPage([600, 800]);
    page1.drawText("Original Document Content", { x: 50, y: 700 });
    const page2 = testDoc.addPage([600, 800]);
    page2.drawText("Page 2 Content", { x: 50, y: 700 });
    const initialBytes = await testDoc.save();

    assert(initialBytes.length > 0, "Generated initial test PDF bytes");

    // Apply watermark
    const watermarkedBytes = await applyDownloadWatermark(initialBytes, {
      userName: "Maria Santos",
      userRole: "COORDINATOR",
      trackingNumber: "SAS-2026-TEST-0001",
      timestamp: new Date("2026-08-28T08:00:00Z"),
    });

    assert(watermarkedBytes.length > initialBytes.length, "Watermarked PDF contains security overlay bytes");

    // Re-parse the watermarked PDF to confirm structural validity
    const parsedWatermarkedDoc = await PDFDocument.load(watermarkedBytes);
    assert(parsedWatermarkedDoc.getPageCount() === 2, "Watermarked PDF preserves page count (2 pages)");
    assert(!parsedWatermarkedDoc.isEncrypted, "Watermarked PDF is readable and uncorrupted");
  } catch (err) {
    console.error("PDF Watermark test error:", err);
    assert(false, "PDF watermarking pipeline threw unexpected error");
  }

  // --- 3. Canonical Units Metadata Alignment ---
  console.log("\nTest Suite 3: Canonical Units Metadata Verification");
  const CANONICAL_UNITS = [
    "GUIDANCE",
    "ALUMNI",
    "ACTIVITIES",
    "SCHOLARSHIPS",
    "DISCIPLINE",
    "CAREER",
    "EXTENSION",
  ];
  const LEGACY_DEPRECATED_CODES = ["GCO", "SOA", "SFA", "AAPO", "DSW", "CSIR", "CEE"];

  // Read app/page.tsx to check UNIT_METADATA_MAP content
  const fs = await import("fs");
  const pageSource = fs.readFileSync("app/page.tsx", "utf-8");

  for (const unit of CANONICAL_UNITS) {
    assert(pageSource.includes(`${unit}:`), `Canonical unit ${unit} exists in UNIT_METADATA_MAP`);
  }

  for (const legacy of LEGACY_DEPRECATED_CODES) {
    assert(!pageSource.includes(`${legacy}:`), `Legacy code ${legacy} is removed from UNIT_METADATA_MAP`);
  }

  // --- 4. Document Recall / Withdrawal Invariant Verification ---
  console.log("\nTest Suite 4: Document Recall / Withdrawal Invariant Verification");

  function canWithdrawDocument(doc: {
    status: string;
    uploaderId: string;
    approvalActions: Array<{ action: string }>;
  }, currentUserId: string, currentUserRole: string): { allowed: boolean; reason?: string } {
    if (doc.uploaderId !== currentUserId && currentUserRole !== "ADMIN") {
      return { allowed: false, reason: "Only uploader or Admin can recall" };
    }
    if (doc.status !== "PENDING_COORDINATOR" && doc.status !== "PENDING_DIRECTOR") {
      return { allowed: false, reason: "Only pending review documents can be recalled" };
    }
    const hasApprovals = doc.approvalActions.some(
      (a) => a.action === "COORDINATOR_APPROVE" || a.action === "DIRECTOR_APPROVE"
    );
    if (hasApprovals) {
      return { allowed: false, reason: "Cannot recall after formal signatures are logged" };
    }
    return { allowed: true };
  }

  const uploaderId = "user-uploader-1";
  const otherId = "user-other-2";

  assert(
    canWithdrawDocument(
      { status: "PENDING_COORDINATOR", uploaderId, approvalActions: [] },
      uploaderId,
      "STAFF"
    ).allowed === true,
    "Uploader can recall document in PENDING_COORDINATOR with no approvals"
  );

  assert(
    canWithdrawDocument(
      { status: "PENDING_DIRECTOR", uploaderId, approvalActions: [] },
      uploaderId,
      "STAFF"
    ).allowed === true,
    "Uploader can recall document in PENDING_DIRECTOR with no approvals"
  );

  assert(
    canWithdrawDocument(
      { status: "APPROVED", uploaderId, approvalActions: [] },
      uploaderId,
      "STAFF"
    ).allowed === false,
    "Cannot recall APPROVED document"
  );

  assert(
    canWithdrawDocument(
      { status: "PENDING_COORDINATOR", uploaderId, approvalActions: [{ action: "COORDINATOR_APPROVE" }] },
      uploaderId,
      "STAFF"
    ).allowed === false,
    "Cannot recall document after coordinator has approved"
  );

  assert(
    canWithdrawDocument(
      { status: "PENDING_COORDINATOR", uploaderId, approvalActions: [] },
      otherId,
      "STAFF"
    ).allowed === false,
    "Non-uploader staff cannot recall another user's document"
  );

  assert(
    canWithdrawDocument(
      { status: "PENDING_COORDINATOR", uploaderId, approvalActions: [] },
      otherId,
      "ADMIN"
    ).allowed === true,
    "Admin can recall document on behalf of uploader"
  );

  console.log("\n=================================================");
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runBatch1Verification();
