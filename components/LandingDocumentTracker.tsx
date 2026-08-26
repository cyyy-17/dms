"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  ShieldCheck,
  FileText,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

interface SampleRecord {
  trackingNumber: string;
  title: string;
  unit: string;
  unitName: string;
  status: "APPROVED" | "PENDING_REVIEW" | "RETURNED" | "ESCALATED";
  statusText: string;
  statusColor: string;
  currentTurn: string;
  uploadedAt: string;
  lastAction: string;
  version: string;
  sha256: string;
  signatories: Array<{ name: string; role: string; signed: boolean; signedAt?: string }>;
}

const SAMPLE_DATABASE: Record<string, SampleRecord> = {
  "DOC-SAS-2026-0842": {
    trackingNumber: "DOC-SAS-2026-0842",
    title: "Industry On-The-Job Training (OJT) Partnership Memorandum",
    unit: "AAPO",
    unitName: "Alumni Affairs & Placement Office",
    status: "APPROVED",
    statusText: "Approved & Cryptographically Sealed",
    statusColor: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40",
    currentTurn: "Preserved in Private Vault",
    uploadedAt: "2026-08-20 09:15 GMT+8",
    lastAction: "Final Institutional Seal Applied by SAS Director",
    version: "v1.0 (Final)",
    sha256: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    signatories: [
      { name: "Authorized Originator [UID: AAPO-***402]", role: "Originating Staff", signed: true, signedAt: "Aug 20, 09:15" },
      { name: "Unit Review Coordinator [UID: SAS-***104]", role: "Unit Coordinator", signed: true, signedAt: "Aug 21, 10:30" },
      { name: "Office of the SAS Director [Executive Seal]", role: "Department Director", signed: true, signedAt: "Aug 21, 14:45" },
    ],
  },
  "DOC-GCO-2026-0114": {
    trackingNumber: "DOC-GCO-2026-0114",
    title: "Student Welfare Protocol & Academic Case Assessment [REDACTED PROFILE]",
    unit: "GCO",
    unitName: "Guidance & Counseling Office",
    status: "PENDING_REVIEW",
    statusText: "Pending Unit Coordinator Review",
    statusColor: "bg-amber-950/80 text-amber-300 border-amber-500/40",
    currentTurn: "Guidance Coordinator (Turn 2 of 3)",
    uploadedAt: "2026-08-24 14:02 GMT+8",
    lastAction: "Intake file verified with SHA-256 digest",
    version: "v1.0 (Under Review)",
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    signatories: [
      { name: "Licensed Counselor [UID: GCO-***218]", role: "Counselor Signatory", signed: true, signedAt: "Aug 24, 14:02" },
      { name: "Guidance Head Reviewer [UID: GCO-***091]", role: "Guidance Coordinator", signed: false },
      { name: "Office of the SAS Director [Executive Seal]", role: "Department Director", signed: false },
    ],
  },
  "DOC-SOA-2026-0309": {
    trackingNumber: "DOC-SOA-2026-0309",
    title: "Off-Campus Leadership Summit Security Permit & Budget Charter",
    unit: "SOA",
    unitName: "Student Organizations & Activities",
    status: "APPROVED",
    statusText: "Approved & Stamped",
    statusColor: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40",
    currentTurn: "Preserved with Event Permit Seal",
    uploadedAt: "2026-08-18 11:20 GMT+8",
    lastAction: "Smart Anchor Vector Signature applied",
    version: "v2.0 (Revised per remarks)",
    sha256: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
    signatories: [
      { name: "Student Council Representative [UID: SOA-***512]", role: "Student Org Officer", signed: true, signedAt: "Aug 18, 11:20" },
      { name: "SOA Faculty Moderator [UID: SOA-***741]", role: "SOA Coordinator", signed: true, signedAt: "Aug 19, 08:45" },
      { name: "Office of the SAS Director [Executive Seal]", role: "Department Director", signed: true, signedAt: "Aug 19, 13:10" },
    ],
  },
};

