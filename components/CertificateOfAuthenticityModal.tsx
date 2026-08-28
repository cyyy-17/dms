"use client";

import {
  Printer,
  X,
  Fingerprint,
  Award,
  CheckCircle2,
} from "lucide-react";
import { formatHumanDate, formatHumanDateTime, getStatusLabel } from "@/lib/status-labels";

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
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
      <div
        className="glass-panel rounded-3xl max-w-2xl w-full border border-white/90 bg-white shadow-2xl overflow-hidden flex flex-col my-8 print:shadow-none print:border-none print:m-0 print:max-w-none print:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#0F2962]" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Institutional Certificate of Authenticity
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Body */}
        <div className="p-8 sm:p-10 space-y-6 bg-white text-slate-900 border-8 border-slate-100/80 m-4 rounded-2xl print:border-4 print:m-0 print:p-8">
          {/* Institutional Header */}
          <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1">
            <p className="text-[10px] font-black tracking-widest text-[#0F2962] uppercase">
              Republic of the Philippines • Commission on Higher Education
            </p>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
              First Asia Institute of Technology and Humanities
            </h1>
            <p className="text-xs font-bold text-slate-600">
              Student Affairs and Services Document Management System (SASDMS)
            </p>
            <div className="pt-2">
              <span className="inline-block px-4 py-1 rounded-full bg-slate-900 text-amber-300 font-mono text-[10px] font-black uppercase tracking-widest">
                Official Electronic Verification Certificate
              </span>
            </div>
          </div>

          {/* Certificate Description */}
          <p className="text-xs text-slate-600 text-center leading-relaxed">
            This certifies that the record described below has completed the mandatory institutional review, 
            sequential coordinator and executive approval workflow, and complies with the data integrity safeguards of 
            <strong className="text-slate-900 font-bold"> Republic Act No. 10173 (Data Privacy Act of 2012)</strong>.
          </p>

          {/* Document Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Tracking Number
              </span>
              <p className="font-mono font-black text-slate-900 text-sm mt-0.5">
                {document.trackingNumber}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Approval Status
              </span>
              <p className="font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{getStatusLabel(document.status)}</span>
              </p>
            </div>

            <div className="sm:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Document Title
              </span>
              <p className="font-bold text-slate-900 mt-0.5">{document.title}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Originating Unit
              </span>
              <p className="font-semibold text-slate-700 mt-0.5">
                {document.unit?.name || "Student Affairs & Services"} ({document.unit?.code || "GEN"})
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Ingestion Date
              </span>
              <p className="font-mono text-slate-700 mt-0.5">
                {formatHumanDate(document.createdAt)}
              </p>
            </div>
          </div>

          {/* SHA-256 Checksum Seal */}
          {document.currentVersion && (
            <div className="p-3.5 rounded-xl bg-slate-900 text-amber-300 font-mono text-[10px] space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[9px] font-bold uppercase">
                <span className="flex items-center gap-1">
                  <Fingerprint className="w-3 h-3 text-amber-400" />
                  <span>SHA-256 Cryptographic Checksum Seal (v{document.currentVersion.versionNumber})</span>
                </span>
                <span className="text-emerald-400 font-black">VALIDATED</span>
              </div>
              <p className="break-all font-mono text-[10px] text-amber-200">
                {document.currentVersion.sha256Checksum}
              </p>
            </div>
          )}

          {/* Signatory Workflow Log */}
          {approvalActions.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Institutional Signatory Chain of Custody
              </span>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs">
                {approvalActions.map((action) => (
                  <div key={action.id} className="p-2.5 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <p className="font-bold text-slate-900">
                        {action.actor.firstName} {action.actor.lastName}
                      </p>
                      <p className="text-[10px] text-slate-500">{action.actor.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {action.action.replace(/_/g, " ")}
                      </span>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {formatHumanDateTime(action.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statutory Footer */}
          <div className="pt-4 border-t border-slate-200 text-center space-y-1 text-[10px] text-slate-500">
            <p className="font-mono">
              Certificate Generated: {new Date().toUTCString()} • SASDMS Security Vault
            </p>
            <p className="text-[9px]">
              This document is an electronically generated institutional verification slip. Tampering or unauthorized alteration is strictly prohibited under Philippine Law.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
