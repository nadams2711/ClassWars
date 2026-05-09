"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SubmissionType, MovementLevel, NoiseLevel } from "@/types/game";

interface ChallengeCardProps {
  title: string;
  shortDescription: string;
  fullInstructions: string;
  submissionType: SubmissionType;
  durationSeconds: number;
  movementLevel: MovementLevel;
  noiseLevel: NoiseLevel;
  category: string;
  className?: string;
}

const SUBMISSION_ICONS: Record<SubmissionType, { icon: string; label: string }> = {
  completion_tap: { icon: "\u2714", label: "Tap to Complete" },
  text: { icon: "\u270E", label: "Text Answer" },
  vote: { icon: "\u2605", label: "Crowd Vote" },
  judge: { icon: "\u2696", label: "Judge Scored" },
  photo: { icon: "\u{1F4F7}", label: "Photo" },
  hybrid: { icon: "\u26A1", label: "Hybrid" },
};

const MOVEMENT_CONFIG: Record<MovementLevel, { icon: string; label: string; color: string }> = {
  seated: { icon: "\u{1F4BA}", label: "Seated", color: "text-retro-blue" },
  standing: { icon: "\u{1F9CD}", label: "Standing", color: "text-retro-gold" },
  light_movement: { icon: "\u{1F3C3}", label: "Moving", color: "text-retro-pink" },
};

const NOISE_CONFIG: Record<NoiseLevel, { bars: number; label: string; color: string }> = {
  quiet: { bars: 1, label: "Quiet", color: "bg-retro-green" },
  medium: { bars: 2, label: "Medium", color: "bg-retro-gold" },
  loud: { bars: 3, label: "Loud", color: "bg-retro-pink" },
};

function NoiseMeter({ level }: { level: NoiseLevel }) {
  const config = NOISE_CONFIG[level];
  return (
    <div className="flex items-end gap-0.5" title={config.label}>
      {[1, 2, 3].map((bar) => (
        <div
          key={bar}
          className={cn(
            "w-1.5 rounded-sm transition-colors",
            bar <= config.bars ? config.color : "bg-retro-muted/20"
          )}
          style={{ height: `${bar * 5 + 4}px` }}
        />
      ))}
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function ChallengeCard({
  title,
  shortDescription,
  fullInstructions,
  submissionType,
  durationSeconds,
  movementLevel,
  noiseLevel,
  category,
  className,
}: ChallengeCardProps) {
  const submission = SUBMISSION_ICONS[submissionType];
  const movement = MOVEMENT_CONFIG[movementLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "bg-card border border-retro-purple/30 overflow-hidden",
        className
      )}
    >
      {/* Header bar */}
      <div className="bg-elevated/80 px-4 py-3 border-b border-retro-purple/20">
        <div className="flex items-center justify-between gap-3">
          {/* Category badge */}
          <span className="font-retro text-[9px] uppercase tracking-wider text-retro-purple-light bg-retro-purple/20 px-2 py-1">
            {category}
          </span>

          {/* Duration badge */}
          <div className="flex items-center gap-1.5">
            <span className="font-retro text-[10px] text-retro-blue">
              {"\u23F1"} {formatDuration(durationSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Title with glow */}
        <h2
          className="font-retro text-base md:text-lg text-retro-text leading-relaxed mb-2"
          style={{
            textShadow:
              "0 0 8px rgba(168,85,247,0.4), 0 0 16px rgba(168,85,247,0.2)",
          }}
        >
          {title}
        </h2>

        {/* Short description */}
        <p className="font-body text-sm text-retro-muted mb-4 leading-relaxed">
          {shortDescription}
        </p>

        {/* Full instructions */}
        <div className="bg-page/60 border border-retro-purple/10 p-4 mb-4">
          <p className="font-retro text-[9px] uppercase text-retro-muted tracking-wider mb-2">
            Instructions
          </p>
          <p className="font-body text-sm text-retro-text/90 leading-relaxed whitespace-pre-line">
            {fullInstructions}
          </p>
        </div>

        {/* Bottom indicators */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Submission type */}
          <div className="flex items-center gap-2 bg-elevated/50 px-3 py-1.5 border border-retro-purple/10">
            <span className="text-sm">{submission.icon}</span>
            <span className="font-retro text-[9px] text-retro-muted uppercase">
              {submission.label}
            </span>
          </div>

          {/* Movement level */}
          <div className="flex items-center gap-2 bg-elevated/50 px-3 py-1.5 border border-retro-purple/10">
            <span className={cn("font-retro text-[9px] uppercase", movement.color)}>
              {movement.icon} {movement.label}
            </span>
          </div>

          {/* Noise level */}
          <div className="flex items-center gap-2 bg-elevated/50 px-3 py-1.5 border border-retro-purple/10">
            <NoiseMeter level={noiseLevel} />
            <span className="font-retro text-[9px] text-retro-muted uppercase">
              {NOISE_CONFIG[noiseLevel].label}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
