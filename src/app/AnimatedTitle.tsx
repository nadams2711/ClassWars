"use client";

import { motion } from "framer-motion";

export function AnimatedTitle() {
  return (
    <div className="flex flex-col items-center gap-6">
      <h1
        className="font-retro text-4xl sm:text-5xl md:text-7xl text-retro-gold tracking-wider animate-title-glow select-none"
      >
        CLASSWARS
      </h1>

      <motion.p
        className="font-retro text-xs sm:text-sm md:text-base text-retro-purple-light tracking-widest"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
      >
        BATTLE YOUR CLASSMATES
      </motion.p>

      {/* Inline keyframes for the title glow animation */}
      <style jsx global>{`
        @keyframes titleGlow {
          0%, 100% {
            text-shadow:
              0 0 8px rgba(255, 215, 0, 0.6),
              0 0 16px rgba(255, 215, 0, 0.4),
              0 0 32px rgba(255, 215, 0, 0.2),
              0 0 48px rgba(107, 33, 168, 0.15);
          }
          50% {
            text-shadow:
              0 0 12px rgba(168, 85, 247, 0.7),
              0 0 24px rgba(168, 85, 247, 0.5),
              0 0 48px rgba(168, 85, 247, 0.3),
              0 0 72px rgba(255, 215, 0, 0.2);
          }
        }
        .animate-title-glow {
          animation: titleGlow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
