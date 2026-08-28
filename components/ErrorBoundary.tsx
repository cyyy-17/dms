"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by SASDMS ErrorBoundary:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel p-8 rounded-3xl border border-rose-200/80 bg-rose-50/50 text-center space-y-4 shadow-sm my-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs border border-rose-200">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              {this.props.fallbackTitle || "An unexpected interface error occurred"}
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto font-medium mt-1">
              {this.props.fallbackMessage ||
                "This section encountered an issue while rendering. Your data remains safe and preserved on record."}
            </p>
            {this.state.error?.message && (
              <code className="text-[11px] font-mono text-rose-700 bg-white/80 px-3 py-1 rounded-xl border border-rose-200 inline-block mt-3 max-w-full truncate">
                {this.state.error.message}
              </code>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-[#0F2962] text-white font-bold text-xs shadow-md hover:bg-[#091a42] transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Component</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
