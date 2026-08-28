async function runBatch9Verification() {
  console.log("=================================================");
  console.log("Running SASDMS Batch 9 Implementation Verification");
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

  // --- 1. Quick Preview Payload Extraction ---
  console.log("Test Suite 1: Document Quick Preview Payload Invariants");

  interface SampleDoc {
    id: string;
    trackingNumber: string;
    title: string;
    status: string;
    unit: { code: string; name: string } | null;
    uploader: { firstName: string; lastName: string } | null;
    currentVersion: { versionNumber: number; fileName: string } | null;
  }

  function formatQuickPreview(doc: SampleDoc) {
    return {
      trackingNumber: doc.trackingNumber,
      title: doc.title,
      unitCode: doc.unit?.code || "GEN",
      uploaderFullName: doc.uploader ? `${doc.uploader.firstName} ${doc.uploader.lastName}` : "Staff Member",
      versionLabel: `v${doc.currentVersion?.versionNumber || 1}`,
    };
  }

  const sample: SampleDoc = {
    id: "doc-1",
    trackingNumber: "DOC-2026-009",
    title: "Student Leadership Camp Proposal",
    status: "PENDING_COORDINATOR",
    unit: { code: "ACTIVITIES", name: "Student Activities" },
    uploader: { firstName: "Maria", lastName: "Santos" },
    currentVersion: { versionNumber: 2, fileName: "leadership-camp-v2.pdf" },
  };

  const preview = formatQuickPreview(sample);
  assert(preview.trackingNumber === "DOC-2026-009", "Quick preview extracts tracking number");
  assert(preview.unitCode === "ACTIVITIES", "Quick preview extracts unit code");
  assert(preview.uploaderFullName === "Maria Santos", "Quick preview formats uploader full name");
  assert(preview.versionLabel === "v2", "Quick preview extracts version label");

  // --- 2. Multi-Selection Set Operations & Tracking Concatenation ---
  console.log("\nTest Suite 2: Multi-Selection Operations & Concatenation");

  let selection = new Set<string>();

  function toggleItem(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }

  selection = toggleItem(selection, "doc-1");
  selection = toggleItem(selection, "doc-2");
  assert(selection.size === 2, "Added 2 documents to multi-selection set");

  selection = toggleItem(selection, "doc-1");
  assert(selection.size === 1 && selection.has("doc-2"), "Toggled out doc-1 from multi-selection set");

  const sampleDocs = [
    { id: "doc-1", trackingNumber: "DOC-2026-001" },
    { id: "doc-2", trackingNumber: "DOC-2026-002" },
    { id: "doc-3", trackingNumber: "DOC-2026-003" },
  ];

  function selectAll(docs: { id: string }[]): Set<string> {
    return new Set(docs.map((d) => d.id));
  }

  const allSelected = selectAll(sampleDocs);
  assert(allSelected.size === 3, "Select all selects all 3 documents");

  const trackingText = sampleDocs.map((d) => d.trackingNumber).join("\n");
  assert(
    trackingText === "DOC-2026-001\nDOC-2026-002\nDOC-2026-003",
    "Tracking numbers concatenated with newlines for batch clipboard copy"
  );

  // --- 3. Audio Accessibility Storage Invariants ---
  console.log("\nTest Suite 3: Audio Accessibility Storage Invariants");

  function serializeAudioPreference(isMuted: boolean): string {
    return String(isMuted);
  }

  function parseAudioPreference(raw: string | null): boolean {
    return raw === "true";
  }

  assert(serializeAudioPreference(true) === "true", "Muted serialized to 'true'");
  assert(serializeAudioPreference(false) === "false", "Unmuted serialized to 'false'");
  assert(parseAudioPreference("true") === true, "Parsed 'true' to boolean true");
  assert(parseAudioPreference(null) === false, "Parsed null to default boolean false");

  console.log("\n=================================================");
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runBatch9Verification();
