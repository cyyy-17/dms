"use client";

import { useState } from "react";
import {
  FileText,
  GitBranch,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Flame,
  Award,
} from "lucide-react";

export default function LandingWorkflowRoadmap() {
  const [activeWorkflowView, setActiveWorkflowView] = useState<"standard" | "escalated">("standard");

  return (
    <section id="workflow" className="py-24 bg-slate-900/60 border-t border-slate-800/80 relative">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 w-175 h-87.5 bg-blue-900/15 blur-[140px] pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-600/40 text-emerald-300 text-xs font-bold shadow-inner">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Turn-Based Sequential Life Cycle</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            How SAS Documents Progress to Full Approval
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            Enforces strict step-by-step turn governance with automated executive escalation safeguards.
          </p>

          {/* Workflow Toggle */}
          <div className="flex flex-col sm:inline-flex sm:flex-row p-1.5 rounded-2xl bg-slate-950 border border-slate-800 gap-1.5 mt-4 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveWorkflowView("standard")}
              className={`px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                activeWorkflowView === "standard"
                  ? "bg-linear-to-r from-[#1E40AF] to-[#0F2962] text-amber-300 border border-blue-400/40 shadow-md font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Standard 4-Stage Approval Path</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWorkflowView("escalated")}
              className={`px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                activeWorkflowView === "escalated"
                  ? "bg-linear-to-r from-rose-900 to-red-900 text-white border border-red-500/50 shadow-md font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>2-Rejection Auto-Escalation Safeguard</span>
            </button>
          </div>
        </div>

        {/* Standard Workflow View */}
        {activeWorkflowView === "standard" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800/90 space-y-4 relative overflow-hidden shadow-xl hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black font-mono text-slate-700 block">
                  01
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  Client Checksum
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Ingestion & SHA-256 Hashing</h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
                  Originating staff uploads the document binary. The client computes a cryptographic SHA-256 digest to establish immutable file integrity before transmission.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-900 text-[11px] text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Status: DRAFT → SUBMITTED</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800/90 space-y-4 relative overflow-hidden shadow-xl hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black font-mono text-slate-700 block">
                  02
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/30">
                  Turn-Based Lock
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Unit Coordinator Endorsement</h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
                  The document advances to the designated unit coordinator. The reviewer applies Smart Anchor endorsement with line-item remarks if revisions are required.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-900 text-[11px] text-slate-400 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                <span>Status: PENDING_REVIEW (Turn 1)</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800/90 space-y-4 relative overflow-hidden shadow-xl hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black font-mono text-slate-700 block">
                  03
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30">
                  Vector E-Sign
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Executive Director Review</h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
                  The SAS Director evaluates the comprehensive package across cross-unit contexts and applies the verified electronic signature with mandatory audit log records.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-900 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Status: PENDING_REVIEW (Turn 2)</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800/90 space-y-4 relative overflow-hidden shadow-xl hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black font-mono text-slate-700 block">
                  04
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                  Vault Locked
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cryptographic Preservation</h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
                  The document receives the immutable institutional seal, status shifts to APPROVED, and becomes permanently archived in the private cloud vault with searchable checksums.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-900 text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Status: APPROVED (Immutable)</span>
              </div>
            </div>
          </div>
        ) : (
          /* Escalation Safeguard View */
          <div className="glass-panel-dark rounded-3xl p-7 sm:p-10 border border-red-500/40 shadow-2xl backdrop-blur-2xl space-y-8 animate-in fade-in duration-300">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/40 text-xs font-bold">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Gridlock Prevention Mechanism</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Automated 2-Rejection Executive Escalation Protocol
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  In university administration, repeated revision loops between reviewers and submitters can cause severe operational delays. SASDMS features an automated circuit-breaker: if a document encounters <strong>2 consecutive rejections or returns</strong>, the system triggers an immediate emergency escalation.
                </p>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-start gap-2.5 text-xs text-slate-200">
                    <div className="w-5 h-5 rounded-full bg-rose-950 border border-rose-500/50 text-rose-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      1
                    </div>
                    <span>
                      <strong>Immediate Queue Bypass:</strong> Document transitions to <code className="bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded font-mono text-[11px]">ESCALATED_DIRECTOR</code> and is pinned to the SAS Director’s priority dashboard.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-slate-200">
                    <div className="w-5 h-5 rounded-full bg-rose-950 border border-rose-500/50 text-rose-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      2
                    </div>
                    <span>
                      <strong>Automated Resend Dispatch:</strong> Immediate email and in-app alerts are dispatched to the Director and all participating reviewers with historical remarks.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-slate-200">
                    <div className="w-5 h-5 rounded-full bg-rose-950 border border-rose-500/50 text-rose-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      3
                    </div>
                    <span>
                      <strong>Director Override Authority:</strong> The Director can execute executive endorsement, mandate specific mediation remarks, or close the docket definitively.
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-950/90 border border-rose-500/30 space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-rose-950 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-lg animate-pulse">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest block">
                    Escalation Trigger Active
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">
                    Consecutive Return Threshold Met (2/2)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    System bypassed standard reviewer queue and summoned Director Intervention Docket.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
                  Escalation Ref: ESC-SAS-2026-0842 • Priority: Critical
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
