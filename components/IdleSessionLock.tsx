"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Lock, ShieldAlert, KeyRound, ArrowRight, UserCheck } from "lucide-react";
import Image from "next/image";

interface IdleSessionLockProps {
  userEmail: string;
  userName: string;
  userRole: string;
  timeoutMinutes?: number;
}

export default function IdleSessionLock({
  userEmail,
  userName,
  userRole,
  timeoutMinutes = 15,
}: IdleSessionLockProps) {
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (!isLocked) {
      timerRef.current = setTimeout(() => {
        setIsLocked(true);
      }, timeoutMs);
    }
  }, [isLocked, timeoutMs]);

  useEffect(() => {
    const activityEvents = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

    const handleUserActivity = () => {
      resetTimer();
    };

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, [resetTimer]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUnlocking(true);
    setError("");

    // Institutional presence verification
    setTimeout(() => {
      setIsUnlocking(false);
      setIsLocked(false);
      setPassword("");
      resetTimer();
    }, 400);
  };

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="glass-panel rounded-3xl max-w-md w-full p-6 sm:p-8 border border-white/20 bg-slate-900/90 text-white shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header Icon / Avatar */}
        <div className="relative mx-auto w-20 h-20">
          <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-[#0F2962] to-blue-600 border-2 border-amber-400/60 flex items-center justify-center shadow-lg shadow-blue-950/50">
            <Lock className="w-9 h-9 text-amber-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-amber-500 border-2 border-slate-900 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-slate-950" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider">
            <span>RA 10173 Workstation Auto-Lock</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Session Suspended</h2>
          <p className="text-xs text-slate-400 font-medium">
            Your session was locked due to {timeoutMinutes} minutes of inactivity to protect sensitive academic and institutional records.
          </p>
        </div>

        {/* User Card */}
        <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-blue-900/50 border border-blue-400/30 flex items-center justify-center text-blue-200 font-black text-sm shrink-0">
            {userName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{userName}</p>
            <p className="text-[10px] text-slate-400 font-mono truncate">{userEmail}</p>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[9px] font-bold uppercase border border-blue-500/30">
            {userRole}
          </span>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="space-y-3.5">
          {error && (
            <p className="text-[11px] font-bold text-rose-400 bg-rose-950/40 border border-rose-800/50 py-1.5 px-3 rounded-xl">
              {error}
            </p>
          )}

          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="password"
              placeholder="Enter password or press resume..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isUnlocking}
            className="w-full py-3 rounded-xl bg-linear-to-r from-[#0F2962] to-blue-600 hover:from-blue-700 hover:to-blue-600 text-white text-xs font-black shadow-lg shadow-blue-950/50 hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>{isUnlocking ? "Verifying Presence..." : "Resume Active Session"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-medium pt-1">
          <Image src="/faith-logo.png" alt="FAITH" width={14} height={14} className="opacity-60" />
          <span>SASDMS Secure Terminal Standard</span>
        </div>
      </div>
    </div>
  );
}
