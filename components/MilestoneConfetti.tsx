"use client";

import { useEffect, useRef } from "react";

interface MilestoneConfettiProps {
  trigger: boolean;
  particleCount?: number;
  duration?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  alpha: number;
  decay: number;
}

const GOLD_SAPPHIRE_PALETTE = [
  "#f59e0b", // Gold
  "#fbbf24", // Amber Light
  "#d97706", // Deep Gold
  "#3b82f6", // Sapphire Blue
  "#60a5fa", // Sky Blue
  "#059669", // Emerald Accent
  "#ffffff", // Shimmer White
];

export default function MilestoneConfetti({
  trigger,
  particleCount = 50,
  duration = 2400,
}: MilestoneConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!trigger) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const originX = canvas.width / 2;
    const originY = canvas.height * 0.4;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 8 + 4;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: Math.random() * 5 + 3,
        color: GOLD_SAPPHIRE_PALETTE[Math.floor(Math.random() * GOLD_SAPPHIRE_PALETTE.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        alpha: 1,
        decay: Math.random() * 0.015 + 0.012,
      });
    }

    let animationFrameId: number;
    const startTime = performance.now();

    const render = (time: number) => {
      const elapsed = time - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let aliveCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18; // Subtle gravity
        p.vx *= 0.98; // Air resistance
        p.rotation += p.vRot;
        p.alpha = Math.max(0, p.alpha - p.decay);

        if (p.alpha > 0) {
          aliveCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;

          // Render minimalist micro-diamond or rounded square
          ctx.beginPath();
          ctx.rect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.fill();
          ctx.restore();
        }
      }

      if (aliveCount > 0 && elapsed < duration) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [trigger, particleCount, duration]);

  if (!trigger) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  );
}