export default function LandingDocumentTracker() {
  const [searchTerm, setSearchTerm] = useState("DOC-SAS-2026-0842");
  const [selectedRecord, setSelectedRecord] = useState<SampleRecord | null>(SAMPLE_DATABASE["DOC-SAS-2026-0842"]);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);

    setTimeout(() => {
      const normalized = searchTerm.trim().toUpperCase();
      const match = SAMPLE_DATABASE[normalized] || SAMPLE_DATABASE["DOC-SAS-2026-0842"];
      setSelectedRecord(match);
      setIsSearching(false);
    }, 300);
  };

  const handleSelectSample = (code: string) => {
    setSearchTerm(code);
    setSelectedRecord(SAMPLE_DATABASE[code]);
  };

  const handleCopyHash = () => {
    if (selectedRecord) {
      navigator.clipboard.writeText(selectedRecord.sha256);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <section id="tracker" className="py-24 bg-slate-900/70 border-t border-slate-800/80 relative">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-100 bg-blue-900/15 blur-[140px] pointer-events-none -z-10 rounded-full" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 text-xs font-bold shadow-inner">
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>Public Document Verification Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Verify Any SAS Tracking ID or Cryptographic Fingerprint
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            Instantly query real-time routing status, signatory timestamps, and immutable SHA-256 certificate validation.
          </p>
        </div>

        {/* Interactive Search Console */}
        <div className="glass-panel-dark rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl backdrop-blur-2xl space-y-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4 text-amber-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter Tracking ID (e.g. DOC-SAS-2026-0842) or SHA-256 Checksum..."
                className="w-full pl-11 pr-4 py-3.5 bg-slate-950/90 border border-slate-700 rounded-2xl text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-7 py-3.5 rounded-2xl bg-linear-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-400/20 hover:shadow-amber-400/35 transition-all duration-200 flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer shrink-0"
            >
              {isSearching ? (
                <span>Auditing Hash...</span>
              ) : (
                <>
                  <span>Audit & Verify</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Preset Sample Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-400">Try sample document:</span>
            {Object.keys(SAMPLE_DATABASE).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => handleSelectSample(code)}
                className={`text-xs font-mono px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  searchTerm === code
                    ? "bg-amber-400/20 border-amber-400 text-amber-300 font-bold"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600"
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          {/* Verification Result Receipt */}
          {selectedRecord && (
            <div className="pt-6 border-t border-slate-800 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Result Banner Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-md">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-amber-400">
                        {selectedRecord.trackingNumber}
                      </span>
                      <span className="text-xs text-slate-400">• {selectedRecord.version}</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                      {selectedRecord.title}
                    </h3>
                  </div>
                </div>

                <span className={`px-3 py-1.5 rounded-xl text-xs font-black border uppercase tracking-wider self-start sm:self-center ${selectedRecord.statusColor}`}>
                  {selectedRecord.statusText}
                </span>
              </div>

              {/* Detail Metrics Matrix */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Originating Department Unit
                  </span>
                  <span className="text-sm font-bold text-white block">
                    {selectedRecord.unitName} ({selectedRecord.unit})
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Active Turn / Stage
                  </span>
                  <span className="text-sm font-bold text-blue-300 block">
                    {selectedRecord.currentTurn}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    RA 10173 Compliance
                  </span>
                  <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Verified & Encrypted
                  </span>
                </div>
              </div>

              {/* Sequential Signatory Turn Progression */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                  Sequential Approval Signatories Audit
                </span>
                <div className="grid sm:grid-cols-3 gap-3">
                  {selectedRecord.signatories.map((sig, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border flex items-center justify-between ${
                        sig.signed
                          ? "bg-emerald-950/20 border-emerald-500/30 text-slate-200"
                          : "bg-slate-900/60 border-slate-800 text-slate-400"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white block">{sig.name}</span>
                        <span className="text-[10px] text-slate-400 block">{sig.role}</span>
                      </div>
                      <div className="text-right">
                        {sig.signed ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Signed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Pending Turn
                          </span>
                        )}
                        {sig.signedAt && (
                          <span className="text-[9px] text-slate-500 font-mono block mt-1">
                            {sig.signedAt}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cryptographic SHA-256 Checksum Seal */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black text-white">
                      Immutable SHA-256 Certificate Lock
                    </span>
                  </div>
                  <code className="text-[11px] font-mono text-slate-400 break-all select-all block">
                    {selectedRecord.sha256}
                  </code>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyHash}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
                  >
                    {copiedHash ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Checksum</span>
                      </>
                    )}
                  </button>

                  <Link
                    href="/login"
                    className="px-3.5 py-1.5 rounded-xl bg-blue-900/60 hover:bg-blue-800/80 border border-blue-500/40 text-xs font-bold text-blue-200 hover:text-white flex items-center gap-1.5 transition"
                  >
                    <span>Staff Sign In</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
