"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AvatarPickerProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  nickname?: string;
  className?: string;
}

const AVATAR_COLORS = [
  "#FF2D78", "#00D4FF", "#39FF14", "#FFD700", "#A855F7", "#FF6B35",
  "#00FF88", "#FF1493", "#4169E1", "#FF4500", "#00CED1", "#FF69B4",
  "#7B68EE", "#32CD32", "#FF8C00", "#1E90FF", "#DC143C", "#00FA9A",
  "#FF1744", "#00E5FF", "#76FF03", "#FFEA00", "#AA00FF", "#FF3D00",
];

export { AVATAR_COLORS };

export function AvatarPicker({
  selectedIndex,
  onSelect,
  nickname = "",
  className,
}: AvatarPickerProps) {
  const initial = nickname ? nickname.charAt(0).toUpperCase() : "?";
  const selectedColor = AVATAR_COLORS[selectedIndex % AVATAR_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex flex-col items-center gap-5", className)}
    >
      {/* Preview avatar */}
      <div className="flex flex-col items-center gap-2">
        <motion.div
          key={selectedIndex}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="w-20 h-20 flex items-center justify-center relative"
          style={{
            backgroundColor: selectedColor,
            boxShadow: `0 0 24px ${selectedColor}60, 0 0 48px ${selectedColor}20`,
            imageRendering: "pixelated",
          }}
        >
          <span className="font-retro text-2xl text-white drop-shadow-lg">
            {initial}
          </span>
          {/* Pixel corner accents */}
          <div
            className="absolute -top-1 -left-1 w-2 h-2"
            style={{ backgroundColor: selectedColor }}
          />
          <div
            className="absolute -top-1 -right-1 w-2 h-2"
            style={{ backgroundColor: selectedColor }}
          />
          <div
            className="absolute -bottom-1 -left-1 w-2 h-2"
            style={{ backgroundColor: selectedColor }}
          />
          <div
            className="absolute -bottom-1 -right-1 w-2 h-2"
            style={{ backgroundColor: selectedColor }}
          />
        </motion.div>
        <span className="font-retro text-[9px] text-retro-muted uppercase tracking-wider">
          Choose your color
        </span>
      </div>

      {/* 6x4 color grid */}
      <div className="grid grid-cols-6 gap-2">
        {AVATAR_COLORS.map((color, index) => {
          const isSelected = index === selectedIndex;
          return (
            <motion.button
              key={index}
              type="button"
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => onSelect(index)}
              className={cn(
                "w-10 h-10 md:w-11 md:h-11 flex items-center justify-center transition-all duration-150 relative",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-retro-purple-light"
              )}
              style={{
                backgroundColor: color,
                boxShadow: isSelected
                  ? `0 0 0 3px #0A0A1A, 0 0 0 5px ${color}, 0 0 20px ${color}60`
                  : undefined,
                imageRendering: "pixelated",
              }}
              aria-label={`Avatar color ${index + 1}`}
            >
              {/* Letter overlay */}
              <span
                className={cn(
                  "font-retro text-xs text-white transition-opacity duration-150",
                  isSelected ? "opacity-100" : "opacity-0"
                )}
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
              >
                {initial}
              </span>

              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-page border border-white flex items-center justify-center"
                >
                  <span className="text-[8px] text-white">{"\u2714"}</span>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
