"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Clock,
  Plus,
  User,
  Users,
  Shield,
  Building2,
  ArrowRight,
  X,
  Loader2,
  FileCheck,
  CornerDownLeft,
  History,
} from "lucide-react";
import { quickSearchLiveAction } from "@/actions/documents";
import { getStatusLabel, getStatusBadgeClass } from "@/lib/status-labels";
import { DocumentStatus } from "@prisma/client";

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  units?: Array<{ code: string; name: string }>;
}

interface LiveDocumentResult {
  id: string;
  trackingNumber: string;
  title: string;
  status: DocumentStatus;
  unitCode: string;
  documentTypeName: string;
  uploaderName: string;
}

interface LiveUnitResult {
  id: string;
  code: string;
  name: string;
}

const RECENT_SEARCHES_KEY = "sasdms_recent_searches";

export default function QuickSearchModal({ isOpen, onClose, userRole, units = [] }: QuickSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [liveDocs, setLiveDocs] = useState<LiveDocumentResult[]>([]);
  const [liveUnits, setLiveUnits] = useState<LiveUnitResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // Ignore JSON error
      }
    }
    return [];
  });
  const inputRef = useRef<HTMLInputElement | null>(null);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleClose = useCallback(() => {
    setQuery("");
    setLiveDocs([]);
    setLiveUnits([]);
    setIsSearching(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length < 2) {
      setLiveDocs([]);
      setLiveUnits([]);
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setLiveDocs([]);
    setLiveUnits([]);
    setIsSearching(false);
    inputRef.current?.focus();
  };

  // Debounced real-time asynchronous search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    let isMounted = true;
    const debounceTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await quickSearchLiveAction(trimmed);
        if (!isMounted) return;
        if (res.success) {
          setLiveDocs(res.documents);
          setLiveUnits(res.units);
        } else {
          setLiveDocs([]);
          setLiveUnits([]);
        }
      } catch {
        if (isMounted) {
          setLiveDocs([]);
          setLiveUnits([]);
        }
      } finally {
        if (isMounted) {
          setIsSearching(false);
        }
      }
    }, 180);

    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [query]);

  // Keyboard navigation for escape, enter, up, down
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          handleClose();
        }
      } else if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

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

  const fallbackUnits = units.filter(
    (u) =>
      u.code.toLowerCase().includes(query.toLowerCase()) ||
      u.name.toLowerCase().includes(query.toLowerCase())
  );

  const displayedUnits = liveUnits.length > 0 ? liveUnits : fallbackUnits;

  const handleNavigate = (href: string, termToSave?: string) => {
    if (termToSave) saveRecentSearch(termToSave);
    handleClose();
    router.push(href);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    saveRecentSearch(trimmed);
    handleClose();
    router.push(`/dashboard/documents?search=${encodeURIComponent(trimmed)}`);
  };

  const hasLiveResults = liveDocs.length > 0 || displayedUnits.length > 0;
  const isQueryActive = query.trim().length >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 pt-10 sm:pt-20 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-panel rounded-3xl max-w-2xl w-full bg-white shadow-2xl border border-white/90 overflow-hidden space-y-0 flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="p-3.5 sm:p-5 border-b border-slate-200/80 flex items-center gap-2.5 sm:gap-3 shrink-0 bg-white/95">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-[#0F2962] shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tracking number, document title, or unit..."
            value={query}
            onChange={handleInputChange}
            className="w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-300 rounded-lg">
            ESC
          </kbd>
        </form>

        {/* Search Recommendations / Quick Jump list */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Recent Searches (when query is empty) */}
          {query.trim() === "" && recentSearches.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <History className="w-3 h-3 text-slate-400" />
                  <span>Recent Searches</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem(RECENT_SEARCHES_KEY);
                  }}
                  className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  Clear History
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 px-1">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setQuery(term);
                      inputRef.current?.focus();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                  >
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Repository Search Link */}
          {query.trim() !== "" && (
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="w-full text-left p-3 rounded-2xl bg-blue-50/80 hover:bg-blue-100 border border-blue-200 text-xs font-bold text-[#0F2962] flex items-center justify-between transition cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-blue-700" />
                <span>Search Full Repository for &ldquo;{query}&rdquo;</span>
              </div>
              <CornerDownLeft className="w-4 h-4 text-blue-700" />
            </button>
          )}

          {/* 1. Live Matching Documents (Async Results) */}
          {liveDocs.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-2">
                Matching Documents ({liveDocs.length})
              </span>
              <div className="space-y-1.5">
                {liveDocs.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => handleNavigate(`/dashboard/documents/${doc.id}`, doc.trackingNumber)}
                    className="w-full text-left p-3 rounded-2xl hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-[#0F2962] flex items-center justify-center shrink-0">
                        <FileCheck className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-black text-[#0F2962]">
                            {doc.trackingNumber}
                          </span>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(doc.status)}`}>
                            {getStatusLabel(doc.status)}
                          </span>
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-slate-900 block truncate group-hover:text-blue-900">
                          {doc.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span>{doc.unitCode}</span>
                          <span>•</span>
                          <span>{doc.documentTypeName}</span>
                          <span>•</span>
                          <span>By {doc.uploaderName}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F2962] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Live Matching Units */}
          {displayedUnits.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-2">
                SAS Department Units ({displayedUnits.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {displayedUnits.map((u) => (
                  <button
                    key={u.code}
                    type="button"
                    onClick={() => handleNavigate(`/dashboard/documents?unit=${u.code}`, u.name)}
                    className="p-2.5 rounded-xl hover:bg-amber-50/80 border border-slate-200/80 hover:border-amber-300 text-left flex items-center gap-2.5 transition group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-amber-700" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-900 block truncate group-hover:text-amber-950">
                        {u.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        {u.code}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results indicator when actively querying */}
          {isQueryActive && !isSearching && !hasLiveResults && (
            <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <p className="font-bold text-xs text-slate-700">No records found matching &ldquo;{query}&rdquo;</p>
              <p className="text-[11px] text-slate-400">Try searching for another tracking number, title, or department unit.</p>
            </div>
          )}

          {/* 3. System Shortcuts & Navigation Modules */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2 px-2">
              System Shortcuts & Modules
            </span>

            <div className="space-y-1">
              {filteredActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.href}
                    type="button"
                    onClick={() => handleNavigate(action.href)}
                    className="w-full text-left p-3 rounded-2xl hover:bg-slate-100/80 transition-all flex items-center justify-between group cursor-pointer border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl ${action.color} flex items-center justify-center shrink-0 shadow-2xs`}>
                        <Icon className="w-4 h-4" />
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
        <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 px-5 shrink-0">
          <span>Navigate instantly across SASDMS with real-time async search</span>
          <div className="flex items-center gap-2">
            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">Ctrl+K</span>
            <span>to toggle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
