"use client";

import { cn } from "@/lib/utils";

type GlowColor = "purple" | "blue" | "pink" | "green" | "gold" | "none";
type Padding = "none" | "sm" | "md" | "lg";

interface RetroCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: GlowColor;
  hoverable?: boolean;
  padding?: Padding;
}

const glowStyles: Record<GlowColor, string> = {
  purple:
    "shadow-[0_0_0_2px_#6B21A8,0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_0_2px_#A855F7,0_0_30px_rgba(168,85,247,0.3)]",
  blue: "shadow-[0_0_0_2px_#0e7490,0_0_20px_rgba(0,212,255,0.15)] hover:shadow-[0_0_0_2px_#00D4FF,0_0_30px_rgba(0,212,255,0.3)]",
  pink: "shadow-[0_0_0_2px_#9f1239,0_0_20px_rgba(255,45,120,0.15)] hover:shadow-[0_0_0_2px_#FF2D78,0_0_30px_rgba(255,45,120,0.3)]",
  green:
    "shadow-[0_0_0_2px_#065f46,0_0_20px_rgba(57,255,20,0.15)] hover:shadow-[0_0_0_2px_#39FF14,0_0_30px_rgba(57,255,20,0.3)]",
  gold: "shadow-[0_0_0_2px_#b8860b,0_0_20px_rgba(255,215,0,0.15)] hover:shadow-[0_0_0_2px_#FFD700,0_0_30px_rgba(255,215,0,0.3)]",
  none: "shadow-[0_0_0_2px_rgba(107,33,168,0.3)]",
};

const paddingStyles: Record<Padding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

export function RetroCard({
  children,
  className,
  glow = "purple",
  hoverable = false,
  padding = "md",
}: RetroCardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-none transition-all duration-300",
        glowStyles[glow],
        paddingStyles[padding],
        hoverable &&
          "cursor-pointer hover:-translate-y-1 hover:brightness-110",
        className
      )}
    >
      {children}
    </div>
  );
}
