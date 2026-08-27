import { PDFDocument, StandardFonts } from "pdf-lib";
import { stampPdfWithSignature, detectSignatoryCoordinatesInPdf } from "../lib/pdf/stamper";

async function runSmartAnchorTests() {
  console.log("=================================================");
  console.log("Running SASDMS Smart Anchor & Precision Stamping Tests");
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

  // 1. Create a 2-page test PDF where Page 1 has the institutional table and Page 2 is blank (matching user's case!)
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1: Content page with approvals table
  const page1 = pdfDoc.addPage([612, 792]);
  page1.drawText("FAITH COLLEGES - STUDENT AND ALUMNI SERVICES", { x: 50, y: 740, size: 14, font: fontBold });
  page1.drawText("Program/Activity Title: DORM MONTHLY MEETING", { x: 50, y: 700, size: 11, font: fontBold });

  // Table section: simulate fragmented text chunks
  // Approved row
  page1.drawText("Approved:", { x: 230, y: 550, size: 10, font: fontBold });
  page1.drawText("EMMANUEL", { x: 350, y: 550, size: 10, font: fontBold });
  page1.drawText("S.", { x: 420, y: 550, size: 10, font: fontBold });
  page1.drawText("SATOR", { x: 435, y: 550, size: 10, font: fontBold });
  page1.drawText("SVP, Administration and Support Units", { x: 350, y: 538, size: 8, font });

  // Recommending Approval row (split into 2 lines)
  page1.drawText("Recommending", { x: 230, y: 490, size: 10, font: fontBold });
  page1.drawText("Approval:", { x: 230, y: 478, size: 10, font: fontBold });
  page1.drawText("ALJON", { x: 350, y: 485, size: 10, font: fontBold });
  page1.drawText("M.", { x: 395, y: 485, size: 10, font: fontBold });
  page1.drawText("TOLENTINO.", { x: 412, y: 485, size: 10, font: fontBold });
  page1.drawText("PhD", { x: 480, y: 485, size: 10, font: fontBold });
  page1.drawText("Director, Student and Alumni Services", { x: 350, y: 472, size: 8, font });

  // Reviewed row
  page1.drawText("Reviewed:", { x: 230, y: 420, size: 10, font: fontBold });
  page1.drawText("MS.", { x: 350, y: 420, size: 10, font: fontBold });
  page1.drawText("JANINE", { x: 375, y: 420, size: 10, font: fontBold });
  page1.drawText("MAE", { x: 420, y: 420, size: 10, font: fontBold });
  page1.drawText("A.", { x: 450, y: 420, size: 10, font: fontBold });
  page1.drawText("JAVIER", { x: 465, y: 420, size: 10, font: fontBold });
  page1.drawText("Head, Institutional Student Programs and Services", { x: 350, y: 408, size: 8, font });

  // Prepared by row
  page1.drawText("Prepared by:", { x: 230, y: 350, size: 10, font: fontBold });
  page1.drawText("DENNIS", { x: 350, y: 350, size: 10, font: fontBold });
  page1.drawText("R.", { x: 395, y: 350, size: 10, font: fontBold });
  page1.drawText("RAMOS", { x: 410, y: 350, size: 10, font: fontBold });
  page1.drawText("Coordinator, ASEAN Student Residences", { x: 350, y: 338, size: 8, font });

  // Page 2: Trailing Blank Page (accidental Word export blank page)
  pdfDoc.addPage([612, 792]);

  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  console.log("Test Case 1: Detect 'Aljon Tolentino' in document containing 'ALJON M. TOLENTINO. PhD'");
  const detectionResult1 = await detectSignatoryCoordinatesInPdf(pdfBuffer, {
    signerName: "Aljon Tolentino",
    signerRole: "DIRECTOR",
    slotIndex: 1,
  });

  assert(detectionResult1 !== null, "Anchor detected for Aljon Tolentino");
  assert(detectionResult1?.pageIndex === 0, "Matched on Page 1 (skipped blank Page 2)");
  assert(
    detectionResult1 ? Math.abs(detectionResult1.y - 497) <= 15 : false,
    `Y-coordinate positioned above name line (Y=${detectionResult1?.y})`
  );

  console.log("\nTest Case 2: Detect 'Dennis Ramos' in document containing 'DENNIS R. RAMOS'");
  const detectionResult2 = await detectSignatoryCoordinatesInPdf(pdfBuffer, {
    signerName: "Dennis Ramos",
    signerRole: "COORDINATOR",
    slotIndex: 0,
  });

  assert(detectionResult2 !== null, "Anchor detected for Dennis Ramos");
  assert(detectionResult2?.pageIndex === 0, "Matched on Page 1");
  assert(
    detectionResult2 ? Math.abs(detectionResult2.y - 362) <= 15 : false,
    `Y-coordinate positioned above Dennis Ramos name line (Y=${detectionResult2?.y})`
  );

  console.log("\nTest Case 3: Detect 'Emmanuel Sator' in document containing 'EMMANUEL S. SATOR'");
  const detectionResult3 = await detectSignatoryCoordinatesInPdf(pdfBuffer, {
    signerName: "Emmanuel Sator",
    signerRole: "SVP",
    slotIndex: 2,
  });

  assert(detectionResult3 !== null, "Anchor detected for Emmanuel Sator");
  assert(detectionResult3?.pageIndex === 0, "Matched on Page 1");

  console.log("\nTest Case 4: Stamping with a dummy signature image");
  // 1x1 transparent PNG buffer
  const sampleSigPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );

  const stampResult = await stampPdfWithSignature(pdfBuffer, {
    slotIndex: 1,
    signerName: "Aljon Tolentino",
    signerRole: "DIRECTOR",
    unitName: "Student and Alumni Services",
    actionTitle: "Director Approval",
    signedAt: new Date(),
    signatureImageBuffer: sampleSigPng,
  });

  assert(stampResult.stampedBuffer.length > 0, "PDF stamped successfully");
  assert(stampResult.sha256Checksum.length === 64, `Valid SHA-256 Checksum generated: ${stampResult.sha256Checksum.substring(0, 16)}...`);

  console.log("\nTest Case 5: Stamping with Custom Coordinates (e.g. from Visual Placer Modal)");
  const customStampResult = await stampPdfWithSignature(pdfBuffer, {
    slotIndex: 1,
    signerName: "Aljon Tolentino",
    signerRole: "DIRECTOR",
    unitName: "Student and Alumni Services",
    actionTitle: "Director Approval",
    signedAt: new Date(),
    signatureImageBuffer: sampleSigPng,
    customCoordinates: { page: 0, x: 350, y: 490 },
  });

  assert(customStampResult.stampedBuffer.length > 0, "Custom coordinates stamped successfully");
  assert(customStampResult.sha256Checksum !== stampResult.sha256Checksum, "Different coordinate yields unique cryptographic checksum");

  console.log("\n=================================================");
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log("=================================================");

  if (failed > 0) process.exit(1);
}

runSmartAnchorTests();
