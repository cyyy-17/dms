"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Search,
  Bell,
  PenLine,
  CheckSquare,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

interface TourStep {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to SASDMS Portal",
    description:
      "Your institutional gateway for Student Affairs and Services document workflows, cryptographic approvals, and statutory compliance.",
    icon: Sparkles,
    tag: "Getting Started",
  },
  {
    title: "Universal Command Palette (Ctrl+K)",
    description:
      "Press Ctrl+K (or Cmd+K) anywhere to instantly jump between workspaces, search tracking numbers, or trigger actions with your keyboard.",
    icon: Search,
    tag: "Navigation",
  },
  {
    title: "Real-Time In-App Notification Center",
    description:
      "The notification bell in your header keeps you synchronized with review requests, delegation alerts, and document sign-offs.",
    icon: Bell,
    tag: "Alerts",
  },
  {
    title: "Smart Anchor Electronic Signatures",
    description:
      "Capture and save your electronic signature in your profile. Apply tamper-evident SHA-256 cryptographic signatures directly onto PDF records.",
    icon: PenLine,
    tag: "Security",
  },
  {
    title: "Sequential Approval Queue & SLA Timers",
    description:
      "Review assigned unit documents with live SLA countdown timers, auto-escalation safeguards, and visual turnaround tracking.",
    icon: CheckSquare,
    tag: "Workflows",
  },
];

const ONBOARDING_STORAGE_KEY = "sasdms_onboarding_completed_v1";

export default function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    try {
      const hasCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!hasCompleted) {
        // Show after a brief delay for smooth entry
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore local storage error
    }
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch {
      // Ignore local storage error
    }
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="glass-panel rounded-3xl max-w-lg w-full border border-white/90 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0F2962] text-[10px] font-black uppercase tracking-wider">
            <span>{step.tag}</span>
            <span>•</span>
            <span>
              {currentStep + 1} of {TOUR_STEPS.length}
            </span>
          </span>

          <button
            type="button"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition cursor-pointer"
            title="Skip Tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Content */}
        <div className="px-6 py-4 space-y-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-[#0F2962] to-blue-600 border-2 border-amber-400/50 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-950/20">
            <StepIcon className="w-8 h-8 text-amber-400" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">{step.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">{step.description}</p>
          </div>
        </div>

        {/* Step Indicator Dots */}
        <div className="flex items-center justify-center gap-1.5 py-2">
          {TOUR_STEPS.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentStep(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentStep ? "w-6 bg-[#0F2962]" : "w-1.5 bg-slate-200 hover:bg-slate-300"
              }`}
            />
          ))}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>{isLastStep ? "Get Started" : "Next Step"}</span>
            {isLastStep ? <Check className="w-4 h-4 text-amber-400" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
