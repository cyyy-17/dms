"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X, ShieldCheck, Activity } from "lucide-react";

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Workflow", href: "#workflow" },
    { label: "SAS Units", href: "#units" },
    { label: "E-Signatures", href: "#signatures" },
    { label: "Architecture", href: "#architecture" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header className="sticky top-3.5 z-50 px-3 sm:px-6 lg:px-8 transition-all duration-300">
      <div
        className={`max-w-7xl mx-auto rounded-2xl transition-all duration-300 px-4 sm:px-5 py-2.5 flex items-center justify-between gap-4 ${
          isScrolled
            ? "bg-slate-950/90 backdrop-blur-2xl border border-slate-700/80 shadow-2xl shadow-black/60"
            : "bg-slate-950/75 backdrop-blur-xl border border-slate-800/80 shadow-xl shadow-black/40"
        }`}
      >
        {/* Left: Brand Lockup */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#0F2962] via-[#1E40AF] to-[#0A1A3F] flex items-center justify-center text-amber-400 font-black text-lg shadow-md shadow-blue-950/80 border border-blue-400/30 group-hover:scale-105 transition-transform">
              FA
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-950"></span>
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-base tracking-tight group-hover:text-amber-300 transition-colors whitespace-nowrap">
                SASDMS
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span className="text-[11px] font-mono font-semibold text-slate-400 whitespace-nowrap hidden sm:inline">
                Institutional Portal
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
              FAITH Colleges • Student & Alumni Services
            </span>
          </div>
        </Link>

        {/* Center: Frosted Island Navigation Capsule */}
        <nav className="hidden lg:flex items-center bg-slate-900/80 border border-slate-800/90 rounded-full px-2 py-1 shadow-inner gap-1 shrink-0">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/90 transition-all duration-150 whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Action Controls Hub */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          {/* Live Status Telemetry Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800/80 text-[11px] text-emerald-400 font-mono font-medium whitespace-nowrap">
            <Activity className="w-3 h-3 animate-pulse text-emerald-400 shrink-0" />
            <span>7 Units Live</span>
          </div>

          {/* Sign In Link */}
          <Link
            href="/login"
            className="text-xs font-bold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition duration-150 whitespace-nowrap"
          >
            Sign In
          </Link>

          {/* Staff Access CTA Button */}
          <Link
            href="/register"
            className="text-xs text-slate-950 bg-linear-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 px-4 py-2 rounded-xl shadow-md shadow-amber-400/20 hover:shadow-amber-400/35 transition-all duration-150 flex items-center gap-1.5 font-extrabold transform active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <span>Staff Access</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>

        {/* Mobile Hamburger / Quick Sign-In */}
        <div className="flex sm:hidden items-center gap-2 shrink-0">
          <Link
            href="/login"
            className="text-xs font-bold text-slate-200 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 whitespace-nowrap"
          >
            Sign In
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden max-w-7xl mx-auto mt-2 rounded-2xl border border-slate-800 bg-slate-950/95 backdrop-blur-2xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition text-center whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-xl bg-linear-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 font-black text-xs text-center flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 whitespace-nowrap"
            >
              <span>Apply for Staff Access</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="whitespace-nowrap">Restricted to @firstasia.edu.ph institutional emails</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
