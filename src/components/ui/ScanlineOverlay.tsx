"use client";

import { cn } from "@/lib/utils";

interface ScanlineOverlayProps {
  enabled?: boolean;
  className?: string;
  opacity?: number;
}

/**
 * CRT scanline effect overlay.
 *
 * Renders semi-transparent horizontal lines every 2px to mimic the look of a
 * retro CRT monitor. The overlay is completely non-interactive (pointer-events
 * none) and will disable itself when the user has `prefers-reduced-motion`
 * enabled. The effect is intentionally subtle -- default opacity is 0.05.
 */
export function ScanlineOverlay({
  enabled = true,
  className,
  opacity = 0.05,
}: ScanlineOverlayProps) {
  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 z-50",
        "motion-reduce:hidden",
        className
      )}
      style={{
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0, 0, 0, ${opacity}) 2px,
          rgba(0, 0, 0, ${opacity}) 4px
        )`,
      }}
    />
  );
}
