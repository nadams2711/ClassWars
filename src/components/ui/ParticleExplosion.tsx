"use client";

import { useEffect, useRef, useCallback } from "react";

interface ParticleExplosionProps {
  trigger: boolean;
  /** Width of the canvas in pixels. Defaults to 400. */
  width?: number;
  /** Height of the canvas in pixels. Defaults to 400. */
  height?: number;
  /** Number of particles to spawn. Defaults to 60. */
  particleCount?: number;
  /** Duration in milliseconds before particles fully fade. Defaults to 2000. */
  duration?: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

const COLORS = [
  "#FFD700", // gold
  "#A855F7", // purple
  "#6B21A8", // dark purple
  "#00D4FF", // blue
  "#FF2D78", // pink
  "#39FF14", // green
];

/**
 * Canvas-based particle explosion for victory / reward moments.
 *
 * Pixel-square particles fly outward from the center of the canvas, subject
 * to gravity, and fade out over the configured duration. The canvas is
 * absolutely positioned and pointer-events none so it overlays content
 * without blocking interaction.
 */
export function ParticleExplosion({
  trigger,
  width = 400,
  height = 400,
  particleCount = 60,
  duration = 2000,
  className,
}: ParticleExplosionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const activeRef = useRef(false);

  const spawnParticles = useCallback(() => {
    const particles: Particle[] = [];
    const cx = width / 2;
    const cy = height / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      const maxLife = duration * (0.6 + Math.random() * 0.4);

      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // slight upward bias
        size: 2 + Math.floor(Math.random() * 4) * 2, // pixel-sized: 2, 4, 6, or 8
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 1,
        life: 0,
        maxLife,
      });
    }

    return particles;
  }, [width, height, particleCount, duration]);

  const animate = useCallback(
    (startTime: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const now = performance.now();
      const elapsed = now - startTime;

      // Clear
      ctx.clearRect(0, 0, width, height);

      let aliveCount = 0;
      const gravity = 0.15;

      for (const p of particlesRef.current) {
        p.life += 16; // approximate frame time
        if (p.life >= p.maxLife) continue;

        aliveCount++;

        // Physics
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;

        // Fade based on life
        p.alpha = 1 - p.life / p.maxLife;

        // Draw pixel square
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(
          Math.round(p.x),
          Math.round(p.y),
          p.size,
          p.size
        );
      }

      ctx.globalAlpha = 1;

      if (aliveCount > 0 && elapsed < duration + 500) {
        rafRef.current = requestAnimationFrame(() =>
          animate(startTime)
        );
      } else {
        activeRef.current = false;
        ctx.clearRect(0, 0, width, height);
      }
    },
    [width, height, duration]
  );

  useEffect(() => {
    if (!trigger || activeRef.current) return;

    activeRef.current = true;
    particlesRef.current = spawnParticles();

    const startTime = performance.now();
    rafRef.current = requestAnimationFrame(() => animate(startTime));

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      activeRef.current = false;
    };
  }, [trigger, spawnParticles, animate]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }}
    />
  );
}
