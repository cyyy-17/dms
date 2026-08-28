"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  FileText,
  Plus,
  CheckSquare,
  User,
  Users,
  Building,
  FileCode,
  Shield,
  Clock,
  Bell,
  SlidersHorizontal,
  CornerDownLeft,
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Actions" | "Admin";
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  action?: () => void;
  keywords?: string[];
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Listen for Cmd+K / Ctrl+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: "nav-dashboard",
        title: "Overview Dashboard",
        category: "Navigation",
        icon: LayoutDashboard,
        href: "/dashboard",
        keywords: ["home", "main", "stats", "overview"],
      },
      {
        id: "nav-documents",
        title: "Document Repository",
        category: "Navigation",
        icon: FileText,
        href: "/dashboard/documents",
        keywords: ["vault", "files", "all documents", "search"],
      },
      {
        id: "act-new-doc",
        title: "Submit New Document",
        category: "Actions",
        icon: Plus,
        href: "/dashboard/documents/new",
        keywords: ["create", "upload", "ingest", "new"],
      },
      {
        id: "nav-approvals",
        title: "Pending Signatures & Approvals",
        category: "Navigation",
        icon: CheckSquare,
        href: "/dashboard/approvals",
        keywords: ["review", "sign", "director", "coordinator", "signatory"],
      },
      {
        id: "nav-profile",
        title: "My Profile & Security",
        category: "Navigation",
        icon: User,
        href: "/dashboard/profile",
        keywords: ["account", "password", "signature", "audit", "activity"],
      },
      {
        id: "admin-users",
        title: "Admin: User Management",
        category: "Admin",
        icon: Users,
        href: "/dashboard/admin/users",
        keywords: ["admin", "employees", "provision", "bulk import", "roles"],
      },
      {
        id: "admin-units",
        title: "Admin: Unit Configuration",
        category: "Admin",
        icon: Building,
        href: "/dashboard/admin/units",
        keywords: ["admin", "departments", "career", "alumni", "guidance"],
      },
      {
        id: "admin-doctypes",
        title: "Admin: Document Types & Templates",
        category: "Admin",
        icon: FileCode,
        href: "/dashboard/admin/document-types",
        keywords: ["admin", "templates", "classifications", "sla"],
      },
      {
        id: "admin-audit",
        title: "Admin: Compliance Audit Trail",
        category: "Admin",
        icon: Shield,
        href: "/dashboard/admin/audit",
        keywords: ["admin", "ra 10173", "logs", "export", "compliance"],
      },
      {
        id: "admin-delegations",
        title: "Admin: Acting Signatory Delegations",
        category: "Admin",
        icon: Clock,
        href: "/dashboard/admin/delegations",
        keywords: ["admin", "acting director", "acting coordinator", "leaves"],
      },
      {
        id: "admin-notifications",
        title: "Admin: Notification Queue Telemetry",
        category: "Admin",
        icon: Bell,
        href: "/dashboard/admin/notifications",
        keywords: ["admin", "emails", "resend", "cron", "queue"],
      },
      {
        id: "admin-override",
        title: "Admin: Document Override Console",
        category: "Admin",
        icon: SlidersHorizontal,
        href: "/dashboard/admin/documents-override",
        keywords: ["admin", "force approve", "archive", "reassign"],
      },
    ],
    []
  );

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter((cmd) => {
      return (
        cmd.title.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q) ||
        cmd.keywords?.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [commands, query]);

  const executeCommand = (cmd: CommandItem) => {
    setIsOpen(false);
    setQuery("");
    if (cmd.action) {
      cmd.action();
    } else if (cmd.href) {
      router.push(cmd.href);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const safeIndex = selectedIndex >= filteredCommands.length ? 0 : selectedIndex;
      if (filteredCommands[safeIndex]) {
        executeCommand(filteredCommands[safeIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
      <div
        className="glass-panel rounded-3xl max-w-xl w-full border border-white/90 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4.5 py-3.5 border-b border-slate-200/80 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or jump to workspace..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full text-xs font-semibold text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
          />
          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-500">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching workspace routes or commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3.5 py-2.5 rounded-2xl flex items-center justify-between cursor-pointer transition ${
                    isSelected
                      ? "bg-[#0F2962] text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-amber-400"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold block truncate">{cmd.title}</span>
                      <span
                        className={`text-[10px] font-medium block truncate ${
                          isSelected ? "text-blue-200" : "text-slate-400"
                        }`}
                      >
                        {cmd.category}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <CornerDownLeft className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-2" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-medium text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span className="font-mono text-slate-400">SASDMS Navigator</span>
        </div>
      </div>
    </div>
  );
}
