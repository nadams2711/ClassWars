"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface BadgeUnlockProps {
  name: string;
  description: string;
  icon: string;
  onDismiss?: () => void;
}

export function BadgeUnlock({ name, description, icon, onDismiss }: BadgeUnlockProps) {
  const [visible, setVisible] = useState(true);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    // Wait for exit animation to finish before calling onDismiss
    setTimeout(() => onDismiss?.(), 400);
  }, [onDismiss]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [handleDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -120, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -120, opacity: 0, scale: 0.9 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[90vw] max-w-sm"
        >
          <div
            className={cn(
              "bg-card border border-retro-gold/40 overflow-hidden",
              "shadow-[0_4px_30px_rgba(255,215,0,0.15)]"
            )}
          >
            {/* Top accent bar */}
            <div className="h-1 bg-gradient-to-r from-retro-gold via-retro-purple-light to-retro-gold" />

            <div className="flex items-center gap-4 p-4">
              {/* Badge icon with glow */}
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 8px rgba(255,215,0,0.3), 0 0 16px rgba(255,215,0,0.1)",
                    "0 0 16px rgba(255,215,0,0.5), 0 0 32px rgba(255,215,0,0.2)",
                    "0 0 8px rgba(255,215,0,0.3), 0 0 16px rgba(255,215,0,0.1)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-14 h-14 bg-elevated border-2 border-retro-gold/50 flex items-center justify-center shrink-0"
              >
                <span className="text-2xl">{icon}</span>
              </motion.div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-retro text-[8px] uppercase tracking-widest text-retro-gold bg-retro-gold/10 px-1.5 py-0.5">
                    Badge Unlocked
                  </span>
                </div>
                <p
                  className="font-retro text-[10px] text-retro-text truncate"
                  style={{ textShadow: "0 0 8px rgba(255,215,0,0.3)" }}
                >
                  {name}
                </p>
                <p className="font-body text-xs text-retro-muted mt-0.5 line-clamp-2">
                  {description}
                </p>
              </div>

              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="shrink-0 w-6 h-6 flex items-center justify-center text-retro-muted hover:text-retro-text transition-colors"
              >
                <span className="font-retro text-[10px]">{"\u2715"}</span>
              </button>
            </div>

            {/* Auto-dismiss progress bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 4, ease: "linear" }}
              className="h-0.5 bg-retro-gold/40 origin-left"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
