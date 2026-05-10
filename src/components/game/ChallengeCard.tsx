"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PixelAvatar } from "@/components/game/PixelAvatar";
import type { SubmissionType, MovementLevel, NoiseLevel } from "@/types/game";
import type { InteractiveData } from "@/types/challenge";

interface ChallengeCardProps {
  title: string;
  shortDescription: string;
  fullInstructions: string;
  submissionType: SubmissionType;
  durationSeconds: number;
  movementLevel: MovementLevel;
  noiseLevel: NoiseLevel;
  category: string;
  interactiveData?: InteractiveData | null;
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
  interactiveData,
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

        {/* Interactive display */}
        {interactiveData && (
          <InteractiveDisplay data={interactiveData} />
        )}

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

/* -------------------------------------------------------------------------- */
/*  InteractiveDisplay                                                        */
/* -------------------------------------------------------------------------- */

function InteractiveDisplay({ data }: { data: InteractiveData }) {
  switch (data.type) {
    case "describe_avatar":
      return (
        <div className="flex flex-col items-center gap-3 py-4 mb-4">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <div
              className="absolute inset-0 blur-xl opacity-40 bg-retro-purple rounded-full"
              style={{ transform: "scale(1.3)" }}
            />
            <PixelAvatar avatarIndex={data.avatarIndex} size="xl" />
          </motion.div>
          <p className="font-retro text-[10px] uppercase text-retro-purple-light tracking-wider text-center">
            {data.prompt}
          </p>
        </div>
      );

    case "emoji_prompt":
      return (
        <div className="flex flex-col items-center gap-3 py-4 mb-4">
          <div className="flex gap-3">
            {data.emojis.map((emoji, i) => (
              <motion.span
                key={i}
                className="text-4xl"
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              >
                {emoji}
              </motion.span>
            ))}
          </div>
          <p className="font-retro text-[10px] uppercase text-retro-gold tracking-wider text-center">
            {data.prompt}
          </p>
        </div>
      );

    case "this_or_that":
      return (
        <div className="flex flex-col items-center gap-2 py-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">&#x26A1;</span>
            <span className="font-retro text-sm text-retro-pink uppercase">
              {data.choices.length} RAPID-FIRE CHOICES
            </span>
            <span className="text-2xl">&#x26A1;</span>
          </div>
          <p className="font-body text-xs text-retro-muted text-center">
            Choose fast -- speed is scored!
          </p>
        </div>
      );

    case "drawing":
      return (
        <div className="flex flex-col items-center gap-3 py-4 mb-4">
          <span className="text-4xl">&#x1F3A8;</span>
          <p className="font-retro text-xs text-retro-blue uppercase tracking-wider text-center">
            {data.prompt}
          </p>
          <p className="font-body text-xs text-retro-muted text-center">
            Draw your answer on the canvas below!
          </p>
        </div>
      );

    case "tap_frenzy":
      return (
        <div className="flex flex-col items-center gap-3 py-4 mb-4">
          <motion.span
            className="text-5xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            &#x1F4A5;
          </motion.span>
          <p className="font-retro text-sm text-retro-pink uppercase tracking-wider text-center">
            TAP AS FAST AS YOU CAN!
          </p>
          <p className="font-body text-xs text-retro-muted text-center">
            {data.prompt}
          </p>
        </div>
      );

    case "reaction_time":
      return (
        <div className="flex flex-col items-center gap-3 py-4 mb-4">
          <motion.span
            className="text-5xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            &#x1F3AF;
          </motion.span>
          <p className="font-retro text-sm text-retro-green uppercase tracking-wider text-center">
            {data.rounds} REACTION ROUNDS
          </p>
          <p className="font-body text-xs text-retro-muted text-center">
            {data.prompt}
          </p>
        </div>
      );

    case "photo_selfie":
      return (
        <div className="flex flex-col items-center gap-3 py-4 mb-4">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <div
              className="absolute inset-0 blur-xl opacity-40 bg-retro-pink rounded-full"
              style={{ transform: "scale(1.3)" }}
            />
            <PixelAvatar avatarIndex={data.avatarIndex} size="xl" />
          </motion.div>
          <p className="font-retro text-[10px] uppercase text-retro-pink tracking-wider text-center">
            {data.prompt}
          </p>
          <p className="font-body text-xs text-retro-muted text-center">
            Take a selfie matching this face!
          </p>
        </div>
      );

    case "shake_meter":
      return (
        <div className="flex flex-col items-center gap-3 py-4 mb-4">
          <motion.span
            className="text-5xl"
            animate={{ x: [-4, 4, -4, 4, 0], rotate: [-5, 5, -5, 5, 0] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          >
            &#x1F4F1;
          </motion.span>
          <p className="font-retro text-sm text-retro-gold uppercase tracking-wider text-center">
            SHAKE YOUR PHONE!
          </p>
          <p className="font-body text-xs text-retro-muted text-center">
            {data.prompt}
          </p>
        </div>
      );

    case "memory_sequence":
      return (
        <div className="flex flex-col items-center gap-3 py-4 mb-4">
          <div className="flex gap-2">
            {["bg-retro-pink", "bg-retro-blue", "bg-retro-green", "bg-retro-gold"].map((c, i) => (
              <motion.div
                key={i}
                className={`w-6 h-6 rounded ${c}`}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>
          <p className="font-retro text-sm text-retro-purple-light uppercase tracking-wider text-center">
            MEMORY CHALLENGE
          </p>
          <p className="font-body text-xs text-retro-muted text-center">
            {data.prompt}
          </p>
        </div>
      );

    case "tilt_target":
      return (
        <div className="flex flex-col items-center gap-3 py-4 mb-4">
          <motion.span
            className="text-5xl"
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            &#x1F3AF;
          </motion.span>
          <p className="font-retro text-sm text-retro-blue uppercase tracking-wider text-center">
            {data.rounds} TARGETS TO HIT!
          </p>
          <p className="font-body text-xs text-retro-muted text-center">
            {data.prompt}
          </p>
        </div>
      );

    case "sound_effect":
      return (
        <div className="flex flex-col items-center gap-3 py-4 mb-4">
          <motion.span
            className="text-5xl"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            &#x1F3A4;
          </motion.span>
          <p className="font-retro text-sm text-retro-pink uppercase tracking-wider text-center">
            SOUND EFFECT TIME!
          </p>
          <p className="font-body text-xs text-retro-muted text-center">
            {data.prompt}
          </p>
        </div>
      );

    case "emoji_slider":
      return (
        <div className="flex flex-col items-center gap-3 py-4 mb-4">
          <div className="flex gap-2 text-3xl">
            <span>{data.items[0]?.leftEmoji}</span>
            <motion.span
              animate={{ x: [-8, 8, -8] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              &#x2194;
            </motion.span>
            <span>{data.items[0]?.rightEmoji}</span>
          </div>
          <p className="font-retro text-sm text-retro-gold uppercase tracking-wider text-center">
            {data.items.length} THINGS TO RATE!
          </p>
          <p className="font-body text-xs text-retro-muted text-center">
            {data.prompt}
          </p>
        </div>
      );

    case "group_photo":
      return (
        <div className="flex flex-col items-center gap-3 py-4 mb-4">
          <motion.span
            className="text-5xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {data.icon}
          </motion.span>
          <div className="flex items-center gap-2">
            <span className="font-retro text-[8px] px-2 py-0.5 bg-retro-green/20 text-retro-green border border-retro-green/40 uppercase">
              GROUP
            </span>
            <span className="font-retro text-[8px] px-2 py-0.5 bg-retro-pink/20 text-retro-pink border border-retro-pink/40 uppercase">
              PHOTO PROOF
            </span>
          </div>
          <p className="font-retro text-xs text-retro-green uppercase tracking-wider text-center">
            {data.prompt}
          </p>
        </div>
      );

    case "group_timer":
      return (
        <div className="flex flex-col items-center gap-3 py-4 mb-4">
          <motion.span
            className="text-5xl"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {data.icon}
          </motion.span>
          <div className="flex items-center gap-2">
            <span className="font-retro text-[8px] px-2 py-0.5 bg-retro-green/20 text-retro-green border border-retro-green/40 uppercase">
              GROUP
            </span>
            <span className="font-retro text-[8px] px-2 py-0.5 bg-retro-gold/20 text-retro-gold border border-retro-gold/40 uppercase">
              TIMED
            </span>
          </div>
          <p className="font-retro text-xs text-retro-gold uppercase tracking-wider text-center">
            {data.prompt}
          </p>
        </div>
      );

    default:
      return null;
  }
}
