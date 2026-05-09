import type { AudiencePack } from "@/types/challenge";

export function parseDuration(duration: string): number {
  if (duration.includes("30s")) return 30;
  if (duration.includes("1m")) return 60;
  if (duration.includes("2m")) return 120;
  if (duration.includes("3m")) return 180;
  return 60;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export const PACK_INFO: Record<string, { name: string; description: string; icon: string; color: string; audience: string }> = {
  classroom_funny: {
    name: "Laugh Lab",
    description: "High-energy classroom rounds with maximum spectator value",
    icon: "😂",
    color: "#FF2D78",
    audience: "classroom",
  },
  classroom_low_noise: {
    name: "Quiet Chaos",
    description: "Low-noise classroom challenges for tighter settings",
    icon: "🤫",
    color: "#00D4FF",
    audience: "classroom",
  },
  office_fun: {
    name: "Friday Fun",
    description: "Office social rounds that feel light and energizing",
    icon: "🎉",
    color: "#39FF14",
    audience: "office",
  },
  office_professional: {
    name: "Workshop Boost",
    description: "Office-friendly communication and facilitation challenges",
    icon: "💼",
    color: "#A855F7",
    audience: "office",
  },
  universal: {
    name: "Universal Hype Pack",
    description: "Mixed crowd-pleasers suitable for any environment",
    icon: "⚡",
    color: "#FFD700",
    audience: "universal",
  },
};
