"use client";

import { cn } from "@/lib/utils";
import { forwardRef, InputHTMLAttributes, useId } from "react";

interface RetroInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const RetroInput = forwardRef<HTMLInputElement, RetroInputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="font-retro text-[10px] uppercase tracking-wider text-retro-muted"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full bg-page text-retro-text font-body text-sm",
            "px-4 py-3 outline-none",
            "border-2 border-retro-purple/40 rounded-none",
            "placeholder:text-retro-muted/50",
            "transition-all duration-200",
            "focus:border-retro-purple focus:shadow-[0_0_16px_rgba(168,85,247,0.25)]",
            error &&
              "border-retro-pink focus:border-retro-pink focus:shadow-[0_0_16px_rgba(255,45,120,0.25)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />

        {error && (
          <p className="font-retro text-[9px] text-retro-pink uppercase tracking-wider">
            {error}
          </p>
        )}
      </div>
    );
  }
);

RetroInput.displayName = "RetroInput";
