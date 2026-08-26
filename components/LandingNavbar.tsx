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
    { label: "Workflow Engine", href: "#workflow" },
    { label: "SAS Units", href: "#units" },
    { label: "Smart Signatures", href: "#signatures" },
    { label: "Governance & Arch", href: "#architecture" },
    { label: "Verify Document", href: "#tracker" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/90 shadow-2xl shadow-black/40 py-3"
          : "bg-slate-950/60 backdrop-blur-md border-b border-slate-800/40 py-4.5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Lockup */}
        <Link href="/" className="flex items-center space-x-3.5 group">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-[#0F2962] via-[#1E40AF] to-[#0A1A3F] flex items-center justify-center text-amber-400 font-black text-xl shadow-lg shadow-blue-950/80 border border-blue-400/40 group-hover:scale-105 transition-transform">
              FA
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-lg tracking-tight group-hover:text-amber-300 transition-colors">
                SASDMS
              </span>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                v2.6 Enterprise
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                FAITH Colleges • Student & Alumni Services
              </span>
              <span className="text-[11px] text-slate-400 font-medium sm:hidden">
                FAITH Colleges SAS
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-6 text-xs font-semibold text-slate-300">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-amber-400 transition-colors py-1 relative group"
            >
              <span>{link.label}</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 transition-all duration-200 group-hover:w-full rounded-full" />
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center space-x-3">
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-emerald-400 font-mono font-medium">
            <Activity className="w-3 h-3 animate-pulse text-emerald-400" />
            <span>7 Units Online</span>
          </div>

          <Link
            href="/login"
            className="text-xs font-bold text-slate-200 hover:text-white px-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-900/70 hover:bg-slate-800 transition duration-200 shadow-sm"
          >
            Sign In
          </Link>

          <Link
            href="/register"
            className="text-xs text-slate-950 bg-linear-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 px-4.5 py-2.5 rounded-xl shadow-lg shadow-amber-400/20 hover:shadow-amber-400/35 transition-all duration-200 flex items-center gap-1.5 font-black transform active:scale-95 cursor-pointer"
          >
            <span>Staff Access</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            href="/login"
            className="text-xs font-bold text-slate-200 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800"
          >
            Sign In
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-xl bg-linear-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 font-black text-xs text-center flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20"
            >
              <span>Apply for Staff Access</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Restricted to @firstasia.edu.ph institutional emails</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
