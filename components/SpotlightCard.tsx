"use client";

import { useRef, useCallback, ReactNode, HTMLAttributes } from "react";

interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  variant?: "blue" | "gold" | "emerald";
}

export default function SpotlightCard({
  children,
  className = "",
  variant = "blue",
  ...props
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  }, []);

  const variantClass =
    variant === "gold"
      ? "spotlight-card-gold"
      : variant === "emerald"
      ? "spotlight-card-emerald"
      : "";

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`spotlight-card ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
