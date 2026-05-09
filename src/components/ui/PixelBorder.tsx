"use client";

import { cn } from "@/lib/utils";

type BorderColor = "purple" | "blue" | "pink" | "green" | "gold" | "white";
type Thickness = 2 | 4;

interface PixelBorderProps {
  children: React.ReactNode;
  className?: string;
  color?: BorderColor;
  thickness?: Thickness;
}

/*
 * Pixel-art style border using box-shadow.
 * Creates a classic SNES-era box by placing solid shadow segments along
 * each edge and at each corner, producing a crisp square-cornered outline.
 */

function buildPixelShadow(color: string, t: number): string {
  // Top, bottom, left, right edges + four corners
  return [
    `0 -${t}px 0 0 ${color}`,
    `0 ${t}px 0 0 ${color}`,
    `-${t}px 0 0 0 ${color}`,
    `${t}px 0 0 0 ${color}`,
    `-${t}px -${t}px 0 0 ${color}`,
    `${t}px -${t}px 0 0 ${color}`,
    `-${t}px ${t}px 0 0 ${color}`,
    `${t}px ${t}px 0 0 ${color}`,
  ].join(",");
}

const colorMap: Record<BorderColor, string> = {
  purple: "#6B21A8",
  blue: "#00D4FF",
  pink: "#FF2D78",
  green: "#39FF14",
  gold: "#FFD700",
  white: "#F1F5F9",
};

export function PixelBorder({
  children,
  className,
  color = "purple",
  thickness = 4,
}: PixelBorderProps) {
  const shadow = buildPixelShadow(colorMap[color], thickness);

  return (
    <div
      className={cn("relative", className)}
      style={{ boxShadow: shadow }}
    >
      {children}
    </div>
  );
}
