"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ShieldCheck, Lock, Cpu, Sparkles, CheckCircle2 } from "lucide-react";

interface AuthGatewayTransitionProps {
  user: {
    firstName: string;
    lastName: string;
    role: string;
    unitCode: string | null;
    unitName: string | null;
  };
  onComplete: () => void;
}

function emptySubscribe() {
  return () => {};
}

export default function AuthGatewayTransition({
  user,
  onComplete,
}: AuthGatewayTransitionProps) {
  const [step, setStep] = useState<number>(1);
  const [isExiting, setIsExiting] = useState(false);

  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    // Lock background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Step 1 -> Step 2 (300ms)
    const timer1 = setTimeout(() => {
      setStep(2);
    }, 300);

    // Step 2 -> Step 3 (600ms) - Begin route handoff
    const timer2 = setTimeout(() => {
      setStep(3);
    }, 600);

    // Step 3 -> Exit Content Aperture (850ms)
    const timer3 = setTimeout(() => {
      setIsExiting(true);
    }, 850);

    // Final Handshake: Call onComplete while background stays dark solid slate (1050ms)
    const timer4 = setTimeout(() => {
      onComplete();
    }, 1050);

    return () => {
      document.body.style.overflow = originalOverflow;
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  if (!isMounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-99999 bg-slate-950 flex flex-col items-center justify-center p-4 select-none overflow-hidden animate-in fade-in duration-150"
    >
      {/* Ambient Radial Lights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-140 h-140 bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-grid-cyber opacity-30 pointer-events-none" />

      {/* Center Quantum Gateway Portal - Scales and apertures out while dark backdrop stays solid */}
      <div
        className={`relative z-10 flex flex-col items-center text-center max-w-md w-full space-y-6 transition-all ${
          isExiting ? "animate-gateway-out pointer-events-none" : "animate-gateway-in"
        }`}
      >
        {/* Animated Central Emblem with Circular Laser Ring */}
        <div className="relative flex items-center justify-center w-36 h-36">
          {/* Outer Rotating Laser Scanner Track */}
          <div className="absolute inset-0 rounded-full border border-cyan-500/30 p-1">
            <div className="w-full h-full rounded-full border border-dashed border-cyan-400/40 animate-gateway-laser-spin" />
          </div>

          {/* Cyan Glow Aura */}
          <div className="absolute inset-2 rounded-full bg-linear-to-tr from-blue-600/20 via-cyan-500/20 to-amber-500/20 blur-md animate-pulse" />

          {/* Shockwave Ripple */}
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 animate-shockwave pointer-events-none" />

          {/* Center Institutional Crest Plaque */}
          <div className="relative w-24 h-24 rounded-3xl bg-slate-900/90 border border-amber-400/50 p-3 shadow-2xl flex items-center justify-center backdrop-blur-xl">
            <Image
              src="/images/faith-crest.png"
              alt="FAITH Colleges Crest"
              width={72}
              height={72}
              priority
              className="w-auto h-full object-contain drop-shadow-md"
            />
          </div>
        </div>

        {/* Telemetry Progress Indicator */}
        <div className="space-y-3 w-full">
          {/* Institutional Heading */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-[10px] font-mono font-bold text-cyan-300 shadow-xs">
              <Cpu className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>Quantum Gateway Authorization</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {step === 3 ? `Welcome, ${user.firstName}!` : "Establishing Secure Session"}
            </h2>
          </div>

          {/* Dynamic Stepped Telemetry Stream */}
          <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-left space-y-2 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-800/80 pb-1.5">
              <span>SECURITY PROTOCOL</span>
              <span className="text-amber-400 font-bold">FAITH-SAS-256</span>
            </div>

            {/* Step 1 */}
            <div
              className={`flex items-center gap-2 text-[11px] transition-all duration-200 ${
                step >= 1 ? "text-emerald-400 opacity-100" : "text-slate-600 opacity-40"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span className="truncate">Identity Verified • @firstasia.edu.ph</span>
            </div>

            {/* Step 2 */}
            <div
              className={`flex items-center gap-2 text-[11px] transition-all duration-200 ${
                step >= 2 ? "text-cyan-300 opacity-100" : "text-slate-600 opacity-40"
              }`}
            >
              {step >= 2 ? (
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 shrink-0 text-slate-600" />
              )}
              <span className="truncate">
                RBAC Clearance • {user.role} {user.unitCode ? `[${user.unitCode}]` : ""}
              </span>
            </div>

            {/* Step 3 */}
            <div
              className={`flex items-center gap-2 text-[11px] transition-all duration-200 ${
                step >= 3 ? "text-amber-300 opacity-100" : "text-slate-600 opacity-40"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span className="truncate">Session Keys Active • Launching Workspace...</span>
            </div>
          </div>
        </div>

        {/* Minimalist Linear Progress Bar */}
        <div className="w-full max-w-xs space-y-1.5">
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-linear-to-r from-blue-500 via-cyan-400 to-amber-400 rounded-full transition-all duration-300 ease-out"
              style={{
                width: step === 1 ? "35%" : step === 2 ? "75%" : "100%",
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>SAS DMS v2.4</span>
            <span className="text-cyan-400 font-bold">{step === 3 ? "100%" : step === 2 ? "75%" : "35%"}</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
