"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/actions/auth";
import { Clock, LogOut, CheckCircle } from "lucide-react";

// Inactivity configuration: 13 minutes warning, 15 minutes auto-logout
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_BEFORE_LOGOUT_MS = 2 * 60 * 1000; // 2 minutes warning window

export default function SessionTimeoutManager() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(120);

  const lastActivityRef = useRef<number>(0);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Perform automatic sign out
  const handleAutoLogout = useCallback(async () => {
    setShowWarning(false);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    try {
      await signOutAction();
    } catch {
      // Ignore if session already destroyed
    }
    router.push("/login?reason=session_timeout");
  }, [router]);

  // Reset inactivity timer on user interaction
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (showWarning) {
      setShowWarning(false);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, [showWarning]);

  useEffect(() => {
    if (!lastActivityRef.current) {
      lastActivityRef.current = Date.now();
    }

    const checkActivity = () => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      const timeUntilTimeout = INACTIVITY_TIMEOUT_MS - elapsed;

      if (timeUntilTimeout <= 0) {
        handleAutoLogout();
      } else if (timeUntilTimeout <= WARNING_BEFORE_LOGOUT_MS && !showWarning) {
        setShowWarning(true);
        setSecondsRemaining(Math.ceil(timeUntilTimeout / 1000));
      }
    };

    const interval = setInterval(checkActivity, 1000);

    // Activity event listeners
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    const handleUserActivity = () => {
      if (!showWarning) {
        lastActivityRef.current = Date.now();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      clearInterval(interval);
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [showWarning, handleAutoLogout]);

  // Handle countdown tick when warning is active
  useEffect(() => {
    if (showWarning) {
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            handleAutoLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [showWarning, handleAutoLogout]);

  if (!showWarning) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel border-gradient-gold rounded-3xl max-w-md w-full p-6 sm:p-7 bg-white shadow-2xl border border-white/90 space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner animate-pulse">
          <Clock className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-slate-900">Session Inactivity Warning</h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            For security compliance (RA 10173), your active session will expire automatically due to inactivity.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 block">
            Time Remaining Before Logout
          </span>
          <span className="text-3xl font-black font-mono text-amber-900 block mt-1">
            {formattedTime}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={resetTimer}
            className="flex-1 py-3 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white text-xs font-extrabold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:scale-98"
          >
            <CheckCircle className="w-4 h-4 text-amber-400" />
            <span>Stay Signed In</span>
          </button>

          <button
            type="button"
            onClick={handleAutoLogout}
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold border border-slate-200 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
