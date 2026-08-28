"use client";

import {
  CheckCircle2,
  Clock,
  XCircle,
  FileUp,
  ShieldCheck,
  RotateCcw,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { DocumentStatus, ApprovalActionType, UserRole } from "@prisma/client";
import { formatHumanDateTime, getRoleLabel } from "@/lib/status-labels";

interface ApprovalActionItem {
  id: string;
  action: ApprovalActionType;
  actorRole: UserRole;
  comments: string | null;
  signatureApplied: boolean;
  createdAt: Date;
  actor: { firstName: string; lastName: string; email: string };
  version?: { versionNumber: number } | null;
}

interface DocumentTimelineViewProps {
  status: DocumentStatus;
  createdAt: Date;
  uploader: { firstName: string; lastName: string };
  approvalActions: ApprovalActionItem[];
  isEscalated?: boolean;
}

export default function DocumentTimelineView({
  status,
  createdAt,
  uploader,
  approvalActions,
  isEscalated,
}: DocumentTimelineViewProps) {
  return (
    <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/90 bg-white/90 shadow-sm space-y-5 sm:space-y-6 w-full max-w-full min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0F2962] flex items-center justify-center font-bold border border-blue-100 shadow-xs shrink-0">
            <Sparkles className="w-4 h-4 text-[#0F2962]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Document Lifecycle Timeline</h3>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              Chronological sequential milestones and review actions
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0">
          {approvalActions.length + 1} Milestone{approvalActions.length === 0 ? "" : "s"}
        </span>
      </div>

      <div className="relative pl-6 space-y-5 sm:space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {/* Milestone 1: Initial Ingestion */}
        <div className="relative group">
          <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#0F2962] border-2 border-white text-white flex items-center justify-center shadow-xs">
            <FileUp className="w-2.5 h-2.5" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Document Ingested & Prepared</span>
                <span className="text-[10px] font-normal text-slate-500">by {uploader.firstName} {uploader.lastName}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {formatHumanDateTime(createdAt)}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Initial draft submitted into sequential institutional workflow.
            </p>
          </div>
        </div>

        {/* Dynamic Actions */}
        {approvalActions.map((action) => {
          const isApproved =
            action.action === ApprovalActionType.COORDINATOR_APPROVE ||
            action.action === ApprovalActionType.DIRECTOR_APPROVE;
          const isRejected =
            action.action === ApprovalActionType.REJECT_RETURN ||
            action.action === ApprovalActionType.REJECT_CLOSE;

          return (
            <div key={action.id} className="relative group">
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                  isApproved
                    ? "bg-emerald-600 text-white"
                    : isRejected
                    ? "bg-rose-600 text-white"
                    : "bg-blue-600 text-white"
                }`}
              >
                {isApproved ? (
                  <CheckCircle2 className="w-2.5 h-2.5" />
                ) : isRejected ? (
                  <XCircle className="w-2.5 h-2.5" />
                ) : (
                  <Clock className="w-2.5 h-2.5" />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {action.actor.firstName} {action.actor.lastName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                      {getRoleLabel(action.actorRole)}
                    </span>
                    {action.signatureApplied && (
                      <span className="text-[9px] font-black text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                        E-Signed
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {formatHumanDateTime(action.createdAt)}
                  </span>
                </div>

                {action.comments && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="italic">&ldquo;{action.comments}&rdquo;</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Current State Milestone */}
        <div className="relative group">
          <div
            className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
              status === DocumentStatus.APPROVED
                ? "bg-emerald-600 text-white"
                : status === DocumentStatus.ARCHIVED
                ? "bg-slate-600 text-white"
                : status === DocumentStatus.REJECTED_RETURNED || status === DocumentStatus.REJECTED_CLOSED
                ? "bg-rose-600 text-white"
                : "bg-amber-500 text-white animate-pulse"
            }`}
          >
            {status === DocumentStatus.APPROVED ? (
              <ShieldCheck className="w-2.5 h-2.5" />
            ) : status === DocumentStatus.REJECTED_RETURNED ? (
              <RotateCcw className="w-2.5 h-2.5" />
            ) : (
              <Clock className="w-2.5 h-2.5" />
            )}
          </div>

          <div className="space-y-1">
            <span className="text-xs font-black text-slate-900 block">
              {status === DocumentStatus.APPROVED
                ? "Fully Approved & Sealed"
                : status === DocumentStatus.ARCHIVED
                ? "Archived in RA 10173 Vault"
                : status === DocumentStatus.PENDING_DIRECTOR
                ? "Awaiting Executive Director Review"
                : status === DocumentStatus.PENDING_COORDINATOR
                ? "Awaiting Unit Coordinator Review"
                : "Draft in Revision"}
            </span>
            <p className="text-[11px] text-slate-500 font-medium">
              {status === DocumentStatus.APPROVED
                ? "All signatory anchors validated; dynamic PDF watermarking enabled."
                : isEscalated
                ? "Document is auto-escalated to director review."
                : "Sequential progression active."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
