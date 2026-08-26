"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, MoveHorizontal } from "lucide-react";

interface DataTableWrapperProps {
  children: React.ReactNode;
  className?: string;
  showArrowControls?: boolean;
}

export default function DataTableWrapper({
  children,
  className = "",
  showArrowControls = true,
}: DataTableWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const hasOverflow = el.scrollWidth > el.clientWidth + 2;
    setIsOverflowing(hasOverflow);
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScrollability();

    const handleScroll = () => {
      checkScrollability();
    };

    // Non-passive wheel handler: mouse wheel down/up scrolls table left/right
    const handleWheel = (e: WheelEvent) => {
      // If table is horizontally scrollable and wheel is moving vertically
      if (el.scrollWidth > el.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const isAtLeftEdge = el.scrollLeft <= 0;
        const isAtRightEdge = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;

        // If trying to scroll right and not at right edge, or scroll left and not at left edge
        if ((e.deltaY > 0 && !isAtRightEdge) || (e.deltaY < 0 && !isAtLeftEdge)) {
          e.preventDefault();
          el.scrollBy({
            left: e.deltaY * 1.2,
            behavior: "auto",
          });
          checkScrollability();
        }
      }
    };

    // Keyboard Arrow Keys (Left / Right)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === el || el.contains(document.activeElement)) {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          el.scrollBy({ left: 120, behavior: "smooth" });
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          el.scrollBy({ left: -120, behavior: "smooth" });
        }
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("scroll", handleScroll, { passive: true });
    el.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", checkScrollability);

    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("scroll", handleScroll);
      el.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", checkScrollability);
    };
  }, [checkScrollability]);

  const scrollByAmount = (amount: number) => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Visual Scroll Controls Toolbar (appears when table has horizontal overflow) */}
      {showArrowControls && isOverflowing && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50/95 border-b border-slate-200/80 text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-1.5 text-slate-600 font-bold">
            <MoveHorizontal className="w-3.5 h-3.5 text-[#0F2962]" />
            <span>Table Navigation • Mouse Wheel or Arrows scroll horizontally</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!canScrollLeft}
              onClick={() => scrollByAmount(-220)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0F2962] focus-visible:outline-none"
              title="Scroll table left (Arrow Left / Wheel Up)"
              aria-label="Scroll table left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!canScrollRight}
              onClick={() => scrollByAmount(220)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0F2962] focus-visible:outline-none"
              title="Scroll table right (Arrow Right / Wheel Down)"
              aria-label="Scroll table right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Horizontally Scrollable Table Container */}
      <div
        ref={containerRef}
        tabIndex={0}
        className="overflow-x-auto focus-visible:ring-1 focus-visible:ring-[#0F2962]/40 focus-visible:outline-none select-auto"
      >
        {children}
      </div>
    </div>
  );
}
