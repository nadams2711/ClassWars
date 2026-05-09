"use client";
import { useState, useCallback } from "react";

export function useScreenShake() {
  const [isShaking, setIsShaking] = useState(false);

  const shake = useCallback((duration = 500) => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), duration);
  }, []);

  return { isShaking, shake };
}
