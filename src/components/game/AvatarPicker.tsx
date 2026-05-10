"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PixelAvatar, getSpriteName, getAvatarColor, PIXEL_AVATAR_COLORS } from "./PixelAvatar";

interface AvatarPickerProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  nickname?: string;
  className?: string;
}

// Re-export for backwards compat with lobby page and other consumers
const AVATAR_COLORS = PIXEL_AVATAR_COLORS;
export { AVATAR_COLORS };

export function AvatarPicker({
  selectedIndex,
  onSelect,
  className,
}: AvatarPickerProps) {
  const selectedColor = getAvatarColor(selectedIndex);
  const selectedName = getSpriteName(selectedIndex);

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
          className="p-3 relative"
          style={{
            backgroundColor: `${selectedColor}15`,
            border: `2px solid ${selectedColor}`,
            boxShadow: `0 0 24px ${selectedColor}40, 0 0 48px ${selectedColor}15`,
          }}
        >
          <PixelAvatar avatarIndex={selectedIndex} size="xl" />
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
        <span className="font-retro text-[10px] uppercase tracking-wider" style={{ color: selectedColor }}>
          {selectedName}
        </span>
        <span className="font-retro text-[9px] text-retro-muted uppercase tracking-wider">
          Choose your character
        </span>
      </div>

      {/* 6x4 character grid */}
      <div className="grid grid-cols-6 gap-2">
        {AVATAR_COLORS.map((color, index) => {
          const isSelected = index === selectedIndex;
          return (
            <motion.button
              key={index}
              type="button"
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.15 }}
              onClick={() => onSelect(index)}
              className={cn(
                "flex items-center justify-center p-1 transition-all duration-150 relative",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-retro-purple-light"
              )}
              style={{
                backgroundColor: isSelected ? `${color}20` : "transparent",
                border: isSelected ? `2px solid ${color}` : "2px solid transparent",
                boxShadow: isSelected
                  ? `0 0 0 2px #0A0A1A, 0 0 0 4px ${color}, 0 0 16px ${color}50`
                  : undefined,
              }}
              aria-label={`${getSpriteName(index)} character`}
            >
              <PixelAvatar avatarIndex={index} size="md" />

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
