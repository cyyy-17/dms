"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-500 overflow-x-auto py-1"
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition rounded-lg p-1 shrink-0"
        title="Go to Dashboard Overview"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="sr-only sm:not-sr-only">Portal</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={item.label + index} className="flex items-center gap-1.5 shrink-0">
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-slate-500 hover:text-slate-800 transition truncate max-w-40 sm:max-w-none"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`font-black text-slate-900 truncate max-w-48 sm:max-w-none ${
                  isLast ? "text-slate-900" : "text-slate-600"
                }`}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
