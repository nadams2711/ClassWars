"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { useSound } from "@/hooks/useSound";

type Variant = "primary" | "secondary" | "danger" | "success" | "gold";
type Size = "sm" | "md" | "lg";

interface RetroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-retro-purple text-white hover:bg-retro-purple-light shadow-[0_4px_0_#4c1d95] hover:shadow-[0_4px_0_#6b21a8,0_0_20px_rgba(168,85,247,0.4)] active:shadow-[0_0px_0_#4c1d95]",
  secondary:
    "bg-elevated text-retro-blue border-2 border-retro-blue hover:bg-retro-blue/10 shadow-[0_4px_0_#0e7490] hover:shadow-[0_4px_0_#0e7490,0_0_20px_rgba(0,212,255,0.3)] active:shadow-[0_0px_0_#0e7490]",
  danger:
    "bg-retro-pink text-white shadow-[0_4px_0_#9f1239] hover:shadow-[0_4px_0_#9f1239,0_0_20px_rgba(255,45,120,0.4)] active:shadow-[0_0px_0_#9f1239]",
  success:
    "bg-emerald-600 text-white shadow-[0_4px_0_#065f46] hover:shadow-[0_4px_0_#065f46,0_0_20px_rgba(57,255,20,0.3)] active:shadow-[0_0px_0_#065f46]",
  gold: "bg-retro-gold text-page shadow-[0_4px_0_#b8860b] hover:shadow-[0_4px_0_#b8860b,0_0_20px_rgba(255,215,0,0.4)] active:shadow-[0_0px_0_#b8860b]",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[10px]",
  md: "px-6 py-3 text-xs",
  lg: "px-8 py-4 text-sm",
};

export const RetroButton = forwardRef<HTMLButtonElement, RetroButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth,
      className,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const { play } = useSound();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      play("menu_confirm");
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        className={cn(
          "font-retro uppercase tracking-wider transition-all duration-150",
          "active:translate-y-[2px]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0",
          "select-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);

RetroButton.displayName = "RetroButton";
