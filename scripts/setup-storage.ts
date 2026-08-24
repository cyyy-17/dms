import "dotenv/config";
import { supabaseAdmin } from "../lib/supabase/admin";
import { STORAGE_BUCKETS } from "../lib/constants";

async function setupStorageBuckets() {
  console.log("Setting up Supabase Storage buckets...");

  // 1. Documents Bucket
  const { error: docError } = await supabaseAdmin.storage.createBucket(
    STORAGE_BUCKETS.DOCUMENTS,
    {
      public: false,
      fileSizeLimit: 52428800, // 50 MB
      allowedMimeTypes: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
    }
  );

  if (docError && !docError.message.includes("already exists")) {
    console.warn(`Note on ${STORAGE_BUCKETS.DOCUMENTS}:`, docError.message);
  } else {
    console.log(`✓ Bucket ready: ${STORAGE_BUCKETS.DOCUMENTS}`);
  }

  // 2. Signatures Bucket
  const { error: sigError } = await supabaseAdmin.storage.createBucket(
    STORAGE_BUCKETS.SIGNATURES,
    {
      public: false,
      fileSizeLimit: 5242880, // 5 MB
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
    }
  );

  if (sigError && !sigError.message.includes("already exists")) {
    console.warn(`Note on ${STORAGE_BUCKETS.SIGNATURES}:`, sigError.message);
  } else {
    console.log(`✓ Bucket ready: ${STORAGE_BUCKETS.SIGNATURES}`);
  }

  console.log("Storage buckets initialized.");
}

setupStorageBuckets().catch((err) => {
  console.error("Storage setup error:", err);
});
