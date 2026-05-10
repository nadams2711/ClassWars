"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EmojiSliderItem {
  prompt: string;
  leftEmoji: string;
  rightEmoji: string;
}

interface EmojiSliderProps {
  items: EmojiSliderItem[];
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export function EmojiSlider({ items, onSubmit, disabled = false }: EmojiSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [values, setValues] = useState<number[]>([]);
  const [sliderValue, setSliderValue] = useState(50);
  const [finished, setFinished] = useState(false);

  const handleNext = useCallback(() => {
    if (disabled) return;
    const newValues = [...values, sliderValue];
    setValues(newValues);

    if (currentIndex + 1 >= items.length) {
      setFinished(true);
      const result = items.map((item, i) => ({
        prompt: item.prompt,
        value: newValues[i],
        leftEmoji: item.leftEmoji,
        rightEmoji: item.rightEmoji,
      }));
      onSubmit(JSON.stringify({ type: "emoji_slider", ratings: result }));
    } else {
      setCurrentIndex(currentIndex + 1);
      setSliderValue(50);
    }
  }, [disabled, values, sliderValue, currentIndex, items, onSubmit]);

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="font-retro text-2xl text-retro-gold"
          style={{ textShadow: "0 0 20px rgba(255,215,0,0.5)" }}
        >
          ALL RATED!
        </motion.div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 font-retro text-[9px] text-retro-muted">
              <span>{item.leftEmoji}</span>
              <div className="flex-1 h-2 bg-page/60 border border-retro-muted/20">
                <div
                  className="h-full bg-retro-gold"
                  style={{ width: `${values[i]}%` }}
                />
              </div>
              <span>{item.rightEmoji}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const item = items[currentIndex];
  const progress = (currentIndex / items.length) * 100;

  // Emoji size scales based on slider position
  const leftSize = 2 + (1 - sliderValue / 100) * 2;
  const rightSize = 2 + (sliderValue / 100) * 2;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="h-2 bg-page/60 w-full border border-retro-purple/20">
        <motion.div
          className="h-full bg-retro-gold"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <p className="font-retro text-[9px] text-retro-muted text-center uppercase tracking-wider">
        {currentIndex + 1} / {items.length}
      </p>

      {/* Prompt */}
      <p className="font-retro text-xs text-retro-text text-center uppercase tracking-wider">
        {item.prompt}
      </p>

      {/* Emoji display */}
      <div className="flex items-center justify-between px-4">
        <motion.span
          animate={{ fontSize: `${leftSize}rem` }}
          transition={{ duration: 0.1 }}
        >
          {item.leftEmoji}
        </motion.span>
        <motion.span
          animate={{ fontSize: `${rightSize}rem` }}
          transition={{ duration: 0.1 }}
        >
          {item.rightEmoji}
        </motion.span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={100}
        value={sliderValue}
        onChange={(e) => setSliderValue(Number(e.target.value))}
        disabled={disabled}
        className="w-full accent-retro-gold cursor-pointer"
      />

      {/* Lock in button */}
      <motion.button
        whileTap={!disabled ? { scale: 0.95 } : undefined}
        onClick={handleNext}
        disabled={disabled}
        className={cn(
          "w-full py-3 font-retro text-[10px] uppercase tracking-wider transition-all",
          "bg-retro-gold text-page shadow-[0_4px_0_#8a6d00]",
          "active:translate-y-[2px] active:shadow-[0_0_0_#8a6d00]",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        {currentIndex + 1 < items.length ? "LOCK IN & NEXT" : "LOCK IN & SUBMIT"}
      </motion.button>
    </div>
  );
}
