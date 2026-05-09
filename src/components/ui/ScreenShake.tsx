"use client";

import { cn } from "@/lib/utils";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

type Intensity = "low" | "medium" | "high";

interface ScreenShakeProps {
  children: React.ReactNode;
  trigger: boolean;
  intensity?: Intensity;
  className?: string;
  duration?: number;
}

const intensityMap: Record<Intensity, number> = {
  low: 3,
  medium: 6,
  high: 12,
};

/**
 * Wraps its children in a Framer Motion container that plays a short random
 * shake animation whenever `trigger` transitions to `true`.
 *
 * The shake generates a rapid sequence of random x/y offsets over the
 * configured duration (default 400ms), then returns to the origin.
 */
export function ScreenShake({
  children,
  trigger,
  intensity = "medium",
  className,
  duration = 400,
}: ScreenShakeProps) {
  const controls = useAnimation();
  const offset = intensityMap[intensity];

  useEffect(() => {
    if (!trigger) return;

    const steps = 8;
    const stepDuration = duration / steps;

    // Build a sequence of random offsets
    const xKeyframes: number[] = [];
    const yKeyframes: number[] = [];

    for (let i = 0; i < steps; i++) {
      xKeyframes.push(Math.round((Math.random() - 0.5) * 2 * offset));
      yKeyframes.push(Math.round((Math.random() - 0.5) * 2 * offset));
    }

    // Return to origin at the end
    xKeyframes.push(0);
    yKeyframes.push(0);

    controls.start({
      x: xKeyframes,
      y: yKeyframes,
      transition: {
        duration: duration / 1000,
        times: xKeyframes.map((_, i) => i / (xKeyframes.length - 1)),
        ease: "easeInOut",
      },
    });
  }, [trigger, controls, offset, duration]);

  return (
    <motion.div animate={controls} className={cn(className)}>
      {children}
    </motion.div>
  );
}
