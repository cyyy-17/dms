"use client";

import { useState } from "react";
import {
  Compass,
  GraduationCap,
  Users,
  Award,
  Scale,
  Briefcase,
  HeartHandshake,
  Building2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  type LucideIcon,
} from "lucide-react";

export interface SasUnitItem {
  code: string;
  name: string;
  desc: string;
  badge: string;
  color: string;
  category?: "counseling" | "career" | "student_life" | "governance";
  iconName?: string;
  sla?: string;
  confidentiality?: "Maximum" | "High" | "Standard";
  sampleDocs?: string[];
}

interface LandingUnitExplorerProps {
  units?: SasUnitItem[];
}

const ICON_MAP: Record<string, LucideIcon> = {
  GCO: Compass,
  AAPO: GraduationCap,
  SOA: Users,
  SFA: Award,
  DSW: Scale,
  CSIR: Briefcase,
  CEE: HeartHandshake,
};

export default function LandingUnitExplorer({ units = [] }: LandingUnitExplorerProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  const displayUnits = units || [];

  const filteredUnits = displayUnits.filter((unit) => {
    if (selectedFilter === "all") return true;
    return unit.category === selectedFilter;
  });

  const filterTabs = [
    { id: "all", label: `All SAS Units (${displayUnits.length})` },
    { id: "counseling", label: "Counseling & Welfare" },
    { id: "career", label: "Career & Placement" },
    { id: "student_life", label: "Student Life & Aid" },
    { id: "governance", label: "Discipline & Extension" },
  ];

  return (
    <section id="units" className="py-24 bg-slate-900/60 border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-950 border border-blue-600/40 text-blue-300 text-xs font-bold shadow-inner">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Unit-Scoped RBAC Tenancy Matrix</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {displayUnits.length} Integrated SAS Department Units
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Every unit in Student & Alumni Services operates with dedicated role permissions, specialized document taxonomies, and cross-unit visibility for the Department Director.
          </p>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                selectedFilter === tab.id
                  ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 font-black"
                  : "bg-slate-950/80 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Units Grid */}
        {filteredUnits.length === 0 ? (
          <div className="p-12 text-center bg-slate-950/60 rounded-3xl border border-slate-800 text-slate-400 space-y-2">
            <Building2 className="w-10 h-10 mx-auto text-slate-600" />
            <p className="font-bold text-slate-300 text-sm">No Department Units Configured Yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Administrator has not yet provisioned departmental units. Units can be configured in the Staff & Admin Portal.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUnits.map((unit) => {
              const Icon = ICON_MAP[unit.code.toUpperCase()] || Building2;
              const isExpanded = expandedUnit === unit.code;

              return (
                <div
                  key={unit.code}
                  className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-600 transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1 shadow-xl group backdrop-blur-xl"
                >
                  <div className="space-y-4">
                    {/* Card Top Row */}
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl bg-linear-to-br ${unit.color || "from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30"} border flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                          {unit.sla || "< 24h SLA"}
                        </span>
                        <span className="font-mono text-xs font-black px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-amber-400">
                          {unit.code}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                        {unit.name}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1.5 font-normal">
                        {unit.desc}
                      </p>
                    </div>

                    {/* Expandable Document Taxonomy Preview */}
                    {isExpanded && unit.sampleDocs && (
                      <div className="pt-3 border-t border-slate-900 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          Official Document Taxonomies:
                        </span>
                        <div className="space-y-1.5">
                          {unit.sampleDocs.map((doc, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-slate-800"
                            >
                              <FileCheck2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">{doc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Footer with Expand Trigger */}
                  <div className="pt-3 border-t border-slate-900/90 flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{unit.badge}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setExpandedUnit(isExpanded ? null : unit.code)}
                      className="text-slate-400 hover:text-amber-400 flex items-center gap-1 transition"
                    >
                      <span>{isExpanded ? "Hide" : "Taxonomy"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
