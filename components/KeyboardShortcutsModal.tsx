"use client";

import { useState, useEffect, useCallback } from "react";
import { Keyboard, X } from "lucide-react";

interface ShortcutGroup {
  category: string;
  items: Array<{ keys: string[]; description: string }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: "Universal Navigation",
    items: [
      { keys: ["Ctrl", "K"], description: "Open Universal Command Palette & Workspace Jump" },
      { keys: ["?"], description: "Open Keyboard Shortcuts Cheat Sheet" },
      { keys: ["Esc"], description: "Close any open modal, dialog, or drawer" },
    ],
  },
  {
    category: "Document Workflows",
    items: [
      { keys: ["Ctrl", "P"], description: "Export & Print Secure Watermarked PDF" },
      { keys: ["Ctrl", "Shift", "N"], description: "Ingest New Document Draft" },
    ],
  },
  {
    category: "Security & RA 10173 Compliance",
    items: [
      { keys: ["Ctrl", "Shift", "L"], description: "Manually Lock Workstation Session" },
    ],
  },
];

export default function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Check if target is an input or textarea
    const target = e.target as HTMLElement;
    const isInput =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable;

    if (e.key === "?" && !isInput && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if ((e.ctrlKey || e.metaKey) && e.key === "/" && !isInput) {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === "Escape" && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="glass-panel rounded-3xl max-w-lg w-full border border-white/90 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0F2962] flex items-center justify-center border border-blue-100 shadow-xs">
              <Keyboard className="w-4 h-4 text-[#0F2962]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                Keyboard Shortcuts Cheat Sheet
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Speed up navigation and workflows with global hotkeys
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcut Groups */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category} className="space-y-2.5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.category}
              </h3>

              <div className="space-y-1.5">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-slate-700">{item.description}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-300 font-mono text-[10px] font-bold text-slate-700 shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold">?</kbd> anywhere to toggle</span>
          <button
            onClick={() => setIsOpen(false)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
