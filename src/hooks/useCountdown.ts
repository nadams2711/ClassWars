"use client";
import { useState, useEffect, useCallback } from "react";

export function useCountdown(timerEnd: string | null) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    if (!timerEnd) { setSecondsLeft(0); return; }

    const update = () => {
      const remaining = Math.max(0, Math.floor((new Date(timerEnd).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };

    update();
    const interval = setInterval(update, 250); // Update 4x/sec for smooth display
    return () => clearInterval(interval);
  }, [timerEnd]);

  const formatted = `${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, "0")}`;
  const urgency = secondsLeft <= 5 ? "critical" : secondsLeft <= 15 ? "warning" : "normal";
  const isExpired = timerEnd ? secondsLeft === 0 : false;

  return { secondsLeft, formatted, urgency, isExpired };
}
