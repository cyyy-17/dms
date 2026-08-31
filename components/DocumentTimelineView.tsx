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

      <div className="relative pl-7 space-y-6 sm:space-y-7">
        {/* Animated SVG Energy Spine */}
        <div className="absolute left-2.5 top-3 bottom-4 w-0.5 pointer-events-none">
          <svg className="w-full h-full" preserveAspectRatio="none">
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="100%"
              stroke="#cbd5e1"
              strokeWidth="2"
            />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="100%"
              stroke="#3b82f6"
              strokeWidth="2"
              className="animate-ribbon-flow opacity-70"
            />
          </svg>
        </div>

        {/* Milestone 1: Initial Ingestion */}
        <div className="relative group">
          <div className="absolute -left-7 top-0.5 w-5 h-5 rounded-full bg-[#0F2962] border-2 border-white text-white flex items-center justify-center shadow-md z-10">
            <FileUp className="w-2.5 h-2.5" />
          </div>

          <div className="p-3 rounded-2xl bg-white/70 border border-slate-200/70 hover:border-blue-300 transition-all duration-200 hover:shadow-xs space-y-1">
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
                className={`absolute -left-7 top-0.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-md z-10 ${
                  isApproved
                    ? "bg-emerald-600 text-white shadow-emerald-500/30"
                    : isRejected
                    ? "bg-rose-600 text-white shadow-rose-500/30"
                    : "bg-blue-600 text-white shadow-blue-500/30"
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

              <div className="p-3 rounded-2xl bg-white/70 border border-slate-200/70 hover:border-blue-300 transition-all duration-200 hover:shadow-xs space-y-1.5">
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
          {/* Radar Ripple on Active State */}
          <div className="absolute -left-7 top-0.5 w-5 h-5 flex items-center justify-center">
            {status !== DocumentStatus.APPROVED && status !== DocumentStatus.ARCHIVED && (
              <div className="absolute w-5 h-5 rounded-full bg-amber-400/40 animate-radar-ripple pointer-events-none" />
            )}
            <div
              className={`w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-md relative z-10 ${
                status === DocumentStatus.APPROVED
                  ? "bg-emerald-600 text-white shadow-emerald-500/30"
                  : status === DocumentStatus.ARCHIVED
                  ? "bg-slate-600 text-white shadow-slate-500/30"
                  : status === DocumentStatus.REJECTED_RETURNED || status === DocumentStatus.REJECTED_CLOSED
                  ? "bg-rose-600 text-white shadow-rose-500/30"
                  : "bg-amber-500 text-white shadow-amber-500/40"
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
          </div>

          <div className={`p-3 rounded-2xl border transition-all duration-200 space-y-1 ${
            status === DocumentStatus.APPROVED
              ? "bg-emerald-50/50 border-emerald-200"
              : status === DocumentStatus.REJECTED_RETURNED || status === DocumentStatus.REJECTED_CLOSED
              ? "bg-rose-50/50 border-rose-200"
              : "bg-amber-50/60 border-amber-200"
          }`}>
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
