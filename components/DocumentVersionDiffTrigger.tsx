"use client";

import { useState } from "react";
import { GitCompare } from "lucide-react";
import DocumentVersionDiffModal from "@/components/DocumentVersionDiffModal";

interface VersionItem {
  id: string;
  versionNumber: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  sha256Checksum: string;
  storagePath: string;
  changeSummary: string | null;
  createdAt: Date;
  uploadedBy?: { firstName: string; lastName: string } | null;
}

interface DocumentVersionDiffTriggerProps {
  versions: VersionItem[];
  trackingNumber: string;
}

export default function DocumentVersionDiffTrigger({
  versions,
  trackingNumber,
}: DocumentVersionDiffTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (versions.length < 2) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0F2962] border border-blue-200 text-xs font-bold transition shadow-xs cursor-pointer"
        title="Compare version metadata, sizes, and cryptographic hashes"
      >
        <GitCompare className="w-3.5 h-3.5 text-[#0F2962]" />
        <span>Compare Versions ({versions.length})</span>
      </button>

      <DocumentVersionDiffModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        versions={versions}
        trackingNumber={trackingNumber}
      />
    </>
  );
}
