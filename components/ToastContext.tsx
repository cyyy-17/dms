"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function playNotificationChime(type: ToastType) {
  if (typeof window === "undefined") return;
  try {
    const isAudioMuted = localStorage.getItem("sasdms_audio_muted") === "true";
    if (isAudioMuted) return;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const freq = type === "error" ? 260 : type === "warning" ? 440 : 587.33;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (type === "success") {
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    }

    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // Ignore autoplay restriction
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, type = "info", duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastItem = { id, title, message, type, duration };

      playNotificationChime(type);
      setToasts((prev) => [...prev.slice(-4), newToast]); // Keep up to 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
          container: "bg-slate-900/95 border-emerald-500/40 text-emerald-100 shadow-emerald-950/40",
          accent: "bg-emerald-500",
        };
      case "error":
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
          container: "bg-slate-900/95 border-rose-500/40 text-rose-100 shadow-rose-950/40",
          accent: "bg-rose-500",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
          container: "bg-slate-900/95 border-amber-500/40 text-amber-100 shadow-amber-950/40",
          accent: "bg-amber-500",
        };
      case "info":
      default:
        return {
          icon: <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />,
          container: "bg-slate-900/95 border-blue-500/40 text-blue-100 shadow-blue-950/40",
          accent: "bg-blue-500",
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      {/* Floating Toast Notification Viewport */}
      <aside
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const { icon, container, accent } = getToastStyles(toast.type);

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto rounded-2xl p-4 border backdrop-blur-2xl shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in relative overflow-hidden flex items-start gap-3 ${container}`}
            >
              {/* Colored left indicator pill */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accent}`} />

              {icon}

              <div className="flex-1 min-w-0 pr-2">
                {toast.title && (
                  <h4 className="text-xs font-black tracking-tight text-white block mb-0.5">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs font-medium text-slate-300 leading-relaxed wrap-break-word">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function useOptionalToast() {
  return useContext(ToastContext);
}
