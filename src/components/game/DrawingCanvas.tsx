"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DrawingCanvasProps {
  onSubmit: (dataUrl: string) => void;
  disabled?: boolean;
}

export function DrawingCanvas({ onSubmit, disabled = false }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if ("touches" in e) {
        const touch = e.touches[0];
        if (!touch) return null;
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const startDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const pos = getPos(e);
      if (!ctx || !pos) return;
      setIsDrawing(true);
      setHasDrawn(true);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    },
    [disabled, getPos]
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || disabled) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const pos = getPos(e);
      if (!ctx || !pos) return;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111122";
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    },
    [isDrawing, disabled, getPos]
  );

  const endDraw = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, []);

  const handleSubmit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
    onSubmit(dataUrl);
  }, [onSubmit]);

  return (
    <div className="flex flex-col gap-3">
      <canvas
        ref={canvasRef}
        width={300}
        height={200}
        className={cn(
          "w-full border border-retro-purple/30 bg-white touch-none cursor-crosshair",
          disabled && "opacity-40 pointer-events-none"
        )}
        style={{ maxWidth: 300, aspectRatio: "3/2" }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleClear}
          disabled={disabled}
          className={cn(
            "font-retro text-[10px] uppercase tracking-wider px-4 py-2 transition-all",
            "border border-retro-muted/30 bg-elevated text-retro-muted",
            "hover:border-retro-muted/50",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          Clear
        </motion.button>
        <motion.button
          whileTap={!disabled && hasDrawn ? { scale: 0.95 } : undefined}
          onClick={handleSubmit}
          disabled={disabled || !hasDrawn}
          className={cn(
            "flex-1 font-retro text-[10px] uppercase tracking-wider px-6 py-2.5 transition-all duration-150",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            hasDrawn && !disabled
              ? "bg-retro-purple text-white shadow-[0_4px_0_#4c1d95] hover:bg-retro-purple-light active:translate-y-[2px] active:shadow-[0_0_0_#4c1d95]"
              : "bg-retro-muted/20 text-retro-muted"
          )}
        >
          Submit Drawing
        </motion.button>
      </div>
    </div>
  );
}
