"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { RetroButton } from "@/components/ui/RetroButton";
import type { Participant } from "@/types/game";

const PLACE_LABELS = ["1ST", "2ND", "3RD"] as const;
const PLACE_COLORS = [
  { border: "border-retro-gold", text: "text-retro-gold", bg: "bg-retro-gold/20", glow: "shadow-[0_0_10px_rgba(255,215,0,0.4)]" },
  { border: "border-retro-blue", text: "text-retro-blue", bg: "bg-retro-blue/20", glow: "shadow-[0_0_10px_rgba(0,212,255,0.3)]" },
  { border: "border-retro-green", text: "text-retro-green", bg: "bg-retro-green/20", glow: "shadow-[0_0_10px_rgba(57,255,20,0.3)]" },
];

interface WinnerPickerProps {
  participants: { id: string; nickname: string }[];
  actionLoading?: string | null;
  minPicks?: number;
  onConfirm: (...picks: string[]) => void;
}

export function WinnerPicker({
  participants,
  actionLoading,
  minPicks: minPicksProp,
  onConfirm,
}: WinnerPickerProps) {
  const [picks, setPicks] = useState<string[]>([]);
  const maxPicks = Math.min(3, participants.length);
  const minPicks = Math.min(minPicksProp ?? 3, participants.length);

  const handleTap = (id: string) => {
    setPicks((prev) => {
      const idx = prev.indexOf(id);
      if (idx !== -1) return prev.slice(0, idx);
      if (prev.length >= maxPicks) return prev;
      return [...prev, id];
    });
  };

  const placeOf = (id: string) => picks.indexOf(id);

  return (
    <div className="space-y-4">
      <h3 className="font-retro text-xs text-retro-gold uppercase tracking-widest text-center">
        TAP TO ASSIGN PLACES
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {participants.map((p) => {
          const place = placeOf(p.id);
          const isSelected = place !== -1;
          const colors = isSelected ? PLACE_COLORS[place] : null;
          return (
            <button
              key={p.id}
              onClick={() => handleTap(p.id)}
              className={cn(
                "relative flex items-center gap-2 px-3 py-3 border-2 transition-all duration-150 cursor-pointer text-left",
                isSelected
                  ? `${colors!.border} ${colors!.bg} ${colors!.glow}`
                  : "border-retro-purple/20 bg-elevated hover:border-retro-purple/40"
              )}
            >
              {isSelected && (
                <span
                  className={cn(
                    "font-retro text-[10px] px-1.5 py-0.5 border",
                    colors!.border,
                    colors!.text
                  )}
                >
                  {PLACE_LABELS[place]}
                </span>
              )}
              <span
                className={cn(
                  "font-retro text-[10px] truncate",
                  isSelected ? colors!.text : "text-retro-text"
                )}
              >
                {p.nickname}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected summary */}
      {picks.length > 0 && (
        <div className="flex justify-center gap-4">
          {picks.map((id, i) => {
            const p = participants.find((x) => x.id === id);
            return (
              <div key={id} className="text-center">
                <span className={cn("font-retro text-[9px]", PLACE_COLORS[i].text)}>
                  {PLACE_LABELS[i]}
                </span>
                <p className="font-retro text-[10px] text-retro-text truncate max-w-[80px]">
                  {p?.nickname}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-center gap-3">
        <RetroButton
          variant="gold"
          size="lg"
          onClick={() => onConfirm(...picks)}
          disabled={picks.length < minPicks || actionLoading === "pick_winners"}
        >
          {actionLoading === "pick_winners" ? "CONFIRMING..." : "CONFIRM WINNERS"}
        </RetroButton>
        {picks.length > 0 && (
          <RetroButton
            variant="secondary"
            size="md"
            onClick={() => setPicks([])}
            disabled={!!actionLoading}
          >
            RESET
          </RetroButton>
        )}
      </div>
    </div>
  );
}
