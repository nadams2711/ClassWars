"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  onComplete?: () => void;
  startFrom?: number;
}

const COUNT_COLORS: Record<number | string, { text: string; glow: string }> = {
  3: { text: "text-retro-blue", glow: "0 0 40px rgba(0,212,255,0.6), 0 0 80px rgba(0,212,255,0.3)" },
  2: { text: "text-retro-gold", glow: "0 0 40px rgba(255,215,0,0.6), 0 0 80px rgba(255,215,0,0.3)" },
  1: { text: "text-retro-pink", glow: "0 0 40px rgba(255,45,120,0.6), 0 0 80px rgba(255,45,120,0.3)" },
  GO: { text: "text-retro-green", glow: "0 0 40px rgba(57,255,20,0.6), 0 0 80px rgba(57,255,20,0.3), 0 0 120px rgba(57,255,20,0.15)" },
};

export function CountdownTimer({ onComplete, startFrom = 3 }: CountdownTimerProps) {
  const [current, setCurrent] = useState<number | "GO" | null>(startFrom);
  const [shake, setShake] = useState(false);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (current === null) return;

    const timer = setTimeout(() => {
      if (typeof current === "number" && current > 1) {
        setCurrent(current - 1);
      } else if (typeof current === "number" && current === 1) {
        setCurrent("GO");
        setShake(true);
      } else if (current === "GO") {
        setCurrent(null);
        handleComplete();
      }
    }, current === "GO" ? 800 : 900);

    return () => clearTimeout(timer);
  }, [current, handleComplete]);

  const colorConfig = current !== null ? COUNT_COLORS[current] ?? COUNT_COLORS[3] : COUNT_COLORS[3];
  const displayText = current !== null ? String(current) : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-page/90",
        shake && "animate-shake"
      )}
    >
      {/* Radial pulse background */}
      <AnimatePresence>
        {current !== null && (
          <motion.div
            key={String(current)}
            initial={{ scale: 0.3, opacity: 0.6 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute w-40 h-40 rounded-full"
            style={{
              background: `radial-gradient(circle, ${
                current === "GO"
                  ? "rgba(57,255,20,0.3)"
                  : current === 1
                  ? "rgba(255,45,120,0.3)"
                  : current === 2
                  ? "rgba(255,215,0,0.3)"
                  : "rgba(0,212,255,0.3)"
              }, transparent)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Number display */}
      <AnimatePresence mode="wait">
        {current !== null && (
          <motion.div
            key={String(current)}
            initial={{ scale: 0, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <span
              className={cn(
                "font-retro select-none",
                current === "GO" ? "text-8xl md:text-[10rem]" : "text-9xl md:text-[12rem]",
                colorConfig.text
              )}
              style={{
                textShadow: colorConfig.glow,
              }}
            >
              {displayText}
            </span>

            {/* Underline accent */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className={cn(
                "absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 w-3/4 origin-center",
                current === "GO"
                  ? "bg-retro-green"
                  : current === 1
                  ? "bg-retro-pink"
                  : current === 2
                  ? "bg-retro-gold"
                  : "bg-retro-blue"
              )}
              style={{
                boxShadow: colorConfig.glow,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative corner markers */}
      <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-retro-muted/30" />
      <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-retro-muted/30" />
      <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-retro-muted/30" />
      <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-retro-muted/30" />

      {/* "GET READY" text */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="absolute bottom-20 font-retro text-xs text-retro-muted tracking-widest"
      >
        GET READY
      </motion.p>
    </motion.div>
  );
}
