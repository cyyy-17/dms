"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Clock,
  Plus,
  User,
  Users,
  Shield,
  ArrowRight,
  X,
} from "lucide-react";

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

export default function QuickSearchModal({ isOpen, onClose, userRole }: QuickSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickActions = [
    {
      title: "Ingest New Document",
      desc: "Upload a new document (v1) to start a sequential review pipeline",
      href: "/dashboard/documents/new",
      icon: Plus,
      color: "bg-blue-100 text-blue-800",
    },
    {
      title: "Pending Approvals Queue",
      desc: "Inspect documents awaiting your sequential review and e-signature",
      href: "/dashboard/approvals",
      icon: Clock,
      color: "bg-amber-100 text-amber-800",
    },
    {
      title: "Document Repository Archive",
      desc: "Search institutional records across all SAS department units",
      href: "/dashboard/documents",
      icon: FileText,
      color: "bg-purple-100 text-purple-800",
    },
    {
      title: "My Profile & E-Signature Setup",
      desc: "Configure handwritten signature strokes and review personal audit activity",
      href: "/dashboard/profile",
      icon: User,
      color: "bg-emerald-100 text-emerald-800",
    },
  ];

  if (userRole === "ADMIN") {
    quickActions.push(
      {
        title: "User Governance & Approvals",
        desc: "Activate pending employee registrations and assign RBAC roles",
        href: "/dashboard/admin/users",
        icon: Users,
        color: "bg-rose-100 text-rose-800",
      },
      {
        title: "RA 10173 Cryptographic Audit Trail",
        desc: "Examine immutable event history, IP stamps, and download CSV",
        href: "/dashboard/admin/audit",
        icon: Shield,
        color: "bg-teal-100 text-teal-800",
      }
    );
  }

  const filteredActions = quickActions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.desc.toLowerCase().includes(query.toLowerCase()) ||
      query.trim() === ""
  );

  const handleNavigate = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    onClose();
    router.push(`/dashboard/documents?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-panel rounded-3xl max-w-2xl w-full bg-white shadow-2xl border border-white/90 overflow-hidden space-y-0">
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tracking number (e.g. SAS-2026-), document title, or action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-300 rounded-lg">
            ESC
          </kbd>
        </form>

        {/* Search Recommendations / Quick Jump list */}
        <div className="p-4 sm:p-5 max-h-96 overflow-y-auto space-y-2">
          {query.trim() !== "" && (
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="w-full text-left p-3.5 rounded-2xl bg-blue-50/80 hover:bg-blue-100 border border-blue-200 text-xs font-bold text-[#0F2962] flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-blue-700" />
                <span>Search Repository Archive for &ldquo;{query}&rdquo;</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="pt-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2 px-2">
              System Shortcuts & Modules
            </span>

            <div className="space-y-1.5">
              {filteredActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.href}
                    onClick={() => handleNavigate(action.href)}
                    className="w-full text-left p-3.5 rounded-2xl hover:bg-slate-100/80 transition-all flex items-center justify-between group cursor-pointer border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl ${action.color} flex items-center justify-center shrink-0 shadow-xs`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 block truncate group-hover:text-[#0F2962] transition-colors">
                          {action.title}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium truncate block">
                          {action.desc}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F2962] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 px-5">
          <span>Navigate instantly across SASDMS with keyboard shortcuts</span>
          <div className="flex items-center gap-2">
            <span>Press <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">Enter</kbd> to execute</span>
          </div>
        </div>
      </div>
    </div>
  );
}
