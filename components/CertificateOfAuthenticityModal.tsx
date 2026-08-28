"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  Printer,
  X,
  Fingerprint,
  Award,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  Hash,
  Lock,
} from "lucide-react";
import { formatHumanDateTime, getStatusLabel } from "@/lib/status-labels";

const emptySubscribe = () => () => {};

export interface CertificateDocumentInfo {
  id: string;
  trackingNumber: string;
  title: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  unit: { name: string; code: string } | null;
  uploader: { firstName: string; lastName: string; email: string };
  currentVersion?: {
    versionNumber: number;
    sha256Checksum: string;
    fileName: string;
  } | null;
}

export interface CertificateSignatoryInfo {
  id: string;
  action: string;
  createdAt: Date | string;
  actor: { firstName: string; lastName: string; email: string };
}

interface CertificateOfAuthenticityModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: CertificateDocumentInfo;
  approvalActions?: CertificateSignatoryInfo[];
}

export default function CertificateOfAuthenticityModal({
  isOpen,
  onClose,
  document,
  approvalActions = [],
}: CertificateOfAuthenticityModalProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Sync body class for print isolation
  useEffect(() => {
    if (isOpen) {
      window.document.body.classList.add("certificate-modal-open");
    } else {
      window.document.body.classList.remove("certificate-modal-open");
    }
    return () => {
      window.document.body.classList.remove("certificate-modal-open");
    };
  }, [isOpen]);

  if (!isOpen || !isMounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const securityToken = `SAS-AUTH-${document.id.replace(/-/g, "").substring(0, 16).toUpperCase()}`;

  return createPortal(
    <div
      id="certificate-portal-root"
      className="fixed inset-0 z-100 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 print:p-0 print:bg-white print:static"
    >
      <div
        className="glass-panel rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[92vh] border border-white/90 bg-white shadow-2xl overflow-hidden flex flex-col print:shadow-none print:border-none print:m-0 print:max-w-none print:w-full print:max-h-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Action Bar (Hidden in Print) */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/95 shrink-0 no-print print:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#0F2962] shrink-0" />
            <div>
              <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider block">
                Certificate of Authenticity
              </span>
              <span className="text-[10px] text-slate-500 font-mono hidden xs:block">
                Tracking: {document.trackingNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-[#0F2962] hover:bg-[#091a42] text-amber-300 font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-md hover:-translate-y-0.5 active:scale-98"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print Official Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              aria-label="Close certificate modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Canvas */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 print:p-0 print:overflow-visible">
          <div className="p-6 sm:p-8 space-y-5 bg-white text-slate-900 border-4 border-[#0F2962] rounded-2xl relative print:border-4 print:m-0 print:p-8 print:rounded-none">
            {/* Elegant Inset Gold Border */}
            <div className="absolute inset-1.5 border border-amber-500/60 rounded-xl pointer-events-none print:rounded-none" />

            {/* Header: Institutional Branding */}
            <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Image
                  src="/images/faith-crest.png"
                  alt="FAITH Colleges Crest"
                  width={48}
                  height={48}
                  priority
                  className="w-auto h-12 sm:h-14 object-contain"
                />
              </div>

              <p className="text-[9px] sm:text-[10px] font-black tracking-widest text-[#0F2962] uppercase">
                Republic of the Philippines • Commission on Higher Education (CHED)
              </p>

              <h1 className="text-lg sm:text-2xl font-black text-[#0F2962] tracking-tight uppercase leading-tight font-serif">
                First Asia Institute of Technology and Humanities
              </h1>

              <p className="text-xs font-bold text-slate-700">
                Student Affairs and Services • Document Management System (SASDMS)
              </p>

              <p className="text-[10px] text-slate-500 font-medium">
                Pres. Jose P. Laurel National Highway, Tanauan City, Batangas 4232 Philippines
              </p>

              <div className="pt-2">
                <span className="inline-block px-4 sm:px-5 py-1 rounded-full bg-[#0F2962] text-amber-300 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-amber-400/50 shadow-xs">
                  Official Electronic Verification Certificate
                </span>
              </div>
            </div>

            {/* Certification Preamble */}
            <p className="text-[11px] sm:text-xs text-slate-700 text-center leading-relaxed italic px-2 sm:px-6">
              This is to certify that the official electronic document recorded below has successfully completed the mandatory sequential review pipeline, verified signatory authentications, and cryptographic seal generation in compliance with{" "}
              <strong className="text-slate-900 font-bold not-italic">Republic Act No. 8792</strong> (Electronic Commerce Act of 2000) and the data integrity mandates of{" "}
              <strong className="text-slate-900 font-bold not-italic">Republic Act No. 10173</strong> (Data Privacy Act of 2012).
            </p>

            {/* Document Specification Grid */}
            <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50/70 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                <div className="p-3.5 space-y-2.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-[#0F2962]" />
                      <span>Tracking Number</span>
                    </span>
                    <p className="font-mono font-black text-slate-900 text-sm mt-0.5">
                      {document.trackingNumber}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Award className="w-3 h-3 text-[#0F2962]" />
                      <span>Document Title</span>
                    </span>
                    <p className="font-bold text-slate-900 text-xs mt-0.5 line-clamp-2">
                      {document.title}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[#0F2962]" />
                      <span>Originating Unit</span>
                    </span>
                    <p className="font-semibold text-slate-800 text-xs mt-0.5">
                      {document.unit?.name || "Student Affairs & Services"} ({document.unit?.code || "GEN"})
                    </p>
                  </div>
                </div>

                <div className="p-3.5 space-y-2.5 bg-slate-50/40">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Lifecycle Approval Status</span>
                    </span>
                    <p className="font-black text-emerald-800 flex items-center gap-1 mt-0.5 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{getStatusLabel(document.status)}</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-[#0F2962]" />
                      <span>Primary Originator / Requestor</span>
                    </span>
                    <p className="font-semibold text-slate-800 text-xs mt-0.5">
                      {document.uploader.firstName} {document.uploader.lastName}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#0F2962]" />
                      <span>Date & Time of Ingestion (PST)</span>
                    </span>
                    <p className="font-mono text-slate-700 text-xs mt-0.5">
                      {formatHumanDateTime(document.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographic SHA-256 Checksum Seal */}
            {document.currentVersion && (
              <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-slate-300 space-y-1.5">
                <div className="flex items-center justify-between text-slate-700 text-[10px] font-black uppercase">
                  <span className="flex items-center gap-1.5 text-[#0F2962]">
                    <Fingerprint className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>SHA-256 Cryptographic Checksum Digest (v{document.currentVersion.versionNumber})</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[9px] font-mono font-black border border-emerald-300">
                    VALIDATED INTEGRITY
                  </span>
                </div>
                <p className="break-all font-mono text-[10.5px] text-slate-900 font-bold tracking-tight bg-white p-2 rounded border border-slate-200">
                  {document.currentVersion.sha256Checksum}
                </p>
              </div>
            )}

            {/* Institutional Signatory Chain of Custody */}
            {approvalActions.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0F2962] flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#0F2962]" />
                    <span>Institutional Signatory Chain of Custody</span>
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono font-semibold">
                    {approvalActions.length} Verified Signature{approvalActions.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-[9.5px] font-black uppercase border-b border-slate-300">
                        <th className="py-2 px-3">Signatory</th>
                        <th className="py-2 px-3">Official Action</th>
                        <th className="py-2 px-3">Timestamp (PST)</th>
                        <th className="py-2 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px]">
                      {approvalActions.map((action) => (
                        <tr key={action.id} className="bg-white">
                          <td className="py-2 px-3">
                            <span className="font-bold text-slate-900 block">
                              {action.actor.firstName} {action.actor.lastName}
                            </span>
                            <span className="text-[9.5px] text-slate-500 font-mono">
                              {action.actor.email}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800 capitalize">
                            {action.action.replace(/_/g, " ").toLowerCase()}
                          </td>
                          <td className="py-2 px-3 font-mono text-[10px] text-slate-600 whitespace-nowrap">
                            {formatHumanDateTime(action.createdAt)}
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[9px] font-bold border border-emerald-200">
                              ✓ Verified
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Statutory Footer & Security Token */}
            <div className="pt-3.5 border-t-2 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[10px] text-slate-500">
              <div className="space-y-0.5">
                <p className="font-mono text-[9.5px] text-slate-700 font-bold">
                  Security Token: <span className="text-[#0F2962]">{securityToken}</span> • PST Certified
                </p>
                <p className="text-[9px] text-slate-400 font-mono">
                  Certificate Generated: {new Date().toUTCString()} • SASDMS Security Vault
                </p>
              </div>
              <div className="text-[8.5px] text-slate-400 sm:text-right max-w-xs leading-tight">
                This document is an immutable electronic verification slip issued by FAITH Colleges. Alteration, forgery, or unauthorized reproduction is punishable under Philippine Law (R.A. 8792).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    window.document.body
  );
}
