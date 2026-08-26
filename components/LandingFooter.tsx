"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-16 text-xs border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top Tier: Branding & Quick Links */}
        <div className="grid md:grid-cols-12 gap-8 pb-10 border-b border-slate-800/80">
          {/* Brand Col (Span 6) */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-[#0F2962] to-[#1E40AF] text-amber-400 font-black flex items-center justify-center text-lg shadow-md border border-blue-500/30">
                FA
              </div>
              <div>
                <span className="font-extrabold text-white text-base block tracking-tight">
                  First Asia Institute of Technology and Humanities (FAITH Colleges)
                </span>
                <span className="text-slate-400 text-xs block">
                  Student & Alumni Services Document Management System (SASDMS)
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md font-normal">
              Official institutional document governance platform supporting unit-scoped tenancy, cryptographic SHA-256 integrity verification, and sequential multi-signatory routing in compliance with Philippine Republic Act 10173.
            </p>

            {/* Live Telemetry Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 font-mono">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>System Operational • Zero-Trust Perimeter Active • Latency &lt; 15ms</span>
            </div>
          </div>

          {/* Navigation Links Col (Span 3) */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-200 block">
              Quick Navigation
            </span>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="#workflow" className="hover:text-amber-400 transition">
                  Sequential Routing Engine
                </a>
              </li>
              <li>
                <a href="#units" className="hover:text-amber-400 transition">
                  SAS Department Units
                </a>
              </li>
              <li>
                <a href="#signatures" className="hover:text-amber-400 transition">
                  Smart Anchor E-Signatures
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-amber-400 transition">
                  Governance & Architecture
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-amber-400 transition">
                  Institutional FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Institutional Access Col (Span 3) */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-200 block">
              Staff & Administration
            </span>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/login" className="hover:text-amber-400 transition flex items-center gap-1">
                  <span>Portal Login</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-amber-400 transition flex items-center gap-1">
                  <span>Self-Registration</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-amber-400 transition flex items-center gap-1">
                  <span>Staff Dashboard</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
            </ul>

            <div className="pt-2 text-[11px] text-slate-500">
              <span>Restricted exclusively to authorized university employees and faculty coordinators.</span>
            </div>
          </div>
        </div>

        {/* Bottom Tier: Campus Location & Legal Disclosures */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-medium">
          <p>
            © {new Date().getFullYear()} FAITH Colleges. All rights reserved. Republic Act 10173 (Data Privacy Act of 2012) Compliant.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span>Tanauan City, Batangas 4232, Philippines</span>
            <span>•</span>
            <span>SAS Institutional Records Vault</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
