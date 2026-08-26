"use client";

import { useState } from "react";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";

interface FaqItem {
  id: string;
  category: "access" | "signatures" | "workflow" | "legal";
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    category: "access",
    question: "Who is authorized to access the SASDMS portal?",
    answer:
      "Access is strictly restricted to verified employees, faculty coordinators, unit heads, and administrators of FAITH Colleges with valid @firstasia.edu.ph institutional email addresses. Newly registered accounts require administrative verification before permissions are activated.",
  },
  {
    id: "faq-2",
    category: "signatures",
    question: "How does Smart Anchor vector e-signature stamping work?",
    answer:
      "Smart Anchor analyzes the document layout to detect signatory markers. When an authorized reviewer approves, the system places their verified vector signature directly above the designated title block without distorting line height, margins, or document integrity.",
  },
  {
    id: "faq-3",
    category: "workflow",
    question: "What occurs when a reviewer returns a document for revision?",
    answer:
      "The document transitions to REJECTED_RETURNED status with mandatory feedback remarks. The uploader receives an automated notification to submit version v2+ addressing the remarks, preserving full historical version trees without overwriting initial drafts.",
  },
  {
    id: "faq-4",
    category: "workflow",
    question: "How does the automated 2-rejection executive escalation safeguard work?",
    answer:
      "If a document receives 2 consecutive returns or rejections between the originator and reviewers, SASDMS automatically triggers an executive circuit-breaker, escalating the document directly to the SAS Department Director for mediation and priority resolution.",
  },
  {
    id: "faq-5",
    category: "legal",
    question: "Is SASDMS compliant with the Philippine Data Privacy Act (RA 10173)?",
    answer:
      "Yes. SASDMS complies with Republic Act 10173 through strict unit-level tenancy isolation, encrypted binary storage in private Supabase vaults, and tamper-evident audit logging for every document creation, signature, view, and download action.",
  },
  {
    id: "faq-6",
    category: "access",
    question: "Can coordinators view confidential documents from other SAS department units?",
    answer:
      "No. Standard Staff and Unit Coordinators operate within a Zero-Trust unit-scoped boundary and can only access records belonging to their assigned unit (e.g. GCO staff only see GCO documents). Cross-unit visibility is restricted exclusively to the Department Director and Super Admins.",
  },
  {
    id: "faq-7",
    category: "legal",
    question: "How does the system track document retention and expiry?",
    answer:
      "Automated cron workers inspect covenant expiration dates daily. The system dispatches automated proactive email notifications 30 days prior to expiry and marks expired agreements for institutional archiving or renewal according to university policies.",
  },
];

export default function LandingFaqAccordion() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openFaq, setOpenFaq] = useState<string | null>("faq-1");

  const filteredFaqs = FAQS.filter((faq) => {
    if (activeCategory === "all") return true;
    return faq.category === activeCategory;
  });

  const categories = [
    { id: "all", label: "All Questions" },
    { id: "access", label: "Access & Roles" },
    { id: "signatures", label: "Signatures & Tech" },
    { id: "workflow", label: "Workflow & Escalation" },
    { id: "legal", label: "Legal & Data Privacy" },
  ];

  return (
    <section id="faq" className="py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      {/* Section Header */}
      <div className="text-center mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-950 border border-blue-600/40 text-blue-300 text-xs font-bold shadow-inner">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Institutional Knowledge Base</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="text-sm sm:text-base text-slate-300">
          Everything you need to know about SAS document governance, security protocols, and approval procedures.
        </p>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-amber-400 text-slate-950 shadow-md font-black"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3.5">
        {filteredFaqs.map((faq) => {
          const isOpen = openFaq === faq.id;
          return (
            <div
              key={faq.id}
              className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                isOpen
                  ? "bg-slate-900/90 border-blue-500/40 shadow-xl"
                  : "bg-slate-950/70 border-slate-800/90 hover:border-slate-700"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
              >
                <span className="text-sm sm:text-base font-bold text-white flex items-center gap-3">
                  <CheckCircle2 className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                  <span>{faq.question}</span>
                </span>
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                  {isOpen ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed pl-13 border-t border-slate-800/60 animate-in fade-in slide-in-from-top-1 duration-200">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
