"use client";
import { useState, useEffect, useRef } from "react";

export function useStopwatch(running: boolean) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef<number | null>(null);
  const frozenRef = useRef(0);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - frozenRef.current;
      const interval = setInterval(() => {
        setElapsedMs(Date.now() - startRef.current!);
      }, 250);
      return () => clearInterval(interval);
    } else {
      // Freeze the current value
      frozenRef.current = elapsedMs;
      startRef.current = null;
    }
  }, [running]);

  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const m = Math.floor(elapsedSeconds / 60);
  const s = elapsedSeconds % 60;
  const formatted = `${m}:${s.toString().padStart(2, "0")}`;

  return { elapsedMs, elapsedSeconds, formatted };
}
